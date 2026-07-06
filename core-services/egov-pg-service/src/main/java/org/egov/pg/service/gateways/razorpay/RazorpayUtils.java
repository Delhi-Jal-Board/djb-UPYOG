package org.egov.pg.service.gateways.razorpay;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Hex;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class RazorpayUtils {

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Verifies the signature received from Razorpay.
     * @param data The string concatenation: order_id + "|" + payment_id
     * @param secret The Razorpay Key Secret
     * @param signature The signature received in the callback
     * @return true if valid
     */
    public static boolean verifySignature(String data, String secret, String signature) {
        try {
            Mac sha256_HMAC = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(), HMAC_SHA256);
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(data.getBytes());
            String expectedSignature = Hex.encodeHexString(hash);

            return expectedSignature.equals(signature);
        } catch (Exception e) {
            log.error("Error calculating signature: ", e);
            return false;
        }
    }
}