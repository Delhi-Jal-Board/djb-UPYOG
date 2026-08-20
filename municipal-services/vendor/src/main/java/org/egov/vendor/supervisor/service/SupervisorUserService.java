package org.egov.vendor.supervisor.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.Calendar;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.repository.ServiceRequestRepository;
import org.egov.vendor.service.ModuleRoleService;
import org.egov.vendor.supervisor.web.model.Supervisor;
import org.egov.vendor.supervisor.web.model.SupervisorRequest;
import org.egov.vendor.supervisor.web.model.SupervisorSearchCriteria;
import org.egov.vendor.util.VendorConstants;
import org.egov.vendor.util.VendorErrorConstants;
import org.egov.vendor.web.model.user.ModuleRoleMapping;
import org.egov.vendor.web.model.user.ModuleRoleMapping.MappingType;
import org.egov.vendor.web.model.user.User;
import org.egov.vendor.web.model.user.UserDetailResponse;
import org.egov.vendor.web.model.user.UserRequest;
import org.egov.vendor.web.model.user.UserSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SupervisorUserService {

    @Autowired private VendorConfiguration config;
    @Autowired private ServiceRequestRepository serviceRequestRepository;
    @Autowired private ObjectMapper mapper;
    @Autowired private ModuleRoleService moduleRoleService;   // ← injected

    // ── Public entry points ───────────────────────────────────────────────────

    public void manageSupervisors(SupervisorRequest request, boolean isCreate) {
        User ownerInfo = request.getSupervisor().getOwner();
        RequestInfo requestInfo = request.getRequestInfo();
        HashMap<String, String> errorMap = new HashMap<>();

        if (ownerInfo == null || StringUtils.isEmpty(ownerInfo.getMobileNumber())) {
            throw new CustomException(VendorErrorConstants.INVALID_DRIVER_ERROR,
                    "MobileNo is mandatory for Supervisor");
        }

        // Resolve role from MDMS once at the top — passed down to all sub-methods
        ModuleRoleMapping roleMapping = moduleRoleService
                .getModuleRoleMapping(request, MappingType.SUPERVISOR);
        String roleCode = roleMapping.getRoleCode();
        String roleName = roleMapping.getRoleName();

        handleMobileNumberFlow(ownerInfo, requestInfo, errorMap, request, isCreate, roleCode, roleName, roleMapping);

        if (!errorMap.isEmpty()) throw new CustomException(errorMap);
    }

    public UserDetailResponse getUsers(List<String> ownerIds, String tenantId, RequestInfo requestInfo) {
        UserSearchRequest search = new UserSearchRequest();
        search.setRequestInfo(requestInfo);
        search.setUuid(ownerIds);
        search.setTenantId(tenantId.split("\\.")[0]);
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
        return ownerCall(search, uri);
    }

    public UserDetailResponse getOwner(SupervisorSearchCriteria criteria, RequestInfo requestInfo) {
        UserSearchRequest search = new UserSearchRequest();
        search.setRequestInfo(requestInfo);
        search.setTenantId(criteria.getTenantId().split("\\.")[0]);
        search.setMobileNumber(criteria.getMobileNumber());
        search.setActive(true);
        if (!CollectionUtils.isEmpty(criteria.getOwnerIds()))
            search.setUuid(criteria.getOwnerIds());
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
        return ownerCall(search, uri);
    }

    public Boolean isRoleAvailable(User user, String roleCode, String tenantId) {
        Map<String, List<String>> tenantRoles = new HashMap<>();
        user.getRoles().forEach(r ->
                tenantRoles.computeIfAbsent(r.getTenantId(), k -> new LinkedList<>()).add(r.getCode()));
        List<String> roles = tenantRoles.get(tenantId.split("\\.")[0]);
        return !CollectionUtils.isEmpty(roles) && roles.contains(roleCode);
    }

    // ── Private flow ─────────────────────────────────────────────────────────

    private void handleMobileNumberFlow(User ownerInfo, RequestInfo requestInfo,
                                        HashMap<String, String> errorMap, SupervisorRequest request,
                                        boolean isCreate, String roleCode, String roleName, ModuleRoleMapping roleMapping) {

        UserDetailResponse existing = userExists(ownerInfo);
        User found = null;

        if (existing != null && !CollectionUtils.isEmpty(existing.getUser())) {

            for (User u : existing.getUser()) {
                String existingUuid = request.getSupervisor().getOwner().getUuid();
                if (u.getMobileNumber().equals(ownerInfo.getMobileNumber())
                        && !u.getUuid().equals(existingUuid == null ? "" : existingUuid)) {
                    u.getRoles().forEach(r -> {
                        if (roleMapping.getRoleCode().equals(r.getCode())) {
                            errorMap.put(VendorErrorConstants.MOBILE_NUMBER_ALREADY_EXIST,
                                    "Supervisor with the same mobile number already exists");
                        }
                    });
                    if (!errorMap.isEmpty()) throw new CustomException(errorMap);
                }
                // use roleMapping.getRoleCode() from MDMS
                if (Boolean.TRUE.equals(isRoleAvailable(u, roleMapping.getRoleCode(),
                        request.getSupervisor().getTenantId()))) {
                    found = u;
                }
            }

            if (found == null)
                found = addRoleToExistingUser(existing.getUser().get(0), ownerInfo, requestInfo, errorMap, roleCode, roleName, roleMapping);
            else {

                found = updateUserDetails(ownerInfo, requestInfo, errorMap, request.getSupervisor().getStatus());
            }
        } else if (isCreate) {
            found = createUser(ownerInfo, requestInfo, roleCode, roleName, roleMapping);
        } else {

            found = updateUserDetails(ownerInfo, requestInfo, errorMap,request.getSupervisor().getStatus());
        }

        if (found != null) request.getSupervisor().setOwner(found);
    }

    private User createUser(User owner, RequestInfo requestInfo, String roleCode, String roleName, ModuleRoleMapping roleMapping) {
        if (!isUserValid(owner)) {
            throw new CustomException(VendorErrorConstants.INVALID_DRIVER_ERROR,
                    "Name, dob, gender, relationship and fatherOrHusbandName are mandatory for Supervisor");
        }

        // Create the primary role from MDMS (EKYC_SUPERVISOR)
        Role role = getRoleObj(roleMapping.getRoleCode(), roleMapping.getRoleName());

        // CREATE the CITIZEN role
        Role citizenRole = getRoleObj("CITIZEN", "Citizen");

        // Add BOTH roles
        List<Role> roles = new ArrayList<>();
        roles.add(role);
        roles.add(citizenRole);
        owner.setRoles(roles);

        owner.setActive(true);
        owner.setType(VendorConstants.CITIZEN);
        owner.setUserName(owner.getMobileNumber());
        owner.setUuid(UUID.randomUUID().toString());

        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath())
                .append(config.getUserCreateEndpoint());

        UserDetailResponse response = userCall(new UserRequest(requestInfo, owner), uri);
        log.info("Supervisor user created with roles {}, CITIZEN: {}", roleCode, response.getUser().get(0).getUuid());
        return response.getUser().get(0);
    }

    private User addRoleToExistingUser(User existing, User requestOwner, RequestInfo requestInfo,
                                       HashMap<String, String> errorMap, String roleCode, String roleName, ModuleRoleMapping roleMapping) {

        // Carry forward fields from the current request — do not lose them
        mergeOwnerFields(existing, requestOwner);

        // Add the MDMS role (EKYC_SUPERVISOR)
        existing.getRoles().add(getRoleObj(roleMapping.getRoleCode(), roleMapping.getRoleName()));

        // Also add CITIZEN role if not already present
        boolean hasCitizen = existing.getRoles().stream()
                .anyMatch(r -> "CITIZEN".equals(r.getCode()));
        if (!hasCitizen) {
            existing.getRoles().add(getRoleObj("CITIZEN", "Citizen"));
        }

        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserUpdateEndpoint());
        UserDetailResponse response = ownerCall(
                UserRequest.builder().user(existing).requestInfo(requestInfo).build(), uri);
        if (response != null && !CollectionUtils.isEmpty(response.getUser()))
            return response.getUser().get(0);
        errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR, "Unable to add Supervisor roles to existing user");
        return null;
    }

    private void mergeOwnerFields(User existing, User requestOwner) {
        if (requestOwner == null) return;
        if (StringUtils.hasLength(requestOwner.getCorrespondenceAddress()))
            existing.setCorrespondenceAddress(requestOwner.getCorrespondenceAddress());
        if (StringUtils.hasLength(requestOwner.getCorrespondenceCity()))
            existing.setCorrespondenceCity(requestOwner.getCorrespondenceCity());
        if (StringUtils.hasLength(requestOwner.getCorrespondencePincode()))
            existing.setCorrespondencePincode(requestOwner.getCorrespondencePincode());
        if (StringUtils.hasLength(requestOwner.getPermanentAddress()))
            existing.setPermanentAddress(requestOwner.getPermanentAddress());
        if (StringUtils.hasLength(requestOwner.getPermanentCity()))
            existing.setPermanentCity(requestOwner.getPermanentCity());
        if (StringUtils.hasLength(requestOwner.getPermanentPincode()))
            existing.setPermanentPincode(requestOwner.getPermanentPincode());
        if (StringUtils.hasLength(requestOwner.getName()))
            existing.setName(requestOwner.getName());
        if (StringUtils.hasLength(requestOwner.getEmailId()))
            existing.setEmailId(requestOwner.getEmailId());
        if (StringUtils.hasLength(requestOwner.getFatherOrHusbandName()))
            existing.setFatherOrHusbandName(requestOwner.getFatherOrHusbandName());
        if (requestOwner.getRelationship() != null)
            existing.setRelationship(requestOwner.getRelationship());
        if (StringUtils.hasLength(requestOwner.getGender()))
            existing.setGender(requestOwner.getGender());
        if (requestOwner.getDob() != null)
            existing.setDob(requestOwner.getDob());
        if (StringUtils.hasLength(requestOwner.getAadhaarNumber()))
            existing.setAadhaarNumber(requestOwner.getAadhaarNumber());
        if (StringUtils.hasLength(requestOwner.getAltContactNumber()))
            existing.setAltContactNumber(requestOwner.getAltContactNumber());
        if (StringUtils.hasLength(requestOwner.getPhoto()))
            existing.setPhoto(requestOwner.getPhoto());
        if (StringUtils.hasLength(requestOwner.getBloodGroup()))
            existing.setBloodGroup(requestOwner.getBloodGroup());
        if (StringUtils.hasLength(requestOwner.getIdentificationMark()))
            existing.setIdentificationMark(requestOwner.getIdentificationMark());
    }

    private User updateUserDetails(User ownerInfo, RequestInfo requestInfo,
                                   HashMap<String, String> errorMap,Supervisor.StatusEnum status) {
        // If DOB is being changed on update — validate minimum age
        if (ownerInfo.getDob() != null && ownerInfo.getDob() != 0L) {
            validateMinimumAge(ownerInfo.getDob(), "Supervisor");
        }
        UserDetailResponse fetchResp = userExists(ownerInfo);
        if (fetchResp != null && !CollectionUtils.isEmpty(fetchResp.getUser())) {
            User existingDigitUser = fetchResp.getUser().get(0);
            mergeOwnerFields(existingDigitUser, ownerInfo);
            ownerInfo = existingDigitUser;
        }

       ownerInfo.setActive(Supervisor.StatusEnum.ACTIVE.equals(status));

        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserUpdateEndpoint());
        UserDetailResponse response = ownerCall(
                UserRequest.builder().user(ownerInfo).requestInfo(requestInfo).build(), uri);

        if (response != null && !CollectionUtils.isEmpty(response.getUser()))
            return response.getUser().get(0);
        errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR, "Unable to update Supervisor user details");
        return null;
    }

    private UserDetailResponse userExists(User owner) {
        UserSearchRequest search = new UserSearchRequest();
        // null check before split (Issue 4)
        if (owner.getTenantId() != null)
            search.setTenantId(owner.getTenantId().split("\\.")[0]);
        if (!StringUtils.isEmpty(owner.getMobileNumber()))
            search.setMobileNumber(owner.getMobileNumber());
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
//System.out.println(uri+"  "+search.getMobileNumber()+" "+search.getTenantId());
        return ownerCall(search, uri);
    }


    private Role getRoleObj(String code, String name) {
        Role role = new Role();
        role.setCode(code);
        role.setName(name);
        return role;
    }

    @SuppressWarnings("deprecation")
    private Boolean isUserValid(User user) {
        if (StringUtils.isEmpty(user.getTenantId())
                || StringUtils.isEmpty(user.getName())
                || StringUtils.isEmpty(user.getFatherOrHusbandName())
                || StringUtils.isEmpty(user.getRelationship())
                || StringUtils.isEmpty(user.getDob())
                || StringUtils.isEmpty(user.getGender())) {
            return false;
        }
        // Minimum age validation — supervisor must be at least 18 years old (legal requirement)
        validateMinimumAge(user.getDob(), "Supervisor");
        return true;
    }

    void validateMinimumAge(Long dob, String role) {
        if (dob == null || dob == 0L) return;
        Calendar dobCal = Calendar.getInstance();
        dobCal.setTimeInMillis(dob);
        dobCal.add(Calendar.YEAR, 18);
        if (dobCal.after(Calendar.getInstance())) {
            throw new CustomException("INVALID_AGE",
                    role + " must be at least 18 years of age as per legal requirement.");
        }
    }

    @SuppressWarnings("rawtypes")
    private UserDetailResponse userCall(Object userRequest, StringBuilder uri) {
        String dobFormat = uri.toString().contains(config.getUserCreateEndpoint()) ? "dd/MM/yyyy" : "yyyy-MM-dd";
        try {
            LinkedHashMap responseMap = (LinkedHashMap) serviceRequestRepository.fetchResult(uri, userRequest);
            parseResponse(responseMap, dobFormat);
            return mapper.convertValue(responseMap, UserDetailResponse.class);
        } catch (IllegalArgumentException e) {
            throw new CustomException("IllegalArgumentException", "ObjectMapper convertValue failed in userCall");
        }
    }

    @SuppressWarnings("rawtypes")
    private UserDetailResponse ownerCall(Object ownerRequest, StringBuilder uri) {
        String dobFormat = uri.toString().contains(config.getUserCreateEndpoint()) ? "dd/MM/yyyy" : "yyyy-MM-dd";
        System.out.println(uri);
        try {
            LinkedHashMap responseMap = (LinkedHashMap) serviceRequestRepository.fetchResult(uri, ownerRequest);
        //    parseResponse(responseMap, dobFormat);
            System.out.println(responseMap.size());



            System.out.println("========== BEFORE parseResponse ==========");
            System.out.println(
                    mapper.writerWithDefaultPrettyPrinter()
                            .writeValueAsString(responseMap)
            );

            parseResponse(responseMap, dobFormat);

            System.out.println("========== AFTER parseResponse ==========");
            System.out.println(
                    mapper.writerWithDefaultPrettyPrinter()
                            .writeValueAsString(responseMap)
            );

            System.out.println("responseMap size = " + responseMap.size());

            UserDetailResponse response =
                    mapper.convertValue(responseMap, UserDetailResponse.class);

            System.out.println("========== CONVERTED RESPONSE ==========");
            System.out.println(
                    mapper.writerWithDefaultPrettyPrinter()
                            .writeValueAsString(response)
            );


            return mapper.convertValue(responseMap, UserDetailResponse.class);
        } catch (IllegalArgumentException e) {
            throw new CustomException("IllegalArgumentException", "ObjectMapper convertValue failed in ownerCall");
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void parseResponse(LinkedHashMap responseMap, String dobFormat) {
        List<LinkedHashMap> users = (List<LinkedHashMap>) responseMap.get("user");
        if (users == null) return;
        String fmt = "dd-MM-yyyy HH:mm:ss";
        users.forEach(map -> {
            map.put(VendorConstants.CREATED_DATE, dateToLong((String) map.get(VendorConstants.CREATED_DATE), fmt));
            if (map.get(VendorConstants.LAST_MODIFIED_DATE) != null)
                map.put(VendorConstants.LAST_MODIFIED_DATE, dateToLong((String) map.get(VendorConstants.LAST_MODIFIED_DATE), fmt));
            if (map.get(VendorConstants.DOB) != null)
                map.put(VendorConstants.DOB, dateToLong((String) map.get(VendorConstants.DOB), dobFormat));
            if (map.get("pwdExpiryDate") != null)
                map.put("pwdExpiryDate", dateToLong((String) map.get("pwdExpiryDate"), fmt));
        });
    }

    private Long dateToLong(String date, String format) {
        try { return new SimpleDateFormat(format).parse(date).getTime(); }
        catch (ParseException e) { return 0L; }
    }
}