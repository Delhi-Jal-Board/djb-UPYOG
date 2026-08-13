import React from "react";
import { EmailIcon } from "@djb25/digit-ui-react-components";
// import { Facebook } from "../../../../../../svg-components/src/svg/Facebook";
// import { MailOutline } from "../../../../../../svg-components/src/svg/MailOutline";
import VideoPlayIcon from "../icons/VideoPlayIcon";
import XIcon from "../icons/XIcon";

/* =========================
   🔹 Context Path Resolver
========================= */
const contextPath = window?.contextPath || "digit-ui";

const headerConfig = {
  /* =========================
     🔹 Top Bar Config
  ========================= */
  topBar: {
    showLanguage: [
      {
        name: "Hindi",
        type: "dropdown",
      },
    ],
    organizationName: "Delhi Jal Board",
    socialLinks: [
      {
        name: "SOCIAL_FACEBOOK",
        url: "https://www.facebook.com/OfficialDelhiJalBoard/",
        iconType: "component",
        // icon: <Facebook width="20" height="20" fill="#1877F2" />,
      },
      {
        name: "SOCIAL_YOUTUBE",
        url: "https://www.youtube.com/@DelhiJalBoardOfficial",
        iconType: "component",
        icon: <VideoPlayIcon width="20" height="20" fill="#FF0000" />,
      },
      {
        name: "SOCIAL_EMAIL",
        url: "mailto:#",
        iconType: "component",
        icon: <EmailIcon width="20" height="20" fill="#000000" />,
      },
      {
        name: "SOCIAL_TWITTER",
        url: "https://x.com/DelhiJalBoard",
        iconType: "component",
        icon: <XIcon width="20" height="20" fill="#000000" />,
      },
    ],
  },

  /* =========================
     🔹 Branding
  ========================= */
  branding: {
    logo: "https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/DJB_integrated_logo_without_bg_dark.png",
    alt: "ALT_INDIA_EMBLEM",
  },

  /* =========================
     🔹 Navbar Links
  ========================= */
  navbar: [
    {
      label: "HOME",
      link: `/${contextPath}/home`,
    },
    {
      label: "ABOUT",
      link: `/${contextPath}/home/about`,
    },
    {
      label: "HELP/SUPPORT",
      link: `/${contextPath}/home/contact`,
    },
    {
      label: "TRAINING",
      link: "#",
      openModal: "TRAINING_PPT",
    },
    {
      label: "LOGIN",
      type: "dropdown",
      children: [
        {
          label: "Consumer Login",
          // Redirect to the citizen portal dashboard (accessible to guests/unauthenticated users)
          link: `/${contextPath}/citizen`,
        },
        {
          label: "Employee Login",
          // Direct to employee login form — avoids Keycloak check-sso redirect loop
          link: `/${contextPath}/employee/user/login`,
        },
      ],
    },
    {
      label: "REGISTER",
      link: `/${contextPath}/citizen/register/mobile-number`,
      type: "button",
    },
  ],
};

export default headerConfig;
