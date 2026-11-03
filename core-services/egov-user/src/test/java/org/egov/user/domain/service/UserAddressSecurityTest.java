package org.egov.user.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.egov.user.domain.model.Address;
import org.egov.user.domain.model.AddressSearchCriteria;
import org.egov.user.domain.model.enums.AddressType;
import org.egov.user.domain.service.utils.EncryptionDecryptionUtil;
import org.egov.user.persistence.repository.AddressRepository;
import org.egov.user.persistence.repository.FileStoreRepository;
import org.egov.user.persistence.repository.OtpRepository;
import org.egov.user.persistence.repository.RoleRepository;
import org.egov.user.persistence.repository.UserRepository;
import org.egov.user.web.contract.AddressRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserAddressSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private FileStoreRepository fileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AddressRepository addressRepository;

    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        userService = new UserService(
                userRepository,
                otpRepository,
                fileRepository,
                passwordEncoder,
                encryptionDecryptionUtil,
                90,
                false,
                false,
                roleRepository,
                "^[a-zA-Z0-9@#$]*$",
                32,
                4,
                addressRepository
        );
    }

    private RequestInfo createRequestInfo(Long userId, String uuid, String type) {
        User authUser = User.builder()
                .id(userId)
                .uuid(uuid)
                .type(type)
                .build();
        return RequestInfo.builder()
                .userInfo(authUser)
                .build();
    }

    private Address buildTestAddress(Long id, Long userId) {
        return Address.builder()
                .id(id)
                .userId(userId)
                .tenantId("delhi")
                .city("Delhi")
                .pinCode("110001")
                .address("Connaught Place")
                .type(AddressType.OTHER)
                .build();
    }

    // =========================================================================
    // 1. CREATE ADDRESS TESTS
    // =========================================================================

    @Test
    @DisplayName("CreateAddress: Citizen creating address for self should succeed")
    public void testCreateAddress_CitizenSelf_ShouldSucceed() {
        String citizenUuid = "citizen-uuid-101";
        Long citizenId = 101L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(null, citizenId);

        when(userRepository.getUserIdByUuid(citizenUuid)).thenReturn(citizenId);
        when(addressRepository.createAddressV2(any(Address.class), eq(citizenId), eq("delhi"))).thenReturn(address);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(address);

        Address result = userService.createAddress(citizenUuid, address, requestInfo);

        assertNotNull(result);
        assertEquals(citizenId, address.getUserId());
        verify(addressRepository, times(1)).createAddressV2(any(Address.class), eq(citizenId), eq("delhi"));
    }

    @Test
    @DisplayName("CreateAddress: Citizen attempting to create address for different userUuid should throw ACCESS_DENIED")
    public void testCreateAddress_CitizenDifferentUuid_ShouldThrowAccessDenied() {
        String citizenUuid = "citizen-uuid-101";
        String victimUuid = "victim-uuid-202";
        Long citizenId = 101L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(null, citizenId);

        CustomException ex = assertThrows(CustomException.class, () -> {
            userService.createAddress(victimUuid, address, requestInfo);
        });

        assertEquals("ACCESS_DENIED", ex.getCode());
        verify(addressRepository, never()).createAddressV2(any(), any(), any());
    }

    @Test
    @DisplayName("CreateAddress: Citizen attempting to assign address to different userId should throw ACCESS_DENIED")
    public void testCreateAddress_CitizenDifferentUserId_ShouldThrowAccessDenied() {
        String citizenUuid = "citizen-uuid-101";
        Long citizenId = 101L;
        Long victimId = 202L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(null, victimId); // Attacking different userId

        CustomException ex = assertThrows(CustomException.class, () -> {
            userService.createAddress(citizenUuid, address, requestInfo);
        });

        assertEquals("ACCESS_DENIED", ex.getCode());
        verify(addressRepository, never()).createAddressV2(any(), any(), any());
    }

    @Test
    @DisplayName("CreateAddress: Employee creating address for a citizen should bypass check and succeed")
    public void testCreateAddress_EmployeeAssistingCitizen_ShouldBypassAndSucceed() {
        Long employeeId = 50L;
        String employeeUuid = "emp-uuid-50";
        RequestInfo requestInfo = createRequestInfo(employeeId, employeeUuid, "EMPLOYEE");

        String citizenUuid = "citizen-uuid-101";
        Long citizenId = 101L;
        Address address = buildTestAddress(null, citizenId);

        when(userRepository.getUserIdByUuid(citizenUuid)).thenReturn(citizenId);
        when(addressRepository.createAddressV2(any(Address.class), eq(citizenId), eq("delhi"))).thenReturn(address);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(address);

        // Employee calls createAddress for citizenUuid
        Address result = userService.createAddress(citizenUuid, address, requestInfo);

        assertNotNull(result);
        verify(addressRepository, times(1)).createAddressV2(any(Address.class), eq(citizenId), eq("delhi"));
    }

    @Test
    @DisplayName("CreateAddress: Call with null RequestInfo (legacy/internal service) should succeed without IDOR error")
    public void testCreateAddress_NullRequestInfo_ShouldSucceed() {
        String userUuid = "user-uuid-101";
        Long userId = 101L;
        Address address = buildTestAddress(null, userId);

        when(userRepository.getUserIdByUuid(userUuid)).thenReturn(userId);
        when(addressRepository.createAddressV2(any(Address.class), eq(userId), eq("delhi"))).thenReturn(address);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(address);

        // Calling overloaded 2-arg method
        Address result = userService.createAddress(userUuid, address);

        assertNotNull(result);
        verify(addressRepository, times(1)).createAddressV2(any(Address.class), eq(userId), eq("delhi"));
    }

    // =========================================================================
    // 2. UPDATE ADDRESS TESTS
    // =========================================================================

    @Test
    @DisplayName("UpdateAddress: Citizen updating own address should succeed")
    public void testUpdateAddress_CitizenSelf_ShouldSucceed() {
        Long citizenId = 101L;
        String citizenUuid = "citizen-uuid-101";
        Long addressId = 501L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(addressId, citizenId);

        Address existingAddressInDb = buildTestAddress(addressId, citizenId);

        when(addressRepository.getAddressV2(any(AddressSearchCriteria.class)))
                .thenReturn(Collections.singletonList(existingAddressInDb));
        when(addressRepository.createAddressV2(any(Address.class), eq(citizenId), eq("delhi")))
                .thenReturn(address);

        Address result = userService.updateAddress(address, requestInfo);

        assertNotNull(result);
        verify(addressRepository, times(1)).updateAddressV2(eq(addressId), eq(citizenId), anyString());
        verify(addressRepository, times(1)).createAddressV2(any(Address.class), eq(citizenId), eq("delhi"));
    }

    @Test
    @DisplayName("UpdateAddress: Citizen attempting to update with mismatched payload userId should throw ACCESS_DENIED")
    public void testUpdateAddress_CitizenMismatchedUserId_ShouldThrowAccessDenied() {
        Long citizenId = 101L;
        String citizenUuid = "citizen-uuid-101";
        Long victimId = 202L;
        Long addressId = 501L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(addressId, victimId);

        CustomException ex = assertThrows(CustomException.class, () -> {
            userService.updateAddress(address, requestInfo);
        });

        assertEquals("ACCESS_DENIED", ex.getCode());
        verify(addressRepository, never()).updateAddressV2(any(), any(), any());
    }

    @Test
    @DisplayName("UpdateAddress: Citizen attempting to update address owned by another user in DB should throw ACCESS_DENIED")
    public void testUpdateAddress_CitizenTargetingVictimAddressIdInDb_ShouldThrowAccessDenied() {
        Long citizenId = 101L;
        String citizenUuid = "citizen-uuid-101";
        Long victimId = 999L;
        Long victimAddressId = 777L;
        RequestInfo requestInfo = createRequestInfo(citizenId, citizenUuid, "CITIZEN");
        Address address = buildTestAddress(victimAddressId, citizenId);

        Address victimExistingAddressInDb = buildTestAddress(victimAddressId, victimId);

        when(addressRepository.getAddressV2(any(AddressSearchCriteria.class)))
                .thenReturn(Collections.singletonList(victimExistingAddressInDb));

        CustomException ex = assertThrows(CustomException.class, () -> {
            userService.updateAddress(address, requestInfo);
        });

        assertEquals("ACCESS_DENIED", ex.getCode());
        verify(addressRepository, never()).updateAddressV2(any(), any(), any());
    }

    @Test
    @DisplayName("UpdateAddress: Employee updating citizen address should bypass check and succeed")
    public void testUpdateAddress_Employee_ShouldBypassAndSucceed() {
        Long employeeId = 50L;
        String employeeUuid = "emp-uuid-50";
        RequestInfo requestInfo = createRequestInfo(employeeId, employeeUuid, "EMPLOYEE");

        Long citizenId = 101L;
        Long addressId = 501L;
        Address address = buildTestAddress(addressId, citizenId);
        Address existingAddressInDb = buildTestAddress(addressId, citizenId);

        when(addressRepository.getAddressV2(any(AddressSearchCriteria.class)))
                .thenReturn(Collections.singletonList(existingAddressInDb));
        when(addressRepository.createAddressV2(any(Address.class), eq(citizenId), eq("delhi")))
                .thenReturn(address);

        Address result = userService.updateAddress(address, requestInfo);

        assertNotNull(result);
        verify(addressRepository, times(1)).updateAddressV2(eq(addressId), eq(citizenId), anyString());
    }

    @Test
    @DisplayName("UpdateAddress: Call with null RequestInfo (legacy/internal service) should succeed without IDOR error")
    public void testUpdateAddress_NullRequestInfo_ShouldSucceed() {
        Long userId = 101L;
        Long addressId = 501L;
        Address address = buildTestAddress(addressId, userId);
        Address existingAddressInDb = buildTestAddress(addressId, userId);

        when(addressRepository.getAddressV2(any(AddressSearchCriteria.class)))
                .thenReturn(Collections.singletonList(existingAddressInDb));
        when(addressRepository.createAddressV2(any(Address.class), eq(userId), eq("delhi")))
                .thenReturn(address);

        Address result = userService.updateAddress(address);

        assertNotNull(result);
        verify(addressRepository, times(1)).updateAddressV2(eq(addressId), eq(userId), anyString());
    }

    // =========================================================================
    // 3. JSON DESERIALIZATION TESTS (Case Invariance)
    // =========================================================================

    @Test
    @DisplayName("AddressRequest: Should successfully deserialize both 'RequestInfo' and 'requestInfo'")
    public void testAddressRequest_JsonAliasDeserialization() throws Exception {
        // PascalCase test
        String jsonPascal = "{\n" +
                "  \"RequestInfo\": {\n" +
                "    \"apiId\": \"Rainmaker\",\n" +
                "    \"ver\": \".01\",\n" +
                "    \"userInfo\": {\n" +
                "      \"id\": 101,\n" +
                "      \"uuid\": \"cit-101\",\n" +
                "      \"type\": \"CITIZEN\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"address\": {\n" +
                "    \"city\": \"Delhi\",\n" +
                "    \"tenantId\": \"delhi\"\n" +
                "  }\n" +
                "}";

        AddressRequest req1 = objectMapper.readValue(jsonPascal, AddressRequest.class);
        assertNotNull(req1.getRequestInfo());
        assertEquals("Rainmaker", req1.getRequestInfo().getApiId());
        assertEquals(101L, req1.getRequestInfo().getUserInfo().getId());

        // camelCase test
        String jsonCamel = "{\n" +
                "  \"requestInfo\": {\n" +
                "    \"apiId\": \"Rainmaker\",\n" +
                "    \"ver\": \".01\",\n" +
                "    \"userInfo\": {\n" +
                "      \"id\": 101,\n" +
                "      \"uuid\": \"cit-101\",\n" +
                "      \"type\": \"CITIZEN\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"address\": {\n" +
                "    \"city\": \"Delhi\",\n" +
                "    \"tenantId\": \"delhi\"\n" +
                "  }\n" +
                "}";

        AddressRequest req2 = objectMapper.readValue(jsonCamel, AddressRequest.class);
        assertNotNull(req2.getRequestInfo());
        assertEquals("Rainmaker", req2.getRequestInfo().getApiId());
        assertEquals(101L, req2.getRequestInfo().getUserInfo().getId());
    }
}

