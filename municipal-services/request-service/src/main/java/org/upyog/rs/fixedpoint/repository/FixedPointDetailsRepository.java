package org.upyog.rs.fixedpoint.repository;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Repository;
import org.upyog.rs.fixedpoint.web.model.FixedPointDetails;
import org.upyog.rs.fixedpoint.web.model.FixedPointSearchCriteria;
import org.upyog.rs.fixedpoint.web.model.FixedPointTimeTableDetail;

import java.util.List;

@Repository
public interface FixedPointDetailsRepository  {

    void saveFixedPointDetails(List<FixedPointDetails> fixedPointDetailsList, RequestInfo requestInfo);

    void updateFixedPointDetails(FixedPointDetails fixedPointDetailsList, RequestInfo requestInfo);

    Integer getCount(FixedPointSearchCriteria criteria);

    List<FixedPointTimeTableDetail> getDetails(FixedPointSearchCriteria criteria);


    /**
     * Scheduler-specific method.
     *
     * Fetches active timetable rows for:
     * - tenant
     * - day of week
     * - optional filling point
     *
     * One timetable row = one booking.
     */
    List<FixedPointTimeTableDetail> getScheduledFixedPointsForScheduler(
            String tenantId,
            String dayOfWeek,
            String fillingPointId
    );

    List<String> getAllActiveFillingPoints(String tenantId);

    // Inside FillingPointRepository.java
    List<String> getActiveFillingPointIds(String tenantId);

    List<String> getValidFillingPointIdsForToday(String tenantId, String dayOfWeek);
}