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
     * Returns vendor IDs owned by the given user UUID.
     * Used for role-based restriction — agency users can only see
     * supervisors belonging to their own vendor.
     */
    public List<String> getVendorIdsByOwner(String ownerUuid) {
        String query = "SELECT id FROM eg_vendor WHERE owner_id = ?";
        return jdbcTemplate.query(query, new Object[]{ownerUuid},
                new SingleColumnRowMapper<>(String.class));
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