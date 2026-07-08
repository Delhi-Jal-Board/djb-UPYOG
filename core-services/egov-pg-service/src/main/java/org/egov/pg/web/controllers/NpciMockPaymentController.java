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
                "    <title>NPCI Payment Gateway Simulator</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        * {\n" +
                "            box-sizing: border-box;\n" +
                "            margin: 0;\n" +
                "            padding: 0;\n" +
                "            font-family: 'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n" +
                "        }\n" +
                "        body {\n" +
                "            background: radial-gradient(circle at top right, #0e1e35 0%, #060a12 100%);\n" +
                "            color: #ffffff;\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .container {\n" +
                "            width: 100%;\n" +
                "            max-width: 480px;\n" +
                "            background: rgba(255, 255, 255, 0.03);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.08);\n" +
                "            border-radius: 24px;\n" +
                "            padding: 28px 24px;\n" +
                "            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);\n" +
                "            backdrop-filter: blur(20px);\n" +
                "        }\n" +
                "        .header {\n" +
                "            text-align: center;\n" +
                "            margin-bottom: 20px;\n" +
                "        }\n" +
                "        .logo-container {\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            margin-bottom: 8px;\n" +
                "        }\n" +
                "        .logo-text {\n" +
                "            font-size: 22px;\n" +
                "            font-weight: 700;\n" +
                "            letter-spacing: 0.5px;\n" +
                "            background: linear-gradient(135deg, #3b82f6, #60a5fa);\n" +
                "            -webkit-background-clip: text;\n" +
                "            -webkit-text-fill-color: transparent;\n" +
                "        }\n" +
                "        .badge {\n" +
                "            background: rgba(59, 130, 246, 0.15);\n" +
                "            color: #60a5fa;\n" +
                "            border: 1px solid rgba(59, 130, 246, 0.3);\n" +
                "            padding: 3px 8px;\n" +
                "            border-radius: 12px;\n" +
                "            font-size: 10px;\n" +
                "            font-weight: 600;\n" +
                "            text-transform: uppercase;\n" +
                "        }\n" +
                "        .subtitle {\n" +
                "            font-size: 13px;\n" +
                "            color: #9ca3af;\n" +
                "        }\n" +
                "        .txn-card {\n" +
                "            background: rgba(255, 255, 255, 0.02);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.05);\n" +
                "            border-radius: 16px;\n" +
                "            padding: 16px;\n" +
                "            margin-bottom: 20px;\n" +
                "        }\n" +
                "        .txn-row {\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            margin-bottom: 8px;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "        .txn-row:last-child {\n" +
                "            margin-bottom: 0;\n" +
                "            padding-top: 8px;\n" +
                "            border-top: 1px dashed rgba(255, 255, 255, 0.1);\n" +
                "        }\n" +
                "        .label {\n" +
                "            color: #9ca3af;\n" +
                "        }\n" +
                "        .value {\n" +
                "            color: #e5e7eb;\n" +
                "            font-weight: 500;\n" +
                "        }\n" +
                "        .amount {\n" +
                "            font-size: 18px;\n" +
                "            font-weight: 700;\n" +
                "            color: #60a5fa;\n" +
                "        }\n" +
                "        .tabs {\n" +
                "            display: flex;\n" +
                "            background: rgba(255, 255, 255, 0.05);\n" +
                "            padding: 4px;\n" +
                "            border-radius: 12px;\n" +
                "            margin-bottom: 20px;\n" +
                "            gap: 4px;\n" +
                "        }\n" +
                "        .tab-btn {\n" +
                "            flex: 1;\n" +
                "            padding: 10px;\n" +
                "            border: none;\n" +
                "            background: transparent;\n" +
                "            color: #9ca3af;\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 600;\n" +
                "            border-radius: 8px;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s ease;\n" +
                "        }\n" +
                "        .tab-btn.active {\n" +
                "            background: rgba(255, 255, 255, 0.1);\n" +
                "            color: #ffffff;\n" +
                "            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\n" +
                "        }\n" +
                "        .tab-content {\n" +
                "            display: none;\n" +
                "            min-height: 180px;\n" +
                "            animation: fadeIn 0.3s ease;\n" +
                "        }\n" +
                "        .tab-content.active {\n" +
                "            display: block;\n" +
                "        }\n" +
                "        @keyframes fadeIn {\n" +
                "            from { opacity: 0; transform: translateY(4px); }\n" +
                "            to { opacity: 1; transform: translateY(0); }\n" +
                "        }\n" +
                "        .qr-container {\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 10px;\n" +
                "        }\n" +
                "        .qr-box {\n" +
                "            background: #ffffff;\n" +
                "            padding: 12px;\n" +
                "            border-radius: 12px;\n" +
                "            margin-bottom: 12px;\n" +
                "            box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n" +
                "        }\n" +
                "        .qr-placeholder {\n" +
                "            width: 140px;\n" +
                "            height: 140px;\n" +
                "            background: #f3f4f6;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            border: 2px dashed #cbd5e1;\n" +
                "            border-radius: 8px;\n" +
                "            color: #475569;\n" +
                "        }\n" +
                "        .input-group {\n" +
                "            margin-bottom: 16px;\n" +
                "            text-align: left;\n" +
                "        }\n" +
                "        .input-group label {\n" +
                "            display: block;\n" +
                "            font-size: 12px;\n" +
                "            color: #9ca3af;\n" +
                "            margin-bottom: 6px;\n" +
                "        }\n" +
                "        .input-control {\n" +
                "            width: 100%;\n" +
                "            padding: 12px 16px;\n" +
                "            background: rgba(255, 255, 255, 0.05);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.1);\n" +
                "            border-radius: 10px;\n" +
                "            color: #ffffff;\n" +
                "            font-size: 14px;\n" +
                "            transition: all 0.2s ease;\n" +
                "        }\n" +
                "        .input-control:focus {\n" +
                "            outline: none;\n" +
                "            border-color: #3b82f6;\n" +
                "            background: rgba(255, 255, 255, 0.08);\n" +
                "        }\n" +
                "        .row-grid {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: 1fr 1fr;\n" +
                "            gap: 12px;\n" +
                "        }\n" +
                "        .bank-grid {\n" +
                "            display: grid;\n" +
                "            grid-template-columns: repeat(3, 1fr);\n" +
                "            gap: 8px;\n" +
                "            margin-bottom: 16px;\n" +
                "        }\n" +
                "        .bank-option {\n" +
                "            background: rgba(255, 255, 255, 0.03);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.08);\n" +
                "            border-radius: 10px;\n" +
                "            padding: 12px 6px;\n" +
                "            font-size: 11px;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s ease;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .bank-option:hover, .bank-option.selected {\n" +
                "            background: rgba(59, 130, 246, 0.1);\n" +
                "            border-color: #3b82f6;\n" +
                "            color: #60a5fa;\n" +
                "        }\n" +
                "        .actions {\n" +
                "            margin-top: 24px;\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            gap: 10px;\n" +
                "        }\n" +
                "        .btn {\n" +
                "            width: 100%;\n" +
                "            padding: 12px;\n" +
                "            border-radius: 10px;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 600;\n" +
                "            cursor: pointer;\n" +
                "            transition: all 0.2s ease;\n" +
                "            text-decoration: none;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            border: none;\n" +
                "        }\n" +
                "        .btn-success {\n" +
                "            background: linear-gradient(135deg, #10b981, #059669);\n" +
                "            color: #ffffff;\n" +
                "            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);\n" +
                "        }\n" +
                "        .btn-success:hover {\n" +
                "            transform: translateY(-1px);\n" +
                "            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);\n" +
                "        }\n" +
                "        .btn-danger {\n" +
                "            background: rgba(239, 68, 68, 0.08);\n" +
                "            color: #f87171;\n" +
                "            border: 1px solid rgba(239, 68, 68, 0.15);\n" +
                "        }\n" +
                "        .btn-danger:hover {\n" +
                "            background: rgba(239, 68, 68, 0.15);\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 20px;\n" +
                "            font-size: 10px;\n" +
                "            color: #6b7280;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <div class=\"logo-container\">\n" +
                "                <span class=\"logo-text\">NPCI Gateway</span>\n" +
                "                <span class=\"badge\">Sandbox</span>\n" +
                "            </div>\n" +
                "            <p class=\"subtitle\">Secure Payment Simulator</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"txn-card\">\n" +
                "            <div class=\"txn-row\">\n" +
                "                <span class=\"label\">Transaction ID</span>\n" +
                "                <span class=\"value\" style=\"font-family: monospace;\">" + txnId + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"txn-row\">\n" +
                "                <span class=\"label\">Amount Payable</span>\n" +
                "                <span class=\"value amount\">₹ " + amount + "</span>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"tabs\">\n" +
                "            <button class=\"tab-btn active\" onclick=\"switchTab('upi')\">UPI</button>\n" +
                "            <button class=\"tab-btn\" onclick=\"switchTab('card')\">Card</button>\n" +
                "            <button class=\"tab-btn\" onclick=\"switchTab('nb')\">Net Banking</button>\n" +
                "            <button class=\"tab-btn\" onclick=\"switchTab('wallet')\">Wallet</button>\n" +
                "        </div>\n" +
                "\n" +
                "        <!-- UPI Tab Content -->\n" +
                "        <div id=\"content-upi\" class=\"tab-content active\">\n" +
                "            <div class=\"qr-container\">\n" +
                "                <div class=\"qr-box\">\n" +
                "                    <div class=\"qr-placeholder\">\n" +
                "                        <span style=\"font-size: 28px;\">📱</span>\n" +
                "                        <span style=\"font-size: 10px; font-weight: 600; margin-top: 4px; color: #475569;\">SCAN MOCK QR</span>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "                <span style=\"font-size: 11px; color: #9ca3af; margin-bottom: 12px;\">Or enter your UPI ID</span>\n" +
                "            </div>\n" +
                "            <div class=\"input-group\">\n" +
                "                <label>UPI ID (VPA)</label>\n" +
                "                <input type=\"text\" class=\"input-control\" placeholder=\"username@upi\" value=\"upyog@sandboxnpci\">\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <!-- Card Tab Content -->\n" +
                "        <div id=\"content-card\" class=\"tab-content\">\n" +
                "            <div class=\"input-group\">\n" +
                "                <label>Card Number</label>\n" +
                "                <input type=\"text\" class=\"input-control\" placeholder=\"4111 2222 3333 4444\" value=\"4111 2222 3333 4444\">\n" +
                "            </div>\n" +
                "            <div class=\"row-grid\">\n" +
                "                <div class=\"input-group\">\n" +
                "                    <label>Expiry Date</label>\n" +
                "                    <input type=\"text\" class=\"input-control\" placeholder=\"MM/YY\" value=\"12/30\">\n" +
                "                </div>\n" +
                "                <div class=\"input-group\">\n" +
                "                    <label>CVV</label>\n" +
                "                    <input type=\"password\" class=\"input-control\" placeholder=\"123\" value=\"123\">\n" +
                "                </div>\n" +
                "            </div>\n" +
                "            <div class=\"input-group\">\n" +
                "                <label>Cardholder Name</label>\n" +
                "                <input type=\"text\" class=\"input-control\" placeholder=\"John Doe\" value=\"Sandbox Citizen\">\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <!-- Net Banking Tab Content -->\n" +
                "        <div id=\"content-nb\" class=\"tab-content\">\n" +
                "            <div class=\"bank-grid\">\n" +
                "                <div class=\"bank-option selected\" onclick=\"selectBank(this)\">SBI</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">HDFC</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">ICICI</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">AXIS</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">PNB</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">BOB</div>\n" +
                "            </div>\n" +
                "            <div class=\"input-group\">\n" +
                "                <label>Or Select Other Bank</label>\n" +
                "                <select class=\"input-control\" style=\"background: #1e293b;\">\n" +
                "                    <option>Select Bank</option>\n" +
                "                    <option>Kotak Mahindra Bank</option>\n" +
                "                    <option>Canara Bank</option>\n" +
                "                    <option>Union Bank of India</option>\n" +
                "                </select>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <!-- Wallet Tab Content -->\n" +
                "        <div id=\"content-wallet\" class=\"tab-content\">\n" +
                "            <div class=\"bank-grid\" style=\"grid-template-columns: repeat(2, 1fr);\">\n" +
                "                <div class=\"bank-option selected\" onclick=\"selectBank(this)\">Paytm Wallet</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">PhonePe Wallet</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">Amazon Pay</div>\n" +
                "                <div class=\"bank-option\" onclick=\"selectBank(this)\">Mobikwik</div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"actions\">\n" +
                "            <a href=\"" + successUrl + "\" class=\"btn btn-success\">\n" +
                "                Simulate Successful Payment\n" +
                "            </a>\n" +
                "            <a href=\"" + failureUrl + "\" class=\"btn btn-danger\">\n" +
                "                Cancel / Simulate Failure\n" +
                "            </a>\n" +
                "        </div>\n" +
                "\n" +
                "        <p class=\"footer\">This is a secure NPCI sandbox simulator. No real funds are transferred.</p>\n" +
                "    </div>\n" +
                "\n" +
                "    <script>\n" +
                "        function switchTab(tabId) {\n" +
                "            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));\n" +
                "            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));\n" +
                "            \n" +
                "            const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.toLowerCase().includes(tabId === 'nb' ? 'net' : tabId));\n" +
                "            if (activeBtn) activeBtn.classList.add('active');\n" +
                "            \n" +
                "            const activeContent = document.getElementById('content-' + tabId);\n" +
                "            if (activeContent) activeContent.classList.add('active');\n" +
                "        }\n" +
                "\n" +
                "        function selectBank(element) {\n" +
                "            const parent = element.parentElement;\n" +
                "            parent.querySelectorAll('.bank-option').forEach(opt => opt.classList.remove('selected'));\n" +
                "            element.classList.add('selected');\n" +
                "        }\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
    }
}
