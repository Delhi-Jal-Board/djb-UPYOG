package org.upyog.rs.wt.scheduler.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.upyog.rs.wt.scheduler.service.FixedPointBookingSchedulerService;

import java.time.LocalDate;

/**
 * Auto scheduler trigger.
 *
 * Runs daily at 12:10 AM.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FixedPointBookingScheduler {

    private final FixedPointBookingSchedulerService schedulerService;

    @Value("${wt.fixedpoint.scheduler.enabled}")
    private Boolean schedulerEnabled;

    @Value("${wt.fixedpoint.tenant-id}")
    private String tenantId;


    @Scheduled(
            cron = "${wt.fixedpoint.scheduler.cron}",
            zone = "${wt.fixed.point.scheduler.timezone}"
    )
    public void executeDailyFixedPointBookings() {
        log.info("--- CRON TRIGGERED: Starting Automated Fixed Point Bookings ---");

        if (Boolean.FALSE.equals(schedulerEnabled)) {
            log.warn("Scheduler is disabled in configuration.");
            return;
        }

        try {
            // This triggers the service orchestration we added in step 1
            schedulerService.runAutomatedDailyJob();

            log.info("--- Automated Scheduler Completed Successfully ---");
        } catch (Exception e) {
            log.error("--- Automated Scheduler Failed: {} ---", e.getMessage(), e);
        }
    }
}