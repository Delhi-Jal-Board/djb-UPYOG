import { PersonIcon, EmployeeModuleCard } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { label } from "three/tsl";

const EKYCCard = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const citizenInfo = Digit.SessionStorage.get("User")?.info?.roles;
  const roles = Array.isArray(citizenInfo) ? citizenInfo.map((ele) => ele.code || ele) : [];

  const { data: listData, isLoading } = Digit.Hooks.ekyc.useEkycApplicationList(
    {},
    { tenantId, offset: 0, limit: 1 },
    { enabled: !!tenantId }
  );

  const totalCount = isLoading ? "-" : listData?.totalCount || 0;

  const isCitizen = window.location.pathname.includes("/citizen");
  const prefix = isCitizen ? "/digit-ui/citizen/ekyc" : "/digit-ui/employee/ekyc";

  let links = [];
  if (isCitizen) {
    if (roles.includes("EKYC_SURVEYOR")) {
      links.push({
        label: t("SURVEYOR_DASHBOARD"),
        link: `${prefix}/surveyor-dashboard`,
      });
    }
    if (roles.includes("EKYC_SUPERVISOR") || roles.includes("EKYC_VENDOR")) {
      links.push({
        count: totalCount,
        label: t("EKYC_INBOX"),
        link: `${prefix}/inbox`,
      });
    }
    if (roles.includes("EKYC_SUPERVISOR")) {
      links.push(
        {
          label: t("EKYC_SUPERVISOR_DASHBOARD"),
          link: `${prefix}/supervisor-dashboard`,
        },
        {
          label: t("EKYC_ASSIGN"),
          link: `${prefix}/assign`,
        }
      );
    }
    if (roles.includes("EKYC_VENDOR")) {
      links.push({
        label: t("EKYC_VENDOR_DASHBOARD"),
        link: `${prefix}/vendor-dashboard`,
      });
    }
    if (roles.includes("EKYC_SUPERVISOR") || roles.includes("EKYC_VENDOR")) {
      links.push({
        label: t("TITLE_VENDOR_MANAGEMENT"),
        link: `/digit-ui/citizen/vendor/search-vendor`,
      });
    }
    if (links.length === 0 || (roles.length === 1 && roles.includes("CITIZEN"))) {
      links.push({
        label: t("EKYC_STATUS"),
        link: `${prefix}/:id`,
      });
    }
  } else {
    // Employee links
    links = [
      // {
      //   label: t("CEO_M.F_DOR_FINANCE_VIEW"),
      //   link: `${prefix}/ceo-dashboard`,
      // },
      {
        label: t("EKYC_ADMIN_DASHBOARD") || "Admin Dashboard",
        link: `${prefix}/admin-dashboard`,
      },
      {
        count: totalCount,
        label: t("EKYC_INBOX"),
        link: `${prefix}/inbox`,
      },
      {
        label: t("EKYC_WORK_ORDER"),
        link: `${prefix}/work-order`,
      },
      ...(!roles.includes("EMPLOYEE")
        ? [
          {
            label: t("EKYC_ASSIGN"),
            link: `${prefix}/assign`,
          },
        ]
        : []),
    ];
  }

  const propsForModuleCard = {
    Icon: <PersonIcon />,
    moduleName: t("ACTION_TEST_EKYC"),
    kpis: isCitizen
      ? []
      : [
        {
          count: totalCount,
          label: t("TOTAL_EKYC"),
          link: `${prefix}/admin-dashboard`,
        },
      ],
    links: links,
  };

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default EKYCCard;
