package org.egov.domain.exception;

import lombok.Getter;

@Getter
public class TokenValidationFailureException extends RuntimeException {

    private static final long serialVersionUID = 1437182774864526875L;
    private final Integer remainingAttempts;

    public TokenValidationFailureException() {
        super("OTP validation unsuccessful");
        this.remainingAttempts = null;
    }

    public TokenValidationFailureException(String message) {
        super(message);
        this.remainingAttempts = null;
    }

    public TokenValidationFailureException(String message, int remainingAttempts) {
        super(message);
        this.remainingAttempts = remainingAttempts;
    }
}
