package org.upyog.rs.service;

import org.egov.common.contract.response.ErrorResponse;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.repository.querybuilder.RequestServiceQueryBuilder;
import org.upyog.rs.validator.FillingPointValidator;
import org.upyog.rs.web.controllers.GlobalExceptionHandler;
import org.upyog.rs.web.models.fillingpoint.FillingPoint;
import org.upyog.rs.web.models.fillingpoint.FillingPointMetadata;
import org.upyog.rs.web.models.fillingpoint.FillingPointRequest;
import org.upyog.rs.web.models.waterTanker.WaterTankerBookingDetail;
import org.upyog.rs.web.models.waterTanker.WaterTankerBookingSearchCriteria;

import javax.validation.ValidationException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class RequestServiceSecurityAuditTest {

    private FillingPointValidator fillingPointValidator;
    private GlobalExceptionHandler exceptionHandler;
    private RequestServiceQueryBuilder queryBuilder;
    private RequestServiceConfiguration config;

    @BeforeEach
    void setUp() {
        fillingPointValidator = new FillingPointValidator();
        exceptionHandler = new GlobalExceptionHandler();
        queryBuilder = new RequestServiceQueryBuilder();
        config = new RequestServiceConfiguration();
        config.setDefaultLimit(10);
        config.setDefaultOffset(0);
        config.setMaxSearchLimit(100);
        config.setIsUserProfileEnabled(false);
        ReflectionTestUtils.setField(queryBuilder, "requestServiceConfiguration", config);
    }

    // =========================================================================
    // AUDIT CASE VIII: INPUT VALIDATION (XSS / MALICIOUS PAYLOADS / REGEX)
    // =========================================================================

    @Test
    @DisplayName("POSITIVE CASE VIII-1: Valid Filling Point details pass validation on create and update")
    void testValidFillingPointPassesValidation() {
        FillingPoint fp = new FillingPoint();
        fp.setFillingPointName("Gulabi Bagh Filling Point No. 2");
        fp.setEmergencyName("Emergency Control Room - DJB");
        fp.setAeName("Rajesh Kumar (AE-1)");
        fp.setAeMobile("9876543210");
        fp.setAeEmail("ae.gulabi@djb.gov.in");
        fp.setJeName("Suresh Sharma (JE-North)");
        fp.setJeMobile("9876543211");
        fp.setJeEmail("je.gulabi@djb.gov.in");
        fp.setEeName("Mahesh Verma, EE(Central)");
        fp.setEeMobile("9876543212");
        fp.setEeEmail("ee.central@djb.gov.in");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        assertDoesNotThrow(() -> fillingPointValidator.validateCreate(request));
        assertDoesNotThrow(() -> fillingPointValidator.validateUpdate(request));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-1: Audit XSS payload <script>alert(7)</script> in fillingPointName is rejected")
    void testAuditXssScriptPayloadInFillingPointNameIsRejected() {
        FillingPoint fp = createValidFillingPoint();
        fp.setFillingPointName("<script>alert(7)</script>");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_FILLING_POINT_NAME"));
        assertTrue(ex.getErrors().get("INVALID_FILLING_POINT_NAME").contains("prohibited script"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-2: HTML/img onerror XSS payload in official name is rejected")
    void testHtmlXssPayloadInNameIsRejected() {
        FillingPoint fp = createValidFillingPoint();
        fp.setAeName("<img src=x onerror=alert(1)>");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_AE_NAME"));
        assertTrue(ex.getErrors().get("INVALID_AE_NAME").contains("prohibited script"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-3: SVG onload XSS payload in jeName is rejected")
    void testSvgOnloadXssPayloadInJeNameIsRejected() {
        FillingPoint fp = createValidFillingPoint();
        fp.setJeName("<svg/onload=alert('XSS')>");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_JE_NAME"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-4: javascript: pseudo-protocol in emergencyName is rejected")
    void testJavascriptPseudoProtocolInEmergencyNameIsRejected() {
        FillingPoint fp = createValidFillingPoint();
        fp.setEmergencyName("javascript:alert(document.cookie)");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_EMERGENCY_NAME"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-5: Invalid mobile numbers (too short, too long, letters) are rejected")
    void testInvalidMobileNumbersAreRejected() {
        FillingPoint fp1 = createValidFillingPoint();
        fp1.setAeMobile("12345"); // too short
        FillingPointRequest req1 = new FillingPointRequest();
        req1.setFillingPoints(Collections.singletonList(fp1));
        CustomException ex1 = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(req1));
        assertTrue(ex1.getErrors().containsKey("INVALID_AE_MOBILE"));

        FillingPoint fp2 = createValidFillingPoint();
        fp2.setEeMobile("9876543210123"); // too long
        FillingPointRequest req2 = new FillingPointRequest();
        req2.setFillingPoints(Collections.singletonList(fp2));
        CustomException ex2 = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(req2));
        assertTrue(ex2.getErrors().containsKey("INVALID_EE_MOBILE"));

        FillingPoint fp3 = createValidFillingPoint();
        fp3.setJeMobile("98765abcde"); // letters
        FillingPointRequest req3 = new FillingPointRequest();
        req3.setFillingPoints(Collections.singletonList(fp3));
        CustomException ex3 = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(req3));
        assertTrue(ex3.getErrors().containsKey("INVALID_JE_MOBILE"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-6: Invalid email format is rejected")
    void testInvalidEmailFormatIsRejected() {
        FillingPoint fp = createValidFillingPoint();
        fp.setAeEmail("invalid-email-without-at-and-domain");

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_AE_EMAIL"));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-7: Mandatory fields missing in FillingPoint are rejected")
    void testMandatoryFieldsMissingAreRejected() {
        FillingPoint fp = new FillingPoint(); // all blank

        FillingPointRequest request = new FillingPointRequest();
        request.setFillingPoints(Collections.singletonList(fp));

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("FILLING_POINT_NAME"));
        assertTrue(ex.getErrors().containsKey("AE_NAME_EMPTY"));
        assertTrue(ex.getErrors().containsKey("AE_MOBILE_EMPTY"));
        assertTrue(ex.getErrors().containsKey("JE_NAME_EMPTY"));
        assertTrue(ex.getErrors().containsKey("JE_MOBILE_EMPTY"));
        assertTrue(ex.getErrors().containsKey("EE_NAME_EMPTY"));
        assertTrue(ex.getErrors().containsKey("EE_MOBILE_EMPTY"));
    }

    @Test
    @DisplayName("POSITIVE CASE VIII-2: Metadata from WaterTankerBookingDetail passes validation")
    void testValidMetadataPassesValidation() {
        FillingPointMetadata meta = FillingPointMetadata.builder()
                .name("Okhla Plant Filling Point")
                .aeName("Sanjiv Verma")
                .aeMobileNumber("9811223344")
                .aeEmailId("ae.okhla@djb.gov.in")
                .jeName("Amit Sharma")
                .jeMobileNumber("9811223355")
                .jeEmailId("je.okhla@djb.gov.in")
                .eeName("R.K. Gupta")
                .eeMobileNumber("9811223366")
                .eeEmailId("ee.okhla@djb.gov.in")
                .build();

        WaterTankerBookingDetail wt = new WaterTankerBookingDetail();
        wt.setFillingPointMetadata(meta);

        FillingPointRequest request = new FillingPointRequest();
        request.setWaterTankerBookingDetail(wt);

        assertDoesNotThrow(() -> fillingPointValidator.validateCreate(request));
    }

    @Test
    @DisplayName("NEGATIVE CASE VIII-8: Metadata XSS payload from Water Tanker Booking is rejected")
    void testMetadataXssPayloadIsRejected() {
        FillingPointMetadata meta = FillingPointMetadata.builder()
                .name("<script>alert('xss')</script>")
                .aeName("Valid AE")
                .aeMobileNumber("9876543210")
                .jeName("Valid JE")
                .jeMobileNumber("9876543211")
                .eeName("Valid EE")
                .eeMobileNumber("9876543212")
                .build();

        WaterTankerBookingDetail wt = new WaterTankerBookingDetail();
        wt.setFillingPointMetadata(meta);

        FillingPointRequest request = new FillingPointRequest();
        request.setWaterTankerBookingDetail(wt);

        CustomException ex = assertThrows(CustomException.class, () -> fillingPointValidator.validateCreate(request));
        assertNotNull(ex.getErrors());
        assertTrue(ex.getErrors().containsKey("INVALID_FILLING_POINT_NAME"));
    }

    // =========================================================================
    // AUDIT CASE III: ERROR HANDLING & STACK TRACE PROTECTION
    // =========================================================================

    @Test
    @DisplayName("NEGATIVE CASE III-1: BindException returns clean HTTP 400 and no stack trace")
    void testBindExceptionReturnsClean400WithoutStackTrace() {
        WaterTankerBookingSearchCriteria criteria = new WaterTankerBookingSearchCriteria();
        BindException bindException = new BindException(criteria, "waterTankerBookingSearchCriteria");
        bindException.addError(new FieldError("waterTankerBookingSearchCriteria", "offset", "-4\"", false, null, null, "For input string: \"-4\""));

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBindException(bindException);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());

        String message = response.getBody().getError().getMessage();
        assertNotNull(message);
        assertTrue(message.contains("Invalid request parameter(s)"));
        assertTrue(message.contains("offset"));
        // Must NOT leak Spring framework class names or stack trace
        assertFalse(message.contains("BeanPropertyBindingResult"));
        assertFalse(message.contains("org.springframework"));
        assertFalse(message.contains("java.lang.NumberFormatException"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-2: MethodArgumentTypeMismatchException returns clean HTTP 400")
    void testTypeMismatchReturnsClean400() {
        TypeMismatchException ex = new TypeMismatchException("abc", Integer.class);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleTypeMismatchException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());
        assertFalse(response.getBody().getError().getMessage().contains("org.springframework"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-3: MultipartException returns clean HTTP 400 without internal path/IO trace")
    void testMultipartExceptionReturnsClean400() {
        MultipartException ex = new MultipartException("Failed to parse multipart servlet request; nested exception is java.io.IOException");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMultipartException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());
        String msg = response.getBody().getError().getMessage();
        assertFalse(msg.contains("java.io.IOException"));
        assertFalse(msg.contains("nested exception"));
        assertTrue(msg.contains("Failed to parse multipart request"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-4: HttpMessageNotReadableException (malformed JSON) returns clean 400")
    void testHttpMessageNotReadableExceptionReturnsClean400() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("Unexpected character ('}' (code 125))");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleJsonParseException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());
        assertEquals("Invalid JSON format: Unable to parse request body", response.getBody().getError().getMessage());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-5: MissingServletRequestParameterException returns clean 400")
    void testMissingServletRequestParameterExceptionReturnsClean400() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("tenantId", "String");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMissingParams(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());
        assertTrue(response.getBody().getError().getMessage().contains("tenantId"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-6: Constraint / ValidationException returns clean 400")
    void testValidationExceptionReturnsClean400() {
        ValidationException ex = new ValidationException("Booking date cannot be in the past");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleConstraintValidationException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getError().getCode());
        assertEquals("Booking date cannot be in the past", response.getBody().getError().getMessage());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-7: External service HttpClientErrorException passes through status cleanly")
    void testHttpClientErrorExceptionReturnsCleanResponse() {
        HttpClientErrorException ex = new HttpClientErrorException(HttpStatus.NOT_FOUND, "User profile not found");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleHttpClientErrorException(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getError().getCode());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-8: External service HttpServerErrorException returns clean 500")
    void testHttpServerErrorExceptionReturnsCleanResponse() {
        HttpServerErrorException ex = new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "MDMS failure");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleHttpServerErrorException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getError().getCode());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-9: ResourceAccessException (Timeout) returns HTTP 503 Service Unavailable")
    void testResourceAccessExceptionReturns503() {
        ResourceAccessException ex = new ResourceAccessException("Connection timed out to http://egov-workflow:8080");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceAccessException(ex);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(503, response.getBody().getError().getCode());
        assertTrue(response.getBody().getError().getMessage().contains("Service unavailable"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-10: Generic Exception returns sanitized HTTP 500 without stack trace or DB passwords")
    void testGenericExceptionReturnsSanitized500WithoutStackTrace() {
        Exception ex = new RuntimeException("org.postgresql.util.PSQLException: Connection refused to db-host:5432 with secret password=xyz");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGenericException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getError().getCode());
        String msg = response.getBody().getError().getMessage();

        // Must NOT leak database host, password, or exception class name
        assertFalse(msg.contains("org.postgresql"));
        assertFalse(msg.contains("Connection refused"));
        assertFalse(msg.contains("password"));
        assertTrue(msg.contains("An unexpected error occurred"));
    }

    // =========================================================================
    // QUERY BUILDER PAGINATION & DOS ATTACK PREVENTION
    // =========================================================================

    @Test
    @DisplayName("POSITIVE CASE: QueryBuilder standard pagination (limit=20, offset=10)")
    void testQueryBuilderStandardPagination() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(10)
                .limit(20)
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("offset_ > ? AND offset_ <= ?"));
        assertEquals(10, preparedStmtList.get(preparedStmtList.size() - 2));
        assertEquals(30, preparedStmtList.get(preparedStmtList.size() - 1));
    }

    @Test
    @DisplayName("POSITIVE CASE: QueryBuilder preserves limit = -1 for InboxService unpaged calls")
    void testQueryBuilderPreservesLimitMinusOneForInbox() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(0)
                .limit(-1)
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        // When limit is -1, the pagination clause WHERE offset_ > ? AND offset_ <= ? is removed
        assertFalse(query.contains("offset_ > ? AND offset_ <= ?"));
    }

    @Test
    @DisplayName("NEGATIVE CASE: QueryBuilder sanitizes negative offset (-4) to 0")
    void testQueryBuilderSanitizesNegativeOffset() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(-4)
                .limit(4)
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("offset_ > ? AND offset_ <= ?"));
        // offset must be sanitized to Math.max(0, -4) = 0, and offset+limit = 0 + 4 = 4
        assertEquals(0, preparedStmtList.get(preparedStmtList.size() - 2));
        assertEquals(4, preparedStmtList.get(preparedStmtList.size() - 1));
    }

    @Test
    @DisplayName("NEGATIVE CASE: QueryBuilder sanitizes invalid negative limit (-5) to default limit")
    void testQueryBuilderSanitizesNegativeLimit() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(0)
                .limit(-5)
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("offset_ > ? AND offset_ <= ?"));
        // Negative limit must fall back to default limit (10)
        assertEquals(0, preparedStmtList.get(preparedStmtList.size() - 2));
        assertEquals(10, preparedStmtList.get(preparedStmtList.size() - 1));
    }

    @Test
    @DisplayName("NEGATIVE CASE: QueryBuilder caps oversized limit (1000) to maxSearchLimit (100)")
    void testQueryBuilderCapsOversizedLimitToPreventDoS() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(0)
                .limit(1000) // Oversized limit
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("offset_ > ? AND offset_ <= ?"));
        // Must be capped to maxSearchLimit = 100
        assertEquals(0, preparedStmtList.get(preparedStmtList.size() - 2));
        assertEquals(100, preparedStmtList.get(preparedStmtList.size() - 1));
    }

    @Test
    @DisplayName("POSITIVE CASE: QueryBuilder uses maxSearchLimit when both limit and offset are null")
    void testQueryBuilderHandlesNullLimitAndOffset() {
        WaterTankerBookingSearchCriteria criteria = WaterTankerBookingSearchCriteria.builder()
                .tenantId("dl.djb")
                .offset(null)
                .limit(null)
                .build();

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getWaterTankerQuery(criteria, preparedStmtList);

        assertTrue(query.contains("offset_ > ? AND offset_ <= ?"));
        assertEquals(0, preparedStmtList.get(preparedStmtList.size() - 2));
        assertEquals(100, preparedStmtList.get(preparedStmtList.size() - 1));
    }

    private FillingPoint createValidFillingPoint() {
        FillingPoint fp = new FillingPoint();
        fp.setFillingPointName("Valid FP Name");
        fp.setEmergencyName("Valid Emergency");
        fp.setAeName("Rajesh Kumar");
        fp.setAeMobile("9876543210");
        fp.setAeEmail("ae@djb.gov.in");
        fp.setJeName("Suresh Sharma");
        fp.setJeMobile("9876543211");
        fp.setJeEmail("je@djb.gov.in");
        fp.setEeName("Mahesh Verma");
        fp.setEeMobile("9876543212");
        fp.setEeEmail("ee@djb.gov.in");
        return fp;
    }
}
