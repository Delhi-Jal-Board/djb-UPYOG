package org.egov.vendor.supervisor.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
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
     * Access rules:
     *
     * Unrestricted (see all supervisors):
     *   EMPLOYEE, SUPERUSER, DJB_ZRO      → system/admin users
     *   EKYC_SUPERVISOR, EKYC_VENDOR, EKYC_ZRO → ekyc roles
     *     (VendorServiceClient in ekyc-service already scopes the query
     *      to ownerIds= so the DB result is already limited to exactly
     *      the supervisor needed — no further restriction required here)
     *
     * Vendor-restricted (own vendor's supervisors only):
     *   WT_VENDOR, DJB_AGENCY
     *
     * All other roles → empty result
     */
    private void applyRoleBasedRestriction(SupervisorSearchCriteria criteria,
                                           RequestInfo requestInfo) {
        if (requestInfo == null || requestInfo.getUserInfo() == null) return;

        List<String> roleCodes = requestInfo.getUserInfo().getRoles()
                .stream().map(Role::getCode).collect(Collectors.toList());
        String userType = requestInfo.getUserInfo().getType();

        // ── Unrestricted roles ────────────────────────────────────────
        boolean isUnrestricted = VendorConstants.EMPLOYEE.equalsIgnoreCase(userType)
                || roleCodes.stream().anyMatch(r ->
                "EMPLOYEE".equalsIgnoreCase(r)          ||
                        "SUPERUSER".equalsIgnoreCase(r)         ||
                        "DJB_ZRO".equalsIgnoreCase(r)           ||
                        "EKYC_SUPERVISOR".equalsIgnoreCase(r)   ||
                        "EKYC_VENDOR".equalsIgnoreCase(r)       ||
                        "EKYC_ZRO".equalsIgnoreCase(r));

        if (isUnrestricted) {
            log.info("Unrestricted role ({}) — no supervisor search restriction", roleCodes);
            return;
        }

        // ── Vendor-restricted roles ───────────────────────────────────
        boolean isVendorRole = roleCodes.stream().anyMatch(r ->
                "WT_VENDOR".equalsIgnoreCase(r) || "DJB_AGENCY".equalsIgnoreCase(r));

        if (!isVendorRole) {
            log.info("Unrecognised role for supervisor search — returning empty. roles={}", roleCodes);
            criteria.setIds(new ArrayList<>());
            return;
        }

        // Agency user — restrict to own vendor only
        String ownerUuid = requestInfo.getUserInfo().getUuid();
        if (!StringUtils.hasLength(ownerUuid)) {
            throw new CustomException("AUTH_ERROR", "User UUID not found in token");
        }

        List<String> vendorIds = repository.getVendorIdsByOwner(ownerUuid);
        if (CollectionUtils.isEmpty(vendorIds)) {
            log.info("No vendor found for UUID={} — returning empty", ownerUuid);
            criteria.setIds(new ArrayList<>());
            return;
        }

        // Set vendorId on criteria — QueryBuilder will add WHERE vendor_id = ?
        // Use first vendorId (an agency owner should have exactly one vendor)
        if (!StringUtils.hasLength(criteria.getVendorId())) {
            criteria.setVendorId(vendorIds.get(0));
        }
    }
}