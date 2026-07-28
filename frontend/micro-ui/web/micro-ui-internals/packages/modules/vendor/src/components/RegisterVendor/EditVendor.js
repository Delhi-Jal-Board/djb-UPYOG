import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import VendorConfig from "../../config/VendorConfig";

const EditVendor = () => {
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;
  const { t } = useTranslation();
  const history = useHistory();
  let { id: dsoId } = useParams();
  const [showToast, setShowToast] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [defaultValues, setDefaultValues] = useState({});
  const [dsoDetails, setDsoDetails] = useState({});
  const queryClient = useQueryClient();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type;
  const [, setMutationHappened] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);
  const [, , clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);
  const [, , clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);
  const [genderMenu, setGenderMenu] = useState([]);

  const { data: dsoData, isLoading: daoDataLoading } = Digit.Hooks.fsm.useDsoSearch(tenantId, { ids: dsoId }, { staleTime: Infinity });
  const stateId = Digit.ULBService.getStateId();
  const { data: genderTypeData } = Digit.Hooks.obps.useMDMS(stateId, "common-masters", ["GenderType"]);
  const [zones, setZones] = useState([]);

  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);
  useEffect(() => {
    const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];

    const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];

    if (Array.isArray(boundaries?.children) && boundaries?.children.length > 0) {
      const allZones = boundaries.children.flatMap((assembly) =>
        (assembly?.children || []).map((zone) => ({
          code: zone.code,
          name: zone.name,
        }))
      );
      const zonesList = [...new Map(allZones.map((zone) => [zone.code, zone])).values()];
      setZones(zonesList);
    }
  }, [boundaryData]);

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

  const { mutate } = Digit.Hooks.fsm.useVendorUpdate(tenantId);
  const { setToast } = Digit.Hooks.useToast();

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
  }, []);

  useEffect(() => {
    if (dsoData && dsoData[0]) {
      const dsoDetails = dsoData[0]?.dsoDetails;
      setDsoDetails(dsoDetails);
      const serviceType = {
        i18nKey: dsoDetails?.additionalDetails?.serviceType.toUpperCase(),
        code: dsoDetails?.additionalDetails?.serviceType,
      };
      const values = {
        // ...dsoDetails,
        vendorName: dsoDetails?.name,
        propertyAddress: {
          pincode: dsoDetails?.address?.pincode || "",
          city: {
            code: tenantId,
            name: dsoDetails?.address?.city,
            i18nKey: `TENANT_TENANTS_${tenantId.toUpperCase().replace(".", "_")}`,
          },
          locality: {
            ...dsoDetails?.address?.locality,
            i18nkey: `${dsoDetails?.tenantId.toUpperCase().split(".").join("_")}_REVENUE_${dsoDetails?.address?.locality?.code}`,
          },
          houseNo: dsoDetails?.address?.doorNo || "",
          streetName: dsoDetails?.address?.street || "",
          landmark: dsoDetails?.address?.landmark || "",
          latitude: dsoDetails?.address?.geoLocation?.latitude || "",
          longitude: dsoDetails?.address?.geoLocation?.longitude || "",
        },
        cpt: {
          details: {
            address: {
              pincode
                : dsoDetails.address.pincode,
              city: {
                code: tenantId,
                name: dsoDetails.address.city,
                i18nKey: `TENANT_TENANTS_${tenantId.toUpperCase().replace(".", "_")}`,
              },
              locality: {
                ...dsoDetails.address.locality,
                i18nKey: `${dsoDetails.tenantId.toUpperCase().replace(".", "_")}_REVENUE_${dsoDetails.address.locality.code}`,
              },
              houseNo: dsoDetails.address.doorNo,
              street: dsoDetails.address.street,
              landmark: dsoDetails.address.landmark,
              geoLocation: {
                latitude: dsoDetails.address.geoLocation?.latitude,
                longitude: dsoDetails.address.geoLocation?.longitude,
              },
            },
            additionalDetails: {
              assembly: "",
              block: "",
              zone: "",
            },
          },
        },
        phone: dsoDetails?.owner?.mobileNumber,
        ownerName: dsoDetails?.owner?.name,
        contractEndDate: Digit.DateUtils.ConvertTimestampToDate(dsoDetails.contractEndDate, "yyyy-MM-dd"),
        contractStartDate: Digit.DateUtils.ConvertTimestampToDate(dsoDetails.contractStartDate, "yyyy-MM-dd"),
        fatherOrHusbandName: dsoDetails?.owner?.fatherOrHusbandName,
        relationship: dsoDetails?.owner?.relationship,
        gender: genderMenu.find((ele) => ele.code === dsoDetails.owner.gender),
        dob: dsoDetails?.owner?.dob && Digit.DateUtils.ConvertTimestampToDate(dsoDetails?.owner?.dob, "yyyy-MM-dd"),
        emailId: dsoDetails?.owner?.emailId === "abc@egov.com" ? "" : dsoDetails?.owner?.emailId,
        correspondenceAddress: dsoDetails?.owner?.correspondenceAddress,
        additionalDetails: dsoDetails?.additionalDetails?.description,
        vendorId: dsoDetails?.vendor_id,
        serviceType: serviceType,
        zoneIds: dsoDetails?.zoneIds,
      };
      setDefaultValues(values);
    }
  }, [dsoData]);

  useEffect(() => {
    if (!zones.length || !dsoDetails.zoneIds?.length) return;

    // Already converted
    if (typeof dsoDetails.zoneIds[0] === "object") return;

    setDefaultValues((prev) => ({
      ...prev,
      zoneIds: zones.filter((z) => prev?.zoneIds?.includes(z.name)),
    }));
  }, [dsoDetails?.zoneIds, zones]);


  const onFormValueChange = (setValue, data) => {
    const isAddressFilled = data?.propertyAddress?.city && data?.propertyAddress?.locality;
    const isVendorDetailsFilled = data?.vendorName && data?.phone && data?.serviceType?.code;
    const isEkyc = data?.serviceType?.code === "EKYC";
    let isEkycFieldsFilled = true;
    if (isEkyc) {
      isEkycFieldsFilled =
        data?.ownerName &&
        data?.contractStartDate &&
        data?.contractEndDate &&
        data?.zoneIds?.length > 0 &&
        data?.clusterIds?.length > 0 &&
        data?.gender &&
        data?.dob;
    }

    if (isVendorDetailsFilled && isAddressFilled && isEkycFieldsFilled) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  // const onSubmit = (data) => {
  //   const name = data?.vendorName;
  //   const phone = data?.phone;
  //   const pincode = data?.pincode;
  //   const street = data?.street?.trim();
  //   const doorNo = data?.doorNo?.trim();
  //   const plotNo = data?.plotNo?.trim();
  //   const landmark = data?.landmark?.trim();
  //   const city = data?.address?.city?.name;
  //   const state = data?.address?.city?.state;
  //   const district = data?.address?.city?.name;
  //   const region = data?.address?.city?.name;
  //   const buildingName = data?.buildingName?.trim();
  //   const localityCode = data?.address?.locality?.code;
  //   const localityName = data?.address?.locality?.name;
  //   const localityArea = data?.address?.locality?.area;
  //   const additionalDetails = data?.additionalDetails;
  //   const gender = data?.selectGender?.code;
  //   const emailId = data?.emailId;
  //   const dob = new Date(`${data.dob}`).getTime() || new Date(`1/1/1970`).getTime();
  //   const formData = {
  //     vendor: {
  //       ...dsoDetails,
  //       name,
  //       address: {
  //         ...dsoDetails.address,
  //         landmark,
  //         doorNo,
  //         plotNo,
  //         street,
  //         city,
  //         district,
  //         region,
  //         state,
  //         country: "in",
  //         pincode,
  //         buildingName,
  //         locality: {
  //           ...dsoDetails.address.locality,
  //           code: localityCode || "",
  //           name: localityName || "",
  //           label: "Locality",
  //           area: localityArea || "",
  //         },
  //         geoLocation: {
  //           ...dsoDetails.address.geoLocation,
  //           latitude: data?.address?.latitude || 0,
  //           longitude: data?.address?.longitude || 0,
  //         },
  //       },
  //       owner: {
  //         ...dsoDetails.owner,
  //         gender: gender || dsoDetails.owner?.gender || "OTHER",
  //         dob: dob,
  //         emailId: emailId || "abc@egov.com",
  //         mobileNumber: phone,
  //         relationship: dsoDetails.owner?.relationship || "OTHER",
  //       },
  //       additionalDetails: {
  //         ...dsoDetails.additionalDetails,
  //         description: additionalDetails,
  //       },
  //     },
  //   };
  //   mutate(formData, {
  //     onError: (error, variables) => {
  //       setShowToast({ key: "error", action: error });
  //     },
  //     onSuccess: (data, variables) => {
  //       setShowToast({ key: "success", action: "UPDATE_VENDOR" });
  //       queryClient.invalidateQueries("DSO_SEARCH");
  //       history.push({
  //         pathname: `/digit-ui/${userType}/vendor/registry/vendor-details/${dsoId}`,
  //         state: {
  //           showSuccessToast: true,
  //           message: { key: "success", action: `ES_VENDOR_ADD_VENDOR` },
  //         },
  //       });
  //     },
  //   });
  // };

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

    const isEkyc = mergedData?.serviceType?.i18nKey === "EKYC";

    let vendorData = {
      ...dsoDetails,
      tenantId: tenantId,
      name,
      agencyType: "ULB",
      paymentPreference: "post-service",
      address: {
        ...dsoDetails.address,
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
          ...dsoDetails.address.locality,
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
          ...dsoDetails.address.geoLocation,
          latitude: mergedData?.address?.latitude || 28.6139,
          longitude: mergedData?.address?.longitude || 77.209,
        },
      },
      owner: {
        ...dsoDetails.owner,
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
        zoneIds: mergedData?.zoneIds?.map((z) => z?.name) || [],
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
        queryClient.invalidateQueries("DSO_SEARCH");
        setToast({
          key: "success",
          action: "ES_VENDOR_UPDATE_VENDOR",
        });

        history.push(`/digit-ui/${userType}/vendor/search-vendor`);
      },
    });
  };
  const config = React.useMemo(() => {
    return VendorConfig(t, defaultValues?.serviceType?.i18nKey || "", genderMenu, true);
  }, [t, defaultValues?.serviceType?.i18nKey, genderMenu]);

  if (daoDataLoading || isLoading || Object.keys(defaultValues).length === 0) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <VerticalTimeline
        config={[{ timeLine: [{ actions: t("ES_FSM_REGISTRY_TITLE_EDIT_VENDOR"), currentStep: 1 }] }]}
        currentActiveIndex={0}
        showFinalStep={false}
      />
      <div style={{ flex: "1", overflowY: "auto" }}>
        <FormComposer
          isDisabled={!canSubmit}
          label={t("ES_COMMON_APPLICATION_SUBMIT")}
          config={config
            .filter((i) => !i.hideInEmployee)
            .map((config) => {
              return {
                ...config,
                body: config.body.filter((a) => !a.hideInEmployee),
              };
            })}
          fieldStyle={{ marginRight: 0 }}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
        />
        {showToast && (
          <Toast
            error={showToast.key === "error" ? true : false}
            label={t(showToast.key === "success" ? `ES_FSM_REGISTRY_${showToast.action}_SUCCESS` : showToast.action)}
            onClose={closeToast}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default EditVendor;
