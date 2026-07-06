package org.egov.pg.service.gateways.npci;

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
public class NpciGateway implements Gateway {

    private static final String GATEWAY_NAME = "NPCI";
    private final boolean ACTIVE;
    private final String MERCHANT_ID;
    private final String SECRET_KEY;

    @Autowired
    public NpciGateway(Environment environment) {
        this.ACTIVE = Boolean.parseBoolean(environment.getProperty("npci.active", "false"));
        this.MERCHANT_ID = environment.getRequiredProperty("npci.merchant.id");
        this.SECRET_KEY = environment.getRequiredProperty("npci.secret.key");
    }

    @Override
    public URI generateRedirectURI(Transaction transaction) {
        // 1. Construct the payload with transaction details
        // 2. Generate SHA-256/RSA signature using SECRET_KEY
        // 3. Return the URI (e.g., redirecting to a secure hosted NPCI page)
        return URI.create("https://secure.npci.org.in/pay?id=" + transaction.getTxnId());
    }

    @Override
    public Transaction fetchStatus(Transaction currentStatus, Map<String, String> params) {
        // PRODUCTION STEPS:
        // 1. Validate 'checksum' from params against calculated hash of other params
        // 2. If valid, transform response to Transaction object
        // 3. If suspicious, call backend API to verify status
        return currentStatus;
    }

    @Override
    public boolean isActive() { return ACTIVE; }

    @Override
    public String gatewayName() { return GATEWAY_NAME; }

    @Override
    public String transactionIdKeyInResponse() { return "orderId"; }

    @Override
    public String generateRedirectFormData(Transaction transaction) { return null; }
}