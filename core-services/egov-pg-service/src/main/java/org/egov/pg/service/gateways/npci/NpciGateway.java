package org.egov.pg.service.gateways.npci;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.pg.constants.PgConstants;
import org.egov.pg.models.Transaction;
import org.egov.pg.service.Gateway;
import org.egov.pg.utils.Utils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.security.MessageDigest;
import java.util.*;

@Component
@Slf4j
public class NpciGateway implements Gateway {

    public static final Map<String, String> MOCK_STATUSES = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String GATEWAY_NAME = "NPCI";

    private final boolean ACTIVE;
    private final boolean SANDBOX;
    private final String MERCHANT_ID;
    private final String MERCHANT_SECRET_KEY;
    private final String REDIRECT_URL;
    private final String GATEWAY_URL;
    private final String GATEWAY_STATUS_URL;
    private final String CITIZEN_URL;
    private final String CURRENCY;
    private final String ORIGINAL_RETURN_URL_KEY;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public NpciGateway(RestTemplate restTemplate, Environment environment, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;

        ACTIVE           = Boolean.parseBoolean(environment.getProperty("npci.active", "false"));
        SANDBOX          = Boolean.parseBoolean(environment.getProperty("npci.sandbox", "false"));
        MERCHANT_ID      = environment.getProperty("npci.merchant.id", "");
        MERCHANT_SECRET_KEY = environment.getProperty("npci.merchant.secret.key", "");
        REDIRECT_URL     = environment.getProperty("npci.redirect.url", "");
        GATEWAY_URL      = environment.getProperty("npci.gateway.url", "");
        GATEWAY_STATUS_URL = environment.getProperty("npci.gateway.status.url", "");
        CITIZEN_URL      = environment.getProperty("egov.default.citizen.url", "");
        CURRENCY         = environment.getProperty("npci.currency", "INR");
        ORIGINAL_RETURN_URL_KEY = environment.getProperty("npci.original.return.url.key", "originalreturnurl");
    }

