import React, { useState, useEffect, Fragment } from "react";
import { useQuery } from "react-query";
import { Header, Loader, Toast } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import * as func from "../../../utils";
import { convertApplicationData, convertModifyApplicationDetails } from "../../../utils";

import Step1_SearchConnection from "./components/Step1_SearchConnection";
import Step1_ExistingConnection from "./components/Step1_ExistingConnection";
import Step2_NewConsumerDetails from "./components/Step2_NewConsumerDetails";
import Step3_UploadDocuments from "./components/Step3_UploadDocuments";
import Step4_Preview from "./components/Step4_Preview";
import Step5_Submission from "./components/Step5_Submission";
import { VerticalTimeline } from "@djb25/digit-ui-react-components";

const MutationApplication = () => {
  const { t } = useTranslation();
  let { state } = useLocation();
  state = state ? (typeof state === "string" ? JSON.parse(state) : state) : {};
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [showToast, setShowToast] = useState(null);
  const [generatedAppNo, setGeneratedAppNo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [authKNumber, setAuthKNumber] = useState("");
  const [authMobileNumber, setAuthMobileNumber] = useState("");
  const [authServiceType, setAuthServiceType] = useState("");

  const user = Digit.UserService.getUser();
  let tenantId =
    filters?.tenantId ||
    Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code ||
    user?.info?.permanentCity ||
    Digit.ULBService.getCurrentTenantId();
  const applicationNumber = filters?.applicationNumber;
  const serviceType = filters?.service;

  const details = cloneDeep(state?.data);
  const mobileNumber = user?.info?.userName?.match(/^[0-9]{10}$/) ? user?.info?.userName : user?.info?.mobileNumber;

  const hasStateData = !!details?.applicationData?.id;

  // Determine if we are editing an existing application
  const editApplicationNumber = details?.applicationNo || applicationNumber;

  const { isLoading: isWorkflowLoading, data: workflowData } = useQuery(
    ["WORKFLOW_SEARCH", editApplicationNumber, tenantId],
    async () => {
      const res = await Digit.WorkflowService.getByBusinessId(tenantId, editApplicationNumber);
      return res?.ProcessInstances?.[0];
    },
    { enabled: !!editApplicationNumber }
  );

  const isEditFlow = !!editApplicationNumber && workflowData?.action === "SEND_BACK_TO_CITIZEN";

  // For searching details: use application number if editing, otherwise use authenticated K Number
  const querySearchParam = isEditFlow ? editApplicationNumber : authKNumber;

  const fallbackServiceType = serviceType || authServiceType;
  const businessService = fallbackServiceType?.toUpperCase() === "SEWERAGE" ? "SW" : "WS";

  const { isLoading: isDetailsLoading, data: fetchedApplicationDetails } = useQuery(
    ["WS_MUTATION_DIRECT_SEARCH", querySearchParam, tenantId, mobileNumber, businessService, isEditFlow],
    async () => {
      if (!querySearchParam) return null;
      const params = isEditFlow
        ? {
            applicationNumber: querySearchParam,
          }
        : {
            connectionNumber: querySearchParam,
            isConnectionSearch: true,
          };
      // Remove undefined/null values
      Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
      const rawData = await Digit.WSService.search({ tenantId, filters: params, businessService });
      // Wrap in the same shape that useWSDetailsPage / applicationDetails produces
      const wsData = businessService === "WS" ? rawData?.WaterConnection?.[0] : rawData?.SewerageConnections?.[0];
      if (!wsData) return null;
      return {
        applicationData: wsData,
        WaterConnection: rawData?.WaterConnection,
        SewerageConnections: rawData?.SewerageConnections,
        propertyDetails: null,
        processInstancesDetails: [],
      };
    },
    // Skip the fetch when employee already provided full data via router state
    { enabled: !!querySearchParam && !hasStateData }
  );

  // Prefer router state data (employee) over fetched data (citizen)
  const applicationDetails = hasStateData ? details : fetchedApplicationDetails;
  const resolvedServiceType = serviceType || authServiceType || applicationDetails?.applicationData?.serviceType || "WATER";

  const [propertyId, setPropertyId] = useState(
    new URLSearchParams(useLocation().search).get("propertyId") || applicationDetails?.applicationData?.propertyId
  );

  const { data: propertyDetails, isLoading: isPropertyLoading } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: tenantId },
    { filters: { propertyIds: propertyId }, tenantId: tenantId, enabled: !!propertyId }
  );

  const [sessionFormData, setSessionFormData, clearSessionFormData] = Digit.Hooks.useSessionStorage("PT_CREATE_EMP_WS_NEW_FORM", {});

  useEffect(() => {
    const fetchAppData = async () => {
      const dataToConvert = applicationDetails || details;
      if (dataToConvert?.applicationData?.id) {
        const convertAppData = await convertApplicationData(
          dataToConvert,
          resolvedServiceType?.toUpperCase() || dataToConvert?.applicationData?.serviceType,
          true,
          undefined,
          t
        );
        setSessionFormData((prev) => ({ ...prev, ...convertAppData }));
        sessionStorage.setItem("IsDetailsExists", JSON.stringify(true));
      }
    };

    if (applicationDetails?.applicationData?.id && !sessionFormData?.applicationData) {
      fetchAppData();
    }
  }, [applicationDetails?.applicationData?.id]);

  useEffect(() => {
    const isCitizen = window.location.href.includes("/citizen/");

    if (isCitizen && isEditFlow && applicationDetails?.applicationData) {
      const data = applicationDetails.applicationData;
      const holders = data?.connectionHolders || [];
      const primaryHolder = holders.find((h) => h.isPrimaryOwner) || holders[0] || {};
      const additionalDetails = data?.additionalDetails || {};
      const documents = data?.documents || [];

      setFormData((prev) => {
        if (Object.keys(prev).length > 0) return prev;

        const identityDoc = documents.find((d) =>
          ["AADHAAR", "VOTERID", "VOTER_ID", "PAN", "DRIVING_LICENSE", "PASSPORT"].includes(d.documentType?.toUpperCase())
        );
        const mutationDoc = documents.find(
          (d) =>
            d.documentType === "REGISTERED_SALE_DEED" || d.documentType === "SALE_DEED" || d.documentType === "GIFT_DEED" || d.documentType === "WILL"
        );

        return {
          proposedNewConsumerName: primaryHolder.name || "",
          gender: primaryHolder.gender ? { code: primaryHolder.gender, i18nKey: primaryHolder.gender } : null,
          newOwnerMobileNumber: primaryHolder.mobileNumber || "",
          newOwnerEmailAddress: primaryHolder.emailId || "",
          reasonForNameChange: additionalDetails.reasonForNameChange
            ? { code: additionalDetails.reasonForNameChange, i18nKey: additionalDetails.reasonForNameChange }
            : null,
          relationshipWithExistingConsumer: additionalDetails.relationshipWithExistingConsumer
            ? { code: additionalDetails.relationshipWithExistingConsumer, i18nKey: additionalDetails.relationshipWithExistingConsumer }
            : null,

          saleDeedDocumentId: mutationDoc?.fileStoreId || additionalDetails.saleDeedDocumentId || "",
          identityProofDocumentId: identityDoc?.fileStoreId || "",
          identityProofType: identityDoc?.documentType ? { code: identityDoc.documentType, i18nKey: identityDoc.documentType } : null,
          documentNumber: additionalDetails.identityProofNumber || identityDoc?.documentUid || "",
        };
      });
    }
  }, [applicationDetails, isEditFlow]);

  useEffect(() => {
    if (propertyDetails?.Properties?.[0]) {
      setSessionFormData((prev) => ({ ...prev, cpt: { details: propertyDetails?.Properties?.[0] } }));
    }
  }, [propertyDetails]);

  const { mutate: waterMutation } = Digit.Hooks.ws.useWaterCreateAPI("WATER");
  const { mutate: sewerageMutation } = Digit.Hooks.ws.useWaterCreateAPI("SEWERAGE");
  const { mutate: waterUpdateMutation } = Digit.Hooks.ws.useWSApplicationActions("WATER");
  const { mutate: sewerageUpdateMutation } = Digit.Hooks.ws.useWSApplicationActions("SEWERAGE");

  const handleNextStep2 = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCompletedSteps((prev) => new Set([...prev, 3]));
    setCurrentStep(4);
  };

  const handleNextStep3 = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCompletedSteps((prev) => new Set([...prev, 4]));
    setCurrentStep(5);
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      let finalData = { ...sessionFormData };

      if (!finalData?.cpt?.details) {
        finalData.cpt = { details: propertyDetails?.Properties?.[0] };
      }

      finalData.MutationApplicantDetails = {
        proposedNewConsumerName: formData.proposedNewConsumerName,
        newOwnerMobileNumber: formData.newOwnerMobileNumber,
        newOwnerEmailAddress: formData.newOwnerEmailAddress,
        reasonForNameChange: formData.reasonForNameChange,
        relationshipWithExistingConsumer: formData.relationshipWithExistingConsumer,
        saleDeedDocumentId: formData.saleDeedDocumentId,
        identityProofType: formData.identityProofType,
        identityProofDocumentId: formData.identityProofDocumentId,
        documentNumber: formData.documentNumber,
      };

      if (finalData?.MutationApplicantDetails) {
        const mutDetails = finalData.MutationApplicantDetails;
        const existingHolder = finalData?.ConnectionHolderDetails?.[0] || {};
        finalData.ConnectionHolderDetails = [
          {
            ...existingHolder,
            name: mutDetails.proposedNewConsumerName || existingHolder.name,
            mobileNumber: mutDetails.newOwnerMobileNumber || existingHolder.mobileNumber,
            emailId: mutDetails.newOwnerEmailAddress || existingHolder.emailId,
            sameAsOwnerDetails: false,
          },
        ];
      }

      const sessionDetails = sessionStorage.getItem("WS_EDIT_APPLICATION_DETAILS")
        ? JSON.parse(sessionStorage.getItem("WS_EDIT_APPLICATION_DETAILS"))
        : {};

      let convertAppData = await convertModifyApplicationDetails(finalData, sessionDetails, "INITIATE");

      // Ensure dateEffectiveFrom is present for mutation creation validation
      if (!convertAppData.dateEffectiveFrom) {
        convertAppData.dateEffectiveFrom = Date.now() + 86400000; // Tomorrow, to avoid "cannot be past" validation errors
      }

      if (finalData?.MutationApplicantDetails) {
        const mutDetails = finalData.MutationApplicantDetails;
        if (!convertAppData.additionalDetails) convertAppData.additionalDetails = {};
        if (mutDetails.reasonForNameChange)
          convertAppData.additionalDetails.reasonForNameChange = mutDetails.reasonForNameChange?.code || mutDetails.reasonForNameChange;
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
            documentUid: mutDetails.saleDeedDocumentId,
            status: "ACTIVE",
          });
        }

        if (mutDetails.identityProofDocumentId) {
          if (!convertAppData.documents) convertAppData.documents = [];
          convertAppData.documents.push({
            documentType: mutDetails.identityProofType?.code || "IDENTITY_PROOF",
            fileStoreId: mutDetails.identityProofDocumentId,
            documentUid: mutDetails.documentNumber || mutDetails.identityProofDocumentId,
            documentNumber: mutDetails.documentNumber,
            status: "ACTIVE",
          });
        }
      }

      convertAppData.applicationType = resolvedServiceType === "WATER" ? "MUTATION_WATER_CONNECTION" : "MUTATION_SEWERAGE_CONNECTION";

      if (isEditFlow) {
        let updatePayload = {
          ...convertAppData,
          id: applicationDetails?.applicationData?.id,
          applicationNo: editApplicationNumber,
          processInstance: {
            ...applicationDetails?.applicationData?.processInstance,
            ...convertAppData?.processInstance,
            action: "RESUBMIT_APPLICATION",
          },
        };

        if (Digit?.Customizations?.WS?.customiseUpdatePayloadOfWS) {
          updatePayload = Digit.Customizations.WS.customiseUpdatePayloadOfWS(applicationDetails?.applicationData || {}, updatePayload, resolvedServiceType);
        }

        const updateMutation = resolvedServiceType === "WATER" ? waterUpdateMutation : sewerageUpdateMutation;
        let reqDetailsUpdate =
          resolvedServiceType === "WATER"
            ? { WaterConnection: updatePayload, reconnectRequest: false, disconnectRequest: false }
            : { SewerageConnection: updatePayload, reconnectRequest: false, disconnectRequest: false };

        updateMutation(reqDetailsUpdate, {
          onError: (error) => {
            setIsSubmitting(false);
            setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0]?.message || "Failed to update application" });
          },
          onSuccess: (updateData) => {
            setIsSubmitting(false);
            if (updateData instanceof Error || updateData?.isAxiosError || updateData?.response?.data?.Errors) {
              const apiErrors = updateData?.response?.data?.Errors;
              const errorMessage = apiErrors?.[0]?.message || updateData?.message || "Failed to update application";
              setShowToast({ key: "error", message: errorMessage });
              return;
            }

            if (updateData?.Errors && updateData.Errors.length > 0) {
              setShowToast({ key: "error", message: updateData.Errors[0].message || "Failed to update application" });
              return;
            }

            clearSessionFormData();
            const newAppNo =
              resolvedServiceType === "WATER" ? updateData?.WaterConnection?.[0]?.applicationNo : updateData?.SewerageConnections?.[0]?.applicationNo;
            setGeneratedAppNo(newAppNo);
            setCurrentStep(6);
          },
        });
        return;
      }

      const reqDetails =
        resolvedServiceType === "WATER"
          ? { WaterConnection: convertAppData, reconnectRequest: false, disconnectRequest: false }
          : { SewerageConnection: convertAppData, reconnectRequest: false, disconnectRequest: false };

      const mutation = resolvedServiceType === "WATER" ? waterMutation : sewerageMutation;

      await mutation(reqDetails, {
        onError: (error) => {
          setIsSubmitting(false);
          setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0]?.message || "Failed to submit application" });
        },
        onSuccess: (data) => {
          // Check if the Request utility returned an Axios error object
          if (data instanceof Error || data?.isAxiosError || data?.response?.data?.Errors) {
            setIsSubmitting(false);
            const apiErrors = data?.response?.data?.Errors;
            const errorMessage = apiErrors?.[0]?.message || data?.message || "Failed to submit application";
            setShowToast({ key: "error", message: errorMessage });
            return;
          }

          // Check if the API returned 200 OK but with an Errors array
          if (data?.Errors && data.Errors.length > 0) {
            setIsSubmitting(false);
            setShowToast({ key: "error", message: data.Errors[0].message || "Failed to submit application" });
          } else {
            // Create succeeded, now call update API to trigger workflow submission
            const updateMutation = resolvedServiceType === "WATER" ? waterUpdateMutation : sewerageUpdateMutation;
            const createdConnection = resolvedServiceType === "WATER" ? data?.WaterConnection?.[0] : data?.SewerageConnections?.[0];

            let updatePayload = {
              ...createdConnection,
              dateEffectiveFrom: createdConnection?.dateEffectiveFrom || Date.now(),
              processInstance: {
                ...createdConnection?.processInstance,
                action: "APPLY_MUTATION",
              },
            };

            // Apply customization if it exists in the platform
            if (Digit?.Customizations?.WS?.customiseUpdatePayloadOfWS) {
              updatePayload = Digit.Customizations.WS.customiseUpdatePayloadOfWS(createdConnection, updatePayload, resolvedServiceType);
            }

            let reqDetailsUpdate =
              resolvedServiceType === "WATER"
                ? { WaterConnection: updatePayload, reconnectRequest: false, disconnectRequest: false }
                : { SewerageConnection: updatePayload, reconnectRequest: false, disconnectRequest: false };

            updateMutation(reqDetailsUpdate, {
              onError: (error) => {
                setIsSubmitting(false);
                setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0]?.message || "Failed to update workflow" });
              },
              onSuccess: (updateData) => {
                setIsSubmitting(false);
                if (updateData instanceof Error || updateData?.isAxiosError || updateData?.response?.data?.Errors) {
                  const apiErrors = updateData?.response?.data?.Errors;
                  const errorMessage = apiErrors?.[0]?.message || updateData?.message || "Failed to update workflow";
                  setShowToast({ key: "error", message: errorMessage });
                  return;
                }

                if (updateData?.Errors && updateData.Errors.length > 0) {
                  setShowToast({ key: "error", message: updateData.Errors[0].message || "Failed to update workflow" });
                  return;
                }

                clearSessionFormData();
                const newAppNo =
                  resolvedServiceType === "WATER" ? updateData?.WaterConnection?.[0]?.applicationNo : updateData?.SewerageConnections?.[0]?.applicationNo;
                setGeneratedAppNo(newAppNo);
                setCurrentStep(6);
              },
            });
          }
        },
      });
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setShowToast({ key: "error", message: "Failed to submit application" });
    }
  };

  const handleTimelineSelect = (route, index) => {
    const targetStep = index + 1;
    // Allow going back to any previously visited step
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    // Allow clicking current step (no-op)
    if (targetStep === currentStep) return;
    // Prevent skipping ahead
    if (targetStep > currentStep) {
      setShowToast({ key: "warning", message: `Please complete Step ${currentStep} before proceeding to Step ${targetStep}.` });
    }
  };

  const timelineConfig = [
    { sectionId: "search", route: "search-connection", actions: "Authentication" },
    { sectionId: "application", route: "application-selection", actions: "Existing Connection" },
    { sectionId: "applicant", route: "applicant-details", actions: "New Consumer Details" },
    { sectionId: "documents", route: "documents", actions: "Documents" },
    { sectionId: "Review", route: "review", actions: "Preview" },
  ].map((step, index) => ({
    ...step,
    timeLine: [{ actions: step.actions, currentStep: index + 1 }],
  }));

  if (isDetailsLoading || (propertyId && isPropertyLoading) || isWorkflowLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        {currentStep !== 6 && !isMobile && (
          <VerticalTimeline config={timelineConfig} currentActiveIndex={currentStep - 1} showFinalStep={false} onSelect={handleTimelineSelect} />
        )}

        <div style={{ flex: "1", overflowY: "auto", minWidth: 0 }}>
          {currentStep === 1 && (
            <Step1_SearchConnection
              t={t}
              defaultKNumber={isEditFlow ? applicationDetails?.applicationData?.connectionNo : ""}
              onNext={({ kNumber, mobileNumber, serviceType: detectedServiceType }) => {
                setAuthKNumber(kNumber);
                setAuthMobileNumber(mobileNumber);
                if (detectedServiceType) setAuthServiceType(detectedServiceType);
                setCompletedSteps((prev) => new Set([...prev, 1]));
                setCurrentStep(2);
              }}
            />
          )}

          {currentStep === 2 && (
            <Fragment>
              <Step1_ExistingConnection
                t={t}
                applicationDetails={applicationDetails}
                propertyId={applicationDetails?.applicationData?.propertyId}
                mobileNumber={authMobileNumber}
                onVerify={() => {
                  setCompletedSteps((prev) => new Set([...prev, 2]));
                  setCurrentStep(3);
                }}
              />
            </Fragment>
          )}

          {currentStep === 3 && <Step2_NewConsumerDetails t={t} defaultValues={formData} onNext={handleNextStep2} onBack={() => setCurrentStep(2)} />}

          {currentStep === 4 && <Step3_UploadDocuments t={t} defaultValues={formData} onNext={handleNextStep3} onBack={() => setCurrentStep(3)} />}

          {currentStep === 5 && (
            <Step4_Preview
              t={t}
              formData={formData}
              applicationDetails={applicationDetails}
              resolvedServiceType={resolvedServiceType}
              onBack={() => setCurrentStep(4)}
              onSubmit={submitApplication}
              isLoading={isSubmitting}
            />
          )}

          {currentStep === 6 && <Step5_Submission t={t} applicationNumber={generatedAppNo} serviceType={resolvedServiceType} />}

          {showToast && (
            <Toast
              error={showToast?.key === "error"}
              warning={showToast?.key === "warning"}
              label={t(showToast?.message)}
              onClose={() => setShowToast(null)}
              isDleteBtn={true}
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MutationApplication;
