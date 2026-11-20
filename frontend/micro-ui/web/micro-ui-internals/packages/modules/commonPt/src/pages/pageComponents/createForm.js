import { FormComposer, Loader, Dropdown, Localities, Header, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { newConfig } from "../../config/Create/config";
import _, { create, unset } from "lodash";
import { convertToPropertyLightWeight } from "../utils";

const CreatePropertyForm = ({ config, onSelect, value, userType, redirectUrl }) => {
  const [showToast, setShowToast] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const tenants = Digit.Hooks.pt.useTenants();
  const { t } = useTranslation();
  const location = useLocation();

  const [canSubmit, setCanSubmit] = useState(true);
  const defaultValues = React.useMemo(() => {
    const stored = Digit.SessionStorage.get("PT_CREATE_PROPERTY_DATA") || {};
    const stateForm = location?.state?.formData || {};
    return { ...stored, ...value, ...stateForm };
  }, [value, location?.state?.formData]);
  const history = useHistory();
  const match = useRouteMatch();
  sessionStorage.setItem("VisitedCommonPTSearch", true);
  sessionStorage.setItem("VisitedLightCreate", true);
  const isMobile = window.Digit.Utils.browser.isMobile();

  let allCities = Digit.Hooks.pt.useTenants()?.sort((a, b) => a?.i18nKey?.localeCompare?.(b?.i18nKey));
  if (window.location.href.includes("obps")) {
    allCities = Digit.SessionStorage.get("OBPS_TENANTS");
  }
  if (window.location.href.includes("fsm")) {
    allCities = Digit.SessionStorage.get("FSM_TENANTS");
  }
  const [formValue, setFormValue] = useState("");
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    const stateFormData = location?.state?.formData;
    const storedData = Digit.SessionStorage.get("PT_CREATE_PROPERTY_DATA");
    if (stateFormData || (storedData && !location.state?.applicant)) {
      const dataToLoad = stateFormData || storedData;
      if (dataToLoad?.owners && Array.isArray(dataToLoad.owners) && dataToLoad.owners.length > 0) {
        setOwners(dataToLoad.owners);
      }
      if (dataToLoad?.locationDet || dataToLoad?.waterConnection) {
        setFormValue(dataToLoad);
      }
    } else if (location?.state && (!owners || owners.length === 0)) {
      const applicant = location.state?.applicant;
      const contact = location.state?.contact;
      const useDetails = location.state?.useDetails;
      const propertyAddress = location.state?.propertyAddress;

      let ownerData = [];
      if (applicant && contact) {
        ownerData = [
          {
            name: `${applicant.firstName}${applicant.middleName ? ` ${applicant.middleName}` : ""}${applicant.lastName ? ` ${applicant.lastName}` : ""
              }`,
            mobileNumber: contact.mobileNumber,
            gender: useDetails?.gender || { code: "MALE", name: "Male" },
            fatherOrHusbandName: applicant.ParentorSpouse || "NA",
            relationship: { code: "FATHER", name: "Father" },
            ownerType: { code: "NONE", name: "None" },
            ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
          },
        ];
        setOwners(ownerData);
      }

      if (propertyAddress || useDetails) {
        const initialFormValue = {
          locationDet: {
            cityCode: propertyAddress?.cityCode || propertyAddress?.city,
            city: propertyAddress?.city,
            locality: propertyAddress?.locality,
            houseDoorNo: propertyAddress?.houseNo || propertyAddress?.houseDoorNo,
            houseNo: propertyAddress?.houseNo || propertyAddress?.houseDoorNo,
            buildingColonyName: propertyAddress?.street || propertyAddress?.buildingColonyName,
            street: propertyAddress?.street || propertyAddress?.buildingColonyName,
            streetName: propertyAddress?.streetName || propertyAddress?.street,
            landmarkName: propertyAddress?.landmark || propertyAddress?.landmarkName,
            noOfFloors: propertyAddress?.noOfFloors || propertyAddress?.numberOfFloors || useDetails?.noOfFloors,
            totalNoOfFloors: propertyAddress?.totalNoOfFloors || propertyAddress?.totalFloors || useDetails?.totalNoOfFloors || useDetails?.totalFloors,
            totalFloors: propertyAddress?.totalNoOfFloors || propertyAddress?.totalFloors || useDetails?.totalNoOfFloors || useDetails?.totalFloors,
            landmark: propertyAddress?.landmark || propertyAddress?.landmarkName,
            pincode: propertyAddress?.pincode || propertyAddress?.pinCode,
            latitude: propertyAddress?.latitude || propertyAddress?.geoLocation?.latitude || "",
            longitude: propertyAddress?.longitude || propertyAddress?.geoLocation?.longitude || "",
            geoLocation: propertyAddress?.geoLocation,
            addressLine1: propertyAddress?.addressLine1 || propertyAddress?.address,
            addressLine2: propertyAddress?.addressLine2 || propertyAddress?.address2,
            addressType: propertyAddress?.addressType,
            actualWard: propertyAddress?.actualWard || "",
            actualAssembly: propertyAddress?.actualAssembly || "",
            actualZone: propertyAddress?.actualZone || "",
            assembly: propertyAddress?.assembly || "",
            block: propertyAddress?.block || propertyAddress?.ward || "",
            zone: propertyAddress?.zone || "",
            zroLocation: propertyAddress?.zroLocation || propertyAddress?.zro?.code || propertyAddress?.zro || "",
            subLocality: propertyAddress?.subLocality || "",
            colonyMcdCategory: propertyAddress?.colonyMcdCategory || "",
          },
          waterConnection: {
            useDetails: useDetails,
          },
          ...(ownerData.length > 0 ? { owners: ownerData } : {}),
        };
        setFormValue(initialFormValue);
      }
    }
  }, [location?.state]);
  const [cityCode, setCityCode] = useState("");
  let enableSkip = userType == "employee" ? false : config?.isSkipEnabled || sessionStorage.getItem("skipenabled");
  // delete
  // const [_formData, setFormData,_clear] = Digit.Hooks.useSessionStorage("store-data",null);
  const [mutationHappened, setMutationHappened, clear] = Digit.Hooks.useSessionStorage("EMPLOYEE_MUTATION_HAPPENED", false);
  const [successData, setsuccessData, clearSuccessData] = Digit.Hooks.useSessionStorage("EMPLOYEE_MUTATION_SUCCESS_DATA", {});
  const { data: commonFields, isLoading } = Digit.Hooks.pt.useMDMS(Digit.ULBService.getStateId(), "PropertyTax", "CommonFieldsConfig");

  const mutation = Digit.Hooks.pt.usePropertyAPI(
    tenantId,
    true // create
  );

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const currentConfig = React.useMemo(() => {
    return newConfig;
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  const onSubmit = async (formDataOnSubmit) => {
    const currentFormValue = {
      ...formValue,
      ...(formDataOnSubmit || {}),
      locationDet: {
        ...(formValue?.locationDet || {}),
        ...(formDataOnSubmit?.locationDet || {}),
      },
      waterConnection: {
        ...(formValue?.waterConnection || {}),
        ...(formDataOnSubmit?.waterConnection || {}),
      },
    };
    const loc = currentFormValue?.locationDet;
    if (
      !loc?.addressType ||
      !loc?.city ||
      !loc?.pincode ||
      !loc?.locality ||
      !loc?.addressLine1 ||
      !loc?.houseNo ||
      (typeof loc?.houseNo === "string" && !loc?.houseNo?.trim()) ||
      !loc?.landmark ||
      (typeof loc?.landmark === "string" && !loc?.landmark?.trim()) ||
      (!loc?.noOfFloors && !loc?.numberOfFloors) ||
      (!loc?.totalNoOfFloors && !loc?.totalFloors)
    ) {
      setShowToast({ key: true, label: t("Please fill all the mandatory fields") });
      return;
    }

    const useDetails = currentFormValue?.waterConnection?.useDetails || currentFormValue?.useDetails;
    if (
      !useDetails?.categoryType ||
      !useDetails?.propertyCategory ||
      !useDetails?.propertyType ||
      !useDetails?.WaterConnectionUsageType ||
      !useDetails?.plotArea ||
      !useDetails?.builtUpArea ||
      !useDetails?.heightOfTheBuilding
    ) {
      setShowToast({ key: true, label: t("Please fill all the mandatory fields") });
      return;
    }

    const plotAreaNum = parseFloat(useDetails?.plotArea);
    const builtUpAreaNum = parseFloat(useDetails?.builtUpArea);
    if (!isNaN(plotAreaNum) && !isNaN(builtUpAreaNum) && plotAreaNum < builtUpAreaNum) {
      const plotTrans = t("WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA") || t("WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA");
      setShowToast({
        key: true,
        label: plotTrans && plotTrans !== "WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA" && plotTrans !== "WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA"
          ? plotTrans
          : "Plot area should always be more than or equal to built up area.",
      });
      return;
    }

    const usageTypeObj = useDetails?.WaterConnectionUsageType;
    const usageTypeCode = typeof usageTypeObj === "object" ? usageTypeObj?.code || usageTypeObj?.value || usageTypeObj?.name : usageTypeObj;
    const isNormalUsage = String(usageTypeCode || "").toUpperCase() === "NORMAL";
    const heightNum = parseFloat(useDetails?.heightOfTheBuilding);
    if (isNormalUsage && !isNaN(heightNum) && heightNum > 17.5) {
      const heightTrans = t("WS_HEIGHT_OF_BUILDING_NORMAL_ERROR");
      setShowToast({
        key: true,
        label: heightTrans && heightTrans !== "WS_HEIGHT_OF_BUILDING_NORMAL_ERROR"
          ? heightTrans
          : "Height of the building must be 17.5 meters or less for Normal connection.",
      });
      return;
    }


    let ownersArray = owners && owners.length > 0 ? owners : currentFormValue?.owners;
    // Inject logged in user details if ownersArray is empty
    if (!ownersArray || ownersArray.length === 0 || !ownersArray[0]?.name) {
      const userInfo = Digit.UserService.getUser()?.info;
      const uName = userInfo?.name || "Citizen";
      const uParts = uName.trim().split(/\s+/);
      ownersArray = [
        {
          name: uName,
          firstName: uParts[0] || uName,
          middleName: uParts.length > 2 ? uParts.slice(1, -1).join(" ") : "",
          lastName: uParts.length > 1 ? uParts[uParts.length - 1] : "",
          emailId: userInfo?.emailId || userInfo?.email || "",
          email: userInfo?.emailId || userInfo?.email || "",
          mobileNumber: userInfo?.mobileNumber,
          gender: { code: userInfo?.gender || "MALE", name: userInfo?.gender || "Male" },
          fatherOrHusbandName: "NA",
          relationship: { code: "FATHER", name: "Father" },
          ownerType: { code: "NONE", name: "None" },
          ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
        }
      ];
    } else {
      ownersArray = ownersArray.map((owner) => {
        const fullName = owner?.name || "";
        const nameParts = fullName.trim().split(/\s+/);
        const fName = owner?.firstName || (nameParts.length > 0 && nameParts[0] ? nameParts[0] : "");
        const mName = owner?.middleName || (nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "");
        const lName = owner?.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "");
        return {
          ...owner,
          firstName: fName,
          middleName: mName,
          lastName: lName,
          name: fullName || [fName, mName, lName].filter(Boolean).join(" "),
        };
      });
    }

    const firstOwner = ownersArray?.[0];
    if (!firstOwner?.name || !firstOwner?.mobileNumber || !firstOwner?.gender) {
      setShowToast({ key: true, label: t("Please fill all the mandatory fields") });
      return;
    }

    if (firstOwner?.mobileNumber && !/^[6-9]\d{9}$/.test(firstOwner.mobileNumber)) {
      setShowToast({ key: true, label: t("CORE_COMMON_APPLICANT_MOBILE_NUMBER_INVALID") });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    for (const owner of ownersArray) {
      const email = owner?.emailId || owner?.email;
      if (email && typeof email === "string" && email.trim() !== "") {
        if (!emailRegex.test(email.trim())) {
          setShowToast({
            key: true,
            label: t("CORE_COMMON_INVALID_EMAIL", "Please enter a valid Email ID"),
          });
          return;
        }
      }
    }

    if (
      (currentFormValue?.owners?.ownershipCategory?.includes("MULTIPLEOWNERS") ||
        currentFormValue?.owners?.[0]?.ownershipCategory?.code?.includes("MULTIPLEOWNERS")) &&
      currentFormValue?.owners?.length == 1
    ) {
      setShowToast({ key: true, label: "PT_COMMON_ONE_MORE_OWNER_INFROMATION_REQUIRED" });
    } else {
      const previewData = { ...currentFormValue, owners: ownersArray };
      Digit.SessionStorage.set("PT_CREATE_PROPERTY_DATA", previewData);
      history.push({
        pathname: `${match.path}/preview`,
        search: location.search,
        state: { formData: previewData, redirectUrl: redirectUrl },
      });
    }
  };

  const onSkip = () => {
    onSelect("isSkip", true);
  };

  const onFormValueChange = (setValue, data, formState) => {
    // const city = data?.locationDet?.city;
    // const locality = data?.locationDet?.locality;

    // if (city?.code !== cityCode) {
    //   setCityCode(city?.code);
    // }
    if (!_.isEqual(data, formValue)) {
      setFormValue(data);
    }

    const currentData = { ...formValue, ...data };
    setCanSubmit(true);

    // if (!locality) {
    //   setCanSubmit(false);
    //   return;
    // }

    // setCanSubmit(true);
  };

  const getHeaderLabel = () => {
    let url = window.location.href;
    let moduleName = url?.split("=")?.[1]?.split("/")?.[3];
    if (moduleName) return t(`ES_COMMON_CREATE_PROPERTY_HEADER_${moduleName?.toUpperCase()}`);
    else return t("ES_COMMON_CREATE_PROPERTY_HEADER");
  };


  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={[{ timeLine: [{ actions: getHeaderLabel(), currentStep: 1 }] }]} showFinalStep={false} />
        <FormComposer
          onSkip={onSkip}
          showSkip={enableSkip}
          skipStyle={isMobile ? {} : { textAlign: "right", marginRight: "55px" }}
          onSubmit={onSubmit}
          noBoxShadow
          inline
          config={currentConfig}
          label={t("CS_COMMON_PREVIEW", "PREVIEW")}
          isDisabled={!canSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
          noCard={true}
        />
      </div>
      {showToast && (
        <Toast
          error={showToast.key}
          label={showToast.label}
          isDleteBtn={true}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default CreatePropertyForm;
