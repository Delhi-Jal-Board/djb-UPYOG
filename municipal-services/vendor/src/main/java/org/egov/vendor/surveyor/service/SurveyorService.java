package org.egov.vendor.surveyor.service;

import java.util.ArrayList;
import java.util.Arrays;
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

        Surveyor surveyor = surveyorRequest.getSurveyor();

        // ── Supervisor remapping — ekyc_assignment sync ───────────────
        // When a vendor remaps a surveyor to a different supervisor,
        // existing ACTIVE assignments in ekyc_assignment still carry the
        // old supervisor_id — causing wrong KNO counts in _progress and
        // hierarchy reports.
        //
        // We detect a supervisor change by fetching the current DB state
        // BEFORE persisting the update, then syncing ekyc_assignment if
        // supervisorId has changed.
        //
        // Security: surveyorId and newSupervisorId come from the validated
        // request, ownerId from DB — never directly from frontend. The sync
        // only touches ACTIVE assignments for this specific surveyor's
        // ownerUUID — no cross-surveyor/cross-vendor side effects possible.
        //
        // Failure isolation: if sync fails (e.g. ekyc_assignment table
        // unavailable), we log a warning but DO NOT block the surveyor
        // update — eg_surveyor is the source of truth; the sync is a
        // derived operation that self-heals on next assignment activity.
        if (StringUtils.hasLength(surveyor.getId())
                && StringUtils.hasLength(surveyor.getSupervisorId())) {

            try {
                // Fetch current surveyor state from DB to detect supervisor change
                SurveyorSearchCriteria currentCriteria = SurveyorSearchCriteria.builder()
                        .ids(java.util.Arrays.asList(surveyor.getId()))
                        .tenantId(surveyor.getTenantId())
                        .limit(1)
                        .offset(0)
                        .build();

                SurveyorResponse currentResponse = surveyorRepository.getSurveyorData(currentCriteria);

                if (currentResponse != null
                        && !CollectionUtils.isEmpty(currentResponse.getSurveyors())) {

                    Surveyor current = currentResponse.getSurveyors().get(0);
                    String oldSupervisorId = current.getSupervisorId();
                    String newSupervisorId = surveyor.getSupervisorId();

                    // Only sync if supervisor has actually changed
                    if (StringUtils.hasLength(oldSupervisorId)
                            && !oldSupervisorId.equals(newSupervisorId)
                            && StringUtils.hasLength(current.getOwnerId())) {

                        // Resolve new supervisor's vendor — auto-correct surveyor's
                        // vendorId if it belongs to a different vendor.
                        String newVendorId = null;
                        Map<String, String> newSupervisorProfile =
                                surveyorRepository.findSupervisorById(newSupervisorId);
                        if (newSupervisorProfile != null
                                && StringUtils.hasLength(newSupervisorProfile.get("vendorId"))) {
                            newVendorId = newSupervisorProfile.get("vendorId");
                            if (!newVendorId.equals(current.getVendorId())) {
                                surveyor.setVendorId(newVendorId);
                                log.info("Surveyor {} vendorId auto-corrected: {} → {} " +
                                                "(new supervisor {} belongs to a different vendor)",
                                        surveyor.getId(), current.getVendorId(), newVendorId, newSupervisorId);
                            }
                        } else {
                            log.warn("Could not resolve vendorId for newSupervisorId={} — " +
                                    "surveyor.vendorId left unchanged, ekyc_assignment.vendor_id " +
                                    "will not be updated either", newSupervisorId);
                        }

                        log.info("Surveyor {} supervisorId changed: {} → {}. " +
                                        "Syncing ekyc_assignment...",
                                surveyor.getId(), oldSupervisorId, newSupervisorId);

                        int synced = surveyorRepository.syncEkycAssignmentSupervisor(
                                current.getOwnerId(), newSupervisorId, newVendorId);

                        log.info("ekyc_assignment sync complete: {} rows updated " +
                                "for surveyorOwnerId={}", synced, current.getOwnerId());
                    }
                }
            } catch (Exception e) {
                // Soft failure — surveyor update must not be blocked
                log.warn("ekyc_assignment supervisor sync failed for surveyorId={}. " +
                        "Surveyor update will proceed. Manual DB fix may be needed. " +
                        "Error: {}", surveyor.getId(), e.getMessage());
            }
        }

        userService.manageSurveyors(surveyorRequest, false);
        enrichmentService.enrichUpdate(surveyorRequest);
        surveyorRepository.update(surveyorRequest);
        return surveyorRequest.getSurveyor();
    }

    // ── SEARCH ────────────────────────────────────────────────────────

    public SurveyorResponse search(SurveyorSearchCriteria criteria, RequestInfo requestInfo) {

        // ── Auto-scope by DB profile (not JWT roles) ──────────────────
        // ZUUL replaces userInfo.roles with Keycloak realm roles —
        // DIGIT roles (EKYC_SUPERVISOR etc.) are NOT present in token.
        // We check DB directly by caller UUID instead.
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
     * DB-based scoping — does NOT rely on JWT roles.
     *
     * ZUUL gateway replaces userInfo.roles with Keycloak realm roles
     * (offline_access, uma_authorization) — DIGIT roles like EKYC_SUPERVISOR
     * are NOT present. So we check the DB directly by caller UUID:
     *
     *   UUID in eg_supervisor → supervisor → scope to their surveyors only
     *   UUID in eg_vendor     → vendor     → scope to their vendor
     *                           supervisorId from request still respected
     *                           for drill-down, but vendorId always forced
     *                           from DB — security boundary
     *   Neither               → SUPERUSER  → no restriction
     *
     * Explicit supervisorId passed as query param takes priority for
     * supervisor callers only. For vendor callers, vendorId is always
     * overridden from DB regardless of what frontend passes.
     */
    private void applyRoleBasedScoping(SurveyorSearchCriteria criteria,
                                       RequestInfo requestInfo) {
        if (requestInfo == null || requestInfo.getUserInfo() == null) return;

        String callerUuid = requestInfo.getUserInfo().getUuid();
        if (callerUuid == null) return;

        // ── Check DB: is this caller a supervisor? ────────────────────
        Map<String, String> supervisorProfile =
                surveyorRepository.findSupervisorByOwnerUuid(callerUuid);

        if (supervisorProfile != null) {
            // Explicit supervisorId passed — respect it (supervisor viewing own team)
            if (StringUtils.hasLength(criteria.getSupervisorId())) {
                log.info("supervisorId={} passed explicitly by supervisor uuid={} — kept",
                        criteria.getSupervisorId(), callerUuid);
                return;
            }
            // Auto-scope to their own surveyors
            criteria.setSupervisorId(supervisorProfile.get("id"));
            log.info("Auto-scoped surveyor search to supervisorId={} for uuid={}",
                    supervisorProfile.get("id"), callerUuid);
            return;
        }

        // ── Check DB: is this caller a vendor owner? ──────────────────
        // Security boundary — vendorId always forced from DB.
        // Even if frontend passes wrong vendorId, token overrides it.
        // supervisorId from frontend respected for drill-down.
        List<String> vendorIds = surveyorRepository.getVendorIdsByOwnerUuid(callerUuid);
        if (!CollectionUtils.isEmpty(vendorIds)) {
            criteria.setVendorId(vendorIds.get(0)); // always override vendorId
            log.info("Auto-scoped surveyor search to vendorId={} for uuid={}",
                    vendorIds.get(0), callerUuid);
            return;
        }

        // ── Neither — SUPERUSER/admin — no restriction ────────────────
        log.info("No supervisor/vendor profile for uuid={} — unrestricted search", callerUuid);
    }
}