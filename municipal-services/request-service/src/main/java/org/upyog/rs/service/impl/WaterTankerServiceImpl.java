package org.upyog.rs.service.impl;

import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.upyog.rs.util.VendorUtil;

import digit.models.coremodels.UserDetailResponse;
import org.apache.commons.lang.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.constant.RequestServiceConstants;
import org.upyog.rs.enums.RequestServiceStatus;
import org.upyog.rs.exception.DuplicateMobileNumberException;
import org.upyog.rs.repository.RequestServiceRepository;
import org.upyog.rs.service.DemandService;
import org.upyog.rs.service.EnrichmentService;
import org.upyog.rs.service.UserService;
import org.upyog.rs.service.WaterTankerService;
import org.upyog.rs.service.WorkflowService;
import org.upyog.rs.util.RequestServiceUtil;
import org.upyog.rs.web.models.*;
import org.upyog.rs.web.models.waterTanker.*;
import org.upyog.rs.web.models.workflow.State;

import digit.models.coremodels.PaymentRequest;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class WaterTankerServiceImpl implements WaterTankerService {

	@Autowired
	EnrichmentService enrichmentService;

	@Autowired
	RequestServiceRepository requestServiceRepository;

	@Autowired
	WorkflowService workflowService;

	@Autowired
	DemandService demandService;

	@Autowired
	RequestServiceConfiguration config;

	@Autowired
	private UserService userService;

	@Autowired
	private VendorUtil vendorUtil;

@Override
public WaterTankerBookingDetail createNewWaterTankerBookingRequest(WaterTankerBookingRequest waterTankerRequest) {
	WaterTankerBookingDetail waterTankerDetail = waterTankerRequest.getWaterTankerBookingDetail();
	String userUuid = waterTankerRequest.getRequestInfo().getUserInfo().getUuid();

	List<WaterTankerBookingDetail> existingBookings = Collections.emptyList();

	if (waterTankerDetail.getBookingNo() != null
			&& !waterTankerDetail.getBookingNo().trim().isEmpty()) {

		WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
				.bookingNo(waterTankerDetail.getBookingNo())
				.tenantId(waterTankerDetail.getTenantId())
				.build();

		existingBookings = requestServiceRepository.getWaterTankerBookingDetails(criteria);
	}

	WaterTankerBookingDetail activeBooking = null;
	activeBooking = existingBookings.stream()
			.filter(b -> !"TANKER_DELIVERED".equalsIgnoreCase(b.getBookingStatus()) &&
					!"CANCELLED".equalsIgnoreCase(b.getBookingStatus()) &&
					!"REJECTED".equalsIgnoreCase(b.getBookingStatus()) &&
					!"MISSED".equalsIgnoreCase(b.getBookingStatus()))
			.findFirst()
			.orElse(null);

	// 3. CASE A: UPDATE EXISTING (An active request is still in progress)
	if (activeBooking != null) {
		log.info("Active booking {} found. Updating existing record in upyog_rs_water_tanker_booking_details.", activeBooking.getBookingNo());

		// Map existing IDs to the incoming request to trigger an UPDATE instead of INSERT
		waterTankerDetail.setBookingId(activeBooking.getBookingId());
		waterTankerDetail.setBookingNo(activeBooking.getBookingNo());

		// Map applicant and address IDs to update existing rows in related tables
		if(activeBooking.getApplicantDetail() != null) {
			waterTankerDetail.getApplicantDetail().setApplicantId(activeBooking.getApplicantDetail().getApplicantId());
			waterTankerDetail.getAddress().setApplicantId(activeBooking.getApplicantDetail().getApplicantId());
		}

		// Populate AuditDetails (Fixes Persister 'createdBy' crash)
		if (activeBooking.getAuditDetails() != null) {
			waterTankerDetail.setAuditDetails(activeBooking.getAuditDetails());
		}
		waterTankerDetail.getAuditDetails().setLastModifiedBy(userUuid);
		waterTankerDetail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());

		// Push to 'update-water-tanker-booking' topic
		requestServiceRepository.updateWaterTankerBooking(waterTankerRequest);
		return waterTankerDetail;
	}

	// 4. CASE B: CREATE NEW (No records found OR the previous one is DELIVERED)
	log.info("No active booking found (last was DELIVERED or brand new). Generating new record.");

	// This will generate a NEW UUID for booking_id and a NEW WT-DJB-XXXX booking_no
	enrichmentService.enrichCreateWaterTankerRequest(waterTankerRequest);

	// User enrichment logic
	try {
		org.upyog.rs.web.models.user.User user = userService.fetchExistingUser(
				waterTankerDetail.getTenantId(),
				waterTankerDetail.getApplicantDetail(),
				waterTankerRequest.getRequestInfo());
		if (user != null) {
			waterTankerDetail.setApplicantUuid(user.getUuid());
		}
	} catch (Exception e) {
		log.error("User enrichment failed, continuing with request data", e);
	}

	// 5. Workflow call for the NEW instance (Generates new process instance)
	workflowService.updateWorkflowStatus(null, waterTankerRequest);

	// 6. Save NEW record (Push to 'create-water-tanker-booking' topic)
	requestServiceRepository.saveWaterTankerBooking(waterTankerRequest);

	return waterTankerDetail;
}

	@Override
	public WaterTankerFixedPointDetail createFixedPointWaterTankerBookingRequest(WaterTankerFixedPointRequest waterTankerFixedPointRequest) {

		log.info("Create water tanker Fix Point for user : " + waterTankerFixedPointRequest.getRequestInfo().getUserInfo().getUuid()
				+ " for the request : " + waterTankerFixedPointRequest.getWaterTankerFixedPointDetail());

		String mobileNumber = waterTankerFixedPointRequest
				.getWaterTankerFixedPointDetail()
				.getApplicantDetail()
				.getMobileNumber();

		if (requestServiceRepository.existsByMobileNumber(mobileNumber)) {
			log.warn("Duplicate mobile number detected: {}. Blocking before ID generation.", mobileNumber);
			throw new DuplicateMobileNumberException(mobileNumber);

		}

		enrichmentService.enrichCreateFixedPointWaterTankerRequest(waterTankerFixedPointRequest);

		try {
			RequestInfo requestInfo = waterTankerFixedPointRequest.getRequestInfo();
			ApplicantDetail applicantDetail = waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getApplicantDetail();
			String tenantId = waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getTenantId();
			org.upyog.rs.web.models.user.User user = userService.fetchExistingUser(tenantId, applicantDetail, requestInfo);
		} catch (Exception e) {
			log.error("Error fetching or creating user: " + e.getMessage(), e);
			throw new RuntimeException("Failed to fetch/create user: " + e.getMessage(), e);
		}

		requestServiceRepository.saveFixedPointWaterTanker(waterTankerFixedPointRequest);

		WaterTankerFixedPointDetail waterTankerFixedPointDetail = waterTankerFixedPointRequest.getWaterTankerFixedPointDetail();

		return waterTankerFixedPointDetail;

	}



	@Override
	public WaterTankerFixedPointDetail updateFixedPointWaterTankerBookingRequest(
			WaterTankerFixedPointRequest waterTankerFixedPointRequest) {

		log.info("Update fixed point water tanker booking for user: "
				+ waterTankerFixedPointRequest.getRequestInfo().getUserInfo().getUuid()
				+ " for bookingId: "
				+ waterTankerFixedPointRequest.getWaterTankerFixedPointDetail());

		enrichmentService.enrichUpdateFixedPointWaterTankerRequest(waterTankerFixedPointRequest);

		requestServiceRepository.updateFixedPointWaterTanker(waterTankerFixedPointRequest);

		return waterTankerFixedPointRequest.getWaterTankerFixedPointDetail();
	}

	@Override
	public List<WaterTankerBookingDetail> getWaterTankerBookingDetails(RequestInfo requestInfo,
			WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria) {

		applyUserRoleRestrictions(requestInfo, waterTankerBookingSearchCriteria);
		enrichmentService.enrichSearchCriteriaWithIds(requestInfo, waterTankerBookingSearchCriteria);

		// If the user searched by a Vendor name, but that vendor doesn't exist, return empty immediately.
		if (!StringUtils.isEmpty(waterTankerBookingSearchCriteria.getVendorName())
				&& CollectionUtils.isEmpty(waterTankerBookingSearchCriteria.getVendorIds())) {
			return new ArrayList<>();
		}

		// Add this in WaterTankerServiceImpl inside getWaterTankerBookingDetails()
		if (!StringUtils.isEmpty(waterTankerBookingSearchCriteria.getVehicleName())
				&& CollectionUtils.isEmpty(waterTankerBookingSearchCriteria.getVehicleIds())) {
			return new ArrayList<>();
		}

		if (!StringUtils.isEmpty(waterTankerBookingSearchCriteria.getDriverName())
				&& CollectionUtils.isEmpty(waterTankerBookingSearchCriteria.getDriverIds())) {
			return new ArrayList<>();
		}

		// --- 2. DATABASE QUERY ---
		List<WaterTankerBookingDetail> applications = requestServiceRepository
				.getWaterTankerBookingDetails(waterTankerBookingSearchCriteria);

		if (CollectionUtils.isEmpty(applications)) {
			return new ArrayList<>();
		}

		if (config.getIsUserProfileEnabled()) {
			for (WaterTankerBookingDetail booking : applications) {
				userService.enrichBookingWithUserDetails(booking, waterTankerBookingSearchCriteria);
			}
		}

		// --- 3. DATA ENRICHMENT ---
		// Fetch full nested JSON objects for Vendors, Vehicles, and Drivers
		enrichmentService.enrichCrossServiceDetails(requestInfo, applications);

		enrichmentService.enrichWithTripReportDetails(requestInfo, applications);

//		List<WaterTankerBookingDetail> applications = requestServiceRepository
//				.getWaterTankerBookingDetails(waterTankerBookingSearchCriteria);
//
//		/**
//		 * Check if the retrieved list is empty using Spring's CollectionUtils Prevents
//		 * potential null pointer exceptions by returning an empty list Ensures
//		 * consistent return type and prevents calling methods from handling null
//		 */
//		if (CollectionUtils.isEmpty(applications)) {
//			return new ArrayList<>();
//		}
//		if (config.getIsUserProfileEnabled()) {
//			// Enrich each booking with user details
//			for (WaterTankerBookingDetail booking : applications) {
//				userService.enrichBookingWithUserDetails(booking, waterTankerBookingSearchCriteria);
//			}
//		}

		// Return retrieved application
		return applications;
	}

	@Override
	public List<WaterTankerFixedPointDetail> getWaterTankerFixedPointBookingDetails(
			RequestInfo requestInfo,
			WaterTankerFixedPointBookingSearchCriteria criteria) {

		applyUserRoleRestrictionsForFixedPoint(requestInfo, criteria);
		List<WaterTankerFixedPointDetail> applications =
				requestServiceRepository.getWaterTankerFixedPointBookingDetails(criteria);

		return CollectionUtils.isEmpty(applications) ? new ArrayList<>() : applications;
	}

	@Override
	public BookingStatusCountResponse getBookingStatusCounts(
			WaterTankerBookingSearchCriteria criteria,
			RequestInfo requestInfo) {

		applyUserRoleRestrictions(requestInfo, criteria);
		enrichmentService.enrichSearchCriteriaWithIds(requestInfo, criteria);
		Map<String, Integer> statusCounts =
				requestServiceRepository.getStatusCountsByApplicationType(criteria);

		int total = statusCounts.values().stream().mapToInt(Integer::intValue).sum();

		String appType = ObjectUtils.isEmpty(criteria.getApplicationType())
				? "ALL" : criteria.getApplicationType();

		ResponseInfo responseInfo = RequestServiceUtil.createReponseInfo(
				requestInfo,
				RequestServiceConstants.BOOKING_DETAIL_FOUND,
				ResponseInfo.StatusEnum.SUCCESSFUL);

		return BookingStatusCountResponse.builder()
				.responseInfo(responseInfo)
				.totalCount(total)
				.statusCounts(statusCounts)
				.applicationType(appType)
				.build();
	}

	@Override
	public Long getWaterTankerFixedPointCount(
			WaterTankerFixedPointBookingSearchCriteria criteria,
			RequestInfo requestInfo) {

		applyUserRoleRestrictionsForFixedPoint(requestInfo, criteria);
		return requestServiceRepository.getWaterTankerFixedPointCount(criteria);
	}

	@Override
	public Integer getApplicationsCount(WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria,
			RequestInfo requestInfo) {
		waterTankerBookingSearchCriteria.setCountCall(true);
		Integer bookingCount = 0;

		applyUserRoleRestrictions(requestInfo, waterTankerBookingSearchCriteria);
		enrichmentService.enrichSearchCriteriaWithIds(requestInfo, waterTankerBookingSearchCriteria);
		bookingCount = requestServiceRepository.getApplicationsCount(waterTankerBookingSearchCriteria);

		return bookingCount;
	}

	private void applyUserRoleRestrictions(RequestInfo requestInfo, WaterTankerBookingSearchCriteria criteria) {
		if (requestInfo == null || requestInfo.getUserInfo() == null || criteria == null) {
			return;
		}

		List<String> roleCodes = !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles())
				? requestInfo.getUserInfo().getRoles().stream()
						.map(Role::getCode)
						.filter(Objects::nonNull)
						.map(String::toUpperCase)
						.collect(Collectors.toList())
				: Collections.emptyList();

		// 1. Driver should not be restricted by citizen createdBy or vendorId
		if (roleCodes.contains("WT_DRIVER") || roleCodes.contains("DRIVER")) {
			return;
		}

		// 2. Employee: full access to see all bookings without restriction
		String userType = requestInfo.getUserInfo().getType();
		if ("EMPLOYEE".equalsIgnoreCase(userType)) {
			criteria.setCreatedBy(null);
			log.info("User is employee, allowing full access without vendor/citizen restriction");
			return;
		}

		// 3. For all non-employee users (Citizen, Citizen with Vendor role, etc.):
		// Always allow access to self-created bookings (matching createdby, applicant_uuid, or registered mobile)
		String userUuid = requestInfo.getUserInfo().getUuid();
		if (!StringUtils.isEmpty(userUuid)) {
			criteria.setCreatedBy(Collections.singletonList(userUuid));
		}
		if (!StringUtils.isEmpty(requestInfo.getUserInfo().getMobileNumber())) {
			criteria.setMobileNumber(requestInfo.getUserInfo().getMobileNumber());
		}

		// 4. In addition, if user is a Vendor, also grant access to bookings assigned to their vendor
		boolean isVendor = roleCodes.contains("WT_VENDOR") || roleCodes.contains("VENDOR") || roleCodes.contains("COMMON_VENDOR");
		if (isVendor) {
			String tenantId = !StringUtils.isEmpty(criteria.getTenantId())
					? criteria.getTenantId()
					: requestInfo.getUserInfo().getTenantId();
			Object vendorResp = vendorUtil.searchVendorByOwnerId(requestInfo, tenantId, userUuid);
			List<String> myVendorIds = extractVendorIdsFromResponse(vendorResp);
			if (!CollectionUtils.isEmpty(myVendorIds)) {
				criteria.setVendorIds(myVendorIds);
			}
			log.info("User {} has vendor role, mapped vendorIds: {}", userUuid, criteria.getVendorIds());
		}

		log.info("Restricted non-employee search criteria for user {} with createdBy: {}, mobileNumber: {}, vendorIds: {}",
				userUuid, criteria.getCreatedBy(), criteria.getMobileNumber(), criteria.getVendorIds());
	}

	private void applyUserRoleRestrictionsForFixedPoint(RequestInfo requestInfo, WaterTankerFixedPointBookingSearchCriteria criteria) {
		if (requestInfo == null || requestInfo.getUserInfo() == null || criteria == null) {
			return;
		}

		List<String> roleCodes = !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles())
				? requestInfo.getUserInfo().getRoles().stream()
						.map(Role::getCode)
						.filter(Objects::nonNull)
						.map(String::toUpperCase)
						.collect(Collectors.toList())
				: Collections.emptyList();

		if (roleCodes.contains("WT_DRIVER") || roleCodes.contains("DRIVER")) {
			return;
		}

		String userType = requestInfo.getUserInfo().getType();
		if ("EMPLOYEE".equalsIgnoreCase(userType)) {
			criteria.setCreatedBy(null);
			return;
		}

		String userUuid = requestInfo.getUserInfo().getUuid();
		if (!StringUtils.isEmpty(userUuid)) {
			criteria.setCreatedBy(Collections.singletonList(userUuid));
		}
		if (!StringUtils.isEmpty(requestInfo.getUserInfo().getMobileNumber())) {
			criteria.setMobileNumber(requestInfo.getUserInfo().getMobileNumber());
		}

		boolean isVendor = roleCodes.contains("WT_VENDOR") || roleCodes.contains("VENDOR") || roleCodes.contains("COMMON_VENDOR");
		if (isVendor) {
			String tenantId = !StringUtils.isEmpty(criteria.getTenantId())
					? criteria.getTenantId()
					: requestInfo.getUserInfo().getTenantId();
			Object vendorResp = vendorUtil.searchVendorByOwnerId(requestInfo, tenantId, userUuid);
			List<String> myVendorIds = extractVendorIdsFromResponse(vendorResp);
			if (!CollectionUtils.isEmpty(myVendorIds)) {
				criteria.setVendorIds(myVendorIds);
			}
		}
	}

	private List<String> extractVendorIdsFromResponse(Object response) {
		List<String> ids = new ArrayList<>();
		if (response == null) return ids;
		try {
			ObjectMapper mapper = new ObjectMapper();
			Map<String, Object> responseMap = mapper.convertValue(response, Map.class);
			if (responseMap != null && responseMap.containsKey("vendor")) {
				List<Map<String, Object>> entities = (List<Map<String, Object>>) responseMap.get("vendor");
				if (entities != null) {
					for (Map<String, Object> entity : entities) {
						if (entity != null && entity.get("id") != null) {
							ids.add(entity.get("id").toString());
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("Error extracting vendor IDs from response", e);
		}
		return ids;
	}

	@Override
	public WaterTankerBookingDetail updateWaterTankerBooking(WaterTankerBookingRequest waterTankerRequest,
			String applicationStatus) {
		String bookingNo = waterTankerRequest.getWaterTankerBookingDetail().getBookingNo();
		log.info("Updating booking for booking no: {}", bookingNo);

		if (bookingNo == null) {
			throw new CustomException("INVALID_BOOKING_CODE",
					"Booking no not valid. Failed to update booking status for : " + bookingNo);
		}

		// If no payment request, update workflow status and process booking request
		if (waterTankerRequest.getWaterTankerBookingDetail().getWorkflow() != null) {
			State state = workflowService.updateWorkflowStatus(null, waterTankerRequest);
			enrichmentService.enrichWaterTankerBookingUponUpdate(state.getApplicationStatus(), waterTankerRequest);

			// If action is APPROVE, create demand
			if (RequestServiceConstants.ACTION_APPROVE
					.equals(waterTankerRequest.getWaterTankerBookingDetail().getWorkflow().getAction())) {
				log.info("Application approved. Generating demand for Booking No: {}", bookingNo);
				demandService.createDemand(waterTankerRequest);
			}
		}

		log.info("Payment request is null, updating water tanker booking without payment");
		// If no payment request, just update the water tanker booking request
		requestServiceRepository.updateWaterTankerBooking(waterTankerRequest);

		Workflow workflow = waterTankerRequest.getWaterTankerBookingDetail().getWorkflow();

		if (workflow != null && waterTankerRequest.getWaterTankerBookingDetail().getWorkflow().getAction()
				.equalsIgnoreCase(RequestServiceConstants.WF_ACTION_SUBMIT_FEEDBACK)) {
			log.info("Processing feedback submission for booking no: {}", bookingNo);
			handleRSSubmitFeeback(waterTankerRequest);
		}

		if (workflow != null && waterTankerRequest.getWaterTankerBookingDetail().getWorkflow().getAction()
				.equalsIgnoreCase(RequestServiceConstants.WF_ACTION_REJECTED_BY_VENDOR)) {
			log.info("Processing rejection by vendor for booking no: {}", bookingNo);
			handleRejectedByVendor(waterTankerRequest);
		}

		return waterTankerRequest.getWaterTankerBookingDetail();
	}

	@Override
	public WaterTankerBookingDetail updateWaterTankerEmergencyBooking(WaterTankerBookingRequest waterTankerRequest) {
		WaterTankerBookingDetail incomingDetail = waterTankerRequest.getWaterTankerBookingDetail();
		String bookingNo = incomingDetail.getBookingNo();

		log.info("Updating booking for booking no: {}", bookingNo);

		if (bookingNo == null) {
			throw new CustomException("INVALID_BOOKING_CODE", "Booking no is required for update.");
		}

		WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
				.bookingNo(bookingNo)
				.tenantId(incomingDetail.getTenantId())
				.build();

		List<WaterTankerBookingDetail> existingBookings = requestServiceRepository.getWaterTankerBookingDetails(criteria);

		if (existingBookings.isEmpty()) {
			throw new CustomException("BOOKING_NOT_FOUND", "No booking found for booking number: " + bookingNo);
		}

		String currentDbStatus = existingBookings.get(0).getBookingStatus();


		enrichmentService.enrichWaterTankerBookingEmergecnyUpdate(waterTankerRequest, currentDbStatus);

		// 4. Update the record
		requestServiceRepository.updateWaterTankerBooking(waterTankerRequest);

		return waterTankerRequest.getWaterTankerBookingDetail();
	}

	@Override
	public void updateWaterTankerBooking(PaymentRequest paymentRequest, String applicationStatus) {
		log.info("Payment request: {}", paymentRequest);
		// Handle the payment request and update the water tanker booking if applicable
		WaterTankerBookingDetail waterTankerDetail=null;
		if (paymentRequest != null) {
			try {
				String consumerCode = paymentRequest.getPayment().getPaymentDetails().get(0).getBill().getConsumerCode();
				waterTankerDetail = requestServiceRepository
						.getWaterTankerBookingDetails(
								WaterTankerBookingSearchCriteria.builder().bookingNo(consumerCode).build())
						.stream().findFirst().orElse(null);
				log.info("Water tanker booking detail: {}", waterTankerDetail);
				log.info("Consumer code: {}", consumerCode);
				if (waterTankerDetail == null) {
					log.info("Application not found in consumer class while updating status");
				} else{
					// Update the booking details
					waterTankerDetail.getAuditDetails()
							.setLastModifiedBy(paymentRequest.getRequestInfo().getUserInfo().getUuid());
					waterTankerDetail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
					waterTankerDetail.setBookingStatus(applicationStatus);
					waterTankerDetail.setPaymentDate(System.currentTimeMillis());

					log.info("Water tanker detail after updating booking status: {}", waterTankerDetail);

					// Update water tanker booking request
					WaterTankerBookingRequest updatedWaterTankerRequest = WaterTankerBookingRequest.builder()
							.requestInfo(paymentRequest.getRequestInfo()).waterTankerBookingDetail(waterTankerDetail).build();

					log.info("Water Tanker Request to update application status in consumer: {}", updatedWaterTankerRequest);
					requestServiceRepository.updateWaterTankerBooking(updatedWaterTankerRequest);
				}
			}
			catch (Exception e) {
				log.error("Error while updating water tanker booking: {}", e.getMessage(), e);
				throw new CustomException("UPDATE_FAILED", "Failed to update water tanker booking");
			}

		}
		log.info("final object {}", waterTankerDetail);
	}

	private void handleRSSubmitFeeback(WaterTankerBookingRequest waterTankerRequest) {
		log.info("Handling water tanker Submit Feedback for request: {}", waterTankerRequest);
		User citizen = waterTankerRequest.getRequestInfo().getUserInfo();
		if (!citizen.getUuid().equalsIgnoreCase(waterTankerRequest.getRequestInfo().getUserInfo().getUuid())) {
			throw new CustomException("Rating Error", " Only owner of the application can submit the feedback !.");
		}
		if (waterTankerRequest.getWaterTankerBookingDetail().getWorkflow().getRating() == null) {
			throw new CustomException("Rating Error", " Rating has to be provided!");
		} else if (config.getAverageRatingCommentMandatory() != null
				&& Integer.parseInt(config.getAverageRatingCommentMandatory()) > waterTankerRequest
						.getWaterTankerBookingDetail().getWorkflow().getRating()) {

			throw new CustomException("Rating Error", " Comment mandatory for rating "
					+ waterTankerRequest.getWaterTankerBookingDetail().getWorkflow().getRating());
		}

	}

	private void handleRejectedByVendor(WaterTankerBookingRequest waterTankerRequest) {
		log.info("Handling rejected by vendor for request: {}", waterTankerRequest);
		WaterTankerBookingDetail tankerRequest = waterTankerRequest.getWaterTankerBookingDetail();
		tankerRequest.setVendorId(null);

		org.upyog.rs.web.models.Workflow workflow = tankerRequest.getWorkflow();
		if ((StringUtils.isBlank(workflow.getComments()))) {
			throw new CustomException("", " Comment is mandatory to reject the request for vendor.");
		}
	}


	@Override
	public List<RequestDetailsByDriverId.RequestDetailsInfo> getBookingAndAssignmentDetails(
			String driverId, Long fromDate, Long toDate) {
		return requestServiceRepository.getFullBookingDetailsByDriver(driverId, fromDate, toDate);
	}

	@Override
	public List<WaterTankerBookingDetail> getDriverAssignedBookings(CriteriyaSearchDto criteriyaSearchDto) {
		String driverUuid = criteriyaSearchDto.getCriteriyaSearch().getDriverId();
		String tenantId = criteriyaSearchDto.getRequestInfo().getUserInfo().getTenantId();
		WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
				.tenantId(tenantId)
				.driverId(driverUuid)
				.build();

		return getWaterTankerBookingDetails(criteriyaSearchDto.getRequestInfo(),criteria);
	}

	@Override
	public WaterTankerBookingDetail updateBookingLifecycle(WaterTankerBookingRequest waterTankerRequest) {
		String bookingNo = waterTankerRequest.getWaterTankerBookingDetail().getBookingNo();
		log.info("Updating lifecycle for booking no: {}", bookingNo);

		if (bookingNo == null) {
			throw new CustomException("INVALID_BOOKING_CODE", "Booking number is required for update.");
		}

		if (waterTankerRequest.getWaterTankerBookingDetail().getWorkflow() != null) {
			State state = workflowService.updateWorkflowStatus(null, waterTankerRequest);

			enrichmentService.enrichWaterTankerBookingUponUpdate(state.getApplicationStatus(), waterTankerRequest);
		}

		requestServiceRepository.updateWaterTankerBooking(waterTankerRequest);

		return waterTankerRequest.getWaterTankerBookingDetail();
	}

	public FixedFillingPointMapping createMapping(FixedFillingPointMappingRequest request) {
		log.info("Creating FixedFillingPointMapping");
		FixedFillingPointMapping mapping = request.getFixedFillingPointMapping();
		requestServiceRepository.save(mapping);
		return mapping;
	}
	@Override
	public Integer getTotalApplicationsCount(WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria,
											 RequestInfo requestInfo) {

		WaterTankerBookingSearchCriteria totalCountCriteria = new WaterTankerBookingSearchCriteria();
		totalCountCriteria.setTenantId(waterTankerBookingSearchCriteria.getTenantId());
		totalCountCriteria.setApplicationType(waterTankerBookingSearchCriteria.getApplicationType());
		totalCountCriteria.setStatus(waterTankerBookingSearchCriteria.getStatus());
		totalCountCriteria.setFromDate(waterTankerBookingSearchCriteria.getFromDate());
		totalCountCriteria.setToDate(waterTankerBookingSearchCriteria.getToDate());
		totalCountCriteria.setMobileNumber(waterTankerBookingSearchCriteria.getMobileNumber());
		totalCountCriteria.setBookingNo(waterTankerBookingSearchCriteria.getBookingNo());
		totalCountCriteria.setLocalityCode(waterTankerBookingSearchCriteria.getLocalityCode());
		totalCountCriteria.setDriverId(waterTankerBookingSearchCriteria.getDriverId());
		totalCountCriteria.setVendorIds(waterTankerBookingSearchCriteria.getVendorIds());
		totalCountCriteria.setVehicleIds(waterTankerBookingSearchCriteria.getVehicleIds());
		totalCountCriteria.setDriverIds(waterTankerBookingSearchCriteria.getDriverIds());
		totalCountCriteria.setFillingPointId(waterTankerBookingSearchCriteria.getFillingPointId());
		totalCountCriteria.setCreatedBy(waterTankerBookingSearchCriteria.getCreatedBy());

		applyUserRoleRestrictions(requestInfo, totalCountCriteria);
		enrichmentService.enrichSearchCriteriaWithIds(requestInfo, totalCountCriteria);

		return requestServiceRepository.getTotalApplicationsCount(totalCountCriteria);
	}
}
