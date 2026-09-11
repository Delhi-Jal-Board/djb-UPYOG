package org.egov.vendor.supervisor.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.Surveyor.StatusEnum;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class ActiveSurveyorRowMapper implements RowMapper<Surveyor> {

    @Override
    public Surveyor mapRow(ResultSet rs, int rowNum)
            throws SQLException {

        Surveyor surveyor = new Surveyor();

        surveyor.setId(rs.getString("id"));
        surveyor.setName(rs.getString("name"));
        surveyor.setTenantId(rs.getString("tenantid"));
        surveyor.setVendorId(rs.getString("vendor_id"));
        surveyor.setMobileNo(rs.getString("mobile_no"));
        surveyor.setSupervisorId(rs.getString("supervisor_id"));
        surveyor.setOwnerId(rs.getString("owner_id"));
        surveyor.setDescription(rs.getString("description"));

        String status = rs.getString("status");

        if (status != null) {
            surveyor.setStatus(
                    StatusEnum.fromValue(status)
            );
        }

        return surveyor;
    }
}