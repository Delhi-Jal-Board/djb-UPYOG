package org.egov.access.persistence.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.access.domain.model.Action;
import org.egov.access.domain.model.ActionContainer;
import org.egov.access.domain.model.RoleAction;
import org.egov.access.util.Utils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.MasterDetail;
import org.egov.mdms.model.MdmsCriteria;
import org.egov.mdms.model.MdmsCriteriaReq;
import org.egov.mdms.model.ModuleDetail;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.isNull;

@Repository
@Slf4j
public class MdmsRepository {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${egov.mdms.host}${egov.mdms.path}")
    private String url;

    @Value("${mdms.roleactionmodule.name}")
    private String roleActionModule;

//    @Value("${mdms.actionsmodule.name}")
//    private String actionModule;

    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${mdms.actionstestmodule.name}")
    private String actionModule;

    @Value("${mdms.roleactionmaster.names}")
    private String roleActionMaster;

//    @Value("${mdms.actionmaster.names}")
//    private String actionMaster;

    @Value("${mdms.actiontestmaster.names}")
    private String actionMaster;

    @Value("${action.master.mdms.filter}")
    private String actionFilter;


    /**
     * Returns a map of role to URIs authorized
     *  - Ex, CITIZEN -> [/foo/bar, /foo/{}/bar]
     *  - Regular URIs will be part of regular uris
     *  - Regex patterns such as path params are handled and will be part of regex uris]
     *
     *  This method is cacheable and will only run the method when the cache expiration has reached
     *   part of config
     *
     *
     * @param tenantId tenant for which role actions need to be retrieved
     * @return Map of roles to URIs authorized
     */
    @Cacheable(value = "roleActions", sync = true)
    public Map<String, ActionContainer> fetchRoleActionData(String tenantId) {
        Map<String, ActionContainer> finalMap = new HashMap<>();
        try {
            List<ModuleDetail> moduleDetail = new ArrayList<ModuleDetail>();
            RequestInfo requestInfo = new RequestInfo();

            MasterDetail actionsMasterDetail =
                    MasterDetail.builder().name(actionMaster).filter(actionFilter).build();
            moduleDetail.add(ModuleDetail.builder().moduleName(actionModule).masterDetails(Collections.singletonList(
                    actionsMasterDetail)).build());

            MasterDetail roleActionsMasterDetail = MasterDetail.builder().name(roleActionMaster).build();
            moduleDetail.add(ModuleDetail.builder().moduleName(roleActionModule).masterDetails(Collections.singletonList(
                    roleActionsMasterDetail)).build());

            MdmsCriteria mc = new MdmsCriteria();
            mc.setTenantId(tenantId);
            mc.setModuleDetails(moduleDetail);

            MdmsCriteriaReq mcq = new MdmsCriteriaReq();
            mcq.setRequestInfo(requestInfo);
            mcq.setMdmsCriteria(mc);

            @SuppressWarnings("unchecked")
            Map<String, Map<String, List>> response = (Map<String, Map<String, List>>) restTemplate.postForObject(url, mcq, Map.class).get("MdmsRes");

            if (!isNull(response) && !isNull(response.get(roleActionModule)) && !isNull(response.get(roleActionModule).get(roleActionMaster))
                    && !isNull(response.get(actionModule)) && !isNull(response.get(actionModule).get(actionMaster))) {

                // Transform V1 response and merge into final map
                Map<String, ActionContainer> v1Map = transformMdmsResponse(response);
                mergeActionContainers(finalMap, v1Map);
                log.info("Successfully loaded Role-Action mappings from MDMS V1");
            }
        } catch (Exception e) {
            log.error("Failed to fetch or parse role action data from mdms v1", e);
        }

        try {
            String v2Url = mdmsHost + "/mdms-v2/v2/_search";

            // A. Fetch Actions from mdms-v2
            Map<String, Object> actionRequest = new HashMap<>();
            actionRequest.put("RequestInfo", new RequestInfo());
            Map<String, Object> actionCriteria = new HashMap<>();
            actionCriteria.put("tenantId", tenantId);
            actionCriteria.put("schemaCode", "ACCESSCONTROL-ACTIONS-TEST.actions-test");
            actionCriteria.put("isActive", true);
            actionRequest.put("MdmsCriteria", actionCriteria);

            Map<String, Object> actionResponse = restTemplate.postForObject(v2Url, actionRequest, Map.class);
            List<Map<String, Object>> mdmsActions = (List<Map<String, Object>>) actionResponse.get("mdms");

            Map<Long, String> actionIdToUrlMap = new HashMap<>();
            if (mdmsActions != null) {
                for (Map<String, Object> mdmsAction : mdmsActions) {
                    Map<String, Object> data = (Map<String, Object>) mdmsAction.get("data");
                    if (data != null && data.get("id") != null && data.get("url") != null) {
                        actionIdToUrlMap.put(((Number) data.get("id")).longValue(), (String) data.get("url"));
                    }
                }
            }

            Map<String, Object> roleActionRequest = new HashMap<>();
            roleActionRequest.put("RequestInfo", new RequestInfo());
            Map<String, Object> roleActionCriteria = new HashMap<>();
            roleActionCriteria.put("tenantId", tenantId);
            roleActionCriteria.put("schemaCode", "ACCESSCONTROL-ROLEACTIONS.roleactions");
            roleActionCriteria.put("isActive", true);
            roleActionRequest.put("MdmsCriteria", roleActionCriteria);

            Map<String, Object> roleActionResponse = restTemplate.postForObject(v2Url, roleActionRequest, Map.class);
            List<Map<String, Object>> mdmsRoleActions = (List<Map<String, Object>>) roleActionResponse.get("mdms");

            // C. Map URLs to Roles and merge into final map
            if (mdmsRoleActions != null) {
                for (Map<String, Object> mdmsRoleAction : mdmsRoleActions) {
                    Map<String, Object> data = (Map<String, Object>) mdmsRoleAction.get("data");
                    if (data != null && data.get("rolecode") != null && data.get("actionid") != null) {
                        String roleCode = (String) data.get("rolecode");
                        Long actionId = ((Number) data.get("actionid")).longValue();

                        if (actionIdToUrlMap.containsKey(actionId)) {
                            String actionUrl = actionIdToUrlMap.get(actionId);
                            ActionContainer container = finalMap.getOrDefault(roleCode, new ActionContainer());

                            if (Utils.isRegexUri(actionUrl)) {
                                container.getRegexUris().add(actionUrl);
                            } else {
                                container.getUris().add(actionUrl);
                            }

                            finalMap.put(roleCode, container);
                        }
                    }
                }
                log.info("Successfully loaded Role-Action mappings from MDMS V2");
            }
        } catch (Exception e) {
            log.error("Failed to fetch or parse role action data from mdms v2", e);
        }

        // 3. Check if we have any data at all
        if (finalMap.isEmpty()) {
            throw new CustomException("DATA_NOT_AVAILABLE", "Data not available for this tenant in both V1 and V2");
        }

        return finalMap;
    }

