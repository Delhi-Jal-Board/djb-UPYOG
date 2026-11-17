package org.egov.domain.exception;

import lombok.Getter;

@Getter
public class OtpFloodLimitExceededException extends RuntimeException {

    private static final long serialVersionUID = 4928172938472918231L;
    private final String mobileNumber;
    private final long remainingSeconds;

    public OtpFloodLimitExceededException(String mobileNumber, String message, long remainingSeconds) {
        super(message);
        this.mobileNumber = mobileNumber;
        this.remainingSeconds = remainingSeconds;
    }

    public OtpFloodLimitExceededException(String message) {
        super(message);
        this.mobileNumber = null;
        this.remainingSeconds = 0;
    }
}
