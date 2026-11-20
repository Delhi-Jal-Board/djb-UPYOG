package org.egov.vendor.web.controller;

import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ErrorRes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;

import javax.validation.ValidationException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    // =========================================================================
    // AUDIT CASE III: IMPROPER ERROR HANDLING (CWE-755)
    // =========================================================================

    @Test
    @DisplayName("NEGATIVE CASE III-1: BindException on 'limit=10'' returns clean HTTP 400 without leaking stack trace")
    void testBindExceptionOnLimitFieldReturnsClean400() {
        BindException ex = new BindException(new Object(), "vendorSearchCriteria");
        ex.addError(new FieldError("vendorSearchCriteria", "limit", "10'", false,
                new String[]{"typeMismatch.vendorSearchCriteria.limit", "typeMismatch.limit"},
                new Object[]{"limit"},
                "Failed to convert property value of type 'java.lang.String' to required type 'java.lang.Integer' for property 'limit'; nested exception is java.lang.NumberFormatException: For input string: \"10'\""));

        ResponseEntity<ErrorRes> response = exceptionHandler.handleBindException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getErrors());
        assertEquals(1, response.getBody().getErrors().size());
        assertEquals("INVALID_PARAMETER", response.getBody().getErrors().get(0).getCode());

        String message = response.getBody().getErrors().get(0).getMessage();
        assertTrue(message.contains("Invalid request parameter(s)"));
        assertTrue(message.contains("limit"));
        assertTrue(message.contains("10'"));

        // Must NOT leak Spring framework class names, reflection or raw stack trace
        assertFalse(message.contains("BeanPropertyBindingResult"));
        assertFalse(message.contains("org.springframework"));
        assertFalse(message.contains("java.lang.NumberFormatException"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-2: BindException on 'offset=0'' returns clean HTTP 400 without leaking stack trace")
    void testBindExceptionOnOffsetFieldReturnsClean400() {
        BindException ex = new BindException(new Object(), "vendorSearchCriteria");
        ex.addError(new FieldError("vendorSearchCriteria", "offset", "0'", false,
                new String[]{"typeMismatch.vendorSearchCriteria.offset", "typeMismatch.offset"},
                new Object[]{"offset"},
                "Failed to convert property value of type 'java.lang.String' to required type 'java.lang.Integer' for property 'offset'; nested exception is java.lang.NumberFormatException: For input string: \"0'\""));

        ResponseEntity<ErrorRes> response = exceptionHandler.handleBindException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_PARAMETER", response.getBody().getErrors().get(0).getCode());

        String message = response.getBody().getErrors().get(0).getMessage();
        assertTrue(message.contains("Invalid request parameter(s)"));
        assertTrue(message.contains("offset"));
        // Must NOT leak Spring framework class names or stack trace
        assertFalse(message.contains("BeanPropertyBindingResult"));
        assertFalse(message.contains("org.springframework"));
        assertFalse(message.contains("java.lang.NumberFormatException"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-3: MethodArgumentTypeMismatchException returns clean HTTP 400")
    void testTypeMismatchReturnsClean400() {
        TypeMismatchException ex = new TypeMismatchException("abc", Integer.class);

        ResponseEntity<ErrorRes> response = exceptionHandler.handleTypeMismatchException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TYPE_MISMATCH", response.getBody().getErrors().get(0).getCode());
        assertFalse(response.getBody().getErrors().get(0).getMessage().contains("org.springframework"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-4: MultipartException returns clean HTTP 400 without internal path/IO trace")
    void testMultipartExceptionReturnsClean400() {
        MultipartException ex = new MultipartException("Failed to parse multipart servlet request; nested exception is java.io.IOException: Header section has more than 10240 bytes");

        ResponseEntity<ErrorRes> response = exceptionHandler.handleMultipartException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("MULTIPART_ERROR", response.getBody().getErrors().get(0).getCode());
        String msg = response.getBody().getErrors().get(0).getMessage();
        assertFalse(msg.contains("java.io.IOException"));
        assertFalse(msg.contains("nested exception"));
        assertTrue(msg.contains("Failed to parse multipart request"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-5: HttpMessageNotReadableException (malformed JSON) returns clean 400")
    void testHttpMessageNotReadableExceptionReturnsClean400() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("Unexpected character ('}' (code 125))");

        ResponseEntity<ErrorRes> response = exceptionHandler.handleJsonParseException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_JSON", response.getBody().getErrors().get(0).getCode());
        assertEquals("Invalid JSON format: Unable to parse request body", response.getBody().getErrors().get(0).getMessage());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-6: MissingServletRequestParameterException returns clean 400")
    void testMissingServletRequestParameterExceptionReturnsClean400() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("tenantId", "String");

        ResponseEntity<ErrorRes> response = exceptionHandler.handleMissingParams(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("MISSING_PARAMETER", response.getBody().getErrors().get(0).getCode());
        assertTrue(response.getBody().getErrors().get(0).getMessage().contains("tenantId"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-7: ValidationException returns clean 400")
    void testValidationExceptionReturnsClean400() {
        ValidationException ex = new ValidationException("Vendor name must not be blank");

        ResponseEntity<ErrorRes> response = exceptionHandler.handleConstraintValidationException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_ERROR", response.getBody().getErrors().get(0).getCode());
        assertEquals("Vendor name must not be blank", response.getBody().getErrors().get(0).getMessage());
    }

    @Test
    @DisplayName("NEGATIVE CASE III-8: CustomException returns clean HTTP 400")
    void testCustomExceptionReturnsClean400() {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("INVALID_ZONE_ID", "Zone ID contains illegal characters");
        CustomException ex = new CustomException(errorMap);

        ResponseEntity<ErrorRes> response = exceptionHandler.handleCustomException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_ZONE_ID", response.getBody().getErrors().get(0).getCode());
        assertTrue(response.getBody().getErrors().get(0).getMessage().contains("Zone ID contains illegal characters"));
    }

    @Test
    @DisplayName("NEGATIVE CASE III-9: Generic Exception returns sanitized HTTP 500 without stack trace or DB passwords")
    void testGenericExceptionReturnsSanitized500WithoutStackTrace() {
        Exception ex = new RuntimeException("org.postgresql.util.PSQLException: Connection refused to db-host:5432 with secret password=xyz");

        ResponseEntity<ErrorRes> response = exceptionHandler.handleGenericException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getErrors().get(0).getCode());
        String msg = response.getBody().getErrors().get(0).getMessage();

        // Must NOT leak database host, password, or exception class name
        assertFalse(msg.contains("org.postgresql"));
        assertFalse(msg.contains("Connection refused"));
        assertFalse(msg.contains("password"));
        assertTrue(msg.contains("An unexpected error occurred"));
    }
}
