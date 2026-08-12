import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useQuery } from "react-query";
import { EmployeeModuleCard, PropertyHouse } from "@djb25/digit-ui-react-components";

const VENDORCard = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const isCitizen = window.location.pathname.toLowerCase().includes("citizen");
  const tenantId = Digit.ULBService.getStateId();

  // Vendor total count
  const { data: vendorCountData } = useQuery(
    ["VENDOR_CARD_VENDOR_COUNT", tenantId],
    () => Digit.FSMService.vendorSearch(tenantId, { status: "ACTIVE", limit: 1, offset: 0 }),
    { enabled: true, staleTime: 30000 }
  );

  // Driver total count
  const { data: driverCountData } = useQuery(
    ["VENDOR_CARD_DRIVER_COUNT", tenantId],
    () => Digit.FSMService.driverSearch(tenantId, { status: "ACTIVE", limit: 1, offset: 0 }),
    { enabled: true, staleTime: 30000 }
  );

  // Vehicle total count (registered vehicles)
  const { data: vehicleCountData } = useQuery(
    ["VENDOR_CARD_VEHICLE_COUNT", tenantId],
    () => Digit.FSMService.vehiclesSearch(tenantId, { status: "ACTIVE", limit: 1, offset: 0 }),
    { enabled: true, staleTime: 30000 }
  );

  // Supervisor total count
  const { data: supervisorCountData } = useQuery(
    ["VENDOR_CARD_SUPERVISOR_COUNT", tenantId],
    () => Digit.FSMService.supervisorSearch(tenantId, { status: "ACTIVE,DISABLED", limit: 1, offset: 0 }),
    { enabled: true, staleTime: 30000 }
  );

  // Surveyor total count
  const { data: surveyorCountData } = useQuery(
    ["VENDOR_CARD_SURVEYOR_COUNT", tenantId],
    () => Digit.FSMService.surveyorSearch(tenantId, { status: "ACTIVE,DISABLED", limit: 1, offset: 0 }),
    { enabled: true, staleTime: 30000 }
  );

  let hasAccess = Digit.Utils.vendorAccess() || Digit.UserService.hasAccess(["WT_VENDOR", "MT_VENDOR"]);
  if (isCitizen) {
    hasAccess = Digit.UserService.hasAccess(["WT_VENDOR", "EKYC_VENDOR", "EKYC_SUPERVISOR"]);
  }
  if (!hasAccess) return null;

  const links = [
    {
      label: t("VENDOR_NEW_REGISTERATION"),
      link: isCitizen ? `/digit-ui/citizen/vendor/registry/new-vendor` : `/digit-ui/employee/vendor/registry/new-vendor`,
    },
    {
      label: t("SEARCH_VENDOR"),
      link: isCitizen ? `/digit-ui/citizen/vendor/search-vendor` : `/digit-ui/employee/vendor/search-vendor`,
    },
  ];

  const VENDORRole = Digit.UserService.hasAccess(["WT_VENDOR"]);

  const propsForModuleCard = {
    Icon: <PropertyHouse />,
    moduleName: t("TITLE_VENDOR_MANAGEMENT"),
    kpis: [
      {
        count: vendorCountData?.totalCount ?? 0,
        label: t("Inbox"),
        link: isCitizen ? `/digit-ui/citizen/vendor/search-vendor` : `/digit-ui/employee/vendor/search-vendor`,
      },
      // {
      //   count: vehicleCountData?.totalCount ?? 0,
      //   label: t("TOTAL_VEHICLE"),
      // },
      // {
      //   count: driverCountData?.totalCount ?? 0,
      //   label: t("TOTAL_DRIVER"),
      // },
      // {
      //   count: supervisorCountData?.totalCount ?? 0,
      //   label: t("TOTAL_SUPERVISOR"),
      // },
      // {
      //   count: surveyorCountData?.totalCount ?? 0,
      //   label: t("TOTAL_SURVEYOR"),
      // },
    ],
    links: links.filter((link) => !link?.role || VENDORRole),
    ...(isCitizen ? { onDetailsClick: () => history.push("/digit-ui/citizen/vendor/search-vendor") } : {}),
  };

  if (isCitizen) {
    return (
      <div className="wt-citizen-card-premium">
        <EmployeeModuleCard {...propsForModuleCard} />
      </div>
    );
  }

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default VENDORCard;
