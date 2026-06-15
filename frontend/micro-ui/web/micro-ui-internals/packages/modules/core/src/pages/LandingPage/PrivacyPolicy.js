import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { useTranslation } from "react-i18next";
import {
  DocumentIcon,
  LocationIcon,
  InfoIcon,
  ShareIcon,
  PrivacyMaskIcon,
  PersonIcon,
  HelpIcon,
  AddressBookIcon,
  RightArrowIcon,
  Hamburger,
  CameraIcon,
  EmailIcon,
  MapMarker
} from "@djb25/digit-ui-react-components";

const PrivacyPolicy = (props) => {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState("collect");

  // Reset scroll to top when navigation changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeMenu]);

  const sideNavItems = [
    { key: "collect", label: "Information We Collect", icon: <DocumentIcon width="16" height="16" /> },
    { key: "permissions", label: "Device Permissions", icon: <LocationIcon width="16" height="16" /> },
    { key: "usage", label: "How We Use Data", icon: <InfoIcon width="16" height="16" /> },
    { key: "sharing", label: "Third Party Sharing", icon: <ShareIcon width="16" height="16" /> },
    { key: "security", label: "Security & Retention", icon: <PrivacyMaskIcon width="16" height="16" /> },
    { key: "rights", label: "User Rights", icon: <PersonIcon width="16" height="16" /> },
    { key: "disclaimer", label: "Disclaimer", icon: <HelpIcon width="16" height="16" /> },
    { key: "contact", label: "Contact Us", icon: <AddressBookIcon width="16" height="16" /> },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "collect":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("1. Information We Collect")}</h3>
            <p className="privacy-intro-text">
              {t("This App is designed as an operational utility to facilitate water distribution tracking, water tanker trip management, consumer identity verification (eKYC), and meter reading reporting for users interacting with utility frameworks like the Delhi Jal Board.")}
            </p>
            
            <div className="privacy-card-grid">
              <div className="privacy-feature-card">
                <h4>{t("Account and Authentication Data")}</h4>
                <p>{t("When you log in via our integrated identity provider (Keycloak), we process authentication tokens, worker/consumer email addresses, name, and related profile metadata.")}</p>
              </div>
              <div className="privacy-feature-card">
                <h4>{t("Trip & Delivery Logs")}</h4>
                <p>{t("For water tanker dispatch functions, we track active trip statuses, assigned delivery zones, truck identifiers, and timestamps of distributions.")}</p>
              </div>
              <div className="privacy-feature-card">
                <h4>{t("Consumer & KYC Details")}</h4>
                <p>{t("To complete consumer identity records, we collect full name, mobile number, consumer type (Individual, Government, Society/Org), and document identity metadata (e.g., PAN, Voter Card strings, or other identification records).")}</p>
              </div>
              <div className="privacy-feature-card">
                <h4>{t("Media and Files")}</h4>
                <p>{t("We process and store image files explicitly uploaded by you, including property document images, building photos, and hardware meter status images.")}</p>
              </div>
            </div>
          </div>
        );

      case "permissions":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("2. Sensitive Permissions & Device Data")}</h3>
            <p className="privacy-intro-text">
              {t("To provide full utility functionality, the application requests the following device permissions:")}
            </p>
            
            <div className="permission-cards-list">
              {/* Location */}
              <div className="permission-detail-card location-theme">
                <div className="permission-icon-container">
                  <LocationIcon width="24" height="24" />
                </div>
                <div className="permission-text-block">
                  <h4>{t("Precise & Background Location")}</h4>
                  <span className="permission-manifest-name">ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION</span>
                  <p>{t("The App collects precise location coordinates to track water tanker drivers during active trips, verify deliveries, optimize logistics, and validate on-site meter locations.")}</p>
                </div>
              </div>
              
              {/* Camera */}
              <div className="permission-detail-card camera-theme">
                <div className="permission-icon-container">
                  <CameraIcon width="24" height="24" />
                </div>
                <div className="permission-text-block">
                  <h4>{t("Camera (CAMERA)")}</h4>
                  <span className="permission-manifest-name">CAMERA</span>
                  <p>{t("Required to capture images of utility meters, buildings, and verification paperwork.")}</p>
                </div>
              </div>

              {/* Storage */}
              <div className="permission-detail-card storage-theme">
                <div className="permission-icon-container">
                  <DocumentIcon width="24" height="24" />
                </div>
                <div className="permission-text-block">
                  <h4>{t("Storage Access")}</h4>
                  <span className="permission-manifest-name">READ_EXTERNAL_STORAGE</span>
                  <p>{t("Used to upload existing documents and utility-related files.")}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "usage":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("3. How We Use Your Data")}</h3>
            <p className="privacy-intro-text">
              {t("We use the collected information for specific operational and system functions:")}
            </p>
            <ul className="djb-list" style={{ marginTop: "16px" }}>
              <li>
                <strong>{t("Identity Authentication")}:</strong> {t("Authenticate identity tokens securely using Keycloak protocols.")}
              </li>
              <li>
                <strong>{t("Tanker Fleet Coordination")}:</strong> {t("Track real-time tanker distribution operations and verify localized dispatch drops.")}
              </li>
              <li>
                <strong>{t("Utility Auditing & Telemetry")}:</strong> {t("Log telemetry, consumer information, and utility records for transparency.")}
              </li>
              <li>
                <strong>{t("Operational Communication")}:</strong> {t("Send critical operational notifications, transactional alerts, and SMS updates.")}
              </li>
            </ul>
          </div>
        );

      case "sharing":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("4. Third-Party Data Sharing")}</h3>
            <p className="privacy-intro-text">
              {t("We respect your privacy. We do not sell your personal data. Data is securely transmitted only to authorized systems to fulfill operational and utility functions:")}
            </p>
            <div className="sharing-cards-grid">
              <div className="sharing-provider-card">
                <h4>{t("Google Play Services")}</h4>
                <p>{t("Used for mapping, location coordinates lookup, and device functionality.")}</p>
              </div>
              <div className="sharing-provider-card">
                <h4>{t("Keycloak / Identity Providers")}</h4>
                <p>{t("Used for secure single-sign-on (SSO) login authentication, token verification, and active session management.")}</p>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("5. Data Security & Retention")}</h3>
            <div className="security-notice-panel">
              <InfoIcon width="20" height="20" className="security-icon" />
              <div className="security-text">
                <h4>{t("Security Standards")}</h4>
                <p>{t("All user data is encrypted in transit and at rest using modern HTTPS/SSL cryptographic protocols. Utility records are retained only as long as required to fulfill official service provisioning, auditing, and legislative requirements.")}</p>
              </div>
            </div>
          </div>
        );

      case "rights":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("6. User Rights & Data Deletion Policy")}</h3>
            <p className="privacy-intro-text">
              {t("You have control over how your data is accessed and managed:")}
            </p>
            <div className="privacy-card-grid">
              <div className="privacy-feature-card">
                <h4>{t("Opt-Out Choices")}</h4>
                <p>{t("You can modify, revoke, or restrict device permissions (such as precise location, camera, or storage access) at any time through your mobile device system settings.")}</p>
              </div>
              <div className="privacy-feature-card">
                <h4>{t("Account Deletion")}</h4>
                <p>{t("You may request official deletion of personal records and profile metadata by contacting our portal support helpline or submitting a formal email request.")}</p>
              </div>
            </div>
          </div>
        );

      case "disclaimer":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("7. Disclaimer")}</h3>
            <div className="disclaimer-callout">
              <p>
                {t("This application is an independent workflow utility developed to streamline operational and utility-related tasks. Unless explicitly stated, it is not directly affiliated with or operated by a government entity.")}
              </p>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="djb-section">
            <h3 className="djb-section-title">{t("8. Contact Us")}</h3>
            <p className="privacy-intro-text">
              {t("For any queries, security questions, or requests regarding this Privacy Policy, please contact our support desk:")}
            </p>
            
            <div className="contact-detail-list">
              <div className="contact-info-block">
                <EmailIcon width="20" height="20" className="block-icon" />
                <div>
                  <h4>{t("Support Email")}</h4>
                  <a href="mailto:customercare.djb@delhi.gov.in" className="email-link">
                    customercare.djb@delhi.gov.in
                  </a>
                </div>
              </div>
              
              <div className="contact-info-block">
                <MapMarker width="20" height="20" className="block-icon" />
                <div>
                  <h4>{t("Developer Address")}</h4>
                  <p>
                    Delhi Jal Board (HQ),<br />
                    Varunalaya Ph-1 & 2, Jhandewalan, Karol Bagh,<br />
                    New Delhi-110005
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <HeaderBar {...props} />
      
      {/* Inline styles scoped to the privacy policy layout */}
      <style>{`
        .privacy-intro-text {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .privacy-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }
        .privacy-feature-card {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .privacy-feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .privacy-feature-card h4 {
          font-weight: 600;
          font-size: 15.5px;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .privacy-feature-card p {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }
        .permission-cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .permission-detail-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .permission-icon-container {
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          width: 48px;
          flex-shrink: 0;
        }
        .location-theme .permission-icon-container {
          background: #eff6ff;
          color: #2563eb;
        }
        .camera-theme .permission-icon-container {
          background: #fdf2f8;
          color: #db2777;
        }
        .storage-theme .permission-icon-container {
          background: #f0fdf4;
          color: #16a34a;
        }
        .permission-text-block h4 {
          font-weight: 600;
          font-size: 16px;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        .permission-manifest-name {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .permission-text-block p {
          font-size: 14px;
          color: #475569;
          margin: 8px 0 0 0;
          line-height: 1.5;
        }
        .sharing-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }
        .sharing-provider-card {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .sharing-provider-card h4 {
          font-weight: 600;
          font-size: 15.5px;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .sharing-provider-card p {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }
        .security-notice-panel {
          padding: 20px;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          background: #fff7ed;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-top: 16px;
        }
        .security-icon {
          color: #ea580c;
          flex-shrink: 0;
          margin-top: 3px;
        }
        .security-text h4 {
          margin: 0 0 6px 0;
          font-weight: 600;
          color: #c2410c;
          font-size: 15.5px;
        }
        .security-text p {
          margin: 0;
          font-size: 14.5px;
          color: #7c2d12;
          line-height: 1.5;
        }
        .disclaimer-callout {
          padding: 16px 20px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          border-left: 4px solid #64748b;
          margin-top: 16px;
        }
        .disclaimer-callout p {
          margin: 0;
          font-size: 14.5px;
          color: #334155;
          font-style: italic;
          line-height: 1.6;
        }
        .contact-detail-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 20px;
        }
        .contact-info-block {
          display: flex;
          gap: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }
        .block-icon {
          color: #0f172a;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .contact-info-block h4 {
          font-weight: 600;
          font-size: 15px;
          color: #1e293b;
          margin: 0 0 6px 0;
        }
        .contact-info-block p {
          font-size: 14px;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }
        .email-link {
          font-size: 14.5px;
          color: #2563eb;
          text-decoration: underline;
        }
        .email-link:hover {
          color: #1d4ed8;
        }
        @media (max-width: 768px) {
          .privacy-card-grid, .sharing-cards-grid {
            grid-template-columns: 1fr;
          }
          .permission-detail-card {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      {/* Hero Section */}
      <div className="about-hero-banner" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <span className="about-hero-badge" style={{ background: "#2563eb", color: "#ffffff", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>
            {t("SECURITY & TRUST")}
          </span>
          <h1 style={{ marginTop: "12px" }}>{t("Privacy Policy")}</h1>
          <p>{t("Learn how user information is collected, processed, secured, and managed within the UPYOG DJB ecosystem.")}</p>
          <div style={{ marginTop: "12px", fontSize: "14px", opacity: 0.8, color: "#cbd5e1" }}>
            <strong>{t("Last Updated")}:</strong> {t("June 15, 2026")}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="about-page-container">
        <div className="about-layout-grid">
          
          {/* LEFT: Quick Navigation Sidebar */}
          <aside className="about-side-nav">
            <div className="about-side-nav-header">
              <Hamburger width="15" height="15" />
              {t("Navigation")}
            </div>
            <ul className="about-side-nav-list">
              {sideNavItems.map((item) => (
                <li
                  key={item.key}
                  className={`about-side-nav-item${activeMenu === item.key ? " active" : ""}`}
                  onClick={() => setActiveMenu(item.key)}
                >
                  <span className="about-nav-icon">{item.icon}</span>
                  <span className="about-nav-label">{t(item.label)}</span>
                  {activeMenu === item.key && (
                    <RightArrowIcon className="about-nav-chevron" width="14" height="14" />
                  )}
                </li>
              ))}
            </ul>
          </aside>

          {/* RIGHT: Content Card */}
          <div className="about-content-card">
            {renderContent()}
          </div>
          
        </div>
      </div>

      <Footer />
    </React.Fragment>
  );
};

export default PrivacyPolicy;
