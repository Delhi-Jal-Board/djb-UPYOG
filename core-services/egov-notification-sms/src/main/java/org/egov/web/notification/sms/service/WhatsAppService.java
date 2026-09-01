package org.egov.web.notification.sms.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.web.notification.sms.models.Sms;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.egov.web.notification.sms.config.SMSProperties;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import javax.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WhatsAppService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${whatsapp.url:}")
    private String whatsappUrl;

    @Value("${whatsapp.apikey:}")
    private String whatsappApikey;

    @Autowired
    private SMSProperties smsProperties;

    private RestTemplate secureRestTemplate;

    @PostConstruct
    public void init() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            CloseableHttpClient httpClient = HttpClients.custom()
                .setSSLHostnameVerifier(new NoopHostnameVerifier())
                .setSSLContext(sslContext)
                .build();
            HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
            requestFactory.setHttpClient(httpClient);
            this.secureRestTemplate = new RestTemplate(requestFactory);
        } catch (Exception e) {
            log.error("Failed to initialize secure RestTemplate for WhatsApp, falling back to default", e);
            this.secureRestTemplate = this.restTemplate;
        }
    }

    public void sendWhatsAppTemplate(org.egov.web.notification.sms.consumer.contract.WhatsAppRequest request) {
        if (whatsappUrl == null || whatsappUrl.isEmpty()) {
            log.warn("WhatsApp URL is not configured. Skipping WhatsApp message.");
            return;
        }

        if (request.getMobileNumber() == null || request.getMobileNumber().isEmpty()) {
            log.error("WhatsApp message mobile number is missing");
            return;
        }

        if (smsProperties.isNumberBlacklisted(request.getMobileNumber())) {
            log.error(String.format("WhatsApp to %s is blacklisted", request.getMobileNumber()));
            return;
        }

        if (!smsProperties.isNumberWhitelisted(request.getMobileNumber())) {
            log.error(String.format("WhatsApp to %s is not in whitelist", request.getMobileNumber()));
            return;
        }
        
        log.info("Sending WhatsApp template {} to {}", request.getTemplateName(), request.getMobileNumber());
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", whatsappApikey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("recipient_type", "individual");
            requestBody.put("to", request.getMobileNumber());
            requestBody.put("type", "template");

            Map<String, Object> templateBody = new HashMap<>();
            templateBody.put("name", request.getTemplateName());
            
            Map<String, Object> language = new HashMap<>();
            String langCode = (request.getTemplateName() != null && request.getTemplateName().endsWith("_hi")) ? "hi" : "en";
            language.put("code", langCode);
            templateBody.put("language", language);

            if (request.getParameters() != null && !request.getParameters().isEmpty()) {
                java.util.List<Map<String, Object>> paramList = new java.util.ArrayList<>();
                for (String paramValue : request.getParameters()) {
                    Map<String, Object> param = new HashMap<>();
                    param.put("type", "text");
                    param.put("text", paramValue);
                    paramList.add(param);
                }
                
                Map<String, Object> component = new HashMap<>();
                component.put("type", "BODY");
                component.put("parameters", paramList);
                
                templateBody.put("components", java.util.Collections.singletonList(component));
            }

            requestBody.put("template", templateBody);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = secureRestTemplate.exchange(
                    whatsappUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("WhatsApp API response status: {}, body: {}", response.getStatusCode(), response.getBody());
        } catch (Exception e) {
            log.error("Error occurred while sending WhatsApp template message: ", e);
        }
    }

    public void sendWhatsApp(Sms sms) {
        if (whatsappUrl == null || whatsappUrl.isEmpty()) {
            log.warn("WhatsApp URL is not configured. Skipping WhatsApp message.");
            return;
        }

        if (!sms.isValid()) {
            log.error(String.format("WhatsApp message %s is not valid", sms));
            return;
        }

        if (smsProperties.isNumberBlacklisted(sms.getMobileNumber())) {
            log.error(String.format("WhatsApp to %s is blacklisted", sms.getMobileNumber()));
            return;
        }

        if (!smsProperties.isNumberWhitelisted(sms.getMobileNumber())) {
            log.error(String.format("WhatsApp to %s is not in whitelist", sms.getMobileNumber()));
            return;
        }
        
        log.info("Sending WhatsApp message to {}", sms.getMobileNumber());
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", whatsappApikey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("recipient_type", "individual");
            requestBody.put("to", sms.getMobileNumber());
            // Format message for WhatsApp
            String message = sms.getMessage();
            if (message != null) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?<!\\d)(\\d{6})(?!\\d)").matcher(message);
                if (matcher.find() && sms.getCategory() != null && sms.getCategory().name().equals("OTP")) {
                    String otp = matcher.group(1);
                    
                    requestBody.put("type", "template");
                    Map<String, Object> templateBody = new HashMap<>();
                    templateBody.put("name", "djb_portal_otp_verification");
                    
                    Map<String, Object> language = new HashMap<>();
                    language.put("code", "en");
                    templateBody.put("language", language);
                    
                    java.util.List<Map<String, Object>> components = new java.util.ArrayList<>();
                    
                    // Body component
                    Map<String, Object> bodyComponent = new HashMap<>();
                    bodyComponent.put("type", "body");
                    Map<String, Object> bodyParam = new HashMap<>();
                    bodyParam.put("type", "text");
                    bodyParam.put("text", otp);
                    bodyComponent.put("parameters", java.util.Collections.singletonList(bodyParam));
                    components.add(bodyComponent);
                    
                    // Button component
                    Map<String, Object> buttonComponent = new HashMap<>();
                    buttonComponent.put("type", "button");
                    buttonComponent.put("sub_type", "url");
                    buttonComponent.put("index", "0");
                    Map<String, Object> buttonParam = new HashMap<>();
                    buttonParam.put("type", "text");
                    buttonParam.put("text", otp);
                    buttonComponent.put("parameters", java.util.Collections.singletonList(buttonParam));
                    components.add(buttonComponent);
                    
                    templateBody.put("components", components);
                    requestBody.put("template", templateBody);
                    
                } else {
                    requestBody.put("type", "text");
                    Map<String, String> textBody = new HashMap<>();
                    // Fallback to bolding the 6 digits if it's not the primary OTP category
                    message = message.replaceAll("(?<!\\d)(\\d{6})(?!\\d)", "*$1*");
                    textBody.put("body", message);
                    requestBody.put("text", textBody);
                }
            } else {
                requestBody.put("type", "text");
                Map<String, String> textBody = new HashMap<>();
                textBody.put("body", "");
                requestBody.put("text", textBody);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = secureRestTemplate.exchange(
                    whatsappUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("WhatsApp API response status: {}, body: {}", response.getStatusCode(), response.getBody());
        } catch (Exception e) {
            log.error("Error occurred while sending WhatsApp message: ", e);
        }
    }
}
