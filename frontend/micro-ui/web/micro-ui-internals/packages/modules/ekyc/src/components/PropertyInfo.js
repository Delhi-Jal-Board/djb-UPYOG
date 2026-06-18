import React, { useState, Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toast, Loader, FormComposer } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import PropertyInfoConfig from "../config/PropertyInfoConfig";

const PropertyInfo = ({ config, onSelect, formData }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const flowState = location.state || {};
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const queryParams = new URLSearchParams(location.search);
  const urlKno = queryParams.get("kno");
  const searchKno =
    urlKno ||
    flowState?.kNumber ||
    flowState?.kno ||
    formData?.kNumber ||
    formData?.kno ||
    sessionStorage.getItem("EKYC_K_NUMBER");

  const { isLoading, data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchKno, fetchType: "PROPERTY" } },
    { enabled: !!searchKno, cacheTime: 0 }
  );

  const updateMutation = Digit.Hooks.ekyc.useEkycUpdate(tenantId);

  const savedData = formData?.propertyDetails || {};

  // 🔹 STATES
  const [buildingImage, setBuildingImage] = useState(null);
  const [buildingImageId, setBuildingImageId] = useState(savedData.buildingImageId || null);
  const [toast, setToast] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const [defaultValues, setDefaultValues] = useState(() => ({
    pidNumber: savedData.pidNumber || "",
    propertyType: savedData.propertyType ? { name: savedData.propertyType } : null,
    subPropertyCategory: savedData.subPropertyCategory ? { name: savedData.subPropertyCategory } : null,
    noOfFloors: savedData.noOfFloors || "",
    floorNo: savedData.floorNo || "",
    noOfRooms: savedData.noOfRooms || "",
    noOfBeds: savedData.noOfBeds || "",
    dwellingUnits: savedData.dwellingUnits || "",
    buildingImage: savedData.buildingImageId ? "Uploaded" : null,
  }));

  const [localFormData, setLocalFormData] = useState(defaultValues);

  const extractApplicationData = (searchData) => {
    if (!searchData) return null;
    const reviewWrapper =
      searchData?.applicationReviewInfo || searchData?.applicationReview || searchData;
    const applicationData = (Array.isArray(reviewWrapper) ? reviewWrapper[0] : reviewWrapper) || {};
    return applicationData?.newData || applicationData;
  };

  useEffect(() => {
    const appData = extractApplicationData(searchData);
    const rawData = appData || formData?.connectionDetails;
    const propertyInfo = rawData?.propertyInfo || rawData?.propertyDetails || rawData || {};

    if (propertyInfo && Object.keys(propertyInfo).length > 0 && !isDataLoaded) {
      let propType = null;
      let subPropCat = null;

      if (propertyInfo.subPropertyCategory) {
        const matchingType = [
          { name: "Residential" },
          { name: "Commercial" },
          { name: "Hotel" },
          { name: "Hospital" },
          { name: "Nursing Home" },
        ].find((type) => type.name.toLowerCase() === propertyInfo.subPropertyCategory.toLowerCase());
        if (matchingType) propType = matchingType;
        else propType = { name: propertyInfo.subPropertyCategory };
        subPropCat = { name: propertyInfo.subPropertyCategory };
      }

      if (propertyInfo.propertyType) {
        subPropCat = { name: propertyInfo.propertyType };
        if (!propertyInfo.subPropertyCategory) propType = { name: propertyInfo.propertyType };
      }

      const updatedDefaults = {
        pidNumber: savedData.pidNumber || propertyInfo.pidNumber || "",
        propertyType: savedData.propertyType ? { name: savedData.propertyType } : propType,
        subPropertyCategory: savedData.subPropertyCategory
          ? { name: savedData.subPropertyCategory }
          : subPropCat,
        noOfFloors:
          savedData.noOfFloors ||
          (propertyInfo.numberOfFloors || propertyInfo.noOfFloor
            ? String(propertyInfo.numberOfFloors || propertyInfo.noOfFloor)
            : ""),
        floorNo: savedData.floorNo || propertyInfo.floorNo || "",
        noOfRooms:
          savedData.noOfRooms ||
          (propertyInfo.numberOfRooms !== null && propertyInfo.numberOfRooms !== undefined
            ? String(propertyInfo.numberOfRooms)
            : ""),
        noOfBeds:
          savedData.noOfBeds ||
          (propertyInfo.numberOfBeds !== null && propertyInfo.numberOfBeds !== undefined
            ? String(propertyInfo.numberOfBeds)
            : ""),
        dwellingUnits:
          savedData.dwellingUnits ||
          (propertyInfo.numberOfDwellingUnits !== null && propertyInfo.numberOfDwellingUnits !== undefined
            ? String(propertyInfo.numberOfDwellingUnits)
            : ""),
        buildingImage: savedData.buildingImageId || propertyInfo.buildingImageFileStoreId || null,
      };

      setDefaultValues(updatedDefaults);
      setLocalFormData(updatedDefaults);
      if (updatedDefaults.buildingImage) {
        setBuildingImageId(updatedDefaults.buildingImage);
      }
      setIsDataLoaded(true);
    }
  }, [searchData, formData?.connectionDetails, isDataLoaded]);

  // 🔹 FILE UPLOAD
  const handleUpload = async (e, onChange) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2000000) {
      setToast({ type: "error", message: t("Max size 2MB exceeded") });
      return;
    }

    try {
      const res = await Digit.UploadServices.Filestorage("EKYC", file, tenantId);
      const fileStoreId = res?.data?.files?.[0]?.fileStoreId;

      if (fileStoreId) {
        onChange(file.name);
        setBuildingImageId(fileStoreId);

        const reader = new FileReader();
        reader.onloadend = () => setBuildingImage(reader.result);
        reader.readAsDataURL(file);

        setToast({ type: "success", message: t("Upload successful") });
      }
    } catch {
      setToast({ type: "error", message: t("Upload failed") });
    }
  };

  const onFormValueChange = (setValue, data) => {
    // Check if propertyType changed to re-evaluate mandatory validation or conditional visibility
    const propertyTypeChanged =
      (data?.propertyType?.name || data?.propertyType) !==
      (localFormData?.propertyType?.name || localFormData?.propertyType);

    if (propertyTypeChanged) {
      setLocalFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }

    // Determine validation
    const propTypeVal = data?.propertyType;
    const subPropCatVal = data?.subPropertyCategory;
    const noOfFloorsVal = data?.noOfFloors;
    const buildingImgId = buildingImageId || data?.buildingImage;
    const noOfRoomsVal = data?.noOfRooms;
    const noOfBedsVal = data?.noOfBeds;

    let valid = true;
    if (!propTypeVal) valid = false;
    if (!subPropCatVal) valid = false;
    if (!noOfFloorsVal || Number(noOfFloorsVal) < 1) valid = false;
    if (!buildingImgId) valid = false;

    if (propTypeVal?.name === "Hotel" && !noOfRoomsVal) valid = false;
    if (
      (propTypeVal?.name === "Hospital" || propTypeVal?.name === "Nursing Home") &&
      !noOfBedsVal
    )
      valid = false;

    if (valid !== canSubmit) {
      setCanSubmit(valid);
    }
  };

  const onSubmit = async (data) => {
    const submitData = {
      pidNumber: data.pidNumber,
      propertyType: data.propertyType?.name || data.propertyType,
      subPropertyCategory: data.subPropertyCategory?.name || data.subPropertyCategory,
      noOfFloors: data.noOfFloors,
      floorNo: data.floorNo,
      noOfRooms: data.noOfRooms,
      noOfBeds: data.noOfBeds,
      dwellingUnits: data.dwellingUnits,
      buildingImageId: buildingImageId,
    };

    try {
      await updateMutation.mutateAsync({
        RequestInfo: {},
        updateType: "PROPERTY",
        kno: searchKno,
        ...submitData,
      });
      setToast({ type: "success", message: t("Property details updated successfully!") });
      onSelect(config.key, submitData);
    } catch (error) {
      setToast({ type: "error", message: t("Failed to update property details") });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const Config = PropertyInfoConfig(
    t,
    localFormData,
    handleUpload,
    buildingImage,
    buildingImageId,
    setBuildingImage,
    setBuildingImageId
  );

  return (
    <Fragment>
      <FormComposer
        key={isDataLoaded ? "loaded" : "loading"}
        isDisabled={!canSubmit}
        label={t("ES_COMMON_CONTINUE")}
        config={Config.map((item) => ({
          ...item,
          isCollapsible: true,
          isDefaultOpen: true,
        }))}
        onSubmit={onSubmit}
        defaultValues={defaultValues}
        onFormValueChange={onFormValueChange}
        noCard={false}
        submitInForm={true}
      />
      {toast && (
        <Toast
          error={toast.type === "error"}
          label={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </Fragment>
  );
};

export default PropertyInfo;