    /**
     * Utility method to merge the results from v1 and v2 into a single Map
     */
    private void mergeActionContainers(Map<String, ActionContainer> target, Map<String, ActionContainer> source) {
        for (Map.Entry<String, ActionContainer> entry : source.entrySet()) {
            String roleCode = entry.getKey();
            ActionContainer srcContainer = entry.getValue();
            ActionContainer targetContainer = target.getOrDefault(roleCode, new ActionContainer());

            targetContainer.getUris().addAll(srcContainer.getUris());
            targetContainer.getRegexUris().addAll(srcContainer.getRegexUris());

            target.put(roleCode, targetContainer);
        }
    }

    private Map<String, ActionContainer> transformMdmsResponse(Map<String, Map<String, List>> rawResponse){
        RoleAction[] roleActions = objectMapper.convertValue(rawResponse.get(roleActionModule).get(
                roleActionMaster), RoleAction[].class);
        Action[] actions = objectMapper.convertValue(rawResponse.get(actionModule).get(
                actionMaster), Action[].class);


        Map<Long,List<Action>> actionMap =
                Arrays.stream(actions).collect(Collectors.groupingBy(Action::getId) );

        Map<String, ActionContainer> finalMap = new HashMap<>();

        for(RoleAction roleAction : roleActions){
            if(actionMap.containsKey(roleAction.getActionId())){
                if(finalMap.containsKey(roleAction.getRoleCode())){
                    ActionContainer container = finalMap.get(roleAction.getRoleCode());
                    String actionUrl = actionMap.get(roleAction.getActionId()).get(0).getUrl();
                    if(Utils.isRegexUri(actionUrl))
                        container.getRegexUris().add(actionUrl);
                    else
                        container.getUris().add(actionUrl);
                } else{
                    ActionContainer container = new ActionContainer();
                    String actionUrl = actionMap.get(roleAction.getActionId()).get(0).getUrl();
                    if(Utils.isRegexUri(actionUrl))
                        container.getRegexUris().add(actionUrl);
                    else
                        container.getUris().add(actionUrl);

                    finalMap.put(roleAction.getRoleCode(), container);

                }
            }
        }

        return finalMap;
    }


}