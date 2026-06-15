import { Header, Loader } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import WSPayment from "./WSPayments";
import WSInfoLabel from "../../../pageComponents/WSInfoLabel";

const WSMyPayments = () => {

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
    ? { tenantId: tenantId, mobileNumber: userMobileNumber, searchType:"CONNECTION" }
    : { tenantId: tenantId, mobileNumber: userMobileNumber, searchType:"CONNECTION" };

  const { isLoading, isError, error, data } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1 }, { filters: filter1 });


  const { isLoading: isSWLoading, isError : isSWError, error : SWerror, data: SWdata } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1,BusinessService:"SW"}, { filters: filter1 });
  let totalApaplications = data?.WaterConnection?.concat(SWdata?.SewerageConnections);
 
  let connectionNoWS =  data && data?.WaterConnection?.length>0? data?.WaterConnection?.map((ob) => ob.connectionNo).join(",") : null;
  let connectionNoSW =  SWdata && SWdata?.SewerageConnections?.length>0? SWdata?.SewerageConnections?.map((ob)=>ob.connectionNo).join(",") : null;
  let propertyIdWS =  data && data?.WaterConnection?.length>0? data?.WaterConnection?.map((ob) => ob.propertyId).join(",") : null;
  let propertyIdSW =  SWdata && SWdata?.SewerageConnections?.length>0? SWdata?.SewerageConnections?.map((ob)=>ob.propertyId).join(",") : null;
  let totalPropertyIds = propertyIdWS ? propertyIdWS?.concat(",",propertyIdSW) : propertyIdSW?.concat(",",propertyIdWS);
  const {data:wspayments, isLoading:iswsLoading} = Digit.Hooks.ws.useMypaymentWS({tenantId : tenantId,filters: {consumerCodes:connectionNoWS},BusinessService:"WS"},{enabled:connectionNoWS!==null?true:false});
  const {data:swpayments, isLoading:isswLoading} = Digit.Hooks.ws.useMypaymentWS({tenantId : tenantId,filters: {consumerCodes:connectionNoSW},BusinessService:"SW"},{enabled:connectionNoSW!==null?true:false});
  const {data:properties, isLoading:isPropertyLoading} = Digit.Hooks.ws.useWaterPropertySearch({tenantId : tenantId,filters: {mobileNumber:userMobileNumber}},{enabled:userMobileNumber?true:false})

  if (isLoading || iswsLoading||isswLoading||isSWLoading || isPropertyLoading) {
    return <Loader />;
  }
  const wspayment = wspayments && wspayments?.Payments || [];
  const swpayment = swpayments && swpayments?.Payments || [];

  let applicationsList = wspayment.concat(swpayment);
  applicationsList = applicationsList?.map(ob => ({...ob,details:totalApaplications?.filter(app => app?.connectionNo === ob?.paymentDetails?.[0]?.bill?.consumerCode)?.[0]}))
  applicationsList = applicationsList?.map(ob => ({...ob,property:properties?.Properties?.filter(prop => prop?.propertyId === ob?.details?.propertyId)?.[0]}))
  return (
    <React.Fragment>
      <Header>{`${t("WS_MY_PAYMENTS_HEADER")} ${applicationsList ? `(${applicationsList.length})` : ""}`}</Header>
      <WSInfoLabel t={t} /> 
      <div>
      {applicationsList?.length > 0 &&
          applicationsList.map((application, index) => (
            <div key={index}>
              <WSPayment application={application} />
            </div>
          ))}
        {!applicationsList?.length > 0 && <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("PT_NO_APPLICATION_FOUND_MSG")}</p>}
      </div>
    </React.Fragment>
  );
};


export default WSMyPayments; 