package org.egov.waterconnection.service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.constants.WCConstants;
import org.egov.waterconnection.repository.WaterDao;
import org.egov.waterconnection.web.models.*;
import org.egov.waterconnection.repository.ServiceRequestRepository;
import org.egov.waterconnection.util.WaterServicesUtil;
import org.egov.waterconnection.web.models.collection.Bill;
import org.egov.waterconnection.web.models.collection.BillResponse;
import org.egov.waterconnection.web.models.collection.Payment;
import org.egov.waterconnection.workflow.WorkflowIntegrator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import static org.egov.waterconnection.constants.WCConstants.PENDING_FOR_PAYMENT_STATUS_CODE;
import static org.egov.waterconnection.constants.WCConstants.WORKFLOW_NODUE_COMMENT;

@Service
@Slf4j
public class CalculationService {

	@Autowired
	private ObjectMapper mapper;

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private WaterServicesUtil waterServiceUtil;

	@Autowired
	private WorkflowIntegrator wfIntegrator;

	@Autowired
	private WSConfiguration config;

	@Autowired
	private WaterDao waterDao;

	@Autowired
	private WaterService waterService;

	@Autowired
	private EnrichmentService enrichmentService;

	/**
	 * 
	 * @param request
	 * 
	 * If action would be APPROVE_FOR_CONNECTION then
	 * 
	 *Estimate the fee for water application and generate the demand
	 * 
	 */
	public void calculateFeeAndGenerateDemand(WaterConnectionRequest request, Property property) {
		String action = request.getWaterConnection().getProcessInstance().getAction();

		if(WCConstants.SUBMIT_APPLICATION_CONST.equalsIgnoreCase(action)
				&& !(request.isReconnectRequest() || request.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.WATER_RECONNECTION))) {

			triggerCalculation(request, property, action);
		}

		
		else if (WCConstants.APPROVE_MUTATION_CONST.equalsIgnoreCase(action) && waterServiceUtil.isMutationConnectionRequest(request)) {
			triggerCalculation(request, property, action);
		}
		else if (WCConstants.APPROVE_DISCONNECTION_CONST.equalsIgnoreCase(action)) {
			CalculationCriteria criteria = CalculationCriteria.builder()
					.applicationNo(request.getWaterConnection().getApplicationNo())
					.waterConnection(request.getWaterConnection())
					.tenantId(property.getTenantId()).connectionNo(request.getWaterConnection().getConnectionNo()).build();
			CalculationReq calRequest = CalculationReq.builder().calculationCriteria(Arrays.asList(criteria))
					.requestInfo(request.getRequestInfo()).isconnectionCalculation(false).isDisconnectionRequest(true).isReconnectionRequest(false).build();
			try {
				Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getCalculatorURL(), calRequest);
				CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);
			} catch (ServiceCallException e) {
				throw new ServiceCallException(e.getError());
			} catch (Exception ex) {
				log.error("Calculation response error!!", ex);
				throw new CustomException("WATER_CALCULATION_EXCEPTION", "Calculation response can not parsed!!!");
			}
		}
		else if (WCConstants.RECONNECT_DISCONNECTION_CONST.equalsIgnoreCase(action) && (request.isReconnectRequest() || request.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.WATER_RECONNECTION))) {
			CalculationCriteria criteria = CalculationCriteria.builder()
					.applicationNo(request.getWaterConnection().getApplicationNo())
					.waterConnection(request.getWaterConnection())
					.tenantId(property.getTenantId()).connectionNo(request.getWaterConnection().getConnectionNo()).build();
			CalculationReq calRequest = CalculationReq.builder().calculationCriteria(Arrays.asList(criteria))
					.requestInfo(request.getRequestInfo()).isconnectionCalculation(false).isDisconnectionRequest(false).isReconnectionRequest(true).build();
			try {
				Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getCalculatorURL(), calRequest);
				CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);
			} catch (ServiceCallException e) {
				throw new ServiceCallException(e.getError());
			} catch (Exception ex) {
				log.error("Calculation response error!!", ex);
				throw new CustomException("WATER_CALCULATION_EXCEPTION", "Calculation response can not parsed!!!");
			}
		}
	}

	public boolean fetchBillForApplication(String tenantId, String applicationNo, RequestInfo requestInfo) {
		boolean isNoPayment = false;
		try {
			StringBuilder url = new StringBuilder().append(config.getBillingServiceHost())
					.append(config.getFetchBillEndPoint()).append(WCConstants.URL_PARAMS_SEPARATER)
					.append(WCConstants.TENANT_ID_FIELD_FOR_SEARCH_URL).append(tenantId)
					.append(WCConstants.SEPARATER).append(WCConstants.CONSUMER_CODE_SEARCH_FIELD_NAME)
					.append(applicationNo).append(WCConstants.SEPARATER)
					.append(WCConstants.BUSINESSSERVICE_FIELD_FOR_SEARCH_URL).append("WS.ONE_TIME_FEE");

			Object result = serviceRequestRepository.fetchResult(url, RequestInfoWrapper.builder().requestInfo(requestInfo).build());
			BillResponse billResponse = mapper.convertValue(result, BillResponse.class);

			log.info("[WS-AUTO-ACTIVATE] fetchBillForApplication: applicationNo={}, billCount={}",
					applicationNo, billResponse.getBill() != null ? billResponse.getBill().size() : 0);

			if (billResponse.getBill() == null || billResponse.getBill().isEmpty()) {
				log.info("[WS-AUTO-ACTIVATE] No bills found for WS.ONE_TIME_FEE — treating as no extra payment due");
				isNoPayment = true;
			} else {
				for (Bill bill : billResponse.getBill()) {
					log.info("[WS-AUTO-ACTIVATE] Bill id={}, totalAmount={}, status={}",
							bill.getId(), bill.getTotalAmount(), bill.getStatus());
					if (bill.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
						isNoPayment = true;
					}
				}
			}
		} catch (Exception ex) {
			log.error("[WS-AUTO-ACTIVATE] Error fetching bill for applicationNo={}: {}", applicationNo, ex.getMessage());
			throw new CustomException("WATER_FETCH_BILL_ERROR", "Error fetching bill: " + ex.getMessage());
		}
		return isNoPayment;
	}

	public boolean fetchBill(String tenantId, String connectionNo, RequestInfo requestInfo) {
		boolean isNoPayment = false;
		try {
			Object result = serviceRequestRepository.fetchResult(getFetchBillURL(tenantId, connectionNo)
					, RequestInfoWrapper.builder().requestInfo(requestInfo).build());
			BillResponse billResponse = mapper.convertValue(result, BillResponse.class);
			for (Bill bill : billResponse.getBill()) {
				if (bill.getTotalAmount().equals(BigDecimal.valueOf(0.0))) {
					isNoPayment = true;
				}
			}
		} catch (Exception ex) {
			throw new CustomException("WATER_FETCH_BILL_ERRORCODE", "Error while fetching the bill" + ex.getMessage());
		}
		return isNoPayment;
	}

	public boolean fetchBillForReconnect(String tenantId, String connectionNo, RequestInfo requestInfo) {
		boolean isNoPayment = false;
		try {
			Object result = serviceRequestRepository.fetchResult(getFetchBillURLForReconnect(tenantId, connectionNo)
					, RequestInfoWrapper.builder().requestInfo(requestInfo).build());
			BillResponse billResponse = mapper.convertValue(result, BillResponse.class);
			for (Bill bill : billResponse.getBill()) {
				if (bill.getTotalAmount().equals(BigDecimal.valueOf(0.0))) {
					isNoPayment = true;
				}
			}
		} catch (Exception ex) {
			throw new CustomException("WATER_FETCH_BILL_ERRORCODE", "Error while fetching the bill" + ex.getMessage());
		}
		return isNoPayment;
	}

	private StringBuilder getFetchBillURLForReconnect(String tenantId, String connectionNo) {

		return new StringBuilder().append(config.getBillingServiceHost())
				.append(config.getFetchBillEndPoint()).append(WCConstants.URL_PARAMS_SEPARATER)
				.append(WCConstants.TENANT_ID_FIELD_FOR_SEARCH_URL).append(tenantId)
				.append(WCConstants.SEPARATER).append(WCConstants.CONSUMER_CODE_SEARCH_FIELD_NAME)
				.append(connectionNo).append(WCConstants.SEPARATER)
				.append(WCConstants.BUSINESSSERVICE_FIELD_FOR_SEARCH_URL)
				.append("WSReconnection");
	}

	private StringBuilder getFetchBillURL(String tenantId, String connectionNo) {

		return new StringBuilder().append(config.getBillingServiceHost())
				.append(config.getFetchBillEndPoint()).append(WCConstants.URL_PARAMS_SEPARATER)
				.append(WCConstants.TENANT_ID_FIELD_FOR_SEARCH_URL).append(tenantId)
				.append(WCConstants.SEPARATER).append(WCConstants.CONSUMER_CODE_SEARCH_FIELD_NAME)
				.append(connectionNo).append(WCConstants.SEPARATER)
				.append(WCConstants.BUSINESSSERVICE_FIELD_FOR_SEARCH_URL)
				.append(WCConstants.WATER_TAX_SERVICE_CODE);
	}

	/**
	 * Shared helper to trigger the ws-calculator for fee estimation and demand generation.
	 */
	private void triggerCalculation(WaterConnectionRequest request, Property property, String action) {
		WaterConnection waterConnection = request.getWaterConnection();

		boolean isDisconnection = WCConstants.DISCONNECT_WATER_CONNECTION.equalsIgnoreCase(waterConnection.getApplicationType()) || request.isDisconnectRequest();
		boolean isReconnection = WCConstants.WATER_RECONNECTION.equalsIgnoreCase(waterConnection.getApplicationType()) || request.isReconnectRequest();

		CalculationCriteria criteria = CalculationCriteria.builder()
				.applicationNo(waterConnection.getApplicationNo())
				.connectionNo(waterConnection.getConnectionNo())
				.waterConnection(waterConnection)
				.tenantId(property.getTenantId())
				.build();

		CalculationReq calRequest = CalculationReq.builder()
				.calculationCriteria(Arrays.asList(criteria))
				.requestInfo(request.getRequestInfo())
				.isconnectionCalculation(false)
				.isDisconnectionRequest(isDisconnection)
				.isReconnectionRequest(isReconnection)
				.build();

		try {
			log.info("[WS-DEMAND] Triggering calculation with flags -> isDisconnection: {}, isReconnection: {}, applicationNo: {}",isDisconnection, isReconnection, waterConnection.getApplicationNo());

			Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getCalculatorURL(), calRequest);
			CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);

			log.info("[WS-DEMAND] triggerCalculation completed successfully for action={}, applicationNo={}",action, waterConnection.getApplicationNo());
		} catch (Exception ex) {
			log.error("Calculation response error for applicationNo: {}", waterConnection.getApplicationNo(), ex);
			throw new CustomException("WATER_CALCULATION_EXCEPTION", "Calculation response could not be parsed!");
		}
	}

	/**
	 * Called from WaterServiceImpl at APPROVE_FOR_CONNECTION ONLY when K-number dues exist.
	 * This re-triggers the ws-calculator to update/create the demand with the new fee amounts,
	 * generating a payable demand for the citizen.
	 */
	public void generateDemandForApproval(WaterConnectionRequest request, Property property) {
		log.info("[WS-DEMAND] generateDemandForApproval: Generating demand at APPROVE_FOR_CONNECTION for applicationNo={}",
				request.getWaterConnection().getApplicationNo());
		triggerCalculation(request, property, "APPROVE_FOR_CONNECTION");
	}
}
