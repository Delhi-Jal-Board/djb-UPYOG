package org.egov.vendor.web.controller;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.Error;
import org.egov.tracer.model.ErrorRes;
import org.springframework.beans.TypeMismatchException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;

import javax.validation.ConstraintViolationException;
import javax.validation.ValidationException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * GlobalExceptionHandler for the vendor microservice.
 * Intercepts exceptions and returns sanitized ErrorRes conforming to DIGIT contracts
 * without leaking internal stack traces or class names (Audit Case III / CWE-755).
 */
@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class GlobalExceptionHandler {

    private ErrorRes buildErrorRes(List<Error> errors) {
        ErrorRes errorRes = new ErrorRes();
        errorRes.setErrors(errors != null ? errors : new ArrayList<>());
        return errorRes;
    }

    private ErrorRes buildErrorRes(String code, String message) {
        ErrorRes errorRes = new ErrorRes();
        Error err = new Error();
        err.setCode(code);
        err.setMessage(message);
        errorRes.setErrors(new ArrayList<>(Collections.singletonList(err)));
        return errorRes;
    }

    /**
     * Handles Invalid JSON or Parsing Errors (HttpMessageNotReadableException).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorRes> handleJsonParseException(HttpMessageNotReadableException ex) {
        log.error("JSON parsing error: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("INVALID_JSON", "Invalid JSON format: Unable to parse request body"), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles Validation Errors (MethodArgumentNotValidException).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorRes> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("Method argument validation failed: {}", ex.getMessage());
        String message = "Validation failed";
        if (ex.getBindingResult() != null && !ex.getBindingResult().getAllErrors().isEmpty()) {
            message = "Validation failed: " + ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        }
        return new ResponseEntity<>(buildErrorRes("VALIDATION_ERROR", message), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles ModelAttribute and Query Parameter Binding Errors (BindException).
     * Intercepts e.g. limit=10' and prevents leakage of BeanPropertyBindingResult and NumberFormatException.
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorRes> handleBindException(BindException ex) {
        log.error("Parameter binding error: {}", ex.getMessage());
        StringBuilder errorMsg = new StringBuilder("Invalid request parameter(s): ");
        List<FieldError> fieldErrors = ex.getBindingResult().getFieldErrors();
        if (!fieldErrors.isEmpty()) {
            for (int i = 0; i < fieldErrors.size(); i++) {
                FieldError fe = fieldErrors.get(i);
                if (i > 0) errorMsg.append(", ");
                errorMsg.append(fe.getField()).append(" (invalid value: '").append(fe.getRejectedValue()).append("')");
            }
        } else {
            errorMsg.append("Invalid parameter values provided");
        }
        return new ResponseEntity<>(buildErrorRes("INVALID_PARAMETER", errorMsg.toString()), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles parameter type mismatch errors (e.g. limit=10').
     */
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, TypeMismatchException.class})
    public ResponseEntity<ErrorRes> handleTypeMismatchException(Exception ex) {
        log.error("Parameter type mismatch: {}", ex.getMessage());
        String paramName = "parameter";
        String rejectedValue = "";
        if (ex instanceof MethodArgumentTypeMismatchException) {
            paramName = ((MethodArgumentTypeMismatchException) ex).getName();
            rejectedValue = String.valueOf(((MethodArgumentTypeMismatchException) ex).getValue());
        }
        return new ResponseEntity<>(buildErrorRes("TYPE_MISMATCH", "Invalid value '" + rejectedValue + "' for parameter '" + paramName + "'"), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles multipart file upload errors.
     */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorRes> handleMultipartException(MultipartException ex) {
        log.error("Multipart parsing exception: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("MULTIPART_ERROR", "Failed to parse multipart request: Malformed or invalid file payload"), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles JSR-303 / Bean Validation Exceptions.
     */
    @ExceptionHandler({ValidationException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorRes> handleConstraintValidationException(Exception ex) {
        log.error("Validation constraint exception: {}", ex.getMessage());
        String msg = ex.getMessage() != null ? ex.getMessage() : "Validation failed for request";
        return new ResponseEntity<>(buildErrorRes("VALIDATION_ERROR", msg), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles MissingServletRequestParameterException.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorRes> handleMissingParams(MissingServletRequestParameterException ex) {
        log.error("Missing request parameter: {}", ex.getParameterName());
        return new ResponseEntity<>(buildErrorRes("MISSING_PARAMETER", "Required request parameter is missing: " + ex.getParameterName()), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles Custom Exceptions (CustomException from tracer).
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorRes> handleCustomException(CustomException ex) {
        log.error("CustomException: code={}, message={}", ex.getCode(), ex.getMessage());
        List<Error> errors = new ArrayList<>();
        if (ex.getErrors() != null && !ex.getErrors().isEmpty()) {
            for (Map.Entry<String, String> entry : ex.getErrors().entrySet()) {
                Error err = new Error();
                err.setCode(entry.getKey());
                err.setMessage(entry.getValue());
                errors.add(err);
            }
        } else {
            String code = ex.getCode() != null ? ex.getCode() : "CUSTOM_ERROR";
            String msg = ex.getMessage() != null ? ex.getMessage() : "Business validation failed";
            Error err = new Error();
            err.setCode(code);
            err.setMessage(msg);
            errors.add(err);
        }
        return new ResponseEntity<>(buildErrorRes(errors), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles IllegalArgumentException.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorRes> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Illegal argument exception: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("ILLEGAL_ARGUMENT", "Invalid parameter value provided: " + (ex.getMessage() != null ? ex.getMessage() : "Bad Request")), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles External API 4xx Errors.
     */
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorRes> handleHttpClientErrorException(HttpClientErrorException ex) {
        log.error("External service client error: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("EXTERNAL_SERVICE_ERROR", "Client error from external service: " + ex.getRawStatusCode()), ex.getStatusCode());
    }

    /**
     * Handles External API 5xx Errors.
     */
    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<ErrorRes> handleHttpServerErrorException(HttpServerErrorException ex) {
        log.error("External service server error: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("EXTERNAL_SERVICE_FAILURE", "Server error from external service: " + ex.getRawStatusCode()), ex.getStatusCode());
    }

    /**
     * Handles Connection Issues (Timeouts, Network Issues).
     */
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorRes> handleResourceAccessException(ResourceAccessException ex) {
        log.error("Resource access error: {}", ex.getMessage());
        return new ResponseEntity<>(buildErrorRes("SERVICE_UNAVAILABLE", "Service unavailable: External service connection issue"), HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * Handles Unknown Host (Service Down or Incorrect URL).
     */
    @ExceptionHandler({UnknownHostException.class, RuntimeException.class})
    public ResponseEntity<ErrorRes> handleUnknownHostException(Exception ex) {
        if (ex instanceof UnknownHostException || (ex instanceof RuntimeException && ex.getCause() instanceof UnknownHostException)) {
            log.error("UnknownHostException: {}", ex.getMessage());
            return new ResponseEntity<>(buildErrorRes("SERVICE_UNAVAILABLE", "Service unavailable: Unable to reach required host service"), HttpStatus.SERVICE_UNAVAILABLE);
        }
        
        log.error("Unhandled RuntimeException: ", ex);
        return new ResponseEntity<>(buildErrorRes("INTERNAL_SERVER_ERROR", "An unexpected error occurred while processing your request. Please try again later or contact support."), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handles generic exceptions (Exception).
     * Returns sanitized 500 error without exposing stack trace or internal details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorRes> handleGenericException(Exception ex) {
        log.error("Unhandled Exception: ", ex);
        return new ResponseEntity<>(buildErrorRes("INTERNAL_SERVER_ERROR", "An unexpected error occurred while processing your request. Please try again later or contact support."), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
