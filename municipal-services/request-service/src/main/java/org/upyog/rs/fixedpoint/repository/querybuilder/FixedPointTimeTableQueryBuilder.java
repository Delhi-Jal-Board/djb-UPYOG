package org.upyog.rs.fixedpoint.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.fixedpoint.web.model.FixedPointSearchCriteria;
import java.util.List;

@Component
@Slf4j
public class FixedPointTimeTableQueryBuilder {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RequestServiceConfiguration config;

    public boolean existsByFixedPointCode(String fixedPointCode) {
        String query = "SELECT COUNT(1) FROM eg_fixed_point_time_table fpt WHERE fpt.fixed_point_code = ?";
        log.info("FixedPointTimeTable :: existsByFixedPointCode :: Checking for fixedPointCode: {}", fixedPointCode);
        Integer count = jdbcTemplate.queryForObject(query, Integer.class, fixedPointCode);
        return count != null && count > 0;
    }

    private static final String SEARCH_QUERY =
            "SELECT fpt.system_assigned_schedule_id, fpt.fixed_point_code, fpt.day, fpt.trip_no, " +
                    "fpt.arrival_time_to_fpl, fpt.departure_time_from_fpl, " +
                    "fpt.arrival_time_delivery_point, fpt.departure_time_delivery_point, " +
                    "fpt.time_of_arriving_back_fpl_after_delivery, fpt.volume_water_tobe_delivery, " +
                    "fpt.active, fpt.is_enable, fpt.remarks, fpt.vehicle_id, fpt.tenant_id, " +
                    "fpt.createdby, fpt.lastmodifiedby, fpt.createdtime, fpt.lastmodifiedtime, " +
                    "apd.name AS fixed_point_name, apd.fixed_point_id, fpt.filling_point_id, " +
                    "fp.filling_point_name " +
                    "FROM eg_fixed_point_time_table fpt " +
                    "LEFT JOIN ( " +
                    "SELECT DISTINCT ON (fixed_point_id) fixed_point_id, name " +
                    "FROM upyog_rs_water_tanker_applicant_details " +
                    "ORDER BY fixed_point_id, createdtime DESC " +
                    ") apd ON apd.fixed_point_id = fpt.fixed_point_code " +
                    "LEFT JOIN upyog_rs_water_tanker_filling_point fp " +
                    "ON fp.filling_point_id = fpt.filling_point_id";

    private static final String COUNT_QUERY = "SELECT COUNT(DISTINCT fpt.system_assigned_schedule_id) " +
            "FROM eg_fixed_point_time_table fpt " +
            "LEFT JOIN upyog_rs_water_tanker_applicant_details apd " +
            "ON apd.fixed_point_id = fpt.fixed_point_code";

    private final String paginationWrapper =
            "SELECT * FROM (" +
                    "SELECT *, ROW_NUMBER() OVER (" +
                    "ORDER BY createdtime DESC, " +
                    "CASE day " +
                    "WHEN 'MONDAY'    THEN 1 " +
                    "WHEN 'TUESDAY'   THEN 2 " +
                    "WHEN 'WEDNESDAY' THEN 3 " +
                    "WHEN 'THURSDAY'  THEN 4 " +
                    "WHEN 'FRIDAY'    THEN 5 " +
                    "WHEN 'SATURDAY'  THEN 6 " +
                    "WHEN 'SUNDAY'    THEN 7 " +
                    "ELSE 8 END ASC" +
                    ") AS offset_ FROM ({}) result" +
                    ") result_offset " +
                    "WHERE offset_ > ? AND offset_ <= ?";

