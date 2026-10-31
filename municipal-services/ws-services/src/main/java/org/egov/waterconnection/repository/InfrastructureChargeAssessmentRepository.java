package org.egov.waterconnection.repository;

import java.math.BigDecimal;
import java.util.List;

import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.model.CustomException;
import org.egov.common.exception.InvalidTenantIdException;
import org.egov.waterconnection.web.models.InfrastructureChargeAssessment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Stores the last trusted IFC assessment independently of citizen-editable payloads.
 * Queries are schema-aware for multi-state deployments.
 */
@Repository
public class InfrastructureChargeAssessmentRepository {

    private static final RowMapper<InfrastructureChargeAssessment> ROW_MAPPER = (rs, rowNum) ->
        InfrastructureChargeAssessment.builder()
            .tenantId(rs.getString("tenantid"))
            .applicationNo(rs.getString("applicationno"))
            .propertyId(rs.getString("propertyid"))
            .inputFingerprint(rs.getString("input_fingerprint"))
            .inputSnapshot(rs.getString("input_snapshot"))
            .assessedIfcAmount(rs.getBigDecimal("assessed_ifc_amount"))
            .lastEstimatedIfcAmount(rs.getBigDecimal("last_estimated_ifc_amount"))
            .pendingAdditionalAmount(rs.getBigDecimal("pending_additional_amount"))
            .status(rs.getString("status"))
            .assessmentVersion(rs.getInt("assessment_version"))
            .createdBy(rs.getString("createdby"))
            .createdTime(rs.getLong("createdtime"))
            .lastModifiedBy(rs.getString("lastmodifiedby"))
            .lastModifiedTime(rs.getLong("lastmodifiedtime"))
            .build();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MultiStateInstanceUtil multiStateInstanceUtil;

    public InfrastructureChargeAssessment findByApplication(String tenantId, String applicationNo) {
        String sql = schemaSql("SELECT * FROM {schema}.eg_ws_infrastructure_charge_assessment WHERE tenantid = ? AND applicationno = ?", tenantId);
        List<InfrastructureChargeAssessment> results = jdbcTemplate.query(sql, ROW_MAPPER, tenantId, applicationNo);
        return results.isEmpty() ? null : results.get(0);
    }

    /** Insert the first assessment only; retries must never reset a later assessment. */
    public void insertInitialIfAbsent(InfrastructureChargeAssessment assessment) {
        String sql = schemaSql("INSERT INTO {schema}.eg_ws_infrastructure_charge_assessment AS current_assessment " +
                "(tenantid, applicationno, propertyid, input_fingerprint, input_snapshot, assessed_ifc_amount, " +
                "last_estimated_ifc_amount, pending_additional_amount, status, assessment_version, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?) ON CONFLICT (tenantid, applicationno) DO NOTHING", assessment.getTenantId());
        long now = System.currentTimeMillis();
        jdbcTemplate.update(sql, assessment.getTenantId(), assessment.getApplicationNo(), assessment.getPropertyId(),
                assessment.getInputFingerprint(), assessment.getInputSnapshot(), amount(assessment.getAssessedIfcAmount()),
                amount(assessment.getLastEstimatedIfcAmount()), amount(assessment.getPendingAdditionalAmount()),
                assessment.getStatus(), assessment.getCreatedBy(), now, assessment.getLastModifiedBy(), now);
    }

    /** Upsert the latest assessment/adjustment state while preserving the original audit creation fields. */
    public void save(InfrastructureChargeAssessment assessment) {
        String sql = schemaSql("INSERT INTO {schema}.eg_ws_infrastructure_charge_assessment AS current_assessment " +
                "(tenantid, applicationno, propertyid, input_fingerprint, input_snapshot, assessed_ifc_amount, " +
                "last_estimated_ifc_amount, pending_additional_amount, status, assessment_version, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?) " +
                "ON CONFLICT (tenantid, applicationno) DO UPDATE SET " +
                "propertyid = EXCLUDED.propertyid, input_fingerprint = EXCLUDED.input_fingerprint, input_snapshot = EXCLUDED.input_snapshot, " +
                "assessed_ifc_amount = EXCLUDED.assessed_ifc_amount, last_estimated_ifc_amount = EXCLUDED.last_estimated_ifc_amount, " +
                "pending_additional_amount = EXCLUDED.pending_additional_amount, status = EXCLUDED.status, " +
                "assessment_version = current_assessment.assessment_version + 1, " +
                "lastmodifiedby = EXCLUDED.lastmodifiedby, lastmodifiedtime = EXCLUDED.lastmodifiedtime", assessment.getTenantId());
        long now = System.currentTimeMillis();
        jdbcTemplate.update(sql, assessment.getTenantId(), assessment.getApplicationNo(), assessment.getPropertyId(),
                assessment.getInputFingerprint(), assessment.getInputSnapshot(), amount(assessment.getAssessedIfcAmount()),
                amount(assessment.getLastEstimatedIfcAmount()), amount(assessment.getPendingAdditionalAmount()),
                assessment.getStatus(), assessment.getCreatedBy(), now, assessment.getLastModifiedBy(), now);
    }

    private BigDecimal amount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2) : value.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String schemaSql(String sql, String tenantId) {
        try {
            return multiStateInstanceUtil.replaceSchemaPlaceholder(sql, tenantId);
        } catch (InvalidTenantIdException e) {
            throw new CustomException("WS_INFRA_ASSESSMENT_SCHEMA_ERROR",
                    "Unable to resolve database schema for infrastructure charge assessment.");
        }
    }
}
