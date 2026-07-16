import React from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = (props) => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <HeaderBar {...props} />

      <style>{`
        .privacy-policy-body {
          font-family: Georgia, serif;
          color: #222222;
          line-height: 1.6;
          font-size: 15px;
          background-color: #ffffff;
        }

        .privacy-policy-container {
          max-width: 1748px;
          margin: 0 auto;
          padding: 15px 20px;
        }

        .privacy-policy-header {
          padding-bottom: 15px;
          margin-bottom: 30px;
          border-bottom: 2px solid #000000;
        }

        .privacy-policy-header h1 {
          font-family: Arial, sans-serif;
          font-size: 28px;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: #003366;
        }

        .privacy-policy-meta {
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #666666;
          margin: 0;
        }

        .privacy-policy-intro {
          font-style: italic;
          border-left: 3px solid #cccccc;
          padding-left: 15px;
          margin: 0 0 30px 0;
          color: #555555;
        }

        .privacy-policy-section {
          margin-bottom: 30px;
        }

        .privacy-policy-heading {
          font-family: Arial, sans-serif;
          font-size: 15px;
          font-weight: bold;
          text-transform: uppercase;
          padding-bottom: 5px;
          margin: 0 0 15px 0;
          border-bottom: 1px solid #dddddd;
          color: #003366;
          letter-spacing: 0.5px;
        }

        .privacy-policy-list {
          list-style-type: disc !important;
          padding-left: 20px !important;
          margin: 10px 0;
        }

        .privacy-policy-list li {
          margin-bottom: 10px;
        }

        .privacy-policy-box {
          border: 1px solid #cccccc;
          padding: 15px;
          margin-top: 15px;
        }

        .privacy-policy-box-row {
          margin-bottom: 8px;
        }

        .privacy-policy-box-row:last-child {
          margin-bottom: 0;
        }
        
        .app-banner {
          background: #003366;
          color: #fff;
          padding: 14px 20px;
          border-radius: 6px;
          margin: 40px 0 20px 0;
          font-size: 17px;
          font-weight: 600;
          font-family: Arial, sans-serif;
        }
        
        .toc {
          background: #f9fafb;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 16px 20px;
          margin: 24px 0;
          font-family: Arial, sans-serif;
        }
        .toc a {
          display: block;
          margin: 8px 0;
          color: #003366;
          text-decoration: none;
        }
        .toc a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="privacy-policy-body">
        <div className="privacy-policy-container">

          <header className="privacy-policy-header">
            <h1>{t("PRIVACY POLICY")}</h1>
            <p className="privacy-policy-meta">{t("Delhi Jal Board — Mobile Applications | Last updated: 13 July 2026")}</p>
          </header>

          <div className="privacy-policy-intro">
            {t('This Privacy Policy describes how Delhi Jal Board ("DJB", "we", "us") collects, uses, processes, and protects personal data across our mobile applications listed below. Each application is described in its own section, since the two apps serve different users and collect different data. Sections 3–7 describe practices that apply to both applications unless a section says otherwise.')}
          </div>

          <div className="toc">
            <strong>{t("Applications covered by this policy:")}</strong>
            <a href="#app-consumer">{t("1. DJB Consumer & Tanker Services App — water tanker tracking, consumer eKYC, meter reading (citizen/operational use)")}</a>
            <a href="#app-employee">{t("2. DJB Mobile Employee App (Nirikshan) — field inspection portal for DJB employees/surveyors")}</a>
          </div>

          <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic", marginBottom: "30px" }}>
            {t('[Note: replace "DJB Consumer & Tanker Services App" above with that app\'s actual published name / package ID on the Play Store, so each Data Safety form can be matched to the right section.]')}
          </p>

          <div className="app-banner" id="app-consumer">{t("App 1 — DJB Consumer & Tanker Services App")}</div>
          <section className="privacy-policy-section">
            <p style={{ marginBottom: "15px" }}>
              {t("This application is designed as an operational utility to facilitate water distribution tracking, water tanker trip management, consumer identity verification (eKYC), and meter reading reporting for users interacting with utility frameworks like the Delhi Jal Board.")}
            </p>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("1.1 Information We Collect")}</h3>
            <ul className="privacy-policy-list">
              <li><strong>{t("Account and Authentication Data:")}</strong> {t("When you log in via our integrated identity provider (Keycloak), we process authentication tokens, worker/consumer email addresses, name, and related profile metadata.")}</li>
              <li><strong>{t("Trip & Delivery Logs:")}</strong> {t("For water tanker dispatch functions, we track active trip statuses, assigned delivery zones, truck identifiers, and timestamps of distributions.")}</li>
              <li><strong>{t("Consumer & KYC Details:")}</strong> {t("To complete consumer identity records, we collect full name, mobile number, consumer type (Individual, Government, Society/Org), and document identity metadata (e.g. PAN, Voter Card strings, or other identification records).")}</li>
              <li><strong>{t("Media and Files:")}</strong> {t("We process and store image files explicitly uploaded by you, including property document images, building photos, and hardware meter status images.")}</li>
            </ul>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("1.2 Sensitive Permissions & Device Data")}</h3>
            <ul className="privacy-policy-list">
              <li><strong>{t("Precise & Background Location (ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION):")}</strong> {t("Collected to track water tanker drivers during an active trip — to monitor supply routes, verify delivery at target locations, and optimize distribution logistics. This occurs both in the foreground and background (when the app is closed or not in active use) during an active transit trip sequence, managed via an explicit Android foreground notification service or live network tracking streams. Also used in the foreground to validate on-site meter coordinates.")}</li>
              <li><strong>{t("Camera:")}</strong> {t("Required to capture images of utility meters, buildings, and verification paperwork via a native image-cropping feature.")}</li>
              <li><strong>{t("Storage Access (READ_EXTERNAL_STORAGE):")}</strong> {t("Used strictly to let you browse and upload pre-existing documents or receipts stored on your device.")}</li>
            </ul>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("1.3 How This App Uses Your Data")}</h3>
            <ul className="privacy-policy-list">
              <li>{t("Authenticate identity tokens securely using Keycloak protocols.")}</li>
              <li>{t("Track real-time water tanker distribution trips and logistics optimization via persistent socket operations.")}</li>
              <li>{t("Log accurate telemetry, coordinates, and photo records of active physical water meters.")}</li>
              <li>{t("Send system alerts and operational background push alerts via notifications.")}</li>
            </ul>
          </section>

          <div className="app-banner" id="app-employee">{t("App 2 — DJB Mobile Employee App (Nirikshan)")}</div>
          <section className="privacy-policy-section">
            <p style={{ marginBottom: "15px" }}>
              {t("This application is used by authorized DJB employees and surveyors to carry out field inspections through DJB's Nirikshan inspection portal. It is not intended for use by the general public or by consumers, and it does not perform tanker tracking, dispatch, or eKYC.")}
            </p>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("2.1 How This App Works")}</h3>
            <p style={{ marginBottom: "15px" }}>
              {t("This App functions as a secure native container around DJB's Nirikshan inspection web portal (")}
              <a
                href="https://erpdjb.nitcon.in/nirikshan"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#0d6efd",
                  textDecoration: "underline",
                  fontWeight: "600",
                }}
              >
                erpdjb.nitcon.in/nirikshan
              </a>
              {t("which is developed and hosted by DJB's technology partner Nitcon. Most screens—including login, inspection forms, and dashboards—are the Nirikshan web portal itself, loaded inside the App. The native Android layer acts as a secure bridge, allowing the web portal to access device capabilities that are not available directly through a standard web browser.")}
            </p>
            <ul className="privacy-policy-list">
              <li><strong>{t("Camera")}</strong> — {t("captures a photo natively, stamps it with GPS location, and hands it back to the web portal to attach to the inspection record.")}</li>
              <li><strong>{t("Location")}</strong> — {t("fetches device GPS coordinates and passes them to the web portal for geo-tagging.")}</li>
              <li><strong>{t("OTP auto-read")}</strong> — {t("uses Android's SMS User Consent API to read the login OTP (only after you tap 'Allow' on a system prompt) and passes the OTP digits to the web portal's login form.")}</li>
            </ul>
            <p style={{ marginTop: "15px", marginBottom: "15px" }}>
              {t("Form data, photos, and location values are submitted directly by the web portal to DJB's Nirikshan backend over an encrypted connection — the native App code does not separately collect, log, or retain this data beyond momentarily passing it from the device sensor/API to the web page.")}
            </p>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("2.2 Information We Collect")}</h3>
            <ul className="privacy-policy-list">
              <li><strong>{t("Account & Login Information:")}</strong> {t("Employee login credentials and session tokens, authenticated via DJB's single sign-on system (Keycloak).")}</li>
              <li><strong>{t("Location Data:")}</strong> {t("Precise device location, collected when capturing a photo or performing an inspection, to geo-tag inspection records and confirm field work occurred at the correct site. May be accessed in the foreground while using inspection features, and in the background where enabled for your role.")}</li>
              <li><strong>{t("Camera & Photos:")}</strong> {t("Photos captured within the App (e.g. water meter images, inspection site/door photos), embedded with GPS EXIF data before submission.")}</li>
              <li><strong>{t("Microphone:")}</strong> {t("Accessed only where a specific inspection workflow requires audio/video capture — not used for background listening or recording.")}</li>
              <li><strong>{t("SMS (OTP Auto-Read):")}</strong> {t("Uses the Android SMS User Consent API to read the login OTP sent to your registered mobile number, via a system-controlled 'Allow' prompt. The App cannot read your other SMS messages, contacts, or SMS history, and does not request the general 'Read SMS' permission.")}</li>
              <li><strong>{t("Device & Diagnostic Information:")}</strong> {t("Basic device model/OS/app version for troubleshooting, and locally cached session state/form drafts to support use in poor connectivity areas.")}</li>
            </ul>

            <h3 className="privacy-policy-heading" style={{ borderBottom: "none", marginTop: "20px" }}>{t("2.3 Permissions Summary")}</h3>
            <div className="privacy-policy-box" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f2f6fa" }}>
                    <th style={{ padding: "10px 15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>{t("Permission")}</th>
                    <th style={{ padding: "10px 15px", textAlign: "left", borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd" }}>{t("Why the App needs it")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd" }}>{t("Location (foreground / background)")}</td>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd" }}>{t("Geo-tag inspection records and photos")}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd" }}>{t("Camera")}</td>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd" }}>{t("Capture inspection/meter photos")}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd" }}>{t("Microphone")}</td>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd" }}>{t("Audio/video capture for specific inspection workflows")}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd" }}>{t("SMS (User Consent API only)")}</td>
                    <td style={{ padding: "10px 15px", borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd" }}>{t("Auto-read login OTP after explicit on-screen consent")}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 15px" }}>{t("Storage (app-scoped)")}</td>
                    <td style={{ padding: "10px 15px", borderLeft: "1px solid #ddd" }}>{t("Temporarily cache photos and form data on-device")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("3. Third-Party Data Sharing")}</h2>
            <p style={{ marginBottom: "15px" }}>
              {t("We do not sell your personal data. Data is securely transmitted to authorized processing servers to execute user-requested utility changes, dispatch logistics, and inspection record-keeping. We use the following third-party services:")}
            </p>
            <ul className="privacy-policy-list">
              <li><strong>{t("Google Play Services")}</strong> — {t("for device feature stability and mapping operations (App 1).")}</li>
              <li><strong>{t("Keycloak / Identity Management Providers")}</strong> — {t("to safely execute secure session operations without holding plain-text user credentials inside the application build (both apps).")}</li>
              <li><strong>{t("Nitcon")}</strong> — {t("DJB's technology partner that hosts and operates the Nirikshan inspection portal, acting as a data processor for App 2 only.")}</li>
            </ul>
          </section>

          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("4. Data Security and Retention")}</h2>
            <p>
              {t("Your information is encrypted during transmission using secure protocols (HTTPS/SSL). Data is retained on server storage infrastructures only as long as necessary to maintain active logistical/inspection records or fulfill state utility record audits.")}
            </p>
          </section>

          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("5. User Rights & Data Deletion Policy")}</h2>
            <ul className="privacy-policy-list">
              <li><strong>{t("Opt-out:")}</strong> {t("You may adjust device settings anytime to disable precise location metrics, camera, or microphone authorizations — though trip tracking, verification, or inspection-capture features will cease to function.")}</li>
              <li><strong>{t("Data Deletion:")}</strong> {t("You have the right to request account and personal data deletion. You can initiate a data removal request by contacting our support desk below.")}</li>
            </ul>
          </section>

          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("6. Disclaimer")}</h2>
            <p>
              {t("These applications are workflow utilities developed to simplify on-site consumer tasks, distribution logistics, and field inspection duties. Unless explicitly stated by an official distribution contract, these applications are not officially affiliated with, maintained by, or representing any government entity directly beyond DJB's own operational use.")}
            </p>
          </section>

          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("7. Contact Us")}</h2>
            <div className="privacy-policy-box">
              <div className="privacy-policy-box-row">
                <strong>{t("Delhi Jal Board")}</strong>
              </div>
              <div className="privacy-policy-box-row">
                {t("Support Email:")} ccr.djb1@gmail.com
              </div>
              <div className="privacy-policy-box-row">
                {t("Developer Address:")} {t("Delhi Jal Board (HQ), Varunalaya Ph-1 & 2, Jhandewalan, Karol Bagh, New Delhi-110005")}
              </div>
            </div>
          </section>

        </div>
      </div>
      <Footer />
    </React.Fragment>
  );
};

export default PrivacyPolicy;
