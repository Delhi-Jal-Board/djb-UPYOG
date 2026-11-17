package org.egov.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.domain.exception.TokenCreationRateLimitException;
import org.egov.web.util.OtpConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpSecurityService {

    private final OtpConfiguration otpConfiguration;

    // Validation attempt tracking: key -> tenantId:identity
    private final Map<String, ValidationTracker> validationTrackers = new ConcurrentHashMap<>();

    // Creation rate limiting tracking: key -> tenantId:identity
    private final Map<String, CreationTracker> creationTrackers = new ConcurrentHashMap<>();

    @Autowired
    public OtpSecurityService(OtpConfiguration otpConfiguration) {
        this.otpConfiguration = otpConfiguration;
    }

    private String buildKey(String tenantId, String identity) {
        return (tenantId != null ? tenantId.trim() : "") + ":" + (identity != null ? identity.trim() : "");
    }

    /* =========================================================================
     *  OTP VALIDATION & BRUTE FORCE PROTECTION (CWE-307)
     * ========================================================================= */

    public boolean isLockedOut(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        ValidationTracker tracker = validationTrackers.get(key);
        if (tracker == null) {
            return false;
        }
        long now = System.currentTimeMillis();
        if (tracker.lockedUntilTimestamp > now) {
            return true;
        }
        // Lockout expired - clear tracker if lock time passed
        if (tracker.lockedUntilTimestamp > 0 && tracker.lockedUntilTimestamp <= now) {
            validationTrackers.remove(key);
            log.info("OTP_LOCKOUT_EXPIRED: Lockout expired for identity={}", identity);
        }
        return false;
    }

    public long getRemainingLockoutSeconds(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        ValidationTracker tracker = validationTrackers.get(key);
        if (tracker == null) {
            return 0;
        }
        long diff = tracker.lockedUntilTimestamp - System.currentTimeMillis();
        return diff > 0 ? (diff / 1000) : 0;
    }

    public int recordFailedAttempt(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        ValidationTracker tracker = validationTrackers.computeIfAbsent(key, k -> new ValidationTracker());
        synchronized (tracker) {
            tracker.failedAttempts++;
            tracker.lastAttemptTimestamp = System.currentTimeMillis();
            return tracker.failedAttempts;
        }
    }

    public void lockOut(String tenantId, String identity, long durationSeconds) {
        String key = buildKey(tenantId, identity);
        ValidationTracker tracker = validationTrackers.computeIfAbsent(key, k -> new ValidationTracker());
        synchronized (tracker) {
            tracker.lockedUntilTimestamp = System.currentTimeMillis() + (durationSeconds * 1000);
            log.warn("OTP_LOCKED: Locked identity={} until timestamp={}", identity, tracker.lockedUntilTimestamp);
        }
    }

    public void recordSuccess(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        validationTrackers.remove(key);
        log.info("OTP_SUCCESS: Reset validation tracker for identity={}", identity);
    }

    public int getFailedAttempts(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        ValidationTracker tracker = validationTrackers.get(key);
        return tracker != null ? tracker.failedAttempts : 0;
    }

    /* =========================================================================
     *  OTP CREATION RATE LIMITING / ANTI-FLOODING (CWE-400)
     * ========================================================================= */

    public void validateCreationRateLimit(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        CreationTracker tracker = creationTrackers.get(key);
        if (tracker == null) {
            return;
        }

        long now = System.currentTimeMillis();
        synchronized (tracker) {
            // Check minimum interval between requests (cooldown)
            long minIntervalMillis = otpConfiguration.getMinCreationIntervalSeconds() * 1000;
            if (minIntervalMillis > 0 && (now - tracker.lastCreationTimestamp) < minIntervalMillis) {
                long remainingSeconds = (minIntervalMillis - (now - tracker.lastCreationTimestamp)) / 1000;
                log.warn("OTP_CREATION_COOLDOWN: Cooldown active for identity={}, remainingSeconds={}", identity, remainingSeconds);
                throw new TokenCreationRateLimitException(
                        "Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting another OTP.",
                        remainingSeconds
                );
            }

            // Clean up timestamps outside window
            long windowMillis = otpConfiguration.getCreationWindowSeconds() * 1000;
            tracker.creationTimestamps.removeIf(ts -> (now - ts) > windowMillis);

            // Check max creation count within window
            if (tracker.creationTimestamps.size() >= otpConfiguration.getMaxCreationsPerWindow()) {
                long oldestInWindow = tracker.creationTimestamps.get(0);
                long remainingWindowSeconds = (windowMillis - (now - oldestInWindow)) / 1000;
                long remainingMinutes = Math.max(1, (remainingWindowSeconds + 59) / 60);
                log.warn("OTP_CREATION_LIMIT_EXCEEDED: Max OTP creations exceeded for identity={}", identity);
                throw new TokenCreationRateLimitException(
                        "Maximum OTP request limit reached. Please try again after " + remainingMinutes + " minute(s).",
                        remainingWindowSeconds
                );
            }
        }
    }

    public void recordCreation(String tenantId, String identity) {
        String key = buildKey(tenantId, identity);
        CreationTracker tracker = creationTrackers.computeIfAbsent(key, k -> new CreationTracker());
        long now = System.currentTimeMillis();
        synchronized (tracker) {
            tracker.lastCreationTimestamp = now;
            tracker.creationTimestamps.add(now);
            // Periodic cleanup
            long windowMillis = otpConfiguration.getCreationWindowSeconds() * 1000;
            tracker.creationTimestamps.removeIf(ts -> (now - ts) > windowMillis);
        }

        cleanupStaleTrackersIfNecessary();
    }

    private void cleanupStaleTrackersIfNecessary() {
        if (validationTrackers.size() > 5000) {
            long now = System.currentTimeMillis();
            long lockoutMillis = otpConfiguration.getLockoutDurationSeconds() * 1000;
            validationTrackers.entrySet().removeIf(entry -> {
                ValidationTracker t = entry.getValue();
                return (t.lockedUntilTimestamp > 0 && t.lockedUntilTimestamp <= now)
                        || (t.lockedUntilTimestamp == 0 && (now - t.lastAttemptTimestamp) > lockoutMillis);
            });
        }
        if (creationTrackers.size() > 5000) {
            long now = System.currentTimeMillis();
            long windowMillis = otpConfiguration.getCreationWindowSeconds() * 1000;
            creationTrackers.entrySet().removeIf(entry -> {
                CreationTracker t = entry.getValue();
                return (now - t.lastCreationTimestamp) > windowMillis;
            });
        }
    }

    // Helper data structures
    private static class ValidationTracker {
        private int failedAttempts = 0;
        private long lockedUntilTimestamp = 0;
        private long lastAttemptTimestamp = 0;
    }

    private static class CreationTracker {
        private long lastCreationTimestamp = 0;
        private final List<Long> creationTimestamps = new ArrayList<>();
    }
}
