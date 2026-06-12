package org.egov.vendor.supervisor.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.producer.Producer;
import org.egov.vendor.supervisor.repository.querybuilder.SupervisorQueryBuilder;
import org.egov.vendor.supervisor.repository.rowmapper.SupervisorRowMapper;
import org.egov.vendor.supervisor.web.model.Supervisor;
import org.egov.vendor.supervisor.web.model.SupervisorRequest;
import org.egov.vendor.supervisor.web.model.SupervisorResponse;
import org.egov.vendor.supervisor.web.model.SupervisorSearchCriteria;
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
}