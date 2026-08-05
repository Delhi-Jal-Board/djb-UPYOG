import React, { useState, useEffect } from "react";
import { CardLabel, CardLabelError, Dropdown, LabelFieldPair, MobileNumber, TextInput, UploadFile } from "@djb25/digit-ui-react-components";
import { useForm, Controller } from "react-hook-form";
import _ from "lodash";

const WSMutationApplicantDetails = ({ t, config, onSelect, formData, formState, setError, clearErrors, setValue }) => {
  const { control, watch, setValue: setLocalValue, trigger, formState: localFormState } = useForm({
    defaultValues: formData?.[config.key] || {}
  });

  const formValue = watch();
  const { errors } = localFormState;

  const reasonOptions = [
    { code: "SALE_PURCHASE", i18nKey: "Sale / Purchase of Property" },
    { code: "DEVOLUTION_INHERITANCE", i18nKey: "Devolution/Inheritance" },
    { code: "OTHER", i18nKey: "Other Reason(Gift, Lease, etc)" }
  ];

  const relationshipOptions = [
    { code: "MOTHER", i18nKey: "Mother" },
    { code: "FATHER", i18nKey: "Father" },
    { code: "SIBLING", i18nKey: "Sibling" },
    { code: "SPOUSE", i18nKey: "Spouse" },
    { code: "SON", i18nKey: "Son" },
    { code: "DAUGHTER", i18nKey: "Daughter" },
    { code: "LEGAL_HEIR", i18nKey: "Legal heir" },
    { code: "OTHER", i18nKey: "Other" }
  ];

  const [uploadedFile, setUploadedFile] = useState(formData?.[config.key]?.saleDeedDocumentId || null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const currentState = { ...formValue, saleDeedDocumentId: uploadedFile };
    if (!_.isEqual(formData?.[config.key], currentState)) {
      onSelect(config.key, currentState);
    }
  }, [formValue, uploadedFile]);

  useEffect(() => {
    (async () => {
      if (file) {
        try {
          setIsUploading(true);
          const response = await window.Digit.UploadServices.Filestorage("WS", file, window.Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            setUploadedFile(response.data.files[0].fileStoreId);
            clearErrors && clearErrors(config.key);
          }
        } catch (err) {
          console.error("File upload error", err);
        } finally {
          setIsUploading(false);
        }
      }
    })();
  }, [file]);

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px" };

  return (
    <div className="formcomposer-section-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", display: "grid" }}>
      {/* Left Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>PROPOSED NEW CONSUMER NAME*</CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="proposedNewConsumerName"
                rules={{ required: "Required field" }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                    }}
                    placeholder="Enter full legal name of new owner"
                    onBlur={props.onBlur}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {errors?.proposedNewConsumerName && <CardLabelError style={errorStyle}>{errors?.proposedNewConsumerName?.message}</CardLabelError>}
        </div>

        <div>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>NEW OWNER MOBILE NUMBER*</CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="newOwnerMobileNumber"
                rules={{
                  required: "Required field",
                  pattern: { value: /^[6-9]\d{9}$/, message: "Invalid mobile number" }
                }}
                render={(props) => (
                  <MobileNumber
                    value={props.value || ""}
                    onChange={(val) => {
                      props.onChange(val);
                    }}
                    placeholder="Enter mobile number"
                    onBlur={props.onBlur}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {errors?.newOwnerMobileNumber && <CardLabelError style={errorStyle}>{errors?.newOwnerMobileNumber?.message}</CardLabelError>}
        </div>

        <div>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>NEW OWNER EMAIL ADDRESS</CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="newOwnerEmailAddress"
                rules={{
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" }
                }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                    }}
                    placeholder="Enter email address"
                    onBlur={props.onBlur}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {errors?.newOwnerEmailAddress && <CardLabelError style={errorStyle}>{errors?.newOwnerEmailAddress?.message}</CardLabelError>}
        </div>

        <div>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>RELATIONSHIP WITH EXISTING CONSUMER*</CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="relationshipWithExistingConsumer"
                rules={{ required: "Required field" }}
                render={(props) => (
                  <Dropdown
                    selected={props.value}
                    option={relationshipOptions}
                    select={(e) => {
                      props.onChange(e);
                    }}
                    optionKey="i18nKey"
                    t={t}
                    placeholder="Select relationship"
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {errors?.relationshipWithExistingConsumer && <CardLabelError style={errorStyle}>{errors?.relationshipWithExistingConsumer?.message}</CardLabelError>}
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>REASON FOR NAME CHANGE*</CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="reasonForNameChange"
                rules={{ required: "Required field" }}
                render={(props) => (
                  <Dropdown
                    selected={props.value}
                    option={reasonOptions}
                    select={(e) => {
                      props.onChange(e);
                    }}
                    optionKey="i18nKey"
                    t={t}
                    placeholder="Select reason"
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {errors?.reasonForNameChange && <CardLabelError style={errorStyle}>{errors?.reasonForNameChange?.message}</CardLabelError>}
        </div>

        <div style={{ marginTop: "10px", padding: "20px", border: "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#fafafa" }}>
          <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <CardLabel style={{ margin: 0, fontWeight: "bold" }}>UPLOAD REGISTERED SALE DEED*</CardLabel>
            <p style={{ color: "#666", fontSize: "12px", marginBottom: "15px", marginTop: "5px" }}>Submit a clear scan of the stamp duty Registered Sale Deed.</p>
            <div className="field" style={{ width: "100%" }}>
              <UploadFile
                id="sale-deed-upload"
                onUpload={(e) => {
                  setFile(e.target.files[0]);
                }}
                onDelete={() => {
                  setUploadedFile(null);
                  setFile(null);
                }}
                message={uploadedFile ? `1 File Uploaded` : `Click to upload document`}
                accept="image/*, .pdf, .png, .jpeg, .jpg"
                uploadedFiles={uploadedFile && !file ? [["Document", { fileStoreId: uploadedFile }]] : undefined}
                removeTargetedFile={() => {
                  setUploadedFile(null);
                  setFile(null);
                }}
              />
            </div>
          </LabelFieldPair>
          {isUploading && <span style={{ color: "#00497e", fontWeight: "bold", fontSize: "12px" }}>Uploading...</span>}
        </div>
      </div>
    </div>
  );
};

export default WSMutationApplicantDetails;
