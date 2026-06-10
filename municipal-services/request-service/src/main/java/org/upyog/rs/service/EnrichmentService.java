package org.upyog.rs.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.enums.RequestServiceStatus;
import org.upyog.rs.repository.IdGenRepository;
import org.upyog.rs.repository.RequestServiceRepository;
import org.upyog.rs.util.*;
import org.upyog.rs.web.models.Address;
import org.upyog.rs.web.models.ApplicantDetail;
import org.upyog.rs.web.models.AuditDetails;
import org.upyog.rs.web.models.fillingpoint.FillingPoint;
import org.upyog.rs.web.models.fillingpoint.FillingPointRequest;
import org.upyog.rs.web.models.fillingpointlocality.FillingPointLocalityRequest;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingDetail;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingRequest;
import org.upyog.rs.web.models.user.AddressV2;
import org.upyog.rs.web.models.user.User;
import org.upyog.rs.web.models.waterTanker.*;
import org.apache.commons.lang3.StringUtils;

import digit.models.coremodels.IdResponse;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EnrichmentService {

	@Autowired
	private RequestServiceConfiguration config;

	@Autowired
	private IdGenRepository idGenRepository;

	@Autowired
	private UserService userService;

	@Autowired
	private IdgenUtil idgenUtil;

	@Autowired
	private RequestServiceRepository requestServiceRepository;

	@Autowired
	private VendorUtil vendorUtil;

	@Autowired
	private com.fasterxml.jackson.databind.ObjectMapper mapper;

	@Autowired
	private DriverTripReportUtil driverTripReportUtil;

	public void enrichCreateWaterTankerRequest(WaterTankerBookingRequest waterTankerRequest) {
		String bookingId = RequestServiceUtil.getRandonUUID();
		log.info("Enriching water tanker booking id :" + bookingId);

		WaterTankerBookingDetail waterTankerDetail = waterTankerRequest.getWaterTankerBookingDetail();
		RequestInfo requestInfo = waterTankerRequest.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
//		String applicantUuid = RequestServiceUtil.getRandonUUID();
		String businessService =
				waterTankerDetail.getWorkflow().getBusinessService();
		String applicantUuid;
		if ("watertanker-fixedpoint".equalsIgnoreCase(businessService)) {

			applicantUuid = waterTankerDetail.getApplicantId();

		} else {

			applicantUuid = RequestServiceUtil.getRandonUUID();
		}
		String bookingCreateBy = waterTankerRequest.getRequestInfo().getUserInfo().getUserName();
		AuditDetails auditDetails = RequestServiceUtil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);
		if (config.getIsUserProfileEnabled()) {
			if (UserUtil.isCurrentUserApplicant(waterTankerRequest)) {
				waterTankerDetail.setApplicantUuid(userUuid);
			} else {
				waterTankerDetail.setApplicantUuid(null);
				waterTankerDetail.setAddressDetailId(null);
			}

			String applicantDetailId = waterTankerDetail.getApplicantUuid();
			String addressDetailId = waterTankerDetail.getAddressDetailId();

			if (StringUtils.isBlank(applicantDetailId)) {
				enrichUserDetails(waterTankerRequest);
			}

			if (!"watertanker-fixedpoint".equalsIgnoreCase(businessService)) {
				if (StringUtils.isBlank(addressDetailId)) {
					enrichAddressDetails(waterTankerRequest, waterTankerDetail);
				}
			}
		} else {
			/*
			 * If the currently logged-in user is not the same as the applicant mobile number entered in the form is different from the login mobile number,
			 * then we proceed to enrich user details, which will create a new user with the provided details.
			 * If the currently logged-in user is the same as the applicant mobile number, we do not enrich user details
			 * user profile is not enabled for this service, we explicitly set `applicantDetailId` and `addressDetailId` to null in the application details
			 */
			if (!UserUtil.isCurrentUserApplicant(waterTankerRequest)) {
				// Enrich user details for existing user or user details with address for new user
				enrichUserDetails(waterTankerRequest);
			}
			waterTankerDetail.setApplicantUuid(null);
			if (waterTankerDetail.getAddress() != null) {

				String existingAddressId =
						waterTankerDetail.getAddress().getAddressId();

				waterTankerDetail.setAddressDetailId(existingAddressId);
				waterTankerDetail.getAddress().setAddressId(existingAddressId);
			}
			log.info("User profile is not enabled, using generated applicantUuid for both tables");
		}

			List<String> customIds = getIdList(
					requestInfo,
					waterTankerDetail.getTenantId(),
					config.getWaterTankerApplicationKey(),
					config.getWaterTankerApplicationFormat(),
					1
			);

			waterTankerDetail.setBookingId(bookingId);
			waterTankerDetail.setBookingNo(customIds.get(0));
			waterTankerDetail.getApplicantDetail().setApplicantId(applicantUuid);
		if (!"watertanker-fixedpoint".equalsIgnoreCase(businessService)) {

			waterTankerDetail.setApplicantId(applicantUuid);

			if (waterTankerDetail.getApplicantDetail() != null) {

				waterTankerDetail.getApplicantDetail().setApplicantId(applicantUuid);

				waterTankerDetail.getApplicantDetail().setBookingId(bookingId);
			}
		}
		if (waterTankerDetail.getAddress() != null) {

			if (!"watertanker-fixedpoint".equalsIgnoreCase(businessService)) {

				if (StringUtils.isBlank(
						waterTankerDetail.getAddress().getAddressId())) {

					waterTankerDetail.getAddress()
							.setAddressId(RequestServiceUtil.getRandonUUID());
				}

				waterTankerDetail.getAddress()
						.setApplicantId(applicantUuid);
			}

			// save existing address id in booking table
			waterTankerDetail.setAddressDetailId(
					waterTankerDetail.getAddress().getAddressId()
			);
		}
		if (waterTankerDetail.getWorkflow() == null || StringUtils.isBlank(waterTankerDetail.getWorkflow().getBusinessService())) {
			throw new CustomException("INVALID_REQUEST", "Business Service is missing in Workflow object");
		}

		if ("watertanker".equalsIgnoreCase(businessService)) {
			waterTankerDetail.getWorkflow().setAction("APPLY");
		} else if ("watertanker-fixedpoint".equalsIgnoreCase(businessService)) {
			waterTankerDetail.getWorkflow().setAction("CREATE");
			waterTankerDetail.setBookingStatus("SCHEDULED");
		} else {
			throw new CustomException("INVALID_BUSINESS_SERVICE",
					"Unknown business service: " + businessService);
		}

		waterTankerDetail.setMobileNumber(
				waterTankerRequest.getWaterTankerBookingDetail()
						.getApplicantDetail().getMobileNumber()
		);
		waterTankerDetail.getApplicantDetail().setAuditDetails(auditDetails);
		waterTankerDetail.setApplicationDate(auditDetails.getCreatedTime());
		waterTankerDetail.setBookingStatus(
				RequestServiceStatus.valueOf(waterTankerDetail.getBookingStatus()).toString()
		);
		waterTankerDetail.setAuditDetails(auditDetails);
		waterTankerDetail.setTenantId(
				waterTankerRequest.getWaterTankerBookingDetail().getTenantId()
		);
		waterTankerDetail.setTankerType(
				waterTankerRequest.getWaterTankerBookingDetail().getTankerType()
		);
		waterTankerDetail.setTankerQuantity(
				waterTankerRequest.getWaterTankerBookingDetail().getTankerQuantity()
		);
		waterTankerDetail.setWaterQuantity(
				waterTankerRequest.getWaterTankerBookingDetail().getWaterQuantity()
		);
		waterTankerDetail.setDescription(
				waterTankerRequest.getWaterTankerBookingDetail().getDescription()
		);
		waterTankerDetail.setDeliveryDate(
				waterTankerRequest.getWaterTankerBookingDetail().getDeliveryDate()
		);
		waterTankerDetail.setDeliveryTime(
				waterTankerRequest.getWaterTankerBookingDetail().getDeliveryTime()
		);
		waterTankerDetail.setLocalityCode(
				waterTankerRequest.getWaterTankerBookingDetail().getAddress().getLocalityCode()
		);
		waterTankerDetail.setLatitude(
				waterTankerRequest.getWaterTankerBookingDetail().getAddress().getLatitude()
		);
		waterTankerDetail.setLongitude(
				waterTankerRequest.getWaterTankerBookingDetail().getAddress().getLongitude()
		);
		waterTankerDetail.setWTfileStoreId(
				waterTankerRequest.getWaterTankerBookingDetail().getWTfileStoreId()
		);
		waterTankerDetail.setDriverId(waterTankerRequest.getWaterTankerBookingDetail().getDriverId());

		waterTankerDetail.setVendorId(waterTankerRequest.getWaterTankerBookingDetail().getVendorId());
		waterTankerDetail.setVehicleId(waterTankerRequest.getWaterTankerBookingDetail().getVehicleId());
		waterTankerDetail.setVehicleType(waterTankerRequest.getWaterTankerBookingDetail().getVehicleType());
		waterTankerDetail.setVehicleCapacity(waterTankerRequest.getWaterTankerBookingDetail().getVehicleCapacity());
		waterTankerDetail.setFillingPointId(waterTankerRequest.getWaterTankerBookingDetail().getFillingPointId());
		waterTankerDetail.setDeliveryDate(waterTankerRequest.getWaterTankerBookingDetail().getDeliveryDate());
		waterTankerDetail.setDeliveryTime(waterTankerRequest.getWaterTankerBookingDetail().getDeliveryTime());
		waterTankerDetail.setApplicationType(waterTankerDetail.getWorkflow().getBusinessService());
		waterTankerDetail.getApplicantDetail().setType(null);
		waterTankerDetail.getApplicantDetail().setFixedPointId(null);


		waterTankerDetail.setBookingCreatedBy(bookingCreateBy);



		if (waterTankerRequest.getWaterTankerBookingDetail().getFillingPointMetadata() != null
				&& waterTankerRequest.getWaterTankerBookingDetail().getFillingPointMetadata().getId() != null) {

			waterTankerDetail.setFillingPointId(
					waterTankerRequest.getWaterTankerBookingDetail()
							.getFillingPointMetadata()
							.getId()
			);

		} else if (waterTankerRequest.getWaterTankerBookingDetail().getFillingPointId() != null) {

			waterTankerDetail.setFillingPointId(
					waterTankerRequest.getWaterTankerBookingDetail().getFillingPointId()
			);

		} else {

			// Case 3: frontend sends null
			waterTankerDetail.setFillingPointId(null);
		}

		log.info("Enriched application request data :" + waterTankerDetail);

	}

	public void enrichUpdateFixedPointWaterTankerRequest(
			WaterTankerFixedPointRequest waterTankerFixedPointRequest) {

		log.info("Enriching update for fixed point water tanker Applicant id: "
				+ waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getApplicantDetail());

		RequestInfo requestInfo = waterTankerFixedPointRequest.getRequestInfo();
		WaterTankerFixedPointDetail detail = waterTankerFixedPointRequest.getWaterTankerFixedPointDetail();

		String applicantUuid = RequestServiceUtil.getRandonUUID();
		String bookingCreateBy = waterTankerFixedPointRequest.getRequestInfo().getUserInfo().getUserName();

		// For update: preserve createdBy/createdTime, only refresh lastModified fields
		AuditDetails existingAudit = detail.getAuditDetails();
		AuditDetails updatedAudit = AuditDetails.builder()
				.createdBy(existingAudit != null ? existingAudit.getCreatedBy() : null)
				.createdTime(existingAudit != null ? existingAudit.getCreatedTime() : null)
				.lastModifiedBy(requestInfo.getUserInfo().getUuid())
				.lastModifiedTime(System.currentTimeMillis())
				.build();

		detail.setAuditDetails(updatedAudit);

		// Propagate audit to child objects if present
		if (detail.getApplicantDetail() != null) {
			detail.getApplicantDetail().setAuditDetails(updatedAudit);
		}

		log.info("Enriched update request: " + detail);
	}

	/**
	 * Enriches the applicant and address detail IDs in the given application detail.
	 * <p>
	 * If the applicantDetailId is present, it attempts to fetch an existing user based on the request.
	 * - If an existing user is found, sets the applicantDetailId accordingly.
	 * - If not found, it creates a new user and sets both applicantDetailId and addressDetailId
	 *   from the newly created user and their associated address.
	 * </p>
	 *
	 * @param waterTankerRequest The full application request containing applicant and address info.
	 */
	private void enrichUserDetails(WaterTankerBookingRequest waterTankerRequest) {
		// Try fetching an existing user for the given request
		WaterTankerBookingDetail waterTankerDetail = waterTankerRequest.getWaterTankerBookingDetail();
		RequestInfo requestInfo = waterTankerRequest.getRequestInfo();
		ApplicantDetail applicantDetail = waterTankerDetail.getApplicantDetail();
		String tenantId = waterTankerDetail.getTenantId();
		User existingUsers = userService.fetchExistingUser(tenantId, applicantDetail, requestInfo);

		if (existingUsers != null) {
			waterTankerDetail.setApplicantUuid(existingUsers.getUuid());
			log.info("Existing user found with ID: {}", existingUsers.getUuid());
			return;
		}

		// Create a new user with address details if no existing user was found
		User newUser = userService.createUserHandler(waterTankerRequest.getRequestInfo(), waterTankerRequest.getWaterTankerBookingDetail().getApplicantDetail(),
				waterTankerRequest.getWaterTankerBookingDetail().getAddress(), waterTankerRequest.getWaterTankerBookingDetail().getTenantId());
		log.info("New user created with ID: {}", newUser.getUuid());
		waterTankerDetail.setApplicantUuid(newUser.getUuid());

		// Set addressDetailId from the first address with a non-null ID, if present
		newUser.getAddresses().stream()
				.filter(addr -> addr.getId() != null)
				.findFirst()
				.ifPresent(addr -> waterTankerDetail.setAddressDetailId(String.valueOf(addr.getId())));
	}


	/**
	 * Enriches the address details in the given WaterTankerBookingDetail object by creating a new address
	 * based on the user UUID provided in the WaterTankerBookingRequest object. If the new address is created
	 * successfully, the addressDetailId in the WaterTankerBookingDetail object is updated.
	 *
	 * @param waterTankerRequest The request object containing necessary data for address creation.
	 * @param waterTankerDetail The application details object to be enriched with the new address ID.
	 */
	private void enrichAddressDetails(WaterTankerBookingRequest waterTankerRequest, WaterTankerBookingDetail waterTankerDetail) {

		// If applicant UUID is null or blank, throw custom exception
		if (StringUtils.isBlank(waterTankerRequest.getWaterTankerBookingDetail().getApplicantUuid())) {
			throw new CustomException("APPLICANT_UUID_NULL", "Applicant UUID is blank");
		}

		// Fetch the new address associated with the user's UUID
		AddressV2 addressDetails = UserService.convertApplicantAddressToUserAddress(waterTankerRequest.getWaterTankerBookingDetail().getAddress(), RequestServiceUtil.extractTenantId(waterTankerRequest.getWaterTankerBookingDetail().getTenantId()));
		//System.out.println("test1       ");
		AddressV2 address = userService.createNewAddressV2ByUserUuid(addressDetails,waterTankerRequest.getRequestInfo(),waterTankerRequest.getWaterTankerBookingDetail().getApplicantUuid());
      //   System.out.println("test2         ");
		if (address != null) {
			// Set the address detail ID in the booking detail
			waterTankerDetail.setAddressDetailId(String.valueOf(address.getId()));
			log.info("Address successfully enriched with ID: {}", address.getId());
		} else {
			throw new CustomException("ADDRESS_CREATION_FAILED", "Failed to create address for the given applicant UUID");
		}
	}


	/**
	 * Enriches the mobile toilet booking request with necessary details such as booking ID, application date,
	 * booking status, and address details. It also generates a unique booking number using the ID generation service.
	 *
	 * @param mobileToiletRequest The request object containing necessary data for mobile toilet booking.
	 */
	public void enrichCreateMobileToiletRequest(MobileToiletBookingRequest mobileToiletRequest) {
		String bookingId = RequestServiceUtil.getRandonUUID();
		log.info("Enriching water tanker booking id :" + bookingId);

		MobileToiletBookingDetail mobileToiletDetail = mobileToiletRequest.getMobileToiletBookingDetail();
		RequestInfo requestInfo = mobileToiletRequest.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
		AuditDetails auditDetails = RequestServiceUtil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);
		if(config.getIsUserProfileEnabled()) {
			// If the mobile number in the request matches the applicant's mobile number, then set the applicantDetailId as userUuid
			if (UserUtil.isCurrentUserApplicant(mobileToiletRequest)) {
				mobileToiletDetail.setApplicantUuid(userUuid);
			} else {
				// If the mobile number does not match, set the applicantDetailId to null and addressDetailId to null
				mobileToiletDetail.setApplicantUuid(null);
				mobileToiletDetail.setAddressDetailId(null);
			}

			String applicantDetailId = mobileToiletDetail.getApplicantUuid();
			if (StringUtils.isBlank(applicantDetailId)) {
				// Enrich user details for existing user or user details with address for new user
				enrichUserDetails(mobileToiletRequest);
			}
			String addressDetailId = mobileToiletDetail.getAddressDetailId();
			if (StringUtils.isBlank(addressDetailId)) {
				// Enrich address details only
				enrichAddressDetails(mobileToiletRequest, mobileToiletDetail);
			}
		}else{
			/*
			 * If the currently logged-in user is not the same as the applicant mobile number entered in the form is different from the login mobile number,
			 * then we proceed to enrich user details, which will create a new user with the provided details.
			 * If the currently logged-in user is the same as the applicant mobile number, we do not enrich user details
			 * user profile is not enabled for this service, we explicitly set `applicantDetailId` and `addressDetailId` to null in the application details
			 */
			if (!UserUtil.isCurrentUserApplicant(mobileToiletRequest)) {
				// Enrich user details for existing user or user details with address for new user
				enrichUserDetails(mobileToiletRequest);
			}
			mobileToiletDetail.setApplicantUuid(null);
			mobileToiletDetail.setAddressDetailId(null);
		}
		mobileToiletDetail.setBookingId(bookingId);
		mobileToiletDetail.setApplicationDate(auditDetails.getCreatedTime());
		mobileToiletDetail.setBookingStatus(RequestServiceStatus.valueOf(mobileToiletDetail.getBookingStatus()).toString());
		mobileToiletDetail.setAuditDetails(auditDetails);
		mobileToiletDetail.setTenantId(mobileToiletRequest.getMobileToiletBookingDetail().getTenantId());
		mobileToiletDetail.setMobileNumber(mobileToiletRequest.getMobileToiletBookingDetail().getApplicantDetail().getMobileNumber());
		mobileToiletDetail.setLocalityCode(mobileToiletRequest.getMobileToiletBookingDetail().getAddress().getLocalityCode());
		List<String> customIds = getIdList(requestInfo, mobileToiletDetail.getTenantId(),
				config.getMobileToiletApplicationKey(), config.getMobileToiletApplicationFormat(), 1);

		log.info("Enriched application request application no :" + customIds.get(0));

		mobileToiletDetail.setBookingNo(customIds.get(0));


		mobileToiletDetail.setNoOfMobileToilet(mobileToiletRequest.getMobileToiletBookingDetail().getNoOfMobileToilet());
		mobileToiletDetail.setDescription(mobileToiletRequest.getMobileToiletBookingDetail().getDescription());
		mobileToiletDetail.setDeliveryFromDate(mobileToiletRequest.getMobileToiletBookingDetail().getDeliveryFromDate());
		mobileToiletDetail.setDeliveryToDate(mobileToiletRequest.getMobileToiletBookingDetail().getDeliveryToDate());
		mobileToiletDetail.setDeliveryFromTime(mobileToiletRequest.getMobileToiletBookingDetail().getDeliveryFromTime());
		mobileToiletDetail.setDeliveryToTime(mobileToiletRequest.getMobileToiletBookingDetail().getDeliveryToTime());
		String roles = mobileToiletRequest.getRequestInfo().getUserInfo().getRoles()
				.stream()
				.map(Role::getName)
				.collect(Collectors.joining(", "));
		mobileToiletDetail.setBookingCreatedBy(roles);

		mobileToiletDetail.getApplicantDetail().setBookingId(bookingId);
		mobileToiletDetail.getApplicantDetail().setApplicantId(RequestServiceUtil.getRandonUUID());
		mobileToiletDetail.getAddress().setAddressId(RequestServiceUtil.getRandonUUID());
		mobileToiletDetail.getApplicantDetail().setAuditDetails(auditDetails);
		mobileToiletDetail.getAddress().setApplicantId(mobileToiletDetail.getApplicantDetail().getApplicantId());

		log.info("Enriched application request data :" + mobileToiletDetail);

	}

	/**
	 * Enriches the applicant and address detail IDs in the given application detail.
	 * <p>
	 * If the applicantDetailId is present, it attempts to fetch an existing user based on the request.
	 * - If an existing user is found, sets the applicantDetailId accordingly.
	 * - If not found, it creates a new user and sets both applicantDetailId and addressDetailId
	 *   from the newly created user and their associated address.
	 * </p>
	 *
	 * @param mobileToiletRequest The full application request containing applicant and address info.
	 */
	private void enrichUserDetails(MobileToiletBookingRequest mobileToiletRequest) {
		// Try fetching an existing user for the given request
		MobileToiletBookingDetail mobileToiletDetail = mobileToiletRequest.getMobileToiletBookingDetail();
		RequestInfo requestInfo = mobileToiletRequest.getRequestInfo();
		ApplicantDetail applicantDetail = mobileToiletDetail.getApplicantDetail();
		String tenantId = mobileToiletDetail.getTenantId();
		User existingUsers = userService.fetchExistingUser(tenantId, applicantDetail, requestInfo);

		if (existingUsers != null && StringUtils.isNotBlank(existingUsers.getUuid())) {
			mobileToiletDetail.setApplicantUuid(existingUsers.getUuid());
			log.info("Existing user found with ID: {}", existingUsers.getUuid());
			return;
		}

		// Create a new user with address details if no existing user was found
		User newUser = userService.createUserHandler(mobileToiletRequest.getRequestInfo(), mobileToiletRequest.getMobileToiletBookingDetail().getApplicantDetail(),
				mobileToiletRequest.getMobileToiletBookingDetail().getAddress(), mobileToiletRequest.getMobileToiletBookingDetail().getTenantId());
		log.info("New user created with ID: {}", newUser.getUuid());
		mobileToiletDetail.setApplicantUuid(newUser.getUuid());

		// Set addressDetailId from the first address with a non-null ID, if present
		newUser.getAddresses().stream()
				.filter(addr -> addr.getId() != null)
				.findFirst()
				.ifPresent(addr -> mobileToiletDetail.setAddressDetailId(String.valueOf(addr.getId())));
	}


	/**
	 * Enriches the address details in the given mobileToiletDetail object by creating a new address
	 * based on the user UUID provided in the mobileToiletRequest object. If the new address is created
	 * successfully, the addressDetailId in the mobileToiletDetail object is updated.
	 *
	 * @param mobileToiletRequest The request object containing necessary data for address creation.
	 * @param mobileToiletDetail The application details object to be enriched with the new address ID.
	 */

	private void enrichAddressDetails(MobileToiletBookingRequest mobileToiletRequest, MobileToiletBookingDetail mobileToiletDetail) {
		// If applicant UUID is null or blank, throw custom exception
		if (StringUtils.isBlank(mobileToiletRequest.getMobileToiletBookingDetail().getApplicantUuid())) {
			throw new CustomException("APPLICANT_UUID_NULL", "Applicant UUID is blank");
		}

		// Fetch the new address associated with the user's UUID
		AddressV2 addressDetails = UserService.convertApplicantAddressToUserAddress(mobileToiletRequest.getMobileToiletBookingDetail().getAddress(), RequestServiceUtil.extractTenantId(mobileToiletRequest.getMobileToiletBookingDetail().getTenantId()));
		AddressV2 address = userService.createNewAddressV2ByUserUuid(addressDetails,mobileToiletRequest.getRequestInfo(),mobileToiletRequest.getMobileToiletBookingDetail().getApplicantUuid());

			if (address != null) {
				// Set the address detail ID in the application details object
				mobileToiletDetail.setAddressDetailId(String.valueOf(address.getId()));
				log.info("Address details successfully enriched with ID: {}", address.getId());
			} else {
				throw new CustomException("ADDRESS_CREATION_FAILED", "Failed to create address for the given applicant UUID");
			}
	}

	/**
	 * Returns a list of numbers generated from idgen
	 *
	 * @param requestInfo RequestInfo from the request
	 * @param tenantId    tenantId of the city
	 * @param idKey       code of the field defined in application properties for
	 *                    which ids are generated for
	 * @param idformat    format in which ids are to be generated
	 * @param count       Number of ids to be generated
	 * @return List of ids generated using idGen service
	 */
	private List<String> getIdList(RequestInfo requestInfo, String tenantId, String idKey, String idformat, int count) {
		List<IdResponse> idResponses = idGenRepository.getId(requestInfo, tenantId, idKey, idformat, count)
				.getIdResponses();

		if (CollectionUtils.isEmpty(idResponses))
			throw new CustomException("IDGEN_ERROR", "No ids returned from idgen Service");

		return idResponses.stream().map(IdResponse::getId).collect(Collectors.toList());
	}
	
	public void enrichWaterTankerBookingUponUpdate(String bookingStatus, WaterTankerBookingRequest waterTankerRequest) {
		WaterTankerBookingDetail waterTankerDetail = waterTankerRequest.getWaterTankerBookingDetail();
		waterTankerDetail.setVendorId(waterTankerRequest.getWaterTankerBookingDetail().getVendorId());
		waterTankerDetail.setDriverId(waterTankerRequest.getWaterTankerBookingDetail().getDriverId());
		waterTankerDetail.setVehicleId(waterTankerRequest.getWaterTankerBookingDetail().getVehicleId());
		waterTankerDetail.getAuditDetails().setLastModifiedBy(waterTankerRequest.getRequestInfo().getUserInfo().getUuid());
		waterTankerDetail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
		waterTankerDetail.setBookingStatus(bookingStatus);
		
	}

	public void enrichWaterTankerBookingEmergecnyUpdate(
			WaterTankerBookingRequest waterTankerRequest, String currentDbStatus) {

		WaterTankerBookingDetail waterTankerDetail = waterTankerRequest.getWaterTankerBookingDetail();
		RequestInfo requestInfo = waterTankerRequest.getRequestInfo();

		if (waterTankerDetail.getBookingStatus() == null) {
			waterTankerDetail.setBookingStatus(currentDbStatus);
		}

		if (waterTankerDetail.getBookingStatus() == null) {
			waterTankerDetail.setBookingStatus("SCHEDULED");
		}

		if (waterTankerDetail.getAuditDetails() == null) {
			AuditDetails auditDetails = RequestServiceUtil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);
			waterTankerDetail.setAuditDetails(auditDetails);
		} else {
			waterTankerDetail.getAuditDetails().setLastModifiedBy(requestInfo.getUserInfo().getUuid());
			waterTankerDetail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
		}
	}

	public void enrichMobileToiletBookingUponUpdate(String bookingStatus, MobileToiletBookingRequest mobileToiletRequest) {
		MobileToiletBookingDetail mobileToiletDetail = mobileToiletRequest.getMobileToiletBookingDetail();
		mobileToiletDetail.setVendorId(mobileToiletRequest.getMobileToiletBookingDetail().getVendorId());
		mobileToiletDetail.setDriverId(mobileToiletRequest.getMobileToiletBookingDetail().getDriverId());
		mobileToiletDetail.setVehicleId(mobileToiletRequest.getMobileToiletBookingDetail().getVehicleId());
		mobileToiletDetail.getAuditDetails().setLastModifiedBy(mobileToiletRequest.getRequestInfo().getUserInfo().getUuid());
		mobileToiletDetail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
		mobileToiletDetail.setBookingStatus(bookingStatus);

	}


	public void enrichCreateFillingPointRequest(FillingPointRequest request) {

		List<String> referenceList = idgenUtil.getIdList(
				request.getRequestInfo(),
				request.getFillingPoints().get(0).getTenantId(),
				"djb.flp.id",
				null,
				1);

		String userId = request.getRequestInfo().getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		for (FillingPoint fp : request.getFillingPoints()) {
			fp.setId(RequestServiceUtil.getRandonUUID());
			fp.setCreatedBy(userId);
			fp.setLastModifiedBy(userId);
			fp.setCreatedTime(now);
			fp.setLastModifiedTime(now);
			fp.setFillingPointId(referenceList.get(0));

			if (fp.getAddress() != null) {
				fp.getAddress().setAddressId(RequestServiceUtil.getRandonUUID());
				fp.getAddress().setApplicantId(fp.getId());
				// ← ADD THIS
				if (fp.getAddress().getType() == null) {
					fp.getAddress().setType("FILLING-POINT");
				}
			}
		}
	}

	public void enrichUpdateFillingPointRequest(FillingPointRequest request) {

		String userId = request.getRequestInfo().getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		for (FillingPoint fp : request.getFillingPoints()) {
			fp.setLastModifiedBy(userId);
			fp.setLastModifiedTime(now);

			// address audit not needed — just ensure type is set
			if (fp.getAddress() != null && fp.getAddress().getType() == null) {
				fp.getAddress().setType("FILLING-POINT");
			}
		}
	}

	public void enrichCreateRequest(FillingPointLocalityRequest request) {
		RequestInfo requestInfo = request.getRequestInfo();
		AuditDetails auditDetails = AuditDetails.builder()
				.createdBy(requestInfo.getUserInfo().getUuid())
				.lastModifiedBy(requestInfo.getUserInfo().getUuid())
				.createdTime(System.currentTimeMillis())
				.lastModifiedTime(System.currentTimeMillis())
				.build();

		request.getFillingPointLocality().forEach(mapping -> mapping.setAuditDetails(auditDetails));
	}

		public void enrichUpdateRequest(FillingPointLocalityRequest request) {
				Long time = System.currentTimeMillis();
				String uuid = request.getRequestInfo().getUserInfo().getUuid();

				request.getFillingPointLocality().forEach(mapping -> {
					AuditDetails audit = mapping.getAuditDetails();
					if (audit == null) {
						audit = new AuditDetails();
					}
					if (audit.getCreatedBy() == null) {
						audit.setCreatedBy(uuid);
						audit.setCreatedTime(time);
					}
					audit.setLastModifiedBy(uuid);
					audit.setLastModifiedTime(time);

					mapping.setAuditDetails(audit);
				});
		}





	public void enrichCreateFixedPointWaterTankerRequest(WaterTankerFixedPointRequest waterTankerFixedPointRequest) {
		List<String> referenceList = idgenUtil.getIdList(
				waterTankerFixedPointRequest.getRequestInfo(),
				waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getTenantId(),
				"djb.fxp.id",
				null,
				1);
		String bookingId = RequestServiceUtil.getRandonUUID();
		log.info("Enriching water tanker booking id :" + bookingId);

		WaterTankerFixedPointDetail waterTankerFixedPointDetail = waterTankerFixedPointRequest.getWaterTankerFixedPointDetail();
		RequestInfo requestInfo = waterTankerFixedPointRequest.getRequestInfo();
		AuditDetails auditDetails = RequestServiceUtil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);

		waterTankerFixedPointDetail.setAuditDetails(auditDetails);
		waterTankerFixedPointDetail.setTenantId(waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getTenantId());

		List<String> customIds = getIdList(requestInfo, waterTankerFixedPointDetail.getTenantId(),
				config.getWaterTankerApplicationKey(), config.getWaterTankerApplicationFormat(), 1);

		log.info("Enriched application request application no :" + customIds.get(0));

		ApplicantDetail applicantDetail = waterTankerFixedPointDetail.getApplicantDetail();
		Address address = waterTankerFixedPointDetail.getAddress();

		waterTankerFixedPointDetail.getApplicantDetail().setBookingId(bookingId);
		waterTankerFixedPointDetail.setMobileNumber(applicantDetail.getMobileNumber());

		waterTankerFixedPointDetail.getApplicantDetail().setType("FIXED-POINT");
		waterTankerFixedPointDetail.getApplicantDetail().setFixedPointId(referenceList.get(0));
		waterTankerFixedPointDetail.getApplicantDetail().setApplicantId(RequestServiceUtil.getRandonUUID());
		waterTankerFixedPointDetail.getAddress().setAddressId(RequestServiceUtil.getRandonUUID());
		waterTankerFixedPointDetail.getApplicantDetail().setAuditDetails(auditDetails);
		waterTankerFixedPointDetail.getAddress().setApplicantId(waterTankerFixedPointDetail.getApplicantDetail().getApplicantId());

		if (address != null) {

			if (address.getLocalityCode() == null || address.getLocalityCode().trim().isEmpty()) {
				address.setLocalityCode(address.getLocality());
			}

			if (address.getLocality() == null || address.getLocality().trim().isEmpty()) {
				address.setLocality(address.getLocalityCode());
			}
		}
		log.info("Enriched application request data :" + waterTankerFixedPointDetail);

	}
	public void enrichSearchCriteriaWithIds(RequestInfo requestInfo, WaterTankerBookingSearchCriteria criteria) {

		boolean skipVendorCall = false;
		if (requestInfo.getUserInfo() != null && !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles())) {
			List<String> roleCodes = requestInfo.getUserInfo().getRoles().stream()
					.map(role -> role.getCode().toUpperCase())
					.collect(Collectors.toList());

			boolean hasDriverOrVendor = roleCodes.contains("WT_DRIVER") || roleCodes.contains("WT_VENDOR");
			boolean hasEmployee = roleCodes.contains("EMPLOYEE");

			// Skip ONLY if they are a driver/vendor and NOT an employee
			if (hasDriverOrVendor && !hasEmployee) {
				skipVendorCall = true;
			}
		}

		if (skipVendorCall) {
			log.info("Skipping vendor/vehicle search criteria enrichment for user with WT_DRIVER/WT_VENDOR role and no EMPLOYEE role");
			return;
		}
		String tenantId = criteria.getTenantId();

		if (!StringUtils.isEmpty(criteria.getVendorName())) {
			Object response = vendorUtil.searchVendor(requestInfo, tenantId, null, criteria.getVendorName());
			// Note: Replace "vendor" below with "vendorInfo" or whatever array key the Vendor API actually returns
			List<String> vendorIds = extractIdsFromResponse(response, "vendor");
			criteria.setVendorIds(vendorIds);
		}

		// CASE 2: Vehicle registration number search → find which vendor has this vehicle,
		// then extract the vehicleId from vendor's vehicles list
		if (!StringUtils.isEmpty(criteria.getVehicleName())) {
			Object response = vendorUtil.searchVendor(requestInfo, tenantId, null, null);
			List<String> vehicleIds = extractVehicleIdsByRegistrationNumber(response, criteria.getVehicleName());
			criteria.setVehicleIds(vehicleIds);
		}

		// CASE 3: Driver name search → find which vendor has this driver,
		// then extract the driverOwnerUuid (used as driverId in booking table)
		if (!StringUtils.isEmpty(criteria.getDriverName())) {
			Object response = vendorUtil.searchVendor(requestInfo, tenantId, null, null);
			List<String> driverIds = extractDriverOwnerUuidsByName(response, criteria.getDriverName());
			criteria.setDriverIds(driverIds);
		}
	}
	public void enrichCrossServiceDetails(RequestInfo requestInfo, List<WaterTankerBookingDetail> bookings) {
		if (CollectionUtils.isEmpty(bookings)) return;

		boolean skipVendorCall = false;
		if (requestInfo.getUserInfo() != null && !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles())) {
			List<String> roleCodes = requestInfo.getUserInfo().getRoles().stream()
					.map(role -> role.getCode().toUpperCase())
					.collect(Collectors.toList());

			boolean hasDriverOrVendor = roleCodes.contains("WT_DRIVER") || roleCodes.contains("WT_VENDOR");
			boolean hasEmployee = roleCodes.contains("EMPLOYEE");

			// Skip ONLY if they are a driver/vendor and NOT an employee
			if (hasDriverOrVendor && !hasEmployee) {
				skipVendorCall = true;
			}
		}

		if (skipVendorCall) {
			log.info("Skipping cross-service vendor enrichment for user with WT_DRIVER/WT_VENDOR role and no EMPLOYEE role");
			return;
		}

		String tenantId = bookings.get(0).getTenantId();

		// 1. Gather all unique IDs from the list of bookings (Bulk approach prevents API spam)
		List<String> vendorIds = bookings.stream().map(WaterTankerBookingDetail::getVendorId)
				.filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());

		// 2. Fetch full objects in bulk
		Map<String, Object> vendorMap = new HashMap<>();
		if (!vendorIds.isEmpty()) {
			Object vendorResponse = vendorUtil.searchVendor(requestInfo, tenantId, vendorIds, null);
			vendorMap = createLookupMap(vendorResponse, "vendor", "id");
		}

		// 3. Map the objects back to the @Transient fields
		for (WaterTankerBookingDetail booking : bookings) {
			if (booking.getVendorId() != null) {
				booking.setVendor(vendorMap.get(booking.getVendorId()));
			}
			// TODO: Do the same for vehicle and driver maps...
		}
	}

	// --- JSON Utility Helper Methods ---

	private List<String> extractIdsFromResponse(Object response, String jsonArrayKey) {
		List<String> ids = new ArrayList<>();
		try {
			Map<String, Object> responseMap = mapper.convertValue(response, Map.class);
			if (responseMap.containsKey(jsonArrayKey)) {
				List<Map<String, Object>> entities = (List<Map<String, Object>>) responseMap.get(jsonArrayKey);
				for (Map<String, Object> entity : entities) {
					ids.add(entity.get("id").toString());
				}
			}
		} catch (Exception e) {
			log.error("Error parsing IDs from cross-service response", e);
		}
		return ids;
	}

	private Map<String, Object> createLookupMap(Object response, String jsonArrayKey, String idField) {
		Map<String, Object> map = new HashMap<>();
		try {
			Map<String, Object> responseMap = mapper.convertValue(response, Map.class);
			if (responseMap.containsKey(jsonArrayKey)) {
				List<Map<String, Object>> entities = (List<Map<String, Object>>) responseMap.get(jsonArrayKey);
				for (Map<String, Object> entity : entities) {
					if (entity.containsKey(idField)) {
						map.put(entity.get(idField).toString(), entity);
					}
				}
			}
		} catch (Exception e) {
			log.error("Error creating lookup map for enrichment", e);
		}
		return map;
	}
	/**
	 * Searches through all vendors' vehicle lists and returns vehicleIds
	 * where the registration number matches the search term (case-insensitive, partial match).
	 */
	private List<String> extractVehicleIdsByRegistrationNumber(Object response, String vehicleRegNumber) {
		List<String> vehicleIds = new ArrayList<>();
		try {
			Map<String, Object> responseMap = mapper.convertValue(response, Map.class);
			if (!responseMap.containsKey("vendor")) return vehicleIds;

			List<Map<String, Object>> vendors = (List<Map<String, Object>>) responseMap.get("vendor");
			for (Map<String, Object> vendor : vendors) {
				if (!vendor.containsKey("vehicles")) continue;

				List<Map<String, Object>> vehicles = (List<Map<String, Object>>) vendor.get("vehicles");
				for (Map<String, Object> vehicle : vehicles) {
					String regNumber = (String) vehicle.get("registrationNumber");
					if (regNumber != null &&
							regNumber.toLowerCase().contains(vehicleRegNumber.toLowerCase())) {
						vehicleIds.add(vehicle.get("id").toString());
					}
				}
			}
		} catch (Exception e) {
			log.error("Error extracting vehicle IDs by registration number", e);
		}
		return vehicleIds;
	}

	public void enrichWithTripReportDetails(RequestInfo requestInfo,
											List<WaterTankerBookingDetail> bookings) {
		if (CollectionUtils.isEmpty(bookings)) return;

		for (WaterTankerBookingDetail booking : bookings) {
			if (booking.getBookingNo() == null) continue;

			try {
				Object tripReportResponse = driverTripReportUtil.searchTripReport(
						requestInfo,
						booking.getTenantId(),
						booking.getBookingNo()
				);

				// Extract only the driverTripReports list, not the full response wrapper
				if (tripReportResponse != null) {
					Map<String, Object> responseMap = mapper.convertValue(tripReportResponse, Map.class);
					Object tripReportList = responseMap.get("driverTripReports");
					booking.setDriverTripReport(tripReportList);  // will be [] or a list of reports
				}

			} catch (Exception e) {
				log.error("Failed to enrich trip report for bookingNo: {}", booking.getBookingNo(), e);
			}
		}
	}

	/**
	 * Searches through all vendors' drivers lists and returns the driver owner UUIDs
	 * where the driver name matches the search term (case-insensitive, partial match).
	 * NOTE: booking table stores driver owner UUID (from owner.uuid), not the driver entity id.
	 */
	private List<String> extractDriverOwnerUuidsByName(Object response, String driverName) {
		List<String> driverOwnerUuids = new ArrayList<>();
		try {
			Map<String, Object> responseMap = mapper.convertValue(response, Map.class);
			if (!responseMap.containsKey("vendor")) return driverOwnerUuids;

			List<Map<String, Object>> vendors = (List<Map<String, Object>>) responseMap.get("vendor");
			for (Map<String, Object> vendor : vendors) {
				if (!vendor.containsKey("drivers")) continue;

				List<Map<String, Object>> drivers = (List<Map<String, Object>>) vendor.get("drivers");
				if (drivers == null) continue;

				for (Map<String, Object> driver : drivers) {
					String name = (String) driver.get("name");
					if (name != null &&
							name.toLowerCase().contains(driverName.toLowerCase())) {
						// booking table stores owner.uuid as driverId, not driver entity id
						Map<String, Object> owner = (Map<String, Object>) driver.get("owner");
						if (owner != null && owner.get("uuid") != null) {
							driverOwnerUuids.add(owner.get("uuid").toString());
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("Error extracting driver owner UUIDs by name", e);
		}
		return driverOwnerUuids;
	}
}
