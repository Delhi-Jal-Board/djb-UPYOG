package org.egov.vendor.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.repository.VendorRepository;
import org.egov.vendor.web.models.VendorAdditionalDetailsRequest;
import org.egov.vendor.web.models.vendorcontract.workorder.VendorWorkOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

@Component
@Slf4j
public class VendorValidator {

    @Autowired
    private MDMSValidator mdmsValidator;

    @Autowired
    VendorConfiguration config;

    public void validateCreate(VendorAdditionalDetailsRequest vendorRequest, Object mdmsData) {
        mdmsValidator.validateMdmsData(vendorRequest, mdmsData);
        // validateApplicationDocuments();
    }
     @Autowired
    private VendorRepository vendorRepository;

     private static final Pattern MOBILE_PATTERN = Pattern.compile("^[6-9][0-9]{9}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern UUID_PATTERN = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    
    /**
     * Validate vendor work order creation request
     */
    public void validateVendorWorkOrderCreate(VendorWorkOrder workOrder) {
        log.info("Validating vendor work order request");
        
        // Validate required fields
        validateWorkOrderRequiredFields(workOrder);
        
        // Validate data formats
        validateWorkOrderDataFormats(workOrder);
        
        // Validate business rules
        validateWorkOrderBusinessRules(workOrder);
        
        log.info("Vendor work order validation completed successfully");
    }
    
    /**
     * Validate required fields for work order
     */
    private void validateWorkOrderRequiredFields(VendorWorkOrder workOrder) {
        if (ObjectUtils.isEmpty(workOrder.getTenantId())) {
            throw new CustomException("EG_VWO_TENANT_REQUIRED", 
                "Tenant ID is required for vendor work order");
        }
        
        if (ObjectUtils.isEmpty(workOrder.getName())) {
            throw new CustomException("EG_VWO_NAME_REQUIRED", 
                "Work order name is required");
        }
        
        if (ObjectUtils.isEmpty(workOrder.getVendorId())) {
            throw new CustomException("EG_VWO_VENDOR_REQUIRED", 
                "Vendor ID is required for work order");
        }
        
        if (workOrder.getValidFrom() == null) {
            throw new CustomException("EG_VWO_VALID_FROM_REQUIRED", 
                "Valid from date is required");
        }
        
        if (workOrder.getValidTo() == null) {
            throw new CustomException("EG_VWO_VALID_TO_REQUIRED", 
                "Valid to date is required");
        }
        
        if (ObjectUtils.isEmpty(workOrder.getMobileNumber())) {
            throw new CustomException("EG_VWO_MOBILE_REQUIRED", 
                "Mobile number is required");
        }
        
        if (ObjectUtils.isEmpty(workOrder.getEmailId())) {
            throw new CustomException("EG_VWO_EMAIL_REQUIRED", 
                "Email is required");
        }
        
        if (ObjectUtils.isEmpty(workOrder.getServiceType())) {
            throw new CustomException("EG_VWO_SERVICE_TYPE_REQUIRED", 
                "Service type is required");
        }
    }
    
    /**
     * Validate data formats for work order
     */
    private void validateWorkOrderDataFormats(VendorWorkOrder workOrder) {
        // Validate tenant ID format (e.g., "dl.djb")
        if (!workOrder.getTenantId().matches("^[a-z]+\\.[a-z]+$")) {
            throw new CustomException("EG_VWO_INVALID_TENANT", 
                "Invalid tenant ID format. Expected format: 'state.district' (e.g., dl.djb)");
        }
        
        // Validate UUID format for vendor ID
        if (!UUID_PATTERN.matcher(workOrder.getVendorId()).matches()) {
            throw new CustomException("EG_VWO_INVALID_VENDOR_ID", 
                "Invalid vendor ID format. Expected UUID format");
        }
        
        // Validate name length
        if (workOrder.getName().length() < 3 || workOrder.getName().length() > 100) {
            throw new CustomException("EG_VWO_INVALID_NAME_LENGTH", 
                "Work order name must be between 3 and 100 characters");
        }
        
        // Validate mobile number
        if (ObjectUtils.isEmpty(workOrder.getMobileNumber())) {
            throw new CustomException("EG_VWO_MOBILE_REQUIRED", 
                "Mobile number is required");
        }
        if (workOrder.getMobileNumber().length() != 10) {
            throw new CustomException("EG_VWO_INVALID_MOBILE_LENGTH", 
                "Mobile number must be exactly 10 digits");
        }
        if (!workOrder.getMobileNumber().matches("\\d+")) {
            throw new CustomException("EG_VWO_INVALID_MOBILE_FORMAT", 
                "Mobile number must contain only digits");
        }
        if (!MOBILE_PATTERN.matcher(workOrder.getMobileNumber()).matches()) {
            throw new CustomException("EG_VWO_INVALID_MOBILE", 
                "Invalid mobile number. Must be 10 digits starting with 6-9");
        }
        
        // Validate alternate number if present
        if (!ObjectUtils.isEmpty(workOrder.getAlternateNumber())) {
            if (workOrder.getAlternateNumber().length() != 10) {
                throw new CustomException("EG_VWO_INVALID_ALTERNATE_LENGTH", 
                    "Alternate number must be exactly 10 digits");
            }
            if (!workOrder.getAlternateNumber().matches("\\d+")) {
                throw new CustomException("EG_VWO_INVALID_ALTERNATE_FORMAT", 
                    "Alternate number must contain only digits");
            }
            if (!MOBILE_PATTERN.matcher(workOrder.getAlternateNumber()).matches()) {
                throw new CustomException("EG_VWO_INVALID_ALTERNATE", 
                    "Invalid alternate number. Must be 10 digits starting with 6-9");
            }
            if (workOrder.getMobileNumber().equals(workOrder.getAlternateNumber())) {
                throw new CustomException("EG_VWO_SAME_NUMBERS", 
                    "Mobile number and alternate number cannot be the same");
            }
        }
        
        // Validate email
        if (ObjectUtils.isEmpty(workOrder.getEmailId())) {
            throw new CustomException("EG_VWO_EMAIL_REQUIRED", 
                "Email is required");
        }
        if (workOrder.getEmailId().length() > 100) {
            throw new CustomException("EG_VWO_EMAIL_TOO_LONG", 
                "Email must not exceed 100 characters");
        }
        if (!EMAIL_PATTERN.matcher(workOrder.getEmailId()).matches()) {
            throw new CustomException("EG_VWO_INVALID_EMAIL", 
                "Invalid email format. Expected format: user@example.com");
        }
        if (workOrder.getEmailId().contains("..")) {
            throw new CustomException("EG_VWO_INVALID_EMAIL", 
                "Invalid email format. Email cannot contain consecutive dots");
        }
        
        // Validate service type
        List<String> validServiceTypes = Arrays.asList("WT", "ST", "ET", "MT","EKYC");
        if (!validServiceTypes.contains(workOrder.getServiceType())) {
            throw new CustomException("EG_VWO_INVALID_SERVICE_TYPE", 
                "Invalid service type. Allowed values: WT, ST, ET, MT");
        }
    }
    
    /**
     * Validate business rules for work order
     */
    private void validateWorkOrderBusinessRules(VendorWorkOrder workOrder) {
        // Validate date range
        long currentTime = System.currentTimeMillis();
        long validFrom = workOrder.getValidFrom();
        long validTo = workOrder.getValidTo();


        // Check validTo is after validFrom
        if (validTo <= validFrom) {
            throw new CustomException("EG_VWO_INVALID_DATE_RANGE", 
                "Valid to date must be after valid from date");
        }
        
        // Check duration (min 1 day, max 1 year)
        long duration = validTo - validFrom;
        long minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        long maxDuration = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
        
        if (duration < minDuration) {
            throw new CustomException("EG_VWO_DURATION_TOO_SHORT", 
                "Work order duration must be at least 1 day");
        }
        
        
        
        // Check if vendor exists
        boolean vendorExists = vendorRepository.existsById(workOrder.getVendorId());
        if (!vendorExists) {
            throw new CustomException("EG_VWO_VENDOR_NOT_FOUND", 
                "Vendor not found with ID: " + workOrder.getVendorId());
        }
    }
    
    // Keep your existing validation methods below...
    // public void validateVendorAdditionalDetails(VendorAdditionalDetailsRequest request) { ... }


    // etc.
    /**
     * Validates if the search parameters are valid
     *
     * @param requestInfo The requestInfo of the incoming request
     * @param criteria    The BPASearch Criteria
     */
//    public void validateSearch(RequestInfo requestInfo, AssetSearchCriteria criteria) {
//        String allowedParamStr = null;
//        if (requestInfo.getUserInfo() != null) {
//
//            if (!requestInfo.getUserInfo().getType().equalsIgnoreCase(AssetConstants.EMPLOYEE) && criteria.isEmpty())
//                throw new CustomException(AssetConstants.INVALID_SEARCH, "Search without any paramters is not allowed");
//
//            if (!requestInfo.getUserInfo().getType().equalsIgnoreCase(AssetConstants.EMPLOYEE)
//                    && !criteria.tenantIdOnly() && criteria.getTenantId() == null)
//                throw new CustomException(AssetConstants.INVALID_SEARCH, "TenantId is mandatory in search");
//
//            if (requestInfo.getUserInfo().getType().equalsIgnoreCase(AssetConstants.EMPLOYEE) && !criteria.isEmpty()
//                    && !criteria.tenantIdOnly() && criteria.getTenantId() == null)
//                throw new CustomException(AssetConstants.INVALID_SEARCH, "TenantId is mandatory in search");
//
//
//            if (requestInfo.getUserInfo().getType().equalsIgnoreCase(AssetConstants.EMPLOYEE))
//                allowedParamStr = config.getAllowedEmployeeSearchParameters();
//            else if (requestInfo.getUserInfo().getType().equalsIgnoreCase(AssetConstants.EMPLOYEE))
//                allowedParamStr = config.getAllowedEmployeeSearchParameters();
//            else
//                throw new CustomException(AssetConstants.INVALID_SEARCH,
//                        "The userType: " + requestInfo.getUserInfo().getType() + " does not have any search config");
//        } else {
//            allowedParamStr = config.getAllowedEmployeeSearchParameters();
//            if (StringUtils.isEmpty(allowedParamStr) && !criteria.isEmpty())
//                throw new CustomException(AssetConstants.INVALID_SEARCH, "No search parameters as expected");
//            else {
//                List<String> allowedParams = Arrays.asList(allowedParamStr.split(","));
//                validateSearchParams(criteria, allowedParams);
//            }
//        }
//    }

    /**
     * Validates if the paramters coming in search are allowed
     *
     * @param criteria      BPA search criteria
     * @param allowedParams Allowed Params for search
     */
//    private void validateSearchParams(AssetSearchCriteria criteria, List<String> allowedParams) {
//
//        if (criteria.getApplicationNo() != null && !allowedParams.contains("applicationNo"))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "Search on applicationNo is not allowed");
//
//        if (criteria.getStatus() != null && !allowedParams.contains("status"))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "Search on Status is not allowed");
//
//        if (criteria.getIds() != null && !allowedParams.contains("ids"))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "Search on ids is not allowed");
//
//        if (criteria.getOffset() != null && !allowedParams.contains("offset"))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "Search on offset is not allowed");
//
//        if (criteria.getLimit() != null && !allowedParams.contains("limit"))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "Search on limit is not allowed");
//
//        if (criteria.getApprovalDate() != null && (criteria.getApprovalDate() > new Date().getTime()))
//            throw new CustomException(AssetConstants.INVALID_SEARCH,
//                    "Permit Order Genarated date cannot be a future date");
//
//        if (criteria.getFromDate() != null && (criteria.getFromDate() > new Date().getTime()))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "From date cannot be a future date");
//
//        if (criteria.getToDate() != null && criteria.getFromDate() != null
//                && (criteria.getFromDate() > criteria.getToDate()))
//            throw new CustomException(AssetConstants.INVALID_SEARCH, "To date cannot be prior to from date");
//    }

}
