package org.egov.web.adapter.error;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorField;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.domain.exception.TokenValidationFailureException;
import org.egov.domain.model.Token;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class TokenValidationFailureAdapter implements ErrorAdapter<Token> {

    private static final String OTP_VALIDATION_FAILED_MESSAGE = "OTP validation unsuccessful";
    private static final String OTP_VALIDATION_FAILED_CODE = "OTP.VALIDATION_UNSUCCESSFUL";
    public static final String OTP_FIELD = "otp.otp";

    @Override
    public ErrorResponse adapt(Token model) {
        final Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(OTP_VALIDATION_FAILED_MESSAGE)
                .fields(Collections.singletonList(getError(OTP_VALIDATION_FAILED_MESSAGE)))
                .build();
        return new ErrorResponse(null, error);
    }

    public ErrorResponse adapt(TokenValidationFailureException ex) {
        String msg = (ex != null && ex.getMessage() != null) ? ex.getMessage() : OTP_VALIDATION_FAILED_MESSAGE;
        final Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(msg)
                .fields(Collections.singletonList(getError(msg)))
                .build();
        return new ErrorResponse(null, error);
    }

    private ErrorField getError(String message) {
        return ErrorField.builder()
                .code(OTP_VALIDATION_FAILED_CODE)
                .message(message)
                .field(OTP_FIELD)
                .build();
    }
}
