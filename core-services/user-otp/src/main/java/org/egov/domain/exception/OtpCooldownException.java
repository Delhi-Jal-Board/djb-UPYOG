package org.egov.domain.exception;

import lombok.Getter;

@Getter
public class OtpCooldownException extends RuntimeException {

    private static final long serialVersionUID = 5928172938472918232L;
    private final String mobileNumber;
    private final long remainingSeconds;

    public OtpCooldownException(String mobileNumber, String message, long remainingSeconds) {
        super(message);
        this.mobileNumber = mobileNumber;
        this.remainingSeconds = remainingSeconds;
    }

    public OtpCooldownException(String message) {
        super(message);
        this.mobileNumber = null;
        this.remainingSeconds = 0;
    }
}
