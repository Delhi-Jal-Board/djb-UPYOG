import { Card, ShippingTruck } from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ApplicationLinks = ({ linkPrefix }) => {
  const { t } = useTranslation();

  const allLinks = [
    {
      text: t("ES_TITLE_NEW_DESULDGING_APPLICATION"),
      link: "/digit-ui/employee/fsm/new-application",
    },
    {
      text: t("ES_TITILE_SEARCH_APPLICATION"),
      link: `${linkPrefix}/search`,
    },
    {
      text: t("ES_TITLE_FSM_REGISTRY"),
      link: `/digit-ui/employee/fsm/registry?selectedTabs=VENDOR`,
    },
    {
      text: t("ES_COMMON_FSTP_OPERATION"),
      link: `/digit-ui/employee/fsm/fstp-operations`,
    },
    {
      text: t("ES_TITLE_VEHICLE_LOG"),
      link: `/digit-ui/employee/fsm/fstp-inbox`,
    },
    {
      text: t("ES_FSM_ADD_NEW_BUTTON"),
      link: `/digit-ui/employee/fsm/fstp-add-vehicle`,
    },
    {
      text: t("ES_TITLE_REPORTS"),
      link: `/employee/report/fsm/FSMDailyDesludingReport`,
    },
    {
      text: t("ES_FSM_VIEW_REPORTS_BUTTON"),
      link: `/employee/report/fsm/FSMFSTPPlantWithVehicleLogReport`,
    },
  ];

  const [links, setLinks] = useState([]);

  useEffect(() => {
    setLinks(allLinks);
  }, []);

  // useEffect(() => {
  //   if (isMobile) {
  //     const mobileLinks = links.filter((link) => {
  //       return link.text !== t("ES_TITLE_DASHBOARD");
  //     });
  //     setLinks(mobileLinks);
  //   }
  // }, []);

  const GetLogo = () => (
    <div className="header">
      <span className="text">{t("ES_TITLE_FAECAL_SLUDGE_MGMT")}</span>
      <span className="logo">
        <ShippingTruck />
      </span>{" "}
    </div>
  );

  return (
    <Card className="employeeCard filter">
      <div className="complaint-links-container">
        {GetLogo()}
        <div className="body">
          {links.map(({ link, text }, index) => (
            <span className="link" key={index}>
              <Link to={link}>{text}</Link>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ApplicationLinks;