    /**
     * Extracts the Authorization or auth-token header from the incoming request context.
     * This is required to append the auth-token to the redirect URL so that the citizen
     * does not lose their session when redirected to the gateway/sandbox.
     */
    private String extractAuthToken() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                // Check for 'Authorization' header first (e.g. "Bearer eyJhbG...")
                String authToken = attributes.getRequest().getHeader("Authorization");
                if (authToken != null && authToken.toLowerCase().startsWith("bearer ")) {
                    authToken = authToken.substring(7).trim();
                }
                // Fallback to checking 'auth-token' header if Authorization is absent
                if (authToken == null || authToken.trim().isEmpty()) {
                    authToken = attributes.getRequest().getHeader("auth-token");
                }
                return authToken != null ? authToken : "";
            }
        } catch (Exception e) {
            log.error("NpciGateway: Failed to extract auth-token from request headers", e);
        }
        return "";
    }

    @Override
    public URI generateRedirectURI(Transaction transaction) {
        log.info("NpciGateway: Generating redirect URI for txnId={}", transaction.getTxnId());

        // Fetch the auth token from the incoming _create request
        String authToken = extractAuthToken();

        if (SANDBOX) {
            log.info("NpciGateway: Sandbox mode enabled, redirecting to mock payment page");
            String basePgServiceUrl = "";
            try {
                URI uri = URI.create(REDIRECT_URL);
                basePgServiceUrl = uri.getScheme() + "://" + uri.getAuthority();
            } catch (Exception e) {
                basePgServiceUrl = "http://localhost:8080";
            }
            try {
                // Build the base sandbox redirect URL
                String redirectUrl = basePgServiceUrl + "/pg-service/transaction/v1/_redirect"
                        + "?txnId=" + transaction.getTxnId()
                        + "&amount=" + transaction.getTxnAmount()
                        + "&callbackUrl=" + java.net.URLEncoder.encode(transaction.getCallbackUrl(), "UTF-8");

                // Append the auth-token to the URL if it exists
                if (!authToken.isEmpty()) {
                    redirectUrl += "&auth-token=" + authToken;
                }
                return URI.create(redirectUrl);

            } catch (Exception e) {
                log.error("NpciGateway: Failed to encode redirect callback URL", e);
                String callbackUrl = transaction.getCallbackUrl();
                String separator = callbackUrl.contains("?") ? "&" : "?";
                String fallbackUrl = callbackUrl + separator + "eg_pg_txnid=" + transaction.getTxnId();

                // Append the auth-token to the fallback URL if it exists
                if (!authToken.isEmpty()) {
                    fallbackUrl += "&auth-token=" + authToken;
                }
                return URI.create(fallbackUrl);
            }
        }

        String returnUrl = getReturnUrl(transaction.getCallbackUrl(), REDIRECT_URL, authToken);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("merchantId",     MERCHANT_ID);
        params.put("orderId",        transaction.getTxnId());
        params.put("amount",         transaction.getTxnAmount());
        params.put("currency",       CURRENCY);
        params.put("customerId",     transaction.getUser() != null ? transaction.getUser().getUuid() : "");
        params.put("mobileNumber",   transaction.getUser() != null ? transaction.getUser().getMobileNumber() : "");
        params.put("returnUrl",      returnUrl);
        params.put("consumerCode",   transaction.getConsumerCode());
        params.put("module",         transaction.getModule());
        params.put("txnDateTime",    String.valueOf(System.currentTimeMillis()));

        String checksum = generateChecksum(params, MERCHANT_SECRET_KEY);
        params.put("checksum", checksum);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(GATEWAY_URL);
        params.forEach(builder::queryParam);

        return builder.build().toUri();
    }

    @Override
    public String generateRedirectFormData(Transaction transaction) {
        log.info("NpciGateway: Generating form data for txnId={}", transaction.getTxnId());

        String authToken = extractAuthToken();

        Map<String, String> params = new LinkedHashMap<>();
        params.put("merchantId",   MERCHANT_ID);
        params.put("orderId",      transaction.getTxnId());
        params.put("amount",       transaction.getTxnAmount());
        params.put("currency",     CURRENCY);
        params.put("customerId",   transaction.getUser() != null ? transaction.getUser().getUuid() : "");
        params.put("mobileNumber", transaction.getUser() != null ? transaction.getUser().getMobileNumber() : "");
        params.put("returnUrl",    getReturnUrl(transaction.getCallbackUrl(), REDIRECT_URL, authToken));
        params.put("consumerCode", transaction.getConsumerCode());
        params.put("txnDateTime",  String.valueOf(System.currentTimeMillis()));
        params.put("checksum",     generateChecksum(params, MERCHANT_SECRET_KEY));
        params.put("txURL",        GATEWAY_URL);

        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            throw new CustomException("NPCI_URL_GEN_FAILED", "NPCI URL generation failed");
        }
    }

    @Override
    public Transaction fetchStatus(Transaction currentStatus, Map<String, String> params) {
        log.info("NpciGateway: Fetching status for txnId={}", currentStatus.getTxnId());

        if (SANDBOX) {
            String mockStatus = MOCK_STATUSES.remove(currentStatus.getTxnId());
            if (mockStatus == null) mockStatus = "SUCCESS";

            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("status", mockStatus);
            mockResponse.put("txnId", "NPCI_MOCK_" + UUID.randomUUID().toString());
            mockResponse.put("amount", currentStatus.getTxnAmount());
            mockResponse.put("paymentMode", "UPI");
            mockResponse.put("bankTxnId", "NPCI_BANK_" + System.currentTimeMillis());
            return transformStatusResponse(mockResponse, currentStatus);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("merchantId", MERCHANT_ID);
            headers.set("Authorization", "Bearer " + generateChecksum(
                    Collections.singletonMap("orderId", currentStatus.getTxnId()), MERCHANT_SECRET_KEY));

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("merchantId", MERCHANT_ID);
            requestBody.put("orderId", currentStatus.getTxnId());
            requestBody.put("checksum", generateChecksum(requestBody, MERCHANT_SECRET_KEY));

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(GATEWAY_STATUS_URL, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return transformStatusResponse(response.getBody(), currentStatus);
            } else {
                throw new CustomException("NPCI_STATUS_FETCH_FAILED", "Unable to fetch transaction status");
            }
        } catch (Exception e) {
            throw new CustomException("NPCI_STATUS_FETCH_FAILED", "Unable to fetch transaction status: " + e.getMessage());
        }
    }

    private Transaction transformStatusResponse(Map<String, Object> response, Transaction currentStatus) {
        String status     = String.valueOf(response.getOrDefault("status", "FAILURE"));
        String npciTxnId  = String.valueOf(response.getOrDefault("txnId", ""));
        String amount     = String.valueOf(response.getOrDefault("amount", currentStatus.getTxnAmount()));
        String payMode    = String.valueOf(response.getOrDefault("paymentMode", "UPI"));
        String errCode    = String.valueOf(response.getOrDefault("errorCode", ""));
        String errMsg     = String.valueOf(response.getOrDefault("errorMessage", ""));
        String bankTxnId  = String.valueOf(response.getOrDefault("bankTxnId", ""));

        if ("SUCCESS".equalsIgnoreCase(status)) {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnAmount(Utils.formatAmtAsRupee(amount))
                    .txnStatus(Transaction.TxnStatusEnum.SUCCESS)
                    .txnStatusMsg(PgConstants.TXN_SUCCESS)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .bankTransactionNo(bankTxnId)
                    .gatewayStatusCode("00")
                    .gatewayStatusMsg("Transaction Successful")
                    .responseJson(response.toString())
                    .build();

        } else if ("PENDING".equalsIgnoreCase(status)) {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnStatus(Transaction.TxnStatusEnum.PENDING)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .gatewayStatusCode(errCode)
                    .gatewayStatusMsg("Transaction Pending")
                    .responseJson(response.toString())
                    .build();

        } else {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnAmount(Utils.formatAmtAsRupee(currentStatus.getTxnAmount()))
                    .txnStatus(Transaction.TxnStatusEnum.FAILURE)
                    .txnStatusMsg(PgConstants.TXN_FAILURE_GATEWAY)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .bankTransactionNo(bankTxnId)
                    .gatewayStatusCode(errCode)
                    .gatewayStatusMsg(errMsg)
                    .responseJson(response.toString())
                    .build();
        }
    }

    @Override
    public boolean isActive() { return ACTIVE; }

    @Override
    public String gatewayName() { return GATEWAY_NAME; }

    @Override
    public String transactionIdKeyInResponse() { return "orderId"; }

    private String getReturnUrl(String callbackUrl, String baseRedirectUrl, String authToken) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseRedirectUrl)
                .queryParam(ORIGINAL_RETURN_URL_KEY, callbackUrl);
        if (authToken != null && !authToken.isEmpty()) {
            builder.queryParam("auth-token", authToken);
        }
        return builder.build().toUriString();
    }

    private String generateChecksum(Map<String, String> params, String secretKey) {
        try {
            StringBuilder sb = new StringBuilder();
            params.forEach((k, v) -> sb.append(v).append("|"));
            sb.append(secretKey);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(sb.toString().getBytes("UTF-8"));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new CustomException("NPCI_CHECKSUM_FAILED", "Failed to generate NPCI checksum");
        }
    }
}