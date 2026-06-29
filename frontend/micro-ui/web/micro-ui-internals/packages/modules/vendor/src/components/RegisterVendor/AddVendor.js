import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import VendorConfig from "../../config/VendorConfig";

const AddVendor = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const { t } = useTranslation();
  const history = useHistory();

  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type;
  // const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [showToast, setShowToast] = useState(null);
  // const [canSubmit, setCanSubmit] = useState(false);

  const [, setMutationHappened] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);

  const [, , clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);

  const [, , clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);

  const { mutate } = Digit.Hooks.fsm.useVendorCreate(tenantId);

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultValues = {
    serviceType: {
      code: "WT",
      name: "WT",
      i18nKey: "WT",
    },
    tripData: {
      noOfTrips: 1,
      amountPerTrip: null,
      amount: null,
    },
  };

  const [formData, setFormData] = useState(defaultValues);

  const Config = React.useMemo(() => VendorConfig(t, false, formData), [t, formData.serviceType?.code]);

  const onFormValueChange = (setValue, data) => {
    // Only update formData state if keys that affect dynamic config or child components change
    const currentZoneCodes = data?.zoneIds?.map((item) => item?.code) || [];

    const previousZoneCodes = formData?.zoneIds || [];
    const zoneChanged = currentZoneCodes.join(",") !== previousZoneCodes.join(",");
    if (data?.serviceType?.code !== formData?.serviceType?.code || zoneChanged) {
      setFormData((prev) => ({
        ...prev,
        serviceType: data?.serviceType,
      }));
    }
    if (zoneChanged) {
      setFormData((prev) => ({
        ...prev,
        zoneIds: currentZoneCodes,
      }));
    }

    const startDate = data?.contractStartDate;
    const endDate = data?.contractEndDate;

    if (startDate && endDate) {
      const isInvalid = new Date(endDate) < new Date(startDate);

      if (isInvalid && showToast?.action !== "INVALID_CONTRACT_DATE") {
        setShowToast({
          key: "error",
          action: "INVALID_CONTRACT_DATE",
        });
      } else if (!isInvalid && showToast) {
        setShowToast(null);
      }
    }

    // const isEkyc = data?.serviceType?.code === "EKYC";
    const isVendorDetailsFilled = data?.vendorName && data?.phone && data?.serviceType?.code;
    // const isAddressFilled = data?.address?.city && data?.address?.locality;

    // let isEkycFieldsFilled = true;
    // if (isEkyc) {
    //   isEkycFieldsFilled =
    //     data?.ownerName &&
    //     data?.contractStartDate &&
    //     data?.contractEndDate &&
    //     data?.zoneIds?.length > 0 &&
    //     data?.clusterIds?.length > 0 &&
    //     data?.gender &&
    //     data?.dob;
    // }

    // if (isVendorDetailsFilled && isAddressFilled) {
    //   setCanSubmit(true);
    // } else {
    //   setCanSubmit(false);
    // }

    if (isVendorDetailsFilled) {
      if (currentStep === 1) {
        setCurrentStep(2);
        setTimeout(() => {
          const headers = Array.from(document.querySelectorAll(".collapsible-card-title"));
          const addressHeader = headers.find((h) => h.textContent.includes(t("ES_FSM_REGISTRY_NEW_ADDRESS_DETAILS")));
          if (addressHeader) {
            addressHeader.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    } else {
      if (currentStep === 2) {
        setCurrentStep(1);
        setTimeout(() => {
          const headers = Array.from(document.querySelectorAll(".collapsible-card-title"));
          const vendorHeader = headers.find((h) => h.textContent.includes(t("ES_VRNDOR_NEW_VENDOR_DETAILS")));
          if (vendorHeader) {
            vendorHeader.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = (data) => {
    // FINAL SUBMIT
    const mergedData = data;
    const address = mergedData?.propertyAddress;

    const pincode = address?.pincode;
    const street = address?.streetName;
    const doorNo = address?.houseNo;
    const landmark = address?.landmark;

    const city = address?.city?.name;
    const state = address?.city?.name;
    const district = address?.city?.name;
    const region = address?.city?.name;

    const localityCode = address?.locality?.code;
    const localityName = address?.locality?.name;
    const localityArea = address?.subLocality;
    const wardCode = address?.ward?.code;
    const wardName = address?.ward?.name;

    const name = mergedData?.vendorName;
    const plotNo = mergedData?.plotNo?.trim();
    const buildingName = mergedData?.buildingName?.trim();
    const emailId = mergedData?.emailId;
    const phone = mergedData?.phone;

    const isEkyc = mergedData?.serviceType?.code === "EKYC";

    let vendorData = {
      tenantId: tenantId,
      name,
      agencyType: "ULB",
      paymentPreference: "post-service",
      address: {
        tenantId: tenantId,
        landmark,
        doorNo,
        plotNo,
        street,
        city,
        district,
        region,
        state,
        country: "india",
        pincode,
        buildingName,
        locality: {
          code: localityCode || "",
          name: localityName || "",
          label: "Locality",
          area: localityArea || "",
        },
        ward: wardCode
          ? {
              code: wardCode,
              name: wardName,
            }
          : undefined,
        geoLocation: {
          latitude: mergedData?.address?.latitude || 28.6139,
          longitude: mergedData?.address?.longitude || 77.209,
        },
      },
      owner: {
        tenantId: "dl", // As per CURL
        name: mergedData?.ownerName || name,
        fatherOrHusbandName: mergedData?.fatherOrHusbandName || name,
        relationship: mergedData?.relationship?.code || "OTHER",
        gender: mergedData?.gender?.code || "MALE",
        dob: mergedData?.dob ? new Date(mergedData.dob).getTime() : new Date(`1/1/1970`).getTime(),
        emailId: emailId || "",
        mobileNumber: phone,
      },
      additionalDetails: {
        serviceType: isEkyc ? "ekyc" : mergedData?.serviceType?.code,
      },
      vehicles: [],
      drivers: [],
      source: isEkyc ? "eKYC Portal" : "WhatsApp",
    };

    if (isEkyc) {
      vendorData = {
        ...vendorData,
        zoneIds: mergedData?.zoneIds?.map((z) => z?.[1]?.code) || [],
        clusterIds: mergedData?.clusterIds?.map((c) => c?.[1]?.code) || [],
        contractStartDate: mergedData.contractStartDate ? new Date(mergedData.contractStartDate).getTime() : null,
        contractEndDate: mergedData.contractEndDate ? new Date(mergedData.contractEndDate).getTime() : null,
      };
    }

    const payload = {
      vendor: vendorData,
    };

    if (isEkyc) {
      payload.RequestInfo = {
        apiId: "Rainmaker",
        msgId: "ekyc-vendor-create",
      };
    }

    mutate(payload, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
      },
      onSuccess: () => {
        history.push({
          pathname: `/digit-ui/${userType}/vendor/search-vendor`,
          state: {
            showSuccessToast: true,
            message: { key: "success", action: `ES_VENDOR_ADD_VENDOR` },
          },
        });
      },
    });
  };

  return (
    <React.Fragment>
      <VerticalTimeline
        config={[
          {
            route: "vendor-details",
            timeLine: [{ actions: "New Vendor Details", currentStep: 1 }],
          },
          {
            route: "address-details",
            timeLine: [{ actions: "Address Details", currentStep: 2 }],
          },
        ]}
        currentActiveIndex={currentStep - 1}
        showFinalStep={false}
      />
      <div style={{ flex: "1", overflowY: "auto" }}>
        <FormComposer
          config={Config}
          userType={userType}
          onFormValueChange={onFormValueChange}
          label={t("ES_COMMON_APPLICATION_SUBMIT")}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          noCard={true}
          noBreakLine={true}
          // isDisabled={!canSubmit}
        />
        {showToast && (
          <Toast
            error={showToast.key === "error"}
            label={
              showToast.action === "INVALID_CONTRACT_DATE"
                ? `${t("ES_VENDOR_CONTRACT_END_DATE")} cannot be earlier than ${t("ES_VENDOR_CONTRACT_START_DATE")}`
                : t(showToast.key === "success" ? `ES_FSM_REGISTRY_${showToast.action}_SUCCESS` : showToast.action)
            }
            onClose={closeToast}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default AddVendor;
