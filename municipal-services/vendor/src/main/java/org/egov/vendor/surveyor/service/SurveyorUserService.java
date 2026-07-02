package org.egov.vendor.surveyor.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.repository.ServiceRequestRepository;
import org.egov.vendor.service.ModuleRoleService;
import org.egov.vendor.surveyor.web.model.Surveyor;
import org.egov.vendor.surveyor.web.model.SurveyorRequest;
import org.egov.vendor.surveyor.web.model.SurveyorSearchCriteria;
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
public class SurveyorUserService {

    @Autowired private VendorConfiguration config;
    @Autowired private ServiceRequestRepository serviceRequestRepository;
    @Autowired private ObjectMapper mapper;
    @Autowired private ModuleRoleService moduleRoleService;

    public void manageSurveyors(SurveyorRequest surveyorRequest, boolean isCreate) {
        Surveyor surveyor       = surveyorRequest.getSurveyor();
        RequestInfo requestInfo = surveyorRequest.getRequestInfo();
        User ownerInfo          = surveyor.getOwner();
        HashMap<String, String> errorMap = new HashMap<>();

        if (ownerInfo == null || ownerInfo.getMobileNumber() == null) {
            errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR,
                    "MobileNo is mandatory for Surveyor " + surveyor.toString());
            throw new CustomException(errorMap);
        }

        ModuleRoleMapping roleMapping = moduleRoleService.getModuleRoleMapping(
                surveyorRequest, MappingType.SURVEYOR);

        handleMobileNumber(ownerInfo, requestInfo, errorMap, surveyor,
                surveyorRequest, isCreate, roleMapping);

