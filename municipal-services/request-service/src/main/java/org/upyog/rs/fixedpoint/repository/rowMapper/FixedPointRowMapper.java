package org.upyog.rs.fixedpoint.repository.rowMapper;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.upyog.rs.fixedpoint.web.model.FixedPointTimeTableDetail;
import org.upyog.rs.web.models.AuditDetails;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Component
public class FixedPointRowMapper implements ResultSetExtractor<List<FixedPointTimeTableDetail>> {

    @Override
    public List<FixedPointTimeTableDetail> extractData(ResultSet rs)
            throws SQLException, DataAccessException {

        List<FixedPointTimeTableDetail> details = new ArrayList<>();

        while (rs.next()) {

            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(rs.getString("createdby"))
                    .lastModifiedBy(rs.getString("lastmodifiedby"))
                    .createdTime(rs.getLong("createdtime"))
                    .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                    .build();

            FixedPointTimeTableDetail detail = FixedPointTimeTableDetail.builder()
                    .systemAssignedScheduleId(rs.getString("system_assigned_schedule_id"))
                    .fixedPointCode(rs.getString("fixed_point_code"))
                    .day(rs.getString("day"))
                    .tripNo(rs.getInt("trip_no"))
                    .arrivalTimeToFpl(rs.getString("arrival_time_to_fpl"))
                    .departureTimeFromFpl(rs.getString("departure_time_from_fpl"))
                    .arrivalTimeDeliveryPoint(rs.getString("arrival_time_delivery_point"))
                    .departureTimeDeliveryPoint(rs.getString("departure_time_delivery_point"))
                    .timeOfArrivingBackFplAfterDelivery(rs.getString("time_of_arriving_back_fpl_after_delivery"))
                    .volumeWaterTobeDelivery(rs.getString("volume_water_tobe_delivery"))
                    .active(rs.getBoolean("active"))
                    .isEnable(rs.getBoolean("is_enable"))
                    .remarks(rs.getString("remarks"))
                    .tenantId(rs.getString("tenant_id"))
                    .vehicleId(rs.getString("vehicle_id"))
                    .fixedPointName(rs.getString("fixed_point_name"))
                    .fixedPointId(rs.getString("fixed_point_id"))
                    .fillingPointId(rs.getString("filling_point_id"))
                    .fillingPointName(rs.getString("filling_point_name"))
                    .auditDetails(auditDetails)
                    .build();

            details.add(detail);
        }

        return details;
    }
}