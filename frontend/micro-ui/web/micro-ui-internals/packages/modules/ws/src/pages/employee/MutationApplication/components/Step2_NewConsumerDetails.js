import React, { useState } from "react";
import { Card, CardHeader, CardLabel, TextInput, Dropdown, MobileNumber, CardLabelError, Button, Toast } from "@djb25/digit-ui-react-components";
import { useForm, Controller, useWatch } from "react-hook-form";

const Step2_NewConsumerDetails = ({ t, onNext, onBack, defaultValues, applicationDetails, existingConnectionHolders }) => {
  const userInfo = Digit.UserService.getUser();
  const isCitizen = userInfo?.info?.type === "CITIZEN";
  
  const initialValues = { ...(defaultValues || {}) };

  // Parse existing full name into three separate fields if not already populated
  if (!initialValues.firstName && initialValues.proposedNewConsumerName) {
    const parts = initialValues.proposedNewConsumerName.trim().split(/\s+/);
    if (parts.length === 1) {
      initialValues.firstName = parts[0];
    } else if (parts.length === 2) {
      initialValues.firstName = parts[0];
      initialValues.lastName = parts[1];
    } else if (parts.length > 2) {
      initialValues.firstName = parts[0];
      initialValues.middleName = parts.slice(1, -1).join(" ");
      initialValues.lastName = parts[parts.length - 1];
    }
  } else if (!initialValues.firstName && isCitizen && userInfo?.info?.name) {
    const parts = userInfo.info.name.trim().split(/\s+/);
    if (parts.length === 1) {
      initialValues.firstName = parts[0];
    } else if (parts.length === 2) {
      initialValues.firstName = parts[0];
      initialValues.lastName = parts[1];
    } else if (parts.length > 2) {
      initialValues.firstName = parts[0];
      initialValues.middleName = parts.slice(1, -1).join(" ");
      initialValues.lastName = parts[parts.length - 1];
    }
  }

  initialValues.firstName = initialValues.firstName || "";
  initialValues.middleName = initialValues.middleName || "";
  initialValues.lastName = initialValues.lastName || "";

  // Do not auto-populate the mobile number in the application
  initialValues.newOwnerMobileNumber = defaultValues?.newOwnerMobileNumber || "";

  if (isCitizen) {
    if (!initialValues.newOwnerEmailAddress && userInfo?.info?.emailId) {
      initialValues.newOwnerEmailAddress = userInfo.info.emailId;
    }
  }

  // Collect all existing connection holder mobile numbers
  const existingHolders = [
    ...(existingConnectionHolders || []),
    ...(applicationDetails?.applicationData?.connectionHolders || []),
    ...(applicationDetails?.WaterConnection?.[0]?.connectionHolders || []),
    ...(applicationDetails?.SewerageConnections?.[0]?.connectionHolders || [])
  ];

  const cachedConn = Digit.SessionStorage.get("MUTATION_APP_ACTIVE_CONN");
  if (cachedConn?.connectionHolders && Array.isArray(cachedConn.connectionHolders)) {
    existingHolders.push(...cachedConn.connectionHolders);
  }

  const existingMobileNumbers = Array.from(
    new Set(
      existingHolders
        .map((h) => (h?.mobileNumber ? String(h.mobileNumber).trim() : null))
        .filter(Boolean)
    )
  );

  const isExistingMobile = (value) => {
    if (!value) return false;
    const cleanVal = String(value).trim();
    return existingMobileNumbers.some((num) => num === cleanVal);
  };

  const { control, handleSubmit, formState: { errors }, trigger, setError, clearErrors, setValue } = useForm({
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const [showToast, setShowToast] = useState(null);
  const [touched, setTouched] = useState({});

  const selectedReason = useWatch({
    control,
    name: "reasonForNameChange"
  });

  const isInheritance =
    selectedReason?.code === "DEVOLUTION_INHERITANCE" ||
    selectedReason === "DEVOLUTION_INHERITANCE" ||
    String(selectedReason?.code || "").toUpperCase().includes("INHERITANCE") ||
    String(selectedReason?.i18nKey || "").toUpperCase().includes("INHERITANCE");

  const genderOptions = [
    { code: "MALE", i18nKey: "Male" },
    { code: "FEMALE", i18nKey: "Female" },
    { code: "OTHER", i18nKey: "Other" }
  ];

  const reasonOptions = [
    { code: "SALE_PURCHASE", i18nKey: "Purchase of Property" },
    { code: "DEVOLUTION_INHERITANCE", i18nKey: "Inheritance" },
    { code: "OTHER", i18nKey: "Devolution/Other" }
  ];

  const reasonDropdownT = (key) => {
    const stack = new Error().stack || "";
    if (/sort/i.test(stack)) {
      if (key === "Devolution/Other" || String(key).includes("Devolution")) return "zzz_Devolution/Other";
      if (key === "Purchase of Property" || String(key).includes("Purchase")) return "aaa_Purchase of Property";
      if (key === "Inheritance" || String(key).includes("Inheritance")) return "bbb_Inheritance";
    }
    return t(key);
  };

  const relationshipOptions = [
    { code: "BLOOD_RELATION", i18nKey: "Blood Relation (Son / Daughter / Spouse)" },
    { code: "LEGAL_HEIR", i18nKey: "Legal heir" },
    { code: "OTHER", i18nKey: "Other" }
  ];

  const isMobileView = window.innerWidth < 768;
  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px", color: "#d32f2f" };
  
  const getFieldBorderStyle = (fieldName) => {
    if (errors?.[fieldName]) return { border: "1px solid #d32f2f" };
    if (touched[fieldName] && !errors?.[fieldName]) return { border: "1px solid #28a745" };
    return {};
  };

  const onSubmit = (data) => {
    const fullName = [data.firstName, data.middleName, data.lastName]
      .map(s => (s || "").trim())
      .filter(Boolean)
      .join(" ");

    if (fullName.length < 3) {
      setError("firstName", { type: "manual", message: "Name must be at least 3 characters in total" });
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(fullName)) {
      setError("firstName", { type: "manual", message: "Name should only contain alphabets, spaces, dots, hyphens" });
      return;
    }

    const enteredMobile = String(data.newOwnerMobileNumber || "").trim();
    if (isExistingMobile(enteredMobile)) {
      setError("newOwnerMobileNumber", {
        type: "manual",
        message: "Entered mobile number cannot be the same as existing connection holder's mobile number. Please enter a different mobile number."
      });
      return;
    }

    onNext({
      ...data,
      firstName: data.firstName ? data.firstName.trim() : "",
      middleName: data.middleName ? data.middleName.trim() : "",
      lastName: data.lastName ? data.lastName.trim() : "",
      proposedNewConsumerName: fullName
    });
  };

  const onError = () => {
    const errorCount = Object.keys(errors).length;
    setShowToast({ key: "error", message: `Please fix ${errorCount} validation error${errorCount > 1 ? "s" : ""} before proceeding.` });
  };

  const mandatoryIndicator = <span style={{ color: "#d32f2f", marginLeft: "2px" }}>*</span>;

  return (
    <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: isMobileView ? "20px" : "22px" }}></span>
        <h2 style={{ fontSize: isMobileView ? "16px" : "18px", fontWeight: "700", margin: 0 }}>2. New Consumer Details.</h2>
      </div>

      {Object.keys(errors).length > 0 && (
        <div style={{ padding: isMobileView ? "10px 12px" : "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: isMobileView ? "12px" : "14px" }}>
            Please fill in all required fields marked with <span style={{ color: "#d32f2f", fontWeight: "bold" }}>*</span> before proceeding.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {/* Responsive grid: 1 col on mobile, 2 col on tablet+, 3 col on large screens */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobileView ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
          gap: isMobileView ? "16px" : "20px",
          padding: "8px 0 16px"
        }}>
          
          <div>
            <CardLabel style={{ fontWeight: "bold" }}>First Name {mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="firstName"
              rules={{ 
                required: "First name is required",
                minLength: { value: 2, message: "First name must be at least 2 characters" },
                pattern: { value: /^[a-zA-Z\s.'-]+$/, message: "Only alphabets, spaces, dots and hyphens allowed" }
              }}
              render={(props) => (
                <TextInput 
                  value={props.value || ""} 
                  onChange={(e) => { props.onChange(e.target.value); clearErrors("firstName"); }}
                  onBlur={() => { props.onBlur(); setTouched(p => ({...p, firstName: true})); trigger("firstName"); }}
                  placeholder="Enter first name" 
                  style={getFieldBorderStyle("firstName")}
                />
              )}
            />
            {errors?.firstName && <CardLabelError style={errorStyle}>{errors?.firstName?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Middle Name <span style={{ color: "#999", fontSize: "12px" }}>(Optional)</span></CardLabel>
            <Controller
              control={control}
              name="middleName"
              rules={{ 
                pattern: { value: /^[a-zA-Z\s.'-]*$/, message: "Only alphabets, spaces, dots and hyphens allowed" }
              }}
              render={(props) => (
                <TextInput 
                  value={props.value || ""} 
                  onChange={(e) => { props.onChange(e.target.value); clearErrors("middleName"); }}
                  onBlur={() => { props.onBlur(); setTouched(p => ({...p, middleName: true})); trigger("middleName"); }}
                  placeholder="Enter middle name" 
                  style={getFieldBorderStyle("middleName")}
                />
              )}
            />
            {errors?.middleName && <CardLabelError style={errorStyle}>{errors?.middleName?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Last Name <span style={{ color: "#999", fontSize: "12px" }}>(Optional)</span></CardLabel>
            <Controller
              control={control}
              name="lastName"
              rules={{ 
                pattern: { value: /^[a-zA-Z\s.'-]*$/, message: "Only alphabets, spaces, dots and hyphens allowed" }
              }}
              render={(props) => (
                <TextInput 
                  value={props.value || ""} 
                  onChange={(e) => { props.onChange(e.target.value); clearErrors("lastName"); }}
                  onBlur={() => { props.onBlur(); setTouched(p => ({...p, lastName: true})); trigger("lastName"); }}
                  placeholder="Enter last name" 
                  style={getFieldBorderStyle("lastName")}
                />
              )}
            />
            {errors?.lastName && <CardLabelError style={errorStyle}>{errors?.lastName?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Gender {mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="gender"
              rules={{ required: "Please select gender" }}
              render={(props) => (
                <Dropdown
                  selected={props.value}
                  option={genderOptions}
                  select={(val) => { props.onChange(val); setTouched(p => ({...p, gender: true})); }}
                  optionKey="i18nKey"
                  t={t}
                  placeholder="Select Gender"
                  disableSort={true}
                />
              )}
            />
            {errors?.gender && <CardLabelError style={errorStyle}>{errors?.gender?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Mobile Number {mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="newOwnerMobileNumber"
              rules={{ 
                required: "Mobile number is required",
                pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit mobile number starting with 6-9" },
                validate: {
                  notExistingHolder: (val) => {
                    if (isExistingMobile(val)) {
                      return "Entered mobile number cannot be the same as existing connection holder's mobile number. Please enter a different mobile number.";
                    }
                    return true;
                  }
                }
              }}
              render={(props) => (
                <MobileNumber
                  value={props.value || ""}
                  onChange={(val) => { props.onChange(val); clearErrors("newOwnerMobileNumber"); }}
                  onBlur={() => { setTouched(p => ({...p, newOwnerMobileNumber: true})); trigger("newOwnerMobileNumber"); }}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              )}
            />
            {errors?.newOwnerMobileNumber && <CardLabelError style={errorStyle}>{errors?.newOwnerMobileNumber?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Email ID <span style={{ color: "#999", fontSize: "12px" }}>(Optional)</span></CardLabel>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="newOwnerEmailAddress"
                  rules={{
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" }
                  }}
                  render={(props) => (
                    <TextInput 
                      value={props.value || ""} 
                      onChange={(e) => { props.onChange(e.target.value); clearErrors("newOwnerEmailAddress"); }} 
                      onBlur={() => { props.onBlur(); setTouched(p => ({...p, newOwnerEmailAddress: true})); trigger("newOwnerEmailAddress"); }}
                      placeholder="example@email.com" 
                      style={{ ...getFieldBorderStyle("newOwnerEmailAddress"), marginBottom: "0px" }}
                    />
                  )}
                />
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); }}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  backgroundColor: "#00497e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {t("Verify")}
              </button>
            </div>
            {errors?.newOwnerEmailAddress && <CardLabelError style={errorStyle}>{errors?.newOwnerEmailAddress?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Reason for Name Change / Mutation {mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="reasonForNameChange"
              rules={{ required: "Please select a reason for mutation" }}
              render={(props) => (
                <Dropdown
                  selected={props.value}
                  option={reasonOptions}
                  select={(val) => { 
                    props.onChange(val); 
                    setTouched(p => ({...p, reasonForNameChange: true})); 
                    const isInherit = val?.code === "DEVOLUTION_INHERITANCE" || val === "DEVOLUTION_INHERITANCE" || String(val?.code || "").toUpperCase().includes("INHERITANCE") || String(val?.i18nKey || "").toUpperCase().includes("INHERITANCE");
                    if (!isInherit) {
                      setValue("relationshipWithExistingConsumer", null);
                    }
                  }}
                  optionKey="i18nKey"
                  t={reasonDropdownT}
                  placeholder="Select reason"
                  disableSort={true}
                />
              )}
            />
            {errors?.reasonForNameChange && <CardLabelError style={errorStyle}>{errors?.reasonForNameChange?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold", color: isInheritance ? "inherit" : "#999" }}>Relationship with Existing Consumer {isInheritance && mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="relationshipWithExistingConsumer"
              rules={{ required: isInheritance ? "Relationship is required when 'Inheritance' is selected" : false }}
              render={(props) => (
                <Dropdown
                  selected={props.value}
                  option={relationshipOptions}
                  select={(val) => { props.onChange(val); setTouched(p => ({...p, relationshipWithExistingConsumer: true})); }}
                  optionKey="i18nKey"
                  t={t}
                  placeholder="Select relationship"
                  disable={!isInheritance}
                  disableSort={true}
                />
              )}
            />
            {!isInheritance && (
              <span style={{ fontSize: "11px", color: "#999", marginTop: "4px", display: "block" }}>
                Enabled only when "Inheritance" is selected above
              </span>
            )}
            {errors?.relationshipWithExistingConsumer && <CardLabelError style={errorStyle}>{errors?.relationshipWithExistingConsumer?.message}</CardLabelError>}
          </div>

        </div>

        {/* Navigation Buttons */}
        <div style={{ display: "flex", flexDirection: isMobileView ? "column" : "row", justifyContent: "space-between", alignItems: isMobileView ? "stretch" : "center", marginTop: "24px", gap: "12px" }}>
          {!isMobileView && (
            <button 
              type="button" 
              onClick={onBack} 
              style={{ padding: "10px 20px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              ← Back
            </button>
          )}
          
          <div style={{ display: "flex", flexDirection: isMobileView ? "column" : "row", alignItems: isMobileView ? "stretch" : "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#999", textAlign: isMobileView ? "center" : undefined }}>Fields marked with <span style={{ color: "#d32f2f" }}>*</span> are mandatory</span>
            <button 
              type="submit" 
              style={{ padding: isMobileView ? "14px 20px" : "10px 20px", backgroundColor: "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", width: isMobileView ? "100%" : "auto", fontSize: isMobileView ? "14px" : undefined }}
            >
              Save & Proceed to Documents →
            </button>
          </div>

          {isMobileView && (
            <button 
              type="button" 
              onClick={onBack} 
              style={{ padding: "12px 20px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", width: "100%", fontSize: "14px" }}
            >
              ← Back
            </button>
          )}
        </div>
      </form>

      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          label={t(showToast.message)}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </Card>
  );
};

export default Step2_NewConsumerDetails;
