package org.egov.web.notification.sms.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.*;
import org.egov.tracer.kafka.*;
import org.egov.web.notification.sms.consumer.contract.SMSRequest;
import org.egov.web.notification.sms.models.Category;
import org.egov.web.notification.sms.models.RequestContext;
import org.egov.web.notification.sms.service.SMSService;
import org.egov.web.notification.sms.service.WhatsAppService;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.autoconfigure.kafka.*;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.kafka.annotation.*;
import org.springframework.kafka.config.*;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.*;
import org.springframework.kafka.listener.ErrorHandler;
import org.springframework.stereotype.Service;
import org.springframework.util.*;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.UUID;

@Slf4j
@Service
public class SmsNotificationListener {

    private final ApplicationContext context;
    private SMSService smsService;
    private CustomKafkaTemplate<String, SMSRequest> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${kafka.topics.expiry.sms}")
    String expiredSmsTopic;

    @Value("${kafka.topics.backup.sms}")
    String backupSmsTopic;

    @Value("${kafka.topics.error.sms}")
    String errorSmsTopic;

    @Value("${sms.enabled}")
    Boolean smsEnable;

    @Autowired
    private WhatsAppService whatsAppService;

    @Value("${whatsapp.enabled:false}")
    private Boolean whatsappEnabled;

    @Autowired
    @Qualifier("notificationExecutor")
    private java.util.concurrent.Executor notificationExecutor;
    @Autowired
    public SmsNotificationListener(
            ApplicationContext context,
            SMSService smsService,
            CustomKafkaTemplate<String, SMSRequest> kafkaTemplate) {
        this.smsService = smsService;
        this.context = context;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
            topics = "${kafka.topics.notification.sms.name:egov.core.notification.sms}"
    )
    public void process(HashMap<String, Object> consumerRecord) {
        processMessage(consumerRecord);
    }

    @KafkaListener(
            topics = "${kafka.topics.notification.sms.otp.name:egov.core.notification.sms.otp}"
    )
    public void processOtp(HashMap<String, Object> consumerRecord) {
        processMessage(consumerRecord);
    }

    private void processMessage(HashMap<String, Object> consumerRecord) {
        RequestContext.setId(UUID.randomUUID().toString());
        SMSRequest request = null;
        try {
            if(!smsEnable){
                log.info("Sms service is disable to enable the notification service set the value of sms.enable flag as true");
            }
            else{
                request = objectMapper.convertValue(consumerRecord, SMSRequest.class);
                if (request.getExpiryTime() != null && request.getCategory() == Category.OTP) {
                    Long expiryTime = request.getExpiryTime();
                    Long currentTime = System.currentTimeMillis();
                    if (expiryTime < currentTime) {
                        log.info("OTP Expired");
                        if (!StringUtils.isEmpty(expiredSmsTopic))
                            kafkaTemplate.send(expiredSmsTopic, request);
                    } else {
                        dispatchNotificationsInParallel(request.toDomain());
                    }
                } else {
                    dispatchNotificationsInParallel(request.toDomain());
                }
            }

        } catch (RestClientException rx) {
            log.info("Going to backup SMS Service", rx);
            if (!StringUtils.isEmpty(backupSmsTopic))
                kafkaTemplate.send(backupSmsTopic, request);
            else if (!StringUtils.isEmpty(errorSmsTopic)) {
                kafkaTemplate.send(errorSmsTopic, request);
            } else {
                throw rx;
            }
        } catch (Exception ex) {
            log.error("Sms service failed", ex);
            if (!StringUtils.isEmpty(errorSmsTopic)) {
                kafkaTemplate.send(errorSmsTopic, request);
            } else {
                throw ex;
            }
        }
    }

    private void dispatchNotificationsInParallel(org.egov.web.notification.sms.models.Sms sms) {
        java.util.concurrent.CompletableFuture<Void> smsFuture = java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                smsService.sendSMS(sms);
            } catch (Exception e) {
                log.error("Failed to send SMS to {}: {}", sms != null ? sms.getMobileNumber() : null, e.getMessage(), e);
            }
        }, notificationExecutor);

        java.util.concurrent.CompletableFuture<Void> whatsappFuture = null;
        if (Boolean.TRUE.equals(whatsappEnabled)) {
            whatsappFuture = java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    whatsAppService.sendWhatsApp(sms);
                } catch (Exception e) {
                    log.error("Failed to send WhatsApp to {}: {}", sms != null ? sms.getMobileNumber() : null, e.getMessage(), e);
                }
            }, notificationExecutor);
        }

        try {
            if (whatsappFuture != null) {
                java.util.concurrent.CompletableFuture.allOf(smsFuture, whatsappFuture).join();
            } else {
                smsFuture.join();
            }
        } catch (Exception e) {
            log.error("Exception waiting for parallel notification dispatch to {}: {}", sms != null ? sms.getMobileNumber() : null, e.getMessage(), e);
        }
    }
}