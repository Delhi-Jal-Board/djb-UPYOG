package org.egov.waterconnection.service;

import static org.egov.waterconnection.constants.WCConstants.APPROVE_CONNECTION;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.PlainAccessRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.constants.WCConstants;
import org.egov.waterconnection.repository.WaterDao;
import org.egov.waterconnection.repository.WaterDaoImpl;
import org.egov.waterconnection.util.EncryptionDecryptionUtil;
import org.egov.waterconnection.util.UnmaskingUtil;
import org.egov.waterconnection.util.WaterServicesUtil;
import org.egov.waterconnection.validator.ActionValidator;
import org.egov.waterconnection.validator.MDMSValidator;
import org.egov.waterconnection.validator.ValidateProperty;
import org.egov.waterconnection.validator.WaterConnectionValidator;
import org.egov.waterconnection.web.models.*;
import org.egov.waterconnection.web.models.Connection.StatusEnum;
import org.egov.waterconnection.web.models.workflow.BusinessService;
import org.egov.waterconnection.web.models.workflow.ProcessInstance;
import org.egov.waterconnection.workflow.WorkflowIntegrator;
import org.egov.waterconnection.workflow.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.egov.waterconnection.constants.WCConstants.*;

@Slf4j
@Component
public class WaterServiceImpl implements WaterService {

	@Autowired
	private WaterDao waterDao;

	@Autowired
	private WaterConnectionValidator waterConnectionValidator;

	@Autowired
	private ValidateProperty validateProperty;
	
	@Autowired
	private MDMSValidator mDMSValidator;

	@Autowired
	private EnrichmentService enrichmentService;

	@Autowired
	private WorkflowIntegrator wfIntegrator;

	@Autowired
	private WSConfiguration config;

	@Autowired
	private WorkflowService workflowService;

	@Autowired
	private ActionValidator actionValidator;

	@Autowired
	private WaterServicesUtil waterServiceUtil;

	@Autowired
	private CalculationService calculationService;

	@Autowired
	private WaterDaoImpl waterDaoImpl;

	@Autowired
	private UserService userService;

	@Autowired
	private WaterServicesUtil wsUtil;

	@Autowired
	EncryptionDecryptionUtil encryptionDecryptionUtil;

	@Autowired
	private PaymentUpdateService paymentUpdateService;

	@Autowired
	private UnmaskingUtil unmaskingUtil;

