package org.upyog.rs.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.TypeMismatchException;
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
import org.upyog.rs.exception.DuplicateMobileNumberException;

import javax.validation.ConstraintViolationException;
import javax.validation.ValidationException;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GlobalExceptionHandler class for handling exceptions across the request-service application.
 * Provides consistent, sanitized error responses for various exception scenarios without leaking internal stack traces.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles Invalid JSON or Parsing Errors (HttpMessageNotReadableException).
     *
     * @param ex The HttpMessageNotReadableException.
     * @return ErrorResponse with BAD_REQUEST status.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleJsonParseException(HttpMessageNotReadableException ex) {
        log.error("JSON parsing error: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message("Invalid JSON format: Unable to parse request body")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles Validation Errors (MethodArgumentNotValidException).
     *
     * @param ex The MethodArgumentNotValidException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("Method argument validation failed: {}", ex.getMessage());
        String message = "Validation failed";
        if (ex.getBindingResult() != null && !ex.getBindingResult().getAllErrors().isEmpty()) {
            message = "Validation failed: " + ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        }
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message(message)
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles ModelAttribute and Query Parameter Binding Errors (BindException).
     * Returns sanitized 400 Bad Request instead of internal stack trace.
     *
     * @param ex The BindException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException ex) {
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
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message(errorMsg.toString())
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles parameter type mismatch errors (e.g. string passed where integer expected).
     *
     * @param ex The TypeMismatchException / MethodArgumentTypeMismatchException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, TypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleTypeMismatchException(Exception ex) {
        log.error("Parameter type mismatch: {}", ex.getMessage());
        String paramName = "parameter";
        String rejectedValue = "";
        if (ex instanceof MethodArgumentTypeMismatchException) {
            paramName = ((MethodArgumentTypeMismatchException) ex).getName();
            rejectedValue = String.valueOf(((MethodArgumentTypeMismatchException) ex).getValue());
        }
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message("Invalid value '" + rejectedValue + "' for parameter '" + paramName + "'")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles multipart file upload errors.
     *
     * @param ex The MultipartException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipartException(MultipartException ex) {
        log.error("Multipart parsing exception: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message("Failed to parse multipart request: Malformed or invalid file payload")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles JSR-303 / Bean Validation Exceptions.
     *
     * @param ex The ValidationException or ConstraintViolationException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler({ValidationException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorResponse> handleConstraintValidationException(Exception ex) {
        log.error("Validation constraint exception: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message(ex.getMessage() != null ? ex.getMessage() : "Validation failed for request")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles MissingServletRequestParameterException.
     *
     * @param ex The MissingServletRequestParameterException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParams(MissingServletRequestParameterException ex) {
        log.error("Missing request parameter: {}", ex.getParameterName());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message("Required request parameter is missing: " + ex.getParameterName())
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles Custom Exceptions (CustomException).
     *
     * @param ex The CustomException.
     * @return ResponseEntity with ErrorResponse and BAD_REQUEST status.
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException ex) {
        log.error("CustomException: code={}, message={}", ex.getCode(), ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(400)
                .message(ex.getMessage())
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles External API 4xx Errors (Client Errors) (HttpClientErrorException).
     *
     * @param ex The HttpClientErrorException.
     * @return ErrorResponse with BAD_REQUEST status.
     */
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpClientErrorException(HttpClientErrorException ex) {
        log.error("External service client error: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(ex.getRawStatusCode())
                .message("Client error from external service: " + ex.getRawStatusCode() + " BAD_REQUEST")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, ex.getStatusCode());
    }

    /**
     * Handles External API 5xx Errors (Server Errors) (HttpServerErrorException).
     *
     * @param ex The HttpServerErrorException.
     * @return ErrorResponse with INTERNAL_SERVER_ERROR status.
     */
    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpServerErrorException(HttpServerErrorException ex) {
        log.error("External service server error: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(ex.getRawStatusCode())
                .message("Server error from external service: " + ex.getRawStatusCode() + " INTERNAL_SERVER_ERROR")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, ex.getStatusCode());
    }

    /**
     * Handles Connection Issues (Timeouts, Network Issues) (ResourceAccessException).
     *
     * @param ex The ResourceAccessException.
     * @return ErrorResponse with SERVICE_UNAVAILABLE status.
     */
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccessException(ResourceAccessException ex) {
        log.error("Resource access error: {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(503)
                .message("Service unavailable: External service connection issue")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * Handles Unknown Host (Service Down or Incorrect URL) (UnknownHostException).
     *
     * @param ex The UnknownHostException.
     * @return ErrorResponse with SERVICE_UNAVAILABLE status.
     */
    @ExceptionHandler({UnknownHostException.class, RuntimeException.class})
    public ResponseEntity<ErrorResponse> handleUnknownHostException(Exception ex) {
        if (ex instanceof UnknownHostException || (ex instanceof RuntimeException && ex.getCause() instanceof UnknownHostException)) {
            UnknownHostException unknownHostEx = (ex instanceof UnknownHostException) ? 
                (UnknownHostException) ex : 
                (UnknownHostException) ex.getCause();
            log.error("UnknownHostException: {}", unknownHostEx.getMessage());
            ErrorResponse response = new ErrorResponse();
            Error error = Error.builder()
                    .code(503)
                    .message("Service unavailable: Unable to reach required host service")
                    .build();
            response.setError(error);
            return new ResponseEntity<>(response, HttpStatus.SERVICE_UNAVAILABLE);
        }
        
        // Handle other runtime exceptions without leaking internal stack trace to client
        log.error("Unhandled RuntimeException: ", ex);
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(500)
                .message("An unexpected error occurred while processing your request. Please try again later or contact support.")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handles generic exceptions (Exception).
     * Returns sanitized 500 error without exposing stack trace or internal details.
     *
     * @param ex The Exception.
     * @return ResponseEntity with ErrorResponse and INTERNAL_SERVER_ERROR status.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled Exception: ", ex);
        ErrorResponse response = new ErrorResponse();
        Error error = Error.builder()
                .code(500)
                .message("An unexpected error occurred while processing your request. Please try again later or contact support.")
                .build();
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(DuplicateMobileNumberException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateMobileNumber(
            DuplicateMobileNumberException ex) {

        log.error("Duplicate mobile number error: {}", ex.getMessage());

        Map<String, Object> response = new HashMap<>();

        // responseInfo
        Map<String, Object> responseInfo = new HashMap<>();
        responseInfo.put("status", "FAILED");
        responseInfo.put("resMsgId", "Mobile number already registered");

        // error block
        Map<String, Object> error = new HashMap<>();
        error.put("code", "DUPLICATE_MOBILE_NUMBER");
        error.put("message", ex.getMessage());
        error.put("mobileNumber", ex.getMobileNumber());

        response.put("responseInfo", responseInfo);
        response.put("error", error);

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

} 