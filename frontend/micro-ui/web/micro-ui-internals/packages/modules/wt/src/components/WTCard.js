import React from "react";
import { useTranslation } from "react-i18next";
import { EmployeeModuleCard, CHBIcon } from "@djb25/digit-ui-react-components";
import { APPLICATION_PATH } from "../utils";

/**
 * `WTCard` component is a module card that displays information related to the Water Tanker (WT) service.
 * It fetches data for the general inbox, displaying the total count and nearing SLA count for water tanker requests.
 * The component provides links for navigating to various WT-related pages such as the inbox, request tanker, and application search.
 * It conditionally renders the links based on the user's role (WT_CEMP). If the user doesn't have access to the WT service, the component returns null.
 * The component uses React's `useEffect` hook to update the total count once data is successfully fetched.
 *
 * @returns {JSX.Element} A module card displaying WT-related KPIs and links.
 */
const WTCard = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const emergencyRequestLabel =
    t("WT_EMERGENCY_WATER_TANKER_REQUEST") !== "WT_EMERGENCY_WATER_TANKER_REQUEST"
      ? t("WT_EMERGENCY_WATER_TANKER_REQUEST")
      : "Emergency Water Tanker Request";
  const { data: citizenInboxData, isLoading: isCitizenInboxLoading } = Digit.Hooks.useNewInboxGeneral({
    tenantId,
    ModuleCode: "WT",
    filters: { limit: 10, offset: 0, services: ["watertanker"] },
    config: {
      select: (data) => {
        return { totalCount: data?.totalCount, nearingSlaCount: data?.nearingSlaCount } || "-";
      },
      enabled: Digit.Utils.wtAccess(),
    },
  });

  const { data: fixedPointInboxData, isLoading: isFixedPointInboxLoading } = Digit.Hooks.useNewInboxGeneral({
    tenantId,
    ModuleCode: "WT",
    filters: { limit: 10, offset: 0, services: ["watertanker-fixedpoint"] },
    config: {
      select: (data) => {
        return { totalCount: data?.totalCount, nearingSlaCount: data?.nearingSlaCount } || "-";
      },
      enabled: Digit.Utils.wtAccess(),
    },
  });

  const citizenInboxCount = isCitizenInboxLoading ? "-" : citizenInboxData?.totalCount ?? 0;
  const fixedPointInboxCount = isFixedPointInboxLoading ? "-" : fixedPointInboxData?.totalCount ?? 0;

  const links = [
    {
      count: citizenInboxCount,
      label: t("ES_COMMON_INBOX_CITIZEN"),
      // subLabel: t("CITIZEN"),
      link: `${APPLICATION_PATH}/employee/wt/inbox`,
    },
    {
      count: fixedPointInboxCount,
      label: t("ES_COMMON_INBOX_FIXED_POINT"),
      // subLabel: t("FIXED_POINT"),
      link: `${APPLICATION_PATH}/employee/wt/fixed-point/inbox`,
    },
    {
      label: t("ES_COMMON_APPLICATION_SEARCH"),
      link: `${APPLICATION_PATH}/employee/wt/my-bookings`,
    },
    {
      label: t("WT_APPLICATION_CREATE"),
      link: `${APPLICATION_PATH}/employee/wt/request-service`,
    },
    {
      label: emergencyRequestLabel,
      link: `${APPLICATION_PATH}/employee/wt/fixed-point/request-service`,
    },
    {
      label: t("WT_FIXED_POINT_SCHEDULE_MANAGEMENT"),
      link: `${APPLICATION_PATH}/employee/wt/fixed-point-schedule`,
    },
    {
      label: t("WT_LIVE_TRACKING_SYSTEM"),
      link: `${APPLICATION_PATH}/employee/wt/live-tracking`,
    },
    {
      label: t("WT_SEARCH_FIX_POINT"),
      link: `${APPLICATION_PATH}/employee/wt/search-filling-fix-point`,
    },
    {
      label: t("Vendor_Assign"),
      link: `${APPLICATION_PATH}/employee/wt/vendor-assignment`,
    },
    // Water Tanker Report Link uncomment this when apis for this will be completed
    // {
    //   label: t("WT_REPORTS"),
    //   link: `${APPLICATION_PATH}/employee/wt/reports`,
    // },
  ];
  const WT_CEMP = Digit.UserService.hasAccess(["WT_CEMP"]) || false;

  const propsForModuleCard = {
    Icon: <CHBIcon />,
    moduleName: t("WT_MODULE_NAME"),
    kpis: [
      {
        count: isCitizenInboxLoading ? "-" : citizenInboxCount,
        label: t("WT_ONLINE_INBOX") !== "WT_ONLINE_INBOX" ? t("WT_ONLINE_INBOX") : "General Inbox",
        link: `${APPLICATION_PATH}/employee/wt/inbox`,
      },
      {
        count: isFixedPointInboxLoading ? "-" : fixedPointInboxCount,
        label: t("WT_EMERGENCY_INBOX") !== "WT_EMERGENCY_INBOX" ? t("WT_EMERGENCY_INBOX") : "Emergency Inbox",
        link: `${APPLICATION_PATH}/employee/wt/fixed-point/inbox`,
      },
    ],
    links: links.filter((link) => !link?.role || WT_CEMP),
  };

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default WTCard;
