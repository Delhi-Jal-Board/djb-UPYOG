package org.egov.vendor.supervisor.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.producer.Producer;
import org.egov.vendor.supervisor.repository.querybuilder.SupervisorQueryBuilder;
import org.egov.vendor.supervisor.repository.rowmapper.ActiveSurveyorRowMapper;
import org.egov.vendor.supervisor.repository.rowmapper.SupervisorRowMapper;
import org.egov.vendor.supervisor.web.model.Supervisor;
import org.egov.vendor.supervisor.web.model.SupervisorRequest;
import org.egov.vendor.supervisor.web.model.SupervisorResponse;
import org.egov.vendor.supervisor.web.model.SupervisorSearchCriteria;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SingleColumnRowMapper;
import org.springframework.stereotype.Repository;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class SupervisorRepository {

    @Autowired private Producer producer;
    @Autowired private VendorConfiguration configuration;
    @Autowired private SupervisorQueryBuilder queryBuilder;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private SupervisorRowMapper rowMapper;
    @Autowired private ActiveSurveyorRowMapper activeSurveyorRowMapper;

    public void save(SupervisorRequest request) {
        producer.push(configuration.getSaveSupervisorTopic(), request);
    }

    public void update(SupervisorRequest request) {
        producer.push(configuration.getUpdateSupervisorTopic(), request);
    }

    public SupervisorResponse getSupervisorData(SupervisorSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getSearchQuery(criteria, preparedStmtList);
        log.info("SupervisorSearch Query: {}", query);
        List<Supervisor> data = jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
        return SupervisorResponse.builder()
                .supervisors(data)
                .totalCount(rowMapper.getFullCount())
                .build();
    }

    /**
     * Fetch all ACTIVE supervisors for a given vendorId.
     * Used during vendor search enrichment to populate supervisors list.
     */
    public List<Supervisor> getSupervisorsByVendorId(String vendorId, String tenantId) {
        SupervisorSearchCriteria criteria = SupervisorSearchCriteria.builder()
                .vendorId(vendorId)
                .tenantId(tenantId)
                .status(java.util.Arrays.asList("ACTIVE"))
                .limit(-1)
                .offset(0)
                .build();
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getSearchQuery(criteria, preparedStmtList);
        log.info("SupervisorsByVendorId Query: {}", query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
    }

    /**
     * Returns vendor IDs for a given user UUID.
     * Checks both eg_vendor (vendor owner) and eg_supervisor (supervisor)
     * so a single method handles both caller types without role checks.
     *
     * Flow:
     *   UUID in eg_vendor.owner_id     → vendor owner  → returns their vendor id
     *   UUID in eg_supervisor.owner_id → supervisor    → returns their vendor_id
     *   Neither                        → unknown user  → returns empty list
     */
    /**
     * Check if this UUID is a TRUE vendor owner — checks ONLY eg_vendor.
     * Used by SupervisorService.applyRoleBasedRestriction() to distinguish
     * vendor-owner callers from supervisor callers, since getVendorIdsByOwner()
     * now checks both tables and would otherwise short-circuit the supervisor
     * self-scope branch.
     */
    public List<String> getVendorIdsByVendorOwnerOnly(String ownerUuid) {
        return jdbcTemplate.queryForList(
                "SELECT id FROM eg_vendor WHERE owner_id = ? AND status = 'ACTIVE'",
                String.class, ownerUuid);
    }

    public List<String> getVendorIdsByOwner(String ownerUuid) {
        // Check eg_vendor first — is this a vendor owner?
        List<String> vendorIds = jdbcTemplate.queryForList(
                "SELECT id FROM eg_vendor WHERE owner_id = ? AND status = 'ACTIVE'",
                String.class, ownerUuid);

        if (!vendorIds.isEmpty()) {
            log.info("getVendorIdsByOwner: found vendor owner uuid={} vendorId={}", ownerUuid, vendorIds.get(0));
            return vendorIds;
        }

        // Not a vendor owner — check eg_supervisor — is this a supervisor?
        List<String> vendorIdsViaSupervisor = jdbcTemplate.queryForList(
                "SELECT vendor_id FROM eg_supervisor WHERE owner_id = ? AND status = 'ACTIVE'",
                String.class, ownerUuid);

        if (!vendorIdsViaSupervisor.isEmpty()) {
            log.info("getVendorIdsByOwner: found supervisor uuid={} vendorId={}", ownerUuid, vendorIdsViaSupervisor.get(0));
        } else {
            log.info("getVendorIdsByOwner: no vendor/supervisor found for uuid={}", ownerUuid);
        }

        return vendorIdsViaSupervisor;
    }

    /**
     * Look up supervisor profile by their owner UUID.
     * Returns map with keys: id, vendorId
     * Used by SupervisorService to auto-scope search when a supervisor logs in.
     */
    public Map<String, String> findSupervisorByOwnerUuid(String ownerUuid) {
        String query = "SELECT id, vendor_id FROM eg_supervisor WHERE owner_id = ? AND status = 'ACTIVE' LIMIT 1";
        List<Map<String, String>> rows = jdbcTemplate.query(query, new Object[]{ownerUuid}, (rs, rowNum) -> {
            Map<String, String> map = new java.util.HashMap<>();
            map.put("id",       rs.getString("id"));
            map.put("vendorId", rs.getString("vendor_id"));
            return map;
        });
        return rows.isEmpty() ? null : rows.get(0);
    }


    public Supervisor getSupervisorById(
            String supervisorId,
            String tenantId) {

        String query = "SELECT\n" +
                       "    id,\n" +
                       "    name,\n" +
                       "    tenantid,\n" +
                       "    vendor_id,\n" +
                       "    assigned_zone_id,\n" +
                       "    status\n" +
                       "FROM eg_supervisor\n" +
                       "WHERE id = ?\n" +
                       "  AND tenantid = ?\n" +
                       "LIMIT 1\n";

        List<Supervisor> results = jdbcTemplate.query(
                query,
                new Object[]{supervisorId, tenantId},
                (rs, rowNum) -> {

                    Supervisor supervisor = new Supervisor();

                    supervisor.setId(rs.getString("id"));
                    supervisor.setName(rs.getString("name"));
                    supervisor.setTenantId(rs.getString("tenantid"));
                    supervisor.setVendorId(rs.getString("vendor_id"));

                    // Assigned Zone
                    supervisor.setAssignedZoneId(
                            rs.getString("assigned_zone_id")
                    );

                    String status = rs.getString("status");

                    if (status != null) {
                        supervisor.setStatus(
                                Supervisor.StatusEnum.fromValue(status)
                        );
                    }

                    return supervisor;
                }
        );

        if (results.isEmpty()) {
            log.warn(
                    "No supervisor found for supervisorId={}, tenantId={}",
                    supervisorId,
                    tenantId
            );
            return null;
        }

        Supervisor supervisor = results.get(0);

        log.info(
                "Found supervisor: id={}, vendorId={}, tenantId={}, assignedZoneId={}, status={}",
                supervisor.getId(),
                supervisor.getVendorId(),
                supervisor.getTenantId(),
                supervisor.getAssignedZoneId(),
                supervisor.getStatus()
        );

        return supervisor;
    }

    public int bulkUpdateSurveyors(
            String oldSupervisorId,
            String replacementSupervisorId,
            String vendorId,
            String tenantId,
            RequestInfo requestInfo) {

        String sql = "UPDATE eg_surveyor\n" +
                     "   SET supervisor_id = ?,\n" +
                     "       lastmodifiedby = ?,\n" +
                     "       lastmodifiedtime = ?\n" +
                     " WHERE supervisor_id = ?\n" +
                     "   AND vendor_id = ?\n" +
                     "   AND tenantid = ?\n";

        int updatedRows = jdbcTemplate.update(
                sql,
                replacementSupervisorId,
                requestInfo.getUserInfo().getUuid(),
                System.currentTimeMillis(),
                oldSupervisorId,
                vendorId,
                tenantId
        );

        log.info(
                "Bulk reassigned {} surveyors from supervisor {} to {}",
                updatedRows,
                oldSupervisorId,
                replacementSupervisorId
        );

        return updatedRows;
    }


    public int bulkUpdateEkycAssignments(
            String oldSupervisorId,
            String replacementSupervisorId,
            String vendorId,
            String tenantId,
            RequestInfo requestInfo) {

        String sql = "UPDATE ekyc_assignment\n" +
                     "   SET supervisor_id = ?,\n" +
                     "       lastmodifiedby = ?,\n" +
                     "       lastmodifiedtime = ?\n" +
                     " WHERE supervisor_id = ?\n" +
                     "   AND vendor_id = ?\n" +
                     "   AND tenant_id = ?\n";

        int updatedRows = jdbcTemplate.update(
                sql,
                replacementSupervisorId,
                requestInfo.getUserInfo().getUuid(),
                System.currentTimeMillis(),
                oldSupervisorId,
                vendorId,
                tenantId
        );

        log.info(
                "Bulk reassigned {} ekyc assignments from supervisor {} to {}",
                updatedRows,
                oldSupervisorId,
                replacementSupervisorId
        );

        return updatedRows;
    }

}