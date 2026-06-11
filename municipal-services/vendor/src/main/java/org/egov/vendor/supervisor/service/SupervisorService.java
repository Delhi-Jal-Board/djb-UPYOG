package org.egov.vendor.supervisor.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.supervisor.repository.SupervisorRepository;
import org.egov.vendor.supervisor.web.model.SupervisorRequest;
import org.egov.vendor.supervisor.web.model.SupervisorResponse;
import org.egov.vendor.supervisor.web.model.SupervisorSearchCriteria;
import org.egov.vendor.util.VendorConstants;
import org.egov.vendor.web.model.user.User;
import org.egov.vendor.web.model.user.UserDetailResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SupervisorService {

    @Autowired private SupervisorRepository       repository;
    @Autowired private SupervisorEnrichmentService enrichmentService;
    @Autowired private SupervisorUserService       userService;
    @Autowired private VendorConfiguration         config;

    // ── CREATE ────────────────────────────────────────────────────────────────

    public org.egov.vendor.supervisor.web.model.Supervisor create(SupervisorRequest request) {

        if (request.getSupervisor().getTenantId().split("\\.").length == 1) {
            throw new CustomException("INVALID_TENANT_ID",
                    "Supervisor cannot be created at state level");
        }

        // ── Auto-derive vendorId from logged-in user's token ──────────
        // Vendor (EKYC_VENDOR, CITIZEN) creates supervisors.
        // Instead of requiring the frontend to know and send vendorId,
        // we look it up from the token's UUID → eg_vendor.owner_id.
        if (!StringUtils.hasLength(request.getSupervisor().getVendorId())) {
            String callerUuid = request.getRequestInfo().getUserInfo().getUuid();
            List<String> vendorIds = repository.getVendorIdsByOwner(callerUuid);

            if (CollectionUtils.isEmpty(vendorIds)) {
                throw new CustomException("VENDOR_NOT_FOUND",
                        "No active vendor found for logged-in user (uuid=" + callerUuid + "). "
                                + "Please register as a vendor before creating supervisors.");
            }

            request.getSupervisor().setVendorId(vendorIds.get(0));
            log.info("Auto-derived vendorId={} for supervisor from token uuid={}",
                    vendorIds.get(0), callerUuid);
        }

        userService.manageSupervisors(request, true);
        enrichmentService.enrichCreate(request);
        repository.save(request);
        return request.getSupervisor();
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public org.egov.vendor.supervisor.web.model.Supervisor update(SupervisorRequest request) {

        if (request.getSupervisor().getTenantId().split("\\.").length == 1) {
            throw new CustomException("INVALID_TENANT_ID",
                    "Supervisor cannot be updated at state level");
        }
        if (StringUtils.isEmpty(request.getSupervisor().getId())) {
            throw new CustomException("UPDATE_ERROR",
                    "Supervisor id is mandatory for update");
        }

        userService.manageSupervisors(request, false);
        enrichmentService.enrichUpdate(request);
        repository.update(request);
        return request.getSupervisor();
    }

    // ── SEARCH ────────────────────────────────────────────────────────────────

    public SupervisorResponse search(SupervisorSearchCriteria criteria, RequestInfo requestInfo) {

        // 1. Apply role-based restriction before any DB call
        applyRoleBasedRestriction(criteria, requestInfo);

        // 2. If mobile number provided, resolve to ownerIds via user service
        if (StringUtils.hasLength(criteria.getMobileNumber())) {
            UserDetailResponse userResponse = userService.getOwner(criteria, requestInfo);
            if (userResponse != null && !CollectionUtils.isEmpty(userResponse.getUser())) {
                List<String> uuids = userResponse.getUser().stream()
                        .map(User::getUuid).collect(Collectors.toList());
                if (CollectionUtils.isEmpty(criteria.getOwnerIds()))
                    criteria.setOwnerIds(uuids);
                else
                    criteria.getOwnerIds().addAll(uuids);
            }
        }

        // 3. Query DB
        SupervisorResponse response = repository.getSupervisorData(criteria);

        // 4. Enrich with owner (User) details
        if (response != null && !CollectionUtils.isEmpty(response.getSupervisors())) {
            enrichmentService.enrichSearch(response.getSupervisors(), requestInfo,
                    criteria.getTenantId());
        }

        return response;
    }

    // ── Role-based restriction ────────────────────────────────────────

    /**
     * DB-based supervisor search scoping — does NOT rely on JWT/DIGIT roles.
     *
     * ZUUL gateway replaces userInfo.roles with Keycloak realm roles before
     * forwarding. DIGIT roles (EKYC_VENDOR, EKYC_SUPERVISOR) are never present.
     * Role checks always fail → old code set ids=[] → QueryBuilder ignored
     * empty list → returned ALL supervisors unscoped.
     *
     * Fix: identify caller by UUID directly in DB:
     *   UUID in eg_vendor     → vendor owner → scope to their vendor's supervisors
     *   UUID in eg_supervisor → supervisor   → scope to their vendor's supervisors
     *   EMPLOYEE type         → unrestricted (SUPERUSER/admin)
     *   Neither               → unknown citizen → return empty (safe)
     *
     * Explicit vendorId passed as query param always takes priority.
     */
    private void applyRoleBasedRestriction(SupervisorSearchCriteria criteria,
                                           RequestInfo requestInfo) {
        if (requestInfo == null || requestInfo.getUserInfo() == null) return;

        String userType  = requestInfo.getUserInfo().getType();
        String callerUuid = requestInfo.getUserInfo().getUuid();

        // EMPLOYEE / SUPERUSER — unrestricted
        if (VendorConstants.EMPLOYEE.equalsIgnoreCase(userType)) return;

        if (!StringUtils.hasLength(callerUuid)) {
            throw new CustomException("AUTH_ERROR", "User UUID not found in token");
        }

        // Explicit vendorId passed as query param — respect it, skip auto-scope
        if (StringUtils.hasLength(criteria.getVendorId())) {
            log.info("vendorId={} passed explicitly — skipping auto-scope", criteria.getVendorId());
            return;
        }

        // Check DB: is this caller a vendor owner?
        List<String> vendorIds = repository.getVendorIdsByOwner(callerUuid);
        if (!CollectionUtils.isEmpty(vendorIds)) {
            criteria.setVendorId(vendorIds.get(0));
            log.info("Supervisor search scoped to vendorId={} for vendor uuid={}",
                    vendorIds.get(0), callerUuid);
            return;
        }

        // Check DB: is this caller a supervisor?
        // Supervisor can see all supervisors under their same vendor
        Map<String, String> supervisorProfile = repository.findSupervisorByOwnerUuid(callerUuid);
        if (supervisorProfile != null) {
            criteria.setVendorId(supervisorProfile.get("vendorId"));
            log.info("Supervisor search scoped to vendorId={} for supervisor uuid={}",
                    supervisorProfile.get("vendorId"), callerUuid);
            return;
        }

        // Unknown CITIZEN — no vendor/supervisor profile → return empty safely
        // Use a dummy non-matching id so QueryBuilder adds a WHERE clause
        log.info("No vendor/supervisor profile for uuid={} — returning empty", callerUuid);
        criteria.setIds(Collections.singletonList("NO_MATCH"));
    }
}