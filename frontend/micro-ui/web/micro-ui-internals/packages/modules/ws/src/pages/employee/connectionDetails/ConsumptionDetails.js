import {
  ActionBar,
  Card,
  DatePicker,
  Dropdown,
  FormComposer,
  Header,
  Loader,
  Modal,
  Row,
  StatusTable,
  SubmitBar,
  Toast,
  VerticalTimeline,
} from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as func from "../../../utils";

const ConsumptionDetails = ({ view }) => {
  const { t } = useTranslation();
  const user = Digit.UserService.getUser();
  const tenantId = user?.info?.tenantId || Digit.ULBService.getCurrentTenantId();
  let filters = func.getQueryStringParams(window.location.search);
  const { applicationNo } = Digit.Hooks.useQueryParams();
  const serviceType = filters?.service;
  let filter1 = { tenantId: tenantId, connectionNos: applicationNo };
  const [openModal, setOpenModal] = useState(false);
  const [meterDetails, setMeterDetails] = useState({});
  const [defaultValues, setDefaultValues] = useState({});
  const businessService = serviceType === "WATER" ? "WS" : "SW";
  const mobileView = Digit.Utils.browser.isMobile() ? true : false;
  const [selectMeterStatus, setSelectMeterStatus] = useState("");
  const [showToast, setShowToast] = useState(null);
  const [error, setError] = useState(null);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [currentMeterReading, setCurrentReading] = useState("");
  const [selectedConsumtion, setConsumption] = useState("");
  const [selectReadingQualityCode, setSelectReadingQualityCode] = useState("");
  const [currentBillingPeriod, setBillingPeriod] = useState("");
  const [isAddMeterReadingButtonEnable, setisAddMeterReadingButtonEnable] = useState(false);
  const userInfo = Digit.UserService.getUser();
  const userRoles = userInfo.info.roles.map((roleData) => roleData.code);
  const isUserAllowedToAddMeterReading = userRoles.filter((role) => role === "WS_CEMP" || role === "SW_CEMP").length > 0;

  const [meterReadingDetailsModal, setMeterReadingDetailsModal] = useState(false);
  const [meterReadingDetailsData, setMeterReadingDetailsData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewMeterReadingDetails = (application) => {
    setIsLoadingDetails(true);
    setMeterReadingDetailsModal(true);

    const tenantIdStr = application?.tenantId || tenantId;
    const connectionNoStr = application?.connectionNo || applicationNo;
    const billingCycleIdStr = application?.billingCycleId || application?.billingPeriodId || application?.id;

    fetchBillingStatement(
      { tenantId: tenantIdStr, connectionNo: connectionNoStr, billingCycleId: billingCycleIdStr },
      {
        onSuccess: (data) => {
          setMeterReadingDetailsData(data?.billingStatement);
          setIsLoadingDetails(false);
        },
        onError: (error) => {
          console.error(error);
          setShowToast({ key: "error", message: t("ERROR_FETCHING_METER_READING_DETAILS") });
          setMeterReadingDetailsModal(false);
          setIsLoadingDetails(false);
        },
      }
    );
  };

  const { mutate: fetchBillingStatement } = Digit.Hooks.ws.useWSBillingStatement(businessService);

  const { isLoading, isError, data: response } = Digit.Hooks.ws.useWSConsumptionSearch({ filters: filter1 }, { filters: filter1 });

  const { isLoading: meterStatusLoading, data: mdmsMeterStatus } = Digit.Hooks.ws.useGetMeterStatusList(tenantId);
  const { isLoading: billingPeriodLoading, data: mdmsBillingPeriod } = Digit.Hooks.ws.useGetBillingPeriodValidation(tenantId);
  const { isLoading: readingQualityLoading, data: DJBReadingQualityCode } = Digit.Hooks.ws.useDjbReadingQualityCodeList(tenantId);

  let connectionFilters = {
    connectionNumber: applicationNo,
  };

  const { isLoading: isConnectionDetailsLoading, data: connectionDetailsData } = Digit.Hooks.ws.useOldValue({
    tenantId: tenantId,
    filters: { ...connectionFilters },
    businessService: businessService === "WS" ? "WATER" : "SEWERAGE",
  });

  const {
    isLoading: updatingMeterConnectionLoading,
    isError: updateMeterConnectionError,
    data: updateMeterConnectionResponse,
    error: updateMeterError,
    mutate: meterReadingMutation,
  } = Digit.Hooks.ws.useMeterReadingCreateAPI(businessService);

  useEffect(() => {
    if (!isConnectionDetailsLoading) {
      let connectionDetails = businessService == "WS" ? connectionDetailsData?.WaterConnection : connectionDetailsData?.SewerageConnections;
      let connectionData = connectionDetails?.filter((ob) => ob?.applicationType?.includes("DISCONNECT"));
      if (connectionData?.length == 0) setisAddMeterReadingButtonEnable(true);
      connectionData?.map((data) => {
        if (data?.applicationStatus === "DISCONNECTION_EXECUTED" || data?.applicationStatus === "PENDING_FOR_DISCONNECTION_EXECUTION")
          setisAddMeterReadingButtonEnable(false);
        else setisAddMeterReadingButtonEnable(true);
      });
    }
  }, [connectionDetailsData]);

  const convertDateToEpoch = (dateString, dayStartOrEnd = "dayend") => {
    //example input format : "2018-10-02"
    try {
      const parts = dateString.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      const DateObj = new Date(Date.UTC(parts[1], parts[2] - 1, parts[3]));
      DateObj.setMinutes(DateObj.getMinutes() + DateObj.getTimezoneOffset());
      if (dayStartOrEnd === "dayend") {
        DateObj.setHours(DateObj.getHours() + 24);
        DateObj.setSeconds(DateObj.getSeconds() - 1);
      }
      return DateObj.getTime();
    } catch (e) {
      return dateString;
    }
  };
  const getBillingPeriodFromMdms = mdmsBillingPeriod?.MdmsRes?.["ws-services-masters"]?.billingPeriod?.filter((e) => e.connectionType === "Metered");

  const popUp = () => {
    setOpenModal(true);
    setMeterDetails(response?.meterReadings[0]);
    setSelectMeterStatus({
      code: response?.meterReadings[0]?.meterStatus,
      i18nKey: `WS_SERVICES_CALCULATION_METERSTATUS_${Digit.Utils.locale.getTransformedLocale(response?.meterReadings[0]?.meterStatus)}`,
    });
    setBillingPeriod(`${getDate(meterDetails?.currentReadingDate)} - ${getDate(convertDateToEpoch(Digit.Utils.date.getDate()))}`);
  };

  const closeModal = () => {
    setOpenModal(false);
  };
  const closeToast = () => {
    setShowToast(false);
    setError(null);
  };

  const onSubmit = async (data) => {
    let fromDate = parseInt(meterDetails?.currentReadingDate);
    let selectedDate = parseInt(convertDateToEpoch(data?.currentReadingDate));
    let toDate = parseInt(convertDateToEpoch(Digit.Utils.date.getDate()));
    if (selectMeterStatus?.code === "Working") {
      if (!data?.currentReading || data?.currentReading == null || data?.currentReading === "") {
        setShowToast({ key: "error", message: t("ERR_CURRENT_READING_REQUIRED") });
        setError(t("ERR_CURRENT_READING_REQUIRED"));
        setTimeout(closeToast, 5000);
        return;
      }
      if (selectedDate < fromDate || selectedDate > toDate) {
        setShowToast({ key: "error", message: t("ERR_CURRENT_READING_DATE_SHOULD_NOT_BE_LESS_THAN_FROM_DATE_AND_NOT_GREATER_THAN_TO_DATE") });
        setError(t("ERR_CURRENT_READING_DATE_SHOULD_NOT_BE_LESS_THAN_FROM_DATE_AND_NOT_GREATER_THAN_TO_DATE"));
        setTimeout(closeToast, 5000);
        return;
      }
      //check if the current reading is less than last reading
      if (data?.currentReading <= details?.[0]?.currentReading) {
        setShowToast({ key: "error", message: t("CURRENT_READING_ERROR") });
        setError(t("CURRENT_READING_ERROR"));
        setTimeout(closeToast, 5000);
        return;
      }
    } else {
      data.currentReading = parseInt(meterDetails?.currentReading) + parseInt(data?.consumption);
    }
    let meterReadingsJS = {
      billingPeriod: `${getDate(meterDetails?.currentReadingDate)} - ${getDate(data?.currentReadingDate)}`,
      connectionNo: meterDetails?.connectionNo,
      currentReading: data?.currentReading,
      currentReadingDate: convertDateToEpoch(data?.currentReadingDate),
      lastReading: meterDetails?.currentReading,
      lastReadingDate: meterDetails?.currentReadingDate,
      meterStatus: selectMeterStatus?.code,
      readingQualityCode: selectReadingQualityCode?.code,
      tenantId: meterDetails?.tenantId,
    };
    let meterReadingsPayload = { meterReadings: meterReadingsJS };

    if (meterReadingMutation) {
      setIsEnableLoader(true);
      await meterReadingMutation(meterReadingsPayload, {
        onError: (error, variables) => {
          setIsEnableLoader(false);
          setOpenModal(false);
          setShowToast({ key: "error", message: error?.message ? error.message : error });
          setTimeout(closeToast, 5000);
        },
        onSuccess: async (data, variables) => {
          setIsEnableLoader(false);
          setOpenModal(false);
          setShowToast({ key: "success", message: "WS_METER_READING_ADDED_SUCCESFULLY" });
          setTimeout(closeToast, 3000);
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        },
      });
    }
  };
  let optionsList = mdmsMeterStatus?.MdmsRes?.["ws-services-calculation"]?.MeterStatus?.map((status) => ({
    code: status,
    i18nKey: `WS_SERVICES_CALCULATION_METERSTATUS_${Digit.Utils.locale.getTransformedLocale(status)}`,
  }));

  const ReadingQualityCodeList = DJBReadingQualityCode?.MdmsRes?.["ws-services-calculation"]?.DJBReadingQualityCode?.map((status) => {
    const statusCode = typeof status === "object" ? status.code : status;
    return {
      code: statusCode,
      i18nKey: `WS_SERVICES_CALCULATION_DJBREADINGQUALITYCODE_${Digit.Utils.locale.getTransformedLocale(statusCode)}`,
    };
  });

  const onFormValueChange = (setValue, formData, formState) => {
    if (selectMeterStatus?.code === "Working") {
      setCurrentReading(formData?.currentReading);
      setBillingPeriod(`${getDate(meterDetails?.currentReadingDate)} - ${getDate(formData?.currentReadingDate)}`);
      if (parseInt(currentMeterReading) < parseInt(details?.[0]?.lastReading)) {
        formData.consumption = "0";
        setConsumption("0");
      } else {
        formData.consumption = `${parseInt(currentMeterReading) - parseInt(details?.[0]?.currentReading)}`;
        setConsumption(formData.consumption);
      }
    } else {
      setConsumption(formData.consumption);
    }
  };
  let tempObj = {};
  let tempObj1 = {};
  const getDate = (epochdate) => {
    return epochdate
      ? new Date(epochdate).getDate() + "/" + (new Date(epochdate).getMonth() + 1) + "/" + new Date(epochdate).getFullYear().toString()
      : "NA";
  };

  const details = response?.meterReadings;

  const config = {
    label: {
      heading: `WS_CONSUMPTION_BUTTON_METER_READING_LABEL`,
      submit: `CORE_COMMON_SAVE`,
      cancel: "CORE_CHANGE_TENANT_CANCEL",
    },
    form: [
      {
        body: [
          {
            populators: (
              <StatusTable>
                <Row
                  key={t("WS_VIEW_BILL_BILLING_PERIOD_LABEL")}
                  label={`${t("WS_VIEW_BILL_BILLING_PERIOD_LABEL")}`}
                  text={currentBillingPeriod}
                  className="border-none"
                />
              </StatusTable>
            ),
          },
          {
            label: `${t("WS_SERV_DETAIL_METER_STAT")}`,
            isMandatory: true,
            type: "dropdown",
            populators: (
              <Dropdown
                option={optionsList}
                autoComplete="off"
                optionKey="i18nKey"
                id="meterStatus"
                select={(e) => {
                  setSelectMeterStatus(e);
                  setConsumption("");
                }}
                selected={selectMeterStatus}
                t={t}
              />
            ),
          },
          {
            populators: (
              <StatusTable>
                <Row
                  key={t("WS_CONSUMPTION_DETAILS_LAST_READING_LABEL")}
                  label={`${t("WS_CONSUMPTION_DETAILS_LAST_READING_LABEL")}`}
                  text={details?.[0]?.currentReading}
                  className="border-none"
                />
              </StatusTable>
            ),
          },
          {
            populators: (
              <StatusTable>
                <Row
                  key={t("WS_CONSUMPTION_DETAILS_LAST_READING_DATE_LABEL")}
                  label={`${t("WS_CONSUMPTION_DETAILS_LAST_READING_DATE_LABEL")}`}
                  text={getDate(details?.[0]?.currentReadingDate)}
                  className="border-none"
                />
              </StatusTable>
            ),
          },
          {
            label: t("WS_CONSUMPTION_DETAILS_CURRENT_READING_LABEL"),
            isMandatory: selectMeterStatus.code === "Working" ? true : false,
            disable: selectMeterStatus.code === "Working" ? false : true,
            type: "number",
            populators: {
              name: "currentReading",
              ...(tempObj = selectMeterStatus.code === "Working" ? {} : { value: "" }),
            },
          },
          {
            label: t("WS_CONSUMPTION_DETAILS_CURRENT_READING_DATE_LABEL"),
            isMandatory: selectMeterStatus.code === "Working" ? true : false,
            disable: selectMeterStatus.code === "Working" ? false : true,
            type: "custom",
            populators: {
              name: "currentReadingDate",
              validation: {
                required: selectMeterStatus.code === "Working" ? true : false,
              },
              customProps: {},
              defaultValue: Digit.Utils.date.getDate(),
              component: (props, customProps) => (
                <DatePicker
                  onChange={props.onChange}
                  date={props.value}
                  {...customProps}
                  disabled={selectMeterStatus.code === "Working" ? false : true}
                />
              ),
            },
          },
          {
            label: `${t("WS_READING_QUALITY_CODE")}`,
            isMandatory: true,
            type: "dropdown",
            populators: (
              <Dropdown
                option={ReadingQualityCodeList}
                autoComplete="off"
                optionKey="i18nKey"
                id="readingQualityCode"
                select={(e) => {
                  setSelectReadingQualityCode(e);
                }}
                selected={selectReadingQualityCode}
                t={t}
              />
            ),
          },
          {
            label: t("WS_SERV_DETAIL_CONSUMP"),
            isMandatory: false,
            type: "number",
            disable: selectMeterStatus.code === "Working" ? true : false,
            populators: {
              ...(tempObj1 =
                selectMeterStatus.code === "Working"
                  ? {
                      name: "consumption",
                      value: selectedConsumtion,
                    }
                  : {
                      name: "consumption",
                    }),
            },
          },
        ],
      },
    ],
  };
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

  const consumption = (currentReading, lastReading) => {
    if (currentReading && lastReading) {
      return Number(currentReading - lastReading);
    } else return t("NA");
  };

  if (isLoading || isConnectionDetailsLoading) {
    return <Loader />;
  }
  let { meterReadings } = response || {};
  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={[{ timeLine: [{ actions: "WS_VIEW_CONSUMPTION", currentStep: 1 }] }]} showFinalStep={false} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {meterReadings?.length > 0 &&
            meterReadings.map((application, index) => (
              <div key={index}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", marginTop: "8px", marginRight: "8px" }}>
                    <SubmitBar label={t("VIEW_METER_READING_DETAILS")} onSubmit={() => handleViewMeterReadingDetails(application)} />
                  </div>
                  <StatusTable>
                    <Row
                      key={t("WS_MYCONNECTIONS_CONSUMER_NO")}
                      label={`${t("WS_MYCONNECTIONS_CONSUMER_NO")}`}
                      text={application?.connectionNo || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_VIEW_BILL_BILLING_PERIOD_LABEL")}
                      label={`${t("WS_VIEW_BILL_BILLING_PERIOD_LABEL")}`}
                      text={application?.billingPeriod || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_CONSUMPTION_DETAILS_METER_STATUS_LABEL")}
                      label={`${t("WS_CONSUMPTION_DETAILS_METER_STATUS_LABEL")}`}
                      text={application?.meterStatus || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_READING_QUALITY_CODE")}
                      label={`${t("WS_READING_QUALITY_CODE")}`}
                      text={application?.readingQualityCode || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_CONSUMPTION_DETAILS_LAST_READING_LABEL")}
                      label={`${t("WS_CONSUMPTION_DETAILS_LAST_READING_LABEL")}`}
                      text={application?.lastReading || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_CONSUMPTION_DETAILS_LAST_READING_DATE_LABEL")}
                      label={`${t("WS_CONSUMPTION_DETAILS_LAST_READING_DATE_LABEL")}`}
                      text={application?.lastReadingDate ? Digit.DateUtils.ConvertEpochToDate(application?.lastReadingDate) : t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_SERV_DETAIL_CUR_METER_READ")}
                      label={`${t("WS_SERV_DETAIL_CUR_METER_READ")}`}
                      text={application?.currentReading || t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_CONSUMPTION_DETAILS_CURRENT_READING_DATE_LABEL")}
                      label={`${t("WS_CONSUMPTION_DETAILS_CURRENT_READING_DATE_LABEL")}`}
                      text={application?.currentReadingDate ? Digit.DateUtils.ConvertEpochToDate(application?.currentReadingDate) : t("NA")}
                      className="border-none"
                    />
                    <Row
                      key={t("WS_CONSUMPTION_DETAILS_CONSUMPTION_LABEL")}
                      label={`${t("WS_CONSUMPTION_DETAILS_CONSUMPTION_LABEL")}`}
                      text={consumption(application?.currentReading, application?.lastReading)}
                      className="border-none"
                    />
                  </StatusTable>
                </Card>
              </div>
            ))}
          {!meterReadings?.length > 0 && <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("WS_NO_CONSUMPTION_FOUND")}</p>}
        </div>
        {isLoading || meterStatusLoading || billingPeriodLoading || !isUserAllowedToAddMeterReading ? null : (
          <div>
            {isAddMeterReadingButtonEnable && (
              <ActionBar>
                <SubmitBar label={t("WS_CONSUMPTION_BUTTON_METER_READING_LABEL")} onSubmit={popUp} />
              </ActionBar>
            )}
          </div>
        )}
      </div>
      {openModal && (
        <Modal
          headerBarMain={<Heading label={t(config.label.heading)} />}
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelLabel={t(config.label.cancel)}
          actionCancelOnSubmit={closeModal}
          actionSaveLabel={t(config.label.submit)}
          actionSaveOnSubmit={() => {}}
          formId="modal-action"
          popupStyles={mobileView ? { width: "720px" } : {}}
          popupModuleMianStyles={mobileView ? { paddingLeft: "5px" } : {}}
        >
          {isEnableLoader ? (
            <Loader />
          ) : (
            <FormComposer
              config={config.form}
              onFormValueChange={onFormValueChange}
              cardStyle={{ marginLeft: "0px", marginRight: "0px", marginTop: "0px" }}
              className="BPAemployeeCard"
              noBoxShadow
              inline
              childrenAtTheBottom
              onSubmit={onSubmit}
              defaultValues={defaultValues}
              formId="modal-action"
            />
          )}
        </Modal>
      )}

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
            <div>
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
                  {/* <Row label={t("WS_DEVIATION_FACTOR")} text={meterReadingDetailsData.reading?.deviationFactor ?? t("NA")} className="border-none" />
                  <Row label={t("WS_UNIT")} text={meterReadingDetailsData.reading?.unit || t("NA")} className="border-none" /> */}
                </StatusTable>
              </div>

              {/* {meterReadingDetailsData.billingDecision && (
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
              )} */}

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
                          {/* <Row
                            label={t("WS_REGULAR_RULE_CODE")}
                            text={meterReadingDetailsData.charges.sewerage?.regularRuleCode || t("NA")}
                            className="border-none"
                          /> */}
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

              {/* {meterReadingDetailsData.reconciliation && (
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
              )} */}

              {/* {meterReadingDetailsData.demand && (
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
              )} */}

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
                    {/* <Row label={t("WS_DIFFERENCE")} text={meterReadingDetailsData.bill?.difference ?? t("NA")} className="border-none" />
                    <Row
                      label={t("WS_RECONCILIATION_STATUS")}
                      text={meterReadingDetailsData.bill?.reconciliationStatus || t("NA")}
                      className="border-none"
                    /> */}
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
        <Toast style={{ zIndex: "10000" }} error={showToast?.key === "error" ? true : false} label={t(showToast?.message)} onClose={closeToast} />
      )}
    </React.Fragment>
  );
};
export default ConsumptionDetails;