	/**
	 *
	 * @param waterConnectionRequest
	 *            WaterConnectionRequest contains water connection to be created
	 * @return List of WaterConnection after create
	 */
	@Override
	public List<WaterConnection> createWaterConnection(WaterConnectionRequest waterConnectionRequest) {

		int reqType = WCConstants.CREATE_APPLICATION;


		if (waterConnectionRequest.isDisconnectRequest() || (waterConnectionRequest.getWaterConnection().getApplicationType() !=null && waterConnectionRequest.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.DISCONNECT_WATER_CONNECTION))) {
			reqType = WCConstants.DISCONNECT_CONNECTION;
			validateDisconnectionRequest(waterConnectionRequest);
		}
		else if (waterConnectionRequest.isReconnectRequest() || (waterConnectionRequest.getWaterConnection().getApplicationType() !=null  && waterConnectionRequest.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.WATER_RECONNECTION))) {
			reqType = WCConstants.RECONNECTION;
			validateReconnectionRequest(waterConnectionRequest);
		}

		else if (wsUtil.isMutationConnectionRequest(waterConnectionRequest)) {
			reqType = WCConstants.MUTATION_CONNECTION;
			List<WaterConnection> previousConnectionsList = getAllWaterApplications(waterConnectionRequest);
			// Validate any process Instance exists with WF
			if (!CollectionUtils.isEmpty(previousConnectionsList)) {
				workflowService.validateInProgressWF(previousConnectionsList, waterConnectionRequest.getRequestInfo(),
						waterConnectionRequest.getWaterConnection().getTenantId());
				waterConnectionValidator.validateConnectionStatus(previousConnectionsList, waterConnectionRequest, reqType);
			}
			swapConnHolders(waterConnectionRequest,previousConnectionsList);

			//Swap masked Plumber info with unmasked plumberInfo from previous applications
			if(!ObjectUtils.isEmpty(previousConnectionsList.get(0).getPlumberInfo()))
				unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), previousConnectionsList.get(0).getPlumberInfo());

			// Validate any process Instance exists with WF
			if (!CollectionUtils.isEmpty(previousConnectionsList)) {
				workflowService.validateInProgressWF(previousConnectionsList, waterConnectionRequest.getRequestInfo(),
						waterConnectionRequest.getWaterConnection().getTenantId());
			}
		}
		else if (wsUtil.isModifyConnectionRequest(waterConnectionRequest)) {
			List<WaterConnection> previousConnectionsList = getAllWaterApplications(waterConnectionRequest);
			// Validate any process Instance exists with WF
			if (!CollectionUtils.isEmpty(previousConnectionsList)) {
				workflowService.validateInProgressWF(previousConnectionsList, waterConnectionRequest.getRequestInfo(),
						waterConnectionRequest.getWaterConnection().getTenantId());
				waterConnectionValidator.validateConnectionStatus(previousConnectionsList, waterConnectionRequest, reqType);
			}
			swapConnHolders(waterConnectionRequest,previousConnectionsList);

			//Swap masked Plumber info with unmasked plumberInfo from previous applications
			if(!ObjectUtils.isEmpty(previousConnectionsList.get(0).getPlumberInfo()))
				unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), previousConnectionsList.get(0).getPlumberInfo());

			// Validate any process Instance exists with WF
			if (!CollectionUtils.isEmpty(previousConnectionsList)) {
				workflowService.validateInProgressWF(previousConnectionsList, waterConnectionRequest.getRequestInfo(),
						waterConnectionRequest.getWaterConnection().getTenantId());
			}
			reqType = WCConstants.MODIFY_CONNECTION;
		}
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, reqType);
		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		mDMSValidator.validateMasterForCreateRequest(waterConnectionRequest);
		enrichmentService.enrichWaterConnection(waterConnectionRequest, reqType);
		userService.createUser(waterConnectionRequest);
		// call work-flow
		if (config.getIsExternalWorkFlowEnabled())
			wfIntegrator.callWorkFlow(waterConnectionRequest, property);

		// Save middleName/lastName before encryption — the encryption service drops fields
		// not in its MDMS model definition, so they must be restored after decrypt.
		Map<String, String[]> holderNameParts = new HashMap<>();
		if (!CollectionUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionHolders())) {
			waterConnectionRequest.getWaterConnection().getConnectionHolders().forEach(h -> {
				if (h.getUuid() != null) {
					holderNameParts.put(h.getUuid(), new String[]{ h.getMiddleName(), h.getLastName() });
				}
			});
		}

		/* encrypt here */
		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		/* encrypt here for connection holder details */
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.saveWaterConnection(waterConnectionRequest);

		/* decrypt here */
		waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), WNS_ENCRYPTION_MODEL, WaterConnection.class, waterConnectionRequest.getRequestInfo()));
		//PlumberInfo masked during Create call of New Application
		if (reqType == 0)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), WNS_PLUMBER_ENCRYPTION_MODEL, WaterConnection.class, waterConnectionRequest.getRequestInfo()));
			//PlumberInfo unmasked during create call of Disconnect/Modify Applications
		else
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		List<OwnerInfo> connectionHolders = waterConnectionRequest.getWaterConnection().getConnectionHolders();
		if (!CollectionUtils.isEmpty(connectionHolders)) {
			waterConnectionRequest.getWaterConnection().setConnectionHolders(encryptionDecryptionUtil.decryptObject(connectionHolders, WNS_OWNER_ENCRYPTION_MODEL, OwnerInfo.class, waterConnectionRequest.getRequestInfo()));
			// Restore middleName/lastName that were dropped by the encryption service
			waterConnectionRequest.getWaterConnection().getConnectionHolders().forEach(h -> {
				String[] parts = holderNameParts.get(h.getUuid());
				if (parts != null) {
					h.setMiddleName(parts[0]);
					h.setLastName(parts[1]);
				}
			});
		}

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}

	private void validateDisconnectionRequest(WaterConnectionRequest waterConnectionRequest) {
		if (!waterConnectionRequest.getWaterConnection().getStatus().toString().equalsIgnoreCase(WCConstants.ACTIVE)) {
			throw new CustomException("INVALID_REQUEST",
					"Water connection must be active for disconnection request");
		}

		List<WaterConnection> previousConnectionsList = getAllWaterApplications(waterConnectionRequest);
		swapConnHolders(waterConnectionRequest,previousConnectionsList);

		//Swap masked Plumber info with unmasked plumberInfo from previous applications
		if(!ObjectUtils.isEmpty(previousConnectionsList.get(0).getPlumberInfo()))
			unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), previousConnectionsList.get(0).getPlumberInfo());

		for(WaterConnection connection : previousConnectionsList) {
			if(!(connection.getApplicationStatus().equalsIgnoreCase(WCConstants.STATUS_APPROVED) ||  connection.getApplicationStatus().equalsIgnoreCase(WCConstants.DISCONNECTION_FINAL_STATE) || connection.getApplicationStatus().equalsIgnoreCase(WCConstants.MODIFIED_FINAL_STATE))) {
				throw new CustomException("INVALID_REQUEST",
						"No application should be in progress while applying for disconnection");
			}
		}

	}
	
	private void validateReconnectionRequest(WaterConnectionRequest waterConnectionRequest) {
		if (waterConnectionRequest.getWaterConnection().getStatus().toString().equalsIgnoreCase(WCConstants.ACTIVE)) {
			throw new CustomException("INVALID_REQUEST",
					"Water connection must be inactive for reconnection request");
		}

		List<WaterConnection> previousConnectionsList = getAllWaterApplications(waterConnectionRequest);
		swapConnHolders(waterConnectionRequest,previousConnectionsList);

		//Swap masked Plumber info with unmasked plumberInfo from previous applications
		if(!ObjectUtils.isEmpty(previousConnectionsList.get(0).getPlumberInfo()))
			unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), previousConnectionsList.get(0).getPlumberInfo());

		for(WaterConnection connection : previousConnectionsList) {
			if(!(connection.getApplicationStatus().equalsIgnoreCase(WCConstants.STATUS_APPROVED) || connection.getApplicationStatus().equalsIgnoreCase(WCConstants.DISCONNECTION_FINAL_STATE)|| connection.getApplicationStatus().equalsIgnoreCase(WCConstants.MODIFIED_FINAL_STATE))) {
				throw new CustomException("INVALID_REQUEST",
						"No application should be in progress while applying for Reconnection");
			}
		}
	}

	/**
	 *
	 * @param criteria
	 *            WaterConnectionSearchCriteria contains search criteria on water
	 *            connection
	 * @param requestInfo
	 * @return List of matching water connection
	 */
	public List<WaterConnection> search(SearchCriteria criteria, RequestInfo requestInfo) {
		List<WaterConnection> waterConnectionList;

		waterConnectionValidator.validateSearch(criteria);

		//Creating copies of apiPlainAcessRequests for decryption process
		//Any decryption process returns the  requestInfo with only the already used plain Access Request fields

		PlainAccessRequest apiPlainAccessRequest = null, apiPlainAccessRequestCopy = null;
		if (!ObjectUtils.isEmpty(requestInfo.getPlainAccessRequest())) {
			PlainAccessRequest plainAccessRequest = requestInfo.getPlainAccessRequest();
			if (!StringUtils.isEmpty(plainAccessRequest.getRecordId()) && !ObjectUtils.isEmpty(plainAccessRequest.getPlainRequestFields())) {
				apiPlainAccessRequest = new PlainAccessRequest(plainAccessRequest.getRecordId(), plainAccessRequest.getPlainRequestFields());
				apiPlainAccessRequestCopy = new PlainAccessRequest(plainAccessRequest.getRecordId(), plainAccessRequest.getPlainRequestFields());
			}
		}
		/* encrypt here */
		criteria = encryptionDecryptionUtil.encryptObject(criteria, WNS_ENCRYPTION_MODEL, SearchCriteria.class);
		criteria = encryptionDecryptionUtil.encryptObject(criteria, WNS_PLUMBER_ENCRYPTION_MODEL, SearchCriteria.class);

		waterConnectionList = getWaterConnectionsList(criteria, requestInfo);
		log.info("connection after search" +waterConnectionList.size() );

		if (!StringUtils.isEmpty(criteria.getSearchType()) &&
				criteria.getSearchType().equals(WCConstants.SEARCH_TYPE_CONNECTION)) {
			waterConnectionList = enrichmentService.filterConnections(waterConnectionList);
			/*if(criteria.getIsPropertyDetailsRequired()){
				waterConnectionList = enrichmentService.enrichPropertyDetails(waterConnectionList, criteria, requestInfo);
			}*/
		}
		
		log.info("Filtered connection after search" +waterConnectionList.size() );
		waterConnectionList = enrichmentService.enrichPropertyDetails(waterConnectionList, criteria, requestInfo);
		waterConnectionValidator.validatePropertyForConnection(waterConnectionList);
		enrichmentService.enrichConnectionHolderDeatils(waterConnectionList, criteria, requestInfo);
		enrichmentService.enrichProcessInstance(waterConnectionList, criteria, requestInfo);
//		enrichmentService.enrichDocumentDetails(waterConnectionList, criteria, requestInfo);
		enrichmentService.enrichDocumentNumbers(waterConnectionList);

		requestInfo.setPlainAccessRequest(apiPlainAccessRequest);
		/* decrypt here */
		if (criteria.getIsInternalCall()) {
			waterConnectionList = encryptionDecryptionUtil.decryptObject(waterConnectionList, "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, requestInfo);
			requestInfo.setPlainAccessRequest(apiPlainAccessRequestCopy);
			return encryptionDecryptionUtil.decryptObject(waterConnectionList, "WnSConnectionDecrypDisabled", WaterConnection.class, requestInfo);
		}
		waterConnectionList = encryptionDecryptionUtil.decryptObject(waterConnectionList, WNS_PLUMBER_ENCRYPTION_MODEL, WaterConnection.class, requestInfo);
		requestInfo.setPlainAccessRequest(apiPlainAccessRequestCopy);
		return encryptionDecryptionUtil.decryptObject(waterConnectionList, WNS_ENCRYPTION_MODEL, WaterConnection.class, requestInfo);
	}

	/**
	 *
	 * @param criteria
	 *            WaterConnectionSearchCriteria contains search criteria on water
	 *            connection
	 * @param requestInfo
	 * @return List of matching water connection
	 */
	public List<WaterConnection> getWaterConnectionsList(SearchCriteria criteria, RequestInfo requestInfo) {
		return waterDao.getWaterConnectionList(criteria, requestInfo);
	}

	/**
	 *
	 * @param criteria
	 *            WaterConnectionSearchCriteria contains search criteria on water
	 *            connection
	 * @param requestInfo
	 * @return Count of List of matching water connection
	 */
	@Override
	public Integer countAllWaterApplications(SearchCriteria criteria, RequestInfo requestInfo) {
		criteria.setIsCountCall(Boolean.TRUE);
		return getWaterConnectionsCount(criteria, requestInfo);
	}

	/**
	 *
	 * @param criteria
	 *            WaterConnectionSearchCriteria contains search criteria on water
	 *            connection
	 * @param requestInfo
	 * @return count of matching water connection
	 */
	public Integer getWaterConnectionsCount(SearchCriteria criteria, RequestInfo requestInfo) {
		return waterDao.getWaterConnectionsCount(criteria, requestInfo);
	}

	/**
	 *
	 * @param waterConnectionRequest
	 *            WaterConnectionRequest contains water connection to be updated
	 * @return List of WaterConnection after update
	 */
	@Override
	public List<WaterConnection> updateWaterConnection(WaterConnectionRequest waterConnectionRequest) {
		if(waterConnectionRequest.isDisconnectRequest() || waterConnectionRequest.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.DISCONNECT_WATER_CONNECTION)) {
			return updateWaterConnectionForDisconnectFlow(waterConnectionRequest);
		}
		else if (waterConnectionRequest.isReconnectRequest() || waterConnectionRequest.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.WATER_RECONNECTION)) {
			return updateWaterConnectionForReconnectFlow(waterConnectionRequest);
		}
		else if (wsUtil.isMutationConnectionRequest(waterConnectionRequest)) {
			return updateWaterConnectionForMutationFlow(waterConnectionRequest);
		}
		SearchCriteria criteria = new SearchCriteria();
		log.info("con" + wsUtil.isModifyConnectionRequest(waterConnectionRequest));
		log.info("isDisconnection" +waterConnectionRequest.getWaterConnection().getIsDisconnectionTemporary());
		if(wsUtil.isModifyConnectionRequest(waterConnectionRequest) && !waterConnectionRequest.getWaterConnection().getIsDisconnectionTemporary()) {
			// Received request to update the connection for modifyConnection WF
			return updateWaterConnectionForModifyFlow(waterConnectionRequest);
		}
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, WCConstants.UPDATE_APPLICATION);
		mDMSValidator.validateMasterData(waterConnectionRequest,WCConstants.UPDATE_APPLICATION );
		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		BusinessService businessService = workflowService.getBusinessService(waterConnectionRequest.getWaterConnection().getTenantId(),
				waterConnectionRequest.getRequestInfo(), config.getBusinessServiceValue());

		WaterConnection searchResult = getConnectionForUpdateRequest(waterConnectionRequest.getWaterConnection().getTenantId(), waterConnectionRequest.getWaterConnection().getId(), waterConnectionRequest.getRequestInfo());

		boolean isPlumberSwapped = unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), searchResult.getPlumberInfo());
		if (isPlumberSwapped)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		String previousApplicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(),
				config.getBusinessServiceValue());

		boolean isStateUpdatable = waterServiceUtil.getStatusForUpdate(businessService, previousApplicationStatus);

		enrichmentService.enrichUpdateWaterConnection(waterConnectionRequest);
		actionValidator.validateUpdateRequest(waterConnectionRequest, businessService, previousApplicationStatus);
		waterConnectionValidator.validateUpdate(waterConnectionRequest, searchResult, WCConstants.UPDATE_APPLICATION);
		userService.updateUser(waterConnectionRequest, searchResult);
		//Enriching the property details
		List<WaterConnection> waterConnectionList = new ArrayList<>();
		waterConnectionList.add(waterConnectionRequest.getWaterConnection());
		criteria.setTenantId(waterConnectionRequest.getWaterConnection().getTenantId());
		waterConnectionRequest.setWaterConnection(enrichmentService.enrichPropertyDetails(waterConnectionList, criteria, waterConnectionRequest.getRequestInfo()).get(0));

		//call calculator service to generate the demand for one time fee
		calculationService.calculateFeeAndGenerateDemand(waterConnectionRequest, property);
		String currentAction = waterConnectionRequest.getWaterConnection().getProcessInstance().getAction();
		log.info("[WS-AUTO-ACTIVATE] ===== UPDATE WATER CONNECTION START =====");
		log.info("[WS-AUTO-ACTIVATE] ApplicationNo: {}, ApplicationType: {}, CurrentAction: {}",
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getApplicationType(),
				currentAction);
		//Call workflow
		boolean isNoPayment = false;
		if ("APPROVE_FOR_CONNECTION".equalsIgnoreCase(currentAction)) {
			log.info("[WS-AUTO-ACTIVATE] Action is APPROVE_FOR_CONNECTION — checking if extra payment is due...");

			// Step 1: Check if there are K-number dues from Due Verification
			java.math.BigDecimal totalKnoDues = java.math.BigDecimal.ZERO;
			List<DueVerification> dueVerifications = searchResult.getDueVerification();
			if (!CollectionUtils.isEmpty(dueVerifications)) {
				for (DueVerification dv : dueVerifications) {
					if (dv.getDueAmount() != null && !dv.getDueAmount().trim().isEmpty()) {
						try {
							java.math.BigDecimal dueAmt = new java.math.BigDecimal(dv.getDueAmount().trim());
							totalKnoDues = totalKnoDues.add(dueAmt);
							log.info("[WS-AUTO-ACTIVATE] K-Number={}, DueAmount={}", dv.getKno(), dv.getDueAmount());
						} catch (NumberFormatException e) {
							log.warn("[WS-AUTO-ACTIVATE] Invalid dueAmount '{}' for K-Number={}", dv.getDueAmount(), dv.getKno());
						}
					}
				}
			}
			log.info("[WS-AUTO-ACTIVATE] Total K-Number dues = {}", totalKnoDues);

			if (totalKnoDues.compareTo(java.math.BigDecimal.ZERO) > 0) {
				// K-number dues exist — generate demand and require payment
				log.info("[WS-AUTO-ACTIVATE] K-Number dues detected ({}). Triggering demand generation...", totalKnoDues);
				
				// Inject dues into additional details so calculator can pick it up
				Object additionalDetailObj = waterConnectionRequest.getWaterConnection().getAdditionalDetails();
				java.util.Map<String, Object> additionalDetails = null;
				if (additionalDetailObj instanceof java.util.Map) {
					additionalDetails = (java.util.Map<String, Object>) additionalDetailObj;
				} else if (additionalDetailObj != null) {
					try {
						com.fasterxml.jackson.databind.ObjectMapper objMapper = new com.fasterxml.jackson.databind.ObjectMapper();
						additionalDetails = objMapper.convertValue(additionalDetailObj, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>(){});
					} catch (Exception e) {}
				}
				if (additionalDetails == null) {
					additionalDetails = new java.util.HashMap<>();
				}
				additionalDetails.put("knoDues", totalKnoDues);
				waterConnectionRequest.getWaterConnection().setAdditionalDetails(additionalDetails);

				calculationService.generateDemandForApproval(waterConnectionRequest, property);
				isNoPayment = false;
			} else {
				// No K-number dues — check if the WS.ONE_TIME_FEE bill has any remaining amount
				isNoPayment = calculationService.fetchBillForApplication(
						waterConnectionRequest.getWaterConnection().getTenantId(),
						waterConnectionRequest.getWaterConnection().getApplicationNo(),
						waterConnectionRequest.getRequestInfo()
				);
				log.info("[WS-AUTO-ACTIVATE] fetchBillForApplication result: isNoPayment = {} (true = no extra payment, false = extra payment due)",
						isNoPayment);
			}

			if (isNoPayment) {
				log.info("[WS-AUTO-ACTIVATE] NO extra payment due — setting comment to WS_NO_PAYMENT, will auto-activate after workflow transition");
				waterConnectionRequest.getWaterConnection().getProcessInstance().setComment(WORKFLOW_NO_PAYMENT_CODE);
			} else {
				log.info("[WS-AUTO-ACTIVATE] EXTRA payment is due — citizen must pay. Application will move to PENDING_FOR_FINAL_PAYMENT");
			}
		}
		log.info("[WS-AUTO-ACTIVATE] Calling workflow transition with action: {}", currentAction);
		wfIntegrator.callWorkFlow(waterConnectionRequest, property);
		log.info("[WS-AUTO-ACTIVATE] After workflow transition, applicationStatus = {}",
				waterConnectionRequest.getWaterConnection().getApplicationStatus());
		waterDaoImpl.pushForEditNotification(waterConnectionRequest, isStateUpdatable);
		enrichmentService.enrichFileStoreIds(waterConnectionRequest);
		enrichmentService.postStatusEnrichment(waterConnectionRequest);

		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.updateWaterConnection(waterConnectionRequest, isStateUpdatable);

		enrichmentService.postForMeterReading(waterConnectionRequest,  WCConstants.UPDATE_APPLICATION);
		if (!StringUtils.isEmpty(waterConnectionRequest.getWaterConnection().getTenantId()))
			criteria.setTenantId(waterConnectionRequest.getWaterConnection().getTenantId());
		enrichmentService.enrichProcessInstance(Arrays.asList(waterConnectionRequest.getWaterConnection()), criteria, waterConnectionRequest.getRequestInfo());

		if("APPROVE_FOR_CONNECTION".equalsIgnoreCase(currentAction) && isNoPayment){
			log.info("[WS-AUTO-ACTIVATE] Triggering noPaymentWorkflow() for auto K-number generation and auto-activation...");
			paymentUpdateService.noPaymentWorkflow(waterConnectionRequest, property, waterConnectionRequest.getRequestInfo());
			log.info("[WS-AUTO-ACTIVATE] noPaymentWorkflow() completed. ConnectionNo (K-Number): {}, Status: {}",
					waterConnectionRequest.getWaterConnection().getConnectionNo(),
					waterConnectionRequest.getWaterConnection().getApplicationStatus());
		}
		log.info("[WS-AUTO-ACTIVATE] ===== UPDATE WATER CONNECTION END =====");

		waterConnectionRequest.setWaterConnection(decryptConnectionDetails(waterConnectionRequest.getWaterConnection(), waterConnectionRequest.getRequestInfo()));

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}


	public List<WaterConnection> updateWaterConnectionForDisconnectFlow(WaterConnectionRequest waterConnectionRequest) {

		SearchCriteria criteria = new SearchCriteria();
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, WCConstants.DISCONNECT_CONNECTION);
		mDMSValidator.validateMasterData(waterConnectionRequest,WCConstants.DISCONNECT_CONNECTION );
		
		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		BusinessService businessService = workflowService.getBusinessService(waterConnectionRequest.getWaterConnection().getTenantId(),
		waterConnectionRequest.getRequestInfo(), config.getDisconnectBusinessServiceName());
		WaterConnection searchResult = getConnectionForUpdateRequest(waterConnectionRequest.getWaterConnection().getTenantId(),waterConnectionRequest.getWaterConnection().getId(), waterConnectionRequest.getRequestInfo());

		boolean isPlumberSwapped = unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), searchResult.getPlumberInfo());
		if (isPlumberSwapped)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		String previousApplicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(),
				config.getDisconnectBusinessServiceName());
 
		boolean isStateUpdatable = waterServiceUtil.getStatusForUpdate(businessService, previousApplicationStatus);

		enrichmentService.enrichUpdateWaterConnection(waterConnectionRequest);
		actionValidator.validateUpdateRequest(waterConnectionRequest, businessService, previousApplicationStatus);
		waterConnectionValidator.validateUpdate(waterConnectionRequest, searchResult, WCConstants.DISCONNECT_CONNECTION);
		userService.updateUser(waterConnectionRequest, searchResult);
		//call calculator service to generate the demand for one time fee
		//if(!waterConnectionRequest.getWaterConnection().getIsDisconnectionTemporary())
		calculationService.calculateFeeAndGenerateDemand(waterConnectionRequest, property);
		//check whether amount is due
		boolean isNoPayment = false;
		WaterConnection waterConnection = waterConnectionRequest.getWaterConnection();
		ProcessInstance processInstance = waterConnection.getProcessInstance();
		if (WCConstants.APPROVE_DISCONNECTION_CONST.equalsIgnoreCase(processInstance.getAction())) {
			isNoPayment = calculationService.fetchBill(waterConnection.getTenantId(), waterConnection.getConnectionNo(), waterConnectionRequest.getRequestInfo());
			if (isNoPayment) {
				processInstance.setComment(WORKFLOW_NO_PAYMENT_CODE);
			}
		}
		//Call workflow
		wfIntegrator.callWorkFlow(waterConnectionRequest, property);
		//check for edit and send edit notification
		waterDaoImpl.pushForEditNotification(waterConnectionRequest, isStateUpdatable);
		//Enrich file store Id After payment
		enrichmentService.enrichFileStoreIds(waterConnectionRequest);
