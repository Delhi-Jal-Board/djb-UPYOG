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
      `}</style>

      <div className="privacy-policy-body">
        <div className="privacy-policy-container">
          {/* Page Header */}
          <header className="privacy-policy-header">
            <h1>{t("PRIVACY POLICY")}</h1>
            <p className="privacy-policy-meta">{t("Last Updated- June 15, 2026")}</p>
          </header>

          {/* Introductory Paragraph */}
          <div className="privacy-policy-intro">
            {t(
              'This Privacy Policy describes how our mobile application (the "App") collects, uses, processes, and protects your personal data when you use our services. This App is designed as an operational utility to facilitate water distribution tracking, water tanker trip management, consumer identity verification (eKYC), and meter reading reporting for users interacting with utility frameworks like the Delhi Jal Board.'
            )}
          </div>

          {/* Section 1: Information We Collect */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("1. Information We Collect")}</h2>
            <p style={{ marginBottom: "10px" }}>
              {t(
                "To provide our core services, manage tanker distributions, and ensure accurate logistics telemetry, we collect and process the following categories of information"
              )}
              :
            </p>
            <ul className="privacy-policy-list">
              <li>
                <strong>{t("Account and Authentication Data")}:</strong>{" "}
                {t(
                  "When you log in via our integrated identity provider (Keycloak), we process authentication tokens, worker/consumer email addresses, name, and related profile metadata."
                )}
              </li>
              <li>
                <strong>{t("Trip & Delivery Logs")}:</strong>{" "}
                {t(
                  "For water tanker dispatch functions, we track active trip statuses, assigned delivery zones, truck identifiers, and timestamps of distributions."
                )}
              </li>
              <li>
                <strong>{t("Consumer & KYC Details")}:</strong>{" "}
                {t(
                  "To complete consumer identity records, we collect full name, mobile number, consumer type (Individual, Government, Society/Org), and document identity metadata (e.g., PAN, Voter Card strings, or other identification records)."
                )}
              </li>
              <li>
                <strong>{t("Media and Files")}:</strong>{" "}
                {t(
                  "We process and store image files explicitly uploaded by you, including property document images, building photos, and hardware meter status images."
                )}
              </li>
            </ul>
          </section>

          {/* Section 2: Sensitive Permissions & Device Data */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("2. Sensitive Permissions & Device Data")}</h2>
            <p style={{ marginBottom: "10px" }}>
              {t(
                "Our App requires explicit access to sensitive device functions to fulfill its core delivery and utility operations. We only access these permissions when explicitly triggered by an operational user step"
              )}
              :
            </p>
            <ul className="privacy-policy-list">
              <li>
                <strong>{t("Precise & Background Location (ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION)")}:</strong>{" "}
                {t(
                  "The App collects precise location coordinates to track water tanker drivers during an active trip. This data is collected to monitor supply routes, verify delivery at target locations, and optimize distribution logistics. This data collection occurs both in the foreground and in the background (when the app is closed or not in active use) during an active transit trip sequence, managed continuously via an explicit Android foreground notification service or live network tracking streams. Location metrics are also used in the foreground to validate on-site meter coordinates."
                )}
              </li>
              <li>
                <strong>{t("Camera (CAMERA)")}:</strong>{" "}
                {t(
                  "Required to capture immediate images of utility meters, buildings, and verification paperwork directly inside our native image-cropping feature."
                )}
              </li>
              <li>
                <strong>{t("Storage Access (READ_EXTERNAL_STORAGE)")}:</strong>{" "}
                {t("Used strictly to let you browse and upload pre-existing documents or receipts stored on your device.")}
              </li>
            </ul>
          </section>

          {/* Section 3: How We Use Your Data */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("3. How We Use Your Data")}</h2>
            <ul className="privacy-policy-list">
              <li>{t("Authenticate identity tokens securely using Keycloak protocols.")}</li>
              <li>{t("Track real-time water tanker distribution trips and logistics optimization via persistent socket operations.")}</li>
              <li>{t("Log accurate telemetry, coordinates, and photo records of active physical water meters.")}</li>
              <li>{t("Send system alerts and operational background push alerts via notifications.")}</li>
            </ul>
          </section>

          {/* Section 4: Third-Party Data Sharing */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("4. Third-Party Data Sharing")}</h2>
            <p style={{ marginBottom: "10px" }}>
              {t(
                "We do not sell your personal data. Data is securely transmitted to authorized processing servers to execute user-requested utility changes and dispatch logistics. We leverage standard third-party developer software kits to operate securely"
              )}:
            </p>
            <ul className="privacy-policy-list">
              <li>
                <strong>{t("Google Play Services")}:</strong> {t("For device feature stability and mapping operations.")}
              </li>
              <li>
                <strong>{t("Keycloak / Identity Management Providers")}:</strong>{" "}
                {t("To safely execute secure session operations without holding plain-text user credentials inside the application build.")}
              </li>
            </ul>
          </section>

          {/* Section 5: Data Security and Retention */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("5. Data Security and Retention")}</h2>
            <p>
              {t(
                "Your information is encrypted during transmission using secure protocols (HTTPS/SSL). Data is retained on server storage infrastructures only as long as necessary to maintain active logistical records or fulfill state utility record audits."
              )}
            </p>
          </section>

          {/* Section 6: User Rights & Data Deletion Policy */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("6. User Rights & Data Deletion Policy")}</h2>
            <p style={{ marginBottom: "10px" }}>{t("We respect your right to privacy control")}:</p>
            <ul className="privacy-policy-list">
              <li>
                <strong>{t("Opt-out")}:</strong>{" "}
                {t(
                  "You may adjust device settings anytime to disable precise location metrics or camera authorizations, though trip tracking and profiling features will cease to function."
                )}
              </li>
              <li>
                <strong>{t("Data Deletion")}:</strong>{" "}
                {t(
                  "You have the absolute right to request account and personal data deletion. You can initiate a data removal sequence or clean up personal profile data directly by reaching out to our developer support desk listed below."
                )}
              </li>
            </ul>
          </section>

          {/* Section 7: Disclaimer */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("7. Disclaimer")}</h2>
            <p>
              {t(
                "This app is an independent workflow utility developed to simplify on-site consumer tasks and distribution logistics. Unless explicitly stated by an official distribution contract, this application is not officially affiliated with, maintained by, or representing any government entity directly."
              )}
            </p>
          </section>

          {/* Section 8: Contact Us */}
          <section className="privacy-policy-section">
            <h2 className="privacy-policy-heading">{t("8. Contact Us")}</h2>
            <p style={{ marginBottom: "10px" }}>
              {t("If you have any questions regarding this privacy management layout or wish to request data erasure, please contact us at")}:
            </p>
            <div className="privacy-policy-box">
              <div className="privacy-policy-box-row">
                <strong>{t("Support Email")}:</strong> {t("ccr.djb1@gmail.com")}
              </div>
              <div className="privacy-policy-box-row">
                <strong>{t("Developer Address")}:</strong> {t("Delhi Jal Board (HQ),Varunalaya Ph-1 & 2,Jhandewalan, Karol Bagh,New Delhi-110005")}
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