    public String getSearchQuery(FixedPointSearchCriteria criteria, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(criteria.isCountCall() ? COUNT_QUERY : SEARCH_QUERY);

        if (!ObjectUtils.isEmpty(criteria.getScheduleId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.system_assigned_schedule_id = ? ");
            preparedStmtList.add(criteria.getScheduleId());
        }

        if (!ObjectUtils.isEmpty(criteria.getFixedPointCode())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.fixed_point_code = ? ");
            preparedStmtList.add(criteria.getFixedPointCode());
        }

        if (!ObjectUtils.isEmpty(criteria.getFillingPointId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.filling_point_id = ? ");
            preparedStmtList.add(criteria.getFillingPointId());
        }

        if (criteria.getIsEnable() != null) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.is_enable = ? ");
            preparedStmtList.add(criteria.getIsEnable());
        }

        if (!ObjectUtils.isEmpty(criteria.getDay())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.day = ? ");
            preparedStmtList.add(criteria.getDay());
        }

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.tenant_id = ? ");
            preparedStmtList.add(criteria.getTenantId());
        }

        if (!ObjectUtils.isEmpty(criteria.getVehicleId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" fpt.vehicle_id = ? ");
            preparedStmtList.add(criteria.getVehicleId());
        }

        if (criteria.isCountCall()) {
            return query.toString();
        }

        query.append(" ORDER BY fpt.createdtime DESC, " +
                "CASE fpt.day " +
                "WHEN 'MONDAY'    THEN 1 " +
                "WHEN 'TUESDAY'   THEN 2 " +
                "WHEN 'WEDNESDAY' THEN 3 " +
                "WHEN 'THURSDAY'  THEN 4 " +
                "WHEN 'FRIDAY'    THEN 5 " +
                "WHEN 'SATURDAY'  THEN 6 " +
                "WHEN 'SUNDAY'    THEN 7 " +
                "ELSE 8 END ASC");

        return addPaginationWrapper(query.toString(), preparedStmtList, criteria);
    }

    private void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (query.toString().toUpperCase().contains("WHERE")) {
            query.append(" AND ");
        } else {
            query.append(" WHERE ");
        }
    }

    private String addPaginationWrapper(String query, List<Object> preparedStmtList, FixedPointSearchCriteria criteria) {
        int limit = (criteria.getLimit() != null) ? criteria.getLimit() : config.getDefaultLimit();
        int offset = (criteria.getOffset() != null) ? criteria.getOffset() : config.getDefaultOffset();

        String finalQuery = paginationWrapper.replace("{}", query);
        preparedStmtList.add(offset);
        preparedStmtList.add(offset + limit);

        return finalQuery;
    }

    public boolean existsByFixedPointCodeAndDayAndArrivalTime(String fixedPointCode,
                                                              String day,
                                                              String arrivalTimeToFpl) {
        String query = "SELECT COUNT(1) FROM eg_fixed_point_time_table " +
                "WHERE fixed_point_code = ? AND day = ? AND arrival_time_to_fpl = ?";
        log.info("FixedPointTimeTable :: existsByFixedPointCodeAndDayAndArrivalTime :: " +
                        "Checking fixedPointCode: {}, day: {}, arrivalTime: {}",
                fixedPointCode, day, arrivalTimeToFpl);
        Integer count = jdbcTemplate.queryForObject(query, Integer.class,
                fixedPointCode, day, arrivalTimeToFpl);
        return count != null && count > 0;
    }

    public boolean existsByFixedPointCodeAndDay(String fixedPointCode, String day) {
        String query = "SELECT COUNT(1) FROM eg_fixed_point_time_table " +
                "WHERE fixed_point_code = ? AND day = ?";
        log.info("FixedPointTimeTable :: existsByFixedPointCodeAndDay :: " +
                "Checking fixedPointCode: {}, day: {}", fixedPointCode, day);
        Integer count = jdbcTemplate.queryForObject(query, Integer.class, fixedPointCode, day);
        return count != null && count > 0;
    }

    /**
     * Scheduler query.
     *
     * Important:
     * - One row from timetable = one booking.
     * - Same fixed point may have multiple rows on same day with different delivery_time.
     * - Therefore, do not group by fixed_point_id.
     */
    /**
     * Scheduler query.
     *
     * Important:
     * - One row from timetable = one booking.
     * - Same fixed point may have multiple rows on same day with different delivery_time.
     * - Therefore, do not group by fixed_point_id.
     */
    public String getSchedulerSearchQuery(
            String tenantId,
            String dayOfWeek,
            String fillingPointId,
            List<Object> preparedStmtList
    ) {
        StringBuilder query = new StringBuilder();

        query.append("""
          SELECT
               tt.*,
               fp.filling_point_name
               FROM eg_fixed_point_time_table tt
               LEFT JOIN upyog_rs_water_tanker_filling_point fp
              ON fp.filling_point_id = tt.filling_point_id
              WHERE tt.tenant_id = ?
              AND tt.day = ? AND tt.active = true
        """);

        preparedStmtList.add(tenantId);
        preparedStmtList.add(dayOfWeek);

        if (fillingPointId != null && !fillingPointId.isBlank()) {
            // FIX: Added 'tt.' to resolve ambiguity
            query.append(" AND tt.filling_point_id = ? ");
            preparedStmtList.add(fillingPointId);
        }

        query.append(" ORDER BY tt.filling_point_id, tt.fixed_point_code, tt.departure_time_delivery_point ");
        return query.toString();
    }

}
