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
import org.springframework.web.bind.annotation.ResponseBody;

import java.net.URI;
import java.net.URLEncoder;

@Controller
@Slf4j
public class NpciMockPaymentController {

    @GetMapping(value = "/transaction/v1/npci/mock-payment", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String showMockPaymentPage(@RequestParam("txnId") String txnId,
                                      @RequestParam("amount") String amount,
                                      @RequestParam("callbackUrl") String callbackUrl) {
        
        log.info("NpciMockPaymentController: Showing mock payment page for txnId={}, amount={}", txnId, amount);

        String successUrl = "";
        String failureUrl = "";
        try {
            successUrl = "/pg-service/transaction/v1/npci/mock-payment/submit?txnId=" + txnId 
                    + "&status=SUCCESS&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");
            failureUrl = "/pg-service/transaction/v1/npci/mock-payment/submit?txnId=" + txnId 
                    + "&status=FAILURE&callbackUrl=" + URLEncoder.encode(callbackUrl, "UTF-8");
        } catch (Exception e) {
            log.error("NpciMockPaymentController: Failed to encode submit URLs", e);
            successUrl = "/pg-service/transaction/v1/npci/mock-payment/submit?txnId=" + txnId + "&status=SUCCESS&callbackUrl=" + callbackUrl;
            failureUrl = "/pg-service/transaction/v1/npci/mock-payment/submit?txnId=" + txnId + "&status=FAILURE&callbackUrl=" + callbackUrl;
        }

        return getHtmlTemplate(txnId, amount, successUrl, failureUrl);
    }

    @GetMapping("/transaction/v1/npci/mock-payment/submit")
    public ResponseEntity<Object> submitMockPayment(@RequestParam("txnId") String txnId,
                                                    @RequestParam("status") String status,
                                                    @RequestParam("callbackUrl") String callbackUrl) {
        
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
    }

