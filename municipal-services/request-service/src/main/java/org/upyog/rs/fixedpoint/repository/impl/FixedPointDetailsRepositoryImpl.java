package org.upyog.rs.fixedpoint.repository.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.fixedpoint.repository.FixedPointDetailsRepository;
import org.upyog.rs.fixedpoint.repository.querybuilder.FixedPointTimeTableQueryBuilder;
import org.upyog.rs.fixedpoint.repository.rowMapper.FixedPointRowMapper;
import org.upyog.rs.fixedpoint.web.model.FixedPointDetails;
import org.upyog.rs.fixedpoint.web.model.FixedPointDetailsRequest;
import org.upyog.rs.fixedpoint.web.model.FixedPointSearchCriteria;
import org.upyog.rs.fixedpoint.web.model.FixedPointTimeTableDetail;
import org.upyog.rs.kafka.Producer;
import org.egov.common.contract.request.RequestInfo;
import org.upyog.rs.repository.rowMapper.GenericRowMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class FixedPointDetailsRepositoryImpl implements FixedPointDetailsRepository {

    @Autowired
    private FixedPointTimeTableQueryBuilder fixedPointTimeTableQueryBuilder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Producer producer;

    @Autowired
    private FixedPointRowMapper fixedPointRowMapper;


    @Autowired
    private RequestServiceConfiguration config;

    @Override
    public List<FixedPointTimeTableDetail> getDetails(FixedPointSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = fixedPointTimeTableQueryBuilder.getSearchQuery(criteria, preparedStmtList);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), fixedPointRowMapper);
    }


    @Override
    public Integer getCount(FixedPointSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = fixedPointTimeTableQueryBuilder.getSearchQuery(criteria, preparedStmtList);
        return jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);
    }


    @Override
    public void saveFixedPointDetails(List<FixedPointDetails> fixedPointDetailsList, RequestInfo requestInfo) {
        log.info("FixedPointDetailsRepositoryImpl :: saveFixedPointDetails :: Pushing {} records to topic: {}",
                fixedPointDetailsList.size(), fixedPointDetailsList);

        FixedPointDetailsRequest kafkaRequest = FixedPointDetailsRequest.builder()
                .requestInfo(requestInfo)
                .fixedPointDetailsList(fixedPointDetailsList)
                .build();

        producer.push(config.getSaveFixedPointTimeTable(), kafkaRequest);

        log.info("FixedPointDetailsRepositoryImpl :: saveFixedPointDetails :: Successfully pushed to Kafka");
    }

    @Override
    public void updateFixedPointDetails(FixedPointDetails fixedPointDetails, RequestInfo requestInfo) {
        log.info("FixedPointDetailsRepository :: updateFixedPointDetails :: Pushing to Kafka topic: {}", config.getUpdateFixedPointTimeTable());

        FixedPointDetailsRequest request = FixedPointDetailsRequest.builder()
                .requestInfo(requestInfo)
                .fixedPointDetailsList(Collections.singletonList(fixedPointDetails))
                .build();

        producer.push(config.getUpdateFixedPointTimeTable(), request);

        log.info("FixedPointDetailsRepository :: updateFixedPointDetails :: Successfully pushed to Kafka");
    }


    /**
     * Used by auto scheduler and manual scheduler API.
     *
     * This fetches active fixed-point timetable records for a selected day.
     * If fillingPointId is passed, it fetches only that filling point.
     * If fillingPointId is null/blank, it fetches all filling points.
     */
    @Override
    public List<FixedPointTimeTableDetail> getScheduledFixedPointsForScheduler(
            String tenantId,
            String dayOfWeek,
            String fillingPointId
    ) {
        List<Object> preparedStmtList = new ArrayList<>();

        String query = fixedPointTimeTableQueryBuilder.getSchedulerSearchQuery(
                tenantId,
                dayOfWeek,
                fillingPointId,
                preparedStmtList
        );

        log.info("Fetching scheduler fixed points. tenantId={}, dayOfWeek={}, fillingPointId={}",
                tenantId, dayOfWeek, fillingPointId);

        return jdbcTemplate.query(query, preparedStmtList.toArray(), fixedPointRowMapper);
    }

    @Override
    public List<String> getAllActiveFillingPoints(String tenantId) {
      String query = "SELECT DISTINCT filling_point_id FROM eg_fixed_point_time_table WHERE tenant_id = ? AND is_enable  = true";

        log.info("Fetching distinct filling target definitions. Query executed: {}", query);

        try {
            return jdbcTemplate.queryForList(query, new Object[]{tenantId}, String.class);
        } catch (Exception e) {
            log.error("Failed to gather distinct contextual schedules matrices maps from database: ", e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<String> getActiveFillingPointIds(String tenantId) {
        String query = "SELECT filling_point_id FROM upyog_rs_water_tanker_filling_point WHERE tenant_id = ? AND status = true";
        return jdbcTemplate.queryForList(query, new Object[]{tenantId}, String.class);
    }

    @Override
    public List<String> getValidFillingPointIdsForToday(String tenantId, String dayOfWeek) {
        // Join tables to ensure we only get FillingPoints that are active AND have enabled schedules
        String query = "SELECT DISTINCT fp.filling_point_id " +
                "FROM upyog_rs_water_tanker_filling_point fp " +
                "INNER JOIN eg_fixed_point_time_table tt ON fp.filling_point_id = tt.filling_point_id " +
                "WHERE fp.tenant_id = ? " +
                "AND fp.status = true " +
                "AND tt.is_enable = true " +
                "AND tt.day = ?";

        return jdbcTemplate.queryForList(query, new Object[]{tenantId, dayOfWeek}, String.class);
    }

}
