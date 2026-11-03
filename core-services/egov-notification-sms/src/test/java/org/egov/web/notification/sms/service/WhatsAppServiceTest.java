package org.egov.web.notification.sms.service;

import org.egov.web.notification.sms.config.SMSProperties;
import org.egov.web.notification.sms.models.Category;
import org.egov.web.notification.sms.models.Sms;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WhatsAppServiceTest {

    @Mock
    private RestTemplate secureRestTemplate;

    @Mock
    private Environment env;

    @Mock
    private SMSProperties smsProperties;

    private WhatsAppService whatsAppService;

    @Before
    public void setUp() {
        whatsAppService = new WhatsAppService();
        ReflectionTestUtils.setField(whatsAppService, "secureRestTemplate", secureRestTemplate);
        ReflectionTestUtils.setField(whatsAppService, "env", env);
        ReflectionTestUtils.setField(whatsAppService, "smsProperties", smsProperties);
        ReflectionTestUtils.setField(whatsAppService, "whatsappUrl", "https://partnersv1.pinbot.ai/v3/1232341649968357/messages");
        ReflectionTestUtils.setField(whatsAppService, "whatsappApikey", "TEST_KEY");
        ReflectionTestUtils.setField(whatsAppService, "defaultWhatsAppTemplate", "djb_portal_otp_verification");

        when(smsProperties.isNumberBlacklisted(anyString())).thenReturn(false);
        when(smsProperties.isNumberWhitelisted(anyString())).thenReturn(true);
    }

    @Test
    public void testEkycWhatsAppDispatch_TemplateAndParamsMatching() {
        when(env.getProperty("whatsapp.template.mapping.eKycOtpSend")).thenReturn("update_template_24sept");
        when(env.getProperty("whatsapp.template.params.eKycOtpSend"))
                .thenReturn("*{1}*|confirmation number for DJB eKYC|*{otp}*|share this number only with the authorized DJB eKYC representative to complete the process");

        when(secureRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"success\"}", HttpStatus.OK));

        Sms sms = new Sms(
                "9857346587",
                "Dear Consumer,\nYour confirmation number for DJB eKYC is 791840.",
                Category.OTP,
                null,
                null,
                new String[]{"eKycOtpSend", "Devendra"}
        );

        whatsAppService.sendWhatsApp(sms);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(secureRestTemplate, times(1)).exchange(
                eq("https://partnersv1.pinbot.ai/v3/1232341649968357/messages"),
                eq(HttpMethod.POST),
                captor.capture(),
                eq(String.class)
        );

        HttpEntity capturedEntity = captor.getValue();
        Map<String, Object> body = (Map<String, Object>) capturedEntity.getBody();

        assertEquals("whatsapp", body.get("messaging_product"));
        assertEquals("template", body.get("type"));
        assertEquals("9857346587", body.get("to"));

        Map<String, Object> template = (Map<String, Object>) body.get("template");
        assertEquals("update_template_24sept", template.get("name"));

        List<Map<String, Object>> components = (List<Map<String, Object>>) template.get("components");
        assertNotNull(components);
        assertEquals(1, components.size());

        List<Map<String, Object>> params = (List<Map<String, Object>>) components.get(0).get("parameters");
        assertEquals(4, params.size());
        assertEquals("*Devendra*", params.get(0).get("text"));
        assertEquals("confirmation number for DJB eKYC", params.get(1).get("text"));
        assertEquals("*791840*", params.get(2).get("text"));
    }

    @Test
    public void testLoginOtpWhatsAppDispatch_DefaultTemplate() {
        when(secureRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"success\"}", HttpStatus.OK));

        Sms sms = new Sms("9857346587", "Your OTP for login to Delhi Jal Board portal is 2026.", Category.OTP, null, null, null);

        whatsAppService.sendWhatsApp(sms);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(secureRestTemplate, times(1)).exchange(
                anyString(),
                eq(HttpMethod.POST),
                captor.capture(),
                eq(String.class)
        );

        Map<String, Object> body = (Map<String, Object>) captor.getValue().getBody();
        Map<String, Object> template = (Map<String, Object>) body.get("template");
        assertEquals("djb_portal_otp_verification", template.get("name"));
    }

    @Test
    public void testBlacklistedNumber_NotSent() {
        when(smsProperties.isNumberBlacklisted("9857346587")).thenReturn(true);

        Sms sms = new Sms("9857346587", "OTP is 123456", Category.OTP, null, null, null);

        whatsAppService.sendWhatsApp(sms);

        verify(secureRestTemplate, never()).exchange(anyString(), any(), any(), any(Class.class));
    }

    @Test
    public void testEmptyUrl_NotSent() {
        ReflectionTestUtils.setField(whatsAppService, "whatsappUrl", "");

        Sms sms = new Sms("9857346587", "OTP is 123456", Category.OTP, null, null, null);

        whatsAppService.sendWhatsApp(sms);

        verify(secureRestTemplate, never()).exchange(anyString(), any(), any(), any(Class.class));
    }
}
