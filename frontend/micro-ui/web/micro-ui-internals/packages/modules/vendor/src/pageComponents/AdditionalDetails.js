import React, { useEffect, useState } from "react";
import {
  FormStep,
  TextInput,
  CardLabel,
  Dropdown,
  VerticalTimeline,
  CustomTooltip,
  MobileNumber,
  LabelFieldPair,
} from "@djb25/digit-ui-react-components";
import { Controller, useForm } from "react-hook-form";

const AdditionalDetails = ({ t, config, onSelect, userType, formData, ownerIndex }) => {
  let index = 0;

  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;
  const vendorId = formData?.vendor_id || new URLSearchParams(window.location.search).get("vendorId");

  const { data: vendorAdditionalData } = Digit.Hooks.vendor.useEmpvendorCommonSearch(
    { tenantId, filters: { vendorId: vendorId } },
    { enabled: !!vendorId }
  );

  const user = Digit.UserService.getUser().info;
  const applicantName =
    (formData.ownerKey && formData.ownerKey[index] && formData.ownerKey[index].applicantName) || formData?.ownerKey?.applicantName || "";

  const emailId = (formData.ownerKey && formData.ownerKey[index] && formData.ownerKey[index].emailId) || formData?.ownerKey?.emailId || "";

  const mobileNumber =
    (formData.ownerKey && formData.ownerKey[index] && formData.ownerKey[index].mobileNumber) ||
    formData?.ownerKey?.mobileNumber ||
    user?.mobileNumber;

  const altMobileNumber =
    (formData.ownerKey && formData.ownerKey[index] && formData.ownerKey[index].altMobileNumber) || formData?.ownerKey?.altmobileNumber || "";

  // States for vendor Additionals details

  const [VendorCategory, setVendorCategory] = useState(formData?.[config.key]?.VendorCategory || "");
  const [VendorId, setVendorId] = useState(formData?.[config.key]?.VendorId || ""); // Added VendorId state
  const [userName, setUserName] = useState(formData?.[config.key]?.name || "");
  const [Bank, setBank] = useState(formData?.[config.key]?.Bank || "");
  const [BankbranchName, setBankbranchName] = useState(formData?.[config.key]?.BankbranchName || undefined);
  const [IFSC, setIFSC] = useState(formData?.[config.key]?.IFSC || "");
  const [AccountNo, setAccountNo] = useState(formData?.[config.key]?.AccountNo || "");
  const [PanNo, setPanNo] = useState(formData?.[config.key]?.PanNo || "");
  const [GstNo, setGstNo] = useState(formData?.[config.key]?.GstNo || "");
  const [GstState, setGstState] = useState(formData?.[config.key]?.GstState || "");
  const [RegistrationNo, setRegistrationNo] = useState(formData?.[config.key]?.RegistrationNo || "");
  const [EpfNo, setEpfNo] = useState(formData?.[config.key]?.EpfNo || "");
  const [EsiNo, setEsiNo] = useState(formData?.[config.key]?.EsiNo || "");
  const [VendorType, setVendorType] = useState(formData?.[config.key]?.VendorType || "");
  const [Status, setStatus] = useState(formData?.[config.key]?.Status || "");
  const [micrNo, setmicrNo] = useState(formData?.[config.key]?.micrNo || "");
  const [PhoneNo, setPhoneNo] = useState(formData?.[config.key]?.PhoneNo || "");
  const [ContactPerson, setContactPerson] = useState(formData?.[config.key]?.ContactPerson || "");

  // const [showToast, setShowToast] = useState(null);

  //function for setting the values of the vendor details

  useEffect(() => {
    if (IFSC.length === 11 && !Bank && !BankbranchName && !micrNo) {
      fetch(`https://ifsc.razorpay.com/${IFSC}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.BANK && data.BRANCH && data.MICR) {
            setBank(data.BANK);
            setBankbranchName(data.BRANCH);
            setmicrNo(data.MICR);
            // setShowToast({ error: false, label: t("VALID_IFSC_CODE") });
          } else {
            // setShowToast({ error: true, label: t("INVALID_IFSC_CODE") });
          }
        })
        .catch(() => {
          // setShowToast({ error: true, label: t("INVALID_IFSC_CODE") });
        });
    } else {
      if (IFSC.length === 11 && Bank && BankbranchName) {
        setBank(Bank);
        setBankbranchName(BankbranchName);
        setmicrNo(micrNo);
      } else {
        setBank("");
        setBankbranchName("");
        setmicrNo("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IFSC]);

  function setvendorbank(e) {
    setBank(e.target.value);
  }

  function setBankbranch(e) {
    setBankbranchName(e.target.value);
  }

  function setvendorifsc(e) {
    const input = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
    if (input.length <= 11) {
      setIFSC(input);
    }
  }

  function setvendoraccountno(e) {
    setAccountNo(e.target.value);
  }

  function setpanno(e) {
    setPanNo(e.target.value);
  }

  function setgstno(e) {
    setGstNo(e.target.value);
  }

  function setgststate(e) {
    setGstState(e.target.value);
  }

  function setregistrationno(e) {
    setRegistrationNo(e.target.value);
  }

  function setepfno(e) {
    setEpfNo(e.target.value);
  }

  function setesino(e) {
    setEsiNo(e.target.value);
  }

  // function setphoneno(e) {
  //   setPhoneNo(e.target.value);
  // }

  function setcontactperson(e) {
    setContactPerson(e.target.value);
  }

  // mdms call
  const { control } = useForm();

  const { data: dsoData } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { ids: vendorId },
    { enabled: !!vendorId, staleTime: Infinity }
  );

  useEffect(() => {
    if (dsoData && dsoData.length > 0) {
      const vendor = dsoData[0];
      setUserName(vendor.name);
      setVendorId(vendor.id);
    }
  }, [dsoData]);

  // Load prefilled details from search API response
  useEffect(() => {
    if (vendorAdditionalData?.VendorDetails?.[0]?.vendorAdditionalDetails) {
      const details = vendorAdditionalData.VendorDetails[0].vendorAdditionalDetails;
      if (details.ifscCode) setIFSC(details.ifscCode);
      if (details.bank) setBank(details.bank);
      if (details.bankBranchName) setBankbranchName(details.bankBranchName);
      if (details.micrNo) setmicrNo(details.micrNo);
      if (details.bankAccountNumber) setAccountNo(details.bankAccountNumber);
      if (details.vendorPhone) setPhoneNo(details.vendorPhone);
      if (details.contactPerson) setContactPerson(details.contactPerson);
      if (details.panNo) setPanNo(details.panNo);
      if (details.gstTinNo) setGstNo(details.gstTinNo);
      if (details.gstRegisteredState) setGstState(details.gstRegisteredState);
      if (details.registrationNo) setRegistrationNo(details.registrationNo);
      if (details.epfNo) setEpfNo(details.epfNo);
      if (details.esiNo) setEsiNo(details.esiNo);

      if (details.serviceType) {
        setVendorType({
          code: details.serviceType,
          i18nKey: details.serviceType === "SUPPLIER" ? "Supplier" : details.serviceType === "CONTRACTOR" ? "Contractor" : details.serviceType,
        });
      }

      if (details.vendorCategory) {
        setVendorCategory({
          code: details.vendorCategory,
          i18nKey: details.vendorCategory === "FIRM" ? "Firm" : details.vendorCategory === "Individual" ? "Individual" : details.vendorCategory,
        });
      }

      if (details.status) {
        setStatus({
          code: details.status,
          i18nKey: details.status === "ACTIVE" ? "Active" : details.status === "INACTIVE" ? "Inactive" : details.status,
        });
      }
    }
  }, [vendorAdditionalData]);

  // This is responsible for the going into the next step
  const goNext = () => {
    let owner = formData.ownerKey && formData.ownerKey[index];
    let ownerStep;
    if (userType === "citizen") {
      ownerStep = { ...owner, applicantName, mobileNumber, altMobileNumber, emailId };

      onSelect(config.key, { ...formData[config.key], ...ownerStep }, false, index);
    } else {
      ownerStep = {
        ...owner,
        VendorCategory,
        name: userName,
        VendorId: VendorId,
        Bank,
        BankbranchName,
        IFSC,
        AccountNo,
        PanNo,
        GstNo,
        GstState,
        RegistrationNo,
        EpfNo,
        EsiNo,
        VendorType,
        Status,
        micrNo,
        PhoneNo,
        ContactPerson,
      };
      onSelect(config.key, ownerStep, false, index);
    }
  };

  // const onSkip = () => onSelect();

  useEffect(() => {
    if (userType === "citizen") {
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    VendorCategory,
    VendorId,
    userName,
    Bank,
    BankbranchName,
    IFSC,
    AccountNo,
    PanNo,
    GstNo,
    GstState,
    RegistrationNo,
    EpfNo,
    EsiNo,
    VendorType,
    Status,
    micrNo,
    PhoneNo,
    ContactPerson,
    userType,
  ]);

  return (
    <React.Fragment>
      {/* <Timeline steps={steps} currentStep={1} /> */}
      <VerticalTimeline
        config={[
          { timeLine: [{ actions: t("VENDOR_ADDITIONAL_DETAILS"), currentStep: 1 }] },
          { timeLine: [{ actions: t("VENDOR_DOCUMENT_DETAILS"), currentStep: 2 }] },
          { timeLine: [{ actions: t("VENDOR_SUMMARY"), currentStep: 3 }] },
        ]}
        currentActiveIndex={0}
        showFinalStep={false}
      />
      <div style={{ flex: "1", overflowY: "auto" }}>
        <FormStep
          config={config}
          onSelect={goNext}
          // onSkip={onSkip}
          t={t}
          // isDisabled={!applicantName || !mobileNumber || !emailId}
          className="formcomposer-grid-container-form"
        >
          {/* <div>
              <CardLabel>{`${t("VENDOR_ID")}`}</CardLabel>
              <TextInput
                t={t}
                type={"text"}
                isMandatory={false}
                optionKey="i18nKey"
                name="VendorId"
                value={VendorId}
                //placeholder={"Enter IFSC Code"}
                onChange={setVendorId}
                style={{ width: "100%" }}
                maxLength={11}
                ValidationRequired={false}
                validation={{
                  isRequired: true,
                  pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for IFSC code
                  type: "text",
                  title: t("INVALID_VENDOR_ID"),
                }}
              />
            </div> */}
          <LabelFieldPair>
            <CardLabel className="card-label-smaller">
              <CustomTooltip label={`${t("IFSC_CODE")}`} isMandatory={false} message={t("INVALID_IFSC_CODE_ERROR_MESSAGE")} />
            </CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="IFSC"
              value={IFSC}
              placeholder={"Enter IFSC Code"}
              onChange={setvendorifsc}
              style={{ width: "100%" }}
              maxLength={11}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[A-Z]{4}0[A-Z0-9]{6}$", // validation for IFSC code
                type: "text",
                title: t("INVALID_IFSC_CODE_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>
              {`${t("VENDOR_BANK_NAME")}`} <span className="check-page-link-button">*</span>
            </CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="bankName"
              placeholder={"Bank Name Auto Select"}
              style={{ width: "100%" }}
              value={Bank}
              onChange={setvendorbank}
              disabled={true}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>
              {`${t("VENDOR_BANK_BRANCH_NAME")}`} <span className="check-page-link-button">*</span>
            </CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="BankbranchName"
              value={BankbranchName}
              style={{ width: "100%" }}
              placeholder={"Bank Branch Name Auto Select"}
              onChange={setBankbranch}
              disabled={false}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>
              {`${t("VENDOR_MICR_NO")}`} <span className="check-page-link-button">*</span>
            </CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="MicrNo"
              value={micrNo}
              style={{ width: "100%" }}
              placeholder={"MICR No"}
              onChange={setmicrNo}
              disabled={false}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("ACCOUNT_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="AccountNo"
              value={AccountNo}
              onChange={setvendoraccountno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "[0-9]{9,18}", // validation for account number
                type: "text",
                title: t("INVALID_ACCOUNT_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel>{`${t("PHONE_NO")}`}</CardLabel>
            {/* <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="PhoneNo"
              value={PhoneNo}
              onChange={setphoneno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "[0-9]{9,18}", // validation for account number
                type: "text",
                title: t("INVALID_ACCOUNT_NO_ERROR_MESSAGE"),
                length: 10,
              }}
            /> */}

            <MobileNumber value={PhoneNo} name="PhoneNo" onChange={setPhoneNo} style={{ width: "100%" }} />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("CONTACT_PERSON")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="ContactPerson"
              value={ContactPerson}
              onChange={setcontactperson}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for account number
                type: "text",
                title: t("INVALID_ACCOUNT_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          {/* <LabelFieldPair>
              <CardLabel>{`${t("COMPANY_NAME")}`}</CardLabel>
              <TextInput
                t={t}
                type={"text"}
                isMandatory={false}
                optionKey="i18nKey"
                name="Company"
                value={Company}
                onChange={setCompany}
                style={{ width: "100%" }}
                ValidationRequired={true}
                validation={{
                  isRequired: true,
                  pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for account number
                  type: "text",
                  title: t("INVALID_ACCOUNT_NO_ERROR_MESSAGE"),
                }}
              />
            </LabelFieldPair> */}
          <LabelFieldPair>
            <CardLabel>{`${t("PAN_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="PanNo"
              value={PanNo}
              onChange={setpanno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}", // validation for PAN number
                type: "text",
                title: t("INVALID_PAN_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("GST_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="GstNo"
              value={GstNo}
              onChange={setgstno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$", // validation for GST number
                type: "text",
                title: t("INVALID_GST_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("GST_REGISTERED_STATE/UT")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="GstState"
              value={GstState}
              onChange={setgststate}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for GST state
                type: "text",
                title: t("PT_NAME_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("REGISTRATION_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="RegistrationNo"
              value={RegistrationNo}
              onChange={setregistrationno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for registration number
                type: "text",
                title: t("INVALID_REGISTRATION_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("EPF_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="EpfNo"
              value={EpfNo}
              onChange={setepfno}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[a-zA-Z0-9/-]{1,15}$", // validation for EPF number
                type: "text",
                title: t("INVALID_EPF_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{`${t("ESI_NO")}`}</CardLabel>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="EsiNo"
              value={EsiNo}
              onChange={setesino}
              style={{ width: "100%" }}
              ValidationRequired={true}
              validation={{
                isRequired: true,
                pattern: "^[a-zA-Z0-9/-]{1,20}$", // validation for ESI number
                type: "text",
                title: t("INVALID_ESI_NO_ERROR_MESSAGE"),
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <div>
              {t("VENDOR_TYPE")}
              <div className="tooltip" style={{ width: "12px", height: "5px", marginLeft: "10px", display: "inline-flex", alignItems: "center" }}>
                <span
                  className="tooltiptext"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "small",
                    wordWrap: "break-word",
                    width: "300px",
                    marginLeft: "15px",
                    marginBottom: "-10px",
                  }}
                >
                  {`${t(`AST_CLASSIFICATION_ASSET`)}`}
                </span>
              </div>
            </div>
            <Controller
              control={control}
              name={"VendorType"}
              defaultValue={VendorType}
              rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
              render={(props) => (
                <Dropdown
                  selected={VendorType}
                  select={setVendorType}
                  option={[
                    { i18nKey: "Supplier", code: "SUPPLIER" },
                    { i18nKey: "Contractor", code: "CONTRACTOR" },
                  ]}
                  optionKey="i18nKey"
                  placeholder={"Select"}
                  t={t}
                />
              )}
            />
          </LabelFieldPair>

          <LabelFieldPair>
            <div>
              {t("VENOR_CATEGORY")}
              <div className="tooltip" style={{ width: "12px", height: "5px", marginLeft: "10px", display: "inline-flex", alignItems: "center" }}>
                <span
                  className="tooltiptext"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "small",
                    wordWrap: "break-word",
                    width: "300px",
                    marginLeft: "15px",
                    marginBottom: "-10px",
                  }}
                >
                  {/* {`${t(`AST_SOURCE_OF_FUNDING`)}`} */}
                </span>
              </div>
            </div>
            <Controller
              control={control}
              name={"VendorCategory"}
              defaultValue={VendorCategory}
              rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
              render={(props) => (
                <Dropdown
                  selected={VendorCategory}
                  select={setVendorCategory}
                  //option={sourcefinance}   this loads the vendor category
                  option={[
                    { i18nKey: "Firm", code: "FIRM" },
                    { i18nKey: "Individual", code: "Individual" },
                  ]}
                  optionKey="i18nKey"
                  placeholder={"Select"}
                  t={t}
                />
              )}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <div>
              {t("STATUS")}
              <div
                className="tooltip"
                style={{
                  width: "12px",
                  height: "5px",
                  marginLeft: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <span
                  className="tooltiptext"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "small",
                    wordWrap: "break-word",
                    width: "300px",
                    marginLeft: "15px",
                    marginBottom: "-10px",
                  }}
                >
                  {`${t(`AST_CLASSIFICATION_ASSET`)}`}
                </span>
              </div>
            </div>
            <Controller
              control={control}
              name={"Status"}
              defaultValue={Status}
              rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
              render={(props) => (
                <Dropdown
                  selected={Status}
                  select={setStatus}
                  option={[
                    { i18nKey: "Active", code: "ACTIVE" },
                    { i18nKey: "Inactive", code: "INACTIVE" },
                  ]}
                  optionKey="i18nKey"
                  placeholder={"Select"}
                  t={t}
                />
              )}
            />
          </LabelFieldPair>
        </FormStep>
      </div>
    </React.Fragment>
  );
};

export default AdditionalDetails;
