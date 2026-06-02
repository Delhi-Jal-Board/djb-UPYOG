package org.upyog.rs.web.controllers;


import java.util.Collections;
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import javax.validation.Valid;

import org.apache.commons.lang3.ObjectUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.upyog.rs.constant.RequestServiceConstants;
import org.upyog.rs.service.MobileToiletService;
import org.upyog.rs.service.WaterTankerService;
import org.upyog.rs.util.RequestServiceUtil;
import org.upyog.rs.util.ResponseInfoFactory;
import org.upyog.rs.validator.ValidatorService;
import org.upyog.rs.web.models.CriteriyaSearch;
import org.upyog.rs.web.models.CriteriyaSearchDto;
import org.upyog.rs.web.models.RequestDetailsByDriverId;
import org.upyog.rs.web.models.ResponseInfo;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingDetail;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingRequest;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingResponse;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingSearchCriteria;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingSearchResponse;
import org.upyog.rs.web.models.waterTanker.*;
import org.upyog.rs.web.models.ResponseInfo.StatusEnum;

import digit.models.coremodels.RequestInfoWrapper;
import lombok.extern.slf4j.Slf4j;
import org.upyog.rs.wt.scheduler.model.FixedPointSchedulerRunRequest;
import org.upyog.rs.wt.scheduler.model.FixedPointSchedulerRunResponse;
import org.upyog.rs.wt.scheduler.service.FixedPointBookingSchedulerService;
import org.upyog.rs.wt.scheduler.service.WaterTankerCancellationService;

import javax.annotation.processing.Generated;

@Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-01-16T15:46:56.897+05:30")

@Controller
@Slf4j
public class RequestServiceController {
	
	@Autowired
	private WaterTankerService waterTankerService;

	@Autowired
	private MobileToiletService mobileToiletService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Autowired
	private ValidatorService validatorService;

	@Autowired
	private WaterTankerCancellationService cancellationService;

	private final FixedPointBookingSchedulerService schedulerService;

    public RequestServiceController(FixedPointBookingSchedulerService schedulerService, WaterTankerCancellationService cancellationService) {
        this.schedulerService = schedulerService;
		this.cancellationService=cancellationService;
    }

    @PostMapping("/water-tanker/v1/_create")
	public ResponseEntity<WaterTankerBookingResponse> createWaterTankerBooking(
			@Schema(description = "Details for the water tanker booking time, payment and documents", required = true)
			@RequestBody WaterTankerBookingRequest waterTankerbookingRequest) {
		log.info("waterTankerbookingRequest : {}" , waterTankerbookingRequest);
        validatorService.validateRequest(waterTankerbookingRequest);
		WaterTankerBookingDetail waterTankerDetail = waterTankerService.createNewWaterTankerBookingRequest(waterTankerbookingRequest);
		ResponseInfo info = RequestServiceUtil.createReponseInfo(waterTankerbookingRequest.getRequestInfo(),
				RequestServiceConstants.BOOKING_CREATED, StatusEnum.SUCCESSFUL);
		WaterTankerBookingResponse response = WaterTankerBookingResponse.builder()
				.waterTankerBookingApplication(waterTankerDetail)
				.responseInfo(info).build();
		return new ResponseEntity<WaterTankerBookingResponse>(response, HttpStatus.OK);
	}


