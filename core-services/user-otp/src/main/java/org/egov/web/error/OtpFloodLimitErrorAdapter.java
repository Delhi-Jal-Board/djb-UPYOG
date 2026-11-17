package org.egov.web.error;

import org.egov.domain.exception.OtpFloodLimitExceededException;
import org.egov.web.contract.Error;
import org.egov.web.contract.ErrorField;
import org.egov.web.contract.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class OtpFloodLimitErrorAdapter implements ErrorAdapter<OtpFloodLimitExceededException> {

    private static final String FLOOD_LIMIT_CODE = "OTP.MAX_LIMIT_EXCEEDED";
    private static final String MOBILE_FIELD = "otp.mobileNumber";

    @Override
    public ErrorResponse adapt(OtpFloodLimitExceededException model) {
        String msg = (model != null && model.getMessage() != null)
                ? model.getMessage()
                : "Maximum OTP request limit exceeded. Mobile number is temporarily blocked.";

        ErrorField errorField = ErrorField.builder()
                .code(FLOOD_LIMIT_CODE)
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
