package org.egov.waterconnection.service;

import java.math.BigDecimal;
import java.net.URI;
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
import org.egov.waterconnection.repository.InfrastructureChargeAssessmentRepository;
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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.web.util.UriComponentsBuilder;

import lombok.extern.slf4j.Slf4j;

import static org.egov.waterconnection.constants.WCConstants.PENDING_FOR_PAYMENT_STATUS_CODE;
import static org.egov.waterconnection.constants.WCConstants.WORKFLOW_NODUE_COMMENT;

@Service
@Slf4j
public class CalculationService {

	private static final String WS_INFRASTRUCTURE_CHARGE_TAX_HEAD = "WS_INFRASTRUCTURE_CHARGE";

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


	@Autowired
	private InfrastructureChargeAssessmentRepository infraAssessmentRepository;

	@Autowired
	private InfrastructureChargeFingerprintUtil infraFingerprintUtil;

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

		if (WCConstants.SUBMIT_APPLICATION_CONST.equalsIgnoreCase(action)) {
			CalculationRes calculationResponse = triggerCalculation(request, property, action, false);
			if (isNewWaterConnection(request.getWaterConnection())) {
				InfrastructureChargeFingerprintUtil.Snapshot snapshot = infraFingerprintUtil.create(property, request.getWaterConnection());
				BigDecimal ifcAmount = extractInfrastructureCharge(calculationResponse);
				String actor = getActor(request);
				infraAssessmentRepository.insertInitialIfAbsent(InfrastructureChargeAssessment.builder()
						.tenantId(request.getWaterConnection().getTenantId())
						.applicationNo(request.getWaterConnection().getApplicationNo())
						.propertyId(property.getPropertyId())
						.inputFingerprint(snapshot.getFingerprint())
						.inputSnapshot(snapshot.getJson())
						.assessedIfcAmount(ifcAmount)
						.lastEstimatedIfcAmount(ifcAmount)
						.pendingAdditionalAmount(BigDecimal.ZERO)
						.status("ASSESSED")
						.createdBy(actor)
						.lastModifiedBy(actor)
						.build());
			}
		}
		else if (WCConstants.APPLY_MUTATION_CONST.equalsIgnoreCase(action)
				&& waterServiceUtil.isMutationConnectionRequest(request)) {
			triggerCalculation(request, property, action, false);
		}
		/*
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
		*/
		else if ("RESUBMIT_APPLICATION".equalsIgnoreCase(action)
				&& isNewWaterConnection(request.getWaterConnection())) {
			// Property Service is the authoritative source. Keep the WS application copy
			// synchronized before fingerprinting, estimation and persisting the application.
			synchronizePropertyCalculationDetails(request.getWaterConnection(), property);
			reconcileInfrastructureChargeOnResubmission(request, property);
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

	/**
	 * Copies only calculation-relevant property values from the latest server-side
	 * Property Service response into the WS application additionalDetails. The nested
	 * "property" object sent by the UI is intentionally not trusted or required: the
	 * authoritative property has already been fetched and validated by ValidateProperty.
	 *
	 * This keeps eg_ws_connection useful as an application snapshot without creating a
	 * second authoritative property master.
	 */
	private void synchronizePropertyCalculationDetails(WaterConnection connection, Property property) {
		if (connection == null || property == null) {
			throw new CustomException("WS_PROPERTY_CONTEXT_MISSING",
					"Latest property information is required for water connection calculation.");
		}
		if (connection.getPropertyId() == null || !connection.getPropertyId().equals(property.getPropertyId())) {
			throw new CustomException("WS_PROPERTY_CONTEXT_MISMATCH",
					"The fetched property does not match the water connection property ID.");
		}

		Map<String, Object> connectionDetails = new LinkedHashMap<>();
		if (connection.getAdditionalDetails() != null) {
			connectionDetails.putAll(mapper.convertValue(connection.getAdditionalDetails(),
					new TypeReference<Map<String, Object>>() { }));
		}

		Map<String, Object> propertyDetails = new LinkedHashMap<>();
		if (property.getAdditionalDetails() != null) {
			propertyDetails.putAll(mapper.convertValue(property.getAdditionalDetails(),
					new TypeReference<Map<String, Object>>() { }));
		}

		// Resolve canonical calculation values from Property Service. Before mirroring
		// them into the WS record, reject a stale/mismatched request instead of silently
		// calculating against different property values than the citizen just submitted.
		Object canonicalPlotArea = property.getLandArea() != null
				? property.getLandArea() : propertyDetails.get("plotArea");
		Object submittedPlotArea = connectionDetails.get("plotArea");
		assertAreaMatches("plotArea", submittedPlotArea, canonicalPlotArea, connection.getApplicationNo());
		if (canonicalPlotArea != null) {
			connectionDetails.put("plotArea", normalizeNumericString(canonicalPlotArea));
		}

		// Use the explicit Property builtUpArea first; otherwise mirror the same
		// superBuiltUpArea fallback that the calculator's PropertyContextExtractor uses.
		Object builtUpArea = firstNonBlank(propertyDetails, "builtUpArea", "built_up_area",
				"totalBuiltUpArea", "totalBuiltupArea");
		if (builtUpArea == null && property.getSuperBuiltUpArea() != null) {
			builtUpArea = property.getSuperBuiltUpArea();
		}
		assertAreaMatches("builtUpArea", connectionDetails.get("builtUpArea"), builtUpArea,
				connection.getApplicationNo());
		if (builtUpArea != null) {
			connectionDetails.put("builtUpArea", normalizeNumericString(builtUpArea));
		}

		Map<String, Object> propertySnapshot = new LinkedHashMap<>();
		propertySnapshot.put("propertyId", property.getPropertyId());
		propertySnapshot.put("tenantId", property.getTenantId());
		propertySnapshot.put("landArea", property.getLandArea());
		propertySnapshot.put("superBuiltUpArea", property.getSuperBuiltUpArea());
		propertySnapshot.put("builtUpArea", builtUpArea);
		propertySnapshot.put("propertyType", property.getPropertyType());
		propertySnapshot.put("usageCategory", property.getUsageCategory());
		if (property.getAuditDetails() != null) {
			propertySnapshot.put("propertyLastModifiedTime", property.getAuditDetails().getLastModifiedTime());
		}
		Map<String, Object> calculationPropertyDetails = new TreeMap<>();
		for (String key : Arrays.asList("farArea", "far_area", "nonFarArea", "nonFARArea",
				"numberOfDwellingUnits", "numberOfBeds", "numberOfRooms", "numberOfStudents",
				"numberOfStaff", "waterConnectionUsageType", "propertyCategory")) {
			if (propertyDetails.containsKey(key)) {
				calculationPropertyDetails.put(key, propertyDetails.get(key));
			}
		}
		propertySnapshot.put("calculationDetails", calculationPropertyDetails);
		connectionDetails.put("propertyCalculationSnapshot", propertySnapshot);
		connection.setAdditionalDetails(connectionDetails);

		log.info("[WS-IFC] Synchronized canonical property context. applicationNo={}, propertyId={}, plotArea={}, builtUpArea={}, propertyLastModifiedTime={}",
				connection.getApplicationNo(), property.getPropertyId(), connectionDetails.get("plotArea"),
				connectionDetails.get("builtUpArea"), property.getAuditDetails() == null ? null
						: property.getAuditDetails().getLastModifiedTime());
	}

	private void assertAreaMatches(String fieldName, Object submittedValue, Object propertyValue,
			String applicationNo) {
		if (!hasNonBlank(submittedValue) || !hasNonBlank(propertyValue)) {
			return;
		}
		try {
			BigDecimal submitted = new BigDecimal(submittedValue.toString().trim());
			BigDecimal canonical = new BigDecimal(propertyValue.toString().trim());
			if (submitted.compareTo(canonical) != 0) {
				throw new CustomException("WS_PROPERTY_AREA_NOT_SYNCED",
						"The updated " + fieldName + " in the water application does not match the latest Property record. Refresh the property details and resubmit.");
			}
		} catch (NumberFormatException ex) {
			throw new CustomException("WS_PROPERTY_AREA_INVALID",
					"The " + fieldName + " value is not numeric for application " + applicationNo + ".");
		}
	}

	private Object firstNonBlank(Map<String, Object> values, String... keys) {
		for (String key : keys) {
			Object value = values.get(key);
			if (hasNonBlank(value)) {
				return value;
			}
		}
		return null;
	}

	private boolean hasNonBlank(Object value) {
		return value != null && !value.toString().trim().isEmpty();
	}

	private String normalizeNumericString(Object value) {
		try {
			return new BigDecimal(value.toString().trim()).stripTrailingZeros().toPlainString();
		} catch (NumberFormatException ex) {
			return value.toString().trim();
		}
	}

	/**
	 * Reconcile the full revised IFC estimate against the currently assessed demand.
	 * The client-supplied action is validated before this method is invoked; only the
	 * workflow action is changed here when a positive delta must be paid.
	 */
	private void reconcileInfrastructureChargeOnResubmission(WaterConnectionRequest request, Property property) {
		WaterConnection connection = request.getWaterConnection();
		String tenantId = connection.getTenantId();
		String applicationNo = connection.getApplicationNo();
		InfrastructureChargeFingerprintUtil.Snapshot snapshot = infraFingerprintUtil.create(property, connection);
		InfrastructureChargeAssessment assessment = infraAssessmentRepository.findByApplication(tenantId, applicationNo);

		if (assessment != null && "PAYMENT_PENDING".equalsIgnoreCase(assessment.getStatus())) {
            if (!snapshot.getFingerprint().equals(assessment.getInputFingerprint())) {
                throw new CustomException("WS_INFRA_PAYMENT_PENDING_PROPERTY_EDIT",
                        "An additional infrastructure payment is pending. Property calculation details cannot be changed until this payment is completed or the pending assessment is resolved.");
            }
			// A previous attempt may have updated the demand but failed before workflow transition.
			// Re-running reconciliation with the same fingerprint refreshes the bill without duplicating the delta.
			triggerCalculation(request, property, "RESUBMIT_FOR_INFRA_PAYMENT", true);
			connection.getProcessInstance().setAction(WCConstants.RESUBMIT_FOR_INFRA_PAYMENT_CONST);
			return;
		}

		if (assessment != null && snapshot.getFingerprint().equals(assessment.getInputFingerprint())) {
			log.info("[WS-IFC] No charge-driving property change for application {}; skipping IFC reassessment.", applicationNo);
			return;
		}

		CalculationRes estimateResponse = estimate(request, property);
		BigDecimal revisedIfc = extractInfrastructureCharge(estimateResponse);
		BigDecimal currentlyAssessedIfc = fetchCurrentlyAssessedInfrastructureCharge(tenantId, applicationNo, request);
		if (currentlyAssessedIfc == null && assessment != null) {
			currentlyAssessedIfc = zeroIfNull(assessment.getAssessedIfcAmount());
		}
		if (currentlyAssessedIfc == null) {
			throw new CustomException("WS_INFRA_ASSESSMENT_BASELINE_MISSING",
					"Unable to find the existing water demand to reconcile infrastructure charges. Please contact the administrator; no additional demand was created.");
		}

		BigDecimal delta = revisedIfc.subtract(currentlyAssessedIfc).setScale(2, java.math.RoundingMode.HALF_UP);
		String actor = getActor(request);

		if (delta.compareTo(BigDecimal.ZERO) > 0) {
			// Persist the pending intent before mutating billing demand. A retry can then safely
			// resume the same payment transition if the workflow call fails after demand update.
			infraAssessmentRepository.save(InfrastructureChargeAssessment.builder()
					.tenantId(tenantId).applicationNo(applicationNo).propertyId(property.getPropertyId())
					.inputFingerprint(snapshot.getFingerprint()).inputSnapshot(snapshot.getJson())
					.assessedIfcAmount(revisedIfc).lastEstimatedIfcAmount(revisedIfc)
					.pendingAdditionalAmount(delta).status("PAYMENT_PENDING")
					.createdBy(assessment == null ? actor : assessment.getCreatedBy()).lastModifiedBy(actor).build());

			triggerCalculation(request, property, "RESUBMIT_FOR_INFRA_PAYMENT", true);
			connection.getProcessInstance().setAction(WCConstants.RESUBMIT_FOR_INFRA_PAYMENT_CONST);
			log.info("[WS-IFC] Additional IFC payment required. applicationNo={}, previous={}, revised={}, delta={}",
					applicationNo, currentlyAssessedIfc, revisedIfc, delta);
		} else if (delta.compareTo(BigDecimal.ZERO) < 0) {
			// Never create a negative demand automatically. Record it for an explicit credit/refund review.
			infraAssessmentRepository.save(InfrastructureChargeAssessment.builder()
					.tenantId(tenantId).applicationNo(applicationNo).propertyId(property.getPropertyId())
					.inputFingerprint(snapshot.getFingerprint()).inputSnapshot(snapshot.getJson())
					.assessedIfcAmount(currentlyAssessedIfc).lastEstimatedIfcAmount(revisedIfc)
					.pendingAdditionalAmount(BigDecimal.ZERO).status("CREDIT_REVIEW_REQUIRED")
					.createdBy(assessment == null ? actor : assessment.getCreatedBy()).lastModifiedBy(actor).build());
			log.warn("[WS-IFC] Revised IFC is lower than the amount already assessed. No negative demand generated; credit/refund review required. applicationNo={}, assessed={}, revised={}",
					applicationNo, currentlyAssessedIfc, revisedIfc);
		} else {
			String status = assessment != null && "CREDIT_REVIEW_REQUIRED".equalsIgnoreCase(assessment.getStatus())
					? "CREDIT_REVIEW_REQUIRED" : "ASSESSED";
			infraAssessmentRepository.save(InfrastructureChargeAssessment.builder()
					.tenantId(tenantId).applicationNo(applicationNo).propertyId(property.getPropertyId())
					.inputFingerprint(snapshot.getFingerprint()).inputSnapshot(snapshot.getJson())
					.assessedIfcAmount(currentlyAssessedIfc).lastEstimatedIfcAmount(revisedIfc)
					.pendingAdditionalAmount(BigDecimal.ZERO).status(status)
					.createdBy(assessment == null ? actor : assessment.getCreatedBy()).lastModifiedBy(actor).build());
			log.info("[WS-IFC] Relevant property details changed but IFC is unchanged. applicationNo={}, assessed={}",
					applicationNo, currentlyAssessedIfc);
		}
	}

	private CalculationRes estimate(WaterConnectionRequest request, Property property) {
		WaterConnection waterConnection = request.getWaterConnection();
		CalculationCriteria criteria = CalculationCriteria.builder()
				.applicationNo(waterConnection.getApplicationNo())
				.connectionNo(waterConnection.getConnectionNo())
				.waterConnection(waterConnection)
				.tenantId(property.getTenantId()).build();
		CalculationReq calRequest = CalculationReq.builder()
				.calculationCriteria(Arrays.asList(criteria))
				.requestInfo(request.getRequestInfo())
				.isconnectionCalculation(false)
				.isDisconnectionRequest(false)
				.isReconnectionRequest(false)
				.isInfrastructureReassessment(false)
				.build();
		try {
			Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getEstimationURL(), calRequest);
			return mapper.convertValue(response, CalculationRes.class);
		} catch (Exception ex) {
			log.error("[WS-IFC] Failed to estimate revised infrastructure charge for applicationNo={}", waterConnection.getApplicationNo(), ex);
			throw new CustomException("WS_INFRA_REASSESSMENT_ESTIMATE_FAILED", "Unable to estimate revised infrastructure charges. Please retry; no additional demand was created.");
		}
	}

