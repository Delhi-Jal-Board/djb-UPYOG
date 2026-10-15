import { Card, Header, Loader, StatusTable, SubmitBar, Table, Row, Modal, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const ConsumptionDetails = ({ view }) => {
  const { t } = useTranslation();
  const user = Digit.UserService.getUser();
  const tenantId = Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code || user?.info?.permanentCity || Digit.ULBService.getCurrentTenantId();
  const { applicationNo, service } = Digit.Hooks.useQueryParams();
  const businessService = service === "SEWERAGE" || service === "SW" ? "SW" : "WS";
  const mobileView = Digit.Utils.browser.isMobile() ? true : false;
  let filter1 = { tenantId: tenantId, connectionNos: applicationNo };

  const { isLoading, data } = Digit.Hooks.ws.useWSConsumptionSearch({ filters: filter1 }, { filters: filter1 });
  const { mutate: fetchBillingStatement } = Digit.Hooks.ws.useWSBillingStatement(businessService);

  const [meterReadingDetailsModal, setMeterReadingDetailsModal] = useState(false);
  const [meterReadingDetailsData, setMeterReadingDetailsData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showToast, setShowToast] = useState(null);

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

  const handleViewMeterReadingDetails = (application) => {
    setIsLoadingDetails(true);
    setMeterReadingDetailsModal(true);

    const tenantIdStr = application?.tenantId || tenantId;
    const connectionNoStr = application?.connectionNo || applicationNo;
    const billingCycleIdStr =
      application?.billingCycleId || application?.billingPeriodId || application?.id || "447c57bd-2e12-4c41-92e9-8a8bf7d3a368";

    fetchBillingStatement(
      { tenantId: tenantIdStr, connectionNo: connectionNoStr, billingCycleId: billingCycleIdStr },
      {
        onSuccess: (data) => {
          setMeterReadingDetailsData(data?.billingStatement);
          setIsLoadingDetails(false);
        },
        onError: (err) => {
          console.error(err);
          setShowToast({ key: "error", message: t("ERROR_FETCHING_METER_READING_DETAILS") });
          setMeterReadingDetailsModal(false);
          setIsLoadingDetails(false);
        },
      }
    );
  };

  const consumption = (currentReading, lastReading) => {
    if (
      currentReading !== null &&
      currentReading !== undefined &&
      lastReading !== null &&
      lastReading !== undefined &&
      currentReading !== "" &&
      lastReading !== ""
    ) {
      return Number(currentReading - lastReading);
    } else return t("NA");
  };

  const columns = useMemo(
    () => [
      {
        Header: t("WS_MYCONNECTIONS_CONSUMER_NO"),
        accessor: "connectionNo",
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.connectionNo || t("NA")}</span>,
      },
      {
        Header: t("WS_VIEW_BILL_BILLING_PERIOD_LABEL"),
        accessor: "billingPeriod",
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.billingPeriod || t("NA")}</span>,
      },
      {
        Header: t("WS_CONSUMPTION_DETAILS_METER_STATUS_LABEL"),
        accessor: "meterStatus",
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.meterStatus || t("NA")}</span>,
      },
      {
        Header: t("WS_READING_QUALITY_CODE"),
        accessor: "readingQualityCode",
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.readingQualityCode || t("NA")}</span>,
      },
      {
        Header: t("WS_CONSUMPTION_DETAILS_LAST_READING_LABEL"),
        accessor: "lastReading",
        disableSortBy: true,
        Cell: ({ row }) => (
          <span>{row.original?.lastReading !== undefined && row.original?.lastReading !== null ? row.original?.lastReading : t("NA")}</span>
        ),
      },
      {
        Header: t("WS_CONSUMPTION_DETAILS_LAST_READING_DATE_LABEL"),
        accessor: "lastReadingDate",
        disableSortBy: true,
        Cell: ({ row }) => (
          <span>{row.original?.lastReadingDate ? Digit.DateUtils.ConvertEpochToDate(row.original?.lastReadingDate) : t("NA")}</span>
        ),
      },
      {
        Header: t("WS_SERV_DETAIL_CUR_METER_READ"),
        accessor: "currentReading",
        disableSortBy: true,
        Cell: ({ row }) => (
          <span>{row.original?.currentReading !== undefined && row.original?.currentReading !== null ? row.original?.currentReading : t("NA")}</span>
        ),
      },
      {
        Header: t("WS_CONSUMPTION_DETAILS_CURRENT_READING_DATE_LABEL"),
        accessor: "currentReadingDate",
        disableSortBy: true,
        Cell: ({ row }) => (
          <span>{row.original?.currentReadingDate ? Digit.DateUtils.ConvertEpochToDate(row.original?.currentReadingDate) : t("NA")}</span>
        ),
      },
      {
        Header: t("WS_CONSUMPTION_DETAILS_CONSUMPTION_LABEL"),
        id: "consumption",
        disableSortBy: true,
        Cell: ({ row }) => <span>{consumption(row.original?.currentReading, row.original?.lastReading)}</span>,
      },
      {
        Header: t("WS_COMMON_TABLE_COL_ACTION_LABEL"),
        id: "action",
        disableSortBy: true,
        Cell: ({ row }) => (
          <SubmitBar
            style={{
              backgroundColor: "#0A4275",
              color: "#FFFFFF",
              minWidth: "auto",
              padding: "6px 14px",
              fontSize: "12px",
              height: "auto",
              margin: "0px",
              whiteSpace: "nowrap",
            }}
            label={t("VIEW_METER_READING_DETAILS")}
            onSubmit={() => handleViewMeterReadingDetails(row.original)}
          />
        ),
      },
    ],
    [t]
  );

  if (isLoading) {
    return <Loader />;
  }

  let { meterReadings } = data || {};

  return (
    <React.Fragment>
      {/* <div className="employee-form-section-wrapper" style={{ display: "flex", gap: "16px", width: "100%" }}>
        <VerticalTimeline config={[{ timeLine: [{ actions: "WS_VIEW_CONSUMPTION", currentStep: 1 }] }]} showFinalStep={false} /> */}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0, overflowX: "auto" }}>
          {meterReadings?.length > 0 ? (
            <Table
              t={t}
              data={meterReadings}
              columns={columns}
              totalRecords={meterReadings?.length}
              manualPagination={false}
              isPaginationRequired={true}
              pageSizeLimit={10}
              disableSort={true}
              autoSort={false}
              getCellProps={() => ({
                style: {
                  whiteSpace: "nowrap",
                  padding: "16px 14px",
                  fontSize: "14px",
                },
              })}
            />
          ) : (
            <Card>
              <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("WS_NO_CONSUMPTION_FOUND")}</p>
            </Card>
          )}
        </div>
      {/* </div> */}

      {meterReadingDetailsModal && (
        <Modal
          headerBarMain={<Heading label={t("WS_METER_READING_DETAILS")} />}
          headerBarEnd={<CloseBtn onClick={() => setMeterReadingDetailsModal(false)} />}
          actionCancelLabel={t("CORE_CHANGE_TENANT_CANCEL")}
          actionCancelOnSubmit={() => setMeterReadingDetailsModal(false)}
          hideSubmit={true}
          formId="meter-reading-details-modal"
          popupStyles={{ width: mobileView ? "100%" : "800px" }}
        >
          {isLoadingDetails ? (
            <Loader />
          ) : meterReadingDetailsData ? (
            <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <Header>{t("WS_CONSUMER_DETAILS")}</Header>
                <StatusTable>
                  <Row label={t("WS_CONNECTION_NO")} text={meterReadingDetailsData.consumer?.connectionNo || t("NA")} className="border-none" />
                  <Row label={t("WS_TARIFF_CATEGORY")} text={meterReadingDetailsData.consumer?.tariffCategory || t("NA")} className="border-none" />
                  <Row label={t("WS_PROPERTY_USAGE")} text={meterReadingDetailsData.consumer?.propertyUsage || t("NA")} className="border-none" />
                  <Row
                    label={t("WS_PROPERTY_AREA_SQM")}
                    text={meterReadingDetailsData.consumer?.propertyAreaSqm ?? t("NA")}
                    className="border-none"
                  />
                </StatusTable>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Header>{t("WS_BILLING_CYCLE")}</Header>
                <StatusTable>
                  <Row
                    label={t("WS_PERIOD_FROM")}
                    text={
                      meterReadingDetailsData.billingCycle?.periodFrom
                        ? Digit.DateUtils.ConvertEpochToDate(meterReadingDetailsData.billingCycle?.periodFrom)
                        : t("NA")
                    }
                    className="border-none"
                  />
                  <Row
                    label={t("WS_PERIOD_TO")}
                    text={
                      meterReadingDetailsData.billingCycle?.periodTo
                        ? Digit.DateUtils.ConvertEpochToDate(meterReadingDetailsData.billingCycle?.periodTo)
                        : t("NA")
                    }
                    className="border-none"
                  />
                  <Row
                    label={t("WS_READING_QUALITY_CODE")}
                    text={meterReadingDetailsData.billingCycle?.readingQualityCode || t("NA")}
                    className="border-none"
                  />
                  <Row label={t("WS_BILLING_BASIS")} text={meterReadingDetailsData.billingCycle?.billingBasis || t("NA")} className="border-none" />
                  <Row
                    label={t("WS_CORRECTION_STATUS")}
                    text={meterReadingDetailsData.billingCycle?.correctionStatus || t("NA")}
                    className="border-none"
                  />
                  <Row label={t("WS_STATUS")} text={meterReadingDetailsData.billingCycle?.status || t("NA")} className="border-none" />
                  <Row
                    label={t("WS_AVERAGE_CYCLE_COUNT")}
                    text={meterReadingDetailsData.billingCycle?.averageCycleCount ?? t("NA")}
                    className="border-none"
                  />
                  <Row
                    label={t("WS_PROVISIONAL_CYCLE_COUNT")}
                    text={meterReadingDetailsData.billingCycle?.provisionalCycleCount ?? t("NA")}
                    className="border-none"
                  />
                  <Row label={t("WS_ZRO_STATUS")} text={meterReadingDetailsData.billingCycle?.zroStatus || t("NA")} className="border-none" />
                  <Row label={t("WS_ZRO_REMARKS")} text={meterReadingDetailsData.billingCycle?.zroRemarks || t("NA")} className="border-none" />
                </StatusTable>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Header>{t("WS_READING_DETAILS")}</Header>
                <StatusTable>
                  <Row label={t("WS_PREVIOUS_READING")} text={meterReadingDetailsData.reading?.previousReading ?? t("NA")} className="border-none" />
                  <Row
                    label={t("WS_PREVIOUS_READING_DATE")}
                    text={
                      meterReadingDetailsData.reading?.previousReadingDate
                        ? Digit.DateUtils.ConvertEpochToDate(meterReadingDetailsData.reading?.previousReadingDate)
                        : t("NA")
                    }
                    className="border-none"
                  />
                  <Row label={t("WS_CURRENT_READING")} text={meterReadingDetailsData.reading?.currentReading ?? t("NA")} className="border-none" />
                  <Row
                    label={t("WS_CURRENT_READING_DATE")}
                    text={
                      meterReadingDetailsData.reading?.currentReadingDate
                        ? Digit.DateUtils.ConvertEpochToDate(meterReadingDetailsData.reading?.currentReadingDate)
                        : t("NA")
                    }
                    className="border-none"
                  />
                  <Row
                    label={t("WS_PREVIOUS_CONSUMPTION")}
                    text={meterReadingDetailsData.reading?.previousConsumption ?? t("NA")}
                    className="border-none"
                  />
                  <Row
                    label={t("WS_ACTUAL_CONSUMPTION")}
                    text={meterReadingDetailsData.reading?.actualConsumption ?? t("NA")}
                    className="border-none"
                  />
                  <Row
                    label={t("WS_MONTHLY_CONSUMPTION")}
                    text={meterReadingDetailsData.reading?.monthlyConsumption ?? t("NA")}
                    className="border-none"
                  />
                  <Row
                    label={t("WS_BILLING_CONSUMPTION")}
                    text={meterReadingDetailsData.reading?.billingConsumption ?? t("NA")}
                    className="border-none"
                  />
                  <Row label={t("WS_BILLING_DAYS")} text={meterReadingDetailsData.reading?.billingDays ?? t("NA")} className="border-none" />
                  <Row
                    label={t("WS_AVERAGE_CONSUMPTION")}
                    text={meterReadingDetailsData.reading?.averageConsumption ?? t("NA")}
                    className="border-none"
                  />
                  <Row label={t("WS_DEVIATION_FACTOR")} text={meterReadingDetailsData.reading?.deviationFactor ?? t("NA")} className="border-none" />
                  <Row label={t("WS_UNIT")} text={meterReadingDetailsData.reading?.unit || t("NA")} className="border-none" />
                </StatusTable>
              </div>

              {meterReadingDetailsData.billingDecision && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_BILLING_DECISION")}</Header>
                  <StatusTable>
                    <Row label={t("WS_BASIS")} text={meterReadingDetailsData.billingDecision?.basis || t("NA")} className="border-none" />
                    <Row label={t("WS_REASON_CODE")} text={meterReadingDetailsData.billingDecision?.reasonCode || t("NA")} className="border-none" />
                    <Row label={t("WS_REASON")} text={meterReadingDetailsData.billingDecision?.reason || t("NA")} className="border-none" />
                    <Row
                      label={t("WS_ACTUAL_READING_AVAILABLE")}
                      text={meterReadingDetailsData.billingDecision?.actualReadingAvailable ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_HISTORICAL_AVERAGE")}
                      text={meterReadingDetailsData.billingDecision?.historicalAverage ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_MINIMUM_BILLING_CONSUMPTION")}
                      text={meterReadingDetailsData.billingDecision?.minimumBillingConsumption ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_AVERAGE_CYCLE_COUNT")}
                      text={meterReadingDetailsData.billingDecision?.averageCycleCount ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_PROVISIONAL_CYCLE_COUNT")}
                      text={meterReadingDetailsData.billingDecision?.provisionalCycleCount ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_BILLING_RULE_CODE")}
                      text={meterReadingDetailsData.billingDecision?.billingRuleCode || t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_CONFIGURED_AVERAGE_MAXIMUM_CYCLES")}
                      text={meterReadingDetailsData.billingDecision?.configuredAverageMaximumCycles ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_CONFIGURED_PROVISIONAL_MAXIMUM_CYCLES")}
                      text={meterReadingDetailsData.billingDecision?.configuredProvisionalMaximumCycles ?? t("NA")}
                      className="border-none"
                    />
                  </StatusTable>
                </div>
              )}

              {meterReadingDetailsData.onePointFiveX &&
                (meterReadingDetailsData.onePointFiveX?.evaluated === true ||
                  meterReadingDetailsData.onePointFiveX?.required === true ||
                  meterReadingDetailsData.onePointFiveX?.zroRequired === true) && (
                  <div style={{ marginBottom: "16px" }}>
                    <Header>{t("WS_ONE_POINT_FIVE_X")}</Header>
                    <StatusTable>
                      <Row
                        label={t("WS_EVALUATED")}
                        text={meterReadingDetailsData.onePointFiveX?.evaluated ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                        className="border-none"
                      />
                      <Row label={t("WS_MULTIPLIER")} text={meterReadingDetailsData.onePointFiveX?.multiplier ?? t("NA")} className="border-none" />
                      <Row
                        label={t("WS_PREVIOUS_CONSUMPTION")}
                        text={meterReadingDetailsData.onePointFiveX?.previousConsumption ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_THRESHOLD_CONSUMPTION")}
                        text={meterReadingDetailsData.onePointFiveX?.thresholdConsumption ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_ACTUAL_CONSUMPTION")}
                        text={meterReadingDetailsData.onePointFiveX?.actualConsumption ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_MONTHLY_CONSUMPTION")}
                        text={meterReadingDetailsData.onePointFiveX?.monthlyConsumption ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_BILLING_DAYS")}
                        text={meterReadingDetailsData.onePointFiveX?.billingDays ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_EXCEEDED")}
                        text={meterReadingDetailsData.onePointFiveX?.exceeded ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_MINIMUM_ZRO_CONSUMPTION")}
                        text={meterReadingDetailsData.onePointFiveX?.minimumZroConsumption ?? t("NA")}
                        className="border-none"
                      />
                      <Row
                        label={t("WS_ZRO_REQUIRED")}
                        text={meterReadingDetailsData.onePointFiveX?.zroRequired ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                        className="border-none"
                      />
                      <Row label={t("WS_REASON")} text={meterReadingDetailsData.onePointFiveX?.reason || t("NA")} className="border-none" />
                    </StatusTable>
                  </div>
                )}

              {meterReadingDetailsData.charges && (
                <React.Fragment>
                  {/* Water Charges */}
                  <div style={{ marginBottom: "16px" }}>
                    <Header>{t("WS_WATER_CHARGES")}</Header>
                    <StatusTable>
                      {meterReadingDetailsData.charges.water ? (
                        <React.Fragment>
                          <Row
                            label={t("WS_WATER_CONSUMPTION")}
                            text={
                              meterReadingDetailsData.charges.water?.consumption != null
                                ? `${meterReadingDetailsData.charges.water.consumption} ${meterReadingDetailsData.charges.water?.unit || ""}`
                                : t("NA")
                            }
                            className="border-none"
                          />
                          <Row
                            label={t("WS_WATER_CATEGORY")}
                            text={meterReadingDetailsData.charges.water?.category || meterReadingDetailsData.charges.water?.tariffId || t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_VOLUMETRIC_CHARGE")}
                            text={meterReadingDetailsData.charges.water?.volumetricCharge ?? t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_SERVICE_CHARGE")}
                            text={meterReadingDetailsData.charges.water?.serviceCharge ?? t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_TOTAL_WATER_CHARGE")}
                            text={meterReadingDetailsData.charges.water?.totalWaterCharge ?? t("NA")}
                            className="border-none"
                          />
                          {meterReadingDetailsData.charges.water?.slabs?.map((slab, idx) => (
                            <Row
                              key={idx}
                              label={`${t("WS_WATER_SLAB")} ${idx + 1}`}
                              text={slab?.explanation || `${slab.units} KL @ Rs. ${slab.ratePerKl} = Rs. ${slab.charge}`}
                              className="border-none"
                            />
                          ))}
                        </React.Fragment>
                      ) : (
                        <Row label={t("WS_TOTAL_WATER_CHARGE")} text={t("NA")} className="border-none" />
                      )}
                    </StatusTable>
                  </div>

                  {/* Sewerage Charges */}
                  <div style={{ marginBottom: "16px" }}>
                    <Header>{t("WS_SEWERAGE_CHARGES")}</Header>
                    <StatusTable>
                      {meterReadingDetailsData.charges.sewerage ? (
                        <React.Fragment>
                          <Row
                            label={t("WS_REGULAR_SEWERAGE_CHARGE")}
                            text={meterReadingDetailsData.charges.sewerage?.regularCharge ?? t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_ADDITIONAL_SEWERAGE_CHARGE")}
                            text={meterReadingDetailsData.charges.sewerage?.additionalCharge ?? t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_TOTAL_SEWERAGE_CHARGE")}
                            text={meterReadingDetailsData.charges.sewerage?.totalCharge ?? t("NA")}
                            className="border-none"
                          />
                          <Row
                            label={t("WS_REGULAR_RULE_CODE")}
                            text={meterReadingDetailsData.charges.sewerage?.regularRuleCode || t("NA")}
                            className="border-none"
                          />
                          {meterReadingDetailsData.charges.sewerage?.additionalRuleCode && (
                            <Row
                              label={t("WS_ADDITIONAL_RULE_CODE")}
                              text={meterReadingDetailsData.charges.sewerage.additionalRuleCode}
                              className="border-none"
                            />
                          )}
                          <Row
                            label={t("WS_SEWERAGE_EXPLANATION")}
                            text={meterReadingDetailsData.charges.sewerage?.explanation || t("NA")}
                            className="border-none"
                          />
                        </React.Fragment>
                      ) : (
                        <Row label={t("WS_TOTAL_SEWERAGE_CHARGE")} text={t("NA")} className="border-none" />
                      )}
                    </StatusTable>
                  </div>

                  {/* Rebates */}
                  {meterReadingDetailsData.charges.rebates && (
                    <div style={{ marginBottom: "16px" }}>
                      <Header>{t("WS_REBATES")}</Header>
                      <StatusTable>
                        <Row
                          label={t("WS_TOTAL_REBATE")}
                          text={meterReadingDetailsData.charges.rebates?.totalRebate ?? t("NA")}
                          className="border-none"
                        />
                        <Row
                          label={t("WS_REBATE_EXPLANATION")}
                          text={meterReadingDetailsData.charges.rebates?.explanation || t("NA")}
                          className="border-none"
                        />
                      </StatusTable>
                    </div>
                  )}

                  {/* Summary */}
                  <div style={{ marginBottom: "16px" }}>
                    <Header>{t("WS_CHARGES_SUMMARY")}</Header>
                    <StatusTable>
                      <Row label={t("WS_GROSS_AMOUNT")} text={meterReadingDetailsData.charges?.grossAmount ?? t("NA")} className="border-none" />
                      {meterReadingDetailsData.charges.water?.totalWaterCharge != null && (
                        <Row
                          label={t("WS_TOTAL_WATER_CHARGE")}
                          text={meterReadingDetailsData.charges.water.totalWaterCharge}
                          className="border-none"
                        />
                      )}
                      {meterReadingDetailsData.charges.sewerage?.totalCharge != null && (
                        <Row
                          label={t("WS_TOTAL_SEWERAGE_CHARGE")}
                          text={meterReadingDetailsData.charges.sewerage.totalCharge}
                          className="border-none"
                        />
                      )}
                      {meterReadingDetailsData.charges.rebates?.totalRebate != null && (
                        <Row label={t("WS_TOTAL_REBATE")} text={meterReadingDetailsData.charges.rebates.totalRebate} className="border-none" />
                      )}
                      <Row label={t("WS_NET_AMOUNT")} text={meterReadingDetailsData.charges?.netAmount ?? t("NA")} className="border-none" />
                    </StatusTable>
                  </div>
                </React.Fragment>
              )}

              {meterReadingDetailsData.adjustments && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_ADJUSTMENTS")}</Header>
                  <StatusTable>
                    <Row
                      label={t("WS_PAID_CORRECTION_APPLIED")}
                      text={meterReadingDetailsData.adjustments?.paidCorrectionApplied ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_RESIDUAL_PAID_CREDIT_CREATED")}
                      text={meterReadingDetailsData.adjustments?.residualPaidCreditCreated ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_CARRIED_FORWARD_CREDIT_APPLIED")}
                      text={meterReadingDetailsData.adjustments?.carriedForwardCreditApplied ?? t("NA")}
                      className="border-none"
                    />
                  </StatusTable>
                </div>
              )}

              {meterReadingDetailsData.correction && meterReadingDetailsData.correction?.required === true && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_CORRECTION")}</Header>
                  <StatusTable>
                    <Row
                      label={t("WS_REQUIRED")}
                      text={meterReadingDetailsData.correction?.required ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                      className="border-none"
                    />
                    <Row label={t("WS_STATUS")} text={meterReadingDetailsData.correction?.status || t("NA")} className="border-none" />
                    <Row label={t("WS_REASON_CODE")} text={meterReadingDetailsData.correction?.reasonCode || t("NA")} className="border-none" />
                    <Row label={t("WS_REASON")} text={meterReadingDetailsData.correction?.reason || t("NA")} className="border-none" />
                    <Row
                      label={t("WS_PREVIOUS_OK_READING")}
                      text={meterReadingDetailsData.correction?.previousOkReading ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_CURRENT_READING")}
                      text={meterReadingDetailsData.correction?.currentReading ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_CORRECTED_CONSUMPTION")}
                      text={meterReadingDetailsData.correction?.correctedConsumption ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_PREVIOUSLY_CALCULATED_AMOUNT")}
                      text={meterReadingDetailsData.correction?.previouslyCalculatedAmount ?? t("NA")}
                      className="border-none"
                    />
                  </StatusTable>
                </div>
              )}

              {meterReadingDetailsData.reconciliation && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_RECONCILIATION")}</Header>
                  <StatusTable>
                    <Row
                      label={t("WS_CALCULATED_AMOUNT")}
                      text={meterReadingDetailsData.reconciliation?.calculatedAmount ?? t("NA")}
                      className="border-none"
                    />
                    <Row
                      label={t("WS_BILLED_AMOUNT")}
                      text={meterReadingDetailsData.reconciliation?.billedAmount ?? t("NA")}
                      className="border-none"
                    />
                    <Row label={t("WS_DIFFERENCE")} text={meterReadingDetailsData.reconciliation?.difference ?? t("NA")} className="border-none" />
                    <Row label={t("WS_STATUS")} text={meterReadingDetailsData.reconciliation?.status || t("NA")} className="border-none" />
                  </StatusTable>
                </div>
              )}

              {meterReadingDetailsData.demand && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_DEMAND")}</Header>
                  <StatusTable>
                    <Row
                      label={t("WS_CREATED")}
                      text={meterReadingDetailsData.demand?.created ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                      className="border-none"
                    />
                    <Row label={t("WS_STATUS")} text={meterReadingDetailsData.demand?.status || t("NA")} className="border-none" />
                    <Row label={t("WS_AMOUNT")} text={meterReadingDetailsData.demand?.amount ?? t("NA")} className="border-none" />
                  </StatusTable>
                </div>
              )}

              {meterReadingDetailsData.bill && (
                <div style={{ marginBottom: "16px" }}>
                  <Header>{t("WS_BILL_DETAILS")}</Header>
                  <StatusTable>
                    <Row
                      label={t("WS_BILL_GENERATED")}
                      text={meterReadingDetailsData.bill?.generated ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}
                      className="border-none"
                    />
                    <Row label={t("WS_BILL_NUMBER")} text={meterReadingDetailsData.bill?.number || t("NA")} className="border-none" />
                    <Row label={t("WS_BILL_STATUS")} text={meterReadingDetailsData.bill?.status || t("NA")} className="border-none" />
                    <Row label={t("WS_BILL_AMOUNT")} text={meterReadingDetailsData.bill?.amount ?? t("NA")} className="border-none" />
                    <Row label={t("WS_CALCULATED_AMOUNT")} text={meterReadingDetailsData.bill?.calculatedAmount ?? t("NA")} className="border-none" />
                    <Row label={t("WS_DIFFERENCE")} text={meterReadingDetailsData.bill?.difference ?? t("NA")} className="border-none" />
                    <Row
                      label={t("WS_RECONCILIATION_STATUS")}
                      text={meterReadingDetailsData.bill?.reconciliationStatus || t("NA")}
                      className="border-none"
                    />
                  </StatusTable>
                </div>
              )}

              {/* Highlighted Net Amount at the very last */}
              <div
                style={{
                  marginTop: "24px",
                  marginBottom: "8px",
                  padding: "16px 20px",
                  backgroundColor: "#FEF7F2",
                  border: "2px solid #F47738",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 6px rgba(244, 119, 56, 0.15)",
                }}
              >
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#0B0C0C" }}>{t("WS_NET_AMOUNT")}</div>
                  {meterReadingDetailsData.charges?.grossAmount != null && (
                    <div style={{ fontSize: "13px", color: "#505A5F", marginTop: "4px" }}>
                      {t("WS_GROSS_AMOUNT")}: ₹ {meterReadingDetailsData.charges.grossAmount}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#F47738" }}>
                  ₹{" "}
                  {meterReadingDetailsData.charges?.netAmount ??
                    meterReadingDetailsData.bill?.amount ??
                    meterReadingDetailsData.reconciliation?.billedAmount ??
                    t("NA")}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px" }}>{t("CS_NO_DATA")}</div>
          )}
        </Modal>
      )}

      {showToast && (
        <Toast
          style={{ zIndex: "10000" }}
          error={showToast?.key === "error" ? true : false}
          label={t(showToast?.message)}
          onClose={() => setShowToast(null)}
        />
      )}
    </React.Fragment>
  );
};

export default ConsumptionDetails;
