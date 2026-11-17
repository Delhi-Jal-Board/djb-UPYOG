package org.egov.domain.exception;

import lombok.Getter;

@Getter
public class TokenValidationLockoutException extends RuntimeException {

    private static final long serialVersionUID = 2437182774864526876L;
    private final long remainingSeconds;

    public TokenValidationLockoutException(String message, long remainingSeconds) {
        super(message);
        this.remainingSeconds = remainingSeconds;
    }

    public TokenValidationLockoutException(String message) {
        super(message);
        this.remainingSeconds = 0;
    }
}
