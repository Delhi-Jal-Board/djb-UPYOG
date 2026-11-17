package org.egov.web.adapter.error;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorField;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.domain.exception.TokenValidationLockoutException;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class TokenValidationLockoutAdapter implements ErrorAdapter<TokenValidationLockoutException> {

    private static final String LOCKOUT_CODE = "OTP.MAX_VALIDATION_ATTEMPTS_EXCEEDED";
    public static final String OTP_FIELD = "otp.otp";

    @Override
    public ErrorResponse adapt(TokenValidationLockoutException ex) {
        String msg = (ex != null && ex.getMessage() != null)
                ? ex.getMessage()
                : "Too many failed OTP validation attempts. Identity is temporarily locked.";
        final Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(msg)
                .fields(Collections.singletonList(ErrorField.builder()
                        .code(LOCKOUT_CODE)
                        .message(msg)
                        .field(OTP_FIELD)
                        .build()))
                .build();
        return new ErrorResponse(null, error);
    }
}
