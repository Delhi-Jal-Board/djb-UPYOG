package org.egov.web.notification.sms.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.web.notification.sms.consumer.contract.WhatsAppRequest;
import org.egov.web.notification.sms.models.RequestContext;
import org.egov.web.notification.sms.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.UUID;

@Slf4j
@Service
public class WhatsAppNotificationListener {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WhatsAppService whatsAppService;

    @Value("${whatsapp.enabled:false}")
    private Boolean whatsappEnabled;

    @KafkaListener(topics = "${kafka.topics.notification.whatsapp.name}")
    public void process(HashMap<String, Object> consumerRecord) {
        RequestContext.setId(UUID.randomUUID().toString());
        WhatsAppRequest request = null;
        try {
            if (!whatsappEnabled) {
                log.info("WhatsApp service is disabled. Set whatsapp.enabled=true to enable it.");
                return;
            }
            
            request = objectMapper.convertValue(consumerRecord, WhatsAppRequest.class);
            log.info("Received WhatsApp request for mobile {}, template {}", request.getMobileNumber(), request.getTemplateName());
            
            whatsAppService.sendWhatsAppTemplate(request);

        } catch (Exception ex) {
            log.error("WhatsApp template processing failed", ex);
        }
    }
}
