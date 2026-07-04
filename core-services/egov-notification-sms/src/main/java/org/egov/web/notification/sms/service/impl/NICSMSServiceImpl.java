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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

			HttpURLConnection conn = null;

			try {
				if (sms == null || !sms.isValid()) {
					log.warn("Invalid SMS request. SMS not sent.");
					return;
				}

//				String smsBody = sms.getMessage();
//				System.out.println(smsBody);
//				//System.out.println();
//
//				if (smsBody.contains("#")) {
//					String[] parts = smsBody.split("#", 2);
//					smsBody = parts[0];
//					sms.setTemplateId(parts[1]);
//				}

				String smsMessage = sms.getMessage();
				//String smsBody1 = "Dear Citizen, Your OTP to complete your mSeva Registration is 123456.";

				Pattern pattern = Pattern.compile("\\b\\d{6}\\b");
				Matcher matcher = pattern.matcher(smsMessage);
				String otp="";
				if (matcher.find()) {
					otp = matcher.group();
				}
				String smsBody = "Dear User,\n\n"
						+ "Your OTP for login to Delhi Jal Board portal is "
						+ otp
						+ ". OTP is valid for 10 minutes. Do not share this OTP with anyone.\n\n"
						+ "Delhi Jal Board";


				if (StringUtils.isEmpty(sms.getTemplateId())) {
					sms.setTemplateId(smsProperties.getMishtelTemplateId());
				}

				String mobileNumber = sms.getMobileNumber();

				if (!mobileNumber.startsWith("91")) {
					mobileNumber = "91" + mobileNumber;
				}

				String finalData = "";
				finalData += "apikey=" + URLEncoder.encode(smsProperties.getMishtelApiKey(), "UTF-8");
				finalData += "&senderid=" + URLEncoder.encode(smsProperties.getMishtelSenderId(), "UTF-8");
				finalData += "&channel=" + URLEncoder.encode(smsProperties.getMishtelChannel(), "UTF-8");
				finalData += "&DCS=" + URLEncoder.encode(smsProperties.getMishtelDcs(), "UTF-8");
				finalData += "&flashsms=" + URLEncoder.encode(smsProperties.getMishtelFlashSms(), "UTF-8");
				finalData += "&number=" + URLEncoder.encode(mobileNumber, "UTF-8");
				finalData += "&text=" + URLEncoder.encode(smsBody, "UTF-8");
				finalData += "&route=" + URLEncoder.encode(smsProperties.getMishtelRoute(), "UTF-8");
				finalData += "&DLTTemplateId=" + URLEncoder.encode(sms.getTemplateId(), "UTF-8");

				String finalUrl = smsProperties.getMishtelUrl() + "?" + finalData;

				if (!smsProperties.isMishtelSmsEnabled()) {
					log.info("Mishtel SMS disabled. SMS Data: {}", finalData);
					return;
				}

				conn = (HttpURLConnection) new URL(finalUrl).openConnection();
				conn.setRequestMethod("GET");
				conn.setConnectTimeout(10000);
				conn.setReadTimeout(10000);

				int responseCode = conn.getResponseCode();

				BufferedReader rd = new BufferedReader(
						new InputStreamReader(
								responseCode >= 200 && responseCode < 300
										? conn.getInputStream()
										: conn.getErrorStream()
						)
				);

				StringBuilder response = new StringBuilder();
				String line;

				while ((line = rd.readLine()) != null) {
					response.append(line);
				}

				rd.close();

				log.info("Mishtel SMS API responseCode: {}", responseCode);
				log.info("Mishtel SMS API response: {}", response);

				if (smsProperties.isMishtelDebug()) {
					log.info("Mishtel sms api url: {}", smsProperties.getMishtelUrl());
					log.info("Mishtel sms data: {}", finalData);
					log.info("Mishtel sms response: {}", response);
				}

			} catch (Exception e) {
				log.error("Error occurred while sending SMS to: {}", sms != null ? sms.getMobileNumber() : null, e);
			} finally {
				if (conn != null) {
					conn.disconnect();
				}
			}

	}

	private boolean textIsInEnglish(String text) {
		ArrayList<Character.UnicodeBlock> english = new ArrayList<>();
		english.add(Character.UnicodeBlock.BASIC_LATIN);
		english.add(Character.UnicodeBlock.LATIN_1_SUPPLEMENT);
		english.add(Character.UnicodeBlock.LATIN_EXTENDED_A);
		english.add(Character.UnicodeBlock.GENERAL_PUNCTUATION);
		for (char currentChar : text.toCharArray()) {
			Character.UnicodeBlock unicodeBlock = Character.UnicodeBlock.of(currentChar);
			if (!english.contains(unicodeBlock)) {
				return false;
			}
		}
		return true;
	}

}