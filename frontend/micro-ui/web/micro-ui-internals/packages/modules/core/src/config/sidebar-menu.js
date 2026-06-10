import React from "react";
import ChangeLanguage from "../components/ChangeLanguage";

const SideBarMenu = (t, closeSidebar, redirectToLoginPage, redirectToRegisterPage, redirectToScrutinyPage, isEmployee, storeData, tenantId) => {
  let filteredTenantData = storeData?.tenants?.filter((e) => e.code === tenantId)[0]?.contactNumber || storeData?.tenants?.[0]?.contactNumber;
  return [
    {
      type: "link",
      element: "HOME",
      text: t("COMMON_BOTTOM_NAVIGATION_HOME"),
      // link: isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen",
      link: "/digit-ui/home",
      icon: "HomeIcon",
      populators: {
        onClick: closeSidebar,
      },
    },
    {
      type: "component",
      element: "LANGUAGE",
      action: <ChangeLanguage />,
      icon: "LanguageIcon",
    },
    {
      id: "login-btn",
      element: "LOGIN",
      text: t("CORE_COMMON_LOGIN"),
      icon: "LoginIcon",
      populators: {
        onClick: redirectToLoginPage,
      },
    },
    {
      id: "register-btn",
      element: "REGISTER",
      text: t("CORE_COMMON_REGISTER"),
      icon: "AddressBookIcon",
      populators: {
        onClick: redirectToRegisterPage,
      },
    },
    /*
    Config for "Scrutiny" button in the sidebar.
    Triggers redirectToScrutinyPage on click.
  */
    {
      id: "scrutiny-btn",
      element: "SCRUTINY",
      text: t("Scrutiny"),
      icon: "LocationIcon",
      populators: {
        onClick: redirectToScrutinyPage,
      },
    },
    {
      id: "help-line",
      text: (
        <React.Fragment>
          {t("CS_COMMON_HELPLINE")}
          <div className="telephone">
            <div className="link">
              <a href={`tel:${filteredTenantData}`}>{filteredTenantData}</a>
            </div>
          </div>
        </React.Fragment>
      ),
      element: "Helpline",
      icon: "Phone",
    },
  ];
};

export default SideBarMenu;
