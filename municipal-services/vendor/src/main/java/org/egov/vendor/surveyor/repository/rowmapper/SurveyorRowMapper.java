package org.egov.vendor.surveyor.repository.rowmapper;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.egov.tracer.model.CustomException;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.Surveyor.StatusEnum;
import org.egov.vendor.web.model.AuditDetails;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SurveyorRowMapper implements ResultSetExtractor<List<Surveyor>> {

    @Autowired
    private ObjectMapper mapper;

    private int fullCount = 0;

    public int getFullCount() { return fullCount; }
    public void setFullCount(int fullCount) { this.fullCount = fullCount; }

    @Override
    public List<Surveyor> extractData(ResultSet rs) throws SQLException {
        Map<String, Surveyor> surveyorMap = new LinkedHashMap<>();
        this.setFullCount(0);

        while (rs.next()) {
            String id             = rs.getString("id");
            String tenantId       = rs.getString("tenantid");
            String vendorId       = rs.getString("vendor_id");
            String name           = rs.getString("name");
            String mobileNo       = rs.getString("mobile_no");
            String supervisorId   = rs.getString("supervisor_id");
            String ownerId        = rs.getString("owner_id");
            String description    = rs.getString("description");
            String status         = rs.getString("status");
            // Joined fields from eg_supervisor and eg_vendor
            String supervisorName = rs.getString("supervisor_name");
            String vendorName     = rs.getString("vendor_name");
            Object additionalDetails = getAdditionalDetail("additionaldetails", rs);
            this.setFullCount(rs.getInt("full_count"));

            Surveyor current = surveyorMap.get(id);
            if (current == null) {
                if (status == null) status = "ACTIVE";
                current = Surveyor.builder()
                        .id(id)
                        .tenantId(tenantId)
                        .vendorId(vendorId)
                        .name(name)
                        .mobileNo(mobileNo)
                        .supervisorId(supervisorId)
                        .ownerId(ownerId)
                        .description(description)
                        .status(StatusEnum.valueOf(status))
                        .additionalDetails(additionalDetails)
                        .supervisorName(supervisorName)
                        .vendorName(vendorName)
                        .build();
                surveyorMap.put(id, current);
            }
            addAuditDetails(rs, current);
        }
        return new ArrayList<>(surveyorMap.values());
    }

    private void addAuditDetails(ResultSet rs, Surveyor surveyor) throws SQLException {
        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(rs.getString("createdby"))
                .createdTime(rs.getLong("createdtime"))
                .lastModifiedBy(rs.getString("lastmodifiedby"))
                .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                .build();
        surveyor.setAuditDetails(auditDetails);
    }

    private JsonNode getAdditionalDetail(String columnName, ResultSet rs) {
        JsonNode detail = null;
        try {
            PGobject pgObj = (PGobject) rs.getObject(columnName);
            if (pgObj != null) detail = mapper.readTree(pgObj.getValue());
        } catch (IOException | SQLException e) {
            throw new CustomException("PARSING_ERROR", "Failed to parse additionalDetails for surveyor");
        }
        return detail;
    }
}