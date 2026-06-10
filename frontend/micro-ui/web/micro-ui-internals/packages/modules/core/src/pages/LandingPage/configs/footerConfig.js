import React from "react";
const footerConfig = {
  logos: [
    "https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axn3czn1s06y/b/djb-dev-asset-bucket/o/DJB_integrated_logo_without_bg_dark.png",
    "http://master-jalshakti-ddws.digifootprint.gov.in/static/uploads/2023/12/9ece68c76acc2e39a8669def05f95430.png",
    "https://www.logopeople.in/wp-content/uploads/2013/01/government-of-india.jpg",
  ],

  contact: {
    title: "Get In Touch",
    lines: ["Delhi Jal Board (HQ)", "Varunalaya Ph-1 & 2", "Jhandewalan, Karol Bagh", "New Delhi-110005"],
    buttonText: "Contact Us",
  },

  government: {
    title: "About the Government",
    items: [
      {
        label: "Government of India",
        link: "https://www.india.gov.in/",
      },
      {
        label: "Government of Delhi",
        link: "https://delhi.gov.in/",
      },
      // {
      //   label: "Government of National Capital Territory of Delhi",
      //   link: "",
      // },
    ],
  },

  information: {
    title: "Information",
    items: ["Website Policies", "Copyright Policy", "Privacy Policy", "Hyperlink Policy", "Terms and Conditions", "Help"],
  },

  feedback: {
    title: "Feedback / Suggestions",
    buttonText: "💬 Feedback",
    // installTitle: "Install App",
    // appImages: ["/assets/googleplay.png", "/assets/appstore.png"],
  },

  bottom: {
    copyright: "© Copyright 2026, All Rights Reserved by Delhi Jal Board.",
    designedBy: (
      <span>
        Powered by{" "}
        <a href="https://nitcon.org/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
          NITCON Limited
        </a>
        .
      </span>
    ),
  },
};

export default footerConfig;
