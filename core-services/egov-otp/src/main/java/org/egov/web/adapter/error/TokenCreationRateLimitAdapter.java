package org.egov.web.adapter.error;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorField;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.domain.exception.TokenCreationRateLimitException;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class TokenCreationRateLimitAdapter implements ErrorAdapter<TokenCreationRateLimitException> {

    private static final String RATE_LIMIT_CODE = "OTP.RATE_LIMIT_EXCEEDED";
    public static final String IDENTITY_FIELD = "otp.identity";

    @Override
    public ErrorResponse adapt(TokenCreationRateLimitException ex) {
        String msg = (ex != null && ex.getMessage() != null)
                ? ex.getMessage()
                : "Too many OTP creation requests. Please try again later.";
        final Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(msg)
                .fields(Collections.singletonList(ErrorField.builder()
                        .code(RATE_LIMIT_CODE)
                        .message(msg)
                        .field(IDENTITY_FIELD)
                        .build()))
                .build();
        return new ErrorResponse(null, error);
    }
}
