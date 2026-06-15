import { Card, Header, KeyNote, Loader, SubmitBar } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WSConnection from "./WSConnection";
import WSInfoLabel from "../../../pageComponents/WSInfoLabel";

const MyConnections = ({ view }) => {
  const { t } = useTranslation();
  const user = Digit.UserService.getUser();
  const tenantId = "dl.djb";
  let filter = window.location.href.split("/").pop();
  let t1;
  let off;
  if (!isNaN(parseInt(filter))) {
    off = filter;
    t1 = parseInt(filter) + 50;
  } else {
    t1 = 4;
  }

  const userMobileNumber = user?.info?.userName?.match(/^[0-9]{10}$/) ? user?.info?.userName : user?.info?.mobileNumber;

  let filter1 = !isNaN(parseInt(filter))
    ? { tenantId: tenantId, mobileNumber: userMobileNumber, searchType: "CONNECTION" }
    : { tenantId: tenantId, mobileNumber: userMobileNumber, searchType: "CONNECTION" };

  const { isLoading, isError, error, data } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1 }, { filters: filter1 });

  const { isLoading: isSWLoading, isError: isSWError, error: SWerror, data: SWdata } = Digit.Hooks.ws.useMyApplicationSearch(
    { filters: filter1, BusinessService: "SW" },
    { filters: filter1 }
  );
  let connectionList = data?.WaterConnection.concat(SWdata?.SewerageConnections);
  let applicationNoWS = (data && data?.WaterConnection?.map((ob) => ob?.propertyId).join(",")) || "";
  let applicaionNoSW = (SWdata && SWdata?.SewerageConnections?.map((ob) => ob?.propertyId).join(",")) || "";
  let applicationNos = applicationNoWS.concat(applicaionNoSW);
  const { isLoading: PTisLoading, isError: PTisError, error: PTerror, data: PTdata } = Digit.Hooks.pt.usePropertySearch(
    { tenantId: tenantId, filters: { mobileNumber: userMobileNumber } },
    { filters: { mobileNumber: userMobileNumber }, enabled: userMobileNumber ? true : false}
  );
  connectionList =
    connectionList &&
    connectionList.map((ob) => {
      return { ...ob, property: PTdata?.Properties?.filter((pt) => pt?.propertyId === ob?.propertyId)[0] };
    });

  if (isLoading || PTisLoading || isSWLoading) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      <Header>{`${t("WS_MYCONNECTIONS_HEADER")} ${connectionList ? `(${connectionList.length})` : ""}`}</Header>
      <WSInfoLabel t={t} /> 
      <div>
        {connectionList?.length > 0 &&
          connectionList.map((application, index) => (
            <div key={index}>
              <WSConnection application={application} />
            </div>
          ))}
        {!connectionList?.length > 0 && <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("PT_NO_APPLICATION_FOUND_MSG")}</p>}
      </div>
    </React.Fragment>
  );
};
export default MyConnections;
