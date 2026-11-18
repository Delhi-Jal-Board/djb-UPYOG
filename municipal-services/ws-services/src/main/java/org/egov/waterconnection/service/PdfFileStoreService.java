package org.egov.waterconnection.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.model.CustomException;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.constants.WCConstants;
import org.egov.waterconnection.util.NotificationUtil;
import org.egov.waterconnection.web.models.Calculation;
import org.egov.waterconnection.web.models.CalculationCriteria;
import org.egov.waterconnection.web.models.CalculationReq;
import org.egov.waterconnection.web.models.CalculationRes;
import org.egov.waterconnection.web.models.Property;
import org.egov.waterconnection.web.models.WaterConnectionRequest;
import org.egov.waterconnection.repository.ServiceRequestRepository;
import org.egov.waterconnection.repository.WaterDaoImpl;
import org.egov.waterconnection.util.WaterServicesUtil;
import org.egov.waterconnection.validator.ValidateProperty;
import org.egov.waterconnection.workflow.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;

import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

@Service
@Slf4j
public class PdfFileStoreService {

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private WaterServicesUtil waterServiceUtil;

	@Autowired
	private ObjectMapper mapper;

	@Autowired
	private WSConfiguration config;

	@Autowired
	private WaterDaoImpl waterDao;

	@Autowired
	private WorkflowService workflowService;
	
	@Autowired
	private ValidateProperty validateProperty;

	@Autowired
	private NotificationUtil notificationUtil;

	@Autowired
	private MultiStateInstanceUtil centralInstanceUtil;

	@Autowired
	private org.egov.waterconnection.repository.SiteInspectionRepository siteInspectionRepository;

	String tenantIdReplacer = "$tenantId";
	String fileStoreIdsReplacer = "$.filestoreIds";
	String urlReplacer = "url";
	String requestInfoReplacer = "RequestInfo";
	String WaterConnectionReplacer = "WnsConnection";
	String fileStoreIdReplacer = "$fileStoreIds";
	String totalAmount = "totalAmount";
	String applicationFee = "applicationFee";
	String serviceFee = "serviceFee";
	String tax = "tax";
	String pdfTaxhead = "pdfTaxhead";
	String pdfApplicationKey = "$applicationkey";
	String sla = "sla";
	String slaDate = "slaDate";
	String sanctionLetterDate = "sanctionLetterDate";
	String tenantName = "tenantName";
	String service = "service";
	String propertyKey = "property";
	

	/**
	 * Get fileStore Id's
	 * 
	 * @param waterConnectionRequest WaterConnectionRequest Object
	 * @param property Property Object
	 * @param applicationKey ApplicationKey
	 * @return file store id
	 */
	public String getFileStoreId(WaterConnectionRequest waterConnectionRequest, Property property, String applicationKey) {
		CalculationCriteria criteria = CalculationCriteria.builder().applicationNo(waterConnectionRequest.getWaterConnection().getApplicationNo())
				.waterConnection(waterConnectionRequest.getWaterConnection()).tenantId(property.getTenantId()).build();
		CalculationReq calRequest = CalculationReq.builder().calculationCriteria(Arrays.asList(criteria))
				.requestInfo(waterConnectionRequest.getRequestInfo()).isconnectionCalculation(false).isDisconnectionRequest(false).isReconnectionRequest(false).build();
		String applicationStatus = workflowService.getApplicationStatus(waterConnectionRequest.getRequestInfo(),
				waterConnectionRequest.getWaterConnection().getApplicationNo(),
				waterConnectionRequest.getWaterConnection().getTenantId(),
				config.getBusinessServiceValue());
		try {
			Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getEstimationURL(), calRequest);
			CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);
			JSONObject waterObject = mapper.convertValue(waterConnectionRequest.getWaterConnection(), JSONObject.class);
			if (CollectionUtils.isEmpty(calResponse.getCalculation())) {
				throw new CustomException("NO_ESTIMATION_FOUND", "Estimation not found!!!");
			}
			