	@PostMapping("/water-tanker/fixed-point/v1/_create")
	public ResponseEntity<WaterTankerFixedPointResponse> createWaterTankerBookingFixedPOint(
			@RequestBody WaterTankerFixedPointRequest waterTankerFixedPointRequest) {
		log.info("waterTankerbookingRequest : {}" , waterTankerFixedPointRequest);
		WaterTankerFixedPointDetail waterTankerFixedPointDetail = waterTankerService.createFixedPointWaterTankerBookingRequest(waterTankerFixedPointRequest);
		ResponseInfo info = RequestServiceUtil.createReponseInfo(waterTankerFixedPointRequest.getRequestInfo(),
				RequestServiceConstants.FIXED_POINT_CREATED, StatusEnum.SUCCESSFUL);
		WaterTankerFixedPointResponse response = WaterTankerFixedPointResponse.builder()
				.waterTankerFixedPointDetail(waterTankerFixedPointDetail)
				.responseInfo(info).build();
		return new ResponseEntity<WaterTankerFixedPointResponse>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/_search")
	public ResponseEntity<WaterTankerBookingSearchResponse> searchWaterTankerBookingDetails(
			@Schema(description = "Details for the water tanker booking time, payment and documents", required = true) @Valid @RequestBody RequestInfoWrapper requestInfoWrapper,
			@ModelAttribute WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria) {

		List<WaterTankerBookingDetail> applications = null;
		Integer count = 0;
		WaterTankerBookingSearchCriteria totalCountCriteria =
				buildTotalCountCriteria(waterTankerBookingSearchCriteria);

		applications = waterTankerService.getWaterTankerBookingDetails(requestInfoWrapper.getRequestInfo(),
				waterTankerBookingSearchCriteria);

		count = waterTankerService.getApplicationsCount(waterTankerBookingSearchCriteria,
				requestInfoWrapper.getRequestInfo());
		if (count == 0 && !applications.isEmpty()) {
			count = applications.size();
		}
		Integer totalCount = waterTankerService.getTotalApplicationsCount(
				totalCountCriteria, requestInfoWrapper.getRequestInfo());

		Map<String, Integer> statusCounts = waterTankerService.getBookingStatusCounts(
				waterTankerBookingSearchCriteria,
				requestInfoWrapper.getRequestInfo()).getStatusCounts();
		/*
		 * Create Response Info with success status and used utilize method to generate
		 * standardized response
		 */
		ResponseInfo responseInfo = RequestServiceUtil.createReponseInfo(requestInfoWrapper.getRequestInfo(),
				RequestServiceConstants.BOOKING_DETAIL_FOUND, StatusEnum.SUCCESSFUL);
		/*
		 * Build search response using builder and retrieve booking details and response
		 * metadata
		 */
		WaterTankerBookingSearchResponse response = WaterTankerBookingSearchResponse.builder()
				.waterTankerBookingDetails(applications).responseInfo(responseInfo).count(count)
				.totalCount(totalCount)
				.statusCounts(statusCounts)
				.applicationType(waterTankerBookingSearchCriteria.getApplicationType()).build();
		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/fixed-point/v1/_search")
	public ResponseEntity<WaterTankerFixedPointBookingSearchResponse> search(
			@Valid @RequestBody RequestInfoWrapper requestInfoWrapper,
			@ModelAttribute WaterTankerFixedPointBookingSearchCriteria criteria) {

		int limit = (criteria.getLimit() != null && criteria.getLimit() > 0)
				? Math.min(criteria.getLimit(), 100) : 50;
		criteria.setLimit(limit);

		int offset = (criteria.getOffset() != null && criteria.getOffset() >= 0)
				? criteria.getOffset() : 0;
		criteria.setOffset(offset);

		Long totalCount = waterTankerService.getWaterTankerFixedPointCount(criteria);

		List<WaterTankerFixedPointDetail> applications =
				waterTankerService.getWaterTankerFixedPointBookingDetails(
						requestInfoWrapper.getRequestInfo(), criteria);

		boolean hasMore = (offset + applications.size()) < totalCount;

		ResponseInfo responseInfo = RequestServiceUtil.createReponseInfo(
				requestInfoWrapper.getRequestInfo(),
				RequestServiceConstants.BOOKING_DETAIL_FOUND,
				StatusEnum.SUCCESSFUL);

		return new ResponseEntity<>(
				WaterTankerFixedPointBookingSearchResponse.builder()
						.waterTankerFixedPointDetails(applications)
						.responseInfo(responseInfo)
						.count(totalCount)
						.pageSize(limit)
						.hasMore(hasMore)
						.build(),
				HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/_update")
	public ResponseEntity<WaterTankerBookingResponse> waterTankerUpdate(
			@Schema(description = "Updated water tanker details and RequestInfo meta data.", required = true)
			@RequestBody WaterTankerBookingRequest waterTankerRequest) {
		
		WaterTankerBookingDetail waterTankerDetail = waterTankerService.updateWaterTankerBooking(waterTankerRequest, null);

		WaterTankerBookingResponse response = WaterTankerBookingResponse.builder().waterTankerBookingApplication(waterTankerDetail)
				.responseInfo(RequestServiceUtil.createReponseInfo(waterTankerRequest.getRequestInfo(),
						RequestServiceConstants.APPLICATION_UPDATED, StatusEnum.SUCCESSFUL))
				.build();
		return new ResponseEntity<WaterTankerBookingResponse>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/emergency/_update")
	public ResponseEntity<WaterTankerBookingResponse> waterTankerEmergencyUpdate(
			@Schema(description = "Updated water tanker details and RequestInfo meta data.", required = true)
			@RequestBody WaterTankerBookingRequest waterTankerRequest) {

		WaterTankerBookingDetail waterTankerDetail = waterTankerService.updateWaterTankerEmergencyBooking(waterTankerRequest);

		WaterTankerBookingResponse response = WaterTankerBookingResponse.builder().waterTankerBookingApplication(waterTankerDetail)
				.responseInfo(RequestServiceUtil.createReponseInfo(waterTankerRequest.getRequestInfo(),
						RequestServiceConstants.APPLICATION_UPDATED, StatusEnum.SUCCESSFUL))
				.build();
		return new ResponseEntity<WaterTankerBookingResponse>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/fixed-point/v1/_update")
	public ResponseEntity<WaterTankerFixedPointResponse> updateWaterTankerFixedPointBooking(
			@RequestBody WaterTankerFixedPointRequest waterTankerFixedPointRequest) {

		log.info("updateWaterTankerFixedPointRequest : {}", waterTankerFixedPointRequest);

		if (waterTankerFixedPointRequest.getWaterTankerFixedPointDetail() == null
				|| waterTankerFixedPointRequest.getWaterTankerFixedPointDetail().getApplicantDetail() == null) {
			throw new CustomException("INVALID_REQUEST", "applicantID is mandatory for update");
		}

		WaterTankerFixedPointDetail updated =
				waterTankerService.updateFixedPointWaterTankerBookingRequest(waterTankerFixedPointRequest);

		ResponseInfo info = RequestServiceUtil.createReponseInfo(
				waterTankerFixedPointRequest.getRequestInfo(),
				RequestServiceConstants.APPLICATION_UPDATED,
				StatusEnum.SUCCESSFUL);

		WaterTankerFixedPointResponse response = WaterTankerFixedPointResponse.builder()
				.waterTankerFixedPointDetail(updated)
				.responseInfo(info).build();

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/mobile-toilet/v1/_create")
	public ResponseEntity<MobileToiletBookingResponse> createMobileToiletBooking(
			@Schema(description = "Details for the mobile Toilet booking time, payment and documents", required = true)
			@RequestBody MobileToiletBookingRequest mobileToiletbookingRequest) {
		log.info("mobileToiletbookingRequest : {}" , mobileToiletbookingRequest);
		validatorService.validateRequest(mobileToiletbookingRequest);
		MobileToiletBookingDetail mobileToiletDetail = mobileToiletService.createNewMobileToiletBookingRequest(mobileToiletbookingRequest);
		ResponseInfo info = RequestServiceUtil.createReponseInfo(mobileToiletbookingRequest.getRequestInfo(),
				RequestServiceConstants.MT_BOOKING_CREATED, StatusEnum.SUCCESSFUL);
		MobileToiletBookingResponse response = MobileToiletBookingResponse.builder()
				.mobileToiletBookingApplication(mobileToiletDetail)
				.responseInfo(info).build();
		return new ResponseEntity<MobileToiletBookingResponse>(response, HttpStatus.OK);
	}

	@PostMapping("/mobile-toilet/v1/_search")
	public ResponseEntity<MobileToiletBookingSearchResponse> searchMobileToiletBookingDetails(
			@Schema(description = "Details for the Mobile Toilet booking time, payment and documents", required = true) @Valid @RequestBody RequestInfoWrapper requestInfoWrapper,
			@ModelAttribute MobileToiletBookingSearchCriteria mobileToiletBookingSearchCriteria) {

		List<MobileToiletBookingDetail> applications = null;
		Integer count = 0;

		applications =mobileToiletService.getMobileToiletBookingDetails(requestInfoWrapper.getRequestInfo(),
				mobileToiletBookingSearchCriteria);

		count = mobileToiletService.getApplicationsCount(mobileToiletBookingSearchCriteria,
				requestInfoWrapper.getRequestInfo());

		/*
		 * Create Response Info with success status and used utilize method to generate
		 * standardized response
		 */
		ResponseInfo responseInfo = RequestServiceUtil.createReponseInfo(requestInfoWrapper.getRequestInfo(),
				RequestServiceConstants.MOBILE_TOILET_BOOKING_DETAIL_FOUND, StatusEnum.SUCCESSFUL);
		/*
		 * Build search response using builder and retrieve booking details and response
		 * metadata
		 */
		MobileToiletBookingSearchResponse response = MobileToiletBookingSearchResponse.builder()
				.mobileToiletBookingDetails(applications).responseInfo(responseInfo).count(count).build();
		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/mobile-toilet/v1/_update")
	public ResponseEntity<MobileToiletBookingResponse> mobileToiletUpdate(
			@Schema(description = "Updated water tanker details and RequestInfo meta data.", required = true)
			@RequestBody MobileToiletBookingRequest mobileToiletRequest) {

		MobileToiletBookingDetail mobileToiletDetail = mobileToiletService.updateMobileToiletBooking(mobileToiletRequest, null);

		MobileToiletBookingResponse response = MobileToiletBookingResponse.builder().mobileToiletBookingApplication(mobileToiletDetail)
				.responseInfo(RequestServiceUtil.createReponseInfo(mobileToiletRequest.getRequestInfo(),
						RequestServiceConstants.APPLICATION_UPDATED, StatusEnum.SUCCESSFUL))
				.build();
		return new ResponseEntity<MobileToiletBookingResponse>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/_driver_assignments")
	public ResponseEntity<RequestDetailsByDriverId> getDriverAssignments(
			@RequestBody @Valid CriteriyaSearchDto searchDto) {

		CriteriyaSearch criteria = searchDto.getCriteriyaSearch();


		List<RequestDetailsByDriverId.RequestDetailsInfo> details =
				waterTankerService.getBookingAndAssignmentDetails(
						criteria.getDriverId(),
						criteria.getFromDate(),
						criteria.getToDate()
				);

		RequestDetailsByDriverId response = RequestDetailsByDriverId.builder()
				.requestDetailsInfo(details)
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchDto.getRequestInfo(), true))
				.build();

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/_driverSearch")
	public ResponseEntity<WaterTankerBookingSearchResponse> searchDriverBookings(
			@Valid @RequestBody CriteriyaSearchDto criteriyaSearchDto) {

		// Pass the entire DTO to the service
		List<WaterTankerBookingDetail> applications = waterTankerService.getDriverAssignedBookings(criteriyaSearchDto);

		// Use the requestInfo from the DTO
		ResponseInfo responseInfo = RequestServiceUtil.createReponseInfo(
				criteriyaSearchDto.getRequestInfo(),
				"Driver applications fetched successfully",
				StatusEnum.SUCCESSFUL);

		WaterTankerBookingSearchResponse response = WaterTankerBookingSearchResponse.builder()
				.waterTankerBookingDetails(applications)
				.responseInfo(responseInfo)
				.count(applications.size()).build();

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/v1/_updatestatus")
	public ResponseEntity<WaterTankerBookingResponse> updateLifecycle(
			@RequestBody WaterTankerBookingRequest waterTankerRequest) {

		WaterTankerBookingDetail waterTankerDetail = waterTankerService.updateBookingLifecycle(waterTankerRequest);

		WaterTankerBookingResponse response = WaterTankerBookingResponse.builder()
				.waterTankerBookingApplication(waterTankerDetail)
				.responseInfo(RequestServiceUtil.createReponseInfo(waterTankerRequest.getRequestInfo(),
						"Booking status updated successfully", StatusEnum.SUCCESSFUL))
				.build();

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@PostMapping("/water-tanker/fixed-filling/v1/_mapping")
	public ResponseEntity<FixedFillingPointMappingResponse> create(
			@Valid @RequestBody FixedFillingPointMappingRequest request) {

		log.info("Received request to create FixedFillingPointMapping");
		FixedFillingPointMapping mapping = waterTankerService.createMapping(request);

		FixedFillingPointMappingResponse response = FixedFillingPointMappingResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(
						request.getRequestInfo(), true))
				.fixedFillingPointMappings(Collections.singletonList(mapping))
				.message("Mapping created successfully")
				.build();

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}




	@PostMapping("/water-tanker/fixed_point/scheduler/_run")
	public ResponseEntity<FixedPointSchedulerRunResponse> runSchedulerManually(
			@Valid @RequestBody FixedPointSchedulerRunRequest request
	) {
		log.info("Manual fixed-point scheduler API called. tenantId={}, deliveryDate={}, fillingPointId={}",
				request.getTenantId(),
				request.getDeliveryDate(),
				request.getFillingPointId());

		FixedPointSchedulerRunResponse response = schedulerService.runScheduler(
				request.getTenantId(),
				request.getDeliveryDate(),
				request.getFillingPointId(),
				request.getRequestInfo()
		);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/water-tanker/fixed_point/_cancel-scheduled")
	public ResponseEntity<String> manuallyTriggerCancellations(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		cancellationService.cancelScheduledBookings(requestInfoWrapper.getRequestInfo());

		return new ResponseEntity<>("Cancellation process initiated successfully", HttpStatus.OK);
	}

	private WaterTankerBookingSearchCriteria buildTotalCountCriteria(
			WaterTankerBookingSearchCriteria source) {

		WaterTankerBookingSearchCriteria criteria = new WaterTankerBookingSearchCriteria();
			criteria.setTenantId(source.getTenantId());
		criteria.setApplicationType(source.getApplicationType());

		return criteria;
	}
}
