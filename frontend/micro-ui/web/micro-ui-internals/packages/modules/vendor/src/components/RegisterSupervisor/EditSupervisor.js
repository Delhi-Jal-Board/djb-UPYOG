import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import SupervisorConfig from "../../config/SupervisorConfig";

const EditSupervisor = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { id: supervisorId } = useParams();
  const type = Digit.UserService.getUser()?.info?.type;

  const userInfo = Digit.UserService.getUser()?.info;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [defaultValues, setDefaultValues] = useState({});
  const [supervisorDetails, setSupervisorDetails] = useState({});

  const { data: supervisorSearchResponse, isLoading } = Digit.Hooks.fsm.useSupervisorSearch(tenantId, { ids: supervisorId }, { staleTime: Infinity });

  const { mutate } = Digit.Hooks.fsm.useSupervisorUpdate(tenantId);

  const Config = SupervisorConfig(t);

  useEffect(() => {
    if (supervisorSearchResponse && supervisorSearchResponse.supervisors && supervisorSearchResponse.supervisors.length > 0) {
      let details = supervisorSearchResponse.supervisors[0];
      setSupervisorDetails(details);

      let values = {
        fullName: details?.owner?.name || details?.name,
        mobileNumber: details?.owner?.mobileNumber || details?.mobileNo,
        emailId: details?.owner?.emailId,
        employeeId: details?.employeeId,
        gender: details?.owner?.gender ? { code: details.owner.gender, active: true, i18nKey: `COMMON_GENDER_${details.owner.gender}` } : null,
        dob: details?.owner?.dob && Digit.DateUtils.ConvertTimestampToDate(details?.owner?.dob, "yyyy-MM-dd"),
        correspondenceAddress: details?.owner?.correspondenceAddress,
        description: details?.description,
        zoneIds: details?.assignedZoneId,
      };
      setDefaultValues(values);
    }
  }, [supervisorSearchResponse]);

  const onFormValueChange = (setValue, formData) => {
    const isBasicDetailsFilled =
      formData?.fullName &&
      formData?.mobileNumber &&
      formData?.emailId &&
      formData?.dob &&
      formData?.gender &&
      formData?.correspondenceAddress &&
      formData?.zoneIds;

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
    const formData = {
      RequestInfo: {
        apiId: "Rainmaker",
        ver: "1.0",
        ts: null,
        action: "_update",
        msgId: `${Date.now()}|en_IN`,
        authToken: userInfo?.authToken,
        userInfo: {
          id: userInfo?.id,
          uuid: userInfo?.uuid,
          userName: userInfo?.userName,
          name: userInfo?.name,
          type: userInfo?.type,
          tenantId: tenantId,
          roles: userInfo?.roles,
        },
      },
      supervisor: {
        ...supervisorDetails,
        description: data?.description || supervisorDetails?.description || "",
        assignedZoneId: data?.zoneIds || supervisorDetails?.assignedZoneId || null,
        owner: {
          ...supervisorDetails.owner,
          name: data?.fullName || supervisorDetails.owner?.name,
          fatherOrHusbandName: "Static Father",
          relationship: "FATHER",
          gender: data?.gender?.code || supervisorDetails.owner?.gender || "OTHERS",
          dob: data?.dob ? new Date(data.dob).getTime() : supervisorDetails.owner?.dob,
          emailId: data?.emailId || supervisorDetails.owner?.emailId,
          mobileNumber: data?.mobileNumber || supervisorDetails.owner?.mobileNumber,
          correspondenceAddress: data?.correspondenceAddress || supervisorDetails.owner?.correspondenceAddress,
        },
      },
    };

    mutate(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "UPDATE_SUPERVISOR" });
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");

        history.push({
          pathname: `/digit-ui/${type}/vendor/registry/supervisor-details/${supervisorId}`,
          state: {
            showSuccessToast: true,
          },
        });
      },
    });
  };

  if (isLoading || Object.keys(defaultValues).length === 0) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <VerticalTimeline
        config={[
          {
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
            duration="5000"
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default EditSupervisor;