//		userService.createUser(waterConnectionRequest);
		enrichmentService.postStatusEnrichment(waterConnectionRequest);

		/* encrypt here */
		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		/* encrypt here for connection holder details */
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.updateWaterConnection(waterConnectionRequest, isStateUpdatable);

		// setting oldApplication Flag
		markOldApplication(waterConnectionRequest);
//		enrichmentService.postForMeterReading(waterConnectionRequest,  WCConstants.DISCONNECT_CONNECTION);
		if (!StringUtils.isEmpty(waterConnectionRequest.getWaterConnection().getTenantId()))
			criteria.setTenantId(waterConnectionRequest.getWaterConnection().getTenantId());
		enrichmentService.enrichProcessInstance(Arrays.asList(waterConnectionRequest.getWaterConnection()), criteria, waterConnectionRequest.getRequestInfo());

		//Updating the workflow from approve for disconnection to pending for disconnection execution when there are no dues
		if(WCConstants.APPROVE_DISCONNECTION_CONST.equalsIgnoreCase(processInstance.getAction()) && isNoPayment){
			paymentUpdateService.noPaymentWorkflow(waterConnectionRequest, property, waterConnectionRequest.getRequestInfo());
		}

		/* decrypt here */
		waterConnectionRequest.setWaterConnection(decryptConnectionDetails(waterConnectionRequest.getWaterConnection(), waterConnectionRequest.getRequestInfo()));

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}

	public List<WaterConnection> updateWaterConnectionForReconnectFlow(WaterConnectionRequest waterConnectionRequest) {

		SearchCriteria criteria = new SearchCriteria();
		
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, WCConstants.RECONNECTION);
		mDMSValidator.validateMasterData(waterConnectionRequest,WCConstants.RECONNECTION );
		
		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		BusinessService businessService = workflowService.getBusinessService(waterConnectionRequest.getWaterConnection().getTenantId(),
		waterConnectionRequest.getRequestInfo(), config.getReconnectBusinessServiceName());
		WaterConnection searchResult = getConnectionForUpdateRequest(waterConnectionRequest.getWaterConnection().getTenantId(),waterConnectionRequest.getWaterConnection().getId(), waterConnectionRequest.getRequestInfo());

		boolean isPlumberSwapped = unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), searchResult.getPlumberInfo());
		if (isPlumberSwapped)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		String previousApplicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(),
				config.getReconnectBusinessServiceName());
 
		boolean isStateUpdatable = waterServiceUtil.getStatusForUpdate(businessService, previousApplicationStatus);

		enrichmentService.enrichUpdateWaterConnection(waterConnectionRequest);
		actionValidator.validateUpdateRequest(waterConnectionRequest, businessService, previousApplicationStatus);
		waterConnectionValidator.validateUpdate(waterConnectionRequest, searchResult, WCConstants.RECONNECTION);
		userService.updateUser(waterConnectionRequest, searchResult);
		//call calculator service to generate the demand for one time fee
		//if(!waterConnectionRequest.getWaterConnection().getIsDisconnectionTemporary())
		calculationService.calculateFeeAndGenerateDemand(waterConnectionRequest, property);
		//check whether amount is due
		boolean isNoPayment = false;
		WaterConnection waterConnection = waterConnectionRequest.getWaterConnection();
		ProcessInstance processInstance = waterConnection.getProcessInstance();
		if (WCConstants.APPROVE_CONNECTION_CONST.equalsIgnoreCase(processInstance.getAction()) ) {
			isNoPayment = calculationService.fetchBillForReconnect(waterConnection.getTenantId(), waterConnection.getApplicationNo(), waterConnectionRequest.getRequestInfo());
			if (isNoPayment) {

				log.info(processInstance.getAction()+"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
				processInstance.setComment(WORKFLOW_NO_PAYMENT_CODE);
			}
		}
		//Call workflow
		wfIntegrator.callWorkFlow(waterConnectionRequest, property);
		//check for edit and send edit notification
		//waterDaoImpl.pushForEditNotification(waterConnectionRequest, isStateUpdatable);

		/* encrypt here */
		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		/* encrypt here for connection holder details */
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.updateWaterConnection(waterConnectionRequest, isStateUpdatable);

		// setting oldApplication Flag
		markOldApplication(waterConnectionRequest);
//		enrichmentService.postForMeterReading(waterConnectionRequest,  WCConstants.DISCONNECT_CONNECTION);
		if (!StringUtils.isEmpty(waterConnectionRequest.getWaterConnection().getTenantId()))
			criteria.setTenantId(waterConnectionRequest.getWaterConnection().getTenantId());
		enrichmentService.enrichProcessInstance(Arrays.asList(waterConnectionRequest.getWaterConnection()), criteria, waterConnectionRequest.getRequestInfo());

		//Updating the workflow from approve for disconnection to pending for disconnection execution when there are no dues
		if(WCConstants.APPROVE_CONNECTION_CONST.equalsIgnoreCase(processInstance.getAction()) && isNoPayment){
			log.info(processInstance.getAction() + isNoPayment + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
			paymentUpdateService.noPaymentWorkflow(waterConnectionRequest, property, waterConnectionRequest.getRequestInfo());
		}

		/* decrypt here */
		waterConnectionRequest.setWaterConnection(decryptConnectionDetails(waterConnectionRequest.getWaterConnection(), waterConnectionRequest.getRequestInfo()));

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}

	/**
	 * Search Water connection to be update
	 *
	 * @param id
	 * @param requestInfo
	 * @return water connection
	 */
	public WaterConnection getConnectionForUpdateRequest(String tenantId, String id, RequestInfo requestInfo) {
		Set<String> ids = new HashSet<>(Arrays.asList(id));
		SearchCriteria criteria = new SearchCriteria();
		criteria.setIds(ids);
		criteria.setTenantId(tenantId);
		List<WaterConnection> connections = getWaterConnectionsList(criteria, requestInfo);
		if (CollectionUtils.isEmpty(connections)) {
			StringBuilder builder = new StringBuilder();
			builder.append("WATER CONNECTION NOT FOUND FOR: ").append(id).append(" :ID");
			throw new CustomException("INVALID_WATERCONNECTION_SEARCH", builder.toString());
		}

		return connections.get(0);
	}

	private List<WaterConnection> getAllWaterApplications(WaterConnectionRequest waterConnectionRequest) {

		WaterConnection waterConnection = waterConnectionRequest.getWaterConnection();
        SearchCriteria criteria = SearchCriteria.builder()
				.connectionNumber(Stream.of(waterConnection.getConnectionNo().toString()).collect(Collectors.toSet())).build();
		criteria.setTenantId(waterConnection.getTenantId());
		if(waterConnectionRequest.isDisconnectRequest() ||
				!StringUtils.isEmpty(waterConnection.getConnectionNo()))
			criteria.setIsInternalCall(true);
		return search(criteria, waterConnectionRequest.getRequestInfo());
	}

	private List<WaterConnection> updateWaterConnectionForModifyFlow(WaterConnectionRequest waterConnectionRequest) {
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, WCConstants.MODIFY_CONNECTION);
		mDMSValidator.validateMasterData(waterConnectionRequest, WCConstants.MODIFY_CONNECTION);
		BusinessService businessService = workflowService.getBusinessService(
				waterConnectionRequest.getWaterConnection().getTenantId(), waterConnectionRequest.getRequestInfo(),
				config.getModifyWSBusinessServiceName());
		WaterConnection searchResult = getConnectionForUpdateRequest(waterConnectionRequest.getWaterConnection().getTenantId(),
				waterConnectionRequest.getWaterConnection().getId(), waterConnectionRequest.getRequestInfo());

		boolean isPlumberSwapped = unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), searchResult.getPlumberInfo());
		if (isPlumberSwapped)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		String previousApplicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(), config.getModifyWSBusinessServiceName());
		enrichmentService.enrichUpdateWaterConnection(waterConnectionRequest);
		actionValidator.validateUpdateRequest(waterConnectionRequest, businessService, previousApplicationStatus);
		userService.updateUser(waterConnectionRequest, searchResult);
		waterConnectionValidator.validateUpdate(waterConnectionRequest, searchResult, WCConstants.MODIFY_CONNECTION);
		wfIntegrator.callWorkFlow(waterConnectionRequest, property);
		boolean isStateUpdatable = waterServiceUtil.getStatusForUpdate(businessService, previousApplicationStatus);

		//check for edit and send edit notification
		waterDaoImpl.pushForEditNotification(waterConnectionRequest, isStateUpdatable);

		/* encrypt here */
		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		/* encrypt here for connection holder details */
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.updateWaterConnection(waterConnectionRequest, isStateUpdatable);

		// setting oldApplication Flag
		markOldApplication(waterConnectionRequest);
		enrichmentService.postForMeterReading(waterConnectionRequest, WCConstants.MODIFY_CONNECTION);

		/* decrypt here */
		waterConnectionRequest.setWaterConnection(decryptConnectionDetails(waterConnectionRequest.getWaterConnection(), waterConnectionRequest.getRequestInfo()));

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}

	public void markOldApplication(WaterConnectionRequest waterConnectionRequest) {
		if (waterConnectionRequest.getWaterConnection().getProcessInstance().getAction().equalsIgnoreCase(APPROVE_CONNECTION)) {
			String currentModifiedApplicationNo = waterConnectionRequest.getWaterConnection().getApplicationNo();
			List<WaterConnection> previousConnectionsList = getAllWaterApplications(waterConnectionRequest);

			for(WaterConnection waterConnection:previousConnectionsList){
				if(!waterConnection.getOldApplication() && !(waterConnection.getApplicationNo().equalsIgnoreCase(currentModifiedApplicationNo))){
					waterConnection.setOldApplication(Boolean.TRUE);
					waterConnection = encryptConnectionDetails(waterConnection);
					WaterConnectionRequest previousWaterConnectionRequest = WaterConnectionRequest.builder().requestInfo(waterConnectionRequest.getRequestInfo()).waterConnection(waterConnection).build();
					waterDao.updateWaterConnection(previousWaterConnectionRequest,Boolean.TRUE);
				}
			}
		}
	}

	public WaterConnectionResponse plainSearch(SearchCriteria criteria, RequestInfo requestInfo) {
		criteria.setIsSkipLevelSearch(Boolean.TRUE);
		WaterConnectionResponse waterConnection = getWaterConnectionsListForPlainSearch(criteria, requestInfo);
		waterConnection.setWaterConnection(enrichmentService.enrichPropertyDetails(waterConnection.getWaterConnection(), criteria, requestInfo));
		waterConnectionValidator.validatePropertyForConnection(waterConnection.getWaterConnection());
		enrichmentService.enrichConnectionHolderDeatils(waterConnection.getWaterConnection(), criteria, requestInfo);
		enrichmentService.enrichDocumentNumbers(waterConnection.getWaterConnection());
		return waterConnection;
	}

	public WaterConnectionResponse getWaterConnectionsListForPlainSearch(SearchCriteria criteria,
																		 RequestInfo requestInfo) {
		return waterDao.getWaterConnectionListForPlainSearch(criteria, requestInfo);
	}

	/**
	 * Replace the requestBody data and data from dB for those fields that come as masked (data containing "*" is
	 * identified as masked) in requestBody
	 *
	 * @param waterConnectionRequest contains requestBody of waterConnection
	 * @param previousConnectionsList contains unmasked data from the search result of waterConnection
	 *
	 */
	private void swapConnHolders(WaterConnectionRequest waterConnectionRequest, List<WaterConnection> previousConnectionsList) {

		if (!ObjectUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionHolders()) &&
				!ObjectUtils.isEmpty(previousConnectionsList.get(0).getConnectionHolders())) {

			List<OwnerInfo> connHolders = waterConnectionRequest.getWaterConnection().getConnectionHolders();
			List<OwnerInfo> searchedConnHolders = previousConnectionsList.get(0).getConnectionHolders();

			if (!ObjectUtils.isEmpty(connHolders.get(0).getOwnerType()) &&
					!ObjectUtils.isEmpty(searchedConnHolders.get(0).getOwnerType())) {

				int k = 0;
				for (OwnerInfo holderInfo : connHolders) {
					if (holderInfo.getOwnerType().contains("*"))
						holderInfo.setOwnerType(searchedConnHolders.get(k).getOwnerType());
					if (holderInfo.getRelationship().contains("*"))
						holderInfo.setRelationship(searchedConnHolders.get(k).getRelationship());
					k++;

				}
			}
		}
	}

	/**
	 * Encrypts waterConnection details
	 *
	 * @param waterConnection contains  waterConnection object
	 *
	 */
	private WaterConnection encryptConnectionDetails(WaterConnection waterConnection) {
		/* encrypt here */
		waterConnection = encryptionDecryptionUtil.encryptObject(waterConnection, WNS_ENCRYPTION_MODEL, WaterConnection.class);
		waterConnection = encryptionDecryptionUtil.encryptObject(waterConnection, WNS_PLUMBER_ENCRYPTION_MODEL, WaterConnection.class);
		return waterConnection;
	}

	/**
	 * Encrypts connectionOwner details coming from user service
	 *
	 * @param waterConnection contains  waterConnection object
	 *
	 */
	private WaterConnection encryptConnectionHolderDetails(WaterConnection waterConnection) {
		/* encrypt here */
		List<OwnerInfo> connectionHolders = waterConnection.getConnectionHolders();
		if (!CollectionUtils.isEmpty(connectionHolders)) {
			int k = 0;
			for (OwnerInfo holderInfo : connectionHolders) {
				waterConnection.getConnectionHolders().set(k, encryptionDecryptionUtil.encryptObject(holderInfo, WNS_OWNER_ENCRYPTION_MODEL, OwnerInfo.class));
				k++;
			}
		}
		return waterConnection;
	}

	/**
	 * Decrypts waterConnection details
	 *
	 * @param waterConnection contains  waterConnection object
	 */
	private WaterConnection decryptConnectionDetails(WaterConnection waterConnection, RequestInfo requestInfo) {
		/* decrypt here */
		waterConnection = encryptionDecryptionUtil.decryptObject(waterConnection, WNS_ENCRYPTION_MODEL, WaterConnection.class, requestInfo);
		waterConnection = encryptionDecryptionUtil.decryptObject(waterConnection, WNS_PLUMBER_ENCRYPTION_MODEL, WaterConnection.class, requestInfo);
		List<OwnerInfo> connectionHolders = waterConnection.getConnectionHolders();
		if (!CollectionUtils.isEmpty(connectionHolders))
			waterConnection.setConnectionHolders(encryptionDecryptionUtil.decryptObject(connectionHolders, WNS_OWNER_ENCRYPTION_MODEL, OwnerInfo.class, requestInfo));

		return waterConnection;
	}

	private List<WaterConnection> updateWaterConnectionForMutationFlow(WaterConnectionRequest waterConnectionRequest) {
		waterConnectionValidator.validateWaterConnection(waterConnectionRequest, WCConstants.MUTATION_CONNECTION);
		mDMSValidator.validateMasterData(waterConnectionRequest, WCConstants.MUTATION_CONNECTION);
		BusinessService businessService = workflowService.getBusinessService(
				waterConnectionRequest.getWaterConnection().getTenantId(), waterConnectionRequest.getRequestInfo(),
				config.getMutationWSBusinessServiceName());
		WaterConnection searchResult = getConnectionForUpdateRequest(waterConnectionRequest.getWaterConnection().getTenantId(),
				waterConnectionRequest.getWaterConnection().getId(), waterConnectionRequest.getRequestInfo());

		boolean isPlumberSwapped = unmaskingUtil.getUnmaskedPlumberInfo(waterConnectionRequest.getWaterConnection().getPlumberInfo(), searchResult.getPlumberInfo());
		if (isPlumberSwapped)
			waterConnectionRequest.setWaterConnection(encryptionDecryptionUtil.decryptObject(waterConnectionRequest.getWaterConnection(), "WnSConnectionPlumberDecrypDisabled", WaterConnection.class, waterConnectionRequest.getRequestInfo()));

		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);
		validateProperty.validatePropertyFields(property,waterConnectionRequest.getRequestInfo());
		String previousApplicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(), config.getMutationWSBusinessServiceName());
		enrichmentService.enrichUpdateWaterConnection(waterConnectionRequest);
		actionValidator.validateUpdateRequest(waterConnectionRequest, businessService, previousApplicationStatus);
		userService.updateUser(waterConnectionRequest, searchResult);
		waterConnectionValidator.validateUpdate(waterConnectionRequest, searchResult, WCConstants.MUTATION_CONNECTION);
		// Call calculator service to generate demand for mutation fee
		calculationService.calculateFeeAndGenerateDemand(waterConnectionRequest, property);

		wfIntegrator.callWorkFlow(waterConnectionRequest, property);
		boolean isStateUpdatable = waterServiceUtil.getStatusForUpdate(businessService, previousApplicationStatus);

		//check for edit and send edit notification
		waterDaoImpl.pushForEditNotification(waterConnectionRequest, isStateUpdatable);

		/* encrypt here */
		waterConnectionRequest.setWaterConnection(encryptConnectionDetails(waterConnectionRequest.getWaterConnection()));
		/* encrypt here for connection holder details */
		waterConnectionRequest.setWaterConnection(encryptConnectionHolderDetails(waterConnectionRequest.getWaterConnection()));

		waterDao.updateWaterConnection(waterConnectionRequest, isStateUpdatable);

		// setting oldApplication Flag
		markOldApplication(waterConnectionRequest);
		enrichmentService.postForMeterReading(waterConnectionRequest, WCConstants.MUTATION_CONNECTION);

		/* decrypt here */
		waterConnectionRequest.setWaterConnection(decryptConnectionDetails(waterConnectionRequest.getWaterConnection(), waterConnectionRequest.getRequestInfo()));

		return Arrays.asList(waterConnectionRequest.getWaterConnection());
	}

}