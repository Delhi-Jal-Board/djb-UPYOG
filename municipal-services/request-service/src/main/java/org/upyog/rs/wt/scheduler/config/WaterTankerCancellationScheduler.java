package org.upyog.rs.wt.scheduler.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.upyog.rs.wt.scheduler.service.WaterTankerCancellationService;

@Slf4j
@Component
public class WaterTankerCancellationScheduler {

    @Autowired
    private WaterTankerCancellationService cancellationService;

    @Value("${wt.cancel.scheduler.enabled}")
    private Boolean schedulerEnabled;

    // Cron expression for 11:30 PM daily
    @Scheduled(cron = "${wt.cancel.scheduler.cron}",
              zone = "${wt.fixed.point.scheduler.timezone}")
    public void executeNightlyCancellations() {
        log.info("--- CRON TRIGGERED: Starting 11:30 PM Automated Cancellations ---");

        if (Boolean.FALSE.equals(schedulerEnabled)) {
            log.warn("Cancellation Scheduler is disabled in configuration.");
            return;
        }

        try {
            // Pass null, the service will generate a System RequestInfo
            cancellationService.cancelScheduledBookings(null);
            log.info("--- Automated Cancellation Scheduler Completed Successfully ---");
        } catch (Exception e) {
            log.error("--- Automated Cancellation Scheduler Failed: {} ---", e.getMessage(), e);
        }
    }
}