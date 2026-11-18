import React, { useEffect, useState, useMemo } from "react";
import { Loader, ShippingTruck, EmployeeModuleCard } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";

const svgIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
    <path d="M0 0h24v24H0z" fill="none"></path>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" fill="white"></path>
  </svg>
);

const DsoDashboard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { pathname } = useLocation();
  const isEmployee = pathname.includes("/employee/");
  const inboxLink = isEmployee ? "/digit-ui/employee/fsm/inbox" : "/digit-ui/citizen/fsm/inbox";

  const [total, setTotal] = useState("-");
  const [loader, setLoader] = useState(true);
  const [isDsoLoaded, setIsDsoLoaded] = useState(false);


  // fetch Status codes for DSO_ACTIONS

  const filters = {
    limit:10,
    offset:0,
    uuid: { code: "ASSIGNED_TO_ME", name: t("ES_INBOX_ASSIGNED_TO_ME") },
    sortBy: "createdTime",
    sortOrder: "DESC",
    total: true,
  };

  const { data:vendorDetails, isFetching: vendorDetailsFetching } = Digit.Hooks.fsm.useVendorDetail();

  useEffect(() => {
    if (vendorDetails?.vendor && vendorDetails.vendor.length > 0) {
      const { vendor } = vendorDetails;
      Digit.UserService.setExtraRoleDetails(vendor[0]);
      setIsDsoLoaded(true);
    } else if (vendorDetails && (!vendorDetails?.vendor || vendorDetails?.vendor?.length === 0)) {
      setIsDsoLoaded(true);
      setLoader(false);
    }
  }, [vendorDetails]);

  const { data: inbox, isFetching: inboxFetching } = Digit.Hooks.fsm.useInbox(tenantId, { ...filters }, {
    enabled: isDsoLoaded,
  }, true);
  const inprogressCount = Array.isArray(inbox?.statuses)
    ? inbox.statuses.find((e) => e.applicationstatus === "DSO_INPROGRESS")?.count || 0
    : 0;
  const pendingApprovalCount = Array.isArray(inbox?.statuses)
    ? inbox.statuses.find((e) => e.applicationstatus === "PENDING_DSO_APPROVAL")?.count || 0
    : 0;

  // const info = useMemo(
  //   () => ({
  //     [t("ES_COMPLETION_PENDING")]: inprogressCount,
  //     [t("ES_VEHICLE_ASSIGNMENT_PENDING")]: pendingApprovalCount,
  //   }),
  //   [inprogressCount, pendingApprovalCount, t]
  // );

  const links = useMemo(
    () => [
      {
        link: inboxLink,
        label: t("ES_TITLE_INBOX"),
        count: total,
      },
    ],
    [total, t, inboxLink]
  );

  useEffect(() => {
    if (inbox) {
      setTotal(inprogressCount + pendingApprovalCount);
      setLoader(false);
    } else if (!inboxFetching && isDsoLoaded) {
      setLoader(false);
    }
  }, [inbox, inboxFetching, isDsoLoaded, inprogressCount, pendingApprovalCount]);

  const handleCardClick = () => {
    history.push(inboxLink);
  };

  if (loader) {
    return <Loader />;
  }
  const propsForModuleCard = {
    Icon: <ShippingTruck />,
    moduleName: t("ES_TITLE_FAECAL_SLUDGE_MGMT"),
    kpis: [
      {
        count: inprogressCount,
        label: t("ES_COMPLETION_PENDING"),
        link: inboxLink,
      },
      {
        count: pendingApprovalCount,
        label: t("ES_VEHICLE_ASSIGNMENT_PENDING"),
        link: inboxLink,
      },
    ],
    links,
    onDetailsClick: handleCardClick,
  };
  return (
    <div className="ground-container moduleCardWrapper">
      <EmployeeModuleCard {...propsForModuleCard} onDetailsClick={handleCardClick} />
    </div>
  );
};

export default DsoDashboard;
