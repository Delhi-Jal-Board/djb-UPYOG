import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import SurveyorConfig from "../../config/SurveyorConfig";
import { useHistory } from "react-router-dom";

const AddSurveyor = ({ parentUrl, heading }) => {
  const { t } = useTranslation();
  const history = useHistory();

  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const queryClient = useQueryClient();
  const [canSubmit, setCanSubmit] = useState(false);

  const { mutateAsync } = Digit.Hooks.fsm.useSurveyorCreate(tenantId);

  const isSupervisor = userInfo?.roles?.some((role) => role.code === "EKYC_SUPERVISOR");

  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: isSupervisor, staleTime: Infinity }
  );

  const matchedSupervisor = useMemo(() => {
    if (!supervisorSearchResponse?.supervisors) return null;
    return supervisorSearchResponse.supervisors.find(
      (s) =>
        s.id?.toLowerCase() === userInfo?.uuid?.toLowerCase() ||
        s.owner?.uuid?.toLowerCase() === userInfo?.uuid?.toLowerCase() ||
        s.owner?.mobileNumber === userInfo?.mobileNumber ||
        s.mobileNo === userInfo?.mobileNumber
    );
  }, [supervisorSearchResponse, userInfo]);

  const [defaultValues, setDefaultValues] = useState(null);

  useEffect(() => {
    if (!isSupervisor) {
      setDefaultValues({
        role: { code: "SURVEYOR", name: "Surveyor" },
        mobileNumber: "",
      });
    } else if (supervisorSearchResponse && !isSupervisorSearchLoading) {
      setDefaultValues({
        role: { code: "SURVEYOR", name: "Surveyor" },
        mobileNumber: "",
        zoneIds: matchedSupervisor?.assignedZoneId || "",
      });
    }
  }, [isSupervisor, supervisorSearchResponse, isSupervisorSearchLoading, matchedSupervisor]);

  const Config = useMemo(() => {
    const baseConfig = SurveyorConfig(t);
    if (isSupervisor) {
      return baseConfig.map((section) => ({
        ...section,
        body: section.body.map((field) => {
          if (field.key === "zoneIds") {
            return {
              ...field,
              props: {
                ...field.props,
                disable: true,
              },
            };
          }
          return field;
        }),
      }));
    }
    return baseConfig;
  }, [t, isSupervisor]);

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
    const isBasicDetailsFilled =
      formData?.fullName && formData?.mobileNumber && formData?.emailId && formData?.dob && formData?.correspondenceAddress;

    if (isBasicDetailsFilled && isValidAge(formData?.dob)) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    const assignedZone = Array.isArray(data?.zoneIds) ? data?.zoneIds?.map((ele) => ele.code).join(",") || "" : (data?.zoneIds || "");

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
            type: userType,
            tenantId: userInfo?.tenantId || rawTenantId,
            roles: userInfo?.roles,
          },
        }),
      },
      surveyor: {
        tenantId: tenantId,
        vendorId: isSupervisor ? matchedSupervisor?.vendorId : undefined,
        supervisorId: isSupervisor ? matchedSupervisor?.id : undefined,
        assignedZoneId: assignedZone,
        description: data?.description || "",
        correspondenceAddress: data?.correspondenceAddress,
        additionalDetails: {
          serviceType: "ekyc",
        },
        owner: {
          tenantId: tenantId,
          name: data?.fullName,
          fatherOrHusbandName: "Static Father",
          relationship: "FATHER",
          gender: data?.gender?.code || "OTHERS",
          dob: data?.dob ? new Date(data.dob).getTime() : null,
          emailId: data?.emailId,
          mobileNumber: data?.mobileNumber,
        },
      },
    };

    try {
      await mutateAsync(formData);
      queryClient.invalidateQueries("SURVEYOR_SEARCH");
      history.push({
        pathname: `/digit-ui/${userType}/vendor/search-vendor`,
        state: {
          showSuccessToast: true,
          message: { key: "success", action: t("ES_VENDOR_ADD_SURVEYOR_SUCCESS") },
        },
      });
    } catch (error) {
      setShowToast({ key: "error", action: error?.message || error });
    }
  };

  if (isSupervisor && (isSupervisorSearchLoading || !defaultValues)) {
    return <Loader />;
  }

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
