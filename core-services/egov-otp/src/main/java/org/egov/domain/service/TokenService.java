package org.egov.domain.service;

import static org.apache.commons.lang3.RandomStringUtils.randomNumeric;

import java.util.UUID;

import org.egov.domain.exception.TokenValidationFailureException;
import org.egov.domain.exception.TokenValidationLockoutException;
import org.egov.domain.model.Token;
import org.egov.domain.model.TokenRequest;
import org.egov.domain.model.TokenSearchCriteria;
import org.egov.domain.model.Tokens;
import org.egov.domain.model.ValidateRequest;
import org.egov.persistence.repository.TokenRepository;
import org.egov.web.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.*;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TokenService {

    private TokenRepository tokenRepository;

    private OtpConfiguration otpConfiguration;

    private PasswordEncoder passwordEncoder;

    private OtpSecurityService otpSecurityService;

    @Autowired
    public TokenService(TokenRepository tokenRepository, PasswordEncoder passwordEncoder,
                        OtpConfiguration otpConfiguration, OtpSecurityService otpSecurityService) {
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpConfiguration = otpConfiguration;
        this.otpSecurityService = otpSecurityService != null ? otpSecurityService : new OtpSecurityService(otpConfiguration);
    }

    public TokenService(TokenRepository tokenRepository, PasswordEncoder passwordEncoder, OtpConfiguration otpConfiguration) {
        this(tokenRepository, passwordEncoder, otpConfiguration, new OtpSecurityService(otpConfiguration));
    }

    public Token create(TokenRequest tokenRequest) {
        tokenRequest.validate();

        // Enforce anti-flooding / rate-limiting on creation (CWE-400)
        otpSecurityService.validateCreationRateLimit(tokenRequest.getTenantId(), tokenRequest.getIdentity());

        String originalOtp = otpConfiguration.isDefaultOtpEnabled()
                ? otpConfiguration.getDefaultOtpValue()
                : randomNumeric(otpConfiguration.getOtpLength());

        String encryptedOtp = originalOtp;

        log.info("OTP_CREATE_MODE: defaultEnabled={}, otpLength={}",
                otpConfiguration.isDefaultOtpEnabled(), otpConfiguration.getOtpLength());

        if (otpConfiguration.isEncryptOTP()){
            encryptedOtp = passwordEncoder.encode(originalOtp);
        }

        Token token = Token.builder().uuid(UUID.randomUUID().toString()).tenantId(tokenRequest.getTenantId())
                .identity(tokenRequest.getIdentity()).number(encryptedOtp)
                .timeToLiveInSeconds(otpConfiguration.getTtl()).build();
        token = tokenRepository.save(token);

        // Record creation for rate limiting tracking
        otpSecurityService.recordCreation(tokenRequest.getTenantId(), tokenRequest.getIdentity());

        token.setNumber(originalOtp);
        return token;
    }

    public Token validate(ValidateRequest validateRequest) {
        validateRequest.validate();

        String tenantId = validateRequest.getTenantId();
        String identity = validateRequest.getIdentity();

        // Check if identity is locked out due to brute force attempts (CWE-307)
        if (otpSecurityService.isLockedOut(tenantId, identity)) {
            long remainingSeconds = otpSecurityService.getRemainingLockoutSeconds(tenantId, identity);
            long remainingMinutes = Math.max(1, (remainingSeconds + 59) / 60);
            log.warn("OTP_VALIDATE_LOCKED: Identity {} is currently locked out. Remaining seconds: {}", identity, remainingSeconds);
            throw new TokenValidationLockoutException(
                    "Account is temporarily locked due to excessive failed OTP attempts. Please try again after "
                            + remainingMinutes + " minute(s).",
                    remainingSeconds
            );
        }

        Tokens tokens = tokenRepository.findByIdentityAndTenantId(validateRequest);

        int tokenCount = tokens == null || tokens.getTokens() == null ? 0 : tokens.getTokens().size();

        log.info("OTP_VALIDATE: tenantId={}, identity={}, encryptOTP={}, tokenCount={}",
                tenantId,
                identity,
                otpConfiguration.isEncryptOTP(),
                tokenCount);

        if (tokens == null || tokens.getTokens().isEmpty()) {
            log.warn("OTP_VALIDATE: tokenRepository returned null/empty object");
            throw handleFailedAttempt(tenantId, identity);
        }

        for (Token t: tokens.getTokens()) {
            log.info("Token check : getNumber = {}, getUuid = {}, getTenantId = {}, getIdentity ={}, getExpiryDateTime = {} ",
                    t.getNumber(), t.getUuid(), t.getTenantId(), t.getIdentity(), t.getExpiryDateTime());
            if (!otpConfiguration.isEncryptOTP() && validateRequest.getOtp().equalsIgnoreCase(t.getNumber())
                    || otpConfiguration.isEncryptOTP() && passwordEncoder.matches(validateRequest.getOtp(), t.getNumber())) {
                log.info("OTP_MATCHED: tokenId={} -> marking validated", t.getUuid());
                tokenRepository.markAsValidated(t);
                // Validation succeeded -> clear failed attempt history
                otpSecurityService.recordSuccess(tenantId, identity);
                return t;
            }
        }

        throw handleFailedAttempt(tenantId, identity);
    }

    private RuntimeException handleFailedAttempt(String tenantId, String identity) {
        int failedAttempts = otpSecurityService.recordFailedAttempt(tenantId, identity);
        int maxAttempts = otpConfiguration.getMaxValidationAttempts();

        if (failedAttempts >= maxAttempts) {
            long lockoutDuration = otpConfiguration.getLockoutDurationSeconds();
            otpSecurityService.lockOut(tenantId, identity, lockoutDuration);
            tokenRepository.invalidateTokens(tenantId, identity);
            long lockoutMinutes = Math.max(1, (lockoutDuration + 59) / 60);
            log.warn("OTP_VALIDATE_MAX_EXCEEDED: Identity {} reached max failed attempts ({}/{}). Active tokens invalidated and locked for {} seconds.",
                    identity, failedAttempts, maxAttempts, lockoutDuration);
            return new TokenValidationLockoutException(
                    "Maximum OTP validation attempts exceeded. Active OTP has been invalidated. Please try again after "
                            + lockoutMinutes + " minute(s) or request a new OTP.",
                    lockoutDuration
            );
        } else {
            int remaining = maxAttempts - failedAttempts;
            log.warn("OTP_VALIDATE_FAILED: Identity {} failed validation. Attempt {} of {}. Remaining: {}",
                    identity, failedAttempts, maxAttempts, remaining);
            return new TokenValidationFailureException(
                    "Invalid OTP. " + remaining + " attempt(s) remaining.",
                    remaining
            );
        }
    }

    public Token search(TokenSearchCriteria searchCriteria) {
        return tokenRepository.findBy(searchCriteria);
    }
}
