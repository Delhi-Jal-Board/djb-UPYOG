package org.upyog.rs.validator;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.upyog.rs.web.models.fillingpoint.FillingPoint;
import org.upyog.rs.web.models.fillingpoint.FillingPointRequest;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Component
public class FillingPointValidator {

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
        }
        if (StringUtils.isBlank(fp.getAeName())) {
            errorMap.put("AE_NAME_EMPTY", "AE Name cannot be empty");
        }
        if (StringUtils.isBlank(fp.getAeMobile())) {
            errorMap.put("AE_MOBILE_EMPTY", "AE Mobile No cannot be empty");
        }
        if (StringUtils.isBlank(fp.getJeName())) {
            errorMap.put("JE_NAME_EMPTY", "JE Name cannot be empty");
        }
        if (StringUtils.isBlank(fp.getJeMobile())) {
            errorMap.put("JE_MOBILE_EMPTY", "JE Mobile No cannot be empty");
        }
        if (StringUtils.isBlank(fp.getEeName())) {
            errorMap.put("EE_NAME_EMPTY", "EE Name cannot be empty");
        }
        if (StringUtils.isBlank(fp.getEeMobile())) {
            errorMap.put("EE_MOBILE_EMPTY", "EE Mobile No cannot be empty");
        }
    }

    private void validateMetadata(org.upyog.rs.web.models.fillingpoint.FillingPointMetadata meta, Map<String, String> errorMap) {
        if (StringUtils.isBlank(meta.getName())) {
            errorMap.put("FILLING_POINT_NAME", "Filling Point Name cannot be empty");
        }
        if (StringUtils.isBlank(meta.getAeName())) {
            errorMap.put("AE_NAME_EMPTY", "AE Name cannot be empty");
        }
        if (StringUtils.isBlank(meta.getAeMobileNumber())) {
            errorMap.put("AE_MOBILE_EMPTY", "AE Mobile No cannot be empty");
        }
        if (StringUtils.isBlank(meta.getJeName())) {
            errorMap.put("JE_NAME_EMPTY", "JE Name cannot be empty");
        }
        if (StringUtils.isBlank(meta.getJeMobileNumber())) {
            errorMap.put("JE_MOBILE_EMPTY", "JE Mobile No cannot be empty");
        }
        if (StringUtils.isBlank(meta.getEeName())) {
            errorMap.put("EE_NAME_EMPTY", "EE Name cannot be empty");
        }
        if (StringUtils.isBlank(meta.getEeMobileNumber())) {
            errorMap.put("EE_MOBILE_EMPTY", "EE Mobile No cannot be empty");
        }
    }
}