			Optional<Calculation> calculationList = calResponse.getCalculation().stream().findFirst();
			if(calculationList.isPresent()) {
				Calculation cal = calculationList.get();
				waterObject.put(totalAmount, cal.getTotalAmount());
				waterObject.put(applicationFee, cal.getFee());
				waterObject.put(serviceFee, cal.getCharge());
				waterObject.put(tax, cal.getTaxAmount());
				cal.getTaxHeadEstimates().forEach(item -> {
					//We need to remove WS_ --> So that PDF configuration refers the common for both Water & Sewerage
					item.setTaxHeadCode(item.getTaxHeadCode().substring(3));
				});
				waterObject.put(pdfTaxhead, cal.getTaxHeadEstimates());
				log.info("Tax heads are ::" +  cal.getTaxHeadEstimates());			

			}
			
			
			waterObject.put(sanctionLetterDate, System.currentTimeMillis());
			BigDecimal slaDays = workflowService.getSlaForState(waterConnectionRequest.getWaterConnection().getTenantId(), 
					waterConnectionRequest.getRequestInfo(),applicationStatus, config.getBusinessServiceValue());
			waterObject.put(sla, slaDays.divide(BigDecimal.valueOf(WCConstants.DAYS_CONST)));
			waterObject.put(slaDate, slaDays.add(new BigDecimal(System.currentTimeMillis())));
			String[] tenantDetails = property.getTenantId().split("\\.");
			String tenantId = property.getTenantId();
			if(tenantDetails.length > centralInstanceUtil.getStateLevelTenantIdLength()){
				tenantId = tenantDetails[0] + "." + tenantDetails[1];
			}
			if(tenantDetails.length > 1)
			{
				waterObject.put(tenantName, tenantDetails[1].toUpperCase());
			}
			waterObject.put(propertyKey, property);
			waterObject.put(service, "WATER");
			return getFileStoreIdFromPDFService(waterObject, waterConnectionRequest.getRequestInfo(), tenantId, applicationKey);
		} catch (Exception ex) {
			log.error("Calculation response error!!", ex);
			throw new CustomException("WATER_CALCULATION_EXCEPTION", "Calculation response can not parsed!!!");
		}
	}

	/**
	 * Get file store id from PDF service
	 * 
	 * @param waterObject WaterConnection Json Object
	 * @param requestInfo RequestInfo
	 * @param tenantId Tenant Id
	 * @param applicationKey Application Key String
	 * @return file store id
	 */
	private String getFileStoreIdFromPDFService(JSONObject waterObject, RequestInfo requestInfo, String tenantId,
												String applicationKey) {
		JSONArray waterConnectionList = new JSONArray();
		waterConnectionList.add(waterObject);
		JSONObject requestPayload = new JSONObject();
		requestPayload.put(requestInfoReplacer, requestInfo);
		requestPayload.put(WaterConnectionReplacer, waterConnectionList);
		requestPayload.put("WaterConnection", waterConnectionList);
		try {
			StringBuilder builder = new StringBuilder();
			builder.append(config.getPdfServiceHost());
			String pdfLink = config.getPdfServiceLink();
			pdfLink = pdfLink.replace(tenantIdReplacer, tenantId).replace(pdfApplicationKey, applicationKey);
			builder.append(pdfLink);
			Object response = serviceRequestRepository.fetchResult(builder, requestPayload);
			DocumentContext responseContext = JsonPath.parse(response);
			List<Object> fileStoreIds = responseContext.read("$.filestoreIds");
			if (CollectionUtils.isEmpty(fileStoreIds)) {
				throw new CustomException("EMPTY_FILESTORE_IDS_FROM_PDF_SERVICE",
						"NO file store id found from pdf service");
			}
			return fileStoreIds.get(0).toString();
		} catch (Exception ex) {
			throw new CustomException("WATER_FILESTORE_PDF_EXCEPTION", "PDF response can not parsed!!!");
		}
	}

	/**
	 * Get fileStore Id for Consent Letter / Information Notice
	 *
	 * @param waterConnectionRequest WaterConnectionRequest Object
	 * @param property Property Object
	 * @param applicationKey ApplicationKey
	 * @return file store id
	 */
	public String getConsentFileStoreId(WaterConnectionRequest waterConnectionRequest, Property property, String applicationKey) {
		try {
			JSONObject waterObject = mapper.convertValue(waterConnectionRequest.getWaterConnection(), JSONObject.class);

			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
			LocalDate today = LocalDate.now();
			String approvalDate = today.format(formatter);
			String meterInstallationDate = today.plusDays(7).format(formatter);

			waterObject.put("approvalDate", approvalDate);
			waterObject.put("meterInstallationDate", meterInstallationDate);

			// Static Plumber Details
			Map<String, Object> plumberMap = new HashMap<>();
			plumberMap.put("name", "Sh. Ramesh Kumar");
			plumberMap.put("agency", "M/s Delhi Plumbing Solutions");
			plumberMap.put("mobileNumber", "9876543210");
			plumberMap.put("licenceNo", "DJB/LIC/PLM/2026/0452");
			waterObject.put("plumberInfo", plumberMap);

			String[] tenantDetails = property.getTenantId().split("\\.");
			String tenantId = property.getTenantId();
			if (tenantDetails.length > centralInstanceUtil.getStateLevelTenantIdLength()) {
				tenantId = tenantDetails[0] + "." + tenantDetails[1];
			}
			if (tenantDetails.length > 1) {
				waterObject.put(tenantName, tenantDetails[1].toUpperCase());
			}
			waterObject.put(propertyKey, property);
			waterObject.put(service, "WATER");

			return getFileStoreIdFromPDFService(waterObject, waterConnectionRequest.getRequestInfo(), tenantId, applicationKey);
		} catch (Exception ex) {
			log.error("Error generating Consent Letter PDF from PDF service: {}", ex.getMessage(), ex);
			return null;
		}
	}

	/**
	 * Get fileStore Id for Disconnection Notice
	 *
	 * @param waterConnectionRequest WaterConnectionRequest Object
	 * @param property Property Object
	 * @param applicationKey ApplicationKey
	 * @return file store id
	 */
	public String getDisconnectionFileStoreId(WaterConnectionRequest waterConnectionRequest, Property property, String applicationKey) {
		try {
			JSONObject waterObject = mapper.convertValue(waterConnectionRequest.getWaterConnection(), JSONObject.class);

			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
			LocalDate today = LocalDate.now();
			String disconnectionDate = today.format(formatter);

			org.egov.waterconnection.web.models.WaterConnection connection = waterConnectionRequest.getWaterConnection();

			// KNO / Connection No
			String kno = connection.getConnectionNo();
			if (org.apache.commons.lang3.StringUtils.isEmpty(kno)) {
				kno = connection.getOldConnectionNo();
			}
			if (org.apache.commons.lang3.StringUtils.isEmpty(kno)) {
				kno = connection.getApplicationNo();
			}
			waterObject.put("kno", kno);
			waterObject.put("applicationNo", connection.getApplicationNo());
			waterObject.put("disconnectionDate", disconnectionDate);

			// Disconnection Reason
			String reason = connection.getDisconnectionReason();
			if (org.apache.commons.lang3.StringUtils.isEmpty(reason)) {
				reason = "Consumer Request / Meter Disconnection";
			}
			waterObject.put("disconnectionReason", reason);

			// Consumer Name and Address
			String consumerName = "Consumer";
			StringBuilder addressBuilder = new StringBuilder();
			if (property != null) {
				if (!CollectionUtils.isEmpty(property.getOwners()) && property.getOwners().get(0) != null) {
					consumerName = property.getOwners().get(0).getName();
				}
				if (property.getAddress() != null) {
					org.egov.waterconnection.web.models.Address addr = property.getAddress();
					if (!org.apache.commons.lang3.StringUtils.isEmpty(addr.getDoorNo())) addressBuilder.append(addr.getDoorNo()).append(", ");
					if (!org.apache.commons.lang3.StringUtils.isEmpty(addr.getBuildingName())) addressBuilder.append(addr.getBuildingName()).append(", ");
					if (!org.apache.commons.lang3.StringUtils.isEmpty(addr.getStreet())) addressBuilder.append(addr.getStreet()).append(", ");
					if (addr.getLocality() != null && !org.apache.commons.lang3.StringUtils.isEmpty(addr.getLocality().getName())) {
						addressBuilder.append(addr.getLocality().getName()).append(", ");
					}
					if (!org.apache.commons.lang3.StringUtils.isEmpty(addr.getCity())) addressBuilder.append(addr.getCity());
				}
			}
			String consumerAddress = addressBuilder.length() > 0 ? addressBuilder.toString() : "Delhi";
			waterObject.put("consumerName", consumerName);
			waterObject.put("consumerAddress", consumerAddress);

			// Zone and ZRO
			String zone = "Delhi Zone";
			String zro = "ZRO Office";
			if (property != null && property.getAddress() != null) {
				if (!org.apache.commons.lang3.StringUtils.isEmpty(property.getAddress().getZone())) {
					zone = property.getAddress().getZone();
				} else if (property.getAddress().getLocality() != null && !org.apache.commons.lang3.StringUtils.isEmpty(property.getAddress().getLocality().getZone())) {
					zone = property.getAddress().getLocality().getZone();
				}
				if (!org.apache.commons.lang3.StringUtils.isEmpty(property.getAddress().getZroLocation())) {
					zro = property.getAddress().getZroLocation();
				}
			}
			if (connection.getAdditionalDetails() != null) {
				try {
					Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
					if (addDetails.get("zone") != null) zone = String.valueOf(addDetails.get("zone"));
					if (addDetails.get("zro") != null) zro = String.valueOf(addDetails.get("zro"));
					else if (addDetails.get("zroLocation") != null) zro = String.valueOf(addDetails.get("zroLocation"));
				} catch (Exception e) {
					log.warn("Error reading zone/zro from additionalDetails", e);
				}
			}
			if (!zone.toLowerCase().contains("zone")) zone = zone + " Zone";
			if (!zro.toUpperCase().contains("ZRO")) zro = "ZRO " + zro;
			waterObject.put("zone", zone);
			waterObject.put("zro", zro);

			// Plumber Details
			waterObject.put("plumberName", "Sh. Ramesh Kumar");
			waterObject.put("plumberCompany", "M/s Delhi Plumbing Solutions");
			waterObject.put("plumberMobile", "9876543210");
			waterObject.put("plumberLicense", "DJB/LIC/PLM/2026/0452");

			String[] tenantDetails = (property != null && property.getTenantId() != null) 
					? property.getTenantId().split("\\.") : connection.getTenantId().split("\\.");
			String tenantId = (property != null && property.getTenantId() != null) 
					? property.getTenantId() : connection.getTenantId();
			if (tenantDetails.length > centralInstanceUtil.getStateLevelTenantIdLength()) {
				tenantId = tenantDetails[0] + "." + tenantDetails[1];
			}
			if (tenantDetails.length > 1) {
				waterObject.put(tenantName, tenantDetails[1].toUpperCase());
			}
			if (property != null) {
				waterObject.put(propertyKey, property);
			}
			waterObject.put(service, "WATER");

			String filestoreId = getFileStoreIdFromPDFService(waterObject, waterConnectionRequest.getRequestInfo(), tenantId, applicationKey);
			if (!org.apache.commons.lang3.StringUtils.isEmpty(filestoreId)) {
				try {
					com.fasterxml.jackson.databind.node.ObjectNode updateDetails = mapper.createObjectNode();
					updateDetails.put(WCConstants.DISCONNECTION_LETTER_FILESTORE_ID, filestoreId);
					siteInspectionRepository.updateConnectionAdditionalDetails(
							connection.getTenantId(),
							connection.getId(),
							connection.getApplicationNo(),
							updateDetails,
							waterConnectionRequest.getRequestInfo()
					);
				} catch (Exception e) {
					log.warn("Could not directly update additionalDetails for disconnection filestore id: {}", e.getMessage());
				}
			}
			return filestoreId;
		} catch (Exception ex) {
			log.error("Error generating Disconnection Notice PDF from PDF service: {}", ex.getMessage(), ex);
			return null;
		}
	}

	@SuppressWarnings("unchecked")
	public void process(WaterConnectionRequest waterConnectionRequest, String topic) {

		Property property = validateProperty.getOrValidateProperty(waterConnectionRequest);

		HashMap<String, Object> addDetail = mapper
				.convertValue(waterConnectionRequest.getWaterConnection().getAdditionalDetails(), HashMap.class);
		if (waterConnectionRequest.getWaterConnection().getApplicationStatus()
				.equalsIgnoreCase(WCConstants.PENDING_APPROVAL_FOR_CONNECTION_CODE)) {
			addDetail.put(WCConstants.ESTIMATION_DATE_CONST, System.currentTimeMillis());
			waterConnectionRequest.getWaterConnection().setAdditionalDetails(addDetail);
			addDetail.put(WCConstants.ESTIMATION_FILESTORE_ID,
					getFileStoreId(waterConnectionRequest, property, WCConstants.PDF_ESTIMATION_KEY));
		}
		if (waterConnectionRequest.getWaterConnection().getProcessInstance().getAction()
				.equalsIgnoreCase(WCConstants.ACTION_PAY)
				&& addDetail.getOrDefault(WCConstants.SANCTION_LETTER_FILESTORE_ID, null) == null) {
			addDetail.put(WCConstants.SANCTION_LETTER_FILESTORE_ID,
					getFileStoreId(waterConnectionRequest, property, WCConstants.PDF_SANCTION_KEY));
		}

		String action = (waterConnectionRequest.getWaterConnection().getProcessInstance() != null)
				? waterConnectionRequest.getWaterConnection().getProcessInstance().getAction() : "";
		if ((WCConstants.APPROVE_CONNECTION_CONST.equalsIgnoreCase(action)
				|| WCConstants.APPROVE_CONNECTION.equalsIgnoreCase(action))
				&& addDetail.getOrDefault(WCConstants.CONSENT_LETTER_FILESTORE_ID, null) == null) {
			String consentFileStoreId = getConsentFileStoreId(waterConnectionRequest, property, WCConstants.PDF_CONSENT_KEY);
			if (consentFileStoreId != null) {
				addDetail.put(WCConstants.CONSENT_LETTER_FILESTORE_ID, consentFileStoreId);
			}
		}

		if ((WCConstants.APPROVE_DISCONNECTION_CONST.equalsIgnoreCase(action)
				|| "APPROVE_FOR_DISCONNECTION".equalsIgnoreCase(action))
				&& addDetail.getOrDefault(WCConstants.DISCONNECTION_LETTER_FILESTORE_ID, null) == null) {
			String disconnectionFileStoreId = getDisconnectionFileStoreId(waterConnectionRequest, property, WCConstants.PDF_DISCONNECTION_KEY);
			if (disconnectionFileStoreId != null) {
				addDetail.put(WCConstants.DISCONNECTION_LETTER_FILESTORE_ID, disconnectionFileStoreId);
			}
		}

		waterConnectionRequest.getWaterConnection().setAdditionalDetails(addDetail);
		waterDao.saveFileStoreIds(waterConnectionRequest);
	}
}
