import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import _ from "lodash";
import cloneDeep from "lodash/cloneDeep";
import { createPayloadOfWS, updatePayloadOfWS } from "../../../utils";
import CheckPage from "./CheckPage";
import { newConfig as newConfigLocal } from "../../../config/wsCreateConfig";

const OLDApplication = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const [canSubmit, setSubmitValve] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [showToast, setShowToast] = useState(null);
  // const [appDetails, setAppDetails] = useState({});
  // const [waterAndSewerageBoth, setWaterAndSewerageBoth] = useState(null);
  // const [currentStep, setCurrentStep] = useState(1);
  const [showCheckPage, setShowCheckPage] = useState(false);

  const isCitizen = Digit.UserService.getType()?.toUpperCase() === "CITIZEN";

  const timelineConfig = [
    { label: "WS_COMMON_PROPERTY_DETAILS" },
    { label: "WS_COMMON_CONNECTION_DETAIL" },
    { label: "WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER" },
    { label: "Are you a Divyangjan/Person with Disability?" },
    { label: "WS_DJB_EMPLOYEE" },
    { label: "PT_LOCATION_DETAILS" },
    { label: "WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS" },
    // ...(isCitizen ? [] : [{ label: "WS_DJB_EMPLOYEE" }]),
    // { label: "WS_BANK_DETAILS" },
    { label: "WS_DOCUMENTS" },
    { label: "WS_DECLARATION" },
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
  const mdmsOptions = useMemo(() => ({}), []);
  let { data: newConfig, isLoading } = Digit.Hooks.ws.useWSConfigMDMS.WSCreateConfig(stateId, mdmsOptions);

  const requestedPropertyId = new URLSearchParams(location.search).get("propertyId");
  const [propertyId, setPropertyId] = useState(requestedPropertyId);
  const initialPropertyId = useRef(requestedPropertyId);
  const verifiedPropertyId = useRef(sessionStorage.getItem("WS_OTP_VERIFIED_PROPERTY_ID"));

  const [sessionFormData, setSessionFormData, clearSessionFormData] = Digit.Hooks.useSessionStorage("PT_CREATE_EMP_WS_NEW_FORM", {});
  const formDataRef = useRef(sessionFormData || {});
  const sessionSaveTimeoutRef = useRef(null);

  const defaultValues = useMemo(() => {
    return sessionFormData && Object.keys(sessionFormData).length > 0
      ? sessionFormData
      : Digit.SessionStorage.get("PT_CREATE_EMP_WS_NEW_FORM") || {};
  }, []);

  const { data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: tenantId },
    {
      filters: { propertyIds: propertyId },
      tenantId: tenantId,
      enabled: propertyId && propertyId === requestedPropertyId && propertyId === verifiedPropertyId.current,
    }
  );

  useEffect(() => {
    if (requestedPropertyId !== initialPropertyId.current || (requestedPropertyId && requestedPropertyId !== verifiedPropertyId.current)) {
      clearSessionFormData();
      sessionStorage.removeItem("WS_OTP_VERIFIED_PROPERTY_ID");
      history.replace(window.location.href.includes("/employee") ? "/digit-ui/employee/ws/info" : "/digit-ui/citizen/ws/info");
    }
  }, [clearSessionFormData, history, requestedPropertyId]);

  // FIX 2: Clear stale FORMSTATE_ERRORS from sessionStorage on component mount
  useEffect(() => {
    sessionStorage.removeItem("FORMSTATE_ERRORS");
  }, []);

  const config = useMemo(() => {
    const rawConfigs = newConfig && Array.isArray(newConfig) && newConfig.length > 0 ? newConfig : newConfigLocal;
    const foundConfig = rawConfigs?.find((conf) => conf.hideInCitizen && conf.isCreate);
    if (!foundConfig) return { body: [] };
    const configCopy = cloneDeep(foundConfig);
    const allCreateSections = configCopy?.body?.filter((section) => section?.isCreateConnection) || [];

    const desiredComponentOrder = [
      "CPTPropertySearchNSummary",
      "WSConnectionDetails",
      "WSConnectionHolderDetails",
      "WSDivyangjan",
      "WSDjbEmployee",
      "WSPropertyLocationDetails",
      "PropertyWaterConnection",
      "WSActivationPlumberDetails",
      "WSRoadCuttingDetails",
      // "WSBankDetails",
      "WSDocumentsEmployee",
    ];

    const reorderedBody = [];
    desiredComponentOrder.forEach((compName) => {
      const section = allCreateSections.find((s) => {
        const bodyComp = s.body?.[0]?.component;
        return bodyComp === compName || (compName === "WSConnectionDetails" && bodyComp === "WSConnectionDetails");
      });
      if (section) {
        reorderedBody.push(section);
      } else if (compName === "WSPropertyLocationDetails") {
        reorderedBody.push({
          isCreateConnection: true,
          body: [
            {
              type: "component",
              key: "propertyAddress",
              component: "WSPropertyLocationDetails",
              withoutLabel: true,
              isAutomaticFill: true,
              texts: {
                header: `${t("PT_LOCATION_DETAILS_AUTOMATIC_FILL_BY_PROPERTY")}`,
              },
              defaultOpen: false,
            },
          ],
        });
      } else if (compName === "PropertyWaterConnection") {
        reorderedBody.push({
          isCreateConnection: true,
          body: [
            {
              type: "component",
              key: "useDetails",
              component: "PropertyWaterConnection",
              withoutLabel: true,
              isAutomaticFill: true,
            },
          ],
        });
      } else if (compName === "WSDeclaration") {
        reorderedBody.push({
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
      } else if (compName === "WSDivyangjan") {
        reorderedBody.push({
          isCreateConnection: true,
          body: [
            {
              type: "component",
              key: "disability",
              component: "WSDivyangjan",
              withoutLabel: true,
              texts: {
                header: "Divyangjan/Person with Disability?",
              },
            },
          ],
        });
      }
    });

    allCreateSections.forEach((section) => {
      const bodyComp = section.body?.[0]?.component;
      if (bodyComp !== "CPTPropertySearchNSummary" && !reorderedBody.find((r) => r.body?.[0]?.component === bodyComp)) {
        reorderedBody.push(section);
      }
    });

    configCopy.body = reorderedBody;
    return configCopy;
  }, [newConfig, t]);

  useEffect(() => {
    const cptId = sessionFormData?.cpt?.details?.propertyId || Digit.SessionStorage.get("PT_CREATE_EMP_WS_NEW_FORM")?.cpt?.details?.propertyId;
    if (!propertyId && cptId) {
      setPropertyId(cptId);
    }
  }, [sessionFormData?.cpt, propertyId]);

  const {
    isLoading: creatingWaterApplicationLoading,

    mutate: waterMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("WATER");

  const {
    isLoading: updatingWaterApplicationLoading,

    mutate: waterUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("WATER");

  const {
    isLoading: creatingSewerageApplicationLoading,

    mutate: sewerageMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("SEWERAGE");

  const {
    isLoading: updatingSewerageApplicationLoading,

    mutate: sewerageUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("SEWERAGE");

  const onFormValueChange = (setValue, formData, formState) => {
    formDataRef.current = { ...formDataRef.current, ...formData };

    if (sessionSaveTimeoutRef.current) {
      clearTimeout(sessionSaveTimeoutRef.current);
    }
    sessionSaveTimeoutRef.current = setTimeout(() => {
      Digit.SessionStorage.set("PT_CREATE_EMP_WS_NEW_FORM", formDataRef.current);
    }, 300);

    // Always update errors to ensure validation state is in sync
    sessionStorage.setItem("FORMSTATE_ERRORS", JSON.stringify(formState?.errors || {}));

    const cptPropId = formData?.cpt?.details?.propertyId;
    if (!propertyId && cptPropId) {
      setPropertyId(cptPropId);
    }

    const djbData = formDataRef.current?.djbEmployee || formDataRef.current?.additionalDetails;
    const isDjbEmp =
      djbData?.isDjbEmployee === true ||
      String(djbData?.isDjbEmployee) === "true";
    const isDjbEmpInvalid =
      isDjbEmp &&
      (!djbData?.employeeId ||
        !String(djbData?.employeeId).trim() ||
        !djbData?.designation ||
        !String(djbData?.designation).trim() ||
        !(
          djbData?.document?.fileStoreId ||
          (typeof djbData?.document === "string" && djbData?.document.trim()) ||
          djbData?.document
        ));

    const hasErrors = Object.keys(formState?.errors || {}).length > 0 || isDjbEmpInvalid;
    const hasProperty =
      formDataRef.current?.cpt?.details?.propertyId ||
      sessionStorage.getItem("WS_OTP_VERIFIED_PROPERTY_ID") ||
      propertyId ||
      propertyDetails?.Properties?.[0]?.propertyId;

    // Enable submit if no form errors AND property is selected
    const canSubmitNow = !hasErrors && !!hasProperty;
    setSubmitValve((prev) => (prev !== canSubmitNow ? canSubmitNow : prev));
  };

  const onFormSubmit = (data) => {
    const combinedData = { ...formDataRef.current, ...data };
    formDataRef.current = combinedData;
    Digit.SessionStorage.set("PT_CREATE_EMP_WS_NEW_FORM", combinedData);

    const hasProperty =
      combinedData?.cpt?.details?.propertyId ||
      sessionStorage.getItem("WS_OTP_VERIFIED_PROPERTY_ID") ||
      propertyId ||
      propertyDetails?.Properties?.[0]?.propertyId;

    if (!hasProperty) {
      console.warn("[WS] onSubmit EXIT: invalid property", { cpt: combinedData?.cpt, propertyDetails });
      setShowToast({ key: "error", message: "ERR_INVALID_PROPERTY_ID" });
      return;
    }

    // FIX 3: Proper property validation with clear logging
    if (!combinedData?.cpt?.id && !propertyDetails?.Properties?.[0]) {
      if (!combinedData?.cpt?.details || !propertyDetails) {
        console.warn("[WS] onSubmit EXIT: invalid property", { cpt: combinedData?.cpt, propertyDetails });
        setShowToast({ key: "error", message: "ERR_INVALID_PROPERTY_ID" });
        return;
      }
    }

    const djbData = combinedData?.djbEmployee || combinedData?.additionalDetails;
    const isDjbEmp =
      djbData?.isDjbEmployee === true ||
      String(djbData?.isDjbEmployee) === "true";
    const isDjbEmpInvalid =
      isDjbEmp &&
      (!djbData?.employeeId ||
        !String(djbData?.employeeId).trim() ||
        !djbData?.designation ||
        !String(djbData?.designation).trim() ||
        !(
          djbData?.document?.fileStoreId ||
          (typeof djbData?.document === "string" && djbData?.document.trim()) ||
          djbData?.document
        ));

    if (isDjbEmpInvalid) {
      setShowToast({ key: "error", message: "ERR_FILL_ALL_MANDATORY_FIELDS" });
      return;
    }

    // Validation passed, show CheckPage
    setShowCheckPage(true);
  };

  const processSubmission = async (data) => {
    // DEBUG: Remove these logs once issue is confirmed fixed
    const basePath = window.location.href.includes("/employee") ? "/digit-ui/employee/ws" : "/digit-ui/citizen/ws";

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
        data.ConnectionDetails[0].serviceType = { code: srvCode, i18nKey: srvCode === "WATER" ? "Water Connection" : undefined };
      }
    } else {
      data.ConnectionDetails = [
        {
          serviceType: { code: "WATER", i18nKey: "Water Connection" },
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
      const otherDoc = docs.find((d) => d?.documentType?.includes("OTHERDOCUMENTS"));

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
        declarations: data.declarationData?.declarations || Array(10).fill(declarations),
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
      serviceType: connDetail?.serviceType || { code: "WATER", i18nKey: "Water Connection" },
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

    // const allDetails = cloneDeep(data);
    const payload = await createPayloadOfWS(data);

    // DEBUG: Log payload to confirm water/sewerage fields are present

    // FIX 5: Guard against empty payload — show a meaningful error instead of silent no-op
    if (!payload?.water && !payload?.sewerage) {
      console.error("[WS] onSubmit EXIT: payload has neither water nor sewerage", payload);
      setShowToast({ key: "error", message: "ERR_CONNECTION_TYPE_MISSING" });
      return;
    }

    let waterAndSewerageLoader = false;
    // waterLoader = false,
    // sewerageLoader = false;

    if (payload?.water && payload?.sewerage) waterAndSewerageLoader = true;
    // if (payload?.water && !payload?.sewerage) waterLoader = true;
    // if (!payload?.water && payload?.sewerage) sewerageLoader = true;

    let waterConnection = { WaterConnection: payload, disconnectRequest: false, reconnectRequest: false };
    let sewerageConnection = { SewerageConnection: payload, disconnectRequest: false, reconnectRequest: false };

    if (waterAndSewerageLoader) {
      // setWaterAndSewerageBoth(true);
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
              },
              onSuccess: async (waterUpdateData) => {
                // setAppDetails((prev) => ({ ...prev, waterConnection: waterUpdateData?.WaterConnection?.[0] }));

                await sewerageMutation(sewerageConnection, {
                  onError: (error) => {
                    setIsEnableLoader(false);
                    setShowToast({
                      key: "error",
                      message: error?.response?.data?.Errors?.[0]?.message || error?.message || "ERR_UNKNOWN",
                    });
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
                      },
                      onSuccess: async (sewerageUpdateData) => {
                        // setAppDetails((prev) => ({ ...prev, sewerageConnection: sewerageUpdateData?.SewerageConnections?.[0] }));
                        clearSessionFormData();
                        sessionStorage.removeItem("WS_OTP_VERIFIED_PROPERTY_ID");
                        history.push(
                          `${basePath}/ws-response?applicationNumber=${waterUpdateData?.WaterConnection?.[0]?.applicationNo}&applicationNumber1=${sewerageUpdateData?.SewerageConnections?.[0]?.applicationNo}`
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
              },
              onSuccess: (data) => {
                // setAppDetails((prev) => ({ ...prev, waterConnection: data?.WaterConnection?.[0] }));
                clearSessionFormData();
                sessionStorage.removeItem("WS_OTP_VERIFIED_PROPERTY_ID");
                history.push(`${basePath}/ws-response?applicationNumber=${data?.WaterConnection?.[0]?.applicationNo}`);
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
              },
              onSuccess: (data) => {
                // setAppDetails((prev) => ({ ...prev, sewerageConnection: data?.SewerageConnections?.[0] }));
                clearSessionFormData();
                sessionStorage.removeItem("WS_OTP_VERIFIED_PROPERTY_ID");
                history.push(`${basePath}/ws-response?applicationNumber1=${data?.SewerageConnections?.[0]?.applicationNo}`);
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

  if (showCheckPage) {
    return (
      <React.Fragment>
        <div className="employee-form-section-wrapper">
          <VerticalTimeline config={timelineConfig} currentActiveIndex={9} showFinalStep={false} />
          <CheckPage
            data={formDataRef.current || sessionFormData}
            onSubmit={(finalData) => processSubmission(finalData || formDataRef.current || sessionFormData)}
            onEdit={() => setShowCheckPage(false)}
          />
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={timelineConfig} currentActiveIndex={0} showFinalStep={false} />
        <FormComposer
          config={config.body}
          userType={"employee"}
          onFormValueChange={onFormValueChange}
          isDisabled={!canSubmit}
          label={
            creatingWaterApplicationLoading ||
            creatingSewerageApplicationLoading ||
            updatingWaterApplicationLoading ||
            updatingSewerageApplicationLoading
              ? t("CS_COMMON_SUBMITTING")
              : t("CS_COMMON_NEXT")
          }
          onSubmit={onFormSubmit}
          defaultValues={defaultValues}
          noCard={true}
          noBreakLine={true}
          cardFormWrapperClassName="new-application-card"
        />
        {showToast && (
          <Toast
            isDleteBtn={true}
            duration={5000}
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