	private BigDecimal fetchCurrentlyAssessedInfrastructureCharge(String tenantId, String applicationNo,
			WaterConnectionRequest request) {
		try {
			URI uri = UriComponentsBuilder
					.fromHttpUrl(config.getBillingServiceHost() + config.getSearchDemandEndPoint())
					.queryParam("tenantId", tenantId)
					.queryParam("businessService", "WS.ONE_TIME_FEE")
					.queryParam("consumerCode", applicationNo)
					.build()
					.encode()
					.toUri();
			Object response = serviceRequestRepository.fetchResult(uri,
					RequestInfoWrapper.builder().requestInfo(request.getRequestInfo()).build());
			JsonNode root = mapper.valueToTree(response);
			JsonNode demands = root.has("Demands") ? root.get("Demands") : root.get("demands");
			if (demands == null || !demands.isArray() || demands.size() == 0) {
				return null;
			}
			BigDecimal total = BigDecimal.ZERO;
			boolean foundActiveDemand = false;
			for (JsonNode demand : demands) {
				String status = demand.path("status").asText("");
				if ("CANCELLED".equalsIgnoreCase(status) || "INACTIVE".equalsIgnoreCase(status)) {
					continue;
				}
				JsonNode details = demand.has("demandDetails") ? demand.get("demandDetails") : demand.get("DemandDetails");
				if (details == null || !details.isArray()) {
					continue;
				}
				foundActiveDemand = true;
				for (JsonNode detail : details) {
					String code = detail.path("taxHeadMasterCode").asText("");
					if (WS_INFRASTRUCTURE_CHARGE_TAX_HEAD.equalsIgnoreCase(code)
							|| WCConstants.WS_ADDITIONAL_INFRASTRUCTURE_CHARGE.equalsIgnoreCase(code)) {
						JsonNode tax = detail.get("taxAmount");
						if (tax != null && !tax.isNull()) {
							total = total.add(new BigDecimal(tax.asText()));
						}
					}
				}
			}
			return foundActiveDemand ? total.setScale(2, java.math.RoundingMode.HALF_UP) : null;
		} catch (Exception ex) {
			log.error("[WS-IFC] Failed to find current infrastructure assessment for applicationNo={}", applicationNo, ex);
			throw new CustomException("WS_INFRA_ASSESSMENT_DEMAND_SEARCH_FAILED", "Unable to verify the existing infrastructure charge demand. Please retry; no additional demand was created.");
		}
	}

