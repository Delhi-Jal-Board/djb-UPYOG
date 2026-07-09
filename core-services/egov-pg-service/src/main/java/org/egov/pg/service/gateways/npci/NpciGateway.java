package org.egov.pg.service.gateways.npci;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.pg.constants.PgConstants;
import org.egov.pg.models.Transaction;
import org.egov.pg.service.Gateway;
import org.egov.pg.utils.Utils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.security.MessageDigest;
import java.util.*;

/**
 * NPCI Payment Gateway Implementation
 * Supports UPI / BBPS based payments via NPCI
 */
@Component
@Slf4j
public class NpciGateway implements Gateway {

    public static final Map<String, String> MOCK_STATUSES = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String GATEWAY_NAME = "NPCI";

    private final boolean ACTIVE;
    private final boolean SANDBOX;
    private final String MERCHANT_ID;
    private final String MERCHANT_SECRET_KEY;
    private final String REDIRECT_URL;
    private final String GATEWAY_URL;
    private final String GATEWAY_STATUS_URL;
    private final String CITIZEN_URL;
    private final String CURRENCY;
    private final String ORIGINAL_RETURN_URL_KEY;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public NpciGateway(RestTemplate restTemplate, Environment environment, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;

        ACTIVE           = Boolean.parseBoolean(environment.getProperty("npci.active", "false"));
        SANDBOX          = Boolean.parseBoolean(environment.getProperty("npci.sandbox", "false"));
        MERCHANT_ID      = environment.getProperty("npci.merchant.id", "");
        MERCHANT_SECRET_KEY = environment.getProperty("npci.merchant.secret.key", "");
        REDIRECT_URL     = environment.getProperty("npci.redirect.url", "");
        GATEWAY_URL      = environment.getProperty("npci.gateway.url", "");
        GATEWAY_STATUS_URL = environment.getProperty("npci.gateway.status.url", "");
        CITIZEN_URL      = environment.getProperty("egov.default.citizen.url", "");
        CURRENCY         = environment.getProperty("npci.currency", "INR");
        ORIGINAL_RETURN_URL_KEY = environment.getProperty("npci.original.return.url.key", "originalreturnurl");
    }

    /**
     * Generate redirect URI to NPCI payment page
     * Builds the payment request with required params and checksum
     */
    @Override
    public URI generateRedirectURI(Transaction transaction) {
        log.info("NpciGateway: Generating redirect URI for txnId={}", transaction.getTxnId());

        if (SANDBOX) {
            log.info("NpciGateway: Sandbox mode enabled, redirecting to mock payment page");
            String basePgServiceUrl = "";
            try {
                URI uri = URI.create(REDIRECT_URL);
                basePgServiceUrl = uri.getScheme() + "://" + uri.getAuthority();
            } catch (Exception e) {
                log.error("NpciGateway: Failed to parse REDIRECT_URL for base domain, falling back to localhost", e);
                basePgServiceUrl = "http://localhost:8080";
            }
            try {
                String redirectUrl = basePgServiceUrl + "/pg-service/transaction/v1/_redirect" 
                        + "?txnId=" + transaction.getTxnId()
                        + "&amount=" + transaction.getTxnAmount()
                        + "&callbackUrl=" + java.net.URLEncoder.encode(transaction.getCallbackUrl(), "UTF-8");
                return URI.create(redirectUrl);
            } catch (Exception e) {
                log.error("NpciGateway: Failed to encode redirect callback URL", e);
                String callbackUrl = transaction.getCallbackUrl();
                String separator = callbackUrl.contains("?") ? "&" : "?";
                return URI.create(callbackUrl + separator + "eg_pg_txnid=" + transaction.getTxnId());
            }
        }

        String returnUrl = getReturnUrl(transaction.getCallbackUrl(), REDIRECT_URL);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("merchantId",     MERCHANT_ID);
        params.put("orderId",        transaction.getTxnId());
        params.put("amount",         transaction.getTxnAmount());
        params.put("currency",       CURRENCY);
        params.put("customerId",     transaction.getUser() != null ? transaction.getUser().getUuid() : "");
        params.put("mobileNumber",   transaction.getUser() != null ? transaction.getUser().getMobileNumber() : "");
        params.put("returnUrl",      returnUrl);
        params.put("consumerCode",   transaction.getConsumerCode());
        params.put("module",         transaction.getModule());
        params.put("txnDateTime",    String.valueOf(System.currentTimeMillis()));

        // Generate checksum/hash for security
        String checksum = generateChecksum(params, MERCHANT_SECRET_KEY);
        params.put("checksum", checksum);

        log.info("NpciGateway: Redirect params generated for txnId={}", transaction.getTxnId());

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(GATEWAY_URL);
        params.forEach(builder::queryParam);

        return builder.build().toUri();
    }

