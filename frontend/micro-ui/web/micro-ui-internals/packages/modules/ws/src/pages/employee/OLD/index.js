import { FormComposer, Header, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import cloneDeep from "lodash/cloneDeep";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import * as func from "../../../utils";
import _ from "lodash";
import { newConfig as newConfigLocal } from "../../../config/wsCreateConfig";
import { createPayloadOfWS, updatePayloadOfWS } from "../../../utils";

const OLDApplication = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { state } = location;
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);
  const [canSubmit, setSubmitValve] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [appDetails, setAppDetails] = useState({});
  const [waterAndSewerageBoth, setWaterAndSewerageBoth] = useState(null);
  const [config, setConfig] = useState({ body: [] });
  const [currentStep, setCurrentStep] = useState(1);

  const timelineConfig = [
    {
      label: "WS_COMMON_PROPERTY_DETAILS",
    },
    {
      label: "WS_COMMON_CONNECTION_DETAIL",
    },
    {
      label: "WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER",
    },
    {
      label: "WS_COMMON_DOCS",
    },
    {
      label: "WS_COMMON_SUMMARY",
    },
  ].map((step, index) => ({
    route: `step-${index + 1}`,
    timeLine: [{ actions: step.label, currentStep: index + 1 }],
  }));

  // FIX 1: Properly assign tenantId fallback (was a no-op before)
  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId) {
    tenantId = Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code;
  }

  const stateId = Digit.ULBService.getStateId();
  let { data: newConfig, isLoading } = Digit.Hooks.ws.useWSConfigMDMS.WSCreateConfig(stateId, {});

  const [propertyId, setPropertyId] = useState(new URLSearchParams(useLocation().search).get("propertyId"));

  const [sessionFormData, setSessionFormData, clearSessionFormData] = Digit.Hooks.useSessionStorage("PT_CREATE_EMP_WS_NEW_FORM", {});

  const { data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: tenantId },
    { filters: { propertyIds: propertyId }, tenantId: tenantId, enabled: propertyId && propertyId != "" ? true : false }
  );

  // FIX 2: Clear stale FORMSTATE_ERRORS from sessionStorage on component mount
  useEffect(() => {
    sessionStorage.removeItem("FORMSTATE_ERRORS");
  }, []);

  useEffect(() => {
    if (!isLoading && newConfig) {
      const config = newConfig.find((conf) => conf.hideInCitizen && conf.isCreate);
      if (config) {
        // config.head = "WS_APP_FOR_WATER_AND_SEWERAGE_LABEL";

        // Filter sections that are for creation
        const allCreateSections = config?.body?.filter((section) => section?.isCreateConnection) || [];

        // Define the desired order based on the component inside the section
        const desiredComponentOrder = [
          "WSConnectionDetails",
          "WSConnectionHolderDetails",
          // "CPTPropertySearchNSummary",
          "CPTPropertyLocationDetails",
          "PropertyWaterConnection",
          "WSDjbEmployee",
          "WSActivationPlumberDetails",
          "WSRoadCuttingDetails",
          "WSBankDetails",
          "WSDocumentsEmployee",
          "WSDeclaration",
        ];

        // Manually reorder sections
        const reorderedBody = [];
        desiredComponentOrder.forEach((compName) => {
          const section = allCreateSections.find((s) => {
            const bodyComp = s.body?.[0]?.component;
            return bodyComp === compName || (compName === "WSConnectionDetails" && bodyComp === "WSConnectionDetails");
          });
          if (section) {
            // Override headers to match primary form if needed
            // if (compName === "CPTPropertySearchNSummary");
            if (compName === "WSConnectionHolderDetails");
            if (compName === "WSConnectionDetails");
            if (compName === "WSDocumentsEmployee");

            reorderedBody.push(section);
          } else if (compName === "CPTPropertyLocationDetails") {
            reorderedBody.push({
              // head: "WS_PROPERTY_LOCATION_DETAILS",
              isCreateConnection: true,
              body: [
                {
                  type: "component",
                  key: "propertyAddress",
                  component: "CPTPropertyLocationDetails",
                  withoutLabel: true,
                },
              ],
            });
          } else if (compName === "PropertyWaterConnection") {
            reorderedBody.push({
              // head: "WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS",
              isCreateConnection: true,
              body: [
                {
                  type: "component",
                  key: "useDetails",
                  component: "PropertyWaterConnection",
                  withoutLabel: true,
                },
              ],
            });
          } else if (compName === "WSBankDetails") {
            reorderedBody.push({
              // head: "WS_BANK_DETAILS",
              isCreateConnection: true,
              body: [
                {
                  type: "component",
                  key: "bankDetails",
                  component: "WSBankDetails",
                  withoutLabel: true,
                },
              ],
            });
          } else if (compName === "WSDeclaration") {
            reorderedBody.push({
              // head: "WS_DECLARATION_UNDERTAKING",
              isCreateConnection: true,
              body: [
                {
                  type: "component",
                  key: "declarationData",
                  component: "WSDeclaration",
                  withoutLabel: true,
                },
              ],
            });
          } else if (compName === "WSDjbEmployee") {
            reorderedBody.push({
              // head: "WS_DJB_EMPLOYEE",
              isCreateConnection: true,
              body: [
                {
                  type: "component",
                  key: "djbEmployee",
                  component: "WSDjbEmployee",
                  withoutLabel: true,
                },
              ],
            });
          } else {
            // console.warn(`[WS] section for component ${compName} not found in allCreateSections`);
          }
        });

        // Add any remaining sections that were not in desiredComponentOrder
        allCreateSections.forEach((section) => {
          const bodyComp = section.body?.[0]?.component;
          if (
            bodyComp !== "CPTPropertySearchNSummary" &&
            !reorderedBody.find((r) => r.body?.[0]?.component === bodyComp)
          ) {
            reorderedBody.push(section);
          }
        });

        config.body = reorderedBody;
        setConfig(config);
      }
    }
  }, [newConfig, isLoading]);

  useEffect(() => {
    !propertyId && sessionFormData?.cpt?.details?.propertyId && setPropertyId(sessionFormData?.cpt?.details?.propertyId);
  }, [sessionFormData?.cpt]);

  useEffect(() => {
    setSessionFormData({ ...sessionFormData, cpt: { details: propertyDetails?.Properties?.[0] } });
  }, [propertyDetails]);

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
    const updatedFormData = { ...sessionFormData, ...formData };
    if (!_.isEqual(sessionFormData, updatedFormData)) {
      setSessionFormData(updatedFormData);
      sessionStorage.setItem("FORMSTATE_ERRORS", JSON.stringify(formState?.errors));
    }

    if (
      Object.keys(formState.errors).length > 0 &&
      Object.keys(formState.errors).length == 1 &&
      formState?.errors?.["ConnectionHolderDetails"]?.type &&
      Object.keys(formState?.errors?.["ConnectionHolderDetails"]?.type)?.length == 1 &&
      formState.errors["ConnectionHolderDetails"] &&
      Object.values(formState.errors["ConnectionHolderDetails"].type).filter((ob) => ob.type === "required" && ob?.ref?.value !== "").length > 0
    )
      setSubmitValve(true);
    else setSubmitValve(!Object.keys(formState.errors).length);
  };

  const closeToastOfError = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    // DEBUG: Remove these logs once issue is confirmed fixed

    // FIX 3: Proper property validation with clear logging
    if (!data?.cpt?.id && !propertyDetails?.Properties?.[0]) {
      if (!data?.cpt?.details || !propertyDetails) {
        console.warn("[WS] onSubmit EXIT: invalid property", { cpt: data?.cpt, propertyDetails });
        setShowToast({ key: "error", message: "ERR_INVALID_PROPERTY_ID" });
        return;
      }
    }

    // FIX 4: Read and validate sessionStorage errors
    const errors = sessionStorage.getItem("FORMSTATE_ERRORS");
    const formStateErros = typeof errors === "string" && errors !== "null" ? JSON.parse(errors) : {};

    if (
      Object.keys(formStateErros).length > 0 &&
      !(
        Object.keys(formStateErros).length == 1 &&
        formStateErros?.["ConnectionHolderDetails"]?.type &&
        Object.keys(formStateErros?.["ConnectionHolderDetails"]?.type)?.length == 1 &&
        formStateErros["ConnectionHolderDetails"] &&
        Object.values(formStateErros["ConnectionHolderDetails"].type).filter((ob) => ob.type === "required" && ob?.ref?.value !== "").length > 0
      )
    ) {
      console.warn("[WS] onSubmit EXIT: formState errors blocking submit", formStateErros);
      setShowToast({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      return;
    }

    if (data?.useDetails?.useDetails) {
      data.useDetails = { ...data.useDetails, ...data.useDetails.useDetails };
      delete data.useDetails.useDetails;
    }

    if (data?.ConnectionDetails?.[0]) {
      const srv = data.ConnectionDetails[0].serviceType;
      const srvCode = (typeof srv === "object" ? srv?.code : srv) || "WATER";
      const srvUpper = srvCode?.toUpperCase() || "";
      data.ConnectionDetails[0].water = srvUpper.includes("WATER") || srvUpper === "BOTH";
      data.ConnectionDetails[0].sewerage = srvUpper.includes("SEWERAGE") || srvUpper === "BOTH";
      data.ConnectionDetails[0].service =
        srvUpper.includes("WATER") && srvUpper.includes("SEWERAGE") ? "Water And Sewerage" : srvUpper.includes("SEWERAGE") ? "Sewerage" : "Water";
      if (typeof srv !== "object") {
        data.ConnectionDetails[0].serviceType = { code: srvCode };
      }
    } else {
      data.ConnectionDetails = [
        {
          serviceType: { code: "WATER" },
          water: true,
          sewerage: false,
          service: "Water",
        },
      ];
    }

    const connDetail = data?.ConnectionDetails?.[0] || {};
    if (data?.useDetails) {
      data.useDetails = { ...connDetail, ...data.useDetails };
    }

    if (data?.DocumentsRequired?.documents) {
      const docs = data.DocumentsRequired.documents;
      const identityDoc = docs.find((d) => d?.documentType?.includes("IDENTITYPROOF"));
      const ownershipDoc = docs.find((d) => d?.documentType?.includes("ADDRESSPROOF") || d?.documentType?.includes("OWNERSHIPPROOF"));
      const otherDoc = docs.find((d) => !d?.documentType?.includes("IDENTITYPROOF") && !d?.documentType?.includes("ADDRESSPROOF"));

      data.documents = {
        documents: docs,
        identityProofNumber: identityDoc?.documentUid || "",
        ownershipDocumentNumber: ownershipDoc?.documentUid || "",
        otherDocumentNumber: otherDoc?.documentUid || "",
      };
    }

    if (data?.propertyAddress) {
      data.propertyAddress = {
        ...data.propertyAddress,
        pinCode: data.propertyAddress.pincode || data.propertyAddress.pinCode,
        street: data.propertyAddress.streetName || data.propertyAddress.street,
        Latitude: data.propertyAddress.latitude || data.propertyAddress.Latitude,
        Longitude: data.propertyAddress.longitude || data.propertyAddress.Longitude,
        address: data.propertyAddress.addressLine1 || data.propertyAddress.address,
        Assembly: data.propertyAddress.assembly || data.propertyAddress.Assembly,
      };
      if (!data.zro && data.propertyAddress.zro) {
        data.zro = data.propertyAddress.zro;
      }
    }

    if (data?.bankDetails) {
      data.bankDetails = {
        ...data.bankDetails,
        branchName: data.bankDetails.branchName || data.bankDetails.bankBranchName,
        bankBranchName: data.bankDetails.bankBranchName || data.bankDetails.branchName,
        bankAccountNumber: data.bankDetails.bankAccountNumber || data.bankDetails.accountNumber,
        accountNumber: data.bankDetails.accountNumber || data.bankDetails.bankAccountNumber,
      };
    }

    if (data?.declarationData) {
      const declarations = data.declarationData?.agree ? true : false;
      data.declaration = {
        ...data.declarationData,
        submittedBy:
          typeof data.declarationData?.submittedBy === "object" ? data.declarationData?.submittedBy?.code : data.declarationData?.submittedBy,
        agree: declarations,
        declarations: data.declarationData?.declarations || Array(9).fill(declarations),
      };
      data.declarationData.submittedBy = data.declaration.submittedBy;
      data.declarationData.agree = data.declaration.agree;
      data.declarationData.declarations = data.declaration.declarations;
    }

    // Ensure cpt details are set before payload creation
    if (!data?.cpt?.details) {
      data.cpt = {
        details: propertyDetails?.Properties?.[0],
      };
    }
    data.channel = Digit.UserService.getType()?.toUpperCase() === "CITIZEN" ? "CITIZEN" : "CFC_COUNTER";

    // Ensure applicationSelection is set for createPayloadOfWS compatibility
    data.applicationSelection = {
      serviceType: connDetail?.serviceType || { code: "WATER" },
      connectionType: connDetail?.connectionType || { code: "Metered" },
      applicantType: connDetail?.applicantType || { code: "NONPTPRESSURE" },
      categoryType: connDetail?.categoryType || {
        code:
          data?.ConnectionHolderDetails?.[0]?.ownerType?.code ||
          data?.ConnectionHolderDetails?.[0]?.ownerType ||
          propertyDetails?.Properties?.[0]?.owners?.[0]?.ownerType ||
          "NONE",
      },
      domesticType: connDetail?.domesticType,
      departmentType: connDetail?.departmentType,
      temporaryConnection: connDetail?.temporaryType,
      waterDemandType: connDetail?.waterDemandType,
      ownerContactNumber: data?.ConnectionHolderDetails?.[0]?.mobileNumber || data?.cpt?.details?.owners?.[0]?.mobileNumber,
    };

    const allDetails = cloneDeep(data);
    const payload = await createPayloadOfWS(data);

    // DEBUG: Log payload to confirm water/sewerage fields are present

    // FIX 5: Guard against empty payload — show a meaningful error instead of silent no-op
    if (!payload?.water && !payload?.sewerage) {
      console.error("[WS] onSubmit EXIT: payload has neither water nor sewerage", payload);
      setShowToast({ key: "error", message: "ERR_CONNECTION_TYPE_MISSING" });
      return;
    }

    let waterAndSewerageLoader = false,
      waterLoader = false,
      sewerageLoader = false;

    if (payload?.water && payload?.sewerage) waterAndSewerageLoader = true;
    if (payload?.water && !payload?.sewerage) waterLoader = true;
    if (!payload?.water && payload?.sewerage) sewerageLoader = true;

    let waterConnection = { WaterConnection: payload, disconnectRequest: false, reconnectRequest: false };
    let sewerageConnection = { SewerageConnection: payload, disconnectRequest: false, reconnectRequest: false };

    if (waterAndSewerageLoader) {
      setWaterAndSewerageBoth(true);
      sessionStorage.setItem("setWaterAndSewerageBoth", JSON.stringify(true));
    } else {
      sessionStorage.setItem("setWaterAndSewerageBoth", JSON.stringify(false));
    }

    // Case 1: Both Water and Sewerage
    if (payload?.water && payload?.sewerage) {
      if (waterMutation && sewerageMutation) {
        setIsEnableLoader(true);
        await waterMutation(waterConnection, {
          onError: (error) => {
            setIsEnableLoader(false);
            setShowToast({
              key: "error",
              message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
            });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: async (waterData) => {
            let response = await updatePayloadOfWS(waterData?.WaterConnection?.[0], "WATER");
            let waterConnectionUpdate = { WaterConnection: response, disconnectRequest: false, reconnectRequest: false };

            waterUpdateMutation(waterConnectionUpdate, {
              onError: (error) => {
                setIsEnableLoader(false);
                setShowToast({
                  key: "error",
                  message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                });
                setTimeout(closeToastOfError, 5000);
              },
              onSuccess: async (waterUpdateData) => {
                setAppDetails((prev) => ({ ...prev, waterConnection: waterUpdateData?.WaterConnection?.[0] }));

                await sewerageMutation(sewerageConnection, {
                  onError: (error) => {
                    setIsEnableLoader(false);
                    setShowToast({
                      key: "error",
                      message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                    });
                    setTimeout(closeToastOfError, 5000);
                  },
                  onSuccess: async (sewerageData) => {
                    let response = await updatePayloadOfWS(sewerageData?.SewerageConnections?.[0], "SEWERAGE");
                    let sewerageConnectionUpdate = { SewerageConnection: response, disconnectRequest: false, reconnectRequest: false };

                    await sewerageUpdateMutation(sewerageConnectionUpdate, {
                      onError: (error) => {
                        setIsEnableLoader(false);
                        setShowToast({
                          key: "error",
                          message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                        });
                        setTimeout(closeToastOfError, 5000);
                      },
                      onSuccess: async (sewerageUpdateData) => {
                        setAppDetails((prev) => ({ ...prev, sewerageConnection: sewerageUpdateData?.SewerageConnections?.[0] }));
                        clearSessionFormData();
                        history.push(
                          `/digit-ui/employee/ws/ws-response?applicationNumber=${waterUpdateData?.WaterConnection?.[0]?.applicationNo}&applicationNumber1=${sewerageUpdateData?.SewerageConnections?.[0]?.applicationNo}`
                        );
                      },
                    });
                  },
                });
              },
            });
          },
        });
      }
    }
    // Case 2: Only Water
    else if (payload?.water && !payload?.sewerage) {
      if (waterMutation) {
        setIsEnableLoader(true);
        await waterMutation(waterConnection, {
          onError: (error) => {
            setIsEnableLoader(false);
            console.error("[WS] waterMutation error", error);
            setShowToast({
              key: "error",
              message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
            });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: async (data) => {
            let response = await updatePayloadOfWS(data?.WaterConnection?.[0], "WATER");
            let waterConnectionUpdate = { WaterConnection: response };

            waterUpdateMutation(waterConnectionUpdate, {
              onError: (error) => {
                setIsEnableLoader(false);
                console.error("[WS] waterUpdateMutation error", error);
                setShowToast({
                  key: "error",
                  message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                });
                setTimeout(closeToastOfError, 5000);
              },
              onSuccess: (data) => {
                setAppDetails((prev) => ({ ...prev, waterConnection: data?.WaterConnection?.[0] }));
                clearSessionFormData();
                history.push(`/digit-ui/employee/ws/ws-response?applicationNumber=${data?.WaterConnection?.[0]?.applicationNo}`);
              },
            });
          },
        });
      }
    }
    // Case 3: Only Sewerage
    else if (payload?.sewerage && !payload?.water) {
      if (sewerageMutation) {
        setIsEnableLoader(true);
        await sewerageMutation(sewerageConnection, {
          onError: (error) => {
            setIsEnableLoader(false);
            console.error("[WS] sewerageMutation error", error);
            setShowToast({
              key: "error",
              message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
            });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: async (data) => {
            let response = await updatePayloadOfWS(data?.SewerageConnections?.[0], "SEWERAGE");
            let sewerageConnectionUpdate = { SewerageConnection: response };

            await sewerageUpdateMutation(sewerageConnectionUpdate, {
              onError: (error) => {
                setIsEnableLoader(false);
                console.error("[WS] sewerageUpdateMutation error", error);
                setShowToast({
                  key: "error",
                  message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                });
                setTimeout(closeToastOfError, 5000);
              },
              onSuccess: (data) => {
                setAppDetails((prev) => ({ ...prev, sewerageConnection: data?.SewerageConnections?.[0] }));
                clearSessionFormData();
                history.push(`/digit-ui/employee/ws/ws-response?applicationNumber1=${data?.SewerageConnections?.[0]?.applicationNo}`);
              },
            });
          },
        });
      }
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  if (isEnableLoader || isLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={timelineConfig} currentActiveIndex={currentStep - 1} showFinalStep={false} />
        <FormComposer
          config={config.body}
          userType={"employee"}
          onFormValueChange={onFormValueChange}
          label={
            creatingWaterApplicationLoading ||
            creatingSewerageApplicationLoading ||
            updatingWaterApplicationLoading ||
            updatingSewerageApplicationLoading
              ? t("CS_COMMON_SUBMITTING")
              : t("CS_COMMON_SUBMIT")
          }
          onSubmit={onSubmit}
          defaultValues={sessionFormData}
          noCard={true}
          noBreakLine={true}
          cardFormWrapperClassName="new-application-card"
        />
        {showToast && (
          <Toast
            isDleteBtn={true}
            error={showToast?.key === "error" ? true : false}
            warning={showToast?.warning}
            label={t(showToast?.message)}
            onClose={closeToast}
            isWarning={showToast?.isWarning}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default OLDApplication;
