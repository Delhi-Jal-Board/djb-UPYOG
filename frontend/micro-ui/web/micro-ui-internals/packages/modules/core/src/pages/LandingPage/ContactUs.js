import React from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { useTranslation } from "react-i18next";

const ContactUs = (props) => {
  const { stateInfo } = props;
  const { t } = useTranslation();
  const orgName = stateInfo?.name || "Delhi Jal Board";

  return (
    <React.Fragment>
      <HeaderBar {...props} />

      {/* Hero Banner Section */}
      <div className="contact-hero-banner">
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <span className="contact-hero-badge">{t("Support Desk")}</span>
          <h1>{t("Get in Touch with Delhi Jal Board")}</h1>
          <p>{t("Have queries, grievances, or feedback? Find our official hotlines, write to us, or locate our offices below.")}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="contact-page-container">
        
        {/* ================= SECTION 1: HELPLINES & FORM ================= */}
        <div className="contact-grid-row">
          
          {/* LEFT COLUMN: HELP LINES */}
          <div className="contact-card card-helpline">
            <div className="card-header">
              <span className="card-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </span>
              <h3>{t("Official Helpline & Directory")}</h3>
            </div>
            
            <div className="helpline-notice">
              {t("FOR WATER BILLS, WATER PROBLEMS, WATER TANKER, WATER LOGGING, SEWER PROBLEMS AND ILLEGAL BORING RELATED COMPLAINTS, CONTACT") + ":"}
            </div>

            <div className="helpline-list">
              {/* Landline Numbers */}
              <div className="helpline-group">
                <div className="group-title">{t("Customer Hotlines")}</div>
                <div className="numbers-grid">
                  <a href="tel:23538495" className="number-pill">
                    <span className="pill-phone-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    23538495
                  </a>
                  <a href="tel:23634469" className="number-pill">
                    <span className="pill-phone-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    23634469
                  </a>
                  <a href="tel:23513073" className="number-pill">
                    <span className="pill-phone-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    23513073
                  </a>
                  <a href="tel:23527679" className="number-pill">
                    <span className="pill-phone-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    23527679
                  </a>
                </div>
              </div>

              {/* Special Helpline Support */}
              <div className="helpline-group">
                <div className="group-title">{t("Control Centre & Emergency Hotline")}</div>
                <div className="emergency-item">
                  <a href="tel:8383068300" className="emergency-number">
                    <span className="emergency-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </span>
                    8383068300
                  </a>
                  <div className="emergency-meta">
                    <span className="label-badge badge-emergency">{t("Emergency")}</span>
                    <span className="label-text">{t("Control Command Centre Helpline")}</span>
                    <span className="badge-new">{t("NEW")}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp helplines */}
              <div className="helpline-group">
                <div className="group-title">{t("WhatsApp Support Channels")}</div>
                <div className="whatsapp-list">
                  <div className="whatsapp-item">
                    <a href="https://wa.me/919650291021" target="_blank" rel="noreferrer" className="wa-pill">
                      <span className="wa-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.733-1.455L0 24zm6.79-11.488c.15-.247.49-.287.738-.136l1.45.885c.247.15.287.49.136.738l-.482.793c-.15.247-.074.568.173.719 1.13.69 2.502.69 3.632 0 .247-.15.568-.074.719.173l.482.793c.15.247.11.588-.136.738l-1.45.885c-.247.15-.588.11-.738-.136l-4.544-7.452z"></path></svg>
                      </span>
                      9650291021
                    </a>
                    <span className="wa-meta-text">{t("WhatsApp No.")}</span>
                  </div>
                  <div className="whatsapp-item">
                    <a href="https://wa.me/918383068300" target="_blank" rel="noreferrer" className="wa-pill wa-pill-alt">
                      <span className="wa-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.733-1.455L0 24zm6.79-11.488c.15-.247.49-.287.738-.136l1.45.885c.247.15.287.49.136.738l-.482.793c-.15.247-.074.568.173.719 1.13.69 2.502.69 3.632 0 .247-.15.568-.074.719.173l.482.793c.15.247.11.588-.136.738l-1.45.885c-.247.15-.588.11-.738-.136l-4.544-7.452z"></path></svg>
                      </span>
                      8383068300
                    </a>
                    <span className="wa-meta-text">
                      {t("WhatsApp for water logging / tanker issues")}
                      <span className="badge-new">{t("NEW")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer-links">
              <p className="legacy-sub-heading">{t("Please contact Concern ZRO or Concern Jt./Dy. Director:")}</p>
              <div className="footer-action-buttons">
                <a href="/assets/zro-directory.pdf" target="_blank" rel="noreferrer" className="action-button-link action-pdf">
                  <span className="btn-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </span>
                  {t("Click for Concern ZRO / Jt./Dy. Director Numbers (PDF)")}
                </a>
                <a href="/directory" className="action-button-link action-dir">
                  <span className="btn-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  </span>
                  {t("DIRECTORY")}
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: WRITE TO US FORM */}
          <div className="contact-card card-form">
            <div className="card-header">
              <span className="card-header-icon icon-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </span>
              <h3>{t("Write to Us")}</h3>
            </div>

            <form className="contact-form-styled" onSubmit={(e) => e.preventDefault()}>
              <div className="form-grid-fields">
                <div className="input-group-styled">
                  <input type="text" placeholder={t("Your Name")} name="name" required />
                  <span className="input-line"></span>
                </div>
                <div className="input-group-styled">
                  <input type="email" placeholder={t("Your Email")} name="email" required />
                  <span className="input-line"></span>
                </div>
              </div>

              <div className="input-group-styled">
                <input type="text" placeholder={t("Subject")} name="subject" required />
                <span className="input-line"></span>
              </div>

              <div className="input-group-styled">
                <textarea placeholder={t("Message")} name="message" rows="5" required></textarea>
                <span className="input-line"></span>
              </div>

              <button type="submit" className="form-submit-button">
                <span className="btn-text">{t("Send Message")}</span>
                <span className="btn-arrow">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              </button>
            </form>
          </div>

        </div>

        {/* ================= SECTION 2: MAP & CARD INFO ================= */}
        <div className="contact-grid-row contact-row-bottom">
          
          {/* LEFT COLUMN: INFO CARDS */}
          <div className="contact-card card-info-grid">
            <div className="card-header">
              <span className="card-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </span>
              <h3>{t("Contact Information")}</h3>
            </div>

            <div className="info-boxes-grid">
              
              <div className="info-block-box">
                <div className="info-box-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h4>{t("Address")}</h4>
                <p>
                  <strong>{orgName} (HQ)</strong><br />
                  Varunalaya Ph-II, Jhandewalan,<br />
                  Karol Bagh, New Delhi – 110005
                </p>
              </div>

              <div className="info-block-box">
                <div className="info-box-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <h4>{t("Call Center")}</h4>
                <p>
                  1916 / 1800117118<br />
                  WhatsApp: 9650291021
                </p>
              </div>

              <div className="info-block-box">
                <div className="info-box-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <h4>{t("Email Us")}</h4>
                <p className="email-text">djb-helpdesk@nic.in</p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: GOOGLE MAP */}
          <div className="contact-card card-map">
            <div className="card-header">
              <span className="card-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
              </span>
              <h3>{t("Locate Us")}</h3>
            </div>

            <div className="google-map-wrapper">
              <iframe
                title={t("{{orgName}} Location", { orgName })}
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d448073.27597634436!2d76.4833054!3d28.6725173!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0290b748ea31%3A0x3262145d8635b05a!2sDelhi%20Jal%20Board!5e0!3m2!1sen!2sin!4v1766336407906!5m2!1sen!2sin"
                width="100%"
                height="320"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>

        </div>

      </div>

      <Footer {...props} />
    </React.Fragment>
  );
};

export default ContactUs;