    private String getHtmlTemplate(String txnId, String amount, String successUrl, String failureUrl) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>UPI Payment Portal</title>\n" +
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
                "            max-width: 760px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 12px;\n" +
                "            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);\n" +
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
                "            flex-wrap: wrap;\n" +
                "            padding: 30px 28px;\n" +
                "            gap: 30px;\n" +
                "        }\n" +
                "        .left-col {\n" +
                "            flex: 1 1 320px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 20px;\n" +
                "        }\n" +
                "        .right-col {\n" +
                "            flex: 1 1 300px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            border-left: 1px solid #edf2f7;\n" +
                "            padding-left: 30px;\n" +
                "        }\n" +
                "        @media (max-width: 700px) {\n" +
                "            .right-col {\n" +
                "                border-left: none;\n" +
                "                border-top: 1px solid #edf2f7;\n" +
                "                padding-left: 0;\n" +
                "                padding-top: 30px;\n" +
                "            }\n" +
                "        }\n" +
                "        .merchant-info {\n" +
                "            background-color: #f7fafc;\n" +
                "            border: 1px solid #edf2f7;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 16px;\n" +
                "        }\n" +
                "        .info-row {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            margin-bottom: 10px;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "        .info-row:last-child {\n" +
                "            margin-bottom: 0;\n" +
                "            padding-top: 10px;\n" +
                "            border-top: 1px dashed #e2e8f0;\n" +
                "        }\n" +
                "        .info-label {\n" +
                "            color: #718096;\n" +
                "            font-weight: 500;\n" +
                "        }\n" +
                "        .info-val {\n" +
                "            color: #2d3748;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .amount-val {\n" +
                "            font-size: 18px;\n" +
                "            color: #0c66c2;\n" +
                "            font-weight: 700;\n" +
                "        }\n" +
                "        .timer-box {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            gap: 12px;\n" +
                "            background-color: #fffaf0;\n" +
                "            border: 1px solid #feebc8;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 12px 16px;\n" +
                "            color: #dd6b20;\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .timer-clock {\n" +
                "            font-size: 16px;\n" +
                "            font-weight: 700;\n" +
                "            font-family: monospace;\n" +
                "        }\n" +
                "        .upi-input-section {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 10px;\n" +
                "            margin-top: 10px;\n" +
                "        }\n" +
                "        .input-group {\n" +
                "            display: flex;\n" +
                "            gap: 8px;\n" +
                "        }\n" +
                "        .upi-id-input {\n" +
                "            flex: 1;\n" +
                "            padding: 12px 16px;\n" +
                "            border: 1.5px solid #cbd5e1;\n" +
                "            border-radius: 6px;\n" +
                "            font-size: 14px;\n" +
                "            outline: none;\n" +
                "            transition: border-color 0.2s;\n" +
                "        }\n" +
                "        .upi-id-input:focus {\n" +
                "            border-color: #0c66c2;\n" +
                "        }\n" +
                "        .btn-verify {\n" +
                "            background-color: #0c66c2;\n" +
                "            color: #ffffff;\n" +
                "            border: none;\n" +
                "            padding: 0 20px;\n" +
                "            border-radius: 6px;\n" +
                "            font-weight: 600;\n" +
                "            font-size: 13px;\n" +
                "            cursor: pointer;\n" +
                "            transition: background-color 0.2s;\n" +
                "        }\n" +
                "        .btn-verify:hover {\n" +
                "            background-color: #094e96;\n" +
                "        }\n" +
                "        .qr-card {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .qr-title {\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 600;\n" +
                "            color: #4a5568;\n" +
                "            margin-bottom: 12px;\n" +
                "        }\n" +
                "        .qr-image-wrapper {\n" +
                "            background-color: #ffffff;\n" +
                "            padding: 16px;\n" +
                "            border: 1px solid #e2e8f0;\n" +
                "            border-radius: 12px;\n" +
                "            position: relative;\n" +
                "            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);\n" +
                "            margin-bottom: 16px;\n" +
                "        }\n" +
                "        .qr-svg {\n" +
                "            width: 160px;\n" +
                "            height: 160px;\n" +
                "        }\n" +
                "        .qr-logo {\n" +
                "            position: absolute;\n" +
                "            top: 50%;\n" +
                "            left: 50%;\n" +
                "            transform: translate(-50%, -50%);\n" +
                "            width: 32px;\n" +
                "            height: 32px;\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 6px;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            box-shadow: 0 2px 6px rgba(0,0,0,0.15);\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 800;\n" +
                "            color: #0c66c2;\n" +
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
                "        .sim-control-panel {\n" +
                "            width: 100%;\n" +
                "            max-width: 760px;\n" +
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
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"tricolor-bar\">\n" +
                "        <div class=\"bar-saffron\"></div>\n" +
                "        <div class=\"bar-white\"></div>\n" +
                "        <div class=\"bar-green\"></div>\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- Official Style Payment Gateway Page -->\n" +
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
                "            <div class=\"left-col\">\n" +
                "                <div class=\"merchant-info\">\n" +
                "                    <div class=\"info-row\">\n" +
                "                        <span class=\"info-label\">Merchant Name</span>\n" +
                "                        <span class=\"info-val\">UPYOG DIGIT Services</span>\n" +
                "                    </div>\n" +
                "                    <div class=\"info-row\">\n" +
                "                        <span class=\"info-label\">Transaction ID</span>\n" +
                "                        <span class=\"info-val\" style=\"font-family: monospace;\">" + txnId + "</span>\n" +
                "                    </div>\n" +
                "                    <div class=\"info-row\">\n" +
                "                        <span class=\"info-label\">Amount Payable</span>\n" +
                "                        <span class=\"info-val amount-val\">₹ " + amount + "</span>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"timer-box\">\n" +
                "                    <span>⏱️ Request expires in:</span>\n" +
                "                    <span class=\"timer-clock\" id=\"timer\">05:00</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <div class=\"upi-input-section\">\n" +
                "                    <span style=\"font-size: 13px; font-weight: 600; color: #4a5568;\">Pay by UPI ID / VPA</span>\n" +
                "                    <div class=\"input-group\">\n" +
                "                        <input type=\"text\" class=\"upi-id-input\" placeholder=\"example@upi\" value=\"upyog@npci\">\n" +
                "                        <button class=\"btn-verify\">Pay</button>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "\n" +
                "            <div class=\"right-col\">\n" +
                "                <div class=\"qr-card\">\n" +
                "                    <h2 class=\"qr-title\">Scan QR code to pay</h2>\n" +
                "                    <div class=\"qr-image-wrapper\">\n" +
                "                        <!-- Simulated QR Code SVG -->\n" +
                "                        <svg class=\"qr-svg\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
                "                            <rect width=\"100\" height=\"100\" fill=\"#ffffff\"/>\n" +
                "                            <rect x=\"5\" y=\"5\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                            <rect x=\"10\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                            <rect x=\"13\" y=\"13\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "                            \n" +
                "                            <rect x=\"70\" y=\"5\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                            <rect x=\"75\" y=\"10\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                            <rect x=\"78\" y=\"13\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "                            \n" +
                "                            <rect x=\"5\" y=\"70\" width=\"25\" height=\"25\" fill=\"#000000\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n" +
                "                            <rect x=\"10\" y=\"75\" width=\"15\" height=\"15\" fill=\"#ffffff\"/>\n" +
                "                            <rect x=\"13\" y=\"78\" width=\"9\" height=\"9\" fill=\"#000000\"/>\n" +
                "\n" +
                "                            <rect x=\"40\" y=\"40\" width=\"20\" height=\"20\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"45\" y=\"45\" width=\"10\" height=\"10\" fill=\"#ffffff\"/>\n" +
                "\n" +
                "                            <rect x=\"35\" y=\"10\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"45\" y=\"15\" width=\"10\" height=\"5\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"60\" y=\"25\" width=\"5\" height=\"15\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"10\" y=\"40\" width=\"15\" height=\"5\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"25\" y=\"50\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"40\" y=\"65\" width=\"15\" height=\"5\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"65\" y=\"50\" width=\"10\" height=\"15\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"80\" y=\"40\" width=\"5\" height=\"10\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"50\" y=\"80\" width=\"15\" height=\"5\" fill=\"#000000\"/>\n" +
                "                            <rect x=\"75\" y=\"70\" width=\"10\" height=\"10\" fill=\"#000000\"/>\n" +
                "                        </svg>\n" +
                "                        <div class=\"qr-logo\">UPI</div>\n" +
                "                    </div>\n" +
                "                    <span style=\"font-size: 11px; color: #718096;\">Scan using GPay, PhonePe, Paytm or BHIM App</span>\n" +
                "                </div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"secure-footer\">\n" +
                "            🛡️ Secured by NPCI / UPI\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- Sandbox Developer Control Panel -->\n" +
                "    <div class=\"sim-control-panel\">\n" +
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
                "        // Real-time ticking countdown timer\n" +
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
