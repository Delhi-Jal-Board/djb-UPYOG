import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import SurveyorConfig from "../../config/SurveyorConfig";

const EditSurveyor = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { id: surveyorId } = useParams();
  const type = Digit.UserService.getUser()?.info?.type;

  const userInfo = Digit.UserService.getUser()?.info;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [defaultValues, setDefaultValues] = useState({});
  const [surveyorDetails, setSurveyorDetails] = useState({});

  const { data: surveyorSearchResponse, isLoading } = Digit.Hooks.fsm.useSurveyorSearch(tenantId, { ids: surveyorId }, { staleTime: Infinity });

  const { mutate } = Digit.Hooks.fsm.useSurveyorUpdate(tenantId);

  const Config = SurveyorConfig(t);

  useEffect(() => {
    if (surveyorSearchResponse && surveyorSearchResponse.surveyors && surveyorSearchResponse.surveyors.length > 0) {
      let details = surveyorSearchResponse.surveyors[0];
      setSurveyorDetails(details);

      let values = {
        fullName: details?.owner?.name || details?.name,
        mobileNumber: details?.owner?.mobileNumber || details?.mobileNo,
        emailId: details?.owner?.emailId,
        employeeId: details?.employeeId,
        gender: details?.owner?.gender ? { code: details.owner.gender, name: `COMMON_GENDER_${details.owner.gender}` } : null,
        fatherOrHusbandName: details?.owner?.fatherOrHusbandName,
        relationship: details?.owner?.relationship
          ? { code: details.owner.relationship, name: `ES_COMMON_RELATION_${details.owner.relationship}` }
          : null,
        dob: details?.owner?.dob && Digit.DateUtils.ConvertTimestampToDate(details?.owner?.dob, "yyyy-MM-dd"),
        correspondenceAddress: details?.owner?.correspondenceAddress,
        description: details?.description,
      };
      setDefaultValues(values);
    }
  }, [surveyorSearchResponse]);

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
      formData?.fullName &&
      formData?.mobileNumber &&
      formData?.emailId &&
      formData?.employeeId &&
      formData?.fatherOrHusbandName &&
      formData?.relationship &&
      formData?.dob &&
      formData?.correspondenceAddress;

    if (isBasicDetailsFilled && isValidAge(formData?.dob)) {
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
      surveyor: {
        ...surveyorDetails,
        description: data?.description || surveyorDetails?.description || "",
        name: data?.fullName || surveyorDetails?.name,
        mobileNo: data?.mobileNumber || surveyorDetails?.mobileNo,
        employeeId: data?.employeeId || surveyorDetails?.employeeId,
        owner: {
          ...surveyorDetails.owner,
          name: data?.fullName || surveyorDetails.owner?.name,
          fatherOrHusbandName: data?.fatherOrHusbandName || surveyorDetails.owner?.fatherOrHusbandName,
          relationship: data?.relationship?.code || surveyorDetails.owner?.relationship,
          gender: data?.gender?.code || surveyorDetails.owner?.gender || "OTHERS",
          dob: data?.dob ? new Date(data.dob).getTime() : surveyorDetails.owner?.dob,
          emailId: data?.emailId || surveyorDetails.owner?.emailId,
          mobileNumber: data?.mobileNumber || surveyorDetails.owner?.mobileNumber,
          correspondenceAddress: data?.correspondenceAddress || surveyorDetails.owner?.correspondenceAddress,
        },
      },
    };

    mutate(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "UPDATE_SURVEYOR" });
        queryClient.invalidateQueries("SURVEYOR_SEARCH");

        history.push({
          pathname: `/digit-ui/${type}/vendor/registry/surveyor-details/${surveyorId}`,
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

export default EditSurveyor;
