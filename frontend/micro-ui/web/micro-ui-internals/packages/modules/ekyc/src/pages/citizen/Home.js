import React from "react";
import { useTranslation } from "react-i18next";
import { ModuleLinksView } from "@djb25/digit-ui-react-components";
const Home = () => {
  const { t } = useTranslation();
  const propsForModuleCard = {
    moduleName: t("ACTION_TEST_EKYC"),
    kpis: [
      {
        count: "-",
        label: t("TOTAL_EKYC"),
        link: `/digit-ui/citizen/ekyc/dashboard`,
      },
    ],
    links: [],
  };
  const citizenInfo = Digit.SessionStorage.get("User")?.info?.roles;
  const roles = Array.isArray(citizenInfo) ? citizenInfo.map((ele) => ele.code) : [];

  if (roles.includes("EKYC_SURVEYOR")) {
    propsForModuleCard.links.push({
      label: t("SURVEYOR_DASHBOARD"),
      link: `/digit-ui/citizen/ekyc/surveyor-dashboard`,
    });
  }

  if (roles.includes("EKYC_SUPERVISOR") || roles.includes("EKYC_VENDOR")) {
    propsForModuleCard.links.push(
      {
        label: t("EKYC_DASHBOARD"),
        link: `/digit-ui/citizen/ekyc/dashboard`,
      },
      {
        label: t("EKYC_INBOX"),
        link: `/digit-ui/citizen/ekyc/inbox`,
      },
      {
        label: t("EKYC_ASSIGN"),
        link: `/digit-ui/citizen/ekyc/assign`,
      }
    );
  }

  if (roles.includes("EKYC_SUPERVISOR")) {
    propsForModuleCard.links.push({
      label: t("EKYC_SUPERVISOR_DASHBOARD"),
      link: `/digit-ui/citizen/ekyc/supervisor-dashboard`,
    });
  }

  if (roles.length === 1 && roles.includes("CITIZEN")) {
    propsForModuleCard.links.push({
      label: t("EKYC_STATUS"),
      link: `/digit-ui/citizen/ekyc/:id`,
    });
  }

  return <ModuleLinksView links={propsForModuleCard.links} />;
};

export default Home;
