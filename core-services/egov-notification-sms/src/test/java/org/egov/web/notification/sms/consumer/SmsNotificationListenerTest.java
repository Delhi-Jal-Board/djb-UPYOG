package org.egov.web.notification.sms.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.web.notification.sms.consumer.contract.SMSRequest;
import org.egov.web.notification.sms.models.Category;
import org.egov.web.notification.sms.models.Sms;
import org.egov.web.notification.sms.service.SMSService;
import org.egov.web.notification.sms.service.WhatsAppService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.Assert.*;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class SmsNotificationListenerTest {

    @Mock
    private ApplicationContext context;

    @Mock
    private SMSService smsService;

    @Mock
    private WhatsAppService whatsAppService;

    @Mock
    private CustomKafkaTemplate<String, SMSRequest> kafkaTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();
    private SmsNotificationListener listener;
    private ExecutorService testExecutor;

    @Before
    public void setUp() {
        listener = new SmsNotificationListener(context, smsService, kafkaTemplate);
        testExecutor = Executors.newFixedThreadPool(5);
        ReflectionTestUtils.setField(listener, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(listener, "whatsAppService", whatsAppService);
        ReflectionTestUtils.setField(listener, "notificationExecutor", testExecutor);
        ReflectionTestUtils.setField(listener, "smsEnable", true);
        ReflectionTestUtils.setField(listener, "whatsappEnabled", true);
        ReflectionTestUtils.setField(listener, "expiredSmsTopic", "egov.core.sms.expiry");
        ReflectionTestUtils.setField(listener, "errorSmsTopic", "egov.core.sms.error");
    }

    @Test
    public void testBothSmsAndWhatsAppSuccess() {
        AtomicBoolean smsCalled = new AtomicBoolean(false);
        AtomicBoolean waCalled = new AtomicBoolean(false);

        doAnswer(invocation -> {
            smsCalled.set(true);
            return null;
        }).when(smsService).sendSMS(any(Sms.class));

        doAnswer(invocation -> {
            waCalled.set(true);
            return null;
        }).when(whatsAppService).sendWhatsApp(any(Sms.class));

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        record.put("expiryTime", System.currentTimeMillis() + 60000L);

        listener.process(record);

        assertTrue("SMS service should have been called", smsCalled.get());
        assertTrue("WhatsApp service should have been called", waCalled.get());
        verify(smsService, times(1)).sendSMS(any(Sms.class));
        verify(whatsAppService, times(1)).sendWhatsApp(any(Sms.class));
    }

    @Test
    public void testWhatsAppHangs_SmsCompletes_ListenerTimesOutGracefully() {
        AtomicBoolean smsCalled = new AtomicBoolean(false);

        doAnswer(invocation -> {
            smsCalled.set(true);
            return null;
        }).when(smsService).sendSMS(any(Sms.class));

        // Simulate WhatsApp hanging for 25 seconds (longer than our 15s timeout ceiling)
        doAnswer(invocation -> {
            try {
                Thread.sleep(25000);
            } catch (InterruptedException e) {
                // Thread cancelled by timeout
            }
            return null;
        }).when(whatsAppService).sendWhatsApp(any(Sms.class));

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        record.put("expiryTime", System.currentTimeMillis() + 60000L);

        long start = System.currentTimeMillis();
        listener.process(record);
        long elapsed = System.currentTimeMillis() - start;

        assertTrue("SMS service should have completed successfully", smsCalled.get());
        // Listener must complete around 15 seconds (15s timeout) instead of waiting 25s+
        assertTrue("Listener should have timed out around 15 seconds instead of waiting forever. Elapsed: " + elapsed, elapsed >= 14000 && elapsed < 20000);
    }

    @Test
    public void testSmsFails_WhatsAppStillDelivered() {
        doThrow(new RuntimeException("Pinnacle gateway connection reset")).when(smsService).sendSMS(any(Sms.class));

        AtomicBoolean waCalled = new AtomicBoolean(false);
        doAnswer(invocation -> {
            waCalled.set(true);
            return null;
        }).when(whatsAppService).sendWhatsApp(any(Sms.class));

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        record.put("expiryTime", System.currentTimeMillis() + 60000L);

        listener.process(record);

        assertTrue("WhatsApp should still be delivered even when SMS gateway throws exception", waCalled.get());
    }

    @Test
    public void testWhatsAppFails_SmsStillDelivered() {
        AtomicBoolean smsCalled = new AtomicBoolean(false);
        doAnswer(invocation -> {
            smsCalled.set(true);
            return null;
        }).when(smsService).sendSMS(any(Sms.class));

        doThrow(new RuntimeException("Pinbot 500 Internal Error")).when(whatsAppService).sendWhatsApp(any(Sms.class));

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        record.put("expiryTime", System.currentTimeMillis() + 60000L);

        listener.process(record);

        assertTrue("SMS should still be delivered even when WhatsApp throws exception", smsCalled.get());
    }

    @Test
    public void testWhatsAppDisabled_OnlySmsDispatched() {
        ReflectionTestUtils.setField(listener, "whatsappEnabled", false);

        AtomicBoolean smsCalled = new AtomicBoolean(false);
        doAnswer(invocation -> {
            smsCalled.set(true);
            return null;
        }).when(smsService).sendSMS(any(Sms.class));

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        record.put("expiryTime", System.currentTimeMillis() + 60000L);

        listener.process(record);

        assertTrue("SMS service should be called", smsCalled.get());
        verify(whatsAppService, never()).sendWhatsApp(any(Sms.class));
    }

    @Test
    public void testOtpExpired_NotDispatchedToGateway() {
        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");
        // Expired in past
        record.put("expiryTime", System.currentTimeMillis() - 5000L);

        listener.process(record);

        verify(smsService, never()).sendSMS(any(Sms.class));
        verify(whatsAppService, never()).sendWhatsApp(any(Sms.class));
        verify(kafkaTemplate, times(1)).send(eq("egov.core.sms.expiry"), any(SMSRequest.class));
    }

    @Test
    public void testSmsServiceDisabled_NothingDispatched() {
        ReflectionTestUtils.setField(listener, "smsEnable", false);

        HashMap<String, Object> record = new HashMap<>();
        record.put("mobileNumber", "9857346587");
        record.put("message", "Dear Consumer, OTP is 123456");
        record.put("category", "OTP");

        listener.process(record);

        verify(smsService, never()).sendSMS(any(Sms.class));
        verify(whatsAppService, never()).sendWhatsApp(any(Sms.class));
    }
}

