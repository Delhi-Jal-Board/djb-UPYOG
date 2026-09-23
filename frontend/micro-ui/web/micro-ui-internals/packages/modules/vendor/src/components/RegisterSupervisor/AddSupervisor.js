import React, { useEffect, useState, useRef } from "react";
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
  const userType = userInfo?.type;
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [showToast, setShowToast] = useState(null);
  const queryClient = useQueryClient();
  const [canSubmit, setCanSubmit] = useState(false);
  const [mobileExists, setMobileExists] = useState(false);
  const mobileExistsRef = useRef(false);
  const isCheckingMobileRef = useRef(false);
  const lastCheckedMobile = useRef("");

  const { mutateAsync } = Digit.Hooks.fsm.useSupervisorCreate(tenantId);
  const history = useHistory();

  const [genderMenu, setGenderMenu] = useState([]);
  const stateId = Digit.ULBService.getStateId();
  const { data: genderTypeData } = Digit.Hooks.obps.useMDMS(stateId, "common-masters", ["GenderType"]);

  useEffect(() => {
    if (genderTypeData && genderTypeData["common-masters"]?.GenderType?.length) {
      const menuItems = genderTypeData["common-masters"]?.GenderType?.filter((data) => data.active).map((genderDetails) => ({
        i18nKey: `COMMON_GENDER_${genderDetails.code}`,
        code: `${genderDetails.code}`,
        value: `${genderDetails.code}`,
      }));
      setGenderMenu(menuItems);
    }
  }, [genderTypeData]);

  const Config = React.useMemo(() => {
    return SupervisorConfig(t, genderMenu);
  }, [t, genderMenu]);

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

  const onFormValueChange = async (setValue, formData) => {
    const mobile = formData?.mobileNumber ? `${formData.mobileNumber}`.trim() : "";

    if (mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile)) {
      if (lastCheckedMobile.current !== mobile) {
        lastCheckedMobile.current = mobile;
        isCheckingMobileRef.current = true;
        setCanSubmit(false);
        try {
          const tenant = Digit.ULBService.getStateId() || "dl";
          const res = await Digit.UserService.userSearch(tenant, { mobileNumber: mobile }, {});
          const exists = Boolean(res?.user && res.user.length > 0);
          mobileExistsRef.current = exists;
          setMobileExists(exists);
          if (exists) {
            setShowToast({
              key: "error",
              action: t("ES_USER_ALREADY_EXISTS_WITH_MOBILE", "User already exists with this mobile number"),
            });
            setCanSubmit(false);
            return;
          }
        } catch (err) {
          console.error("Error checking mobile number:", err);
        } finally {
          isCheckingMobileRef.current = false;
        }
      }
    } else {
      lastCheckedMobile.current = "";
      mobileExistsRef.current = false;
      if (mobileExists) setMobileExists(false);
    }

    const requiredFields = [
      formData?.fullName,
      formData?.mobileNumber,
      formData?.emailId,
      formData?.gender,
      formData?.dob,
      formData?.correspondenceAddress,
    ];

    const isBasicDetailsFilled =
      requiredFields.every(Boolean) &&
      (Array.isArray(formData?.zoneIds) ? formData?.zoneIds?.length > 0 : Boolean(formData?.zoneIds)) &&
      isValidAge(formData?.dob) &&
      !mobileExistsRef.current &&
      !isCheckingMobileRef.current;

    setCanSubmit(isBasicDetailsFilled);
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    const mobile = data?.mobileNumber ? `${data.mobileNumber}`.trim() : "";

    if (mobileExistsRef.current) {
      setShowToast({
        key: "error",
        action: t("ES_USER_ALREADY_EXISTS_WITH_MOBILE", "User already exists with this mobile number"),
      });
      return;
    }

    try {
      const tenant = Digit.ULBService.getStateId() || "dl";
      const res = await Digit.UserService.userSearch(tenant, { mobileNumber: mobile }, {});
      if (res?.user && res.user.length > 0) {
        mobileExistsRef.current = true;
        setMobileExists(true);
        setShowToast({
          key: "error",
          action: t("ES_USER_ALREADY_EXISTS_WITH_MOBILE", "User already exists with this mobile number"),
        });
        setCanSubmit(false);
        return;
      }
    } catch (err) {
      console.error("Error verifying mobile number on submit:", err);
    }

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
            type: userType,
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
        correspondenceAddress: data?.correspondenceAddress,
        owner: {
          tenantId: tenantId,
          name: data?.fullName,
          fatherOrHusbandName: "Static Father",
          relationship: "FATHER",
          dob: data?.dob ? new Date(data.dob).getTime() : null,
          gender: data?.gender?.code || "OTHERS",
          mobileNumber: data?.mobileNumber,
          emailId: data?.emailId,
        },
      },
    };

    try {
      await mutateAsync(formData);
      setShowToast({ key: "success", action: "ADD_SUPERVISOR" });
      queryClient.invalidateQueries("SUPERVISOR_SEARCH");
      history.push({
        pathname: `/digit-ui/${userType}/vendor/search-vendor`,
        state: {
          showSuccessToast: true,
          message: { key: "success", action: t("ES_VENDOR_ADD_SUPERVISOR_SUCCESS") },
        },
      });
    } catch (error) {
      setShowToast({ key: "error", action: error?.message || error });
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
