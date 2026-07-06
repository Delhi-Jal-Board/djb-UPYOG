package org.egov.pg.service.gateways.razorpay;

import lombok.extern.slf4j.Slf4j;
import org.egov.pg.models.Transaction;
import org.egov.pg.service.Gateway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.util.Map;

@Component
@Slf4j
public class RazorpayGateway implements Gateway {

    private static final String GATEWAY_NAME = "RAZORPAY";
    private final boolean ACTIVE;
    private final String KEY_ID;
    private final String KEY_SECRET;

    @Autowired
    public RazorpayGateway(Environment environment) {
        this.ACTIVE = Boolean.parseBoolean(environment.getProperty("razorpay.active", "false"));
        this.KEY_ID = environment.getRequiredProperty("razorpay.key.id");
        this.KEY_SECRET = environment.getRequiredProperty("razorpay.key.secret");
    }

    @Override
    public URI generateRedirectURI(Transaction transaction) {
        // PRODUCTION: Use Razorpay SDK to create an Order ID, then return
        // the checkout URL with the order ID.
        return URI.create("https://checkout.razorpay.com/v1/checkout.js");
    }

    @Override
    public Transaction fetchStatus(Transaction currentStatus, Map<String, String> params) {
        String orderId = params.get("razorpay_order_id");
        String paymentId = params.get("razorpay_payment_id");
        String receivedSignature = params.get("razorpay_signature");

        // 1. Data string as per Razorpay requirements
        String data = orderId + "|" + paymentId;

        // 2. Verify integrity
        boolean isValid = RazorpayUtils.verifySignature(data, KEY_SECRET, receivedSignature);

        if (isValid) {
            log.info("Signature verified successfully for txn: {}", currentStatus.getTxnId());

            // Build the success transaction object
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnStatus(Transaction.TxnStatusEnum.SUCCESS)
                    .gatewayTxnId(paymentId)
                    .gatewayStatusMsg("Payment Successful")
                    .responseJson(params)
                    .build();
        } else {
            log.error("Invalid signature detected for txn: {}", currentStatus.getTxnId());

            // Build the failure transaction object
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnStatus(Transaction.TxnStatusEnum.FAILURE)
                    .gatewayTxnId(paymentId)
                    .gatewayStatusMsg("Signature Verification Failed")
                    .responseJson(params)
                    .build();
        }
    }

    @Override
    public boolean isActive() { return ACTIVE; }

    @Override
    public String gatewayName() { return GATEWAY_NAME; }

    @Override
    public String transactionIdKeyInResponse() { return "razorpay_order_id"; }

    @Override
    public String generateRedirectFormData(Transaction transaction) { return null; }
}