        if (!errorMap.isEmpty()) throw new CustomException(errorMap);
    }

    private void handleMobileNumber(User ownerInfo, RequestInfo requestInfo,
                                    HashMap<String, String> errorMap, Surveyor surveyor,
                                    SurveyorRequest surveyorRequest, boolean isCreate, ModuleRoleMapping roleMapping) {

        UserDetailResponse existing = userExists(ownerInfo);
        User foundUser = null;

        if (existing != null && !CollectionUtils.isEmpty(existing.getUser())) {
            for (User u : existing.getUser()) {
                if (surveyor.getOwner().getMobileNumber().equals(u.getMobileNumber())
                        && !u.getUuid().equals(surveyorRequest.getSurveyor().getOwnerId())) {
                    u.getRoles().forEach(r -> {
                        if (r.getCode().equals(roleMapping.getRoleCode())) {
                            errorMap.put(VendorErrorConstants.MOBILE_NUMBER_ALREADY_EXIST,
                                    "Surveyor with the same mobile number already exists");
                        }
                    });
                    if (!errorMap.isEmpty()) throw new CustomException(errorMap);
                }
                if (isRoleAvailable(u, roleMapping.getRoleCode(), surveyor.getTenantId())) {
                    foundUser = u;
                }
            }

            if (foundUser == null) {
                foundUser = assignRole(existing.getUser().get(0), ownerInfo, requestInfo,
                        errorMap, roleMapping);
            } else {
                foundUser = fetchMergeAndUpdate(foundUser, ownerInfo, requestInfo, errorMap);
            }

        } else if (isCreate) {
            foundUser = createSurveyorUser(ownerInfo, requestInfo, roleMapping);
        } else {
            foundUser = updateUserDetails(ownerInfo, requestInfo, errorMap);
        }

        if (foundUser != null) {
            surveyorRequest.getSurveyor().setOwner(foundUser);
        }
    }

    private User assignRole(User existingDigitUser, User requestOwner, RequestInfo requestInfo,
                            HashMap<String, String> errorMap, ModuleRoleMapping roleMapping) {
        mergeOwnerFields(existingDigitUser, requestOwner);
        existingDigitUser.getRoles().add(getRoleObj(roleMapping.getRoleCode(), roleMapping.getRoleName()));
        boolean hasCitizen = existingDigitUser.getRoles().stream()
                .anyMatch(r -> "CITIZEN".equals(r.getCode()));
        if (!hasCitizen) {
            existingDigitUser.getRoles().add(getRoleObj("CITIZEN", "Citizen"));
        }
        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserUpdateEndpoint());
        UserDetailResponse resp = ownerCall(UserRequest.builder()
                .user(existingDigitUser).requestInfo(requestInfo).build(), uri);
        if (resp != null && !resp.getUser().isEmpty()) return resp.getUser().get(0);
        errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR, "Unable to assign Surveyor roles");
        return null;
    }

    private User fetchMergeAndUpdate(User existingDigitUser, User requestOwner,
                                     RequestInfo requestInfo, HashMap<String, String> errorMap) {
        mergeOwnerFields(existingDigitUser, requestOwner);
        if (requestOwner.getDob() != null) {
            validateMinimumAge(requestOwner.getDob(), "Surveyor");
        }
        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserUpdateEndpoint());
        UserDetailResponse resp = ownerCall(UserRequest.builder()
                .user(existingDigitUser).requestInfo(requestInfo).build(), uri);
        if (resp != null && !resp.getUser().isEmpty()) return resp.getUser().get(0);
        errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR, "Unable to update Surveyor user details");
        return null;
    }

    private void mergeOwnerFields(User existingUser, User requestOwner) {
        if (requestOwner == null) return;
        if (StringUtils.hasLength(requestOwner.getName()))
            existingUser.setName(requestOwner.getName());
        if (StringUtils.hasLength(requestOwner.getGender()))
            existingUser.setGender(requestOwner.getGender());
        if (requestOwner.getDob() != null)
            existingUser.setDob(requestOwner.getDob());
        if (StringUtils.hasLength(requestOwner.getFatherOrHusbandName()))
            existingUser.setFatherOrHusbandName(requestOwner.getFatherOrHusbandName());
        if (requestOwner.getRelationship() != null)
            existingUser.setRelationship(requestOwner.getRelationship());
        if (StringUtils.hasLength(requestOwner.getEmailId()))
            existingUser.setEmailId(requestOwner.getEmailId());
        if (StringUtils.hasLength(requestOwner.getCorrespondenceAddress()))
            existingUser.setCorrespondenceAddress(requestOwner.getCorrespondenceAddress());
        if (StringUtils.hasLength(requestOwner.getCorrespondenceCity()))
            existingUser.setCorrespondenceCity(requestOwner.getCorrespondenceCity());
        if (StringUtils.hasLength(requestOwner.getCorrespondencePincode()))
            existingUser.setCorrespondencePincode(requestOwner.getCorrespondencePincode());
        if (StringUtils.hasLength(requestOwner.getPermanentAddress()))
            existingUser.setPermanentAddress(requestOwner.getPermanentAddress());
        if (StringUtils.hasLength(requestOwner.getPermanentCity()))
            existingUser.setPermanentCity(requestOwner.getPermanentCity());
        if (StringUtils.hasLength(requestOwner.getPermanentPincode()))
            existingUser.setPermanentPincode(requestOwner.getPermanentPincode());
        if (StringUtils.hasLength(requestOwner.getAadhaarNumber()))
            existingUser.setAadhaarNumber(requestOwner.getAadhaarNumber());
        if (StringUtils.hasLength(requestOwner.getAltContactNumber()))
            existingUser.setAltContactNumber(requestOwner.getAltContactNumber());
        if (StringUtils.hasLength(requestOwner.getPhoto()))
            existingUser.setPhoto(requestOwner.getPhoto());
        if (StringUtils.hasLength(requestOwner.getBloodGroup()))
            existingUser.setBloodGroup(requestOwner.getBloodGroup());
        if (StringUtils.hasLength(requestOwner.getIdentificationMark()))
            existingUser.setIdentificationMark(requestOwner.getIdentificationMark());
    }

    private User updateUserDetails(User ownerInfo, RequestInfo requestInfo,
                                   HashMap<String, String> errorMap) {
        // If DOB is being changed on update — validate minimum age
        if (ownerInfo.getDob() != null && ownerInfo.getDob() != 0L) {
            validateMinimumAge(ownerInfo.getDob(), "Surveyor");
        }
        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserUpdateEndpoint());
        UserDetailResponse resp = ownerCall(UserRequest.builder()
                .user(ownerInfo).requestInfo(requestInfo).build(), uri);
        if (resp != null && !resp.getUser().isEmpty()) return resp.getUser().get(0);
        errorMap.put(VendorErrorConstants.INVALID_DRIVER_ERROR, "Unable to update user details");
        return null;
    }

    private User createSurveyorUser(User owner, RequestInfo requestInfo, ModuleRoleMapping roleMapping) {
        if (!isUserValid(owner)) {
            throw new CustomException(VendorErrorConstants.INVALID_DRIVER_ERROR,
                    "Name, DOB, gender, fatherOrHusbandName and relationship are mandatory for Surveyor");
        }

        // Create the primary role from MDMS (EKYC_SURVEYOR)
        Role role = getRoleObj(roleMapping.getRoleCode(), roleMapping.getRoleName());

        // CREATE the CITIZEN role
        Role citizenRole = getRoleObj("CITIZEN", "Citizen");

        // Add BOTH roles
        List<Role> roles = new ArrayList<>();
        roles.add(role);
        roles.add(citizenRole);
        owner.setRoles(roles);

        owner.setActive(true);
        owner.setTenantId(owner.getTenantId());
        owner.setType(VendorConstants.CITIZEN);
        owner.setUserName(owner.getMobileNumber());
        owner.setUuid(UUID.randomUUID().toString());

        StringBuilder uri = new StringBuilder(config.getUserHost())
                .append(config.getUserContextPath()).append(config.getUserCreateEndpoint());
        UserDetailResponse resp = userCall(new UserRequest(requestInfo, owner), uri);
        log.info("Surveyor user created with roles {}, CITIZEN: {}", roleMapping.getRoleCode(), resp.getUser().get(0).getUuid());
        return resp.getUser().get(0);
    }

    public UserDetailResponse getUsers(SurveyorSearchCriteria criteria, RequestInfo requestInfo) {
        UserSearchRequest req = new UserSearchRequest();
        req.setRequestInfo(requestInfo);
        req.setUuid(criteria.getIds());
        if (criteria.getTenantId() != null)
            req.setTenantId(criteria.getTenantId().split("\\.")[0]);
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
        return ownerCall(req, uri);
    }

    public UserDetailResponse getOwner(SurveyorSearchCriteria criteria, RequestInfo requestInfo) {
        UserSearchRequest req = new UserSearchRequest();
        req.setRequestInfo(requestInfo);
        if (criteria.getTenantId() != null)
            req.setTenantId(criteria.getTenantId().split("\\.")[0]);
        req.setMobileNumber(criteria.getMobileNumber());
        req.setActive(true);
        if (!CollectionUtils.isEmpty(criteria.getOwnerIds())) req.setUuid(criteria.getOwnerIds());
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
        return ownerCall(req, uri);
    }

    private UserDetailResponse userExists(User owner) {
        UserSearchRequest req = new UserSearchRequest();
        if (owner.getTenantId() != null)
            req.setTenantId(owner.getTenantId().split("\\.")[0]);
        if (!StringUtils.isEmpty(owner.getMobileNumber()))
            req.setMobileNumber(owner.getMobileNumber());
        StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
        return ownerCall(req, uri);
    }

    public Boolean isRoleAvailable(User user, String roleCode, String tenantId) {
        Map<String, List<String>> tenantRoles = new HashMap<>();
        user.getRoles().forEach(r -> {
            tenantRoles.computeIfAbsent(r.getTenantId(), k -> new LinkedList<>()).add(r.getCode());
        });
        List<String> roles = tenantRoles.get(tenantId.split("\\.")[0]);
        return !CollectionUtils.isEmpty(roles) && roles.contains(roleCode);
    }

    private Role getRoleObj(String code, String name) {
        Role r = new Role();
        r.setCode(code);
        r.setName(name);
        return r;
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
        // Minimum age validation — surveyor must be at least 18 years old (legal requirement)
        validateMinimumAge(user.getDob(), "Surveyor");
        return true;
    }

    void validateMinimumAge(Long dob, String role) {
        if (dob == null || dob == 0L) return;
        java.util.Calendar dobCal = java.util.Calendar.getInstance();
        dobCal.setTimeInMillis(dob);
        dobCal.add(java.util.Calendar.YEAR, 18);
        if (dobCal.after(java.util.Calendar.getInstance())) {
            throw new CustomException("INVALID_AGE",
                    role + " must be at least 18 years of age as per legal requirement.");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private UserDetailResponse userCall(Object request, StringBuilder uri) {
        String dobFormat = uri.toString().contains(config.getUserCreateEndpoint())
                ? "dd/MM/yyyy" : "yyyy-MM-dd";
        try {
            LinkedHashMap responseMap = (LinkedHashMap) serviceRequestRepository.fetchResult(uri, request);
            parseResponse(responseMap, dobFormat);
            return mapper.convertValue(responseMap, UserDetailResponse.class);
        } catch (IllegalArgumentException e) {
            throw new CustomException("IllegalArgumentException", "ObjectMapper failed in userCall");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private UserDetailResponse ownerCall(Object request, StringBuilder uri) {
        String dobFormat = uri.toString().contains(config.getUserCreateEndpoint())
                ? "dd/MM/yyyy" : "yyyy-MM-dd";
        try {
            LinkedHashMap responseMap = (LinkedHashMap) serviceRequestRepository.fetchResult(uri, request);
            parseResponse(responseMap, dobFormat);
            return mapper.convertValue(responseMap, UserDetailResponse.class);
        } catch (IllegalArgumentException e) {
            throw new CustomException("IllegalArgumentException", "ObjectMapper failed in ownerCall");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void parseResponse(LinkedHashMap responseMap, String dobFormat) {
        List<LinkedHashMap> users = (List<LinkedHashMap>) responseMap.get("user");
        String fmt = "dd-MM-yyyy HH:mm:ss";
        if (users != null) {
            users.forEach(m -> {
                m.put(VendorConstants.CREATED_DATE,
                        dateToLong((String) m.get(VendorConstants.CREATED_DATE), fmt));
                if (m.get(VendorConstants.LAST_MODIFIED_DATE) != null)
                    m.put(VendorConstants.LAST_MODIFIED_DATE,
                            dateToLong((String) m.get(VendorConstants.LAST_MODIFIED_DATE), fmt));
                if (m.get(VendorConstants.DOB) != null)
                    m.put(VendorConstants.DOB,
                            dateToLong((String) m.get(VendorConstants.DOB), dobFormat));
                if (m.get("pwdExpiryDate") != null)
                    m.put("pwdExpiryDate",
                            dateToLong((String) m.get("pwdExpiryDate"), fmt));
            });
        }
    }

    private Long dateToLong(String date, String format) {
        try {
            return new SimpleDateFormat(format).parse(date).getTime();
        } catch (ParseException e) { return 0L; }
    }
}