package org.egov.vendor.surveyor.job;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.vendor.producer.Producer;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.surveyor.repository.SurveyorRepository;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.SurveyorRequest;
import org.egov.vendor.surveyor.web.model.SurveyorResponse;
import org.egov.vendor.surveyor.web.model.SurveyorSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * ONE-TIME backfill for surveyors whose ekyc_assignment rows went stale
 * before the sync bug (broken SQL column name) was fixed.
 *
 * Does NOT touch ekyc_assignment directly, and is NOT a new HTTP endpoint,
 * and does NOT create any table. It simply re-publishes every existing
 * surveyor onto the same update-surveyor-application topic a normal update
 * already uses — ekyc-service's SurveyorSupervisorSyncConsumer then repairs
 * every ACTIVE row through the exact same code path as a live sync.
 *
 * NO PERSISTED "already ran" GUARD — no table permission available, so
 * this cannot self-disable across restarts the way a DB marker would.
 * Safety net instead: BOTH enabled=true AND a matching, one-time runToken
 * must be set together. Leaving enabled=true in a config file long-term is
 * harmless as long as runToken is cleared/changed afterward — see the
 * run steps below.
 *
 * REQUIRED OPERATOR STEPS:
 *   1. Set backfill.surveyor.supervisor.sync.enabled=true
 *      and backfill.surveyor.supervisor.sync.runToken=<any string you choose,
 *      e.g. today's date> — both together, for exactly one deploy.
 *   2. Restart vendor-service once. Watch the logs for "Backfill complete".
 *   3. IMMEDIATELY set enabled=false (or delete both properties) before the
 *      next deploy/restart. There is no code-level protection against
 *      forgetting this step — treat it as a manual runbook item.
 */
@Slf4j
@Component
public class SurveyorSupervisorBackfillRunner implements ApplicationRunner {

    @Autowired
    private SurveyorRepository surveyorRepository;

    @Autowired
    private Producer producer;

    @Autowired
    private VendorConfiguration configuration;

    @Value("${backfill.surveyor.supervisor.sync.enabled:false}")
    private boolean enabled;

    @Value("${backfill.surveyor.supervisor.sync.tenantId:}")
    private String tenantId;

    // Both this AND enabled=true must be set for the run to actually fire —
    // makes an accidentally-left-on "enabled=true" alone a no-op.
    @Value("${backfill.surveyor.supervisor.sync.runToken:}")
    private String runToken;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        if (!StringUtils.hasLength(runToken)) {
            log.warn("backfill.surveyor.supervisor.sync.enabled=true but runToken is not set — " +
                    "skipping backfill (this is the safety net, not a bug). Set a runToken to actually run it.");
            return;
        }

        if (!StringUtils.hasLength(tenantId)) {
            log.error("backfill.surveyor.supervisor.sync.enabled=true with a runToken set, but " +
                    "backfill.surveyor.supervisor.sync.tenantId is missing — aborting backfill.");
            return;
        }

        log.info("=== Starting one-time surveyor-supervisor backfill for tenantId={} runToken={} ===",
                tenantId, runToken);
        log.info("=== REMINDER: set backfill.surveyor.supervisor.sync.enabled=false " +
                "(or clear runToken) before the next deploy — no automatic guard exists. ===");

        SurveyorSearchCriteria criteria = SurveyorSearchCriteria.builder()
                .tenantId(tenantId)
                .limit(-1)   // no limit — fetch every surveyor for this tenant
                .offset(0)
                .build();

        SurveyorResponse response = surveyorRepository.getSurveyorData(criteria);
        List<Surveyor> surveyors = response != null ? response.getSurveyors() : null;

        if (surveyors == null || surveyors.isEmpty()) {
            log.warn("Backfill found 0 surveyors for tenantId={} — nothing to do.", tenantId);
            return;
        }

        int published = 0;
        for (Surveyor surveyor : surveyors) {
            if (!StringUtils.hasLength(surveyor.getOwnerId())
                    || !StringUtils.hasLength(surveyor.getSupervisorId())) {
                log.warn("Skipping surveyorId={} — missing ownerId/supervisorId, cannot sync.", surveyor.getId());
                continue;
            }

            SurveyorRequest republishRequest = SurveyorRequest.builder()
                    .requestInfo(RequestInfo.builder().build())
                    .surveyor(surveyor)
                    .build();

            producer.push(configuration.getUpdateSurveyorTopic(), republishRequest);
            published++;
        }

        log.info("=== Backfill complete: republished {} of {} surveyor(s) for tenantId={} onto {}. " +
                        "SET enabled=false (or clear runToken) NOW before the next restart. ===",
                published, surveyors.size(), tenantId, configuration.getUpdateSurveyorTopic());
    }
}