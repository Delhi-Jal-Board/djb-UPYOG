import { FormComposer, Header, Loader, Toast, Card, StatusTable, Row, CardSubHeader } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import WSMutationApplicantDetails from "./WSMutationApplicantDetails";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import * as func from "../../../utils";
import _ from "lodash";
import { convertApplicationData, convertModifyApplicationDetails, updatePayloadOfWS } from "../../../utils";
import cloneDeep from "lodash/cloneDeep";

const MutationApplication = () => {
  const { t } = useTranslation();
  let { state } = useLocation();
  state = state ? (typeof (state) === "string" ? JSON.parse(state) : state) : {};
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);
  const [canSubmit, setSubmitValve] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [appData, setAppData] = useState({});
  const [config, setConfig] = useState({ head: "", body: [] });
  const [enabledLoader, setEnabledLoader] = useState(true);
  const [isAppDetailsPage, setIsAppDetailsPage] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);

  let tenantId = Digit.ULBService.getCurrentTenantId();
  const applicationNumber = filters?.applicationNumber;
  const serviceType = filters?.service;

  const stateId = Digit.ULBService.getStateId();
  let { data: newConfig, isLoading: isConfigLoading } = Digit.Hooks.ws.useWSConfigMDMS.WSCreateConfig(stateId, {});

  let details = cloneDeep(state?.data);
  let { isLoading, isError, data: applicationDetails, error } = Digit.Hooks.ws.useWSDetailsPage(t, tenantId, details?.applicationNo || applicationNumber, (serviceType?.toUpperCase() || details?.applicationData?.serviceType));
  details = applicationDetails;
  const [propertyId, setPropertyId] = useState(new URLSearchParams(useLocation().search).get("propertyId"));

  const [sessionFormData, setSessionFormData, clearSessionFormData] = Digit.Hooks.useSessionStorage("PT_CREATE_EMP_WS_NEW_FORM", {});

  const { data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: tenantId },
    { filters: { propertyIds: propertyId }, tenantId: tenantId, enabled: propertyId && propertyId != "" ? true : false }
  );

  useEffect(() => {
    if (!isConfigLoading && newConfig && Array.isArray(newConfig)) {
      const config = cloneDeep(newConfig.find((conf) => conf.hideInCitizen && conf.isModify));
      if (config) {
        config.head = "WS_WATER_AND_SEWERAGE_MUTATION_CONNECTION_LABEL";
        let bodyDetails = [];
        config?.body?.forEach(data => { if (data?.isModifyConnection) bodyDetails.push(data); });
        bodyDetails.forEach(bdyData => {
          if (bdyData?.head === "WS_COMMON_PROPERTY_DETAILS") {
            bdyData.head = "";
            bdyData.className = "mutation-disabled-section";
          } else if (bdyData?.head === "WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER") {
            bdyData.head = "Specify ownership updates and transfer reason:";
            bdyData.body = [
              {
                type: "component",
                key: "MutationApplicantDetails",
                component: WSMutationApplicantDetails,
                withoutLabel: true,
              }
            ];
          } else {
            bdyData.head = "";
            bdyData.className = "mutation-hidden-section";
          }
        });
        config.body = bodyDetails;
        setConfig(config);
      }
    }
  }, [newConfig]);

  useEffect(() => {
    !propertyId && sessionFormData?.cpt?.details?.propertyId && setPropertyId(sessionFormData?.cpt?.details?.propertyId);
  }, [sessionFormData?.cpt]);

  useEffect(async () => {
    const IsDetailsExists = sessionStorage.getItem("IsDetailsExists") ? JSON.parse(sessionStorage.getItem("IsDetailsExists")) : false
    if (details?.applicationData?.id) {
      const convertAppData = await convertApplicationData(details, (serviceType?.toUpperCase() || details?.applicationData?.serviceType), true, undefined, t);
      setSessionFormData((prev) => ({ ...prev, ...convertAppData }));
      setAppData((prev) => ({ ...prev, ...convertAppData }));
      sessionStorage.setItem("IsDetailsExists", JSON.stringify(true));
    }
  }, [details, applicationDetails]);

  useEffect(() => {
    if (propertyDetails?.Properties?.[0]) {
      setSessionFormData((prev) => ({ ...prev, cpt: { details: propertyDetails?.Properties?.[0] } }));
    }
  }, [propertyDetails]);

  useEffect(() => {
    if (sessionFormData?.ConnectionDetails?.[0]?.applicationNo) {
      setEnabledLoader(false);
    }
  }, [propertyDetails, sessionFormData, sessionFormData?.cpt]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAppDetailsPage) window.location.href = `${window.location.origin}/digit-ui/employee/ws/application-details?applicationNumber=${sessionFormData?.ConnectionDetails?.[0]?.applicationNo}&service=${sessionFormData?.ConnectionDetails?.[0]?.serviceName?.toUpperCase()}`
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAppDetailsPage]);

  const {
    isLoading: creatingWaterApplicationLoading,
    isError: createWaterApplicationError,
    data: createWaterResponse,
    error: createWaterError,
    mutate: waterMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("WATER");

  const {
    isLoading: updatingWaterApplicationLoading,
    isError: updateWaterApplicationError,
    data: updateWaterResponse,
    error: updateWaterError,
    mutate: waterUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("WATER");

  const {
    isLoading: creatingSewerageApplicationLoading,
    isError: createSewerageApplicationError,
    data: createSewerageResponse,
    error: createSewerageError,
    mutate: sewerageMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("SEWERAGE");

  const {
    isLoading: updatingSewerageApplicationLoading,
    isError: updateSewerageApplicationError,
    data: updateSewerageResponse,
    error: updateSewerageError,
    mutate: sewerageUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("SEWERAGE");

  const onFormValueChange = (setValue, formData, formState) => {
    const updatedData = { ...sessionFormData, ...formData };
    if (!_.isEqual(sessionFormData, updatedData)) {
      setSessionFormData(updatedData);
    }
    if (Object.keys(formState.errors).length > 0 && Object.keys(formState.errors).length == 1 && formState.errors["owners"] && Object.values(formState.errors["owners"].type).filter((ob) => ob.type === "required").length == 0 && !formData?.cpt?.details?.propertyId) setSubmitValve(true);
    else setSubmitValve(!(Object.keys(formState.errors).length));
  };

  const onSubmit = async (data) => {
    let finalData = { ...sessionFormData, ...data };

    if (!finalData?.cpt?.id && !propertyDetails?.Properties?.[0]) {
      if (!finalData?.cpt?.details || !propertyDetails) {
        setShowToast({ key: "error", message: "ERR_INVALID_PROPERTY_ID" });
        return;
      }
    }
    if (!canSubmit) {
      setShowToast({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
    else {

      if (!finalData?.cpt?.details) {
        finalData.cpt = {
          details: propertyDetails?.Properties?.[0]
        };
      }

      if (finalData?.MutationApplicantDetails) {
        const mutDetails = finalData.MutationApplicantDetails;
        const existingHolder = finalData?.ConnectionHolderDetails?.[0] || {};
        finalData.ConnectionHolderDetails = [{
          ...existingHolder,
          name: mutDetails.proposedNewConsumerName || existingHolder.name,
          mobileNumber: mutDetails.newOwnerMobileNumber || existingHolder.mobileNumber,
          emailId: mutDetails.newOwnerEmailAddress || existingHolder.emailId,
          sameAsOwnerDetails: false
        }];
      }

      const details = sessionStorage.getItem("WS_EDIT_APPLICATION_DETAILS") ? JSON.parse(sessionStorage.getItem("WS_EDIT_APPLICATION_DETAILS")) : {};
      let convertAppData = await convertModifyApplicationDetails(finalData, details, "APPLY_MUTATION");

      if (finalData?.MutationApplicantDetails) {
        const mutDetails = finalData.MutationApplicantDetails;
        if (!convertAppData.additionalDetails) convertAppData.additionalDetails = {};
        if (mutDetails.reasonForNameChange) convertAppData.additionalDetails.reasonForNameChange = mutDetails.reasonForNameChange?.code || mutDetails.reasonForNameChange;
        if (mutDetails.relationshipWithExistingConsumer) {
          const relationCode = mutDetails.relationshipWithExistingConsumer?.code || mutDetails.relationshipWithExistingConsumer;
          convertAppData.additionalDetails.relationshipWithExistingConsumer = relationCode;
          convertAppData.additionalDetails.isBloodRelation = relationCode !== "OTHER";
        }

        if (mutDetails.saleDeedDocumentId) {
          convertAppData.additionalDetails.saleDeedDocumentId = mutDetails.saleDeedDocumentId;
          if (!convertAppData.documents) convertAppData.documents = [];
          convertAppData.documents.push({
            documentType: "REGISTERED_SALE_DEED",
            fileStoreId: mutDetails.saleDeedDocumentId,
            documentUid: mutDetails.saleDeedDocumentId
          });
        }
      }

      // Set mutation application type explicitly
      convertAppData.applicationType = serviceType == "WATER" ? "MUTATION_WATER_CONNECTION" : "MUTATION_SEWERAGE_CONNECTION";

      const reqDetails = serviceType == "WATER"
        ? { WaterConnection: convertAppData, reconnectRequest: false, disconnectRequest: false }
        : { SewerageConnection: convertAppData, reconnectRequest: false, disconnectRequest: false };

      if (serviceType == "WATER") {
        if (waterMutation) {
          setIsEnableLoader(true);
          await waterMutation(reqDetails, {
            onError: (error, variables) => {
              setIsEnableLoader(false);
              setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0].message ? error?.response?.data?.Errors?.[0].message : error });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data, variables) => {
              clearSessionFormData();
              history.push(`/digit-ui/employee/ws/ws-response?applicationNumber=${data?.WaterConnection?.[0]?.applicationNo}`);
            },
          });
        }
      }

      if (serviceType !== "WATER") {
        if (sewerageMutation) {
          setIsEnableLoader(true);
          await sewerageMutation(reqDetails, {
            onError: (error, variables) => {
              setIsEnableLoader(false);
              setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0]?.message ? error?.response?.data?.Errors?.[0]?.message : error });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data, variables) => {
              clearSessionFormData();
              history.push(`/digit-ui/employee/ws/ws-response?applicationNumber1=${data?.SewerageConnections?.[0]?.applicationNo}`);
            },
          });
        }
      }
    }
  };

  const closeToastOfError = () => {
    setShowToast(null);
  };

  const closeToast = () => {
    setShowToast(null);
  };

  if (enabledLoader || isEnableLoader || isConfigLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <style>{`
        .mutation-disabled-section { pointer-events: none; opacity: 0.8; margin-top: -24px !important; }
        .mutation-hidden-section { display: none !important; margin: 0 !important; padding: 0 !important; height: 0 !important; overflow: hidden !important; border: 0 !important; }
        .mutation-hidden-section + hr { display: none !important; margin: 0 !important; }
        .mutation-hidden-section + .break-line { display: none !important; margin: 0 !important; }
      `}</style>
      <Header>{t(config.head)}</Header>
      <Card>
        <CardSubHeader>{t("WS_MUTATION_DETAILS")}</CardSubHeader>
        <StatusTable>
          <Row label={t("WS_MYCONNECTIONS_APPLICATION_NO")} text={applicationDetails?.applicationData?.applicationNo || "NA"} />
          <Row label={t("WS_CONNECTION_CATEGORY")} text={applicationDetails?.applicationData?.connectionCategory || "NA"} />
          <Row label={t("WS_PROPERTY_ID_LABEL")} text={applicationDetails?.applicationData?.propertyId || propertyId || "NA"} />
          <Row label={t("WS_APPLICATION_ID")} text={applicationDetails?.applicationData?.id || applicationDetails?.applicationData?.connectionNo || "NA"} />
          <Row label={t("WS_CONNECTION_DATE")} text={applicationDetails?.applicationData?.connectionExecutionDate ? Digit.DateUtils.ConvertEpochToDate(applicationDetails?.applicationData?.connectionExecutionDate) : "NA"} />
        </StatusTable>
      </Card>
      <FormComposer
        config={config.body}
        userType={"employee"}
        onFormValueChange={onFormValueChange}
        label={t("CS_COMMON_SUBMIT")}
        onSubmit={onSubmit}
        defaultValues={sessionFormData}
        appData={appData}
      ></FormComposer>
      {showToast && <Toast isDleteBtn={true} error={showToast?.key === "error" ? true : false} label={t(showToast?.message)} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default MutationApplication;