    /**
     * Generate redirect form data as JSON string (used for form-based redirects)
     */
    @Override
    public String generateRedirectFormData(Transaction transaction) {
        log.info("NpciGateway: Generating form data for txnId={}", transaction.getTxnId());

        Map<String, String> params = new LinkedHashMap<>();
        params.put("merchantId",   MERCHANT_ID);
        params.put("orderId",      transaction.getTxnId());
        params.put("amount",       transaction.getTxnAmount());
        params.put("currency",     CURRENCY);
        params.put("customerId",   transaction.getUser() != null ? transaction.getUser().getUuid() : "");
        params.put("mobileNumber", transaction.getUser() != null ? transaction.getUser().getMobileNumber() : "");
        params.put("returnUrl",    getReturnUrl(transaction.getCallbackUrl(), REDIRECT_URL));
        params.put("consumerCode", transaction.getConsumerCode());
        params.put("txnDateTime",  String.valueOf(System.currentTimeMillis()));
        params.put("checksum",     generateChecksum(params, MERCHANT_SECRET_KEY));
        params.put("txURL",        GATEWAY_URL);

        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            log.error("NpciGateway: Failed to generate form data", e);
            throw new CustomException("NPCI_URL_GEN_FAILED",
                    "NPCI URL generation failed, gateway redirect URI cannot be generated");
        }
    }

    /**
     * Fetch the current status of a transaction from NPCI gateway
     * Called during the _update flow after gateway callback
     */
    @Override
    public Transaction fetchStatus(Transaction currentStatus, Map<String, String> params) {
        log.info("NpciGateway: Fetching status for txnId={}", currentStatus.getTxnId());

        if (SANDBOX) {
            log.info("NpciGateway: Sandbox mode enabled, returning mock status");
            String mockStatus = MOCK_STATUSES.remove(currentStatus.getTxnId());
            if (mockStatus == null) {
                mockStatus = "SUCCESS"; // default fallback
            }
            log.info("NpciGateway: Retrieved mock status '{}' for txnId={}", mockStatus, currentStatus.getTxnId());
            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("status", mockStatus);
            mockResponse.put("txnId", "NPCI_MOCK_" + UUID.randomUUID().toString());
            mockResponse.put("amount", currentStatus.getTxnAmount());
            mockResponse.put("paymentMode", "UPI");
            mockResponse.put("bankTxnId", "NPCI_BANK_" + System.currentTimeMillis());
            return transformStatusResponse(mockResponse, currentStatus);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("merchantId", MERCHANT_ID);
            headers.set("Authorization", "Bearer " + generateChecksum(
                    Collections.singletonMap("orderId", currentStatus.getTxnId()), MERCHANT_SECRET_KEY));

            // Build status request body
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("merchantId", MERCHANT_ID);
            requestBody.put("orderId", currentStatus.getTxnId());
            requestBody.put("checksum", generateChecksum(requestBody, MERCHANT_SECRET_KEY));

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    GATEWAY_STATUS_URL, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return transformStatusResponse(response.getBody(), currentStatus);
            } else {
                log.error("NpciGateway: Non-OK response from status API: {}", response.getStatusCode());
                throw new CustomException("NPCI_STATUS_FETCH_FAILED",
                        "Unable to fetch transaction status from NPCI gateway");
            }

        } catch (Exception e) {
            log.error("NpciGateway: Error fetching status for txnId={}", currentStatus.getTxnId(), e);
            throw new CustomException("NPCI_STATUS_FETCH_FAILED",
                    "Unable to fetch transaction status from NPCI gateway: " + e.getMessage());
        }
    }

    /**
     * Transform NPCI status API response to Transaction object
     */
    private Transaction transformStatusResponse(Map<String, Object> response, Transaction currentStatus) {
        String status     = String.valueOf(response.getOrDefault("status", "FAILURE"));
        String npciTxnId  = String.valueOf(response.getOrDefault("txnId", ""));
        String amount     = String.valueOf(response.getOrDefault("amount", currentStatus.getTxnAmount()));
        String payMode    = String.valueOf(response.getOrDefault("paymentMode", "UPI"));
        String errCode    = String.valueOf(response.getOrDefault("errorCode", ""));
        String errMsg     = String.valueOf(response.getOrDefault("errorMessage", ""));
        String bankTxnId  = String.valueOf(response.getOrDefault("bankTxnId", ""));

        log.info("NpciGateway: Status response — txnId={}, status={}", currentStatus.getTxnId(), status);

        if ("SUCCESS".equalsIgnoreCase(status)) {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnAmount(Utils.formatAmtAsRupee(amount))
                    .txnStatus(Transaction.TxnStatusEnum.SUCCESS)
                    .txnStatusMsg(PgConstants.TXN_SUCCESS)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .bankTransactionNo(bankTxnId)
                    .gatewayStatusCode("00")
                    .gatewayStatusMsg("Transaction Successful")
                    .responseJson(response.toString())
                    .build();

        } else if ("PENDING".equalsIgnoreCase(status)) {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnStatus(Transaction.TxnStatusEnum.PENDING)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .gatewayStatusCode(errCode)
                    .gatewayStatusMsg("Transaction Pending")
                    .responseJson(response.toString())
                    .build();

        } else {
            return Transaction.builder()
                    .txnId(currentStatus.getTxnId())
                    .txnAmount(Utils.formatAmtAsRupee(currentStatus.getTxnAmount()))
                    .txnStatus(Transaction.TxnStatusEnum.FAILURE)
                    .txnStatusMsg(PgConstants.TXN_FAILURE_GATEWAY)
                    .gatewayTxnId(npciTxnId)
                    .gatewayPaymentMode(payMode)
                    .bankTransactionNo(bankTxnId)
                    .gatewayStatusCode(errCode)
                    .gatewayStatusMsg(errMsg)
                    .responseJson(response.toString())
                    .build();
        }
    }

    @Override
    public boolean isActive() {
        return ACTIVE;
    }

    @Override
    public String gatewayName() {
        return GATEWAY_NAME;
    }

    @Override
    public String transactionIdKeyInResponse() {
        return "orderId";
    }

    private String getReturnUrl(String callbackUrl, String baseRedirectUrl) {
        return UriComponentsBuilder.fromHttpUrl(baseRedirectUrl)
                .queryParam(ORIGINAL_RETURN_URL_KEY, callbackUrl)
                .build()
                .toUriString();
    }

    private String generateChecksum(Map<String, String> params, String secretKey) {
        try {
            StringBuilder sb = new StringBuilder();
            params.forEach((k, v) -> sb.append(v).append("|"));
            sb.append(secretKey);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(sb.toString().getBytes("UTF-8"));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("NpciGateway: Checksum generation failed", e);
            throw new CustomException("NPCI_CHECKSUM_FAILED", "Failed to generate NPCI checksum");
        }
    }
}
