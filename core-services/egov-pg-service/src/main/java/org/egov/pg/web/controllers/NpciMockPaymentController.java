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

import javax.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URLEncoder;
import java.util.Enumeration;

@Controller
@Slf4j
public class NpciMockPaymentController {

    @GetMapping(value = "/transaction/v1/_redirect")
    public Object handleMockPaymentOrSubmit(@RequestParam("txnId") String txnId,
                                            @RequestParam(value = "amount", required = false) String amount,
                                            @RequestParam("callbackUrl") String callbackUrl,
                                            @RequestParam(value = "status", required = false) String status,
                                            @RequestParam(value = "auth-token", required = false) String authToken,
                                            HttpServletRequest request) {

        // --- LOGGING ALL REQUEST DETAILS ---
        log.info("================ INCOMING _REDIRECT REQUEST ================");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Query String: {}", request.getQueryString());

        log.info("--- Headers ---");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            // Masking auth-tokens for security logs, but confirming existence
            if(headerName.equalsIgnoreCase("authorization") || headerName.equalsIgnoreCase("auth-token")) {
                log.info("{}: [PRESENT - LENGTH: {}]", headerName, request.getHeader(headerName).length());
            } else {
                log.info("{}: {}", headerName, request.getHeader(headerName));
            }
        }

        log.info("--- Extracted Params ---");
        log.info("txnId: {}", txnId);
        log.info("amount: {}", amount);
        log.info("status: {}", status);
        log.info("auth-token param present: {}", (authToken != null && !authToken.isEmpty()));
        log.info("============================================================");


