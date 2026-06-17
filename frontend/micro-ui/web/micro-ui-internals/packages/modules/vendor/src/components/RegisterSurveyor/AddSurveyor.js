import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import SurveyorConfig from "../../config/SurveyorConfig";
import { useHistory } from "react-router-dom";

const AddSurveyor = ({ parentUrl, heading }) => {
  const { t } = useTranslation();
  const history = useHistory();

  const userInfo = Digit.UserService.getUser()?.info;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const queryClient = useQueryClient();
  const [canSubmit, setCanSubmit] = useState(false);

  const { mutateAsync } = Digit.Hooks.fsm.useSurveyorCreate(tenantId);

  const Config = SurveyorConfig(t);

  const defaultValues = {
    role: { code: "SURVEYOR", name: "Surveyor" },
  };

  const onFormValueChange = (setValue, formData) => {
    // Basic validation logic
    const isBasicDetailsFilled =
      formData?.fullName &&
      formData?.mobileNumber &&
      formData?.emailId &&
      // formData?.employeeId &&
      formData?.fatherOrHusbandName &&
      // formData?.relationship &&
      formData?.dob &&
      formData?.correspondenceAddress;

    if (isBasicDetailsFilled) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    const isSupervisor = userInfo?.roles?.some((role) => role.code === "EKYC_SUPERVISOR");

    const formData = {
      RequestInfo: {
        apiId: "Rainmaker",
        ver: "1.0",
        ts: null,
        action: "_create",
        msgId: `${Date.now()}|en_IN`,
        authToken: Digit.UserService.getUser()?.access_token || userInfo?.authToken,
        ...(isSupervisor && {
          userInfo: {
            id: userInfo?.id,
            uuid: userInfo?.uuid,
            userName: userInfo?.userName,
            name: userInfo?.name,
            type: userInfo?.type,
            tenantId: userInfo?.tenantId || rawTenantId,
            roles: userInfo?.roles,
          },
        }),
      },
      surveyor: {
        tenantId: tenantId,
        // vendorId: vendorIdParam || data?.agencyName?.code || data?.agencyName?.id || userInfo?.uuid,
        // supervisorId: data?.reportingManager?.code || data?.reportingManager?.id || null,
        description: data?.description || "",
        additionalDetails: {
          serviceType: "ekyc",
        },
        owner: {
          tenantId: tenantId,
          name: data?.fullName,
          fatherOrHusbandName: data?.fatherOrHusbandName,
          relationship: "FATHER",
          gender: data?.gender?.code || "OTHERS",
          dob: data?.dob ? new Date(data.dob).getTime() : null,
          emailId: data?.emailId,
          mobileNumber: data?.mobileNumber,
          correspondenceAddress: data?.correspondenceAddress,
        },
      },
    };

    try {
      await mutateAsync(formData);
      setShowToast({ key: "success", action: "ADD_SURVEYOR" });
      queryClient.invalidateQueries("SURVEYOR_SEARCH");
      setTimeout(() => {
        closeToast();
        history.push("/digit-ui/citizen/vendor/search-vendor");
      }, 3000);
    } catch (error) {
      setShowToast({ key: "error", action: error?.message || error });
      setTimeout(closeToast, 5000);
    }
  };

  return (
    <React.Fragment>
      <VerticalTimeline
        config={[
          {
            route: "surveyor-details",
            timeLine: [{ actions: t("ES_VENDOR_SURVEYOR_DETAILS"), currentStep: 1 }],
          },
        ]}
        currentActiveIndex={0}
        showFinalStep={false}
      />
      <div style={{ flex: "1", overflowY: "auto" }}>
        <FormComposer
          isDisabled={!canSubmit}
          label={t("ES_COMMON_APPLICATION_SUBMIT")}
          config={Config.map((config) => ({
            ...config,
            isCollapsible: true,
            isDefaultOpen: true,
          }))}
          fieldStyle={{ marginRight: 0 }}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
          mode="onChange"
          noCard={true}
        />
        {showToast && (
          <Toast
            error={showToast.key === "error"}
            label={t(showToast.key === "success" ? `ES_VENDOR_${showToast.action}_SUCCESS` : showToast.action)}
            onClose={closeToast}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default AddSurveyor;
