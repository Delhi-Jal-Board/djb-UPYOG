package org.egov.web.util;

import lombok.*;
import org.egov.tracer.config.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.*;
import org.springframework.stereotype.*;

@Import({TracerConfiguration.class})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Component
public class OtpConfiguration {
    @Value("${egov.otp.ttl}")
    private long ttl;

    @Value("${egov.otp.length}")
    private int otpLength;

    @Value("${egov.otp.encrypt}")
    private boolean encryptOTP;

    @Value("${egov.otp.default.enabled}")
    private boolean defaultOtpEnabled;

    @Value("${egov.otp.default.value}")
    private String defaultOtpValue;

    @Value("${egov.otp.max.validation.attempts:5}")
    private int maxValidationAttempts;

    @Value("${egov.otp.lockout.duration.seconds:900}")
    private long lockoutDurationSeconds;

    @Value("${egov.otp.rate.limit.max.creations:5}")
    private int maxCreationsPerWindow;

    @Value("${egov.otp.rate.limit.window.seconds:900}")
    private long creationWindowSeconds;

    @Value("${egov.otp.rate.limit.min.interval.seconds:60}")
    private long minCreationIntervalSeconds;

    public OtpConfiguration(long ttl, int otpLength, boolean encryptOTP, boolean defaultOtpEnabled, String defaultOtpValue) {
        this.ttl = ttl;
        this.otpLength = otpLength;
        this.encryptOTP = encryptOTP;
        this.defaultOtpEnabled = defaultOtpEnabled;
        this.defaultOtpValue = defaultOtpValue;
        this.maxValidationAttempts = 5;
        this.lockoutDurationSeconds = 900;
        this.maxCreationsPerWindow = 5;
        this.creationWindowSeconds = 900;
        this.minCreationIntervalSeconds = 60;
    }
}