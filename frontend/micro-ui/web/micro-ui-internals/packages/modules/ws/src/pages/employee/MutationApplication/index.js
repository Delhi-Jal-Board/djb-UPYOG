import React, { useState, useEffect, Fragment } from "react";
import { useQuery } from "react-query";
import { Header, Loader, Toast } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory, Switch, Route, useRouteMatch, Redirect } from "react-router-dom";
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
  const { path } = useRouteMatch();
  const location = useLocation();
  let { state } = location;
  state = state ? (typeof state === "string" ? JSON.parse(state) : state) : {};
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);

  const currentStep = location.pathname.includes("/search-connection") ? 1
    : location.pathname.includes("/existing-connection") ? 2
    : location.pathname.includes("/consumer-details") ? 3
    : location.pathname.includes("/document") ? 4
    : location.pathname.includes("/preview") ? 5
    : location.pathname.includes("/submission") ? 6
    : 1;
  const [formData, setFormData, clearFormData] = Digit.Hooks.useSessionStorage("MUTATION_APP_FORM_DATA", {});
  const [showToast, setShowToast] = useState(null);
  const [generatedAppNo, setGeneratedAppNo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps, clearCompletedSteps] = Digit.Hooks.useSessionStorage("MUTATION_APP_COMPLETED_STEPS", []);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [authKNumber, setAuthKNumber, clearAuthKNumber] = Digit.Hooks.useSessionStorage("MUTATION_APP_K_NUMBER", "");
  const [authMobileNumber, setAuthMobileNumber, clearAuthMobileNumber] = Digit.Hooks.useSessionStorage("MUTATION_APP_MOBILE", "");
  const [authServiceType, setAuthServiceType, clearAuthServiceType] = Digit.Hooks.useSessionStorage("MUTATION_APP_SERVICE", "");
  const [authActiveConnection, setAuthActiveConnection, clearAuthActiveConnection] = Digit.Hooks.useSessionStorage("MUTATION_APP_ACTIVE_CONN", null);

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

  const isEmployee = window.location.href.includes("/employee/");
  const isEditFlow = !!editApplicationNumber && (isEmployee || workflowData?.action === "SEND_BACK_TO_CITIZEN");

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
            searchType:'CONNECTION'
          };
      // Remove undefined/null values
      Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
      const rawData = await Digit.WSService.search({ tenantId, filters: params, businessService });
      // Wrap in the same shape that useWSDetailsPage / applicationDetails produces
      let wsData;
      if (businessService === "WS") {
        wsData = rawData?.WaterConnection?.find(c => c.applicationStatus === 'CONNECTION_ACTIVATED') || rawData?.WaterConnection?.[0];
      } else {
        wsData = rawData?.SewerageConnections?.find(c => c.applicationStatus === 'CONNECTION_ACTIVATED') || rawData?.SewerageConnections?.[0];
      }
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
    const isEmployee = window.location.href.includes("/employee/");

    if ((isCitizen || isEmployee) && isEditFlow && applicationDetails?.applicationData) {
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

        const reasonOptions = [
          { code: "SALE_PURCHASE", i18nKey: "Purchase of Property" },
          { code: "DEVOLUTION_INHERITANCE", i18nKey: "Devolution/Inheritance" },
          { code: "OTHER", i18nKey: "Other Reason(Gift Deed, Lease Agreement, etc)" }
        ];
        const relationshipOptions = [
          { code: "BLOOD_RELATION", i18nKey: "Blood Relation (Son / Daughter / Spouse)" },
          { code: "LEGAL_HEIR", i18nKey: "Legal Heir" },
          { code: "OTHER", i18nKey: "Other" }
        ];

        const reasonCode = additionalDetails.reasonForNameChange;
        const reasonObj = reasonOptions.find(o => o.code === reasonCode) || (reasonCode ? { code: reasonCode, i18nKey: reasonCode } : null);

        const relationCode = additionalDetails.relationshipWithExistingConsumer;
        const relationObj = relationshipOptions.find(o => o.code === relationCode) || (relationCode ? { code: relationCode, i18nKey: relationCode } : null);

        return {
          proposedNewConsumerName: primaryHolder.name || "",
          gender: primaryHolder.gender ? { code: primaryHolder.gender, i18nKey: primaryHolder.gender } : null,
          newOwnerMobileNumber: primaryHolder.mobileNumber || "",
          newOwnerEmailAddress: primaryHolder.emailId || "",
          reasonForNameChange: reasonObj,
          relationshipWithExistingConsumer: relationObj,

          saleDeedDocumentId: additionalDetails.saleDeedDocumentId || mutationDoc?.fileStoreId || "",
          identityProofDocumentId: additionalDetails.identityProofDocumentId || identityDoc?.fileStoreId || "",
          identityProofType: additionalDetails.identityProofDocumentName ? { code: additionalDetails.identityProofDocumentName, i18nKey: additionalDetails.identityProofDocumentName } : identityDoc?.documentType ? { code: identityDoc.documentType, i18nKey: identityDoc.documentType } : null,
          documentNumber: additionalDetails.identityProofDocumentNumber || additionalDetails.identityProofNumber || identityDoc?.documentUid || "",
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

  // Handled inline in Route component

  // Handled inline in Route component

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

      const existingDocs =
        applicationDetails?.applicationData?.documents ||
        applicationDetails?.WaterConnection?.[0]?.documents ||
        applicationDetails?.SewerageConnections?.[0]?.documents ||
        applicationDetails?.documents ||
        details?.applicationData?.documents ||
        details?.documents ||
        [];

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
          if (!convertAppData.additionalDetails) convertAppData.additionalDetails = {};
          convertAppData.additionalDetails.identityProofDocumentNumber = mutDetails.documentNumber || "";
          convertAppData.additionalDetails.identityProofDocumentName = mutDetails.identityProofType?.code || "IDENTITY_PROOF";
          convertAppData.additionalDetails.identityProofDocumentId = mutDetails.identityProofDocumentId || "";
        }
      }

      // Replaced by custom document mapping logic below

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

        if (updatePayload?.documents?.length > 0 && existingDocs.length > 0) {
          const activePayloadDocs = updatePayload.documents;
          let finalDocs = [];

          activePayloadDocs.forEach(newDoc => {
             const oldDoc = existingDocs.find(d => d.documentType === newDoc.documentType);
             if (oldDoc) {
                 if (oldDoc.fileStoreId === newDoc.fileStoreId) {
                     finalDocs.push({ ...newDoc, id: oldDoc.id });
                 } else {
                     finalDocs.push(newDoc);
                     finalDocs.push({ ...oldDoc, status: "INACTIVE" });
                 }
             } else {
                 finalDocs.push(newDoc);
             }
          });

          existingDocs.forEach(oldDoc => {
             if (!activePayloadDocs.find(d => d.documentType === oldDoc.documentType)) {
                 finalDocs.push({ ...oldDoc, status: "INACTIVE" });
             }
          });

          updatePayload.documents = finalDocs;
        }

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
                        clearFormData();
            clearCompletedSteps();
            clearAuthKNumber();
            clearAuthMobileNumber();
            clearAuthServiceType();
            clearAuthActiveConnection();
            const newAppNo =
              resolvedServiceType === "WATER" ? updateData?.WaterConnection?.[0]?.applicationNo : updateData?.SewerageConnections?.[0]?.applicationNo;
            setGeneratedAppNo(newAppNo);
            history.push(`${path}/submission`);
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

            const combinedExistingDocs = [
              ...existingDocs,
              ...(createdConnection?.documents || []),
            ];

            if (updatePayload?.documents?.length > 0 && combinedExistingDocs.length > 0) {
              updatePayload.documents = func.mapExistingDocIdsToPayload(updatePayload.documents, combinedExistingDocs);
            }

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
                                clearFormData();
                clearCompletedSteps();
                clearAuthKNumber();
                clearAuthMobileNumber();
                clearAuthServiceType();
                clearAuthActiveConnection();
                const newAppNo =
                  resolvedServiceType === "WATER" ? updateData?.WaterConnection?.[0]?.applicationNo : updateData?.SewerageConnections?.[0]?.applicationNo;
                setGeneratedAppNo(newAppNo);
                history.push(`${path}/submission`);
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
    if (targetStep < currentStep) {
      if (targetStep === 1) history.push(`${path}/search-connection`);
      else if (targetStep === 2) history.push(`${path}/existing-connection`);
      else if (targetStep === 3) history.push(`${path}/consumer-details`);
      else if (targetStep === 4) history.push(`${path}/document`);
      else if (targetStep === 5) history.push(`${path}/preview`);
    } else if (targetStep > currentStep) {
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
<Switch>
            <Route path={`${path}/search-connection`}>
              <Step1_SearchConnection
                t={t}
                defaultKNumber={isEditFlow ? applicationDetails?.applicationData?.connectionNo : ""}
                isEditFlow={isEditFlow}
                onNext={({ kNumber, mobileNumber, serviceType: detectedServiceType, activeConnection }) => {
                  setAuthKNumber(kNumber);
                  setAuthMobileNumber(mobileNumber);
                  if (detectedServiceType) setAuthServiceType(detectedServiceType);
                  if (activeConnection) setAuthActiveConnection(activeConnection);
                  setCompletedSteps((prev) => [...new Set([...prev, 1])]);
                  history.push(`${path}/existing-connection`);
                }}
              />
            </Route>

            <Route path={`${path}/existing-connection`}>
              <Fragment>
                <Step1_ExistingConnection
                  t={t}
                  applicationDetails={authActiveConnection ? { applicationData: authActiveConnection } : applicationDetails}
                  propertyId={authActiveConnection?.propertyId || applicationDetails?.applicationData?.propertyId}
                  mobileNumber={authMobileNumber}
                  onVerify={() => {
                    setCompletedSteps((prev) => [...new Set([...prev, 2])]);
                    history.push(`${path}/consumer-details`);
                  }}
                />
              </Fragment>
            </Route>

            <Route path={`${path}/consumer-details`}>
              <Step2_NewConsumerDetails 
                t={t} 
                defaultValues={formData} 
                onNext={(data) => {
                  setFormData((prev) => ({ ...prev, ...data }));
                  setCompletedSteps((prev) => [...new Set([...prev, 3])]);
                  history.push(`${path}/document`);
                }} 
                onBack={() => history.push(`${path}/existing-connection`)} 
              />
            </Route>

            <Route path={`${path}/document`}>
              <Step3_UploadDocuments 
                t={t} 
                defaultValues={formData} 
                onNext={(data) => {
                  setFormData((prev) => ({ ...prev, ...data }));
                  setCompletedSteps((prev) => [...new Set([...prev, 4])]);
                  history.push(`${path}/preview`);
                }} 
                onBack={() => history.push(`${path}/consumer-details`)} 
              />
            </Route>

            <Route path={`${path}/preview`}>
              <Step4_Preview
                t={t}
                formData={formData}
                applicationDetails={authActiveConnection ? { applicationData: authActiveConnection } : applicationDetails}
                resolvedServiceType={resolvedServiceType}
                onBack={() => history.push(`${path}/document`)}
                onSubmit={submitApplication}
                isLoading={isSubmitting}
              />
            </Route>

            <Route path={`${path}/submission`}>
              <Step5_Submission t={t} applicationNumber={generatedAppNo} serviceType={resolvedServiceType} />
            </Route>

            <Route exact path={path}>
              <Redirect to={`${path}/search-connection`} />
            </Route>
          </Switch>

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