	private BigDecimal extractInfrastructureCharge(CalculationRes response) {
		if (response == null || response.getCalculation() == null || response.getCalculation().isEmpty()
				|| response.getCalculation().get(0).getTaxHeadEstimates() == null) {
			throw new CustomException("WS_INFRA_ESTIMATE_RESPONSE_INVALID", "Calculator did not return infrastructure charge estimates.");
		}
		BigDecimal result = BigDecimal.ZERO;
		for (TaxHeadEstimate estimate : response.getCalculation().get(0).getTaxHeadEstimates()) {
			if (estimate != null && WS_INFRASTRUCTURE_CHARGE_TAX_HEAD.equalsIgnoreCase(estimate.getTaxHeadCode())
					&& estimate.getEstimateAmount() != null) {
				result = result.add(estimate.getEstimateAmount());
			}
		}
		return result.setScale(2, java.math.RoundingMode.HALF_UP);
	}

	private boolean isNewWaterConnection(WaterConnection connection) {
		return connection != null && WCConstants.NEW_WATER_CONNECTION.equalsIgnoreCase(connection.getApplicationType())
				&& connection.getApplicationNo() != null && !connection.getApplicationNo().trim().isEmpty();
	}

	private String getActor(WaterConnectionRequest request) {
		if (request != null && request.getRequestInfo() != null && request.getRequestInfo().getUserInfo() != null
				&& request.getRequestInfo().getUserInfo().getUuid() != null) {
			return request.getRequestInfo().getUserInfo().getUuid();
		}
		return "SYSTEM";
	}

