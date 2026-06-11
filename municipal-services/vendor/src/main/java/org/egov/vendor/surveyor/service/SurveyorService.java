package org.egov.vendor.surveyor.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.surveyor.repository.SurveyorRepository;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.SurveyorRequest;
import org.egov.vendor.surveyor.web.model.SurveyorResponse;
import org.egov.vendor.surveyor.web.model.SurveyorSearchCriteria;
import org.egov.vendor.web.model.user.User;
import org.egov.vendor.web.model.user.UserDetailResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SurveyorService {

    @Autowired private SurveyorRepository       surveyorRepository;
    @Autowired private SurveyorEnrichmentService enrichmentService;
    @Autowired private SurveyorUserService       userService;
    @Autowired private VendorConfiguration       config;

    // ── CREATE ────────────────────────────────────────────────────────

    public Surveyor create(SurveyorRequest surveyorRequest) {

        if (surveyorRequest.getSurveyor().getTenantId().split("\\.").length == 1) {
            throw new CustomException("INVALID_TENANT",
                    "Surveyor cannot be created at State level");
        }

        // ── Auto-derive supervisorId + vendorId from logged-in user ───
        // Supervisor (EKYC_SUPERVISOR, CITIZEN) creates surveyors.
        // token.userInfo.uuid → eg_supervisor.owner_id
        //                     → supervisor.id   (supervisorId)
        //                     → supervisor.vendor_id (vendorId)
        Surveyor surveyor = surveyorRequest.getSurveyor();

        if (!StringUtils.hasLength(surveyor.getSupervisorId())) {
            String callerUuid = surveyorRequest.getRequestInfo().getUserInfo().getUuid();
            Map<String, String> profile =
                    surveyorRepository.findSupervisorByOwnerUuid(callerUuid);

            if (profile == null) {
                throw new CustomException("SUPERVISOR_NOT_FOUND",
                        "No active supervisor found for logged-in user (uuid=" + callerUuid + "). "
                                + "Please register as a supervisor before creating surveyors.");
            }

            surveyor.setSupervisorId(profile.get("id"));
            log.info("Auto-derived supervisorId={} for surveyor from token uuid={}",
                    profile.get("id"), callerUuid);

            if (!StringUtils.hasLength(surveyor.getVendorId())) {
                surveyor.setVendorId(profile.get("vendorId"));
                log.info("Auto-derived vendorId={} for surveyor from supervisor profile",
                        profile.get("vendorId"));
            }
        }

        userService.manageSurveyors(surveyorRequest, true);
        enrichmentService.enrichCreate(surveyorRequest);
        surveyorRepository.save(surveyorRequest);
        return surveyorRequest.getSurveyor();
    }

    // ── UPDATE ────────────────────────────────────────────────────────

    public Surveyor update(SurveyorRequest surveyorRequest) {

        if (surveyorRequest.getSurveyor().getTenantId().split("\\.").length == 1) {
            throw new CustomException("INVALID_TENANT",
                    "Surveyor cannot be updated at State level");
        }

        userService.manageSurveyors(surveyorRequest, false);
        enrichmentService.enrichUpdate(surveyorRequest);
        surveyorRepository.update(surveyorRequest);
        return surveyorRequest.getSurveyor();
    }

    // ── SEARCH ────────────────────────────────────────────────────────

    public SurveyorResponse search(SurveyorSearchCriteria criteria, RequestInfo requestInfo) {

        // ── Auto-scope by role ────────────────────────────────────────
        // EKYC_SUPERVISOR: sees only their own surveyors
        //   → derive supervisorId from token UUID, set on criteria
        // EKYC_VENDOR: sees all surveyors under their vendor
        //   → criteria.vendorId already set by frontend OR could be
        //     derived similarly — for now frontend passes vendorId
        // SUPERUSER/EMPLOYEE/others: unrestricted, no modification
        applyRoleBasedScoping(criteria, requestInfo);

        // Mobile number → resolve to ownerIds via user service
        if (criteria.getMobileNumber() != null) {
            SurveyorSearchCriteria userCriteria = SurveyorSearchCriteria.builder()
                    .tenantId(criteria.getTenantId())
                    .mobileNumber(criteria.getMobileNumber())
                    .build();

            UserDetailResponse userResp = userService.getOwner(userCriteria, requestInfo);

            if (userResp != null && !CollectionUtils.isEmpty(userResp.getUser())) {
                List<String> uuids = userResp.getUser().stream()
                        .map(User::getUuid)
                        .collect(Collectors.toList());

                if (CollectionUtils.isEmpty(criteria.getOwnerIds()))
                    criteria.setOwnerIds(uuids);
                else
                    criteria.getOwnerIds().addAll(uuids);
            }
        }

        SurveyorResponse response = surveyorRepository.getSurveyorData(criteria);

        if (response != null && !CollectionUtils.isEmpty(response.getSurveyors())) {
            enrichmentService.enrichSearch(response.getSurveyors(), requestInfo,
                    criteria.getTenantId());
        }

        if (response != null && CollectionUtils.isEmpty(response.getSurveyors())) {
            response.setSurveyors(new ArrayList<>());
        }

        return response;
    }

    // ── Role-based scoping for search ─────────────────────────────────

    /**
     * EKYC_SUPERVISOR → auto-derive supervisorId from token and set on
     * criteria so the DB query is scoped to their linked surveyors only.
     * The supervisor never needs to know their own entity ID.
     *
     * All other roles → no modification (unrestricted or handled by
     * explicit criteria params passed by the caller).
     */
    /**
     * DB-based scoping — does NOT rely on JWT roles.
     *
     * ZUUL gateway replaces userInfo.roles with Keycloak realm roles
     * (offline_access, uma_authorization) — DIGIT roles like EKYC_SUPERVISOR
     * are NOT present. So we check the DB directly by caller UUID:
     *
     *   UUID in eg_supervisor → supervisor → scope to their surveyors only
     *   UUID in eg_vendor     → vendor     → scope to their vendor
     *   Neither               → SUPERUSER  → no restriction
     *
     * Explicit supervisorId/vendorId passed as query param always takes priority.
     */
    private void applyRoleBasedScoping(SurveyorSearchCriteria criteria,
                                       RequestInfo requestInfo) {
        if (requestInfo == null || requestInfo.getUserInfo() == null) return;

        String callerUuid = requestInfo.getUserInfo().getUuid();
        if (callerUuid == null) return;

        // Explicit supervisorId passed as query param — respect it, skip auto-scope
        if (StringUtils.hasLength(criteria.getSupervisorId())) {
            log.info("supervisorId={} passed explicitly — skipping auto-scope",
                    criteria.getSupervisorId());
            return;
        }

        // Check DB: is this caller a supervisor?
        Map<String, String> supervisorProfile =
                surveyorRepository.findSupervisorByOwnerUuid(callerUuid);

        if (supervisorProfile != null) {
            criteria.setSupervisorId(supervisorProfile.get("id"));
            log.info("Auto-scoped surveyor search to supervisorId={} for uuid={}",
                    supervisorProfile.get("id"), callerUuid);
            return;
        }

        // Check DB: is this caller a vendor owner?
        if (!StringUtils.hasLength(criteria.getVendorId())) {
            List<String> vendorIds = surveyorRepository.getVendorIdsByOwnerUuid(callerUuid);
            if (!CollectionUtils.isEmpty(vendorIds)) {
                criteria.setVendorId(vendorIds.get(0));
                log.info("Auto-scoped surveyor search to vendorId={} for uuid={}",
                        vendorIds.get(0), callerUuid);
                return;
            }
        }

        // Neither — SUPERUSER/admin — no restriction
        log.info("No supervisor/vendor profile for uuid={} — unrestricted search", callerUuid);
    }
}