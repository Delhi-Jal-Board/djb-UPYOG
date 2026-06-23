package com.example.gateway.filters.pre.helpers;

import com.example.gateway.config.ApplicationProperties;
import com.example.gateway.model.AuthorizationRequest;
import com.example.gateway.model.AuthorizationRequestWrapper;
import com.example.gateway.utils.CommonUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.model.CustomException;
import org.reactivestreams.Publisher;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.factory.rewrite.RewriteFunction;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.example.gateway.constants.GatewayConstants.*;

@Slf4j
@Component
public class RbacFilterHelper implements RewriteFunction<Map, Map> {

    private ObjectMapper objectMapper;

    private MultiStateInstanceUtil centralInstanceUtil;

    private CommonUtils commonUtils;

    private ApplicationProperties applicationProperties;

    private RestTemplate restTemplate;

    public RbacFilterHelper(ObjectMapper objectMapper, MultiStateInstanceUtil centralInstanceUtil, CommonUtils commonUtils, ApplicationProperties applicationProperties, RestTemplate restTemplate) {
        this.objectMapper = objectMapper;
        this.centralInstanceUtil = centralInstanceUtil;
        this.commonUtils = commonUtils;
        this.applicationProperties = applicationProperties;
        this.restTemplate = restTemplate;
    }

    @Override
    public Publisher<Map> apply(ServerWebExchange serverWebExchange, Map map) {
        log.info("RBAC helper invoked for URI: {}", serverWebExchange.getRequest().getURI().getPath());
        log.debug("Incoming request body keys: {}", map != null ? map.keySet() : "NULL BODY");

        isIncomingURIInAuthorizedActionList(serverWebExchange,map);
        if (CommonUtils.isRequestBodyCompatible(serverWebExchange.getRequest()) && map == null) {
            throw new CustomException("INVALID_REQUEST", "Request body is missing");
        }
        return Mono.justOrEmpty(map);
    }

    private void isIncomingURIInAuthorizedActionList(ServerWebExchange exchange, Map map) {

        String requestUri = exchange.getRequest().getURI().getPath();
        log.debug("Full request map: {}", map);

        User user;
        if (CommonUtils.isRequestBodyCompatible(exchange.getRequest())) {
            if (map == null || map.get(REQUEST_INFO_FIELD_NAME_PASCAL_CASE) == null) {
                throw new CustomException("INVALID_REQUEST","RequestInfo is missing");
            }
            RequestInfo requestInfo = objectMapper.convertValue(map.get(REQUEST_INFO_FIELD_NAME_PASCAL_CASE), RequestInfo.class);
            user = requestInfo.getUserInfo();
        }else {
            user = exchange.getAttribute(USER_INFO_KEY);
        }

        log.info("Parsed RequestInfo successfully");

        log.info("RBAC parsed user: id={}, userName={}, tenantId={}, type={}",
                user != null ? user.getId() : null,
                user != null ? user.getUserName() : null,
                user != null ? user.getTenantId() : null,
                user != null ? user.getType() : null);

        log.info("RBAC parsed user roles: {}",
                user != null && user.getRoles() != null
                        ? user.getRoles().stream().map(r -> r.getCode()).toList()
                        : null);

        if (user == null) {
            throw new RuntimeException("User information not found. Can't execute RBAC filter");
        }

        Set<String> tenantIds;

        log.info("method commonUtils.validateRequestAndSetRequestTenantId");
        try {
            tenantIds = commonUtils.validateRequestAndSetRequestTenantId(exchange,map);
            log.info("after method commonUtils.validateRequestAndSetRequestTenantId");
        } catch (Exception e) {
            log.error("Exception in validateRequestAndSetRequestTenantId for uri={}, body={}",
                    requestUri, map, e);
            throw e;
        }

        log.info("RBAC resolved tenantIds: {}", tenantIds);

        /*
         * Adding tenantId to header for tracer logging with correlation-id
         */
        if (centralInstanceUtil.getIsEnvironmentCentralInstance() && StringUtils.isEmpty(exchange.getAttributes().get(TENANTID_MDC))) {
            String singleTenantId = commonUtils.getLowLevelTenantIdFromSet(tenantIds);
            MDC.put(TENANTID_MDC, singleTenantId);
            exchange.getAttributes().put(TENANTID_MDC, singleTenantId);
        }

        exchange.getAttributes().put(CURRENT_REQUEST_TENANTID, String.join(",", tenantIds));

        AuthorizationRequest request = AuthorizationRequest.builder()
                .roles(new HashSet<>(user.getRoles()))
                .uri(requestUri)
                .tenantIds(tenantIds)
                .build();

        log.info("RBAC authorization request: uri={}, tenantIds={}, roles={}",
                requestUri,
                tenantIds,
                user.getRoles() != null ? user.getRoles().stream().map(r -> r.getCode()).toList() : null);

        boolean isUriAuthorised = isUriAuthorized(request , exchange);
        log.info("isUriAuthorised after authorization: {}", isUriAuthorised);

        if(!isUriAuthorised) {
            throw new CustomException(HttpStatus.UNAUTHORIZED.toString(), "You are not authorized to access this resource");
        }

    }

    private boolean isUriAuthorized(AuthorizationRequest authorizationRequest , ServerWebExchange exchange) {

        log.info("In isUriAuthorized: {}", authorizationRequest);
        AuthorizationRequestWrapper authorizationRequestWrapper = new AuthorizationRequestWrapper(new RequestInfo(), authorizationRequest);

        final HttpHeaders headers = new HttpHeaders();

        headers.add(CORRELATION_ID_HEADER_NAME, (String) exchange.getAttributes().get(CORRELATION_ID_KEY));

        if (centralInstanceUtil.getIsEnvironmentCentralInstance())
            headers.add(REQUEST_TENANT_ID_KEY, (String) exchange.getAttributes().get(TENANTID_MDC));

        final HttpEntity<Object> httpEntity = new HttpEntity<>(authorizationRequestWrapper, headers);

        try {

            ResponseEntity<Void> responseEntity = restTemplate.postForEntity(applicationProperties.getAuthorizationUrl(), httpEntity, Void
                    .class);

            log.info("Authorization response status: {}", responseEntity.getStatusCode());
            log.info("In isUriAuthorized returned : {}", authorizationRequest);
            return responseEntity.getStatusCode().equals(HttpStatus.OK);
        } catch (HttpClientErrorException e) {
            log.warn("Exception while attempting to authorize via access control", e);
            return false;
        } catch (Exception e) {
            log.error("Unknown exception occurred while attempting to authorize via access control", e);
            return false;
        }

    }
}
