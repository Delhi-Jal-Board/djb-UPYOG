package org.egov.web.notification.mail.consumer;

import java.util.Collections;
import java.util.HashMap;

import org.egov.web.notification.mail.consumer.contract.Email;
import org.egov.web.notification.mail.consumer.contract.EmailRequest;
import org.egov.web.notification.mail.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailNotificationListener {

    
    private EmailService emailService;
    
    private ObjectMapper objectMapper;

    @Autowired
    public EmailNotificationListener(EmailService emailService, ObjectMapper objectMapper) {
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "${kafka.topics.notification.mail.name}")
    public void listen(final HashMap<String, Object> record) {
        try {
            if (record != null && record.get("email") instanceof String) {
                // Support flat EmailMessage format (e.g. from user-otp)
                String emailStr = (String) record.get("email");
                String subject = (String) record.get("subject");
                String body = (String) record.get("body");
                Email email = Email.builder()
                        .emailTo(Collections.singleton(emailStr))
                        .subject(subject)
                        .body(body)
                        .build();
                emailService.sendEmail(email);
            } else if (record != null) {
                EmailRequest emailRequest = objectMapper.convertValue(record, EmailRequest.class);
                if (emailRequest != null && emailRequest.getEmail() != null) {
                    emailService.sendEmail(emailRequest.getEmail());
                }
            }
        } catch (Exception e) {
            log.error("Error processing email notification from Kafka topic: ", e);
        }
    }
}
