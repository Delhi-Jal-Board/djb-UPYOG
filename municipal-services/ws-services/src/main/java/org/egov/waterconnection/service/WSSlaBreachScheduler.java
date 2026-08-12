package org.egov.waterconnection.service;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WSSlaBreachScheduler {

   @Autowired
   private WSSlaBreachService wsSlaBreachService;

   /**
    * This scheduler runs every 10 minutes to check for SLA breached water connection applications.
    * Uses ShedLock to ensure only one instance runs this job across multiple service instances.
    */
   @Scheduled(cron = "0 */10 * * * *")

   public void processSlaBreachedApplications() {
       log.info("SLA Breach Scheduler started running...");
       try {
           wsSlaBreachService.processSlaBreachedApplications();
       } catch (Exception e) {
           log.error("Error occurred while processing SLA breached applications", e);
       }
       log.info("SLA Breach Scheduler finished running.");
   }
}
