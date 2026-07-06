package org.egov.vendor.surveyor.repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.producer.Producer;
import org.egov.vendor.surveyor.repository.querybuilder.SurveyorQueryBuilder;
import org.egov.vendor.surveyor.repository.rowmapper.SurveyorRowMapper;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.SurveyorRequest;
import org.egov.vendor.surveyor.web.model.SurveyorResponse;
import org.egov.vendor.surveyor.web.model.SurveyorSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class SurveyorRepository {

    @Autowired private Producer             producer;
    @Autowired private VendorConfiguration  configuration;
    @Autowired private SurveyorQueryBuilder surveyorQueryBuilder;
    @Autowired private JdbcTemplate         jdbcTemplate;
    @Autowired private SurveyorRowMapper    surveyorRowMapper;

    public void save(SurveyorRequest surveyorRequest) {
        producer.push(configuration.getSaveSurveyorTopic(), surveyorRequest);
    }

    public void update(SurveyorRequest surveyorRequest) {
        producer.push(configuration.getUpdateSurveyorTopic(), surveyorRequest);
    }

    public SurveyorResponse getSurveyorData(SurveyorSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = surveyorQueryBuilder.getSurveyorSearchQuery(criteria, preparedStmtList);
        log.info("SurveyorSearch Query: {}", query);
        List<Surveyor> surveyors = jdbcTemplate.query(
                query, preparedStmtList.toArray(), surveyorRowMapper);
        return SurveyorResponse.builder()
                .surveyors(surveyors)
                .totalCount(surveyorRowMapper.getFullCount())
                .build();
    }

    /**
     * Fetch all ACTIVE surveyors for a given vendorId.
     * Used during vendor search enrichment to populate surveyors list.
     */
    public List<Surveyor> getSurveyorsByVendorId(String vendorId, String tenantId) {
        SurveyorSearchCriteria criteria = SurveyorSearchCriteria.builder()
                .vendorId(vendorId)
                .tenantId(tenantId)
                .status(Arrays.asList("ACTIVE"))
                .limit(-1)
                .offset(0)
                .build();
        List<Object> preparedStmtList = new ArrayList<>();
        String query = surveyorQueryBuilder.getSurveyorSearchQuery(criteria, preparedStmtList);
        log.info("SurveyorsByVendorId Query: {}", query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), surveyorRowMapper);
    }

    /**
     * Check if a given ownerUuid belongs to a vendor owner.
     * Returns list of vendor entity IDs (usually 1).
     * Used by applyRoleBasedScoping to auto-scope vendor's surveyor search.
     */
    public List<String> getVendorIdsByOwnerUuid(String ownerUuid) {
        return jdbcTemplate.queryForList(
                "SELECT id FROM eg_vendor WHERE owner_id = ? AND status = 'ACTIVE'",
                String.class, ownerUuid);
    }

    /**
     * Syncs supervisor_id in ekyc_assignment when a surveyor is remapped
     * to a different supervisor via _update.
     *
     * WHY THIS IS NEEDED:
     *   ekyc_assignment stores supervisor_id at assignment time. When a surveyor
     *   is moved to a different supervisor in eg_surveyor (via vendor _update),
     *   existing ACTIVE assignments still point to the old supervisor — causing
     *   wrong KNO counts in _progress and hierarchy reports.
     *
     * WHAT IT DOES:
     *   Updates supervisor_id on all ACTIVE assignments for this surveyorId
     *   (ownerUUID) to the new supervisorId. INACTIVE assignments are left
     *   untouched — they are historical audit records.
     *
     * SECURITY:
     *   surveyorOwnerId comes from eg_surveyor.owner_id (DB, not frontend).
     *   newSupervisorId comes from the validated surveyor.supervisorId field
     *   after enrichment in SurveyorService.update().
     *   Never called directly from controller — always via update() service method.
     *
     * SAFETY:
     *   If no ACTIVE assignments exist for this surveyor, update affects 0 rows
     *   — completely safe, no error thrown.
     *
     * @param surveyorOwnerId ownerUUID of the surveyor (ekyc_assignment.surveyor_id)
     * @param newSupervisorId new supervisor entity ID to set
     * @return number of assignment rows updated
     */
    public int syncEkycAssignmentSupervisor(String surveyorOwnerId, String newSupervisorId) {
        String sql = "UPDATE ekyc_assignment " +
                "SET supervisor_id = ?, " +
                "    last_modified_time = EXTRACT(EPOCH FROM NOW())::BIGINT " +
                "WHERE surveyor_id = ? " +
                "  AND status = 'ACTIVE'";
        int updatedRows = jdbcTemplate.update(sql, newSupervisorId, surveyorOwnerId);
        log.info("syncEkycAssignment: updated {} ACTIVE assignment(s) " +
                        "for surveyorOwnerId={} to supervisorId={}",
                updatedRows, surveyorOwnerId, newSupervisorId);
        return updatedRows;
    }

    /**
     * Look up supervisor profile by their owner UUID.
     * Used by SurveyorService.create() and SurveyorService.update() to
     * auto-derive supervisorId and vendorId from token UUID.
     * Returns map with keys: "id" (supervisor entity ID), "vendorId".
     * Returns null if no ACTIVE supervisor found for this UUID.
     */
    public Map<String, String> findSupervisorByOwnerUuid(String ownerUuid) {
        String query = "SELECT id, vendor_id " +
                "FROM eg_supervisor " +
                "WHERE owner_id = ? AND status = 'ACTIVE' " +
                "LIMIT 1";

        List<Map<String, String>> results = jdbcTemplate.query(
                query,
                new Object[]{ownerUuid},
                (rs, rowNum) -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("id",       rs.getString("id"));
                    map.put("vendorId", rs.getString("vendor_id"));
                    return map;
                }
        );

        if (results.isEmpty()) {
            log.warn("No ACTIVE supervisor found for ownerUuid={}", ownerUuid);
            return null;
        }

        log.info("Found supervisor: id={}, vendorId={} for ownerUuid={}",
                results.get(0).get("id"), results.get(0).get("vendorId"), ownerUuid);
        return results.get(0);
    }
}