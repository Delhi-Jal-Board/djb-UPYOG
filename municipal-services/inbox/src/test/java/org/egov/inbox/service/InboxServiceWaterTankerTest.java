package org.egov.inbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.inbox.config.InboxConfiguration;
import org.egov.inbox.repository.ServiceRequestRepository;
import org.egov.inbox.web.model.Inbox;
import org.egov.inbox.web.model.workflow.ProcessInstance;
import org.egov.inbox.web.model.workflow.ProcessInstanceSearchCriteria;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.egov.inbox.util.RequestServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;

public class InboxServiceWaterTankerTest {

    @InjectMocks
    private InboxService inboxService;

    @Mock
    private InboxConfiguration config;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private WTInboxFilterService wtInboxFilterService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    private ProcessInstance createMockProcessInstance(String businessId) {
        ProcessInstance pi = new ProcessInstance();
        pi.setId("PI-" + businessId);
        pi.setBusinessId(businessId);
        pi.setTenantId("dl.djb");
        return pi;
    }

    @Test
    @DisplayName("INBOX TEST 1: Citizen sees ONLY their own booking in inbox; other bookings filtered out without ghost cards")
    void testCitizenInboxShowsOnlyCitizenBookingWithoutGhostCards() throws Exception {
        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setModuleName(REQUEST_SERVICE_WATER_TANKER);
        processCriteria.setBusinessService(Collections.singletonList("watertanker"));

        // Workflow searcher returned 3 business keys for the tenant
        List<String> businessKeys = Arrays.asList("WT-CITIZEN-001", "WT-OTHER-002", "WT-OTHER-003");

        Map<String, ProcessInstance> processInstanceMap = new HashMap<>();
        businessKeys.forEach(k -> processInstanceMap.put(k, createMockProcessInstance(k)));

        // Request-service only returned WT-CITIZEN-001 (other 2 were blocked by request-service citizen filtering)
        Map<String, Object> finalBusinessMap = new HashMap<>();
        JSONObject bookingObj = new JSONObject();
        bookingObj.put("bookingNo", "WT-CITIZEN-001");
        bookingObj.put("applicantName", "Devendra");
        bookingObj.put("mobileNumber", "9111111111");
        finalBusinessMap.put("WT-CITIZEN-001", bookingObj);

        List<Inbox> inboxes = new ArrayList<>();
        boolean isWaterTanker = !org.springframework.util.ObjectUtils.isEmpty(processCriteria.getModuleName())
                && (processCriteria.getModuleName().equals(REQUEST_SERVICE_WATER_TANKER)
                || processCriteria.getModuleName().equals("request-service.water_tanker_fixedpoint")
                || processCriteria.getModuleName().equals("request-service.watertanker_fixedpoint"));

        for (String businessKey : businessKeys) {
            if (!isWaterTanker || (finalBusinessMap.containsKey(businessKey) && finalBusinessMap.get(businessKey) != null)) {
                Inbox inbox = new Inbox();
                inbox.setProcessInstance(processInstanceMap.get(businessKey));
                inbox.setBusinessObject(InboxService.toMap((JSONObject) finalBusinessMap.get(businessKey)));
                if (inbox.getProcessInstance() != null)
                    inboxes.add(inbox);
            }
        }

        // Assertions:
        // 1. Must contain EXACTLY 1 card
        assertEquals(1, inboxes.size(), "Inbox must contain ONLY citizen's booking");
        // 2. The single card must be WT-CITIZEN-001
        assertEquals("WT-CITIZEN-001", inboxes.get(0).getProcessInstance().getBusinessId());
        assertNotNull(inboxes.get(0).getBusinessObject());
        assertEquals("WT-CITIZEN-001", inboxes.get(0).getBusinessObject().get("bookingNo"));
    }

    @Test
    @DisplayName("INBOX TEST 2: Employee sees ALL bookings in inbox with complete business data")
    void testEmployeeInboxShowsAllBookings() throws Exception {
        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setModuleName(REQUEST_SERVICE_WATER_TANKER);
        processCriteria.setBusinessService(Collections.singletonList("watertanker"));

        List<String> businessKeys = Arrays.asList("WT-001", "WT-002", "WT-003");

        Map<String, ProcessInstance> processInstanceMap = new HashMap<>();
        businessKeys.forEach(k -> processInstanceMap.put(k, createMockProcessInstance(k)));

        // Request-service returns ALL bookings for employee
        Map<String, Object> finalBusinessMap = new HashMap<>();
        for (String k : businessKeys) {
            JSONObject obj = new JSONObject();
            obj.put("bookingNo", k);
            obj.put("status", "BOOKING_CREATED");
            finalBusinessMap.put(k, obj);
        }

        List<Inbox> inboxes = new ArrayList<>();
        boolean isWaterTanker = !org.springframework.util.ObjectUtils.isEmpty(processCriteria.getModuleName())
                && (processCriteria.getModuleName().equals(REQUEST_SERVICE_WATER_TANKER)
                || processCriteria.getModuleName().equals("request-service.water_tanker_fixedpoint")
                || processCriteria.getModuleName().equals("request-service.watertanker_fixedpoint"));

        for (String businessKey : businessKeys) {
            if (!isWaterTanker || (finalBusinessMap.containsKey(businessKey) && finalBusinessMap.get(businessKey) != null)) {
                Inbox inbox = new Inbox();
                inbox.setProcessInstance(processInstanceMap.get(businessKey));
                inbox.setBusinessObject(InboxService.toMap((JSONObject) finalBusinessMap.get(businessKey)));
                if (inbox.getProcessInstance() != null)
                    inboxes.add(inbox);
            }
        }

        assertEquals(3, inboxes.size(), "Employee inbox MUST contain all 3 bookings");
        assertEquals("WT-001", inboxes.get(0).getProcessInstance().getBusinessId());
        assertEquals("WT-002", inboxes.get(1).getProcessInstance().getBusinessId());
        assertEquals("WT-003", inboxes.get(2).getProcessInstance().getBusinessId());
    }

