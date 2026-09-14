import React, { useState, Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CardSectionHeader, Modal, Row, StatusTable } from "@djb25/digit-ui-react-components";

const ViewBreakup = ({ wsAdditionalDetails, workflowDetails, print, download }) => {
  const { t } = useTranslation();
  const [popup, showPopUp] = useState(false);
  const [breakUpData, setBreakUpData] = useState({});
  const breakupRef = useRef(null);

  const formatNumber = (value, maximumFractionDigits = 2) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits });

  const formatCurrency = (value) => <span>&#8377;{formatNumber(value)}</span>;

  const DetailRows = ({ rows }) =>
    rows.map(({ label, value, currency = false, unit = "", isText = false }) => (
      <Row
        className="border-none"
        rowContainerStyle={{ margin: "0px" }}
        labelStyle={{ width: "50%" }}
        key={label}
        label={label}
        text={currency ? formatCurrency(value) : isText ? value || "-" : `${formatNumber(value)}${unit}`}
        textStyle={{ textAlign: "right" }}
      />
    ));

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const Close = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  );

  const CloseBtn = (props) => {
    return (
      <div className="icon-bg-secondary" onClick={props.onClick}>
        <Close />
      </div>
    );
  };

  const onPopupOpen = () => {
    let breakupData = wsAdditionalDetails?.additionalDetails?.data || {};
    const sessionBillData = sessionStorage.getItem("Digit.ADHOC_BILL_ADD_REBATE_DATA");
    const sessionBillFormData = sessionBillData ? JSON.parse(sessionBillData) : {};
    if (sessionBillFormData?.value?.totalAmount) breakupData = sessionBillFormData?.value;
    setBreakUpData(breakupData);
    showPopUp(true);
  };

  const getBreakupReportDetails = () => {
    const amountRows = (rows = []) =>
      rows.map((row) => ({
        title: t(row?.taxHeadCode),
        value: <span>{`₹${formatNumber(row?.amount)}`}</span>,
      }));

    const connectionHolder = wsAdditionalDetails?.additionalDetails?.appDetails?.connectionHolders?.[0];
    const applicantName = [connectionHolder?.name, connectionHolder?.middleName, connectionHolder?.lastName].filter(Boolean).join(" ") || "-";

    const mobileNumber = connectionHolder?.mobileNumber || "-";
    const appNumber = wsAdditionalDetails?.additionalDetails?.data?.applicationNo || wsAdditionalDetails?.additionalDetails?.applicationNumber || "-";

    return [
      {
        title: "Applicant Details",
        values: [
          { title: "Application Number", value: appNumber },
          { title: "Applicant Name", value: applicantName },
          { title: "Mobile Number", value: mobileNumber },
        ],
      },
      {
        title: t("WS_APPLICATION_FEE_HEADER"),
        values: amountRows([...(breakUpData?.billSlabData?.FEE || []), ...(breakUpData?.billSlabData?.CHARGES || [])]),
      },
      {
        title: t("WS_PROPERTY_DETAILS"),
        values: propertyRows.map(({ label, value, currency, unit, isText }) => ({
          title: label,
          value: currency ? `₹${formatNumber(value)}` : isText ? value || "-" : `${formatNumber(value)}${unit}`,
        })),
      },
      { title: t("WS_TAXES"), values: amountRows(breakUpData?.billSlabData?.TAX) },
      {
        title: t("WS_WATER_DEMAND_DETAILS"),
        values: waterDemandRows.map(({ label, value, currency, unit, isText }) => ({
          title: label,
          value: currency ? `₹${formatNumber(value)}` : isText ? value || "-" : `${formatNumber(value)}${unit}`,
        })),
      },
      {
        title: t("WS_INFRASTRUCTURE_CHARGE_DETAILS"),
        values: infrastructureChargeRows.map(({ label, value, currency, unit, isText }) => ({
          title: label,
          value: currency ? `₹${formatNumber(value)}` : isText ? value || "-" : `${formatNumber(value)}${unit}`,
        })),
      },
      {
        title: t("WS_TOTAL"),
        values: [{ title: t("PDF_STATIC_LABEL_CONSOLIDATED_TLAPP_TOTAL_AMOUNT"), value: `₹${formatNumber(breakUpData?.totalAmount)}` }],
      },
    ].filter((section) => section.values.length > 0);
  };

  const generateBreakupReport = (mode) => {
    const generateReport = Digit.Utils?.pdf?.generateCalculationBreakupReport;
    if (typeof generateReport === "function") {
      return generateReport({
        tenantId: Digit.ULBService.getCurrentTenantId(),
        heading: t("WS_CALCULATION_BREAKUP"),
        details: getBreakupReportDetails(),
        t,
        mode,
      });
    }

    return mode === "download" ? Digit.Download.PDF(breakupRef, t("WS_CALCULATION_BREAKUP")) : null;
  };

  const handleDownload = () => generateBreakupReport("download");

  const handlePrint = () => {
    if (Digit.Utils?.pdf?.generateCalculationBreakupReport) {
      return generateBreakupReport("print");
    }

    const content = breakupRef.current?.innerHTML;
    if (!content) return;

    if (window.mSewaApp?.isMsewaApp?.()) {
      window.mSewaApp.downloadBase64File(window.btoa(unescape(encodeURIComponent(content))), t("WS_CALCULATION_BREAKUP"));
      return;
    }

    const printWindow = window.open("", "");
    if (!printWindow) return;

    printWindow.document.write(`<html><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const propertyDetail = breakUpData?.calculationDetail?.propertyDetail;
  const waterDemandDetail = breakUpData?.calculationDetail?.waterDemandDetail;
  const infrastructureChargeDetail = breakUpData?.calculationDetail?.infrastructureChargeDetail;

  const isValidValue = (value) => value !== null && value !== undefined && value !== "" && value !== 0 && value !== "0" && value !== "0.0";

  const propertyRows = propertyDetail
    ? [
        { label: t("WS_PROPERTY_ID"), value: propertyDetail.propertyId, isText: true },
        { label: t("WS_PROPERTY_TYPE"), value: propertyDetail.propertyType, isText: true },
        { label: t("WS_PLOT_AREA"), value: propertyDetail.landArea, unit: " (sq. meter.)" },
        { label: t("WS_BUILT_UP_AREA"), value: propertyDetail.superBuiltUpArea, unit: " (sq. meter.)" },
        isValidValue(propertyDetail.farArea) ? { label: t("WS_FAR_AREA"), value: propertyDetail.farArea, isText: true } : null,
        isValidValue(propertyDetail.coveredArea) ? { label: t("WS_COVERED_AREA"), value: propertyDetail.coveredArea, isText: true } : null,
        isValidValue(propertyDetail.numberOfDwellingUnits)
          ? { label: t("WS_NUMBER_OF_DWELLING_UNITS"), value: propertyDetail.numberOfDwellingUnits, isText: true }
          : null,
        isValidValue(propertyDetail.numberOfBeds) ? { label: t("WS_NUMBER_OF_BEDS"), value: propertyDetail.numberOfBeds, isText: true } : null,
        isValidValue(propertyDetail.numberOfRooms) ? { label: t("WS_NUMBER_OF_ROOMS"), value: propertyDetail.numberOfRooms, isText: true } : null,
        isValidValue(propertyDetail.numberOfStudents)
          ? { label: t("WS_NUMBER_OF_STUDENTS"), value: propertyDetail.numberOfStudents, isText: true }
          : null,
        isValidValue(propertyDetail.numberOfStaff) ? { label: t("WS_NUMBER_OF_STAFF"), value: propertyDetail.numberOfStaff, isText: true } : null,
        { label: t("WS_USAGE_CATEGORY"), value: propertyDetail.usageCategory, isText: true },
      ].filter(Boolean)
    : [];

  const waterDemandRows = waterDemandDetail
    ? [
        { label: t("WS_CALCULATED_OCCUPANCY"), value: waterDemandDetail.calculatedOccupancy, unit: " person" },
        { label: t("WS_APPLIED_LPCD"), value: waterDemandDetail.chosenLpcd, unit: " LPD" },
        { label: t("WS_BASE_DEMAND"), value: waterDemandDetail.baseDemand, unit: " LPD" },
        { label: t("WS_CONTINGENCY_FLOATING_OCCUPANCY"), value: waterDemandDetail.contingencyPercentage, unit: "%" },
        { label: t("WS_TOTAL_WATER_DEMAND"), value: waterDemandDetail.totalWaterDemandLPD, unit: " LPD" },
      ]
    : [];

  const infrastructureChargeRows = infrastructureChargeDetail
    ? [
        { label: t("WS_COLONY_CATEGORY"), value: infrastructureChargeDetail.colonyCategory, isText: true },
        { label: t("WS_PLOT_AREA"), value: infrastructureChargeDetail.plotArea, unit: " (sq. meter.)" },
        { label: t("WS_WATER_RATE"), value: infrastructureChargeDetail.waterRatePerLPD, currency: true },
        { label: t("WS_SEWER_RATE"), value: infrastructureChargeDetail.sewerRatePerLPD, currency: true },
        { label: t("WS_WATER_INFRA_CHARGES"), value: infrastructureChargeDetail.waterComponentIFC, currency: true },
        { label: t("WS_SEWER_INFRA_CHARGES"), value: infrastructureChargeDetail.sewerComponentIFC, currency: true },
        ...(infrastructureChargeDetail.rebateAmount > 0
          ? [
              { label: t("WS_REBATE"), value: infrastructureChargeDetail.rebatePercentage, unit: "%" },
              { label: t("WS_REBATE_AMOUNT"), value: infrastructureChargeDetail.rebateAmount, currency: true },
            ]
          : []),
        ...(infrastructureChargeDetail.institutionalRebateApplied
          ? [
              { label: t("WS_INSTITUTIONAL_REBATE"), value: infrastructureChargeDetail.institutionalRebatePercentage, unit: "%" },
              { label: t("WS_INSTITUTIONAL_REBATE_AMOUNT"), value: infrastructureChargeDetail.institutionalRebateAmount, currency: true },
              { label: t("WS_INSTITUTIONAL_REBATE_REASON"), value: t(infrastructureChargeDetail.institutionalRebateReason), isText: true },
            ]
          : []),
        ...(infrastructureChargeDetail.dwellingRebateApplied
          ? [
              { label: t("WS_DWELLING_REBATE"), value: infrastructureChargeDetail.dwellingRebatePercentage, unit: "%" },
              { label: t("WS_DWELLING_REBATE_AMOUNT"), value: infrastructureChargeDetail.dwellingRebateAmount, currency: true },
              { label: t("WS_DWELLING_REBATE_REASON"), value: t(infrastructureChargeDetail.dwellingRebateReason), isText: true },
            ]
          : []),
        { label: t("WS_NET_IFC"), value: infrastructureChargeDetail.netIFC, currency: true },
      ]
    : [];

  return (
    <Fragment>
      <div style={{ lineHeight: "19px", maxWidth: "950px", minWidth: "280px" }}>
        {wsAdditionalDetails?.additionalDetails?.isViewBreakup ? (
          <div onClick={(e) => onPopupOpen()} style={{ marginTop: "12px" }}>
            <span className="add-details-link hover-button">{t("WS_PAYMENT_VIEW_BREAKUP")}</span>
          </div>
        ) : null}
        {popup && (
          <Modal
            headerBarMain={<Heading label={t("WS_CALCULATION_BREAKUP")} />}
            width="950px"
            print={print || handlePrint}
            download={download || handleDownload}
            headerBarEnd={
              <CloseBtn
                onClick={() => {
                  showPopUp(false);
                }}
              />
            }
            hideSubmit={true}
            popupStyles={{ overflowY: "auto" }} //maxHeight: "calc(100% - 90px)"
            headerBarMainStyle={{ marginBottom: "0px" }}
            popupModuleMianStyles={{ paddingTop: "0px" }}
          >
            {
              <div ref={breakupRef}>
                <StatusTable>
                  <CardSectionHeader style={{ margin: "10px 0px" }}>{t("WS_APPLICATION_FEE_HEADER")}</CardSectionHeader>
                  {breakUpData?.billSlabData?.FEE?.map((data) => (
                    <Row
                      className="border-none"
                      rowContainerStyle={{ margin: "0px" }}
                      labelStyle={{ width: "50%" }}
                      key={`${data?.taxHeadCode}`}
                      label={`${t(`${data?.taxHeadCode}`)}`}
                      text={<span>&#8377;{Number(data?.amount) || 0}</span>}
                      textStyle={{ textAlign: "right" }}
                    />
                  ))}
                  {breakUpData?.billSlabData?.CHARGES?.map((data) => (
                    <Row
                      className="border-none"
                      rowContainerStyle={{ margin: "0px" }}
                      labelStyle={{ width: "50%" }}
                      key={`${data?.taxHeadCode}`}
                      label={`${t(`${data?.taxHeadCode}`)}`}
                      text={<span>&#8377;{Number(data?.amount) || 0}</span>}
                      textStyle={{ textAlign: "right" }}
                    />
                  ))}

                  {breakUpData?.billSlabData?.TAX?.map((data) => (
                    <Row
                      className="border-none"
                      rowContainerStyle={{ margin: "0px" }}
                      labelStyle={{ width: "50%" }}
                      key={`${data?.taxHeadCode}`}
                      label={`${t(`${data?.taxHeadCode}`)}`}
                      text={<span>&#8377;{Number(data?.amount) || 0}</span>}
                      textStyle={{ textAlign: "right" }}
                    />
                  ))}

                  {propertyRows.length > 0 && (
                    <>
                      <CardSectionHeader style={{ margin: "10px 0px" }}>{t("WS_PROPERTY_DETAILS")}</CardSectionHeader>
                      <DetailRows rows={propertyRows} />
                    </>
                  )}

                  {waterDemandRows.length > 0 && (
                    <>
                      <CardSectionHeader style={{ margin: "10px 0px" }}>{t("WS_WATER_DEMAND_DETAILS")}</CardSectionHeader>
                      <DetailRows rows={waterDemandRows} />
                    </>
                  )}

                  {infrastructureChargeRows.length > 0 && (
                    <>
                      <CardSectionHeader style={{ margin: "10px 0px" }}>{t("WS_INFRASTRUCTURE_CHARGE_DETAILS")}</CardSectionHeader>
                      <DetailRows rows={infrastructureChargeRows} />
                    </>
                  )}
                  <hr style={{ color: "#cccccc", backgroundColor: "#cccccc", marginBottom: "10px" }} />
                  <Row
                    className="border-none"
                    rowContainerStyle={{ margin: "0px" }}
                    labelStyle={{ width: "50%" }}
                    key={`PDF_STATIC_LABEL_CONSOLIDATED_TLAPP_TOTAL_AMOUNT3`}
                    label={`${t(`PDF_STATIC_LABEL_CONSOLIDATED_TLAPP_TOTAL_AMOUNT`)}`}
                    text={<span>&#8377;{Number(breakUpData?.totalAmount) || 0}</span>}
                    textStyle={{ textAlign: "right", fontWeight: "700", fontSize: "24px" }}
                  />
                </StatusTable>
              </div>
            }
          </Modal>
        )}
      </div>
    </Fragment>
  );
};

export default ViewBreakup;
