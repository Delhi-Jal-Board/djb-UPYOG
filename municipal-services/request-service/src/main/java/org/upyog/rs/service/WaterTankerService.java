package org.upyog.rs.service;

import org.egov.common.contract.request.RequestInfo;
import org.upyog.rs.web.models.CriteriyaSearchDto;
import org.upyog.rs.web.models.RequestDetailsByDriverId;
import org.upyog.rs.web.models.waterTanker.*;

import digit.models.coremodels.PaymentRequest;

import java.util.*;

public interface WaterTankerService {
	
	public WaterTankerBookingDetail createNewWaterTankerBookingRequest(WaterTankerBookingRequest waterTankerRequest);

	public WaterTankerFixedPointDetail createFixedPointWaterTankerBookingRequest(WaterTankerFixedPointRequest waterTankerFixedPointRequest);


	public List<WaterTankerBookingDetail> getWaterTankerBookingDetails(RequestInfo requestInfo, WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria);

	public List<WaterTankerFixedPointDetail> getWaterTankerFixedPointBookingDetails(RequestInfo requestInfo, WaterTankerFixedPointBookingSearchCriteria waterTankerFixedPointBookingSearchCriteria);

	WaterTankerFixedPointDetail updateFixedPointWaterTankerBookingRequest(
			WaterTankerFixedPointRequest waterTankerFixedPointRequest);
	public Integer getApplicationsCount(WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria, RequestInfo requestInfo);

	public void updateWaterTankerBooking(PaymentRequest paymentRequest, String applicationStatus);

	public WaterTankerBookingDetail updateWaterTankerBooking(WaterTankerBookingRequest waterTankerRequest, String applicationStatus);
	public WaterTankerBookingDetail updateWaterTankerEmergencyBooking(WaterTankerBookingRequest waterTankerRequest);

	List<RequestDetailsByDriverId.RequestDetailsInfo> getBookingAndAssignmentDetails(String driverId, Long fromDate, Long toDate);

	List<WaterTankerBookingDetail> getDriverAssignedBookings(CriteriyaSearchDto criteriyaSearchDto);
	WaterTankerBookingDetail updateBookingLifecycle(WaterTankerBookingRequest request);

	FixedFillingPointMapping createMapping(FixedFillingPointMappingRequest request);
	Long getWaterTankerFixedPointCount(WaterTankerFixedPointBookingSearchCriteria criteria, RequestInfo requestInfo);
	BookingStatusCountResponse getBookingStatusCounts(WaterTankerBookingSearchCriteria criteria,RequestInfo requestInfo);
	Integer getTotalApplicationsCount(WaterTankerBookingSearchCriteria waterTankerBookingSearchCriteria,
									  RequestInfo requestInfo);
}
