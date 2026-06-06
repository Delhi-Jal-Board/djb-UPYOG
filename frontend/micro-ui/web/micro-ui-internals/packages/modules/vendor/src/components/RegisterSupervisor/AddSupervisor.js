import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import SupervisorConfig from "../../config/SupervisorConfig";
import { useHistory, useLocation } from "react-router-dom";

const AddSupervisor = ({ parentUrl, heading }) => {
  const { t } = useTranslation();
  const history = useHistory();

  // getCurrentTenantId() returns state-level 'dl' for CITIZEN users.
  // ULB-level tenantId (e.g. 'dl.djb') is required by the supervisor API.
  // If the id has no '.' it means it's state-level, so we append '.djb'.
  const userInfo = Digit.UserService.getUser()?.info;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const queryClient = useQueryClient();
  const [canSubmit, setCanSubmit] = useState(false);

  const { mutate } = Digit.Hooks.fsm.useSupervisorCreate(tenantId);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const vendorIdParam = queryParams.get("vendorId");

  // Use the logged-in user's UUID as vendorId if not provided in URL
  const vendorId = vendorIdParam || userInfo?.uuid;

  const Config = SupervisorConfig(t);

  const defaultValues = {
    role: { code: "SUPERVISOR", name: "Supervisor" },
  };

  const onFormValueChange = (setValue, formData) => {
    // Basic validation logic
    const isBasicDetailsFilled =
      formData?.fullName &&
      formData?.mobileNumber &&
      formData?.emailId &&
      formData?.fatherOrHusbandName &&
      formData?.relationship &&
      formData?.dob &&
      formData?.gender &&
      formData?.correspondenceAddress &&
      formData?.assignedZone;

    if (isBasicDetailsFilled) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = (data) => {
    const isVendor = userInfo?.roles?.some((role) => role.code === "EKYC_VENDOR");

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
        vendorId: vendorId,
        assignedZoneId: data?.assignedZone?.code || data?.assignedZone || null,
        description: data?.description || "",
        owner: {
          tenantId: tenantId,
          name: data?.fullName,
          fatherOrHusbandName: data?.fatherOrHusbandName,
          relationship: data?.relationship?.code,
          dob: data?.dob ? new Date(data.dob).getTime() : null,
          gender: data?.gender?.code || "OTHERS",
          mobileNumber: data?.mobileNumber,
          emailId: data?.emailId,
          correspondenceAddress: data?.correspondenceAddress,
        },
      },
    };

    mutate(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "ADD_SUPERVISOR" });
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");
        setTimeout(closeToast, 5000);
      },
    });
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
