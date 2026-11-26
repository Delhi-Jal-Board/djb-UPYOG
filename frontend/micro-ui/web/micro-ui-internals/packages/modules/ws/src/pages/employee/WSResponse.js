import { Banner, Card, CardText, SubmitBar, ActionBar, Loader } from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import getPDFData from "../../utils/getWSAcknowledgementData";
import getModifyPDFData from "../../utils/getWsAckDataForModifyPdfs";
import { useHistory } from "react-router-dom";
import * as func from "../../utils";

const WSResponse = (props) => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);
  const [waterApplicationData, setWaterApplicationData] = useState({});
  const [sewerageApplicationData, setSewerageApplicationData] = useState({});

  const hasWaterApp = !!filters?.applicationNumber;
  const hasSewerageApp = !!filters?.applicationNumber1;

  // Fix: 5th arg is userInfo, 6th is config — pass config correctly
  const { isLoading: waterLoading, isError: waterError, data: waterApplicationDetails } = Digit.Hooks.ws.useWSDetailsPage(
    t,
    tenantId,
    filters?.applicationNumber,
    "WATER",
    {},
    { enabled: hasWaterApp }
  );
  const { isLoading: sewerageLoading, isError: sewerageError, data: sewerageApplicationDetails } = Digit.Hooks.ws.useWSDetailsPage(
    t,
    tenantId,
    filters?.applicationNumber1,
    "SEWERAGE",
    {},
    { enabled: hasSewerageApp }
  );

  useEffect(() => {
    setWaterApplicationData(waterApplicationDetails);
    setSewerageApplicationData(sewerageApplicationDetails);
  }, [waterApplicationDetails, sewerageApplicationDetails]);

  const connectionNo =
    filters?.connectionNo ||
    filters?.connectionNumber ||
    props?.location?.state?.connectionNo ||
    props?.location?.state?.data?.WaterConnection?.[0]?.connectionNo ||
    props?.location?.state?.data?.WaterConnection?.connectionNo ||
    props?.location?.state?.data?.SewerageConnections?.[0]?.connectionNo ||
    props?.location?.state?.data?.SewerageConnections?.connectionNo ||
    props?.location?.state?.data?.WaterConnection?.[0]?.connectionNumber ||
    props?.location?.state?.data?.SewerageConnections?.[0]?.connectionNumber ||
    props?.location?.state?.data?.connectionNo ||
    props?.location?.state?.data?.connectionNumber ||
    waterApplicationData?.applicationData?.connectionNo ||
    sewerageApplicationData?.applicationData?.connectionNo ||
    "";

  const isConnectionActivated =
    filters?.action === "ACTIVATE_CONNECTION" ||
    filters?.status === "CONNECTION_ACTIVATED" ||
    waterApplicationData?.applicationData?.applicationStatus === "CONNECTION_ACTIVATED" ||
    sewerageApplicationData?.applicationData?.applicationStatus === "CONNECTION_ACTIVATED" ||
    Boolean(connectionNo);

  const { data: oldDataWater } = Digit.Hooks.ws.useOldValue(
    {
      tenantId,
      filters: { connectionNumber: waterApplicationData?.applicationData?.connectionNo, isConnectionSearch: true },
      businessService: "WATER",
    },
    {
      enabled: waterApplicationData?.applicationData?.applicationType?.includes("MODIFY_") ? true : false,
    }
  );

  const { data: oldDataSew } = Digit.Hooks.ws.useOldValue(
    {
      tenantId,
      filters: { connectionNumber: sewerageApplicationData?.applicationData?.connectionNo, isConnectionSearch: true },
      businessService: "SEWERAGE",
    },
    {
      enabled: sewerageApplicationData?.applicationData?.applicationType?.includes("MODIFY_") ? true : false,
    }
  );

  const oldApplicationWater = oldDataWater?.WaterConnection?.[oldDataWater?.WaterConnection?.length - 1];
  const oldApplicationSew = oldDataSew?.SewerageConnections?.[oldDataSew?.SewerageConnections?.length - 1];

  // Loading: either app fetch is pending
  const isLoading = (hasWaterApp && waterLoading) || (hasSewerageApp && sewerageLoading);

  // Error: no application numbers in URL at all, OR any active fetch returned error
  const isError = (!hasWaterApp && !hasSewerageApp) || (hasWaterApp && waterError) || (hasSewerageApp && sewerageError);

  const isSuccess = !isLoading && !isError;

  const handleAckPdfDownloadWater = async () => {
    const tenantInfo = waterApplicationData?.applicationData?.tenantId;
    let result = waterApplicationData?.applicationData;
    if (waterApplicationData?.applicationData?.applicationType?.includes("MODIFY_")) {
      const PDFdata = getModifyPDFData(
        { ...oldDataWater?.WaterConnection?.[0] },
        { ...waterApplicationData?.propertyDetails },
        tenantInfo,
        t,
        oldApplicationWater
      );
      PDFdata.then((ress) => Digit.Utils.pdf.generateModifyPdf(ress));
      return;
    }
    const PDFdata = getPDFData({ ...result }, { ...waterApplicationData?.propertyDetails }, tenantInfo, t);
    PDFdata.then((ress) => Digit.Utils.pdf.generatev1(ress));
  };

  const handleAckPdfDownloadSew = async () => {
    const tenantInfo = sewerageApplicationData?.applicationData?.tenantId;
    let result = sewerageApplicationData?.applicationData;
    if (sewerageApplicationData?.applicationData?.applicationType?.includes("MODIFY_")) {
      const PDFdata = getModifyPDFData(
        { ...oldDataSew?.SewerageConnections?.[0] },
        { ...sewerageApplicationData?.propertyDetails },
        tenantInfo,
        t,
        oldApplicationSew
      );
      PDFdata.then((ress) => Digit.Utils.pdf.generateModifyPdf(ress));
      return;
    }
    const PDFdata = getPDFData({ ...result }, { ...sewerageApplicationData?.propertyDetails }, tenantInfo, t);
    PDFdata.then((ress) => Digit.Utils.pdf.generatev1(ress));
  };

  const handleWaterDownloadPdf = async () => {
    const tenantInfo = waterApplicationData?.applicationData?.tenantId;
    let res = waterApplicationData?.applicationData;
    const propertDetails = waterApplicationData?.propertyDetails;
    const PDFdata = getPDFData({ ...res }, { ...propertDetails }, tenantInfo, t);
    PDFdata.then((ress) => Digit.Utils.pdf.generate(ress));
  };

  const handleSewerageDownloadPdf = async () => {
    const tenantInfo = sewerageApplicationData?.applicationData?.tenantId;
    let res = sewerageApplicationData?.applicationData;
    const propertDetails = sewerageApplicationData?.propertyDetails;
    const PDFdata = getPDFData({ ...res }, { ...propertDetails }, tenantInfo, t);
    PDFdata.then((ress) => Digit.Utils.pdf.generate(ress));
  };

  const onSubmit = () => {
    let isEmployee = window.location.href.includes("/employee");
    history.push(isEmployee ? `/digit-ui/employee` : `/digit-ui/citizen`);
  };

  if (isLoading) {
    return <Loader />;
  }

  const bannerMessage = !isSuccess
    ? t("WS_APPLICATION_SUBMIT_FAILED_LABEL")
    : isConnectionActivated
    ? t("WS_CONNECTION_ACTIVATED_SUCCESSFULLY_LABEL") &&
      t("WS_CONNECTION_ACTIVATED_SUCCESSFULLY_LABEL") !== "WS_CONNECTION_ACTIVATED_SUCCESSFULLY_LABEL"
      ? t("WS_CONNECTION_ACTIVATED_SUCCESSFULLY_LABEL")
      : "Connection Activated Successfully"
    : t("WS_APPLICATION_SUBMITTED_SUCCESSFULLY_LABEL");

  const bannerInfo = connectionNo
    ? t("WS_ACK_COMMON_CONNECTION_NO") || "Connection No"
    : isSuccess && filters?.applicationNumber
    ? t("WS_WATER_APPLICATION_NUMBER_LABEL")
    : "";

  const bannerAppNumber = connectionNo || (isSuccess ? filters?.applicationNumber : undefined);

  const bannerInfoOne =
    connectionNo && filters?.applicationNumber
      ? t("WS_WATER_APPLICATION_NUMBER_LABEL") || "Application No"
      : isSuccess && filters?.applicationNumber1
      ? t("WS_SEWERAGE_APPLICATION_NUMBER_LABEL")
      : "";

  const bannerAppNumberOne =
    connectionNo && filters?.applicationNumber ? filters?.applicationNumber : isSuccess ? filters?.applicationNumber1 : undefined;

  return (
    <div>
      <Card>
        <Banner
          message={bannerMessage}
          applicationNumber={bannerAppNumber}
          applicationNumberOne={bannerAppNumberOne}
          info={bannerInfo}
          infoOne={bannerInfoOne}
          successful={isSuccess}
          style={{ padding: "10px" }}
          headerStyles={{ fontSize: "32px" }}
          infoOneStyles={{ paddingTop: "20px" }}
        />

        {isSuccess && (
          <React.Fragment>
            {connectionNo && (
              <div
                style={{
                  marginTop: "16px",
                  marginBottom: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <CardText style={{ fontSize: "18px", color: "#0B0C0C", margin: 0 }}>
                  <strong>{t("WS_COMMON_TABLE_COL_CONNECTION_NO") || "Connection No"}: </strong>
                  <span style={{ color: "#1a67a3", fontWeight: "bold", fontSize: "20px" }}>{connectionNo}</span>
                </CardText>
                {filters?.applicationNumber && (
                  <CardText style={{ fontSize: "14px", color: "#505A5F", marginTop: "6px", marginBottom: 0 }}>
                    <strong>{t("WS_WATER_APPLICATION_NUMBER_LABEL") || "Application No"}: </strong>
                    <span>{filters?.applicationNumber}</span>
                  </CardText>
                )}
              </div>
            )}
            <CardText style={{ paddingBottom: "10px", marginBottom: "10px" }}>
              {isConnectionActivated
                ? t("WS_CONNECTION_ACTIVATED_DESC") ||
                  "The water connection has been successfully activated. You can track this connection using the Connection Number above."
                : t("WS_MESSAGE_SUB_DESCRIPTION_LABEL")}
            </CardText>
            {/* <div style={{ display: "flex" }}>
              {filters?.applicationNumber && (
                <div
                  className="primary-label-btn d-grid"
                  style={{ marginLeft: "unset", marginBottom: "10px", padding: "0px 8px" }}
                  onClick={handleAckPdfDownloadWater}
                >
                  <svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.3334 8H14V0H6.00002V8H0.666687L10 17.3333L19.3334 8ZM0.666687 20V22.6667H19.3334V20H0.666687Z" fill="#a82227" />
                  </svg>
                  {t("WS_PRINT_WATER_APPLICATION_LABEL")}
                </div>
              )}
              {filters?.applicationNumber1 && (
                <div
                  className="primary-label-btn d-grid"
                  style={{ marginLeft: "unset", marginBottom: "10px", padding: "0px 8px" }}
                  onClick={handleAckPdfDownloadSew}
                >
                  <svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.3334 8H14V0H6.00002V8H0.666687L10 17.3333L19.3334 8ZM0.666687 20V22.6667H19.3334V20H0.666687Z" fill="#a82227" />
                  </svg>
                  {t("WS_PRINT_SEWERAGE_APPLICATION_LABEL")}
                </div>
              )}
            </div> */}
            <div>
              {waterApplicationData?.applicationData?.applicationStatus === "PENDING_FOR_PAYMENT" && (
                <div style={{ marginTop: "10px" }}>
                  <SubmitBar
                    label={t("MAKE_PAYMENT")}
                    onSubmit={() => {
                      let isEmployee = window.location.href.includes("/employee");
                      let businessService = waterApplicationData?.applicationData?.applicationNo?.includes("DC") ? "WS" : "WS.ONE_TIME_FEE";
                      let consumerCodeOriginal = waterApplicationData?.applicationData?.applicationNo?.includes("DC")
                        ? waterApplicationData?.applicationData?.connectionNo
                        : waterApplicationData?.applicationData?.applicationNo;
                      let consumerCode = func.stringReplaceAll(consumerCodeOriginal, "/", "+");
                      let tenantId = waterApplicationData?.applicationData?.tenantId;
                      let consumerName =
                        waterApplicationData?.applicationData?.connectionHolders?.map((o) => o.name).join(",") ||
                        waterApplicationData?.propertyDetails?.owners?.map((o) => o.name).join(",");
                      let isDisconnectFlow = waterApplicationData?.applicationData?.applicationNo?.includes("DC");
                      if (isEmployee) {
                        history.push({
                          pathname: `/digit-ui/employee/payment/collect/${businessService}/${encodeURIComponent(consumerCodeOriginal)}/${tenantId}`,
                          search: `?tenantId=${tenantId}&consumerCode=${consumerCodeOriginal}&ISWSAPP&applicationNumber=${consumerCodeOriginal}`,
                          state: {},
                        });
                      } else {
                        history.push({
                          pathname: `/digit-ui/citizen/payment/my-bills/${businessService}/${consumerCode}`,
                          search: `?workflow=WNS&tenantId=${tenantId}&ConsumerName=${consumerName}&isDisoconnectFlow=${isDisconnectFlow}&consumerCode=${consumerCodeOriginal}`,
                          state: {},
                        });
                      }
                    }}
                  />
                </div>
              )}
              {sewerageApplicationData?.applicationData?.applicationStatus === "PENDING_FOR_PAYMENT" && (
                <div style={{ marginTop: "10px", marginLeft: "10px" }}>
                  <SubmitBar
                    label={t("MAKE_PAYMENT")}
                    onSubmit={() => {
                      let isEmployee = window.location.href.includes("/employee");
                      let businessService = sewerageApplicationData?.applicationData?.applicationNo?.includes("DC") ? "SW" : "SW.ONE_TIME_FEE";
                      let consumerCodeOriginal = sewerageApplicationData?.applicationData?.applicationNo?.includes("DC")
                        ? sewerageApplicationData?.applicationData?.connectionNo
                        : sewerageApplicationData?.applicationData?.applicationNo;
                      let consumerCode = func.stringReplaceAll(consumerCodeOriginal, "/", "+");
                      let tenantId = sewerageApplicationData?.applicationData?.tenantId;
                      let consumerName =
                        sewerageApplicationData?.applicationData?.connectionHolders?.map((o) => o.name).join(",") ||
                        sewerageApplicationData?.propertyDetails?.owners?.map((o) => o.name).join(",");
                      let isDisconnectFlow = sewerageApplicationData?.applicationData?.applicationNo?.includes("DC");
                      if (isEmployee) {
                        history.push({
                          pathname: `/digit-ui/employee/payment/collect/${businessService}/${encodeURIComponent(consumerCodeOriginal)}/${tenantId}`,
                          search: `?tenantId=${tenantId}&consumerCode=${consumerCodeOriginal}&ISWSAPP&applicationNumber=${consumerCodeOriginal}`,
                          state: {},
                        });
                      } else {
                        history.push({
                          pathname: `/digit-ui/citizen/payment/my-bills/${businessService}/${consumerCode}`,
                          search: `?workflow=WNS&tenantId=${tenantId}&ConsumerName=${consumerName}&isDisoconnectFlow=${isDisconnectFlow}&consumerCode=${consumerCodeOriginal}`,
                          state: {},
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {isError && (
          <CardText style={{ paddingBottom: "10px", marginBottom: "10px", color: "#B91900" }}>{t("WS_APPLICATION_SUBMIT_FAILED_DESC")}</CardText>
        )}

        <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
          <SubmitBar label={t("CORE_COMMON_GO_TO_HOME")} onSubmit={onSubmit} style={{ margin: "10px 10px 0px 0px" }} />
        </ActionBar>
      </Card>
    </div>
  );
};

export default WSResponse;
