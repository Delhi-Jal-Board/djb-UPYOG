package org.egov.vendor.supervisor.repository.rowmapper;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.egov.tracer.model.CustomException;
import org.egov.vendor.supervisor.web.model.Supervisor;
import org.egov.vendor.supervisor.web.model.Supervisor.StatusEnum;
import org.egov.vendor.web.model.AuditDetails;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SupervisorRowMapper implements ResultSetExtractor<List<Supervisor>> {

    @Autowired
    private ObjectMapper mapper;

    private int fullCount = 0;

    public int getFullCount() { return fullCount; }
    public void setFullCount(int fullCount) { this.fullCount = fullCount; }

    @Override
    public List<Supervisor> extractData(ResultSet rs) throws SQLException {
        Map<String, Supervisor> supervisorMap = new LinkedHashMap<>();
        this.setFullCount(0);

        while (rs.next()) {
            String id = rs.getString("id");
            this.setFullCount(rs.getInt("full_count"));

            Supervisor current = supervisorMap.get(id);
            if (current == null) {
                String status = rs.getString("status");
                if (status == null) status = "ACTIVE";

                current = Supervisor.builder()
                        .id(id)
                        .name(rs.getString("name"))
                        .tenantId(rs.getString("tenantid"))
                        .vendorId(rs.getString("vendor_id"))
                        .mobileNo(rs.getString("mobile_no"))
                        .assignedZoneId(rs.getString("assigned_zone_id"))
                        .ownerId(rs.getString("owner_id"))
                        .description(rs.getString("description"))
                        .status(StatusEnum.valueOf(status))
                        .additionalDetails(getAdditionalDetail("additionaldetails", rs))
                        .vendorName(rs.getString("vendor_name"))
                        .auditDetails(AuditDetails.builder()
                                .createdBy(rs.getString("createdby"))
                                .createdTime(rs.getLong("createdtime"))
                                .lastModifiedBy(rs.getString("lastmodifiedby"))
                                .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                                .build())
                        .build();

                supervisorMap.put(id, current);
            }
        }

        return new ArrayList<>(supervisorMap.values());
    }

    private JsonNode getAdditionalDetail(String columnName, ResultSet rs) {
        try {
            PGobject pgObj = (PGobject) rs.getObject(columnName);
            if (pgObj != null) {
                return mapper.readTree(pgObj.getValue());
            }
        } catch (IOException | SQLException e) {
            throw new CustomException("PARSING_ERROR", "Failed to parse additionalDetails for supervisor");
        }
        return null;
    }
}