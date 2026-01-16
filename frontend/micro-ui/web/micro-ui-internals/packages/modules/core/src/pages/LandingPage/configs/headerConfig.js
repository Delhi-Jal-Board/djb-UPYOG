import React from "react";
// import { Facebook } from "../../../../../../svg-components/src/svg/Facebook";
// import { MailOutline } from "../../../../../../svg-components/src/svg/MailOutline";
import VideoPlayIcon from "../icons/VideoPlayIcon";
import XIcon from "../icons/XIcon";
const headerConfig = {
  topBar: {
    showLanguage: [{
      name: "Hindi",
      type: "dropdown"
    }],
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
        url: "#",
        iconType: "component",
        icon: <VideoPlayIcon width="20" height="20" fill="#FF0000" />,
      },
      {
        name: "SOCIAL_EMAIL",
        url: "mailto:#",
        iconType: "component",
        // icon: <MailOutline width="20" height="20" fill="#000000" />,
      },
      {
        name: "SOCIAL_TWITTER",
        url: "https://x.com/DelhiJalBoard",
        iconType: "component",
        icon: <XIcon width="20" height="20" fill="#000000" />,
      },
    ],
  },

  branding: {
    logo: "https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axn3czn1s06y/b/djb-dev-asset-bucket/o/DJB_integrated_logo_without_bg_dark.png",
    alt: "ALT_INDIA_EMBLEM",
  },

  navbar: [
    { label: "HOME", link: "/" },
      { label: "ABOUT", link: "/finance-ui/about" },  // ✅ added
    { label: "HELP/SUPPORT", link: "https://forms.gle/A6vXKSED3gB1mqhF7" },
    {
      label: "TRAINING",
      link: "#downloads",
      openModal: "TRAINING_PPT"   // ✅ added
    },
    { label: "LOGIN", link: "/digit-ui/employee/user/login" },
  ],
};

export default headerConfig;