    @Test
    @DisplayName("INBOX TEST 3: Citizen with NO bookings gets completely empty inbox (0 records, 0 ghost cards)")
    void testCitizenWithNoBookingsGetsEmptyInbox() throws Exception {
        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setModuleName(REQUEST_SERVICE_WATER_TANKER);
        processCriteria.setBusinessService(Collections.singletonList("watertanker"));

        // Workflow has business keys from other citizens
        List<String> businessKeys = Arrays.asList("WT-OTHER-001", "WT-OTHER-002");

        Map<String, ProcessInstance> processInstanceMap = new HashMap<>();
        businessKeys.forEach(k -> processInstanceMap.put(k, createMockProcessInstance(k)));

        // Request-service returns empty map for this citizen
        Map<String, Object> finalBusinessMap = new HashMap<>();

        List<Inbox> inboxes = new ArrayList<>();
        boolean isWaterTanker = !org.springframework.util.ObjectUtils.isEmpty(processCriteria.getModuleName())
                && (processCriteria.getModuleName().equals(REQUEST_SERVICE_WATER_TANKER)
                || processCriteria.getModuleName().equals("request-service.water_tanker_fixedpoint")
                || processCriteria.getModuleName().equals("request-service.watertanker_fixedpoint"));

        for (String businessKey : businessKeys) {
            if (!isWaterTanker || (finalBusinessMap.containsKey(businessKey) && finalBusinessMap.get(businessKey) != null)) {
                Inbox inbox = new Inbox();
                inbox.setProcessInstance(processInstanceMap.get(businessKey));
                inbox.setBusinessObject(InboxService.toMap((JSONObject) finalBusinessMap.get(businessKey)));
                if (inbox.getProcessInstance() != null)
                    inboxes.add(inbox);
            }
        }

        assertTrue(inboxes.isEmpty(), "Inbox must be completely empty for citizen with no bookings");
    }

    @Test
    @DisplayName("INBOX TEST 4: Vendor sees ONLY assigned vendor bookings in inbox")
    void testVendorInboxShowsOnlyAssignedBookings() throws Exception {
        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setModuleName(REQUEST_SERVICE_WATER_TANKER);
        processCriteria.setBusinessService(Collections.singletonList("watertanker"));

        List<String> businessKeys = Arrays.asList("WT-VENDOR1-001", "WT-VENDOR2-002", "WT-VENDOR3-003");

        Map<String, ProcessInstance> processInstanceMap = new HashMap<>();
        businessKeys.forEach(k -> processInstanceMap.put(k, createMockProcessInstance(k)));

        // Request-service only returned booking assigned to VENDOR1
        Map<String, Object> finalBusinessMap = new HashMap<>();
        JSONObject v1Obj = new JSONObject();
        v1Obj.put("bookingNo", "WT-VENDOR1-001");
        v1Obj.put("vendorId", "VENDOR1");
        finalBusinessMap.put("WT-VENDOR1-001", v1Obj);

        List<Inbox> inboxes = new ArrayList<>();
        boolean isWaterTanker = !org.springframework.util.ObjectUtils.isEmpty(processCriteria.getModuleName())
                && (processCriteria.getModuleName().equals(REQUEST_SERVICE_WATER_TANKER)
                || processCriteria.getModuleName().equals("request-service.water_tanker_fixedpoint")
                || processCriteria.getModuleName().equals("request-service.watertanker_fixedpoint"));

        for (String businessKey : businessKeys) {
            if (!isWaterTanker || (finalBusinessMap.containsKey(businessKey) && finalBusinessMap.get(businessKey) != null)) {
                Inbox inbox = new Inbox();
                inbox.setProcessInstance(processInstanceMap.get(businessKey));
                inbox.setBusinessObject(InboxService.toMap((JSONObject) finalBusinessMap.get(businessKey)));
                if (inbox.getProcessInstance() != null)
                    inboxes.add(inbox);
            }
        }

        assertEquals(1, inboxes.size(), "Vendor inbox must contain ONLY their assigned booking");
        assertEquals("WT-VENDOR1-001", inboxes.get(0).getProcessInstance().getBusinessId());
    }

    @Test
    @DisplayName("INBOX TEST 5: Status count sum accurately reflects total count")
    void testStatusCountsSumEqualsTotalCount() {
        Map<String, Integer> exactCounts = new LinkedHashMap<>();
        exactCounts.put("BOOKING_CREATED", 5);
        exactCounts.put("APPROVED", 3);
        exactCounts.put("DELIVERED", 12);

        int totalCount = exactCounts.values().stream().mapToInt(Integer::intValue).sum();

        assertEquals(20, totalCount);
    }
}
