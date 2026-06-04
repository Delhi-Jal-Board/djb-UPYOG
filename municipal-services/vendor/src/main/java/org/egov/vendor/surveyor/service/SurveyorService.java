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
        // Instead of requiring the frontend to know and send supervisorId
        // and vendorId, we derive both from the token's UUID:
        //   token.userInfo.uuid → eg_supervisor.owner_id
        //                       → supervisor.id  (supervisorId)
        //                       → supervisor.vendor_id (vendorId)
        Surveyor surveyor = surveyorRequest.getSurveyor();

        if (!StringUtils.hasLength(surveyor.getSupervisorId())) {
            String callerUuid = surveyorRequest.getRequestInfo().getUserInfo().getUuid();
            Map<String, String> supervisorProfile =
                    surveyorRepository.findSupervisorByOwnerUuid(callerUuid);

            if (supervisorProfile == null) {
                throw new CustomException("SUPERVISOR_NOT_FOUND",
                        "No active supervisor found for logged-in user (uuid=" + callerUuid + "). "
                                + "Please register as a supervisor before creating surveyors.");
            }

            surveyor.setSupervisorId(supervisorProfile.get("id"));
            log.info("Auto-derived supervisorId={} for surveyor from token uuid={}",
                    supervisorProfile.get("id"), callerUuid);

            // Also auto-derive vendorId if not provided
            if (!StringUtils.hasLength(surveyor.getVendorId())) {
                surveyor.setVendorId(supervisorProfile.get("vendorId"));
                log.info("Auto-derived vendorId={} for surveyor from supervisor profile",
                        supervisorProfile.get("vendorId"));
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
}