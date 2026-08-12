package org.egov.waterconnection.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.repository.WaterDao;
import org.egov.waterconnection.web.models.SearchCriteria;
import org.egov.waterconnection.web.models.WaterConnection;
import org.egov.waterconnection.web.models.WaterConnectionRequest;
import org.egov.waterconnection.workflow.WorkflowIntegrator;
import org.egov.waterconnection.workflow.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.egov.waterconnection.web.models.workflow.ProcessInstance;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class WSSlaBreachService {

   @Autowired
   private WSConfiguration config;

   @Autowired
   private WaterDao waterDao;

   @Autowired
   private WaterServiceImpl waterService;

   @Autowired
   private RefundService refundService;

   // SLA of 3 days in milliseconds (3 * 24 * 60 * 60 * 1000)
   private static final long SLA_IN_MS = 259200000L;

   public void processSlaBreachedApplications() {
       log.info("Starting processing of SLA breached applications...");

       // Construct System RequestInfo
       RequestInfo requestInfo = createSystemRequestInfo();

       // 1. Fetch applications older than SLA that are not activated or rejected
       SearchCriteria criteria = new SearchCriteria();
       criteria.setTenantId(config.getStateLevelTenantId());

       // Setting toDate fetches applications created BEFORE this timestamp
       criteria.setToDate(System.currentTimeMillis() - SLA_IN_MS);

       // Fetch only applications in intermediate states
       Set<String> intermediateStatuses = new HashSet<>(Arrays.asList(
               "PENDING_FOR_DOCUMENT_VERIFICATION",
               "PENDING_FOR_DUE_VERIFICATION",
               "PENDING_FOR_BILLING_CLERK_REVIEW",
               "PENDING_FOR_FIELD_INSPECTION",
               "PENDING_FOR_AE_APPROVAL",
               "PENDING_FOR_ASO_APPROVAL",
               "PENDING_FOR_ZRO_APPROVAL",
               "PENDING_APPROVAL_FOR_CONNECTION",
               "PENDING_FOR_ADDITIONAL_PAYMENT",
               "PENDING_FOR_CONNECTION_ACTIVATION"
       ));
       criteria.setApplicationStatus(intermediateStatuses);
       criteria.setIsInternalCall(true);

       List<WaterConnection> breachedConnections = waterDao.getWaterConnectionList(criteria, requestInfo);

       if (CollectionUtils.isEmpty(breachedConnections)) {
           log.info("No SLA breached applications found.");
           return;
       }

       log.info("Found {} SLA breached applications. Processing cancellation and refund...", breachedConnections.size());

       for (WaterConnection connection : breachedConnections) {
           try {
               cancelAndRefund(connection, requestInfo);
           } catch (Exception e) {
               log.error("Failed to cancel and refund application: " + connection.getApplicationNo(), e);
           }
       }
   }

   private void cancelAndRefund(WaterConnection connection, RequestInfo requestInfo) {
       log.info("Canceling application due to SLA breach: {}", connection.getApplicationNo());

       // Update Workflow action to REJECT
       ProcessInstance processInstance = new ProcessInstance();
       processInstance.setAction("REJECT");
       processInstance.setComment("System Auto-Cancellation due to SLA breach.");
       processInstance.setModuleName("ws-services");
       processInstance.setBusinessId(connection.getApplicationNo());
       processInstance.setBusinessService(config.getBusinessServiceValue());

       connection.setProcessInstance(processInstance);

       WaterConnectionRequest request = WaterConnectionRequest.builder()
               .requestInfo(requestInfo)
               .waterConnection(connection)
               .build();

       // Use standard update method to update connection and trigger workflow
       waterService.updateWaterConnection(request);

       // Note: Refund is now automatically handled inside waterService.updateWaterConnection
       // when the application state becomes REJECTED.
   }

   private RequestInfo createSystemRequestInfo() {
       User userInfo = User.builder()
               .uuid(config.getEgovInternalMicroserviceUserUuid())
               .type("SYSTEM")
               .roles(Arrays.asList(Role.builder().code("SYSTEM").build()))
               .build();

       return RequestInfo.builder()
               .userInfo(userInfo)
               .build();
   }
}
