import { FormComposer, Header, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import cloneDeep from "lodash/cloneDeep";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import { newConfig as newConfigLocal } from "../../../config/wsActivationConfig";
import { stringReplaceAll, convertDateToEpochNew, convertEpochToDates } from "../../../utils";
import * as func from "../../../utils";
import _ from "lodash";

const ActivateConnection = () => {
  const { t } = useTranslation();
  const location = useLocation();
  let state = location?.state ? (typeof location.state === "string" ? JSON.parse(location.state) : location.state) : {};
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);
  const initialAppData = cloneDeep(state?.data || state?.applicationData || (state?.applicationNo ? state : undefined));
  let details = initialAppData;
  const stateId = Digit.ULBService.getStateId();
  let tenantId = Digit.ULBService.getCurrentTenantId() || Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code;

  const [canSubmit, setSubmitValve] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [appDetails, setAppDetails] = useState({});
  const [isAppDetailsPage, setIsAppDetailsPage] = useState(false);

  let { data: newConfig, isLoading } = Digit.Hooks.ws.useWSConfigMDMS.WSActivationConfig(stateId, {});
  let { isLoading: isappdetailsLoading, isError, data: applicationDetails, error } = Digit.Hooks.ws.useWSDetailsPage(
    t,
    tenantId,
    details?.applicationNo || filters?.applicationNumber,
    details?.serviceType || filters?.service,
    { privacy: Digit.Utils.getPrivacyObject() }
  );
  details = cloneDeep(applicationDetails);
  state = { data: { ...(initialAppData || {}), ...(applicationDetails?.applicationData || {}) } };
  const {
    isLoading: updatingApplication,
    isError: updateApplicationError,
    data: updateResponse,
    error: updateError,
    mutate,
  } = Digit.Hooks.ws.useWSApplicationActions(filters?.service);

  const getActivationConfig = (cfgData, loading) => {
    const configsToUse = (!loading && cfgData && Array.isArray(cfgData) && cfgData.length > 0) ? cfgData : newConfigLocal;
    if (configsToUse && Array.isArray(configsToUse)) {
      const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN" || window.location.href.includes("/citizen");
      const configObj = configsToUse.find((conf) => conf.hideInCitizen) || configsToUse[0];
      if (configObj && configObj.body) {
        let flattenedBody = [];
        configObj.body.forEach((section) => {
          if (section.body && Array.isArray(section.body)) {
            const mappedSectionBody = section.body.map((item) => {
              if (item.key === "activationDetails" && (isCitizen || item.component === "WSActivationPageDetails")) {
                return {
                  ...item,
                  component: "WSActivationDetails",
                };
              }
              if (item.key === "supportingDocuments") {
                return {
                  ...item,
                  isMandatory: true,
                  validation: { required: true },
                };
              }
              return item;
            });
            flattenedBody = [...flattenedBody, ...mappedSectionBody];
          }
        });
        const isActivationStatus =
          filters?.action === "ACTIVATE_CONNECTION" ||
          state?.action === "ACTIVATE_CONNECTION" ||
          initialAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
          applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION");

        const currentActionHead =
          !isActivationStatus && (
            filters?.action === "ENTER_METER_DETAILS" ||
            state?.action === "ENTER_METER_DETAILS" ||
            initialAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
            applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION")
          )
            ? (t("WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS") && t("WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS") !== "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS"
                ? "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS"
                : t("ENTER_METER_DETAILS") && t("ENTER_METER_DETAILS") !== "ENTER_METER_DETAILS"
                ? "ENTER_METER_DETAILS"
                : "Enter Meter Details")
            : "WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION";

        return [
          {
            head: currentActionHead,
            body: flattenedBody,
          },
        ];
      }
    }
    return [];
  };

  const [config, setConfig] = React.useState(() => getActivationConfig(newConfig, isLoading));

  const waterSourceSubDataWithClone = state?.data?.waterSource ? cloneDeep(state?.data?.waterSource) : "";
  const waterSourceSubDataWithUS = waterSourceSubDataWithClone ? stringReplaceAll(waterSourceSubDataWithClone?.toUpperCase(), " ", "_") : "";
  const waterSourceSubDataWithCma = waterSourceSubDataWithUS ? stringReplaceAll(waterSourceSubDataWithUS?.toUpperCase(), ".", "_") : "";
  const connectionDetails =
    filters?.service === "WATER"
      ? {
          connectionType: {
            code: "Metered",
            i18nKey: "WS_CONNECTIONTYPE_METERED",
            name: "Metered",
          },
          waterSource: state?.data?.waterSource || "GROUND.WELL"
            ? {
                code: state?.data?.waterSource || "GROUND.WELL",
                i18nKey: `WS_SERVICES_MASTERS_WATERSOURCE_${stringReplaceAll((state?.data?.waterSource || "GROUND.WELL")?.split(".")[0]?.toUpperCase(), " ", "_")}`,
              }
            : "",
          sourceSubData: state?.data?.waterSource || "GROUND.WELL"
            ? {
                code: state?.data?.waterSource || "GROUND.WELL",
                i18nKey: `WS_SERVICES_MASTERS_WATERSOURCE_${waterSourceSubDataWithCma || "GROUND_WELL"}`,
              }
            : "",
          pipeSize: state?.data?.pipeSize
            ? {
                code: state?.data?.pipeSize,
                i18nKey: state?.data?.pipeSize,
              }
            : 0,
          noOfTaps: state?.data?.noOfTaps !== undefined && state?.data?.noOfTaps !== "" ? state?.data?.noOfTaps : 0,
          proposedPipeSize: 0,
          proposedTaps: 0,
          formDetails: details,
        }
      : {
          noOfWaterClosets: state?.data?.noOfWaterClosets || "",
          noOfToilets: state?.data?.noOfToilets || "",
          formDetails: details,
        };

  const plumberDetails = [
    {
      plumberName: state?.data?.plumberInfo?.[0]?.name || "",
      plumberMobileNo: state?.data?.plumberInfo?.[0]?.mobileNumber || "",
      plumberLicenseNo: state?.data?.plumberInfo?.[0]?.licenseNo || "",
      detailsProvidedBy: state?.data?.additionalDetails?.detailsProvidedBy
        ? {
            i18nKey: `WS_PLUMBER_${state?.data?.additionalDetails?.detailsProvidedBy?.toUpperCase()}`,
            code: state?.data?.additionalDetails?.detailsProvidedBy,
          }
        : "",
      applicationNo: state?.data?.applicationNo,
      key: Date.now(),
    },
  ];

  const isMeteredConn =
    !state?.data?.connectionType ||
    state?.data?.connectionType?.toUpperCase() === "METERED" ||
    state?.data?.connectionType?.toUpperCase() === "PERMANENT" ||
    state?.data?.additionalDetails?.connectionType?.toUpperCase() === "METERED" ||
    state?.data?.additionalDetails?.connectionType?.toUpperCase() === "PERMANENT";

  const activationDetails = isMeteredConn
    ? [
        {
          meterId: state?.data?.meterId || "",
          meterInstallationDate: state?.data?.meterInstallationDate ? convertEpochToDates(state?.data?.meterInstallationDate) : null,
          meterInitialReading: state?.data?.additionalDetails?.initialMeterReading || "",
          connectionExecutionDate: state?.data?.connectionExecutionDate ? convertEpochToDates(state?.data?.connectionExecutionDate) : null,
        },
      ]
    : [
        {
          connectionExecutionDate: state?.data?.connectionExecutionDate ? convertEpochToDates(state?.data?.connectionExecutionDate) : null,
        },
      ];

  const defaultValues = {
    formDetails: details,
    connectionDetails: [connectionDetails],
    plumberDetails: plumberDetails,
    activationDetails: activationDetails,
  };
  useEffect(() => {
    if (!isappdetailsLoading && details?.applicationData) {
      setAppDetails(details.applicationData);
    }
  }, [isappdetailsLoading, applicationDetails]);

  useEffect(() => {
    const updated = getActivationConfig(newConfig, isLoading);
    if (Array.isArray(updated) && updated.length > 0) {
      setConfig(updated);
    }
  }, [newConfig, isLoading, isappdetailsLoading, applicationDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAppDetailsPage) {
        const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN";
        if (isCitizen) {
          window.location.href = `${window.location.origin}/digit-ui/citizen/ws/connection/application/${filters?.applicationNumber}`;
        } else {
          window.location.href = `${window.location.origin}/digit-ui/employee/ws/application-details?applicationNumber=${filters?.applicationNumber}&service=${filters?.service}`;
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAppDetailsPage]);

  const onFormValueChange = (setValue, formData, formState) => {
    const hasDoc = !!(
      formData?.supportingDocuments?.[0]?.fileStoreId ||
      formData?.supportingDocuments?.fileStoreId ||
      (Array.isArray(formData?.supportingDocuments) && formData?.supportingDocuments?.[0]?.fileStoreId)
    );
    if (
      Object.keys(formState.errors).length > 0 &&
      Object.keys(formState.errors).length == 1 &&
      formState.errors["owners"] &&
      Object.values(formState.errors["owners"].type).filter((ob) => ob.type === "required").length == 0 &&
      Object.getPrototypeOf(formState.errors) === Object.prototype
    )
      setSubmitValve(hasDoc);
    else setSubmitValve(!Object.keys(formState.errors).length && hasDoc);
  };

  const getConvertedDate = async (dateOfTime) => {
    let dateOfReplace = stringReplaceAll(dateOfTime, "/", "-");
    let formattedDate = "";
    if (dateOfReplace.split("-")[2] > 1900) {
      formattedDate = `${dateOfReplace.split("-")[2]}-${dateOfReplace.split("-")[1]}-${dateOfReplace.split("-")[0]}`;
    } else {
      formattedDate = `${dateOfReplace.split("-")[0]}-${dateOfReplace.split("-")[2]}-${dateOfReplace.split("-")[1]}`;
    }
    const convertedDate = await convertDateToEpochNew(formattedDate);
    return convertedDate;
  };

  const closeToast = () => {
    setShowToast(null);
    // history.push(`/digit-ui/employee/ws/application-details?applicationNumber=${filters?.applicationNumber}&service=${filters?.service}`, {});
  };

  const closeToastOfError = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    const docFileStoreId =
      data?.supportingDocuments?.[0]?.fileStoreId ||
      data?.supportingDocuments?.fileStoreId ||
      (Array.isArray(data?.supportingDocuments) && data?.supportingDocuments?.[0]?.fileStoreId);
    if (!canSubmit || !docFileStoreId) {
      setShowToast({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return;
    } else {
      const formDetails = cloneDeep(data);
      const baseAppData =
        appDetails?.applicationData ||
        (appDetails?.applicationNo ? appDetails : null) ||
        details?.applicationData ||
        initialAppData ||
        {};
      const formData = cloneDeep(baseAppData);

      if (formDetails?.connectionDetails?.[0]?.connectionType?.code)
        formData.connectionType = formDetails?.connectionDetails?.[0]?.connectionType?.code;
      if (formDetails?.connectionDetails?.[0]?.waterSource?.code) formData.waterSource = formDetails?.connectionDetails?.[0]?.sourceSubData?.code;
      if (formDetails?.connectionDetails?.[0]?.pipeSize?.size) formData.pipeSize = formDetails?.connectionDetails?.[0]?.pipeSize?.size;
      if (formDetails?.connectionDetails?.[0]?.noOfTaps) formData.noOfTaps = formDetails?.connectionDetails?.[0]?.noOfTaps;

      if (formDetails?.connectionDetails?.[0]?.noOfWaterClosets) formData.noOfWaterClosets = formDetails?.connectionDetails?.[0]?.noOfWaterClosets;
      if (formDetails?.connectionDetails?.[0]?.noOfToilets) formData.noOfToilets = formDetails?.connectionDetails?.[0]?.noOfToilets;

      if (formDetails?.plumberDetails?.[0]?.detailsProvidedBy?.code) {
        if (!formData.additionalDetails) formData.additionalDetails = {};
        formData.additionalDetails.detailsProvidedBy = formDetails?.plumberDetails?.[0]?.detailsProvidedBy?.code;
      }
      if (!formData?.plumberInfo || !formData?.plumberInfo?.[0]) formData.plumberInfo = [{}];
      if (formDetails?.plumberDetails?.[0]?.plumberName) formData.plumberInfo[0].name = formDetails?.plumberDetails?.[0]?.plumberName;
      if (formDetails?.plumberDetails?.[0]?.plumberLicenseNo) formData.plumberInfo[0].licenseNo = formDetails?.plumberDetails?.[0]?.plumberLicenseNo;
      if (formDetails?.plumberDetails?.[0]?.plumberMobileNo) formData.plumberInfo[0].mobileNumber = formDetails?.plumberDetails?.[0]?.plumberMobileNo;

      const actObj = Array.isArray(formDetails?.activationDetails)
        ? formDetails?.activationDetails?.[0]
        : formDetails?.activationDetails;
      if (actObj?.meterId) formData.meterId = actObj?.meterId;
      if (actObj?.meterInstallationDate)
        formData.meterInstallationDate = await getConvertedDate(actObj?.meterInstallationDate);
      if (!formData.additionalDetails) formData.additionalDetails = {};
      formData.additionalDetails.initialMeterReading =
        actObj?.meterInitialReading !== undefined && actObj?.meterInitialReading !== ""
          ? actObj.meterInitialReading
          : "0";
      if (actObj?.connectionExecutionDate)
        formData.connectionExecutionDate = await getConvertedDate(actObj?.connectionExecutionDate);

      formData.comment = formDetails?.comments?.comments || "";

      const isPendingActivation =
        formData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
        baseAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
        filters?.action === "ACTIVATE_CONNECTION" ||
        state?.action === "ACTIVATE_CONNECTION";

      const isPendingMeter =
        !isPendingActivation && (
          formData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
          baseAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
          filters?.action === "ENTER_METER_DETAILS" ||
          state?.action === "ENTER_METER_DETAILS"
        );

      const currentAction = isPendingActivation ? "ACTIVATE_CONNECTION" : (isPendingMeter ? "ENTER_METER_DETAILS" : (filters?.action || "ACTIVATE_CONNECTION"));

      formData.action = currentAction;
      formData.wfDocuments = docFileStoreId
        ? [
            {
              documentType: "Document - 1",
              fileStoreId: docFileStoreId,
            },
          ]
        : [];
      formData.processInstance = {
        action: currentAction,
        comment: formDetails?.comments?.comments || "",
        documents: docFileStoreId
          ? [
              {
                documentType: "Document - 1",
                fileStoreId: docFileStoreId,
              },
            ]
          : [],
      };

      const isWater = filters?.service ? filters.service.toUpperCase() === "WATER" : (formData?.serviceType === "WATER" || !formData?.serviceType);
      const isReconnection =
        formData?.applicationType?.includes("RECONNECT") ||
        formData?.applicationNo?.includes("RC");

      if (isWater) {
        formData.waterSource = "GROUND.WELL";
        formData.proposedPipeSize = 0;
        formData.proposedTaps = 0;
        formData.pipeSize = 0;
        formData.noOfTaps = 0;
        formData.connectionType = "Metered";
        if (!formData.additionalDetails) formData.additionalDetails = {};
        formData.additionalDetails.connectionType = "Permanent";
      }

      const reqDetails =
        isWater
          ? isReconnection
            ? { WaterConnection: formData, reconnectRequest: true, disconnectRequest: false }
            : { WaterConnection: formData, reconnectRequest: false, disconnectRequest: false }
          : isReconnection
          ? { SewerageConnection: formData, reconnectRequest: true, disconnectRequest: false }
          : { SewerageConnection: formData, reconnectRequest: false, disconnectRequest: false };

      if (reqDetails?.WaterConnection) {
        reqDetails.WaterConnection.waterSource = "GROUND.WELL";
        reqDetails.WaterConnection.proposedPipeSize = 0;
        reqDetails.WaterConnection.proposedTaps = 0;
        reqDetails.WaterConnection.pipeSize = 0;
        reqDetails.WaterConnection.noOfTaps = 0;
        reqDetails.WaterConnection.connectionType = "Metered";
        if (!reqDetails.WaterConnection.additionalDetails) reqDetails.WaterConnection.additionalDetails = {};
        reqDetails.WaterConnection.additionalDetails.connectionType = "Permanent";
      }

      if (reqDetails?.SewerageConnection) {
        if (!reqDetails.SewerageConnection.additionalDetails) reqDetails.SewerageConnection.additionalDetails = {};
        reqDetails.SewerageConnection.additionalDetails.connectionType = "Permanent";
      }

      if (mutate) {
        // setIsEnableLoader(true);
        mutate(reqDetails, {
          onError: (error, variables) => {
            // setIsEnableLoader(false);
            setShowToast({ key: "error", message: error?.message ? error.message : error });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: (data, variables) => {
            // setIsEnableLoader(false);
            setShowToast({ key: false, message: "WS_ACTIVATE_SUCCESS_MESSAGE_MAIN" });
            setIsAppDetailsPage(true);
            // setTimeout(closeToast(), 5000);
            // setTimeout(closeToastForSucsss(), 5000)
          },
        });
      }
    }
  };

  const isPendingActivation =
    filters?.action === "ACTIVATE_CONNECTION" ||
    state?.action === "ACTIVATE_CONNECTION" ||
    applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    initialAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    details?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    appDetails?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION");

  const isPendingMeter =
    !isPendingActivation && (
      filters?.action === "ENTER_METER_DETAILS" ||
      state?.action === "ENTER_METER_DETAILS" ||
      applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      initialAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      details?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      appDetails?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION")
    );

  const getActionLabel = () => {
    if (isPendingActivation) {
      return t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") && t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") !== "WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION"
        ? t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION")
        : t("WS_ACTIVATE_CONNECTION") && t("WS_ACTIVATE_CONNECTION") !== "WS_ACTIVATE_CONNECTION"
        ? t("WS_ACTIVATE_CONNECTION")
        : "Activate Connection";
    }
    if (isPendingMeter) {
      const keys = [
        "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS",
        "WF_NEWWS1_ENTER_METER_DETAILS",
        "WF_CS_ENTER_METER_DETAILS",
        "CS_ENTER_METER_DETAILS",
        "WS_ENTER_METER_DETAILS",
        "ENTER_METER_DETAILS",
      ];
      for (const k of keys) {
        const val = t(k);
        if (val && val !== k) return val;
      }
      return "Enter Meter Details";
    }
    return t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") || "Activate Connection";
  };

  if (isEnableLoader || isLoading || isappdetailsLoading || !Array.isArray(config) || config.length === 0) {
    //updatingApplication ||
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={[{ timeLine: [{ actions: getActionLabel(), currentStep: 1 }] }]} showFinalStep={false} />
        <FormComposer
          config={(Array.isArray(config) ? config : []).map((config) => {
            return {
              ...config,
              isCollapsible: true,
              isDefaultOpen: true,
              body: config.body,
            };
          })}
          // userType={"employee"}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          label={getActionLabel()}
          onFormValueChange={onFormValueChange}
          // isDisabled={!canSubmit}
          noBreakLine={true}
          noCard={true}
        />
        {showToast && <Toast error={showToast.key} label={t(showToast?.message)} warning={showToast?.warning} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default ActivateConnection;
