package org.egov.pg.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.pg.service.gateways.npci.NpciGateway;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URI;
import java.net.URLEncoder;

@Controller
@Slf4j
public class NpciMockPaymentController {

    @GetMapping(value = "/transaction/v1/_redirect")
    public Object handleMockPaymentOrSubmit(@RequestParam("txnId") String txnId,
                                            @RequestParam(value = "amount", required = false) String amount,
                                            @RequestParam("callbackUrl") String callbackUrl,
                                            @RequestParam(value = "status", required = false) String status,
                                            @RequestParam(value = "auth-token", required = false) String authToken) {

        if (status != null && !status.isEmpty()) {
            log.info("NpciMockPaymentController: Submitted mock payment status '{}' for txnId={}", status, txnId);

            // Store status in NpciGateway MOCK_STATUSES map
            NpciGateway.MOCK_STATUSES.put(txnId, status);

            // Redirect back to callbackUrl
            String separator = callbackUrl.contains("?") ? "&" : "?";
            String finalRedirectUrl = callbackUrl + separator + "eg_pg_txnid=" + txnId;

            log.info("NpciMockPaymentController: Redirecting citizen to: {}", finalRedirectUrl);

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setLocation(URI.create(finalRedirectUrl));
            return new ResponseEntity<>(httpHeaders, HttpStatus.FOUND);
        } else {
            log.info("NpciMockPaymentController: Showing mock payment page for txnId={}, amount={}", txnId, amount);

            String successUrl = "";
            String failureUrl = "";
            try {
                successUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId
                        + "&status=SUCCESS&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");
                failureUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId
                        + "&status=FAILURE&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");

                // Ensure the sandbox API endpoints retain authorization context
                if (authToken != null && !authToken.isEmpty()) {
                    successUrl += "&auth-token=" + authToken;
                    failureUrl += "&auth-token=" + authToken;
                }
            } catch (Exception e) {
                log.error("NpciMockPaymentController: Failed to encode submit URLs", e);
                successUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=SUCCESS&callbackUrl=" + callbackUrl;
                failureUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=FAILURE&callbackUrl=" + callbackUrl;

                // Ensure the sandbox API endpoints retain authorization context
                if (authToken != null && !authToken.isEmpty()) {
                    successUrl += "&auth-token=" + authToken;
                    failureUrl += "&auth-token=" + authToken;
                }
            }

