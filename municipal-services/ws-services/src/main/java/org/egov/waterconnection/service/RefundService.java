package org.egov.waterconnection.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.repository.ServiceRequestRepository;
import org.egov.waterconnection.web.models.WaterConnection;
import org.egov.waterconnection.web.models.WaterConnectionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class RefundService {

    @Autowired
    private WSConfiguration config;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    /**
     * Initiates a refund by calling the pg-service refund endpoint.
     * 
     * @param request The water connection request
     */
    public void initiateRefund(WaterConnectionRequest request) {
        WaterConnection connection = request.getWaterConnection();
        RequestInfo requestInfo = request.getRequestInfo();

        log.info("Initiating refund for application No: {}, tenantId: {}", connection.getApplicationNo(), connection.getTenantId());

        StringBuilder uri = new StringBuilder();
        uri.append(config.getPgServiceHost()).append(config.getPgServiceRefundEndpoint());

        Map<String, Object> refundRequest = new HashMap<>();
        refundRequest.put("RequestInfo", requestInfo);

        Map<String, Object> refundDetails = new HashMap<>();
        refundDetails.put("tenantId", connection.getTenantId());
        refundDetails.put("consumerCode", connection.getApplicationNo());
        refundDetails.put("module", "WS");

        refundRequest.put("RefundRequest", refundDetails);

        try {
            Object response = serviceRequestRepository.fetchResult(uri, refundRequest);
            log.info("Refund initiated successfully for application {}. Response: {}", connection.getApplicationNo(), response);

            // Cancel the receipt in collection-services
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String jsonResponse = mapper.writeValueAsString(response);
                java.util.List<String> receipts = com.jayway.jsonpath.JsonPath.read(jsonResponse, "$.Transaction[*].receipt");
                
                if (receipts != null && !receipts.isEmpty() && receipts.get(0) != null) {
                    String receiptNumber = receipts.get(0);
                    log.info("Found receipt {} for application {}. Initiating cancellation...", receiptNumber, connection.getApplicationNo());
                    cancelReceipt(receiptNumber, connection.getTenantId(), requestInfo);
                }
            } catch (Exception e) {
                log.error("Failed to extract receipt or cancel it for application " + connection.getApplicationNo(), e);
            }

        } catch (Exception e) {
            log.error("Error occurred while initiating refund for application " + connection.getApplicationNo(), e);
        }
    }

    private void cancelReceipt(String receiptNumber, String tenantId, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getCollectionHost()).append(config.getCollectionPaymentWorkflowPath());

        Map<String, Object> workflowRequest = new HashMap<>();
        workflowRequest.put("RequestInfo", requestInfo);

        Map<String, Object> paymentWorkflow = new HashMap<>();
        paymentWorkflow.put("paymentId", receiptNumber);
        paymentWorkflow.put("action", "CANCEL");
        paymentWorkflow.put("reason", "Application Rejected");
        paymentWorkflow.put("tenantId", tenantId);

        workflowRequest.put("PaymentWorkflows", java.util.Collections.singletonList(paymentWorkflow));

        try {
            Object response = serviceRequestRepository.fetchResult(uri, workflowRequest);
            log.info("Receipt {} cancelled successfully. Response: {}", receiptNumber, response);
        } catch (Exception e) {
            log.error("Error occurred while cancelling receipt {}", receiptNumber, e);
        }
    }
}
