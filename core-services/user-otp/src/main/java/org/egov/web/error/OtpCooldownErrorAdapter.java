package org.egov.web.error;

import org.egov.domain.exception.OtpCooldownException;
import org.egov.web.contract.Error;
import org.egov.web.contract.ErrorField;
import org.egov.web.contract.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class OtpCooldownErrorAdapter implements ErrorAdapter<OtpCooldownException> {

    private static final String COOLDOWN_CODE = "OTP.RESEND_COOLDOWN";
    private static final String MOBILE_FIELD = "otp.mobileNumber";

    @Override
    public ErrorResponse adapt(OtpCooldownException model) {
        String msg = (model != null && model.getMessage() != null)
                ? model.getMessage()
                : "Please wait before requesting another OTP.";

        ErrorField errorField = ErrorField.builder()
                .code(COOLDOWN_CODE)
                .message(msg)
                .field(MOBILE_FIELD)
                .build();

        Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(msg)
                .fields(Collections.singletonList(errorField))
                .build();

        return new ErrorResponse(null, error);
    }
}
