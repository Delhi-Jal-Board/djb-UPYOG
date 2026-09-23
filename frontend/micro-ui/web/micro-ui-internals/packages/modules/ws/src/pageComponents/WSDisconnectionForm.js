import {
  CardLabel,
  FormStep,
  Loader,
  RadioButtons,
  TextInput,
  UploadFile,
  LabelFieldPair,
  TextArea,
  SubmitBar,
  CitizenInfoLabel,
  CardHeader,
  Toast,
  DatePicker,
  Header,
  CardSectionHeader,
  StatusTable,
  Row,
  InfoBannerIcon,
  ActionBar,
  Dropdown,
  InfoIcon,
  Card,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import DisconnectTimeline from "../components/DisconnectTimeline";
import { stringReplaceAll, createPayloadOfWSDisconnection, updatePayloadOfWSDisconnection, convertDateToEpoch } from "../utils";
import { addDays, format } from "date-fns";

const WSDisconnectionForm = ({ t, config, onSelect, userType }) => {
  let validation = {};
  const stateCode = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const isMobile = window.Digit.Utils.browser.isMobile();
  const storedApplicationData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
  const location = useLocation();
  const applicationData = {
    ...storedApplicationData,
    applicationData: location.state?.connection || storedApplicationData.applicationData || {},
  };
  const serviceType =
    applicationData?.serviceType ||
    applicationData?.applicationData?.serviceType ||
    applicationData?.applicationData?.additionalDetails?.serviceType?.code ||
    (applicationData?.applicationData?.sewerage ? "SEWERAGE" : "WATER");
  const history = useHistory();
  const match = useRouteMatch();

  const [disconnectionData, setDisconnectionData] = useState({
    type: applicationData.WSDisconnectionForm ? applicationData.WSDisconnectionForm.type : "",
    date: applicationData.WSDisconnectionForm ? applicationData.WSDisconnectionForm.date : "",
    endDate: applicationData.WSDisconnectionForm ? applicationData?.WSDisconnectionForm?.endDate || "" : "",
    reason: applicationData.WSDisconnectionForm ? applicationData.WSDisconnectionForm.reason : "",
    documents: applicationData.WSDisconnectionForm ? applicationData.WSDisconnectionForm.documents : [],
  });
  const [documents, setDocuments] = useState(applicationData.WSDisconnectionForm ? applicationData.WSDisconnectionForm.documents : []);
  const [error, setError] = useState(null);
  const [docError, setDocError] = useState(null); // separate error for document upload widgets
  const [disconnectionTypeList, setDisconnectionTypeList] = useState([]);
  const [disconnectionReasonList, setDisconnectionReasonList] = useState([]);
  const [checkRequiredFields, setCheckRequiredFields] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);

  const { isMdmsLoading, data: mdmsData } = Digit.Hooks.ws.useMDMS(stateCode, "ws-services-masters", ["disconnectionType"]);
  const { loading, data: disconnectionReason } = Digit.Hooks.ws.useMDMS(stateCode, "ws-services-masters", ["DisconnectionReason"]);
  const { isLoading: wsDocsLoading, data: wsDocs } = Digit.Hooks.ws.WSSearchMdmsTypes.useWSServicesMasters(stateCode, "DisconnectionDocuments");
  const { isLoading: slaLoading, data: slaData } = Digit.Hooks.ws.useDisconnectionWorkflow({ tenantId });
  const isReSubmit = window.location.href.includes("resubmit");
  const {
    isLoading: creatingWaterApplicationLoading,
    isError: createWaterApplicationError,
    data: createWaterResponse,
    error: createWaterError,
    mutate: waterMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("WATER");

  const {
    isLoading: updatingWaterApplicationLoading,
    isError: updateWaterApplicationError,
    data: updateWaterResponse,
    error: updateWaterError,
    mutate: waterUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("WATER");

  const {
    isLoading: creatingSewerageApplicationLoading,
    isError: createSewerageApplicationError,
    data: createSewerageResponse,
    error: createSewerageError,
    mutate: sewerageMutation,
  } = Digit.Hooks.ws.useWaterCreateAPI("SEWERAGE");

  const {
    isLoading: updatingSewerageApplicationLoading,
    isError: updateSewerageApplicationError,
    data: updateSewerageResponse,
    error: updateSewerageError,
    mutate: sewerageUpdateMutation,
  } = Digit.Hooks.ws.useWSApplicationActions("SEWERAGE");

  const closeToastOfError = () => {
    setError(null);
  };

  useEffect(() => {
    const oldData = { ...disconnectionData };
    oldData["documents"] = documents;
    setDisconnectionData(oldData);
  }, [documents]);

  useEffect(() => {
    const disconnectionTypes = mdmsData?.["ws-services-masters"]?.disconnectionType || [];
    disconnectionTypes?.forEach((data) => (data.i18nKey = `WS_DISCONNECTIONTYPE_${stringReplaceAll(data?.code?.toUpperCase(), " ", "_")}`));

    setDisconnectionTypeList(disconnectionTypes);
  }, [mdmsData]);
  useEffect(() => {
    const disconnectionReasons = disconnectionReason?.["ws-services-masters"]?.DisconnectionReason || [];
    disconnectionReasons?.forEach((data) => (data.i18nKey = `WS_DISCONNECTIONTYPE_${stringReplaceAll(data?.code?.toUpperCase(), " ", "_")}`));
    setDisconnectionReasonList(disconnectionReasons);
  }, [disconnectionReason]);

  useEffect(() => {
    Digit.SessionStorage.set("WS_DISCONNECTION", { ...applicationData, WSDisconnectionForm: disconnectionData });
  }, [disconnectionData]);
  const handleSubmit = () => onSelect(config.key, { WSDisConnectionForm: disconnectionData });

  const handleEmployeeSubmit = () => {
    onSelect(config.key, { WSDisConnectionForm: { ...disconnectionData, documents: documents } });
  };

  const onSkip = () => onSelect();

  const filedChange = (val) => {
    const oldData = { ...disconnectionData };
    oldData[val.code] = val;
    setDisconnectionData(oldData);
  };

  const onSubmit = async (data) => {
    const appDate = new Date();
    const slaDays = slaData?.slaDays || 0;
    const proposedDate = format(addDays(appDate, slaDays), "yyyy-MM-dd").toString();

    // Guard: date must be selected and must be a valid yyyy-MM-dd string
    const selectedDateEpoch = data?.date ? convertDateToEpoch(data.date) : null;
    const proposedDateEpoch = convertDateToEpoch(proposedDate);
    const selectedDateIsInvalid = !data?.date || typeof selectedDateEpoch !== "number" || selectedDateEpoch < proposedDateEpoch;

    if (selectedDateIsInvalid) {
      setError({ key: "error", message: "PROPOSED_DISCONNECTION_INVALID_DATE" });
      setTimeout(() => {
        setError(null);
      }, 3000);
    } else if (data?.type?.value?.code === "Temporary" && convertDateToEpoch(data?.endDate) <= convertDateToEpoch(data?.date)) {
      setError({ key: "error", message: "PROPOSED_DISCONNECTION_INVALID_END_DATE" });
      setTimeout(() => {
        setError(null);
      }, 3000);
    } else if (
      wsDocsLoading ||
      documents.length < 2 ||
      disconnectionData?.reason?.value === "" ||
      disconnectionData?.reason === "" ||
      disconnectionData?.date === "" ||
      disconnectionData?.type === ""
    ) {
      setError({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      setTimeout(() => {
        setError(null);
      }, 3000);
    } else {
      const payload = await createPayloadOfWSDisconnection(data, applicationData, serviceType);
      if (payload?.WaterConnection?.water) {
        if (waterMutation) {
          setIsEnableLoader(true);
          await waterMutation(payload, {
            onError: (error, variables) => {
              setIsEnableLoader(false);
              setError({ key: "error", message: error?.response?.data?.Errors?.[0].message ? error?.response?.data?.Errors?.[0].message : error });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data, variables) => {
              let response = await updatePayloadOfWSDisconnection(data?.WaterConnection?.[0], "WATER");
              let waterConnectionUpdate = { WaterConnection: response };
              waterConnectionUpdate = { ...waterConnectionUpdate, disconnectRequest: true };
              await waterUpdateMutation(waterConnectionUpdate, {
                onError: (error, variables) => {
                  setIsEnableLoader(false);
                  setError({
                    key: "error",
                    message: error?.response?.data?.Errors?.[0].message ? error?.response?.data?.Errors?.[0].message : error,
                  });
                  setTimeout(closeToastOfError, 5000);
                },
                onSuccess: (data, variables) => {
                  Digit.SessionStorage.set("WS_DISCONNECTION", { ...applicationData, DisconnectionResponse: data?.WaterConnection?.[0] });
                  history.push(`/digit-ui/employee/ws/ws-disconnection-response?applicationNumber=${data?.WaterConnection?.[0]?.applicationNo}`);
                },
              });
            },
          });
        }
      } else if (payload?.SewerageConnection?.sewerage) {
        if (sewerageMutation) {
          setIsEnableLoader(true);
          await sewerageMutation(payload, {
            onError: (error, variables) => {
              setIsEnableLoader(false);
              setError({ key: "error", message: error?.response?.data?.Errors?.[0].message ? error?.response?.data?.Errors?.[0].message : error });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data, variables) => {
              let response = await updatePayloadOfWSDisconnection(data?.SewerageConnections?.[0], "SEWERAGE");
              let sewerageConnectionUpdate = { SewerageConnection: response };
              sewerageConnectionUpdate = { ...sewerageConnectionUpdate, disconnectRequest: true };
              await sewerageUpdateMutation(sewerageConnectionUpdate, {
                onError: (error, variables) => {
                  setIsEnableLoader(false);
                  setError({
                    key: "error",
                    message: error?.response?.data?.Errors?.[0].message ? error?.response?.data?.Errors?.[0].message : error,
                  });
                  setTimeout(closeToastOfError, 5000);
                },
                onSuccess: (data, variables) => {
                  Digit.SessionStorage.set("WS_DISCONNECTION", { ...applicationData, DisconnectionResponse: data?.SewerageConnections?.[0] });
                  history.push(`/digit-ui/employee/ws/ws-disconnection-response?applicationNumber=${data?.SewerageConnections?.[0]?.applicationNo}`);
                },
              });
            },
          });
        }
      }
    }
  };

  if (isMdmsLoading || wsDocsLoading || isEnableLoader || slaLoading) return <Loader />;

  if (userType === "citizen") {
    return (
      <React.Fragment>
        <CitizenInfoLabel textStyle={{ color: "#0B0C0C" }} text={t(`WS_DISONNECT_APPL_INFO`)} info={t("CS_COMMON_INFO")} />
        <div className="employee-form-section-wrapper">
          {userType === "citizen" && <DisconnectTimeline currentStep={1} />}
          <FormStep
            config={config}
            onSelect={handleSubmit}
            onSkip={onSkip}
            t={t}
            title={isReSubmit ? t("RESUBMIT_DISCONNECTION_FORM") : t("WS_APPLICATION_FORM")}
          >
            {/* <CardHeader>{isReSubmit ? t("RESUBMIT_DISCONNECTION_FORM") : t("WS_APPLICATION_FORM")}</CardHeader> */}
            <StatusTable>
              <Row
                key={t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}
                label={`${t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}`}
                text={applicationData?.connectionNo}
                className="border-none"
              />
            </StatusTable>

            <LabelFieldPair>
              <CardLabel className="card-label-smaller">{t("WS_DISCONNECTION_TYPE") + "*"}</CardLabel>
              <div className="field">
                <RadioButtons
                  t={t}
                  options={disconnectionTypeList}
                  optionsKey="i18nKey"
                  value={disconnectionData.type?.value?.code}
                  selectedOption={disconnectionData.type?.value}
                  isMandatory={false}
                  onSelect={(val) => filedChange({ code: "type", value: val })}
                  labelKey="WS_DISCONNECTION_TYPE"
                  inputStyle={isMobile ? { marginLeft: "unset" } : {}}
                />
              </div>
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {t("WS_DISCONNECTION_PROPOSED_DATE") + "*"}
                <div className={`tooltip`} style={{ position: "absolute" }}>
                  <InfoIcon />
                  <span
                    className="tooltiptext"
                    style={{
                      whiteSpace: Digit.Utils.browser.isMobile() ? "unset" : "nowrap",
                      fontSize: "medium",
                      width: Digit.Utils.browser.isMobile() ? "150px" : "unset",
                    }}
                  >
                    {t("SHOULD_BE_DATE") + " " + slaData?.slaDays + " " + t("DAYS_OF_APPLICATION_DATE")}
                  </span>
                </div>
              </CardLabel>
              <div className="field">
                <DatePicker
                  date={disconnectionData?.date}
                  onChange={(date) => {
                    setDisconnectionData({ ...disconnectionData, date: date });
                  }}
                ></DatePicker>
              </div>
            </LabelFieldPair>
            {disconnectionData.type?.value?.code === "Temporary" ? (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">
                  {t("WS_DISCONNECTION_PROPOSED_END_DATE") + "*"}
                  <div className={`tooltip`} style={{ position: "absolute" }}>
                    <InfoIcon />
                    <span
                      className="tooltiptext"
                      style={{
                        whiteSpace: Digit.Utils.browser.isMobile() ? "unset" : "nowrap",
                        fontSize: "medium",
                        width: Digit.Utils.browser.isMobile() ? "150px" : "unset",
                      }}
                    >
                      {t("SHOULD_BE_DATE") + " " + " " + t("DAYS_OF_PROPOSED_DATE")}
                    </span>
                  </div>
                </CardLabel>
                <div className="field">
                  <DatePicker
                    date={disconnectionData?.endDate}
                    onChange={(date) => {
                      setDisconnectionData({ ...disconnectionData, endDate: date });
                    }}
                  ></DatePicker>
                </div>
              </LabelFieldPair>
            ) : (
              ""
            )}
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">{t("WS_DISCONNECTION_REASON") + "*"}</CardLabel>
              <div className="field">
                <Dropdown
                  option={disconnectionReasonList}
                  isMandatory={false}
                  optionKey="i18nKey"
                  t={t}
                  name={"reason"}
                  value={disconnectionData.reason?.value?.code}
                  selectedOption={disconnectionData.reason?.value}
                  labelKey="WS_DISCONNECTION_REASON"
                  select={(e) => filedChange({ code: "reason", value: e })}
                />
              </div>
            </LabelFieldPair>
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", gridColumn: "1 / -1" }}>
              <SubmitBar
                label={t("CS_COMMON_NEXT")}
                onSubmit={() => {
                  const appDate = new Date();
                  const proposedDate = format(addDays(appDate, slaData?.slaDays), "yyyy-MM-dd").toString();
                  if (convertDateToEpoch(disconnectionData?.date) < convertDateToEpoch(proposedDate)) {
                    setError({ key: "error", message: "PROPOSED_DISCONNECTION_INVALID_DATE" });
                    setTimeout(() => {
                      setError(false);
                    }, 3000);
                  } else if (
                    disconnectionData?.type?.value?.code == "Temporary" &&
                    parseInt(convertDateToEpoch(disconnectionData.endDate)) <= parseInt(convertDateToEpoch(disconnectionData?.date))
                  ) {
                    console.log("Temporary connection");
                    setError({ key: "error", message: "PROPOSED_DISCONNECTION_INVALID_END_DATE" });
                    setTimeout(() => {
                      setError(false);
                    }, 3000);
                  } else {
                    history.push(match.path.replace("application-form", "documents-upload"));
                  }
                }}
                disabled={
                  disconnectionData?.reason?.value === "" ||
                  disconnectionData?.reason === "" ||
                  disconnectionData?.date === "" ||
                  disconnectionData?.type === ""
                    ? true
                    : false
                }
              />
            </div>
            {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} onClose={() => setError(null)} />}
          </FormStep>
        </div>
      </React.Fragment>
    );
  }

  const isMobileForm = window.Digit.Utils.browser.isMobile();
  
  const sectionStyle = {
    padding: isMobileForm ? "12px" : "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    borderLeft: "4px solid #00497e",
    marginBottom: "24px",
    width: "100%",
  };

  const headerFlexStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  };

  const numberBadgeStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#00497e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
    flexShrink: 0,
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: isMobileForm ? "column" : "row",
    alignItems: isMobileForm ? "flex-start" : "center",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
    marginBottom: "16px",
  };

  const labelStyle = {
    fontWeight: "700",
    color: "#0B0C0C",
    fontSize: "16px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    width: isMobileForm ? "100%" : "30%",
  };

  const inputWrapperStyle = {
    width: isMobileForm ? "100%" : "65%",
  };

  return (
    <div style={{ width: "100%" }}>
      <Card style={{ padding: isMobileForm ? "12px" : "24px" }}>
        {/* 1. Application Details */}
        <div style={sectionStyle}>
          <div style={headerFlexStyle}>
            <div style={numberBadgeStyle}>1</div>
            <CardSectionHeader style={{ margin: 0 }}>{t("CS_TITLE_APPLICATION_DETAILS")}</CardSectionHeader>
          </div>
          <StatusTable>
            <Row
              key={t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}
              label={t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}
              text={applicationData?.applicationData?.connectionNo}
              className="border-none"
            />
          </StatusTable>
        </div>

        {/* 2. Disconnection Type */}
        <div style={sectionStyle}>
          <div style={headerFlexStyle}>
            <div style={numberBadgeStyle}>2</div>
            <CardSectionHeader style={{ margin: 0 }}>
              {t("WS_DISCONNECTION_TYPE")} *
              <div className="tooltip" style={{ marginLeft: "8px", position: "relative", top: "2px", display: "inline-block" }}>
                <InfoIcon />
                <span className="tooltiptext" style={{ whiteSpace: isMobileForm ? "unset" : "nowrap", fontSize: "medium", width: isMobileForm ? "250px" : "400px" }}>
                  {t("WS_DISCONNECTION_PERMANENT_TOOLTIP")}
                  <br /><br />
                  {t("WS_DISCONNECTION_TEMPORARY_TOOLTIP")}
                </span>
              </div>
            </CardSectionHeader>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", paddingLeft: isMobileForm ? "0" : "42px" }}>
            <RadioButtons
              t={t}
              options={disconnectionTypeList}
              optionsKey="i18nKey"
              value={disconnectionData.type?.value?.code}
              selectedOption={disconnectionData.type?.value}
              isMandatory={false}
              onSelect={(val) => filedChange({ code: "type", value: val })}
              labelKey="WS_DISCONNECTION_TYPE"
              style={{ display: "flex", flexWrap: "wrap", gap: "1rem", margin: 0 }}
              inputStyle={isMobileForm ? { marginLeft: "unset" } : {}}
            />
          </div>
        </div>

        {/* 3. Proposed Date */}
        <div style={sectionStyle}>
          <div style={headerFlexStyle}>
            <div style={numberBadgeStyle}>3</div>
            <CardSectionHeader style={{ margin: 0 }}>{t("WS_DISCONNECTION_PROPOSED_DATE")}</CardSectionHeader>
          </div>
          <div style={{ paddingLeft: isMobileForm ? "0" : "42px" }}>
            <div style={fieldStyle}>
              <h4 style={labelStyle}>
                {t("WS_DISCONNECTION_PROPOSED_DATE")} *
                <div className="tooltip" style={{ marginLeft: "8px", position: "relative", top: "2px" }}>
                  <InfoIcon />
                  <span className="tooltiptext" style={{ whiteSpace: isMobileForm ? "unset" : "nowrap", fontSize: "medium", width: isMobileForm ? "200px" : "300px" }}>
                    {t("SHOULD_BE_DATE") + " " + slaData?.slaDays + " " + t("DAYS_OF_APPLICATION_DATE")}
                  </span>
                </div>
              </h4>
              <div style={inputWrapperStyle}>
                <DatePicker date={disconnectionData?.date} onChange={(date) => setDisconnectionData({ ...disconnectionData, date: date })} />
              </div>
            </div>

            {disconnectionData.type?.value?.code === "Temporary" && (
              <div style={fieldStyle}>
                <h4 style={labelStyle}>
                  {t("WS_DISCONNECTION_PROPOSED_END_DATE")} *
                  <div className="tooltip" style={{ marginLeft: "8px", position: "relative", top: "2px" }}>
                    <InfoIcon />
                    <span className="tooltiptext" style={{ whiteSpace: isMobileForm ? "unset" : "nowrap", fontSize: "medium", width: isMobileForm ? "200px" : "300px" }}>
                      {t("SHOULD_BE_DATE") + " " + t("DAYS_OF_APPLICATION_END_DATE")}
                    </span>
                  </div>
                </h4>
                <div style={inputWrapperStyle}>
                  <DatePicker date={disconnectionData?.endDate} onChange={(date) => setDisconnectionData({ ...disconnectionData, endDate: date })} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Reason */}
        <div style={sectionStyle}>
          <div style={headerFlexStyle}>
            <div style={numberBadgeStyle}>4</div>
            <CardSectionHeader style={{ margin: 0 }}>{t("WS_DISCONNECTION_REASON")} *</CardSectionHeader>
          </div>
          <div style={{ paddingLeft: isMobileForm ? "0" : "42px" }}>
            <div style={fieldStyle}>
              <h4 style={labelStyle}>{t("WS_DISCONNECTION_REASON")} *</h4>
              <div style={inputWrapperStyle}>
                <Dropdown
                  option={disconnectionReasonList}
                  isMandatory={false}
                  optionKey="i18nKey"
                  t={t}
                  name="reason"
                  value={disconnectionData.reason?.value?.code}
                  selectedOption={disconnectionData.reason?.value}
                  select={(e) => filedChange({ code: "reason", value: e })}
                  labelKey="WS_DISCONNECTION_REASON"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Documents */}
        <div style={sectionStyle}>
          <div style={headerFlexStyle}>
            <div style={numberBadgeStyle}>5</div>
            <CardSectionHeader style={{ margin: 0 }}>{t("WS_DISCONNECTION_DOCUMENTS")} *</CardSectionHeader>
          </div>
          <div style={{ paddingLeft: isMobileForm ? "0" : "42px" }}>
            {wsDocs?.DisconnectionDocuments?.map((document, index) => (
              <SelectDocument
                key={index}
                document={document}
                t={t}
                error={docError}
                setError={setDocError}
                setDocuments={setDocuments}
                documents={documents}
                setCheckRequiredFields={setCheckRequiredFields}
                isMobileForm={isMobileForm}
              />
            ))}
          </div>
        </div>

        {docError && (
          <Toast error={docError?.key === "error"} label={t(docError?.message)} warning={docError?.warning} onClose={() => setDocError(null)} />
        )}
        {error && (
          <Toast error={error?.key === "error"} label={t(error?.message)} warning={error?.warning} onClose={() => setError(null)} />
        )}

        {/* Actions */}
        <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
          <SubmitBar
            label={t("ACTION_TEST_SUBMIT")}
            onSubmit={() => onSubmit(disconnectionData)}
            disabled={
              wsDocsLoading ||
              documents.length < 2 ||
              !disconnectionData?.reason?.value?.code || 
              !disconnectionData?.date || 
              !disconnectionData?.type?.value?.code ||
              (disconnectionData?.type?.value?.code === "Temporary" && !disconnectionData?.endDate)
            }
            style={{ margin: "10px 10px 0px 0px" }}
          />
        </ActionBar>
      </Card>
    </div>
  );
};


function SelectDocument({ t, key, document: doc, setDocuments, error, setError, documents, setCheckRequiredFields, isMobileForm }) {
  const filteredDocument = documents?.filter((item) => item?.documentType?.includes(doc?.code))[0];
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [selectedDocument, setSelectedDocument] = useState(
    filteredDocument
      ? { ...filteredDocument, active: true, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType }
      : doc?.dropdownData?.length === 1
      ? doc?.dropdownData[0]
      : {}
  );
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(() => filteredDocument?.fileStoreId || null);

  const handleSelectDocument = (value) => setSelectedDocument(value);

  function selectfile(e) {
    setFile(e.target.files[0]);
  }

  useEffect(() => {
    if (selectedDocument?.code) {
      setDocuments((prev) => {
        const filteredDocumentsByDocumentType = prev?.filter((item) => item?.documentType !== selectedDocument?.code);
        if (uploadedFile?.length === 0 || uploadedFile === null) return filteredDocumentsByDocumentType;
        const filteredDocumentsByFileStoreId = filteredDocumentsByDocumentType?.filter((item) => item?.fileStoreId !== uploadedFile);
        return [
          ...filteredDocumentsByFileStoreId,
          {
            documentType: selectedDocument?.code,
            fileStoreId: uploadedFile,
            documentUid: uploadedFile,
            fileName: file?.name || "",
          },
        ];
      });
    }
  }, [uploadedFile, selectedDocument]);

  useEffect(() => {
    (async () => {
      if (file) {
        setError(null);
        if (file.size >= 5242880) {
          setError({ key: "error", message: "CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED" });
        } else {
          try {
            setUploadedFile(null);
            const response = await Digit.UploadServices.Filestorage("WS", file, tenantId?.split(".")[0]);
            if (response?.data?.files?.length > 0) {
              setUploadedFile(response?.data?.files[0]?.fileStoreId);
            } else {
              setError({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
            }
          } catch (err) {
            setError({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
          }
        }
      }
    })();
  }, [file]);

  const fieldStyle = {
    display: "flex",
    flexDirection: isMobileForm ? "column" : "row",
    alignItems: isMobileForm ? "flex-start" : "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
    marginBottom: "16px",
  };

  const labelStyle = {
    fontWeight: "700",
    color: "#0B0C0C",
    fontSize: "16px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    width: isMobileForm ? "100%" : "30%",
  };

  const inputWrapperStyle = {
    width: isMobileForm ? "100%" : "65%",
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={fieldStyle}>
        <h4 style={labelStyle}>{t(doc?.i18nKey)} *</h4>
        <div style={inputWrapperStyle}>
          <div style={{ marginBottom: "8px" }}>
            <Dropdown
              t={t}
              isMandatory={false}
              option={doc?.dropdownData}
              selected={selectedDocument}
              optionKey="i18nKey"
              select={handleSelectDocument}
            />
          </div>
          <UploadFile
            id={`noc-doc-1-${key}`}
            extraStyleName={"propertyCreate"}
            accept="image/*, .pdf, .png, .jpeg, .jpg"
            onUpload={selectfile}
            onDelete={() => {
              setUploadedFile(null);
              setCheckRequiredFields(true);
            }}
            message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`ES_NO_FILE_SELECTED_LABEL`)}
          />
        </div>
      </div>
    </div>
  );
}

export default WSDisconnectionForm;
