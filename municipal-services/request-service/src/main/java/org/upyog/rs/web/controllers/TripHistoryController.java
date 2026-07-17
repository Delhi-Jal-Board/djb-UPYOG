package org.upyog.rs.web.controllers;

import digit.models.coremodels.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.upyog.rs.repository.DriverTripRepository;
import org.upyog.rs.service.impl.TripHistoryServiceImpl;
import org.upyog.rs.util.ResponseInfoFactory;
import org.upyog.rs.web.models.*;

import javax.validation.Valid;
import java.util.List;
@RestController
@RequestMapping("/v1/trip/history")
public class TripHistoryController {

    @Autowired
    private TripHistoryServiceImpl tripHistoryService;

    @Autowired
    private ResponseInfoFactory responseInfoFactory;

    @Autowired
    private DriverTripRepository driverTripRepository;

    @PostMapping("/_create")
    public ResponseEntity<TripHistoryResponse> create(@Valid @RequestBody TripHistoryRequest request) {
        List<TripHistory> trips = tripHistoryService.createTrip(request);
        TripHistoryResponse response = TripHistoryResponse.builder()
                .tripHistory(trips)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .build();
        return new ResponseEntity<>(response, HttpStatus.ACCEPTED);
    }

    @PostMapping("/_search")
    public ResponseEntity<TripHistoryResponse> search(
            @Valid @RequestBody RequestInfoWrapper requestInfoWrapper,
            @ModelAttribute TripHistorySearchCriteria criteria) {

        TripHistorySearchResult result = tripHistoryService.searchTrips(criteria);

        // Enrich the trips with file store IDs
        if (result.getTrips() != null) {
            for (TripHistory trip : result.getTrips()) {
                DriverTrip driverTrip = driverTripRepository.findByBookingNo(trip.getBookingNo());
                if (driverTrip != null) {
                    trip.setStartFileStoreId(driverTrip.getStartFileStoreId());
                    trip.setEndFileStoreId(driverTrip.getEndFileStoreId());
                }
            }
        }

        TripHistoryResponse response = TripHistoryResponse.builder()
                .tripHistory(result.getTrips())
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(
                        requestInfoWrapper.getRequestInfo(), true))
                .totalCount(result.getCount())
                .count(result.getTrips() != null ? result.getTrips().size() : 0)
                .offset(criteria.getOffset())
                .limit(criteria.getLimit())
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}