        if (status != null && !status.isEmpty()) {
            log.info("NpciMockPaymentController: Submitted mock payment status '{}' for txnId={}", status, txnId);
            NpciGateway.MOCK_STATUSES.put(txnId, status);

            String separator = callbackUrl.contains("?") ? "&" : "?";
            String finalRedirectUrl = callbackUrl + separator + "eg_pg_txnid=" + txnId;

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setLocation(URI.create(finalRedirectUrl));
            return new ResponseEntity<>(httpHeaders, HttpStatus.FOUND);
        } else {
            String successUrl = "";
            String failureUrl = "";
            try {
                successUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=SUCCESS&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");
                failureUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=FAILURE&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");

                if (authToken != null && !authToken.isEmpty()) {
                    successUrl += "&auth-token=" + authToken;
                    failureUrl += "&auth-token=" + authToken;
                }
            } catch (Exception e) {
                successUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=SUCCESS&callbackUrl=" + callbackUrl;
                failureUrl = "/pg-service/transaction/v1/_redirect?txnId=" + txnId + "&status=FAILURE&callbackUrl=" + callbackUrl;
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
                "    <title>BHIM UPI - NPCI Secure Payment Gateway</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        :root {\n" +
                "            --primary: #0A3370;\n" +
                "            --secondary: #F37021;\n" +
                "            --text-dark: #1E293B;\n" +
                "            --text-muted: #64748B;\n" +
                "            --bg-light: #F8FAFC;\n" +
                "            --border-color: #E2E8F0;\n" +
                "            --success: #10B981;\n" +
                "            --danger: #EF4444;\n" +
                "        }\n" +
                "        * {\n" +
                "            box-sizing: border-box;\n" +
                "            margin: 0;\n" +
                "            padding: 0;\n" +
                "            font-family: 'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n" +
                "        }\n" +
                "        body {\n" +
                "            background: radial-gradient(circle at 50% 50%, #f1f5f9 0%, #e2e8f0 100%);\n" +
                "            color: var(--text-dark);\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 20px;\n" +
                "            position: relative;\n" +
                "        }\n" +
                "        .tricolor-bar {\n" +
                "            width: 100%;\n" +
                "            height: 4px;\n" +
                "            display: flex;\n" +
                "            position: absolute;\n" +
                "            top: 0;\n" +
                "            left: 0;\n" +
                "            z-index: 100;\n" +
                "        }\n" +
                "        .bar-saffron { flex: 1; background-color: #FF9933; }\n" +
                "        .bar-white { flex: 1; background-color: #FFFFFF; }\n" +
                "        .bar-green { flex: 1; background-color: #138808; }\n" +
                "\n" +
                "        /* Test mode banner */\n" +
                "        .sandbox-banner {\n" +
                "            background-color: #FEF3C7;\n" +
                "            color: #D97706;\n" +
                "            width: 100%;\n" +
                "            max-width: 900px;\n" +
                "            text-align: center;\n" +
                "            padding: 8px 16px;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 700;\n" +
                "            border-radius: 8px 8px 0 0;\n" +
                "            border: 1px solid #FDE68A;\n" +
                "            border-bottom: none;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            gap: 6px;\n" +
                "        }\n" +
                "\n" +
                "        .payment-box {\n" +
                "            width: 100%;\n" +
                "            max-width: 900px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 0 0 12px 12px;\n" +
                "            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);\n" +
                "            border: 1px solid var(--border-color);\n" +
                "            overflow: hidden;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "        }\n" +
                "        .header {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "            padding: 20px 30px;\n" +
                "            border-bottom: 1px solid #F1F5F9;\n" +
                "            background-color: #ffffff;\n" +
                "        }\n" +
                "        .logo-bhim {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 12px;\n" +
                "        }\n" +
                "        .logo-bhim svg {\n" +
                "            height: 32px;\n" +
                "        }\n" +
                "        .logo-npci {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        .logo-npci svg {\n" +
                "            height: 20px;\n" +
                "        }\n" +
                "        .main-content {\n" +
                "            display: flex;\n" +
                "            min-height: 440px;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .main-content {\n" +
                "                flex-direction: column;\n" +
                "            }\n" +
                "        }\n" +
                "        .sidebar-tabs {\n" +
                "            width: 240px;\n" +
                "            background-color: #F8FAFC;\n" +
                "            border-right: 1px solid #F1F5F9;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            padding: 12px 0;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .sidebar-tabs {\n" +
                "                width: 100%;\n" +
                "                border-right: none;\n" +
                "                border-bottom: 1px solid #F1F5F9;\n" +
                "                flex-direction: row;\n" +
                "                overflow-x: auto;\n" +
                "                padding: 0;\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-btn {\n" +
                "            padding: 16px 24px;\n" +
                "            text-align: left;\n" +
                "            background: none;\n" +
                "            border: none;\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "            color: var(--text-muted);\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s;\n" +
                "            border-left: 3px solid transparent;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 12px;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .tab-btn {\n" +
                "                border-left: none;\n" +
                "                border-bottom: 3px solid transparent;\n" +
                "                flex: 1;\n" +
                "                text-align: center;\n" +
                "                white-space: nowrap;\n" +
                "                justify-content: center;\n" +
                "                padding: 14px 16px;\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-btn:hover {\n" +
                "            background-color: #F1F5F9;\n" +
                "            color: var(--primary);\n" +
                "        }\n" +
                "        .tab-btn.active {\n" +
                "            background-color: #EEF2F6;\n" +
                "            color: var(--primary);\n" +
                "            border-left-color: var(--primary);\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .tab-btn.active {\n" +
                "                border-left-color: transparent;\n" +
                "                border-bottom-color: var(--primary);\n" +
                "            }\n" +
                "        }\n" +
                "        .tab-details-container {\n" +
                "            flex: 1;\n" +
                "            padding: 30px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            justify-content: center;\n" +
                "        }\n" +
                "        .tab-content {\n" +
                "            display: none;\n" +
                "            flex-direction: column;\n" +
                "            animation: fadeIn 0.3s ease-in-out;\n" +
                "        }\n" +
                "        .tab-content.active {\n" +
                "            display: flex;\n" +
                "        }\n" +
                "        @keyframes fadeIn {\n" +
                "            from { opacity: 0; transform: translateY(8px); }\n" +
                "            to { opacity: 1; transform: translateY(0); }\n" +
                "        }\n" +
                "\n" +
                "        /* Order summary side panel */\n" +
                "        .summary-panel {\n" +
                "            width: 280px;\n" +
                "            background-color: #F8FAFC;\n" +
                "            border-left: 1px solid var(--border-color);\n" +
                "            padding: 30px 24px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 20px;\n" +
                "        }\n" +
                "        @media (max-width: 768px) {\n" +
                "            .summary-panel {\n" +
                "                width: 100%;\n" +
                "                border-left: none;\n" +
                "                border-top: 1px solid var(--border-color);\n" +
                "            }\n" +
                "        }\n" +
                "        .summary-title {\n" +
                "            font-size: 11px;\n" +
                "            font-weight: 700;\n" +
                "            color: var(--text-muted);\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 1px;\n" +
                "            margin-bottom: 4px;\n" +
                "        }\n" +
                "        .summary-item {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 4px;\n" +
                "        }\n" +
                "        .summary-label {\n" +
                "            font-size: 11px;\n" +
                "            color: var(--text-muted);\n" +
                "            font-weight: 500;\n" +
                "        }\n" +
                "        .summary-value {\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "            color: var(--text-dark);\n" +
                "        }\n" +
                "        .summary-value.amount {\n" +
                "            font-size: 24px;\n" +
                "            font-weight: 800;\n" +
                "            color: var(--primary);\n" +
                "        }\n" +
                "        .timer-box {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            background-color: #FFFBEB;\n" +
                "            border: 1px solid #FDE68A;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 10px 14px;\n" +
                "            color: #D97706;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            margin-top: 10px;\n" +
                "        }\n" +
                "        .timer-clock {\n" +
                "            font-family: monospace;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 700;\n" +
                "        }\n" +
                "\n" +
                "        /* Inputs & Buttons */\n" +
                "        .form-label {\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            color: var(--text-dark);\n" +
                "            margin-bottom: 6px;\n" +
                "            display: block;\n" +
                "        }\n" +
                "        .form-control {\n" +
                "            width: 100%;\n" +
                "            padding: 12px 16px;\n" +
                "            border: 1.5px solid var(--border-color);\n" +
                "            border-radius: 8px;\n" +
                "            font-size: 14px;\n" +
                "            outline: none;\n" +
                "            transition: all 0.2s;\n" +
                "            background-color: #F8FAFC;\n" +
                "        }\n" +
                "        .form-control:focus {\n" +
                "            border-color: var(--primary);\n" +
                "            background-color: #FFFFFF;\n" +
                "            box-shadow: 0 0 0 3px rgba(10, 51, 112, 0.08);\n" +
                "        }\n" +
                "        .form-row {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 1fr 1fr;\n" +
                "            gap: 16px;\n" +
                "            margin-bottom: 16px;\n" +
                "        }\n" +
                "        .btn-pay {\n" +
                "            width: 100%;\n" +
                "            background-color: var(--primary);\n" +
                "            color: #ffffff;\n" +
                "            border: none;\n" +
                "            padding: 14px 20px;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 700;\n" +
                "            border-radius: 8px;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            box-shadow: 0 4px 12px rgba(10, 51, 112, 0.15);\n" +
                "        }\n" +
                "        .btn-pay:hover {\n" +
                "            background-color: #062350;\n" +
                "            transform: translateY(-1px);\n" +
                "            box-shadow: 0 6px 16px rgba(10, 51, 112, 0.25);\n" +
                "        }\n" +
                "        .btn-pay:active {\n" +
                "            transform: translateY(0);\n" +
                "        }\n" +
                "\n" +
                "        /* Realistic Interactive Credit Card */\n" +
                "        .card-preview-container {\n" +
                "            perspective: 1000px;\n" +
                "            margin-bottom: 24px;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "        }\n" +
                "        .credit-card-mock {\n" +
                "            width: 340px;\n" +
                "            height: 200px;\n" +
                "            transform-style: preserve-3d;\n" +
                "            transition: transform 0.6s;\n" +
                "            position: relative;\n" +
                "        }\n" +
                "        .credit-card-mock.flipped {\n" +
                "            transform: rotateY(180deg);\n" +
                "        }\n" +
                "        .card-face {\n" +
                "            position: absolute;\n" +
                "            width: 100%;\n" +
                "            height: 100%;\n" +
                "            backface-visibility: hidden;\n" +
                "            border-radius: 12px;\n" +
                "            padding: 20px;\n" +
                "            color: #ffffff;\n" +
                "            box-shadow: 0 10px 25px rgba(0,0,0,0.15);\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            justify-content: space-between;\n" +
                "            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);\n" +
                "        }\n" +
                "        .card-face.back {\n" +
                "            transform: rotateY(180deg);\n" +
                "            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n" +
                "            padding: 20px 0;\n" +
                "            justify-content: flex-start;\n" +
                "            gap: 15px;\n" +
                "        }\n" +
                "        .card-magnetic-stripe {\n" +
                "            width: 100%;\n" +
                "            height: 38px;\n" +
                "            background-color: #000000;\n" +
                "        }\n" +
                "        .card-signature-box {\n" +
                "            width: 80%;\n" +
                "            height: 30px;\n" +
                "            background-color: #ffffff;\n" +
                "            margin: 0 auto;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: flex-end;\n" +
                "            padding-right: 10px;\n" +
                "            color: #1e293b;\n" +
                "            font-weight: 700;\n" +
                "            font-style: italic;\n" +
                "        }\n" +
                "        .card-chip {\n" +
                "            width: 40px;\n" +
                "            height: 30px;\n" +
                "            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);\n" +
                "            border-radius: 4px;\n" +
                "        }\n" +
                "        .card-number-display {\n" +
                "            font-family: monospace;\n" +
                "            font-size: 20px;\n" +
                "            letter-spacing: 2px;\n" +
                "            margin-top: 15px;\n" +
                "        }\n" +
                "        .card-details-row {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: flex-end;\n" +
                "        }\n" +
                "        .card-holder-display {\n" +
                "            font-size: 13px;\n" +
                "            text-transform: uppercase;\n" +
                "            font-weight: 500;\n" +
                "            max-width: 70%;\n" +
                "            overflow: hidden;\n" +
                "            text-overflow: ellipsis;\n" +
                "            white-space: nowrap;\n" +
                "        }\n" +
                "        .card-expiry-display {\n" +
                "            font-family: monospace;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "\n" +
                "        /* Net banking popular list */\n" +
                "        .bank-grid {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: repeat(3, 1fr);\n" +
                "            gap: 12px;\n" +
                "            margin-bottom: 20px;\n" +
                "        }\n" +
                "        .bank-option {\n" +
                "            border: 1.5px solid var(--border-color);\n" +
                "            border-radius: 8px;\n" +
                "            padding: 16px 8px;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            text-align: center;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s;\n" +
                "            color: var(--text-dark);\n" +
                "            background-color: #F8FAFC;\n" +
                "        }\n" +
                "        .bank-option:hover, .bank-option.active {\n" +
                "            border-color: var(--primary);\n" +
                "            background-color: #EEF2F6;\n" +
                "            color: var(--primary);\n" +
                "            box-shadow: 0 4px 8px rgba(10,51,112,0.05);\n" +
                "        }\n" +
                "\n" +
                "        /* QR code section styling - Large & High Quality */\n" +
                "        .qr-section {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: space-between;\n" +
                "            gap: 30px;\n" +
                "            flex-wrap: wrap;\n" +
                "        }\n" +
                "        .qr-card {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            background-color: #F8FAFC;\n" +
                "            border-radius: 12px;\n" +
                "            padding: 24px;\n" +
                "            border: 1px solid var(--border-color);\n" +
                "            box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);\n" +
                "        }\n" +
                "        .qr-wrapper {\n" +
                "            background-color: #ffffff;\n" +
                "            padding: 16px;\n" +
                "            border: 1px solid var(--border-color);\n" +
                "            border-radius: 8px;\n" +
                "            position: relative;\n" +
                "            box-shadow: 0 4px 12px rgba(0,0,0,0.03);\n" +
                "        }\n" +
                "        .qr-svg {\n" +
                "            width: 180px;\n" +
                "            height: 180px;\n" +
                "        }\n" +
                "        .qr-logo {\n" +
                "            position: absolute;\n" +
                "            top: 50%;\n" +
                "            left: 50%;\n" +
                "            transform: translate(-50%, -50%);\n" +
                "            width: 38px;\n" +
                "            height: 38px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 8px;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            box-shadow: 0 3px 8px rgba(0,0,0,0.18);\n" +
                "            font-size: 11px;\n" +
                "            font-weight: 800;\n" +
                "            color: var(--primary);\n" +
                "        }\n" +
                "\n" +
                "        /* Fullscreen processing overlay */\n" +
                "        .processing-overlay {\n" +
                "            position: fixed;\n" +
                "            top: 0;\n" +
                "            left: 0;\n" +
                "            width: 100%;\n" +
                "            height: 100%;\n" +
                "            background-color: rgba(15, 23, 42, 0.95);\n" +
                "            z-index: 9999;\n" +
                "            display: none;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            color: #ffffff;\n" +
                "            text-align: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .spinner {\n" +
                "            width: 60px;\n" +
                "            height: 60px;\n" +
                "            border: 5px solid rgba(255, 255, 255, 0.1);\n" +
                "            border-top: 5px solid var(--secondary);\n" +
                "            border-radius: 50%;\n" +
                "            animation: spin 1s linear infinite;\n" +
                "            margin-bottom: 24px;\n" +
                "        }\n" +
                "        @keyframes spin {\n" +
                "            0% { transform: rotate(0deg); }\n" +
                "            100% { transform: rotate(360deg); }\n" +
                "        }\n" +
                "        .processing-status {\n" +
                "            font-size: 18px;\n" +
                "            font-weight: 700;\n" +
                "            margin-bottom: 10px;\n" +
                "            letter-spacing: 0.5px;\n" +
                "        }\n" +
                "        .processing-desc {\n" +
                "            font-size: 14px;\n" +
                "            color: #94A3B8;\n" +
                "        }\n" +
                "\n" +
                "        /* Beautiful Sandbox Simulator Card */\n" +
                "        .sandbox-controls-card {\n" +
                "            width: 100%;\n" +
                "            max-width: 900px;\n" +
                "            margin-top: 24px;\n" +
                "            background: #FFFFFF;\n" +
                "            border-radius: 12px;\n" +
                "            border: 1px solid var(--border-color);\n" +
                "            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);\n" +
                "            padding: 24px 30px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "        }\n" +
                "        .sandbox-controls-title {\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 700;\n" +
                "            color: var(--text-dark);\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            margin-bottom: 8px;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 0.5px;\n" +
                "        }\n" +
                "        .sandbox-buttons-container {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 1fr 1fr;\n" +
                "            gap: 16px;\n" +
                "        }\n" +
                "        @media (max-width: 500px) {\n" +
                "            .sandbox-buttons-container {\n" +
                "                grid-template-columns: 1fr;\n" +
                "            }\n" +
                "        }\n" +
                "        .sandbox-btn {\n" +
                "            padding: 14px 20px;\n" +
                "            border-radius: 8px;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 700;\n" +
                "            cursor: pointer;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            gap: 10px;\n" +
                "            border: none;\n" +
                "            transition: all 0.2s;\n" +
                "            text-decoration: none;\n" +
                "        }\n" +
                "        .sandbox-btn-success {\n" +
                "            background-color: var(--success);\n" +
                "            color: #FFFFFF;\n" +
                "            box-shadow: 0 4px 12 rgba(16, 185, 129, 0.15);\n" +
                "        }\n" +
                "        .sandbox-btn-success:hover {\n" +
                "            background-color: #059669;\n" +
                "            transform: translateY(-1px);\n" +
                "            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);\n" +
                "        }\n" +
                "        .sandbox-btn-failure {\n" +
                "            background-color: var(--danger);\n" +
                "            color: #FFFFFF;\n" +
                "            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);\n" +
                "        }\n" +
                "        .sandbox-btn-failure:hover {\n" +
                "            background-color: #DC2626;\n" +
                "            transform: translateY(-1px);\n" +
                "            box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);\n" +
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
                "    <div class=\"sandbox-banner\">\n" +
                "        ⚠️ NPCI Secure Payment Gateway - Test Environment (No Real Money Debited)\n" +
                "    </div>\n" +
                "    <div class=\"payment-box\">\n" +
                "        <div class=\"header\">\n" +
                "            <div class=\"logo-bhim\">\n" +
                "                <svg viewBox=\"0 0 160 50\">\n" +
                "                    <path d=\"M22.5 13.5h7.2c2.4 0 4.3.5 5.6 1.6 1.3 1.1 2 2.7 2 4.9 0 1.6-.4 2.9-1.3 3.8-.9.9-2.1 1.4-3.6 1.6v.1c1.8.2 3.1.8 4.1 1.9 1 1 1.5 2.5 1.5 4.3 0 2.4-.7 4.2-2.1 5.3-1.4 1.1-3.4 1.7-5.9 1.7H22.5V13.5zm6.5 10.3c1.2 0 2.1-.2 2.7-.7.6-.5.9-1.2.9-2.3 0-1.1-.3-1.8-.9-2.3-.6-.5-1.5-.7-2.7-.7h-2.5v6h2.5zm.7 10.7c1.3 0 2.3-.3 2.9-.8.6-.6.9-1.4.9-2.6 0-1.2-.3-2-.9-2.6-.6-.6-1.6-.8-2.9-.8h-3.2v6.8H29.7zM42.5 13.5H47v9.4h6.4V13.5h4.5v25.2h-4.5V27H47v11.7h-4.5V13.5zM61.8 13.5h4.5v25.2h-4.5zM71 13.5h5.5l5.2 12.8 5.2-12.8H92.4v25.2H87.9V21.6l-5.6 13.5h-2.3L74.4 21.6v17.1H71V13.5z\" fill=\"#0A3370\"/>\n" +
                "                    <path d=\"M112 12.5h-5.2l-1.5-6h13.4l-1.5 6h-5.2V32h-5.2V12.5zm16 19.5h-5.2V6.5h5.2V32zm16.5-12.8l-3 6.3V32H136V25.7l-3-6.3V6.5h5.2v8.5l3.8-8.5h5.2l-4.7 9.8z\" fill=\"#F37021\"/>\n" +
                "                </svg>\n" +
                "            </div>\n" +
                "            <div class=\"logo-npci\">\n" +
                "                <svg viewBox=\"0 0 100 24\">\n" +
                "                    <text x=\"0\" y=\"18\" font-family=\"'Inter'\" font-weight=\"800\" font-size=\"14\" fill=\"#64748B\" letter-spacing=\"1.5\">NPCI</text>\n" +
                "                </svg>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"main-content\">\n" +
                "            <div class=\"sidebar-tabs\">\n" +
                "                <button id=\"tab-upi\" class=\"tab-btn active\" onclick=\"switchTab('upi')\">\n" +
                "                    <span>⚡</span> BHIM UPI / QR\n" +
                "                </button>\n" +
                "                <button id=\"tab-card\" class=\"tab-btn\" onclick=\"switchTab('card')\">\n" +
                "                    <span>💳</span> Cards (Credit/Debit)\n" +
                "                </button>\n" +
                "                <button id=\"tab-nb\" class=\"tab-btn\" onclick=\"switchTab('nb')\">\n" +
                "                    <span>🏦</span> Net Banking\n" +
                "                </button>\n" +
                "                <button id=\"tab-wallet\" class=\"tab-btn\" onclick=\"switchTab('wallet')\">\n" +
                "                    <span>👜</span> Wallets\n" +
                "                </button>\n" +
                "            </div>\n" +
                "\n" +
                "            <div class=\"tab-details-container\">\n" +
                "                <!-- BHIM UPI TAB -->\n" +
                "                <div id=\"content-upi\" class=\"tab-content active\">\n" +
                "                    <div class=\"qr-section\">\n" +
                "                        <div style=\"flex: 1; display: flex; flex-direction: column; gap: 10px;\">\n" +
                "                            <span class=\"form-label\">Pay by UPI ID / VPA</span>\n" +
                "                            <div style=\"display: flex; gap: 8px; margin-bottom: 12px;\">\n" +
                "                                <input type=\"text\" id=\"upi-id\" class=\"form-control\" style=\"margin-bottom: 0;\" placeholder=\"enter VPA address\" value=\"paying-citizen@upi\">\n" +
                "                            </div>\n" +
                "                            <p style=\"font-size: 12px; color: var(--text-muted); line-height: 1.4;\">Example: Enter your VPA address (e.g. name@upi) and complete transaction using controls below.</p>\n" +
                "                        </div>\n" +
                "                        <div class=\"qr-card\">\n" +
                "                            <div class=\"qr-wrapper\">\n" +
                "                                <svg class=\"qr-svg\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
                "                                    <rect width=\"100\" height=\"100\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"5\" y=\"5\" width=\"25\" height=\"25\" fill=\"#0A3370\"/>\n" +
                "                                    <rect x=\"10\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"13\" y=\"13\" width=\"9\" height=\"9\" fill=\"#0A3370\"/>\n" +
                "                                    <rect x=\"70\" y=\"5\" width=\"25\" height=\"25\" fill=\"#0A3370\"/>\n" +
                "                                    <rect x=\"75\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"78\" y=\"13\" width=\"9\" height=\"9\" fill=\"#0A3370\"/>\n" +
                "                                    <rect x=\"5\" y=\"70\" width=\"25\" height=\"25\" fill=\"#0A3370\"/>\n" +
                "                                    <rect x=\"10\" y=\"75\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                                    <rect x=\"13\" y=\"78\" width=\"9\" height=\"9\" fill=\"#0A3370\"/>\n" +
                "                                    <path d=\"M 35,5 h 5 v 5 h -5 z M 45,5 h 10 v 5 h -10 z M 60,5 h 5 v 5 h -5 z M 35,12 h 8 v 5 h -8 z M 48,12 h 5 v 5 h -5 z M 58,12 h 8 v 5 h -8 z M 35,20 h 5 v 8 h -5 z M 44,20 h 12 v 5 h -12 z M 60,20 h 5 v 5 h -5 z M 5,35 h 15 v 5 h -15 z M 25,35 h 10 v 5 h -10 z M 40,35 h 20 v 5 h -20 z M 65,35 h 10 v 5 h -10 z M 80,35 h 15 v 5 h -15 z M 5,44 h 8 v 5 h -8 z M 18,44 h 5 v 5 h -5 z M 28,44 h 12 v 5 h -12 z M 45,44 h 5 v 5 h -5 z M 55,44 h 8 v 5 h -8 z M 68,44 h 12 v 5 h -12 z M 85,44 h 10 v 5 h -10 z M 5,53 h 12 v 5 h -12 z M 22,53 h 8 v 5 h -8 z M 35,53 h 5 v 5 h -5 z M 45,53 h 15 v 5 h -15 z M 65,53 h 5 v 5 h -5 z M 75,53 h 10 v 5 h -10 z M 90,53 h 5 v 5 h -5 z M 35,62 h 12 v 5 h -12 z M 52,62 h 8 v 5 h -8 z M 65,62 h 15 v 5 h -15 z M 85,62 h 10 v 5 h -10 z M 35,70 h 5 v 15 h -5 z M 45,70 h 15 v 5 h -15 z M 65,70 h 5 v 5 h -5 z M 75,70 h 8 v 5 h -8 z M 88,70 h 7 v 5 h -7 z M 45,78 h 8 v 5 h -8 z M 58,78 h 12 v 5 h -12 z M 75,78 h 5 v 5 h -5 z M 85,78 h 10 v 5 h -10 z M 40,86 h 15 v 5 h -15 z M 60,86 h 5 v 5 h -5 z M 70,86 h 12 v 5 h -12 z M 85,86 h 10 v 5 h -10 z\" fill=\"#0A3370\"/>\n" +
                "                                </svg>\n" +
                "                                <div class=\"qr-logo\">UPI</div>\n" +
                "                            </div>\n" +
                "                            <span style=\"font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 8px;\">Scan with GPay/PhonePe/BHIM</span>\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                    <button class=\"btn-pay\" style=\"margin-top: 24px;\" onclick=\"triggerSimulation('success')\">\n" +
                "                        Verify & Pay ₹ " + amount + "\n" +
                "                    </button>\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- CARD TAB -->\n" +
                "                <div id=\"content-card\" class=\"tab-content\">\n" +
                "                    <div class=\"card-preview-container\">\n" +
                "                        <div class=\"credit-card-mock\" id=\"card-element\">\n" +
                "                            <div class=\"card-face\">\n" +
                "                                <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n" +
                "                                    <div class=\"card-chip\"></div>\n" +
                "                                    <span style=\"font-weight: 700; font-size: 18px; font-style: italic;\">DEBIT</span>\n" +
                "                                </div>\n" +
                "                                <div class=\"card-number-display\" id=\"prev-card-num\">•••• •••• •••• ••••</div>\n" +
                "                                <div class=\"card-details-row\">\n" +
                "                                    <div class=\"card-holder-display\" id=\"prev-card-name\">YOUR NAME</div>\n" +
                "                                    <div class=\"card-expiry-display\" id=\"prev-card-exp\">MM/YY</div>\n" +
                "                                </div>\n" +
                "                            </div>\n" +
                "                            <div class=\"card-face back\">\n" +
                "                                <div class=\"card-magnetic-stripe\"></div>\n" +
                "                                <div class=\"card-signature-box\" id=\"prev-card-cvv\">•••</div>\n" +
                "                                <div style=\"padding: 0 20px; font-size: 10px; opacity: 0.6; text-align: center;\">\n" +
                "                                    This card is for testing purposes only. Do not share raw real credentials.\n" +
                "                                </div>\n" +
                "                            </div>\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "\n" +
                "                    <span class=\"form-label\">Card Number</span>\n" +
                "                    <input type=\"text\" id=\"card-num\" class=\"form-control\" style=\"margin-bottom: 12px;\" placeholder=\"4111 2222 3333 4444\" maxlength=\"19\" oninput=\"updateCardNum(this)\" onfocus=\"flipCard(false)\">\n" +
                "                    \n" +
                "                    <div class=\"form-row\">\n" +
                "                        <div>\n" +
                "                            <span class=\"form-label\">Expiry Date</span>\n" +
                "                            <input type=\"text\" id=\"card-exp\" class=\"form-control\" placeholder=\"MM/YY\" maxlength=\"5\" oninput=\"updateCardExp(this)\" onfocus=\"flipCard(false)\">\n" +
                "                        </div>\n" +
                "                        <div>\n" +
                "                            <span class=\"form-label\">CVV</span>\n" +
                "                            <input type=\"password\" id=\"card-cvv\" class=\"form-control\" placeholder=\"***\" maxlength=\"3\" oninput=\"updateCardCvv(this)\" onfocus=\"flipCard(true)\" onblur=\"flipCard(false)\">\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                    \n" +
                "                    <span class=\"form-label\">Cardholder Name</span>\n" +
                "                    <input type=\"text\" id=\"card-name\" class=\"form-control\" style=\"margin-bottom: 20px;\" placeholder=\"ANIL KUMAR\" oninput=\"updateCardName(this)\" onfocus=\"flipCard(false)\">\n" +
                "\n" +
                "                    <button class=\"btn-pay\" onclick=\"triggerSimulation('success')\">\n" +
                "                        Pay Securely ₹ " + amount + "\n" +
                "                    </button>\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- NET BANKING TAB -->\n" +
                "                <div id=\"content-nb\" class=\"tab-content\">\n" +
                "                    <span class=\"form-label\" style=\"margin-bottom: 12px;\">Popular Banks</span>\n" +
                "                    <div class=\"bank-grid\">\n" +
                "                        <div class=\"bank-option active\" onclick=\"selectBank(this, 'SBI')\">State Bank of India</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'HDFC')\">HDFC Bank</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'ICICI')\">ICICI Bank</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'Axis')\">Axis Bank</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'Kotak')\">Kotak Mahindra</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'PNB')\">Punjab National Bank</div>\n" +
                "                    </div>\n" +
                "                    <span class=\"form-label\">Or Select Other Bank</span>\n" +
                "                    <select id=\"bank-select\" class=\"form-control\" style=\"margin-bottom: 24px;\" onchange=\"deactivateGrid()\">\n" +
                "                        <option value=\"\">Choose your Bank</option>\n" +
                "                        <option value=\"BOB\">Bank of Baroda</option>\n" +
                "                        <option value=\"CANARA\">Canara Bank</option>\n" +
                "                        <option value=\"UNION\">Union Bank of India</option>\n" +
                "                        <option value=\"IDBI\">IDBI Bank</option>\n" +
                "                    </select>\n" +
                "\n" +
                "                    <button class=\"btn-pay\" onclick=\"triggerSimulation('success')\">\n" +
                "                        Proceed to Net Banking ₹ " + amount + "\n" +
                "                    </button>\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- WALLETS TAB -->\n" +
                "                <div id=\"content-wallet\" class=\"tab-content\">\n" +
                "                    <span class=\"form-label\" style=\"margin-bottom: 12px;\">Select Wallet</span>\n" +
                "                    <div class=\"bank-grid\" style=\"grid-template-columns: repeat(2, 1fr); margin-bottom: 24px;\">\n" +
                "                        <div class=\"bank-option active\" onclick=\"selectBank(this, 'Paytm')\">Paytm Wallet</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'PhonePe')\">PhonePe Wallet</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'AmazonPay')\">Amazon Pay</div>\n" +
                "                        <div class=\"bank-option\" onclick=\"selectBank(this, 'Mobikwik')\">Mobikwik</div>\n" +
                "                    </div>\n" +
                "                    <button class=\"btn-pay\" onclick=\"triggerSimulation('success')\">\n" +
                "                        Link & Pay ₹ " + amount + "\n" +
                "                    </button>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "\n" +
                "            <!-- ORDER SUMMARY PANEL -->\n" +
                "            <div class=\"summary-panel\">\n" +
                "                <h4 class=\"summary-title\">Order Details</h4>\n" +
                "                \n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Merchant name</span>\n" +
                "                    <span class=\"summary-value\">UPYOG DIGIT Municipal Portal</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Merchant Transaction ID</span>\n" +
                "                    <span class=\"summary-value\" style=\"font-family: monospace; font-size: 11px; word-break: break-all;\">" + txnId + "</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"summary-item\">\n" +
                "                    <span class=\"summary-label\">Amount to Pay</span>\n" +
                "                    <span class=\"summary-value amount\">₹ " + amount + "</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"timer-box\">\n" +
                "                    <span>⏱️ Session expires in:</span>\n" +
                "                    <span class=\"timer-clock\" id=\"timer\">05:00</span>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"secure-footer-text\">\n" +
                "            🛡️ 256-Bit SSL Encrypted Verification | Powered by BHIM UPI & NPCI\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- OPEN DUAL SIMULATION PANEL AT BOTTOM -->\n" +
                "    <div class=\"sandbox-controls-card\">\n" +
                "        <div class=\"sandbox-controls-title\">\n" +
                "            <span>🛡️</span> NPCI Secure Transaction Settlement Console\n" +
                "        </div>\n" +
                "        <p style=\"font-size: 12px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.4;\">\n" +
                "            Choose an action below to authorize or decline this payment. This simulates immediate callback communication with the merchant platform.\n" +
                "        </p>\n" +
                "        <div class=\"sandbox-buttons-container\">\n" +
                "            <button class=\"sandbox-btn sandbox-btn-success\" onclick=\"triggerSimulation('success')\">\n" +
                "                ✅ Approve Transaction (SUCCESS)\n" +
                "            </button>\n" +
                "            <button class=\"sandbox-btn sandbox-btn-failure\" onclick=\"triggerSimulation('failure')\">\n" +
                "                ❌ Decline Transaction (FAILURE)\n" +
                "            </button>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- PROCESSING LOADER OVERLAY -->\n" +
                "    <div class=\"processing-overlay\" id=\"processing-overlay\">\n" +
                "        <div class=\"spinner\"></div>\n" +
                "        <div class=\"processing-status\" id=\"proc-status\">Connecting to NPCI Secures...</div>\n" +
                "        <div class=\"processing-desc\" id=\"proc-desc\">Contacting BHIM UPI processing network...</div>\n" +
                "    </div>\n" +
                "\n" +
                "    <script>\n" +
                "        // Tab switching\n" +
                "        function switchTab(tabId) {\n" +
                "            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));\n" +
                "            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));\n" +
                "            \n" +
                "            document.getElementById('tab-' + tabId).classList.add('active');\n" +
                "            document.getElementById('content-' + tabId).classList.add('active');\n" +
                "        }\n" +
                "\n" +
                "        // Select item in bank grid\n" +
                "        function selectBank(element, bankName) {\n" +
                "            const parent = element.parentElement;\n" +
                "            parent.querySelectorAll('.bank-option').forEach(opt => opt.classList.remove('active'));\n" +
                "            element.classList.add('active');\n" +
                "            document.getElementById('bank-select').value = \"\";\n" +
                "        }\n" +
                "        \n" +
                "        function deactivateGrid() {\n" +
                "            document.querySelectorAll('.bank-option').forEach(opt => opt.classList.remove('active'));\n" +
                "        }\n" +
                "\n" +
                "        // Card Mock Interactivity\n" +
                "        function flipCard(shouldFlip) {\n" +
                "            const card = document.getElementById('card-element');\n" +
                "            if (shouldFlip) {\n" +
                "                card.classList.add('flipped');\n" +
                "            } else {\n" +
                "                card.classList.remove('flipped');\n" +
                "            }\n" +
                "        }\n" +
                "\n" +
                "        function updateCardNum(input) {\n" +
                "            // Format card number with spaces\n" +
                "            let v = input.value.replace(/\\s+/g, '').replace(/[^0-9]/gi, '');\n" +
                "            let matches = v.match(/\\d{4,16}/g);\n" +
                "            let match = matches && matches[0] || '';\n" +
                "            let parts = [];\n" +
                "\n" +
                "            for (let i=0, len=match.length; i<len; i+=4) {\n" +
                "                parts.push(match.substring(i, i+4));\n" +
                "            }\n" +
                "\n" +
                "            if (parts.length > 0) {\n" +
                "                input.value = parts.join(' ');\n" +
                "            } else {\n" +
                "                input.value = v;\n" +
                "            }\n" +
                "            document.getElementById('prev-card-num').textContent = input.value || '•••• •••• •••• ••••';\n" +
                "        }\n" +
                "\n" +
                "        function updateCardName(input) {\n" +
                "            document.getElementById('prev-card-name').textContent = input.value.toUpperCase() || 'YOUR NAME';\n" +
                "        }\n" +
                "\n" +
                "        function updateCardExp(input) {\n" +
                "            let v = input.value.replace(/\\s+/g, '').replace(/[^0-9]/gi, '');\n" +
                "            if (v.length >= 2) {\n" +
                "                input.value = v.substring(0,2) + '/' + v.substring(2,4);\n" +
                "            }\n" +
                "            document.getElementById('prev-card-exp').textContent = input.value || 'MM/YY';\n" +
                "        }\n" +
                "\n" +
                "        function updateCardCvv(input) {\n" +
                "            let val = input.value.replace(/[^0-9]/g, '');\n" +
                "            document.getElementById('prev-card-cvv').textContent = '•'.repeat(val.length) || '•••';\n" +
                "        }\n" +
                "\n" +
                "        // Trigger payment processing animation and redirect\n" +
                "        function triggerSimulation(outcome) {\n" +
                "            const overlay = document.getElementById('processing-overlay');\n" +
                "            const statusText = document.getElementById('proc-status');\n" +
                "            const descText = document.getElementById('proc-desc');\n" +
                "            \n" +
                "            overlay.style.display = 'flex';\n" +
                "            \n" +
                "            const steps = [\n" +
                "                { time: 0, status: \"Initiating secure transaction...\", desc: \"Setting up merchant channel link\" },\n" +
                "                { time: 30, status: \"Contacting core payment infrastructure...\", desc: \"Securing BHIM routing paths\" },\n" +
                "                { time: 65, status: \"Awaiting bank settlement authorization...\", desc: \"Authenticating transaction tokens\" }\n" +
                "            ];\n" +
                "            \n" +
                "            steps.forEach(step => {\n" +
                "                setTimeout(() => {\n" +
                "                    statusText.textContent = step.status;\n" +
                "                    descText.textContent = step.desc;\n" +
                "                }, 3000 * (step.time / 100));\n" +
                "            });\n" +
                "            \n" +
                "            setTimeout(() => {\n" +
                "                if (outcome === 'success') {\n" +
                "                    window.location.href = \"" + successUrl + "\";\n" +
                "                } else {\n" +
                "                    window.location.href = \"" + failureUrl + "\";\n" +
                "                }\n" +
                "            }, 3000);\n" +
                "        }\n" +
                "\n" +
                "        // Countdown Timer\n" +
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