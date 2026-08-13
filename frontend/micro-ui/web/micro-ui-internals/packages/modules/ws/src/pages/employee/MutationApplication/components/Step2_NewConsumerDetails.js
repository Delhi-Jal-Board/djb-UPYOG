import React, { useState } from "react";
import { Card, CardHeader, CardLabel, TextInput, Dropdown, MobileNumber, CardLabelError, Button, Toast } from "@djb25/digit-ui-react-components";
import { useForm, Controller, useWatch } from "react-hook-form";

const Step2_NewConsumerDetails = ({ t, onNext, onBack, defaultValues }) => {
  const { control, handleSubmit, formState: { errors }, trigger, setError, clearErrors } = useForm({
    defaultValues: defaultValues || {},
    mode: "onBlur"
  });

  const [showToast, setShowToast] = useState(null);
  const [touched, setTouched] = useState({});

  const selectedReason = useWatch({
    control,
    name: "reasonForNameChange"
  });

  const isOtherReason = selectedReason?.code === "OTHER" || selectedReason === "OTHER";

  const genderOptions = [
    { code: "MALE", i18nKey: "Male" },
    { code: "FEMALE", i18nKey: "Female" },
    { code: "TRANSGENDER", i18nKey: "Transgender" }
  ];

  const reasonOptions = [
    { code: "SALE_PURCHASE", i18nKey: "Purchase of Property" },
    { code: "DEVOLUTION_INHERITANCE", i18nKey: "Devolution/Inheritance" },
    { code: "OTHER", i18nKey: "Other Reason(Gift Deed, Lease Agreement, etc)" }
  ];

  const relationshipOptions = [
    { code: "BLOOD_RELATION", i18nKey: "Blood Relation (Son / Daughter / Spouse)" },
    { code: "LEGAL_HEIR", i18nKey: "Legal heir" },
    { code: "OTHER", i18nKey: "Other" }
  ];

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px", color: "#d32f2f" };
  
  const getFieldBorderStyle = (fieldName) => {
    if (errors?.[fieldName]) return { border: "1px solid #d32f2f" };
    if (touched[fieldName] && !errors?.[fieldName]) return { border: "1px solid #28a745" };
    return {};
  };

  const onSubmit = (data) => {
    // Additional cross-field validation
    if (data.proposedNewConsumerName && data.proposedNewConsumerName.trim().length < 3) {
      setError("proposedNewConsumerName", { type: "manual", message: "Name must be at least 3 characters" });
      return;
    }
    if (data.proposedNewConsumerName && !/^[a-zA-Z\s.'-]+$/.test(data.proposedNewConsumerName.trim())) {
      setError("proposedNewConsumerName", { type: "manual", message: "Name should only contain alphabets, spaces, dots, hyphens" });
      return;
    }
    onNext(data);
  };

  const onError = () => {
    const errorCount = Object.keys(errors).length;
    setShowToast({ key: "error", message: `Please fix ${errorCount} validation error${errorCount > 1 ? "s" : ""} before proceeding.` });
  };

  const mandatoryIndicator = <span style={{ color: "#d32f2f", marginLeft: "2px" }}>*</span>;

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "24px", marginRight: "8px" }}>👤</span>
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>2. New Consumer Details.</h2>
      </div>

      {/* Validation summary banner */}
      {Object.keys(errors).length > 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "8px", fontSize: "18px" }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: "14px" }}>
            Please fill in all required fields marked with <span style={{ color: "#d32f2f", fontWeight: "bold" }}>*</span> before proceeding.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", padding: "16px 0" }}>
          
          {/* Row 1 */}
          <div>
            <CardLabel style={{ fontWeight: "bold" }}>New Consumer Full Name {mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="proposedNewConsumerName"
              rules={{ 
                required: "Consumer name is required",
                minLength: { value: 3, message: "Name must be at least 3 characters" },
                pattern: { value: /^[a-zA-Z\s.'-]+$/, message: "Only alphabets, spaces, dots and hyphens allowed" }
              }}
              render={(props) => (
                <TextInput 
                  value={props.value} 
                  onChange={(e) => { props.onChange(e.target.value); clearErrors("proposedNewConsumerName"); }}
                  onBlur={() => { props.onBlur(); setTouched(p => ({...p, proposedNewConsumerName: true})); trigger("proposedNewConsumerName"); }}
                  placeholder="Enter full name (e.g. Rajesh Kumar)" 
                  style={getFieldBorderStyle("proposedNewConsumerName")}
                />
              )}
            />
            {errors?.proposedNewConsumerName && <CardLabelError style={errorStyle}>{errors?.proposedNewConsumerName?.message}</CardLabelError>}
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
                pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit mobile number starting with 6-9" }
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

          {/* Row 2 */}
          <div>
            <CardLabel style={{ fontWeight: "bold" }}>Email ID <span style={{ color: "#999", fontSize: "12px" }}>(Optional)</span></CardLabel>
            <Controller
              control={control}
              name="newOwnerEmailAddress"
              rules={{
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" }
              }}
              render={(props) => (
                <TextInput 
                  value={props.value} 
                  onChange={(e) => { props.onChange(e.target.value); clearErrors("newOwnerEmailAddress"); }} 
                  onBlur={() => { props.onBlur(); setTouched(p => ({...p, newOwnerEmailAddress: true})); trigger("newOwnerEmailAddress"); }}
                  placeholder="example@email.com" 
                  style={getFieldBorderStyle("newOwnerEmailAddress")}
                />
              )}
            />
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
                  select={(val) => { props.onChange(val); setTouched(p => ({...p, reasonForNameChange: true})); }}
                  optionKey="i18nKey"
                  t={t}
                  placeholder="Select reason"
                />
              )}
            />
            {errors?.reasonForNameChange && <CardLabelError style={errorStyle}>{errors?.reasonForNameChange?.message}</CardLabelError>}
          </div>

          <div>
            <CardLabel style={{ fontWeight: "bold", color: isOtherReason ? "inherit" : "#999" }}>Relationship with Existing Consumer {isOtherReason && mandatoryIndicator}</CardLabel>
            <Controller
              control={control}
              name="relationshipWithExistingConsumer"
              rules={{ required: isOtherReason ? "Relationship is required when 'Other Reason' is selected" : false }}
              render={(props) => (
                <Dropdown
                  selected={props.value}
                  option={relationshipOptions}
                  select={(val) => { props.onChange(val); setTouched(p => ({...p, relationshipWithExistingConsumer: true})); }}
                  optionKey="i18nKey"
                  t={t}
                  placeholder="Select relationship"
                  disable={!isOtherReason}
                />
              )}
            />
            {!isOtherReason && (
              <span style={{ fontSize: "11px", color: "#999", marginTop: "4px", display: "block" }}>
                Enabled only when "Other Reason" is selected above
              </span>
            )}
            {errors?.relationshipWithExistingConsumer && <CardLabelError style={errorStyle}>{errors?.relationshipWithExistingConsumer?.message}</CardLabelError>}
          </div>

        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          <button 
            type="button" 
            onClick={onBack} 
            style={{ padding: "8px 24px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            &#8592; Back
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#999" }}>Fields marked with <span style={{ color: "#d32f2f" }}>*</span> are mandatory</span>
            <button 
              type="submit" 
              style={{ padding: "10px 24px", backgroundColor: "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              Save & Proceed to Documents &#8594;
            </button>
          </div>
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
