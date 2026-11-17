package org.egov.domain.exception;

import lombok.Getter;

@Getter
public class TokenCreationRateLimitException extends RuntimeException {

    private static final long serialVersionUID = 3437182774864526877L;
    private final long remainingSeconds;

    public TokenCreationRateLimitException(String message, long remainingSeconds) {
        super(message);
        this.remainingSeconds = remainingSeconds;
    }

    public TokenCreationRateLimitException(String message) {
        super(message);
        this.remainingSeconds = 0;
    }
}