            String html = getHtmlTemplate(txnId, amount, successUrl, failureUrl);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(html);
        }
    }

    private String getHtmlTemplate(String txnId, String amount, String successUrl, String failureUrl) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>NPCI Payment Portal</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        * {\n" +
                "            box-sizing: border-box;\n" +
                "            margin: 0;\n" +
                "            padding: 0;\n" +
                "            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n" +
                "        }\n" +
                "        body {\n" +
                "            background-color: #f4f6fa;\n" +
                "            color: #333333;\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .tricolor-bar {\n" +
                "            width: 100%;\n" +
                "            height: 4px;\n" +
                "            display: flex;\n" +
                "            position: absolute;\n" +
                "            top: 0;\n" +
                "            left: 0;\n" +
                "        }\n" +
                "        .bar-saffron { flex: 1; background-color: #FF9933; }\n" +
                "        .bar-white { flex: 1; background-color: #FFFFFF; }\n" +
                "        .bar-green { flex: 1; background-color: #138808; }\n" +
                "\n" +
                "        .payment-box {\n" +
                "            width: 100%;\n" +
                "            max-width: 850px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 12px;\n" +
                "            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);\n" +
                "            border: 1px solid #e2e8f0;\n" +
                "            overflow: hidden;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "        }\n" +
                "        .header {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "            padding: 20px 28px;\n" +
                "            border-bottom: 1px solid #edf2f7;\n" +
                "            background-color: #ffffff;\n" +
                "        }\n" +
                "        .logo-bhim {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 10px;\n" +
                "        }\n" +
                "        .logo-bhim .upi-text {\n" +
                "            font-size: 20px;\n" +
                "            font-weight: 700;\n" +
                "            color: #0c66c2;\n" +
                "        }\n" +
                "        .logo-bhim .bhim-text {\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 600;\n" +
                "            color: #f26f21;\n" +
                "            border-left: 2px solid #cbd5e1;\n" +
                "            padding-left: 10px;\n" +
                "        }\n" +
                "        .logo-npci {\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 700;\n" +
                "            color: #718096;\n" +
                "            letter-spacing: 1px;\n" +
                "            border: 1.5px solid #cbd5e1;\n" +
                "            padding: 4px 10px;\n" +
                "            border-radius: 4px;\n" +
                "            text-transform: uppercase;\n" +
                "        }\n" +
                "        .main-content {\n" +
                "            display: flex;\n" +
                "            min-height: 380px;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .main-content {\n" +
                "                flex-direction: column;\n" +
                "            }\n" +
                "        }\n" +
                "        .sidebar-tabs {\n" +
                "            width: 220px;\n" +
                "            background-color: #f8fafc;\n" +
                "            border-right: 1px solid #edf2f7;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .sidebar-tabs {\n" +
                "                width: 100%;\n" +
                "                border-right: none;\n" +
                "                border-bottom: 1px solid #edf2f7;\n" +
                "                flex-direction: row;\n" +
                "                overflow-x: auto;\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-btn {\n" +
                "            padding: 16px 20px;\n" +
                "            text-align: left;\n" +
                "            background: none;\n" +
                "            border: none;\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "            color: #4a5568;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s;\n" +
                "            border-left: 3px solid transparent;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .tab-btn {\n" +
                "                border-left: none;\n" +
                "                border-bottom: 3px solid transparent;\n" +
                "                flex: 1;\n" +
                "                text-align: center;\n" +
                "                white-space: nowrap;\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-btn:hover {\n" +
                "            background-color: #f1f5f9;\n" +
                "            color: #0c66c2;\n" +
                "        }\n" +
                "        .tab-btn.active {\n" +
                "            background-color: #e6f0fa;\n" +
                "            color: #0c66c2;\n" +
                "            border-left-color: #0c66c2;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .tab-btn.active {\n" +
                "                border-left-color: transparent;\n" +
                "                border-bottom-color: #0c66c2;\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-details-container {\n" +
                "            flex: 1;\n" +
                "            padding: 30px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "        }\n" +
                "        .tab-content {\n" +
                "            display: none;\n" +
                "            flex-direction: column;\n" +
                "            height: 100%;\n" +
                "        }\n" +
                "        .tab-content.active {\n" +
                "            display: flex;\n" +
                "        }\n" +
                "        .summary-panel {\n" +
                "            width: 250px;\n" +
                "            background-color: #f8fafc;\n" +
                "            border-left: 1px solid #edf2f7;\n" +
                "            padding: 24px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 16px;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .summary-panel {\n" +
                "                width: 100%;\n" +
                "                border-left: none;\n" +
                "                border-top: 1px solid #edf2f7;\n" +
                "            }\n" +
                "        }\n" +
                "        .summary-title {\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 700;\n" +
                "            color: #718096;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 0.5px;\n" +
                "        }\n" +
                "        .summary-item {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 4px;\n" +
                "        }\n" +
                "        .summary-label {\n" +
                "            font-size: 11px;\n" +
                "            color: #718096;\n" +
                "            font-weight: 500;\n" +
                "        }\n" +
                "        .summary-value {\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "            color: #2d3748;\n" +
                "        }\n" +
                "        .summary-value.amount {\n" +
                "            font-size: 20px;\n" +
                "            font-weight: 700;\n" +
                "            color: #0c66c2;\n" +
                "        }\n" +
                "        .timer-box {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            background-color: #fffaf0;\n" +
                "            border: 1px solid #feebc8;\n" +
                "            border-radius: 6px;\n" +
                "            padding: 10px;\n" +
                "            color: #dd6b20;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .timer-clock {\n" +
                "            font-family: monospace;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "\n" +
                "        /* Form Elements */\n" +
                "        .form-label {\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            color: #4a5568;\n" +
                "            margin-bottom: 6px;\n" +
                "        }\n" +
                "        .form-control {\n" +
                "            width: 100%;\n" +
                "            padding: 12px 14px;\n" +
                "            border: 1.5px solid #cbd5e1;\n" +
                "            border-radius: 6px;\n" +
                "            font-size: 13px;\n" +
                "            outline: none;\n" +
                "            transition: border-color 0.2s;\n" +
                "            margin-bottom: 14px;\n" +
                "        }\n" +
                "        .form-control:focus {\n" +
                "            border-color: #0c66c2;\n" +
                "        }\n" +
                "        .form-row {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 1fr 1fr;\n" +
                "            gap: 12px;\n" +
                "        }\n" +
                "\n" +
                "        /* Grid selections */\n" +
                "        .bank-grid {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: repeat(3, 1fr);\n" +
                "            gap: 10px;\n" +
                "            margin-bottom: 16px;\n" +
                "        }\n" +
                "        .bank-option {\n" +
                "            border: 1.5px solid #cbd5e1;\n" +
                "            border-radius: 6px;\n" +
                "            padding: 12px 6px;\n" +
                "            font-size: 11px;\n" +
                "            font-weight: 600;\n" +
                "            text-align: center;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s;\n" +
                "            color: #4a5568;\n" +
                "        }\n" +
                "        .bank-option:hover, .bank-option.active {\n" +
                "            border-color: #0c66c2;\n" +
                "            background-color: #e6f0fa;\n" +
                "            color: #0c66c2;\n" +
                "        }\n" +
                "\n" +
                "        /* UPI QR Section */\n" +
                "        .qr-section {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: space-around;\n" +
                "            gap: 20px;\n" +
                "            flex-wrap: wrap;\n" +
                "        }\n" +
                "        .qr-card {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        .qr-wrapper {\n" +
                "            background-color: #ffffff;\n" +
                "            padding: 12px;\n" +
                "            border: 1px solid #e2e8f0;\n" +
                "            border-radius: 8px;\n" +
                "            position: relative;\n" +
                "            box-shadow: 0 4px 10px rgba(0,0,0,0.02);\n" +
                "        }\n" +
                "        .qr-svg {\n" +
                "            width: 130px;\n" +
                "            height: 130px;\n" +
                "        }\n" +
                "        .qr-logo {\n" +
                "            position: absolute;\n" +
                "            top: 50%;\n" +
                "            left: 50%;\n" +
                "            transform: translate(-50%, -50%);\n" +
                "            width: 26px;\n" +
                "            height: 26px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 4px;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            box-shadow: 0 2px 4px rgba(0,0,0,0.15);\n" +
                "            font-size: 9px;\n" +
                "            font-weight: 800;\n" +
                "            color: #0c66c2;\n" +
                "        }\n" +
                "\n" +
                "        /* Sandbox Panel */\n" +
                "        .sim-panel {\n" +
                "            width: 100%;\n" +
                "            max-width: 850px;\n" +
                "            margin-top: 24px;\n" +
                "            background-color: #fff5f5;\n" +
                "            border: 1px dashed #feb2b2;\n" +
                "            border-radius: 12px;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .sim-title {\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 700;\n" +
                "            color: #c53030;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 0.5px;\n" +
                "            margin-bottom: 12px;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 6px;\n" +
                "        }\n" +
                "        .sim-actions {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 1fr 1fr;\n" +
                "            gap: 12px;\n" +
                "        }\n" +
                "        @media (max-width: 500px) {\n" +
                "            .sim-actions {\n" +
                "                grid-template-columns: 1fr;\n" +
                "            }\n" +
                "        }\n" +
                "        .sim-btn {\n" +
                "            padding: 12px;\n" +
                "            border-radius: 6px;\n" +
                "            font-weight: 600;\n" +
                "            font-size: 14px;\n" +
                "            cursor: pointer;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            border: none;\n" +
                "            transition: all 0.2s;\n" +
                "            text-decoration: none;\n" +
                "        }\n" +
                "        .sim-success {\n" +
                "            background-color: #38a169;\n" +
                "            color: #ffffff;\n" +
                "            box-shadow: 0 3px 10px rgba(56, 161, 105, 0.2);\n" +
                "        }\n" +
                "        .sim-success:hover {\n" +
                "            background-color: #2f855a;\n" +
                "        }\n" +
                "        .sim-failure {\n" +
                "            background-color: #e53e3e;\n" +
                "            color: #ffffff;\n" +
                "            box-shadow: 0 3px 10px rgba(229, 62, 62, 0.2);\n" +
                "        }\n" +
                "        .sim-failure:hover {\n" +
                "            background-color: #c53030;\n" +
                "        }\n" +
                "        .secure-footer {\n" +
                "            background-color: #f7fafc;\n" +
                "            padding: 16px;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            font-size: 11px;\n" +
                "            color: #718096;\n" +
                "            font-weight: 600;\n" +
                "            border-top: 1px solid #edf2f7;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 0.5px;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"tricolor-bar\">\n" +
                "        <div class=\"bar-saffron\"></div>\n" +
                "        <div class=\"bar-white\"></div>\n" +
                "        <div class=\"bar-green\"></div>\n" +
                "    </div>\n" +
                "\n" +
                "    \n" +
                "    <div class=\"payment-box\">\n" +
                "        <div class=\"header\">\n" +
                "            <div class=\"logo-bhim\">\n" +
                "                <span class=\"upi-text\">UPI</span>\n" +
                "                <span class=\"bhim-text\">BHIM</span>\n" +
                "            </div>\n" +
                "            <div class=\"logo-npci\">NPCI</div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"main-content\">\n" +
                "            \n" +
                "            <div class=\"sidebar-tabs\">\n" +
                "                <button id=\"tab-upi\" class=\"tab-btn active\" onclick=\"switchTab('upi')\">BHIM UPI / QR</button>\n" +
                "                <button id=\"tab-card\" class=\"tab-btn\" onclick=\"switchTab('card')\">Credit / Debit Card</button>\n" +
                "                <button id=\"tab-nb\" class=\"tab-btn\" onclick=\"switchTab('nb')\">Net Banking</button>\n" +
                "                <button id=\"tab-wallet\" class=\"tab-btn\" onclick=\"switchTab('wallet')\">Digital Wallets</button>\n" +
                "            </div>\n" +
                "\n" +
                "            \n" +
                "            <div class=\"tab-details-container\">\n" +
                "                \n" +
                "                \n" +
                "                <div id=\"content-upi\" class=\"tab-content active\">\n" +
                "                    <div class=\"qr-section\">\n" +
                "                        <div style=\"flex: 1; display: flex; flex-direction: column; gap: 10px;\">\n" +
                "                            <span class=\"form-label\">Pay by UPI ID / VPA</span>\n" +
                "                            <div style=\"display: flex; gap: 8px;\">\n" +
                "                                <input type=\"text\" class=\"form-control\" style=\"margin-bottom: 0;\" placeholder=\"example@upi\" value=\"upyog@npci\">\n" +
                "                                <button class=\"btn-verify\" style=\"height: 44px; padding: 0 16px;\">Verify</button>\n" +
                "                            </div>\n" +
                "                            <p style=\"font-size: 11px; color: #718096;\">Enter your virtual payment address to send a payment request.</p>\n" +
                "                        </div>\n" +
                "                        <div class=\"qr-card\">\n" +
                "                            <div class=\"qr-wrapper\">\n" +
                "                                <svg class=\"qr-svg\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
                "                                    <rect width=\"100\" height=\"100\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"5\" y=\"5\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                                    <rect x=\"10\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"13\" y=\"13\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"70\" y=\"5\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                                    <rect x=\"75\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"78\" y=\"13\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"5\" y=\"70\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                                    <rect x=\"10\" y=\"75\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"13\" y=\"78\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"40\" y=\"40\" width=\"20\" height=\"20\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"45\" y=\"45\" width=\"10\" height=\"10\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"35\" y=\"10\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"45\" y=\"15\" width=\"10\" height=\"5\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"60\" y=\"25\" width=\"5\" height=\"15\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"10\" y=\"40\" width=\"15\" height=\"5\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"25\" y=\"50\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"40\" y=\"65\" width=\"15\" height=\"5\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"65\" y=\"50\" width=\"10\" height=\"15\" fill=\"#000000\"/>\n" +
                "                                    <rect x=\"80\" y=\"40\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                                </svg>\n" +
                "                                <div class=\"qr-logo\">UPI</div>\n" +
                "                            </div>\n" +
                "                            <span style=\"font-size: 10px; color: #718096; margin-top: 8px;\">Scan with GPay/PhonePe</span>\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "\n" +
                "                \n" +
                "                <div id=\"content-card\" class=\"tab-content\">\n" +
                "                    <span class=\"form-label\">Card Number</span>\n" +
                "                    <input type=\"text\" class=\"form-control\" placeholder=\"4111 2222 3333 4444\" value=\"4111 2222 3333 4444\">\n" +
                "                    \n" +
                "                    <div class=\"form-row\">\n" +
                "                        <div>\n" +
                "                            <span class=\"form-label\">Expiry Date</span>\n" +
                "                            <input type=\"text\" class=\"form-control\" placeholder=\"MM/YY\" value=\"12/30\">\n" +
                "                        </div>\n" +
                "                        <div>\n" +
                "                            <span class=\"form-label\">CVV</span>\n" +
                "                            <input type=\"password\" class=\"form-control\" placeholder=\"***\" value=\"123\">\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                    \n" +
                "                    <span class=\"form-label\">Cardholder Name</span>\n" +
                "                    <input type=\"text\" class=\"form-control\" placeholder=\"John Doe\" value=\"Sandbox Citizen\">\n" +
                "                </div>\n" +
                "\n" +
                "                \n" +
                "                <div id=\"content-nb\" class=\"tab-content\">\n" +
                "                    <span class=\"form-label\">Popular Banks</span>\n" +
                "                    <div class=\"bank-grid\">\n" +
                "                        <div class=\"bank-option active\" onclick=\"selectBank(this)\">SBI</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">HDFC</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">ICICI</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">Axis</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">Kotak</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">PNB</div>\n" +
                "                    </div>\n" +
                "                    <span class=\"form-label\">Or Select Other Bank</span>\n" +
                "                    <select class=\"form-control\">\n" +
                "                        <option>Choose your Bank</option>\n" +
                "                        <option>Bank of Baroda</option>\n" +
                "                        <option>Canara Bank</option>\n" +
                "                        <option>Union Bank of India</option>\n" +
                "                        <option>IDBI Bank</option>\n" +
                "                    </select>\n" +
                "                </div>\n" +
                "\n" +
                "                \n" +
                "                <div id=\"content-wallet\" class=\"tab-content\">\n" +
                "                    <span class=\"form-label\">Select Wallet</span>\n" +
                "                    <div class=\"bank-grid\" style=\"grid-template-columns: repeat(2, 1fr);\">\n" +
                "                        <div class=\"bank-option active\" onclick=\"selectBank(this)\">Paytm Wallet</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">PhonePe Wallet</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">Amazon Pay</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this)\">Mobikwik</div>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "\n" +
                "            \n" +
                "            <div class=\"summary-panel\">\n" +
                "                <h4 class=\"summary-title\">Order Summary</h4>\n" +
                "                \n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Merchant</span>\n" +
                "                    <span class=\"summary-value\">UPYOG DIGIT Services</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Transaction ID</span>\n" +
                "                    <span class=\"summary-value\" style=\"font-family: monospace; font-size: 11px;\">" + txnId + "</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Amount Payable</span>\n" +
                "                    <span class=\"summary-value amount\">₹ " + amount + "</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"timer-box\">\n" +
                "                    <span>⏱️ Expires in:</span>\n" +
                "                    <span class=\"timer-clock\" id=\"timer\">05:00</span>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"secure-footer\">\n" +
                "            🛡️ Secured by NPCI / Unified Payments Interface\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    \n" +
                "    <div class=\"sim-panel\">\n" +
                "        <h3 class=\"sim-title\">⚙️ Sandbox Simulation Panel</h3>\n" +
                "        <div class=\"sim-actions\">\n" +
                "            <a href=\"" + successUrl + "\" class=\"sim-btn sim-success\">\n" +
                "                Simulate Payment Success\n" +
                "            </a>\n" +
                "            <a href=\"" + failureUrl + "\" class=\"sim-btn sim-failure\">\n" +
                "                Simulate Payment Failure\n" +
                "            </a>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <script>\n" +
                "        // Switch tab functionality\n" +
                "        function switchTab(tabId) {\n" +
                "            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));\n" +
                "            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));\n" +
                "            \n" +
                "            document.getElementById('tab-' + tabId).classList.add('active');\n" +
                "            document.getElementById('content-' + tabId).classList.add('active');\n" +
                "        }\n" +
                "\n" +
                "        // Select item in grid\n" +
                "        function selectBank(element) {\n" +
                "            const parent = element.parentElement;\n" +
                "            parent.querySelectorAll('.bank-option').forEach(opt => opt.classList.remove('active'));\n" +
                "            element.classList.add('active');\n" +
                "        }\n" +
                "\n" +
                "        // Ticking countdown timer\n" +
                "        let time = 300;\n" +
                "        const timerElement = document.getElementById('timer');\n" +
                "        setInterval(() => {\n" +
                "            if (time > 0) {\n" +
                "                time--;\n" +
                "                const minutes = Math.floor(time / 60);\n" +
                "                const seconds = time % 60;\n" +
                "                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;\n" +
                "            }\n" +
                "        }, 1000);\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
    }
}