import React, { useState, Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toast, Loader, FormComposer } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import AadhaarVerificationConfig from "../config/AadhaarVerificationConfig";

const AadhaarVerification = ({ config, onSelect, formData }) => {
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
    sessionStorage.getItem("EKYC_K_NUMBER") ||
    "";

  const { isLoading, data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchKno, fetchType: "CONNECTION" } },
    { enabled: !!searchKno, cacheTime: 0 }
  );

  const updateMutation = Digit.Hooks.ekyc.useEkycUpdate(tenantId);

  const savedData = formData?.aadhaarVerification || {};

  // 🔹 STATES
  const [documentId, setDocumentId] = useState(savedData.documentId || null);
  const [documentProof, setDocumentProof] = useState(savedData.documentProof || null);
  const [toast, setToast] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const [defaultValues, setDefaultValues] = useState(() => ({
    kno: savedData.kno || searchKno || "",
    consumerType: savedData.consumerType ? { name: savedData.consumerType } : null,
    occupantType: savedData.occupantType ? { name: savedData.occupantType } : null,
    categoryType: savedData.categoryType ? { name: savedData.categoryType } : null,
    firstName: savedData.firstName || "",
    middleName: savedData.middleName || "",
    lastName: savedData.lastName || "",
    gender: savedData.gender ? { name: savedData.gender } : null,
    parentSpouseName: savedData.parentSpouseName || "",
    mobile: savedData.mobile || "",
    whatsapp: savedData.whatsapp || "",
    email: savedData.email || "",
    residents: savedData.residents || "",
    identityType: savedData.identityType ? { name: savedData.identityType } : null,
    documentNumber: savedData.documentNumber || "",
    informantIsConsumer: savedData.informantIsConsumer ?? true,
    informantName: savedData.informantName || "",
    informantRelation: savedData.informantRelation || "",
    documentId: savedData.documentId || null,
    documentProof: savedData.documentProof || null,
    idFile: savedData.idFile || null,
    ownerMobile: savedData.ownerMobile || "",
    tenantVerification: savedData.tenantVerification || "",
    designation: savedData.designation || "",
    department: savedData.department || "",
    employeeId: savedData.employeeId || "",
    entityName: savedData.entityName || "",
    contactPerson: savedData.contactPerson || "",
    consent: savedData.consent || false,
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
    const details = rawData?.connectionDetails || rawData || {};
    const addrDetails = rawData?.addressDetails || {};

    if (details && Object.keys(details).length > 0 && !isDataLoaded) {
      let fName = "";
      let mName = "";
      let lName = "";

      if (details.firstName) {
        fName = details.firstName;
        mName = details.middleName || "";
        lName = details.lastName || "";
      } else if (details.consumerName) {
        const parts = details.consumerName.trim().split(/\s+/);
        fName = parts[0] || "";
        if (parts.length === 2) lName = parts[1];
        if (parts.length > 2) {
          mName = parts.slice(1, -1).join(" ");
          lName = parts[parts.length - 1];
        }
      }

      const updatedDefaults = {
        kno: savedData.kno || searchKno || "",
        consumerType: savedData.consumerType
          ? { name: savedData.consumerType }
          : details.consumerType
            ? { name: details.consumerType }
            : null,
        occupantType: savedData.occupantType
          ? { name: savedData.occupantType }
          : details.occupantType
            ? { name: details.occupantType }
            : null,
        categoryType: savedData.categoryType ? { name: savedData.categoryType } : null,
        firstName: savedData.firstName || fName,
        middleName: savedData.middleName || mName,
        lastName: savedData.lastName || lName,
        gender: savedData.gender
          ? { name: savedData.gender }
          : details.gender
            ? { name: details.gender }
            : null,
        parentSpouseName: savedData.parentSpouseName || details.parentSpouse || "",
        mobile: savedData.mobile || details.phoneNumber || addrDetails.mobileNo || "",
        whatsapp: savedData.whatsapp || addrDetails.whatsappNo || "",
        email: savedData.email || details.email || addrDetails.email || "",
        residents: savedData.residents || (addrDetails.noOfPerson ? String(addrDetails.noOfPerson) : ""),
        identityType: savedData.identityType ? { name: savedData.identityType } : null,
        documentNumber: savedData.documentNumber || "",
        informantIsConsumer: savedData.informantIsConsumer ?? true,
        informantName: savedData.informantName || details.informantName || "",
        informantRelation: savedData.informantRelation || details.informantRelation || "",
        documentId: savedData.documentId || details.documentNumber || null,
        documentProof: savedData.documentProof || null,
        idFile: savedData.idFile || null,
        ownerMobile: savedData.ownerMobile || "",
        tenantVerification: savedData.tenantVerification || "",
        designation: savedData.designation || "",
        department: savedData.department || "",
        employeeId: savedData.employeeId || "",
        entityName: savedData.entityName || "",
        contactPerson: savedData.contactPerson || "",
        consent: savedData.consent || false,
      };

      setDefaultValues(updatedDefaults);
      setLocalFormData(updatedDefaults);
      if (updatedDefaults.documentId) {
        setDocumentId(updatedDefaults.documentId);
      }
      if (updatedDefaults.documentProof) {
        setDocumentProof(updatedDefaults.documentProof);
      }
      setIsDataLoaded(true);
    }
  }, [searchData, formData?.connectionDetails, isDataLoaded]);

  // 🔹 FILE UPLOAD
  const handleUploadProof = async (e, onChange) => {
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
        setDocumentProof(file.name);
        setDocumentId(fileStoreId);
        setToast({ type: "success", message: t("Upload successful") });
      }
    } catch {
      setToast({ type: "error", message: t("Upload failed") });
    }
  };

  const onFormValueChange = (setValue, data) => {
    // Avoid updating states on every keypress unless they affect conditional visibility
    const consumerTypeChanged =
      (data?.consumerType?.name || data?.consumerType) !==
      (localFormData?.consumerType?.name || localFormData?.consumerType);
    const occupantTypeChanged =
      (data?.occupantType?.name || data?.occupantType) !==
      (localFormData?.occupantType?.name || localFormData?.occupantType);
    const informantIsConsumerChanged = data?.informantIsConsumer !== localFormData?.informantIsConsumer;

    if (consumerTypeChanged || occupantTypeChanged || informantIsConsumerChanged) {
      setLocalFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }

    // Determine validation
    const knoVal = data?.kno || searchKno;
    const consumerTypeVal = data?.consumerType;
    const occupantTypeVal = data?.occupantType;
    const categoryTypeVal = data?.categoryType;
    const firstNameVal = data?.firstName;
    const mobileVal = data?.mobile;
    const residentsVal = data?.residents;
    const consentVal = data?.consent;
    const docId = data?.documentId || documentId;
    const ownerMobileVal = data?.ownerMobile;

    let valid = true;
    if (!knoVal) valid = false;
    if (!consumerTypeVal) valid = false;
    if (!occupantTypeVal) valid = false;
    if (!categoryTypeVal) valid = false;
    if (!firstNameVal) valid = false;
    if (!mobileVal || !/^[6-9]\d{9}$/.test(mobileVal)) valid = false;
    if (!residentsVal || Number(residentsVal) <= 0) valid = false;
    if (occupantTypeVal?.name === "Tenanted" && !docId && !ownerMobileVal) valid = false;
    if (!consentVal) valid = false;

    if (valid !== canSubmit) {
      setCanSubmit(valid);
    }
  };

  const onSubmit = async (data) => {
    const submitData = {
      kno: data.kno || searchKno,
      consumerType: data.consumerType?.name || data.consumerType,
      occupantType: data.occupantType?.name || data.occupantType,
      categoryType: data.categoryType?.name || data.categoryType,
      consumerName: data.consumerName || `${data.firstName || ""} ${data.middleName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender?.name || data.gender,
      parentSpouseName: data.parentSpouseName,
      relation: data.relation || savedData.relation || "",
      mobile: data.mobile,
      whatsapp: data.whatsapp,
      email: data.email,
      residents: data.residents,
      documentId: documentId,
      documentProof: documentProof,
      ownerMobile: data.ownerMobile,
      tenantVerification: data.tenantVerification,
      designation: data.designation,
      department: data.department,
      employeeId: data.employeeId,
      landline: data.landline || savedData.landline || "",
      entityRelation: data.entityRelation || savedData.entityRelation || "",
      contactPerson: data.contactPerson,
      entityName: data.entityName,
      idProof: data.identityType?.name || data.identityType,
      idNumber: data.documentNumber,
      consent: data.consent,
      informantIsConsumer: data.informantIsConsumer ?? true,
      informantName: data.informantName,
      informantRelation: data.informantRelation,
    };

    try {
      await updateMutation.mutateAsync({
        RequestInfo: {},
        updateType: "CONSUMER",
        ...submitData,
      });
      setToast({ type: "success", message: t("Data updated successfully!") });
      onSelect(config.key, submitData);
    } catch (error) {
      setToast({ type: "error", message: t("Failed to update consumer details") });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const Config = AadhaarVerificationConfig(t, localFormData, handleUploadProof, setDocumentId, documentId);

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

export default AadhaarVerification;
