package org.egov.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.domain.exception.OtpCooldownException;
import org.egov.domain.exception.OtpFloodLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpRateLimiterService {

    @Value("${otp.rate.limit.enabled:true}")
    private boolean enabled = true;

    @Value("${otp.rate.limit.max.requests:5}")
    private int maxRequests = 5;

    @Value("${otp.rate.limit.window.seconds:900}")
    private long windowSeconds = 900;

    @Value("${otp.rate.limit.block.duration.seconds:900}")
    private long blockDurationSeconds = 900;

    @Value("${otp.rate.limit.min.interval.seconds:60}")
    private long minIntervalSeconds = 60;

    // Track state per mobile number
    private final Map<String, MobileOtpTracker> trackers = new ConcurrentHashMap<>();

    public void validateRateLimit(String mobileNumber) {
        if (!enabled || mobileNumber == null || mobileNumber.trim().isEmpty()) {
            return;
        }

        String sanitizedMobile = mobileNumber.trim();
        long now = System.currentTimeMillis();

        MobileOtpTracker tracker = trackers.computeIfAbsent(sanitizedMobile, k -> new MobileOtpTracker());

        synchronized (tracker) {
            // 1. Check if currently blocked
            if (tracker.blockedUntilTimestamp > now) {
                long remainingSeconds = (tracker.blockedUntilTimestamp - now) / 1000;
                long remainingMinutes = Math.max(1, (remainingSeconds + 59) / 60);
                log.warn("OTP_FLOOD_BLOCKED: Mobile {} is blocked. Remaining seconds: {}", sanitizedMobile, remainingSeconds);
                throw new OtpFloodLimitExceededException(
                        sanitizedMobile,
                        "Maximum OTP request limit exceeded for mobile number: " + sanitizedMobile
                                + ". Please try again after " + remainingMinutes + " minute(s).",
                        remainingSeconds
                );
            }

            // If block expired, reset tracker state
            if (tracker.blockedUntilTimestamp > 0 && tracker.blockedUntilTimestamp <= now) {
                tracker.blockedUntilTimestamp = 0;
                tracker.requestTimestamps.clear();
                log.info("OTP_BLOCK_RESET: Block expired for mobile {}", sanitizedMobile);
            }

            // 2. Check minimum cooldown interval between consecutive requests
            long minIntervalMillis = minIntervalSeconds * 1000;
            if (minIntervalMillis > 0 && tracker.lastRequestTimestamp > 0) {
                long elapsed = now - tracker.lastRequestTimestamp;
                if (elapsed < minIntervalMillis) {
                    long remainingSeconds = (minIntervalMillis - elapsed) / 1000;
                    log.warn("OTP_COOLDOWN_ACTIVE: Mobile {} cooldown active. Remaining seconds: {}", sanitizedMobile, remainingSeconds);
                    throw new OtpCooldownException(
                            sanitizedMobile,
                            "Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting another OTP.",
                            remainingSeconds
                    );
                }
            }

            // 3. Remove timestamps older than window
            long windowMillis = windowSeconds * 1000;
            tracker.requestTimestamps.removeIf(ts -> (now - ts) > windowMillis);

            // 4. Check request count in current window
            if (tracker.requestTimestamps.size() >= maxRequests) {
                tracker.blockedUntilTimestamp = now + (blockDurationSeconds * 1000);
                long blockMinutes = Math.max(1, (blockDurationSeconds + 59) / 60);
                log.warn("OTP_FLOOD_TRIGGERED: Mobile {} exceeded {} requests in window. Blocked for {} seconds.",
                        sanitizedMobile, maxRequests, blockDurationSeconds);
                throw new OtpFloodLimitExceededException(
                        sanitizedMobile,
                        "Maximum " + maxRequests + " OTP requests allowed within " + (windowSeconds / 60)
                                + " minutes. Mobile number is temporarily blocked. Please try again after "
                                + blockMinutes + " minute(s).",
                        blockDurationSeconds
                );
            }

            // 5. Allowed - record request
            tracker.lastRequestTimestamp = now;
            tracker.requestTimestamps.add(now);
            log.info("OTP_REQUEST_RECORDED: Mobile {}, count in window: {}/{}",
                    sanitizedMobile, tracker.requestTimestamps.size(), maxRequests);
        }

        cleanupStaleTrackersIfNecessary();
    }

    private void cleanupStaleTrackersIfNecessary() {
        if (trackers.size() > 5000) {
            long now = System.currentTimeMillis();
            long maxAgeMillis = Math.max(windowSeconds, blockDurationSeconds) * 1000;
            trackers.entrySet().removeIf(entry -> {
                MobileOtpTracker t = entry.getValue();
                return t.blockedUntilTimestamp <= now && (now - t.lastRequestTimestamp) > maxAgeMillis;
            });
        }
    }

    public void clear(String mobileNumber) {
        if (mobileNumber != null) {
            trackers.remove(mobileNumber.trim());
        }
    }

    public void resetAll() {
        trackers.clear();
    }

    private static class MobileOtpTracker {
        private long lastRequestTimestamp = 0;
        private long blockedUntilTimestamp = 0;
        private final List<Long> requestTimestamps = new ArrayList<>();
    }
}