	private BigDecimal zeroIfNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value.setScale(2, java.math.RoundingMode.HALF_UP);
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

	public boolean hasPendingWaterDues(String tenantId, String connectionNo, RequestInfo requestInfo) {
		try {
			Object result = serviceRequestRepository.fetchResult(getFetchBillURL(tenantId, connectionNo)
					, RequestInfoWrapper.builder().requestInfo(requestInfo).build());
			BillResponse billResponse = mapper.convertValue(result, BillResponse.class);
			
			// Condition 1: If there are no active bills (Empty array) -> No dues
			if (billResponse.getBill() == null || billResponse.getBill().isEmpty()) {
				return false; 
			}
			
			for (Bill bill : billResponse.getBill()) {
				BigDecimal totalAmount = bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO;
				BigDecimal amountPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
				
				// Condition 2 & 3: Use .compareTo to safely ignore BigDecimal scale and check for pending amount
				if (totalAmount.subtract(amountPaid).compareTo(BigDecimal.ZERO) > 0) {
					return true; // Pending dues exist
				}
			}
			return false; // No pending dues found
		} catch (Exception ex) {
			log.error("Error fetching bills for connectionNo: {}", connectionNo, ex);
			throw new CustomException("WATER_FETCH_BILL_ERROR", "Error while fetching the bill for dues: " + ex.getMessage());
		}
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
	private CalculationRes triggerCalculation(WaterConnectionRequest request, Property property, String action, boolean infrastructureReassessment) {
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
				.isInfrastructureReassessment(infrastructureReassessment)
				.build();

		try {
			log.info("[WS-DEMAND] Triggering calculation with flags -> isDisconnection: {}, isReconnection: {}, applicationNo: {}",isDisconnection, isReconnection, waterConnection.getApplicationNo());

			Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getCalculatorURL(), calRequest);
			CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);

			log.info("[WS-DEMAND] triggerCalculation completed successfully for action={}, applicationNo={}, infrastructureReassessment={}", action, waterConnection.getApplicationNo(), infrastructureReassessment);
			return calResponse;
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
		triggerCalculation(request, property, "APPROVE_FOR_CONNECTION", false);
	}
}
