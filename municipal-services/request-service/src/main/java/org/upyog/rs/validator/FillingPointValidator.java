package org.upyog.rs.validator;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.upyog.rs.web.models.fillingpoint.FillingPoint;
import org.upyog.rs.web.models.fillingpoint.FillingPointMetadata;
import org.upyog.rs.web.models.fillingpoint.FillingPointRequest;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class FillingPointValidator {

    private static final Pattern SCRIPT_OR_HTML_PATTERN = Pattern.compile("(?i)<[^>]*>|javascript:|alert\\s*\\(|on\\w+\\s*=");
    private static final Pattern SAFE_TEXT_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s.,&/()#'_\\-]+$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$");

    public void validateCreate(FillingPointRequest request) {
        Map<String, String> errorMap = new HashMap<>();

        if (request.getFillingPoints() == null || request.getFillingPoints().isEmpty()) {
            if (request.getWaterTankerBookingDetail() != null && request.getWaterTankerBookingDetail().getFillingPointMetadata() != null) {
                validateMetadata(request.getWaterTankerBookingDetail().getFillingPointMetadata(), errorMap);
            }
        } else {
            for (FillingPoint fp : request.getFillingPoints()) {
                validateFillingPoint(fp, errorMap);
            }
        }

        if (!errorMap.isEmpty()) {
            throw new CustomException(errorMap);
        }
    }

    public void validateUpdate(FillingPointRequest request) {
        validateCreate(request); // same validation applies
    }

    private void validateFillingPoint(FillingPoint fp, Map<String, String> errorMap) {
        if (StringUtils.isBlank(fp.getFillingPointName())) {
            errorMap.put("FILLING_POINT_NAME", "Filling Point Name cannot be empty");
        } else {
            validateSafeText(fp.getFillingPointName(), "INVALID_FILLING_POINT_NAME", "Filling Point Name", errorMap);
        }

        validateSafeText(fp.getEmergencyName(), "INVALID_EMERGENCY_NAME", "Emergency Name", errorMap);

        if (StringUtils.isBlank(fp.getAeName())) {
            errorMap.put("AE_NAME_EMPTY", "AE Name cannot be empty");
        } else {
            validateSafeText(fp.getAeName(), "INVALID_AE_NAME", "AE Name", errorMap);
        }

        if (StringUtils.isBlank(fp.getAeMobile())) {
            errorMap.put("AE_MOBILE_EMPTY", "AE Mobile No cannot be empty");
        } else {
            validateMobile(fp.getAeMobile(), "INVALID_AE_MOBILE", "AE Mobile", errorMap);
        }
        validateEmail(fp.getAeEmail(), "INVALID_AE_EMAIL", "AE Email", errorMap);

        if (StringUtils.isBlank(fp.getJeName())) {
            errorMap.put("JE_NAME_EMPTY", "JE Name cannot be empty");
        } else {
            validateSafeText(fp.getJeName(), "INVALID_JE_NAME", "JE Name", errorMap);
        }

        if (StringUtils.isBlank(fp.getJeMobile())) {
            errorMap.put("JE_MOBILE_EMPTY", "JE Mobile No cannot be empty");
        } else {
            validateMobile(fp.getJeMobile(), "INVALID_JE_MOBILE", "JE Mobile", errorMap);
        }
        validateEmail(fp.getJeEmail(), "INVALID_JE_EMAIL", "JE Email", errorMap);

        if (StringUtils.isBlank(fp.getEeName())) {
            errorMap.put("EE_NAME_EMPTY", "EE Name cannot be empty");
        } else {
            validateSafeText(fp.getEeName(), "INVALID_EE_NAME", "EE Name", errorMap);
        }

        if (StringUtils.isBlank(fp.getEeMobile())) {
            errorMap.put("EE_MOBILE_EMPTY", "EE Mobile No cannot be empty");
        } else {
            validateMobile(fp.getEeMobile(), "INVALID_EE_MOBILE", "EE Mobile", errorMap);
        }
        validateEmail(fp.getEeEmail(), "INVALID_EE_EMAIL", "EE Email", errorMap);
    }

    private void validateMetadata(FillingPointMetadata meta, Map<String, String> errorMap) {
        if (StringUtils.isBlank(meta.getName())) {
            errorMap.put("FILLING_POINT_NAME", "Filling Point Name cannot be empty");
        } else {
            validateSafeText(meta.getName(), "INVALID_FILLING_POINT_NAME", "Filling Point Name", errorMap);
        }

        validateMobile(meta.getMobileNumber(), "INVALID_EMERGENCY_MOBILE", "Emergency Mobile", errorMap);
        validateEmail(meta.getEmailId(), "INVALID_EMERGENCY_EMAIL", "Emergency Email", errorMap);

        if (StringUtils.isBlank(meta.getAeName())) {
            errorMap.put("AE_NAME_EMPTY", "AE Name cannot be empty");
        } else {
            validateSafeText(meta.getAeName(), "INVALID_AE_NAME", "AE Name", errorMap);
        }

        if (StringUtils.isBlank(meta.getAeMobileNumber())) {
            errorMap.put("AE_MOBILE_EMPTY", "AE Mobile No cannot be empty");
        } else {
            validateMobile(meta.getAeMobileNumber(), "INVALID_AE_MOBILE", "AE Mobile", errorMap);
        }
        validateEmail(meta.getAeEmailId(), "INVALID_AE_EMAIL", "AE Email", errorMap);

        if (StringUtils.isBlank(meta.getJeName())) {
            errorMap.put("JE_NAME_EMPTY", "JE Name cannot be empty");
        } else {
            validateSafeText(meta.getJeName(), "INVALID_JE_NAME", "JE Name", errorMap);
        }

        if (StringUtils.isBlank(meta.getJeMobileNumber())) {
            errorMap.put("JE_MOBILE_EMPTY", "JE Mobile No cannot be empty");
        } else {
            validateMobile(meta.getJeMobileNumber(), "INVALID_JE_MOBILE", "JE Mobile", errorMap);
        }
        validateEmail(meta.getJeEmailId(), "INVALID_JE_EMAIL", "JE Email", errorMap);

        if (StringUtils.isBlank(meta.getEeName())) {
            errorMap.put("EE_NAME_EMPTY", "EE Name cannot be empty");
        } else {
            validateSafeText(meta.getEeName(), "INVALID_EE_NAME", "EE Name", errorMap);
        }

        if (StringUtils.isBlank(meta.getEeMobileNumber())) {
            errorMap.put("EE_MOBILE_EMPTY", "EE Mobile No cannot be empty");
        } else {
            validateMobile(meta.getEeMobileNumber(), "INVALID_EE_MOBILE", "EE Mobile", errorMap);
        }
        validateEmail(meta.getEeEmailId(), "INVALID_EE_EMAIL", "EE Email", errorMap);
    }

    private void validateSafeText(String value, String fieldKey, String fieldName, Map<String, String> errorMap) {
        if (StringUtils.isNotBlank(value)) {
            if (SCRIPT_OR_HTML_PATTERN.matcher(value).find()) {
                errorMap.put(fieldKey, fieldName + " contains prohibited script or HTML characters");
            } else if (!SAFE_TEXT_PATTERN.matcher(value).matches()) {
                errorMap.put(fieldKey, fieldName + " contains invalid characters");
            }
        }
    }

    private void validateMobile(String mobile, String fieldKey, String fieldName, Map<String, String> errorMap) {
        if (StringUtils.isNotBlank(mobile) && !MOBILE_PATTERN.matcher(mobile.trim()).matches()) {
            errorMap.put(fieldKey, fieldName + " must be a valid 10-digit mobile number");
        }
    }

    private void validateEmail(String email, String fieldKey, String fieldName, Map<String, String> errorMap) {
        if (StringUtils.isNotBlank(email) && !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            errorMap.put(fieldKey, fieldName + " must be a valid email address");
        }
    }
}
