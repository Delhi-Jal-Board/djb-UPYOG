package org.upyog.rs.service;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.repository.RequestServiceRepository;
import org.upyog.rs.repository.querybuilder.RequestServiceQueryBuilder;
import org.upyog.rs.repository.querybuilder.WaterTankerFixedPointQueryBuilder;
import org.upyog.rs.service.impl.WaterTankerServiceImpl;
import org.upyog.rs.util.VendorUtil;
import org.upyog.rs.web.models.waterTanker.WaterTankerBookingSearchCriteria;
import org.upyog.rs.web.models.waterTanker.WaterTankerFixedPointBookingSearchCriteria;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class WaterTankerUserRoleRestrictionTest {

    @InjectMocks
    private WaterTankerServiceImpl waterTankerService;

    @Mock
    private VendorUtil vendorUtil;

    @Mock
    private RequestServiceRepository requestServiceRepository;

    @Mock
    private EnrichmentService enrichmentService;

    private RequestServiceQueryBuilder queryBuilder;
    private WaterTankerFixedPointQueryBuilder fixedPointQueryBuilder;
    private RequestServiceConfiguration config;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        queryBuilder = new RequestServiceQueryBuilder();
        fixedPointQueryBuilder = new WaterTankerFixedPointQueryBuilder();
        config = new RequestServiceConfiguration();
        config.setIsUserProfileEnabled(false);
        config.setDefaultLimit(10);
        config.setDefaultOffset(0);
        config.setMaxSearchLimit(100);
        ReflectionTestUtils.setField(queryBuilder, "requestServiceConfiguration", config);
        ReflectionTestUtils.setField(fixedPointQueryBuilder, "config", config);
    }

    private RequestInfo createRequestInfo(String userType, List<String> roleCodes, String uuid, String mobileNumber) {
        List<Role> roles = new ArrayList<>();
        if (roleCodes != null) {
            for (String code : roleCodes) {
                roles.add(Role.builder().code(code).name(code).tenantId("dl.djb").build());
            }
        }
        User userInfo = User.builder()
                .id(101L)
                .uuid(uuid)
                .type(userType)
                .mobileNumber(mobileNumber)
                .roles(roles)
                .tenantId("dl.djb")
                .build();
        return RequestInfo.builder().userInfo(userInfo).build();
    }

    // ==========================================
    // POSITIVE TESTS
    // ==========================================

    @Test
    @DisplayName("POSITIVE 1: Employee Login sees ALL bookings without restriction")
    void testEmployeeLoginSeesAllBookings() {
        RequestInfo requestInfo = createRequestInfo("EMPLOYEE", Arrays.asList("EE", "WT_CEMP", "EMPLOYEE"), "emp-uuid-1", "9876543210");
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertNull(criteria.getCreatedBy(), "Employee should NOT have createdBy restriction");
        assertNull(criteria.getVendorIds(), "Employee should NOT have vendorIds restriction");

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertFalse(query.contains("ursbd.createdby IN"), "Employee query must NOT filter by createdby");
        assertFalse(query.contains("ursbd.vendor_id IN"), "Employee query must NOT filter by vendor_id");
        assertTrue(query.contains("ursbd.tenant_id LIKE ?"), "Employee query filters by tenant only");
        assertEquals("%dl.djb%", preparedStmtList.get(0));
    }

    @Test
    @DisplayName("POSITIVE 2: Citizen Login applies createdBy and mobileNumber restrictions")
    void testCitizenLoginAppliesRestrictions() {
        String citizenUuid = "citizen-uuid-1";
        String citizenMobile = "9111111111";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, citizenMobile);
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertNotNull(criteria.getCreatedBy(), "Citizen MUST have createdBy restriction");
        assertEquals(Collections.singletonList(citizenUuid), criteria.getCreatedBy());
        assertEquals(citizenMobile, criteria.getMobileNumber());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ursbd.createdby IN (?)"), "Citizen query MUST filter by createdby");
        assertTrue(query.contains("ursbd.applicant_uuid IN (?)"), "Citizen query MUST filter by applicant_uuid");
        assertTrue(query.contains("ursbd.mobile_number LIKE ?"), "Citizen query MUST filter by mobile_number");
        assertTrue(preparedStmtList.contains(citizenUuid));
        assertTrue(preparedStmtList.contains("%" + citizenMobile + "%"));
    }

    @Test
    @DisplayName("POSITIVE 3: Citizen searching specific bookingNo combines bookingNo and citizen filter")
    void testCitizenSearchSpecificBookingNo() {
        String citizenUuid = "citizen-uuid-1";
        String citizenMobile = "9111111111";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, citizenMobile);
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .bookingNo("WT-2026-001")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        // Both citizen filter AND booking_no IN (?) must be present
        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(query.contains("ursbd.booking_no IN (?)"));
        assertTrue(preparedStmtList.contains("WT-2026-001"));
    }

    @Test
    @DisplayName("POSITIVE 4: Vendor with mapped vendorId is granted access to both self-created and vendor bookings")
    void testVendorLoginRestrictedToVendorId() {
        String vendorUuid = "vendor-uuid-1";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("WT_VENDOR"), vendorUuid, "9333333333");

        Map<String, Object> mockVendorEntity = new HashMap<>();
        mockVendorEntity.put("id", "VENDOR-001");
        Map<String, Object> mockVendorResponse = new HashMap<>();
        mockVendorResponse.put("vendor", Collections.singletonList(mockVendorEntity));

        when(vendorUtil.searchVendorByOwnerId(any(), eq("dl.djb"), eq(vendorUuid)))
                .thenReturn(mockVendorResponse);

        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertEquals(Collections.singletonList("VENDOR-001"), criteria.getVendorIds());
        assertEquals(Collections.singletonList(vendorUuid), criteria.getCreatedBy());
        assertEquals("9333333333", criteria.getMobileNumber());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(query.contains("ursbd.vendor_id IN (?)"));
        assertTrue(preparedStmtList.contains("VENDOR-001"));
        assertTrue(preparedStmtList.contains(vendorUuid));
    }

    @Test
    @DisplayName("POSITIVE 5: Driver assigned trips search preserves driverId without citizen restriction")
    void testDriverLoginPreservesDriverSearch() {
        RequestInfo requestInfo = createRequestInfo("EMPLOYEE", Collections.singletonList("WT_DRIVER"), "driver-uuid-1", "9555555555");
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .driverId("driver-uuid-1")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertNull(criteria.getCreatedBy());
        assertNull(criteria.getVendorIds());
        assertEquals("driver-uuid-1", criteria.getDriverId());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ursbd.driver_id = ?"));
        assertFalse(query.contains("ursbd.createdby IN"));
    }

    @Test
    @DisplayName("POSITIVE 6: Fixed Point citizen booking filters by createdby and mobileNumber")
    void testCitizenFixedPointRestrictions() {
        String citizenUuid = "citizen-fp-uuid";
        String citizenMobile = "9222222222";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, citizenMobile);
        WaterTankerFixedPointBookingSearchCriteria criteria = new WaterTankerFixedPointBookingSearchCriteria();
        criteria.setTenantId("dl.djb");

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictionsForFixedPoint", requestInfo, criteria);

        assertEquals(Collections.singletonList(citizenUuid), criteria.getCreatedBy());
        assertEquals(citizenMobile, criteria.getMobileNumber());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = fixedPointQueryBuilder.getWaterTankerFixedPointQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ad.createdby IN (?)"));
        assertTrue(query.contains("ad.mobile_number = ?"));
    }

    @Test
    @DisplayName("POSITIVE 7: Fixed Point employee booking has no createdby restriction")
    void testEmployeeFixedPointSeesAll() {
        RequestInfo requestInfo = createRequestInfo("EMPLOYEE", Collections.singletonList("EMPLOYEE"), "emp-uuid", "9876543210");
        WaterTankerFixedPointBookingSearchCriteria criteria = new WaterTankerFixedPointBookingSearchCriteria();
        criteria.setTenantId("dl.djb");

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictionsForFixedPoint", requestInfo, criteria);

        assertNull(criteria.getCreatedBy());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = fixedPointQueryBuilder.getWaterTankerFixedPointQuery(criteria, preparedStmtList);

        assertFalse(query.contains("ad.createdby IN"));
    }

    @Test
    @DisplayName("POSITIVE 8: Employee searching by customer mobile and bookingNo works without citizen restriction")
    void testEmployeeSearchByCustomerMobileAndBookingNo() {
        RequestInfo requestInfo = createRequestInfo("EMPLOYEE", Collections.singletonList("EMPLOYEE"), "emp-uuid-1", "9876543210");
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .mobileNumber("9111111111")
                .bookingNo("WT-2026-1234")
                .localityCode("LOC-01")
                .status("APPROVED")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        // Employee criteria must NOT be restricted to their own UUID
        assertNull(criteria.getCreatedBy());
        assertEquals("9111111111", criteria.getMobileNumber());
        assertEquals("WT-2026-1234", criteria.getBookingNo());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertFalse(query.contains("ursbd.createdby IN"));
        assertTrue(query.contains("ursbd.booking_no IN (?)"));
        assertTrue(query.contains("ursbd.mobile_number LIKE ?"));
        assertTrue(query.contains("ursbd.locality_code = ?"));
        assertTrue(preparedStmtList.contains("WT-2026-1234"));
        assertTrue(preparedStmtList.contains("%9111111111%"));
        assertTrue(preparedStmtList.contains("LOC-01"));
    }

    @Test
    @DisplayName("POSITIVE 9: Citizen with WT_VENDOR role searches newly created booking (vendor_id IS NULL) by bookingNo")
    void testCitizenWithVendorRoleCanSearchSelfCreatedBookingBeforeVendorAssignment() {
        String userUuid = "d17bed15-45eb-450f-b55c-71f7b542557a";
        String userMobile = "8787874576";
        String bookingNo = "WT-DJB-002245";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Arrays.asList("WT_VENDOR", "CITIZEN"), userUuid, userMobile);

        Map<String, Object> mockVendorEntity = new HashMap<>();
        mockVendorEntity.put("id", "VENDOR-DEV-001");
        Map<String, Object> mockVendorResponse = new HashMap<>();
        mockVendorResponse.put("vendor", Collections.singletonList(mockVendorEntity));

        when(vendorUtil.searchVendorByOwnerId(any(), eq("dl.djb"), eq(userUuid))).thenReturn(mockVendorResponse);

        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .bookingNo(bookingNo)
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertEquals(Collections.singletonList(userUuid), criteria.getCreatedBy());
        assertEquals(userMobile, criteria.getMobileNumber());
        assertEquals(Collections.singletonList("VENDOR-DEV-001"), criteria.getVendorIds());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        // Security check: Must have ownership clause containing createdby, applicant_uuid, mobile_number, OR vendor_id
        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(query.contains("ursbd.applicant_uuid IN (?)"));
        assertTrue(query.contains("ursbd.mobile_number LIKE ?"));
        assertTrue(query.contains("ursbd.vendor_id IN (?)"));
        // And AND booking_no IN (?)
        assertTrue(query.contains("ursbd.booking_no IN (?)"));

        // Prepared statements check
        assertTrue(preparedStmtList.contains(userUuid));
        assertTrue(preparedStmtList.contains("%" + userMobile + "%"));
        assertTrue(preparedStmtList.contains("VENDOR-DEV-001"));
        assertTrue(preparedStmtList.contains(bookingNo));

        // CRUCIAL: Standalone "AND ursbd.vendor_id IN" must NOT be present outside the OR clause
        // Because that would filter out bookings where vendor_id is NULL!
        int vendorIdOccurrences = (query.split("ursbd\\.vendor_id IN", -1).length) - 1;
        assertEquals(1, vendorIdOccurrences, "ursbd.vendor_id IN must appear exactly once inside the ownership OR clause, not as a standalone AND filter");
    }

    // ==========================================
    // NEGATIVE TESTS & EDGE CASES
    // ==========================================

    @Test
    @DisplayName("NEGATIVE 1: Citizen searching for someone else's booking cannot bypass citizen filter")
    void testCitizenCannotAccessOtherCitizenBooking() {
        String citizenUuid = "attacker-citizen-uuid";
        String citizenMobile = "9111111111";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, citizenMobile);

        // Attacker passes victim's bookingNo
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .bookingNo("WT-VICTIM-BOOKING-999")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        // Security check: The query MUST enforce that the booking must BOTH match the booking_no AND belong to the attacker
        assertTrue(query.contains("ursbd.booking_no IN (?)"));
        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(query.contains("ursbd.applicant_uuid IN (?)"));
        assertTrue(query.contains("ursbd.mobile_number LIKE ?"));

        // Prepared statements must bind victim's booking number AND attacker's uuid/mobile
        assertTrue(preparedStmtList.contains("WT-VICTIM-BOOKING-999"));
        assertTrue(preparedStmtList.contains(citizenUuid));
        assertTrue(preparedStmtList.contains("%" + citizenMobile + "%"));
    }

    @Test
    @DisplayName("NEGATIVE 2: Citizen with null mobileNumber in profile does not crash and filters by createdBy")
    void testCitizenWithNullMobileDoesNotCrash() {
        String citizenUuid = "citizen-no-mobile-uuid";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, null);
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .build();

        assertDoesNotThrow(() -> {
            ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);
        });

        assertEquals(Collections.singletonList(citizenUuid), criteria.getCreatedBy());
        assertNull(criteria.getMobileNumber());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ursbd.createdby IN (?) OR ursbd.applicant_uuid IN (?)"));
        assertFalse(query.contains("ursbd.mobile_number LIKE ?"), "Should not filter by mobile if null");
    }

    @Test
    @DisplayName("NEGATIVE 3: Vendor without any vendor profile can still search their own created bookings")
    void testUnmappedVendorReturnsZeroBookings() {
        String vendorUuid = "unmapped-vendor-uuid";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("WT_VENDOR"), vendorUuid, "9444444444");

        when(vendorUtil.searchVendorByOwnerId(any(), eq("dl.djb"), eq(vendorUuid))).thenReturn(null);

        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertEquals(Collections.singletonList(vendorUuid), criteria.getCreatedBy());
        assertEquals("9444444444", criteria.getMobileNumber());
        assertNull(criteria.getVendorIds());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(preparedStmtList.contains(vendorUuid));
        assertTrue(preparedStmtList.contains("%9444444444%"));
    }

    @Test
    @DisplayName("NEGATIVE 4: Citizen cannot spoof another mobile number in search criteria")
    void testCitizenCannotSpoofAnotherMobileNumber() {
        String citizenUuid = "citizen-uuid-attacker";
        String attackerMobile = "9111111111";
        String victimMobile = "9999999999";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Collections.singletonList("CITIZEN"), citizenUuid, attackerMobile);

        // Attacker tries to pass victim's mobile number in search criteria
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .mobileNumber(victimMobile)
                .build();

        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        // Crucial security assertion: mobileNumber MUST be overwritten with attacker's registered mobile number
        assertEquals(attackerMobile, criteria.getMobileNumber(), "Must enforce citizen's own registered mobile number");
        assertNotEquals(victimMobile, criteria.getMobileNumber(), "Must NOT allow spoofing another mobile number");

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(preparedStmtList.contains("%" + attackerMobile + "%"));
        assertFalse(preparedStmtList.contains("%" + victimMobile + "%"));
    }

    @Test
    @DisplayName("EDGE 1: Null RequestInfo is handled safely without NullPointerException")
    void testNullRequestInfoHandledSafely() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder().tenantId("dl.djb").build();
        assertDoesNotThrow(() -> {
            ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", null, criteria);
        });
        assertNull(criteria.getCreatedBy());
    }

    @Test
    @DisplayName("EDGE 2: RequestInfo with null UserInfo is handled safely")
    void testNullUserInfoHandledSafely() {
        RequestInfo requestInfo = RequestInfo.builder().userInfo(null).build();
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder().tenantId("dl.djb").build();
        assertDoesNotThrow(() -> {
            ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);
        });
        assertNull(criteria.getCreatedBy());
    }

    @Test
    @DisplayName("EDGE 3: Vendor with type CITIZEN and role WT_VENDOR can access both self-created and vendor bookings")
    void testVendorWithTypeCitizenIsTreatedAsVendor() {
        String vendorUuid = "vendor-citizen-type-uuid";
        RequestInfo requestInfo = createRequestInfo("CITIZEN", Arrays.asList("CITIZEN", "WT_VENDOR"), vendorUuid, "9666666666");

        Map<String, Object> mockVendorEntity = new HashMap<>();
        mockVendorEntity.put("id", "VENDOR-002");
        Map<String, Object> mockVendorResponse = new HashMap<>();
        mockVendorResponse.put("vendor", Collections.singletonList(mockVendorEntity));

        when(vendorUtil.searchVendorByOwnerId(any(), eq("dl.djb"), eq(vendorUuid))).thenReturn(mockVendorResponse);

        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder().tenantId("dl.djb").build();
        ReflectionTestUtils.invokeMethod(waterTankerService, "applyUserRoleRestrictions", requestInfo, criteria);

        assertEquals(Collections.singletonList("VENDOR-002"), criteria.getVendorIds());
        assertEquals(Collections.singletonList(vendorUuid), criteria.getCreatedBy());
        assertEquals("9666666666", criteria.getMobileNumber());

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);
        assertTrue(query.contains("ursbd.createdby IN (?)"));
        assertTrue(query.contains("ursbd.vendor_id IN (?)"));
    }

    @Test
    @DisplayName("VERIFICATION 1: Total Count query applies citizen createdBy & mobileNumber consistently")
    void testTotalCountQueryAppliesCitizenRestrictions() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .createdBy(Collections.singletonList("citizen-uuid-1"))
                .mobileNumber("9111111111")
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String countQuery = queryBuilder.getWaterTankerTotalCountQuery(criteria, preparedStmtList);

        assertTrue(countQuery.contains("ursbd.createdby IN (?)"));
        assertTrue(countQuery.contains("ursbd.applicant_uuid IN (?)"));
        assertTrue(countQuery.contains("ursbd.mobile_number LIKE ?"));
        assertTrue(preparedStmtList.contains("citizen-uuid-1"));
        assertTrue(preparedStmtList.contains("%9111111111%"));
    }

    @Test
    @DisplayName("VERIFICATION 2: Status Count query applies citizen createdBy & mobileNumber consistently")
    void testStatusCountQueryAppliesCitizenRestrictions() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .createdBy(Collections.singletonList("citizen-uuid-1"))
                .mobileNumber("9111111111")
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String statusCountQuery = queryBuilder.getWaterTankerStatusCountQuery(criteria, preparedStmtList);

        assertTrue(statusCountQuery.contains("ursbd.createdby IN (?)"));
        assertTrue(statusCountQuery.contains("ursbd.applicant_uuid IN (?)"));
        assertTrue(statusCountQuery.contains("ursbd.mobile_number LIKE ?"));
        assertTrue(preparedStmtList.contains("citizen-uuid-1"));
        assertTrue(preparedStmtList.contains("%9111111111%"));
    }

    @Test
    @DisplayName("VERIFICATION 3: Total Count query applies vendor restrictions consistently")
    void testTotalCountQueryAppliesVendorRestrictions() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .vendorIds(Collections.singletonList("VENDOR-001"))
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String countQuery = queryBuilder.getWaterTankerTotalCountQuery(criteria, preparedStmtList);

        assertTrue(countQuery.contains("ursbd.vendor_id IN (?)"));
        assertTrue(preparedStmtList.contains("VENDOR-001"));
    }
}
