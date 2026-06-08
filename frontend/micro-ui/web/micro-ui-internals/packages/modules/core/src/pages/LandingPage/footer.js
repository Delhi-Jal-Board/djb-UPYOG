import React from "react";
import { useHistory } from "react-router-dom";
import footerConfig from "./configs/footerConfig";
import { SubmitBar } from "@djb25/digit-ui-react-components";

const Footer = ({ logoUrl, stateInfo }) => {
  const history = useHistory();
  const { logos, contact, government, information, feedback, bottom } = footerConfig;

  const displayLogos = logoUrl ? [logoUrl, ...logos.slice(1)] : logos;
  const orgName = "Delhi Jal Board";
  const displayCopyright = bottom.copyright.replace("Delhi Jal Board", orgName);

  return (
    <footer className="footer-wrapper">
      {/* TOP LOGOS SECTION */}
      <div className="footer-logos">
        {displayLogos.map((src, idx) => (
          <img key={idx} src={src} alt="" />
        ))}
      </div>

      {/* MAIN FOOTER GRID */}
      <div className="footer-grid">
        {/* COLUMN 1 */}
        <div className="footer-col-contact">
          <h3>{contact.title}</h3>
          <div className="contact-address-block">
            <span className="contact-icon-wrapper">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </span>
            <p className="contact-text-lines">
              {contact.lines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </p>
          </div>

          <SubmitBar
            className="contact-btn"
            label={contact.buttonText}
            onSubmit={() => {
              history.push(`/${window?.contextPath || "digit-ui"}/home/contact`);
            }}
          />
        </div>

        {/* COLUMN 2 */}
        <div>
          <h3>{government.title}</h3>
          {government.items.map((item, idx) => (
            <p key={idx} className="footer-link-item">
              <span className="link-icon-wrapper">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </span>

              <a href={item.link} target="_blank" rel="noopener noreferrer" className="link-text">
                {item.label}
              </a>
            </p>
          ))}
        </div>

        {/* COLUMN 3 */}
        <div>
          <h3>{information.title}</h3>
          {information.items.map((item, idx) => (
            <p key={idx} className="footer-link-item">
              <span className="link-icon-wrapper">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
              <span className="link-text">{item}</span>
            </p>
          ))}
        </div>

        {/* COLUMN 4 */}
        <div>
          <h3>{feedback.title}</h3>
          <SubmitBar className="feedback-btn" label={feedback.buttonText} />
        </div>
      </div>

      {/* BOTTOM COPYRIGHT SECTION */}
      <div className="footer-bottom">
        <hr className="footer-separator" />
        <div className="footer-bottom-content">
          <p className="copyright">
            {displayCopyright}
            <br />
            {bottom.designedBy}
          </p>
          <div className="footer-social-icons">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Facebook">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Twitter">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="YouTube">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
