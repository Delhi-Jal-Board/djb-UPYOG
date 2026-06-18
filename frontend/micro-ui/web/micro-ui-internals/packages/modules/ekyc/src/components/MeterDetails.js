import React, { useState, Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toast, Loader, FormComposer } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import MeterDetailsConfig from "../config/MeterDetailsConfig";

const MeterDetails = ({ config, onSelect, formData }) => {
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
    { tenantId, details: { kno: searchKno, fetchType: "METER" } },
    { enabled: !!searchKno, cacheTime: 0 }
  );

  const updateMutation = Digit.Hooks.ekyc.useEkycUpdate(tenantId);

  const savedData = formData?.meterDetails || {};

  // 🔹 STATES
  const [meterPhoto, setMeterPhoto] = useState(null);
  const [meterPhotoId, setMeterPhotoId] = useState(savedData.meterPhotoId || null);
  const [toast, setToast] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const [defaultValues, setDefaultValues] = useState(() => ({
    connectionCategory: savedData.connectionCategory || "",
    saType: savedData.saType || "",
    status: savedData.status || "",
    mrCode: savedData.mrCode || "",
    areaCode: savedData.areaCode || "",
    mrKey: savedData.mrKey || "",
    meterNumber: savedData.meterNumber || "",
    meterMaker: savedData.meterMaker || "",
    meterStatus: savedData.meterStatus ? { name: savedData.meterStatus } : null,
    meterCondition: savedData.meterCondition ? { name: savedData.meterCondition } : null,
    meterLocation: savedData.meterLocation ? { name: savedData.meterLocation } : null,
    lastBillReceived: savedData.lastBillReceived ? { name: savedData.lastBillReceived } : null,
    billMonthYear: savedData.billMonthYear ? { name: savedData.billMonthYear } : null,
    reason: savedData.reason || "",
    accessToMeter: savedData.accessToMeter ? { name: savedData.accessToMeter } : null,
    sewerConnection: savedData.sewerConnection ? { name: savedData.sewerConnection } : null,
    septicTank: savedData.septicTank ? { name: savedData.septicTank } : null,
    meterPhoto: savedData.meterPhotoId ? "Uploaded" : null,
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
    const apiMeter = rawData?.meterDetails || rawData || {};

    if (apiMeter && Object.keys(apiMeter).length > 0 && !isDataLoaded) {
      let mStatus = null;
      let mCondition = null;
      let mLoc = null;
      let billRec = null;
      let billMonYr = null;
      let accToMeter = null;
      let sewerConn = null;
      let sepTank = null;

      if (apiMeter.meterStatus) {
        const matchingStatus = [
          { name: "Metered" },
          { name: "Unmetered" },
          { name: "Can not be identified" },
        ].find((o) => o.name.toLowerCase() === apiMeter.meterStatus.toLowerCase());
        if (matchingStatus) mStatus = matchingStatus;
        else mStatus = { name: apiMeter.meterStatus };
      } else if (apiMeter.metered !== undefined) {
        mStatus = { name: apiMeter.metered ? "Metered" : "Unmetered" };
      }

      if (apiMeter.meterCondition) {
        const matchingCond = [{ name: "Damaged" }, { name: "Not-Damaged" }].find(
          (o) => o.name.toLowerCase() === apiMeter.meterCondition.toLowerCase()
        );
        if (matchingCond) mCondition = matchingCond;
        else mCondition = { name: apiMeter.meterCondition };
      }

      if (apiMeter.meterLocation) {
        const matchingLoc = [{ name: "Inside" }, { name: "Outside" }].find(
          (o) =>
            o.name.toLowerCase() === apiMeter.meterLocation.toLowerCase() ||
            apiMeter.meterLocation.toLowerCase().includes(o.name.toLowerCase())
        );
        if (matchingLoc) mLoc = matchingLoc;
        else mLoc = { name: apiMeter.meterLocation };
      }

      if (apiMeter.lastBillRaised !== undefined && apiMeter.lastBillRaised !== null) {
        const strVal = String(apiMeter.lastBillRaised).toLowerCase();
        if (strVal === "true" || strVal === "yes") billRec = { name: "Yes" };
        else billRec = { name: "No" };
      }

      if (apiMeter.lastBillReceivedDate) {
        const formatted = apiMeter.lastBillReceivedDate.replace("-", "/");
        const parsedParts = formatted.split("/");
        if (parsedParts.length === 2) {
          const mon = parseInt(parsedParts[0], 10);
          const yr = parseInt(parsedParts[1], 10);
          billMonYr = { name: `${mon}/${yr}` };
        } else {
          billMonYr = { name: apiMeter.lastBillReceivedDate };
        }
      }

      if (apiMeter.accessToMeter !== undefined && apiMeter.accessToMeter !== null) {
        const strVal = String(apiMeter.accessToMeter).toLowerCase();
        if (strVal === "true" || strVal === "yes") accToMeter = { name: "Yes" };
        else accToMeter = { name: "No" };
      }

      if (apiMeter.sewerConnection !== undefined && apiMeter.sewerConnection !== null) {
        const strVal = String(apiMeter.sewerConnection).toLowerCase();
        if (strVal === "true" || strVal === "yes") sewerConn = { name: "Yes" };
        else sewerConn = { name: "No" };
      }

      if (apiMeter.septicTank !== undefined && apiMeter.septicTank !== null) {
        const strVal = String(apiMeter.septicTank).toLowerCase();
        if (strVal === "true" || strVal === "yes") sepTank = { name: "Yes" };
        else sepTank = { name: "No" };
      }

      const updatedDefaults = {
        connectionCategory: savedData.connectionCategory || apiMeter.connectionCategory || "",
        saType: savedData.saType || apiMeter.saType || "",
        status: savedData.status || apiMeter.statusFlag || "",
        mrCode: savedData.mrCode || (apiMeter.mrcode ? String(apiMeter.mrcode) : ""),
        areaCode: savedData.areaCode || (apiMeter.areacode ? String(apiMeter.areacode) : ""),
        mrKey: savedData.mrKey || (apiMeter.mrkey ? String(apiMeter.mrkey) : ""),
        meterNumber: savedData.meterNumber || apiMeter.meterNumber || "",
        meterMaker: savedData.meterMaker || apiMeter.meterMake || "",
        meterStatus: savedData.meterStatus ? { name: savedData.meterStatus } : mStatus,
        meterCondition: savedData.meterCondition ? { name: savedData.meterCondition } : mCondition,
        meterLocation: savedData.meterLocation ? { name: savedData.meterLocation } : mLoc,
        lastBillReceived: savedData.lastBillReceived ? { name: savedData.lastBillReceived } : billRec,
        billMonthYear: savedData.billMonthYear ? { name: savedData.billMonthYear } : billMonYr,
        reason: savedData.reason || apiMeter.lastBillNotRaisedReason || "",
        accessToMeter: savedData.accessToMeter ? { name: savedData.accessToMeter } : accToMeter,
        sewerConnection: savedData.sewerConnection ? { name: savedData.sewerConnection } : sewerConn,
        septicTank: savedData.septicTank ? { name: savedData.septicTank } : sepTank,
        meterPhoto: savedData.meterPhotoId || apiMeter.meterPhotoFileStoreId || null,
      };

      setDefaultValues(updatedDefaults);
      setLocalFormData(updatedDefaults);
      if (updatedDefaults.meterPhoto) {
        setMeterPhotoId(updatedDefaults.meterPhoto);
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
        setMeterPhotoId(fileStoreId);

        const reader = new FileReader();
        reader.onloadend = () => setMeterPhoto(reader.result);
        reader.readAsDataURL(file);

        setToast({ type: "success", message: t("Upload successful") });
      }
    } catch {
      setToast({ type: "error", message: t("Upload failed") });
    }
  };

  const onFormValueChange = (setValue, data) => {
    const meterStatusChanged =
      (data?.meterStatus?.name || data?.meterStatus) !==
      (localFormData?.meterStatus?.name || localFormData?.meterStatus);

    const lastBillReceivedChanged =
      (data?.lastBillReceived?.name || data?.lastBillReceived) !==
      (localFormData?.lastBillReceived?.name || localFormData?.lastBillReceived);

    const sewerConnectionChanged =
      (data?.sewerConnection?.name || data?.sewerConnection) !==
      (localFormData?.sewerConnection?.name || localFormData?.sewerConnection);

    if (meterStatusChanged || lastBillReceivedChanged || sewerConnectionChanged) {
      setLocalFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }

    // Determine validation
    const connCatVal = data?.connectionCategory;
    const mStatusVal = data?.meterStatus;
    const mLocVal = data?.meterLocation;
    const billRecVal = data?.lastBillReceived;
    const sewerConnVal = data?.sewerConnection;
    const mPhotoId = meterPhotoId || data?.meterPhoto;
    const reasonVal = data?.reason;
    const billMonYrVal = data?.billMonthYear;
    const sepTankVal = data?.septicTank;

    let valid = true;
    if (!connCatVal) valid = false;
    if (!mStatusVal) valid = false;
    if (!mLocVal) valid = false;
    if (!billRecVal) valid = false;
    if (!sewerConnVal) valid = false;

    if (mStatusVal?.name === "Metered" && !mPhotoId) valid = false;
    if (billRecVal?.name === "No" && !reasonVal) valid = false;
    if (billRecVal?.name === "Yes" && !billMonYrVal) valid = false;
    if (sewerConnVal?.name === "No" && !sepTankVal) valid = false;

    if (valid !== canSubmit) {
      setCanSubmit(valid);
    }
  };

  const onSubmit = async (data) => {
    const submitData = {
      connectionCategory: data.connectionCategory,
      saType: data.saType,
      status: data.status,
      mrCode: data.mrCode,
      areaCode: data.areaCode,
      mrKey: data.mrKey,
      meterNumber: data.meterNumber,
      meterMaker: data.meterMaker,
      meterStatus: data.meterStatus?.name || data.meterStatus,
      meterCondition: data.meterCondition?.name || data.meterCondition,
      meterLocation: data.meterLocation?.name || data.meterLocation,
      lastBillReceived: data.lastBillReceived?.name || data.lastBillReceived,
      billMonthYear: data.billMonthYear?.name || data.billMonthYear,
      reason: data.reason,
      accessToMeter: data.accessToMeter?.name || data.accessToMeter,
      sewerConnection: data.sewerConnection?.name || data.sewerConnection,
      septicTank: data.septicTank?.name || data.septicTank,
      meterPhotoId: meterPhotoId,
    };

    try {
      await updateMutation.mutateAsync({
        RequestInfo: {},
        updateType: "METER",
        kno: searchKno,
        ...submitData,
      });
      setToast({ type: "success", message: t("Meter details updated successfully!") });
      onSelect(config.key, submitData);
    } catch (error) {
      setToast({ type: "error", message: t("Failed to update meter details") });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const Config = MeterDetailsConfig(
    t,
    localFormData,
    handleUpload,
    meterPhoto,
    meterPhotoId,
    setMeterPhoto,
    setMeterPhotoId
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

export default MeterDetails;