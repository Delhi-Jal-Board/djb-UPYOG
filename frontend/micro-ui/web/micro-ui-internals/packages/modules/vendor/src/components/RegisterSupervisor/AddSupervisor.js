import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import SupervisorConfig from "../../config/SupervisorConfig";
import { useHistory } from "react-router-dom";

const AddSupervisor = ({ parentUrl, heading }) => {
  const { t } = useTranslation();

  // getCurrentTenantId() returns state-level 'dl' for CITIZEN users.
  // ULB-level tenantId (e.g. 'dl.djb') is required by the supervisor API.
  // If the id has no '.' it means it's state-level, so we append '.djb'.
  const userInfo = Digit.UserService.getUser()?.info;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const queryClient = useQueryClient();
  const [canSubmit, setCanSubmit] = useState(false);

  const { mutate: mutateAsync } = Digit.Hooks.fsm.useSupervisorCreate(tenantId);
  const history = useHistory();

  const Config = SupervisorConfig(t);

  const defaultValues = {
    role: { code: "SUPERVISOR", name: "Supervisor" },
  };

  const isValidAge = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const dob = new Date(dateStr);

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= 18;
  };

  const onFormValueChange = (setValue, formData) => {
    const requiredFields = [
      formData?.fullName,
      formData?.mobileNumber,
      formData?.emailId,
      formData?.gender,
      formData?.dob,
      formData?.correspondenceAddress,
    ];

    const isBasicDetailsFilled = requiredFields.every(Boolean) && formData?.zoneIds?.length > 0 && isValidAge(formData?.dob);

    setCanSubmit(isBasicDetailsFilled);
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    const isVendor = userInfo?.roles?.some((role) => role.code === "EKYC_VENDOR");
    const assignedZone = Array.isArray(data?.zoneIds) ? data?.zoneIds?.map((ele) => ele.code).join(",") || "" : data?.zoneIds;
    const formData = {
      RequestInfo: {
        apiId: "Rainmaker",
        ver: "1.0",
        ts: null,
        action: "_create",
        msgId: `${Date.now()}|en_IN`,
        authToken: Digit.UserService.getUser()?.access_token || userInfo?.authToken,
        ...(isVendor && {
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
      supervisor: {
        tenantId: tenantId,
        // vendorId: vendorId,
        assignedZoneId: assignedZone,
        description: data?.description || "",
        owner: {
          tenantId: tenantId,
          name: data?.fullName,
          fatherOrHusbandName: "Static Father",
          relationship: "FATHER",
          dob: data?.dob ? new Date(data.dob).getTime() : null,
          gender: data?.gender?.code || "OTHERS",
          mobileNumber: data?.mobileNumber,
          emailId: data?.emailId,
          correspondenceAddress: data?.correspondenceAddress,
        },
      },
    };

    try {
      await mutateAsync(formData);
      setShowToast({ key: "success", action: "ADD_SUPERVISOR" });
      queryClient.invalidateQueries("SUPERVISOR_SEARCH");
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
            route: "supervisor-details",
            timeLine: [{ actions: t("ES_VENDOR_SUPERVISOR_DETAILS"), currentStep: 1 }],
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

export default AddSupervisor;
