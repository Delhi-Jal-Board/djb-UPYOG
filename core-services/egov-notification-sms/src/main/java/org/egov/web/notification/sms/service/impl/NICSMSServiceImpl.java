package org.egov.web.notification.sms.service.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import javax.annotation.PostConstruct;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import org.egov.web.notification.sms.config.SMSProperties;
import org.egov.web.notification.sms.models.Sms;
import org.egov.web.notification.sms.service.BaseSMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@ConditionalOnProperty(value = "sms.provider.class", matchIfMissing = true, havingValue = "NIC")
public class NICSMSServiceImpl extends BaseSMSService {

	private static final Pattern OTP_PATTERN = Pattern.compile("(?<!\\d)(\\d{4,8})(?!\\d)");

	@Autowired
	private SMSProperties smsProperties;

	private SSLContext sslContext;

	@PostConstruct
	private void postConstruct() {
		log.info("postConstruct() start");
		try {
			sslContext = SSLContext.getInstance("TLSv1.2");
			if (smsProperties.isVerifyCertificate()) {
				log.info("checking certificate");
				/*
				 * KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType()); //File
				 * file = new File(System.getenv("JAVA_HOME")+"/lib/security/cacerts"); File
				 * file = ResourceUtils.getFile("classpath:smsgwsmsgovin.cer"); InputStream is =
				 * new FileInputStream(file); trustStore.load(is, "changeit".toCharArray());
				 * TrustManagerFactory trustFactory = TrustManagerFactory
				 * .getInstance(TrustManagerFactory.getDefaultAlgorithm());
				 * trustFactory.init(trustStore);
				 * 
				 * TrustManager[] trustManagers = trustFactory.getTrustManagers();
				 * sslContext.init(null, trustManagers, null);
				 */

				try (InputStream is = getClass().getClassLoader().getResourceAsStream("smsgwsmsgovin.cer")) {
					CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
					X509Certificate caCert = (X509Certificate) certFactory.generateCertificate(is);

					KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
					trustStore.load(null);
					trustStore.setCertificateEntry("caCert", caCert);

					TrustManagerFactory trustFactory = TrustManagerFactory
							.getInstance(TrustManagerFactory.getDefaultAlgorithm());
					trustFactory.init(trustStore);

					TrustManager[] trustManagers = trustFactory.getTrustManagers();
					sslContext.init(null, trustManagers, null);
				} catch (KeyManagementException | IllegalStateException | CertificateException | KeyStoreException | IOException e) {
					log.error("Not able to load SMS certificate from the specified path {}", e.getMessage());
				}
			} else {
				log.info("not checking certificate");
				TrustManager tm = new X509TrustManager() {
					@Override
					public void checkClientTrusted(java.security.cert.X509Certificate[] chain, String authType)
							throws java.security.cert.CertificateException {
					}

					@Override
					public void checkServerTrusted(java.security.cert.X509Certificate[] chain, String authType)
							throws java.security.cert.CertificateException {
					}

					@Override
					public java.security.cert.X509Certificate[] getAcceptedIssuers() {
						return null;
					}
				};
				sslContext.init(null, new TrustManager[] { tm }, null);
			}
			SSLContext.setDefault(sslContext);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	protected void submitToExternalSmsService(Sms sms) {

		log.info("submitToExternalSmsService() start");

		try {
			if (sms == null || !sms.isValid()) {
				log.warn("Invalid SMS request. SMS not sent.");
				return;
			}

			String mobileNumber = sms.getMobileNumber() != null ? sms.getMobileNumber().trim() : "";
			if (mobileNumber.startsWith("+91")) {
				mobileNumber = mobileNumber.substring(3);
			} else if (mobileNumber.startsWith("91") && mobileNumber.length() == 12) {
				mobileNumber = mobileNumber.substring(2);
			}

			String templateId = resolveTemplateId(sms);
			String messageText = formatMessageForTemplate(sms, templateId);

			String messageType = resolveMessageType(messageText, templateId);

			Map<String, Object> messageItem = new LinkedHashMap<>();
			messageItem.put("dest", Collections.singletonList(mobileNumber));
			messageItem.put("msg", messageText);
			messageItem.put("type", messageType);
			messageItem.put("header", smsProperties.getPinnacleHeader());
			messageItem.put("app_country", smsProperties.getPinnacleAppCountry());
			messageItem.put("country_cd", smsProperties.getPinnacleCountryCd());
			if (StringUtils.hasText(smsProperties.getPinnacleDltEntityId())) {
				messageItem.put("dlt_entity_id", smsProperties.getPinnacleDltEntityId());
			}
			messageItem.put("dlt_template_id", templateId);

			Map<String, Object> rootPayload = new LinkedHashMap<>();
			rootPayload.put("version", smsProperties.getPinnacleVersion());
			rootPayload.put("accesskey", smsProperties.getPinnacleAccessKey());
			rootPayload.put("messages", Collections.singletonList(messageItem));

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(rootPayload, headers);

			if (smsProperties.isPinnacleDebug()) {
				log.info("Pinnacle SMS Request URL: {}", smsProperties.getPinnacleUrl());
				log.info("Pinnacle SMS Request Body: {}", rootPayload);
			}

			ResponseEntity<String> response = restTemplate.postForEntity(
					smsProperties.getPinnacleUrl(),
					requestEntity,
					String.class
			);

			log.info("Pinnacle SMS response code: {}, body: {}", response.getStatusCode(), response.getBody());

		} catch (Exception e) {
			log.error("Error occurred while sending SMS via Pinnacle to {}: {}", sms != null ? sms.getMobileNumber() : null, e.getMessage(), e);
		}
	}

	private String resolveMessageType(String text, String templateId) {
		if (StringUtils.hasText(templateId)) {
			String configuredType = env.getProperty("pinnacle.sms.type." + templateId.trim());
			if (StringUtils.hasText(configuredType)) {
				return configuredType.trim();
			}
		}

		String ekycOtpTemplateId = env.getProperty("pinnacle.sms.template.mapping.eKycOtpSend", "1777179257521369635");
		String pendingTemplateId = env.getProperty("sms.template.pending.id", "1777179257591859804");
		String completedTemplateId = env.getProperty("sms.template.completed.id", "1777179257607010671");

		if (templateId.equals(ekycOtpTemplateId) || templateId.equals(pendingTemplateId) || templateId.equals(completedTemplateId)) {
			return "UC";
		}

		return textIsInEnglish(text) ? "PM" : "UC";
	}

	private boolean textIsInEnglish(String text) {
		if (!StringUtils.hasText(text)) {
			return true;
		}
		for (char c : text.toCharArray()) {
			if (c > 127) {
				return false;
			}
		}
		return true;
	}

	private String resolveTemplateId(Sms sms) {
		if (StringUtils.hasText(sms.getTemplateId())) {
			return sms.getTemplateId().trim();
		}

		String templateKey = null;
		if (sms.getUsers() != null && sms.getUsers().length > 0 && StringUtils.hasText(sms.getUsers()[0])) {
			templateKey = sms.getUsers()[0].trim();
		}

		if (templateKey != null) {
			String mappedTemplate = env.getProperty("pinnacle.sms.template.mapping." + templateKey);
			if (!StringUtils.hasText(mappedTemplate)) {
				mappedTemplate = env.getProperty("sms.template.mapping." + templateKey);
			}
			if (StringUtils.hasText(mappedTemplate)) {
				return mappedTemplate.trim();
			}
		}

		if (sms.getCategory() != null && "OTP".equalsIgnoreCase(sms.getCategory().name())) {
			String loginTemplate = env.getProperty("pinnacle.sms.template.loginOtp");
			if (!StringUtils.hasText(loginTemplate)) {
				loginTemplate = env.getProperty("sms.template.loginOtp");
			}
			if (StringUtils.hasText(loginTemplate)) {
				return loginTemplate.trim();
			}
		}

		String defaultTemplate = env.getProperty("pinnacle.sms.template.default");
		if (!StringUtils.hasText(defaultTemplate)) {
			defaultTemplate = env.getProperty("sms.template.default");
		}
		if (!StringUtils.hasText(defaultTemplate)) {
			defaultTemplate = smsProperties.getPinnacleDefaultTemplateId();
		}

		return StringUtils.hasText(defaultTemplate) ? defaultTemplate.trim() : "";
	}

	private String formatMessageForTemplate(Sms sms, String templateId) {
		String originalMsg = sms.getMessage();
		if (!StringUtils.hasText(originalMsg)) {
			return originalMsg;
		}

		String loginTemplateId = env.getProperty("pinnacle.sms.template.loginOtp", "1777179257652604066");
		String ekycOtpTemplateId = env.getProperty("pinnacle.sms.template.mapping.eKycOtpSend", "1777179257521369635");

		if (templateId.equals(loginTemplateId) || (sms.getCategory() != null && "OTP".equalsIgnoreCase(sms.getCategory().name()) && !templateId.equals(ekycOtpTemplateId))) {
			Matcher matcher = OTP_PATTERN.matcher(originalMsg);
			if (matcher.find()) {
				String otp = matcher.group(1);
				String format = env.getProperty("pinnacle.sms.format.loginOtp",
						"Dear User,\n\nYour OTP for login to Delhi Jal Board portal is %s. OTP is valid for 10 minutes. Do not share this OTP with anyone.\n\nDelhi Jal Board");
				return String.format(format, otp);
			}
		} else if (templateId.equals(ekycOtpTemplateId)) {
			Matcher matcher = OTP_PATTERN.matcher(originalMsg);
			if (matcher.find()) {
				String otp = matcher.group(1);
				String format = env.getProperty("pinnacle.sms.format.ekycOtp",
						"Dear Consumer,\nYour confirmation number for DJB eKYC is %s.\nPlease share this number only with the authorized DJB eKYC representative to complete the process.\nThank you,\nDelhi Jal Board\n\n\\u092a\\u094d\\u0930\\u093f\\u092f \\u0909\\u092a\\u092d\\u094b\\u0915\\u094d\\u0924\\u093e,\nDJB eKYC \\u0915\\u0947 \\u0932\\u093f\\u090f \\u0906\\u092a\\u0915\\u093e \\u092a\\u0941\\u0937\\u094d\\u091f\\u093f \\u0928\\u0902\\u092c\\u0930 %s  \\u0939\\u0948\\u0964\n\\u0915\\u0943\\u092a\\u092f\\u093e eKYC \\u092a\\u094d\\u0930\\u0915\\u094d\\u0930\\u093f\\u092f\\u093e \\u092a\\u0942\\u0930\\u0940 \\u0915\\u0930\\u0928\\u0947 \\u0915\\u0947 \\u0932\\u093f\\u090f \\u092f\\u0939 \\u0928\\u0902\\u092c\\u0930 \\u0915\\u0947\\u0935\\u0932 \\u0926\\u093f\\u0932\\u094d\\u0932\\u0940 \\u091c\\u0932 \\u092c\\u094b\\u0930\\u094d\\u0921 (DJB) \\u0915\\u0947 \\u0905\\u0927\\u093f\\u0915\\u0943\\u0924 eKYC \\u092a\\u094d\\u0930\\u0924\\u093f\\u0928\\u093f\\u0927\\u093f \\u0915\\u0947 \\u0938\\u093e\\u0925 \\u0939\\u0940 \\u0938\\u093e\\u091d\\u093e \\u0915\\u0930\\u0947\\u0902\\u0964\n\\u0927\\u0928\\u094d\\u092f\\u0935\\u093e\\u0926,\n\\u0926\\u093f\\u0932\\u094d\\u0932\\u0940 \\u091c\\u0932 \\u092c\\u094b\\u0930\\u094d\\u0921 (DJB)");
				return String.format(format, otp, otp);
			}
		}

		return originalMsg;
	}
}