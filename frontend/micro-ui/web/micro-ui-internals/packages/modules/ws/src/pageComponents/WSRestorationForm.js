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
  CardHeader ,
  Toast,
  DatePicker,
  Header,
  CardSectionHeader,
  StatusTable, 
  Row,
  InfoBannerIcon,
  ActionBar,
  Dropdown,
  InfoIcon
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useState, Fragment } from "react";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import DisconnectTimeline from "../components/DisconnectTimeline";
import { stringReplaceAll, createPayloadOfWSDisconnection, updatePayloadOfWSDisconnection, convertDateToEpoch ,updatePayloadOfWSRestoration,createPayloadOfWSReconnection} from "../utils";
import { addDays, format } from "date-fns";

const WSRestorationForm = ({ t, config, onSelect, userType, flow }) => {
  let validation = {};
  const stateCode = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const isMobile = window.Digit.Utils.browser.isMobile();
  const sessionData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
  const [applicationData, setApplicationData] = useState(sessionData);
  const history = useHistory();
  const match = useRouteMatch();
  const location = useLocation();
  const routeConnection = location.state?.connection || {};
  const queryParams = new URLSearchParams(location.search);
  const connectionNumberFromQuery = queryParams.get("connectionNumber") || queryParams.get("applicationNumber") || "";
  const [searchConnNo, setSearchConnNo] = useState(connectionNumberFromQuery || applicationData?.applicationData?.connectionNo || applicationData?.connectionNo || routeConnection?.connectionNo || "");
  const [isSearching, setIsSearching] = useState(false);
  
  const [disconnectionData, setDisconnectionData] = useState({
      type: applicationData?.WSDisconnectionForm ? applicationData?.WSDisconnectionForm.type : "",
      date: applicationData?.WSDisconnectionForm ? applicationData?.WSDisconnectionForm.date : "",
      reason: applicationData?.WSDisconnectionForm ?  applicationData?.WSDisconnectionForm.reason : "",
      documents: applicationData?.WSDisconnectionForm ? applicationData?.WSDisconnectionForm.documents : []
  });
  const [documents, setDocuments] = useState(applicationData?.WSDisconnectionForm ? applicationData?.WSDisconnectionForm.documents : []);
  const [error, setError] = useState(null);
  const [disconnectionTypeList, setDisconnectionTypeList] = useState([]);
  const [checkRequiredFields, setCheckRequiredFields] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [ownershipDocument, setOwnershipDocument] = useState(null);
  const [isAltered, setIsAltered] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [dwellingUnits, setDwellingUnits] = useState("");
  const [extendedArea, setExtendedArea] = useState("");
  const [showDemandClearance, setShowDemandClearance] = useState(false);
  const [estimateData, setEstimateData] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  const { isMdmsLoading, data: mdmsData } = Digit.Hooks.ws.useMDMS(stateCode, "ws-services-masters", ["disconnectionType"]);
  const { isLoading: wsDocsLoading, data: wsDocs } =  Digit.Hooks.ws.WSSearchMdmsTypes.useWSServicesMasters(stateCode, "DisconnectionDocuments");
  const {isLoading: slaLoading, data: slaData } = Digit.Hooks.ws.useDisconnectionWorkflow({tenantId});
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


  const closeToastOfError = () => { setError(null); };

  const fetchConnection = async (connNo) => {
    const trimmed = (connNo || "").trim();
    if (!trimmed) {
      setError({ warning: true, message: "PLEASE_ENTER_CONNECTION_NUMBER" });
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsSearching(true);
    try {
      const searchParams = { connectionNumber: trimmed, searchType: "CONNECTION", isConnectionSearch: true };
      let detectedService = "WATER";
      const getConnections = (response, key) => response?.[key] || response?.data?.[key] || response?.response?.data?.[key] || [];
      let wsRes = await Digit.WSService.search({ tenantId, filters: searchParams, businessService: "WS" }).catch(() => null);
      let conn = getConnections(wsRes, "WaterConnection")[0];
      if (!conn) {
        let swRes = await Digit.WSService.search({ tenantId, filters: searchParams, businessService: "SW" }).catch(() => null);
        conn = getConnections(swRes, "SewerageConnections")[0];
        if (conn) detectedService = "SEWERAGE";
      }
      if (!conn?.connectionNo && !conn?.applicationNo) {
        setIsSearching(false);
        setError({ key: "error", message: "CONNECTION_NOT_FOUND" });
        setTimeout(() => setError(null), 4000);
        return;
      }
      conn.serviceType = detectedService;
      let propertyDetails = null;
      if (conn?.propertyId) {
        const ptRes = await Digit.PTService.search({
          tenantId: conn?.tenantId || tenantId,
          filters: { propertyIds: conn.propertyId },
          auth: true,
        }).catch(() => null);
        propertyDetails = ptRes?.Properties?.[0];
      }
      const fullData = {
        applicationData: conn,
        propertyDetails,
        connectionNo: conn.connectionNo,
        serviceType: detectedService,
      };
      setApplicationData(fullData);
      Digit.SessionStorage.set("WS_DISCONNECTION", fullData);
      setIsSearching(false);
    } catch (e) {
      setIsSearching(false);
      setError({ key: "error", message: e?.message || "Failed to search connection" });
      setTimeout(() => setError(null), 4000);
    }
  };

  useEffect(() => {
    if (!applicationData?.applicationData?.connectionNo && connectionNumberFromQuery) {
      fetchConnection(connectionNumberFromQuery);
    }
  }, [connectionNumberFromQuery]);

  useEffect(() => {
    const oldData = {...disconnectionData};
    oldData['documents'] = documents;
    setDisconnectionData(oldData);
  }, [documents]);
  

  useEffect(() => {
    const disconnectionTypes = mdmsData?.["ws-services-masters"]?.disconnectionType || []; 
    disconnectionTypes?.forEach(data => data.i18nKey = `WS_DISCONNECTIONTYPE_${stringReplaceAll(data?.code?.toUpperCase(), " ", "_")}`);
console.log("disconnectionTypes",disconnectionTypes)
    setDisconnectionTypeList(disconnectionTypes);
  }, [mdmsData]);

  useEffect(() => {
    Digit.SessionStorage.set("WS_DISCONNECTION", {...applicationData, WSDisconnectionForm: disconnectionData});
  }, [disconnectionData]);
  const handleSubmit = () => onSelect(config.key, { WSDisConnectionForm: disconnectionData });

  const handleEmployeeSubmit = () => {
    onSelect(config.key, { WSDisConnectionForm: {...disconnectionData, documents:documents} });
  };


  const onSkip = () => onSelect();

  const filedChange = (val) => {
    const oldData = {...disconnectionData};
    oldData[val.code]=val;
    setDisconnectionData(oldData);
  }

  const onSubmit = async (data) => {
    const slaDays = (slaData?.slaDays && !isNaN(slaData?.slaDays)) ? Number(slaData?.slaDays) : 0;
    const appDate = new Date();
    const proposedDate = format(addDays(appDate, slaDays), 'yyyy-MM-dd').toString();

    const reasonText = (typeof disconnectionData?.reason === "string"
      ? disconnectionData?.reason
      : disconnectionData?.reason?.value || disconnectionData?.reason?.code || "").trim();

    if (slaDays > 0 && data?.date && convertDateToEpoch(data?.date) < convertDateToEpoch(proposedDate)) {
      setError({ key: "error", message: "PROPOSED_RESTORATION_INVALID_DATE" });
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!reasonText || !disconnectionData?.date) {
      setError({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      setTimeout(() => setError(null), 3000);
      return;
    }

    const currentAppData = applicationData?.applicationData?.connectionNo ? applicationData : Digit.SessionStorage.get("WS_DISCONNECTION");
    if (!currentAppData?.applicationData?.connectionNo) {
      setError({ key: "error", message: "PLEASE_SEARCH_AND_SELECT_CONNECTION" });
      setTimeout(() => setError(null), 3000);
      return;
    }

    const payload = await createPayloadOfWSReconnection(data, currentAppData, currentAppData?.applicationData?.serviceType);
    if (payload?.WaterConnection?.water) {
      payload.WaterConnection.isdisconnection = false;
      payload.WaterConnection.isDisconnectionTemporary = true;
      payload.WaterConnection["reconnectionReason"] = reasonText;
      payload.WaterConnection.disconnectionReason = "";
      payload["reconnectRequest"] = true;
      payload.disconnectRequest = false;
      if (waterMutation) {
        setIsEnableLoader(true);
        await waterMutation(payload, {
          onError: (error, variables) => {
            setIsEnableLoader(false);
            setError({ key: "error", message: error?.response?.data?.Errors?.[0]?.message ? error?.response?.data?.Errors?.[0]?.message : error?.message || "Failed to initiate reconnection" });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: async (createdData, variables) => {
            let response = await updatePayloadOfWSRestoration(createdData?.WaterConnection?.[0], "WATER");
            let waterConnectionUpdate = { WaterConnection: response, disconnectRequest: false, reconnectRequest: true };
            await waterUpdateMutation(waterConnectionUpdate, {
              onError: (error, variables) => {
                setIsEnableLoader(false);
                setError({ key: "error", message: error?.response?.data?.Errors?.[0]?.message ? error?.response?.data?.Errors?.[0]?.message : error?.message || "Failed to submit reconnection" });
                setTimeout(closeToastOfError, 5000);
              },
              onSuccess: (updatedData, variables) => {
                setIsEnableLoader(false);
                Digit.SessionStorage.set("WS_DISCONNECTION", { ...currentAppData, DisconnectionResponse: updatedData?.WaterConnection?.[0] });
                history.push(`/digit-ui/employee/ws/ws-restoration-response?applicationNumber=${updatedData?.WaterConnection?.[0]?.applicationNo}`);
              },
            });
          },
        });
      }
    } else if (payload?.SewerageConnection?.sewerage) {
      payload.SewerageConnection.isdisconnection = false;
      payload.SewerageConnection.isDisconnectionTemporary = true;
      payload.SewerageConnection["reconnectionReason"] = reasonText;
      payload.SewerageConnection.disconnectionReason = "";
      payload["reconnectRequest"] = true;
      payload.disconnectRequest = false;
      if (sewerageMutation) {
        setIsEnableLoader(true);
        await sewerageMutation(payload, {
          onError: (error, variables) => {
            setIsEnableLoader(false);
            setError({ key: "error", message: error?.response?.data?.Errors?.[0]?.message ? error?.response?.data?.Errors?.[0]?.message : error?.message || "Failed to initiate reconnection" });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: async (createdData, variables) => {
            let response = await updatePayloadOfWSRestoration(createdData?.SewerageConnections?.[0], "SEWERAGE");
            let sewerageConnectionUpdate = { SewerageConnection: response, disconnectRequest: false, reconnectRequest: true };
            await sewerageUpdateMutation(sewerageConnectionUpdate, {
              onError: (error, variables) => {
                setIsEnableLoader(false);
                setError({ key: "error", message: error?.response?.data?.Errors?.[0]?.message ? error?.response?.data?.Errors?.[0]?.message : error?.message || "Failed to submit reconnection" });
                setTimeout(closeToastOfError, 5000);
              },
              onSuccess: (updatedData, variables) => {
                setIsEnableLoader(false);
                Digit.SessionStorage.set("WS_DISCONNECTION", { ...currentAppData, DisconnectionResponse: updatedData?.SewerageConnections?.[0] });
                history.push(`/digit-ui/employee/ws/ws-restoration-response?applicationNumber=${updatedData?.SewerageConnections?.[0]?.applicationNo}`);
              },
            });
          },
        });
      }
    }
  };

  if (isMdmsLoading || wsDocsLoading || isEnableLoader || slaLoading) return <Loader />


if (userType === "citizen" && flow !== "reconnection") {
    return (
      <React.Fragment>
        <CitizenInfoLabel style={{ margin: "0px", marginBottom: "1.5rem" }} textStyle={{ color: "#0B0C0C" }} text={t(`WS_DISONNECT_APPL_INFO`)} info={t("CS_COMMON_INFO")} />
        <div className="employee-form-section-wrapper">
        {userType === "citizen" && (<DisconnectTimeline currentStep={1} flow="RESTORATION" />)}
        <FormStep
          config={config}
          onSelect={handleSubmit}
          onSkip={onSkip}
          t={t}
        >
          
          <div style={{padding:"0px 10px 10px 10px"}}>
          <CardHeader>{ isReSubmit ? t("RESUBMIT_RESTORATION_FORM") : t("WS_APPLICATION_FORM")}</CardHeader>
          <StatusTable>
            <Row key={t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")} label={`${t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}`} text={applicationData?.connectionNo} className="border-none" />
          </StatusTable> 
     
            <CardLabel className="card-label-smaller" style={{display: "inline"}}>
            {t("WS_RESTORATION_PROPOSED_DATE") + "*"}
          </CardLabel>
          <div className="field">
          <DatePicker
            date={disconnectionData?.date}
            onChange={(date) => {
              setDisconnectionData({ ...disconnectionData, date: date });
            }}
          ></DatePicker>
          </div>

            <LabelFieldPair>
              <CardLabel className="card-label-smaller" style={{display: "inline"}}>{t("WS_DISCONNECTION_REASON")+ "*"}</CardLabel>              
                <TextArea
                  isMandatory={false}
                  optionKey="i18nKey"
                  t={t}
                  name={"reason"}
                  value={disconnectionData.reason?.value || (typeof disconnectionData.reason === "string" ? disconnectionData.reason : "")}
                  onChange={(e) => filedChange({code:"reason" , value:e.target.value})}
                />              
            </LabelFieldPair>
            <SubmitBar
              label={t("CS_COMMON_NEXT")}
              onSubmit={() => {
                const appDate= new Date();
                const proposedDate= format(addDays(appDate, slaData?.slaDays), 'yyyy-MM-dd').toString();
                history.push(match.path.replace("restoration-application", "check"));
                
              }}
              disabled={
                disconnectionData?.reason?.value === "" || disconnectionData?.reason === "" || disconnectionData?.date === ""
                ? true 
                : false}
             />
             {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} onClose={() => setError(null)} />}
          </div>
        </FormStep>
      </div>
      </React.Fragment>
    );
  }
if (flow === "reconnection") {
    const connection = applicationData?.applicationData?.connectionNo || applicationData?.applicationData?.applicationNo
      ? applicationData.applicationData
      : routeConnection || {};
    const holder = connection?.connectionHolders?.[0] || {};
    const address = connection?.property?.address || connection?.address || {};
    const addressText = [address?.houseNo || address?.doorNo, address?.buildingName, address?.street, address?.locality?.name, address?.city].filter(Boolean).join(", ") || "NA";
    const originalArea = Number(connection?.property?.landArea || connection?.property?.plotArea || 150) || 150;
    const areaAdded = Number(extendedArea) || 0;
    const totalArea = originalArea + areaAdded;
    const estimateRows = estimateData?.Calculation?.[0]?.taxHeadEstimates || [];
    const estimateTotal = estimateRows.reduce((total, item) => total + Number(item?.estimateAmount ?? item?.amount ?? 0), 0);
    const formatEstimateLabel = (code) => String(code || "Demand charge").replace(/^WS_/, "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const handleOwnershipUpload = async (event) => {
      const file = event?.target?.files?.[0];
      if (!file) return;
      if (file.size > 5242880 || (file.type && file.type !== "application/pdf")) {
        setError({ key: "error", message: "Only PDF files up to 5MB are allowed" });
        return;
      }
      try {
        const response = await Digit.UploadServices.Filestorage("WS", file, tenantId?.split(".")[0]);
        const fileStoreId = response?.data?.files?.[0]?.fileStoreId;
        if (!fileStoreId) throw new Error("File upload failed");
        setOwnershipDocument({ fileStoreId, fileName: file.name });
      } catch (uploadError) {
        setError({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
      }
    };
    const handleProceedToDemand = async () => {
      setEstimateLoading(true);
      try {
        const serviceType = String(connection?.serviceType || connection?.service || "WATER").toUpperCase() === "SEWERAGE" ? "SEWERAGE" : "WATER";
        const connectionKey = serviceType === "WATER" ? "waterConnection" : "sewerageConnection";
        const estimateConnection = {
          ...connection,
          applicationType: serviceType === "WATER" ? "WATER_RECONNECTION" : "SEWERAGE_RECONNECTION",
          dateEffectiveFrom: Date.now(),
          isdisconnection: false,
          isDisconnectionTemporary: true,
          reconnectionReason: "RECONNECTION",
          disconnectionReason: "",
          water: serviceType === "WATER",
          sewerage: serviceType === "SEWERAGE",
          service: serviceType === "WATER" ? "Water" : "Sewerage",
        };
        const estimatePayload = {
          CalculationCriteria: [{
            applicationNo: estimateConnection?.applicationNo,
            tenantId: estimateConnection?.tenantId || tenantId,
            [connectionKey]: estimateConnection,
          }],
          isconnectionCalculation: false,
        };
        const estimateResponse = await Digit.WSService.wsCalculationEstimate(estimatePayload, serviceType === "WATER" ? "WS" : "SW");
        const taxHeadEstimates = estimateResponse?.Calculation?.[0]?.taxHeadEstimates || [];
        const reconnectionFee = taxHeadEstimates.find((item) => {
          const code = String(item?.taxHeadCode || "").toUpperCase();
          return code === "WS_RECONNECTION_FEE" || code === "SW_RECONNECTION_FEE" || code === "WS_REOPENING_FEE" || code === "SW_REOPENING_FEE";
        });
        if (!reconnectionFee) throw new Error("Reconnection fee was not returned by the estimate service");
        setEstimateData({ Calculation: [{ ...estimateResponse.Calculation[0], taxHeadEstimates: [reconnectionFee], totalAmount: Number(reconnectionFee?.estimateAmount ?? reconnectionFee?.amount ?? 0) }] });
        setShowDemandClearance(true);
        Digit.SessionStorage.set("WS_DISCONNECTION", { ...applicationData, reconnectionValidation: { isAltered, isModified, dwellingUnits, extendedArea, ownershipProofFileStoreId: ownershipDocument?.fileStoreId } });
      } catch (estimateError) {
        setError({ key: "error", message: estimateError?.response?.data?.Errors?.[0]?.message || "Unable to calculate reconnection demand" });
      } finally {
        setEstimateLoading(false);
      }
    };
    const executeMutation = (mutation, payload) => new Promise((resolve, reject) => mutation(payload, { onSuccess: resolve, onError: reject }));
    const handleSubmitReconnection = async () => {
      setIsEnableLoader(true);
      try {
        const storedApplicationData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
        const hasConnection = (data) => Boolean(data?.applicationData?.connectionNo || data?.applicationData?.applicationNo);
        const latestApplicationData = hasConnection(storedApplicationData)
          ? storedApplicationData
          : hasConnection(applicationData)
            ? applicationData
            : { ...applicationData, applicationData: routeConnection };
        const submittedConnection = hasConnection(latestApplicationData)
          ? latestApplicationData.applicationData
          : routeConnection?.connectionNo || routeConnection?.applicationNo
            ? routeConnection
            : connection;
        Digit.SessionStorage.set("WS_DISCONNECTION", { ...latestApplicationData, applicationData: submittedConnection });
        if (!submittedConnection?.connectionNo && !submittedConnection?.applicationNo) {
          throw new Error("Connection details were not loaded from search. Please search the connection again.");
        }
        const connectionApplicationType = String(submittedConnection?.applicationType || "").toUpperCase();
        const serviceType = latestApplicationData?.serviceType || submittedConnection?.serviceType ||
          (submittedConnection?.sewerage === true || submittedConnection?.service === "Sewerage" || connectionApplicationType.includes("SEWERAGE")
            ? "SEWERAGE"
            : "WATER");
        const user = Digit.UserService.getUser()?.info?.type;
        const connectionKey = serviceType === "WATER" ? "WaterConnection" : "SewerageConnection";
        const responseKey = serviceType === "WATER" ? "WaterConnection" : "SewerageConnections";

        // Preserve documents returned by the search API so the create request keeps the complete connection data.
        const existingDocuments = Array.isArray(submittedConnection?.documents) ? submittedConnection.documents : [];
        const ownershipProof = ownershipDocument
          ? [{ fileStoreId: ownershipDocument.fileStoreId, documentUid: ownershipDocument.fileStoreId, documentType: "PROPERTY_OWNERSHIP_PROOF" }]
          : [];
        const docs = [...existingDocuments, ...ownershipProof];
        const reconnectionValidation = latestApplicationData?.reconnectionValidation || {};

        // Build payload directly from `connection` (raw Search API data) so no fields are lost
        const createPayload = {
          [connectionKey]: {
            ...submittedConnection,
            property: submittedConnection?.property || latestApplicationData?.propertyDetails,
            propertyId: submittedConnection?.propertyId || latestApplicationData?.propertyDetails?.propertyId,
            applicationType: serviceType === "WATER" ? "WATER_RECONNECTION" : "SEWERAGE_RECONNECTION",
            dateEffectiveFrom: Date.now(),
            isdisconnection: false,
            isDisconnectionTemporary: true,
            reconnectionReason: "RECONNECTION",
            disconnectionReason: "",
            documents: docs,
            water: serviceType === "WATER",
            sewerage: serviceType === "SEWERAGE",
            service: serviceType === "WATER" ? "Water" : "Sewerage",
            additionalDetails: {
              ...submittedConnection?.additionalDetails,
              ...reconnectionValidation,
              isAltered: reconnectionValidation.isAltered ?? isAltered,
              isModified: reconnectionValidation.isModified ?? isModified,
              dwellingUnits: reconnectionValidation.dwellingUnits ?? dwellingUnits,
              extendedArea: reconnectionValidation.extendedArea ?? extendedArea,
              ownershipProofFileStoreId: reconnectionValidation.ownershipProofFileStoreId || ownershipDocument?.fileStoreId,
            },
            processInstance: {
              ...connection?.processInstance,
              action: "INITIATE",
              businessService: serviceType === "WATER" ? "WSReconnection" : "SWReconnection",
            },
            channel: user?.toUpperCase() === "CITIZEN" ? "CITIZEN" : "CFC_COUNTER",
          },
          reconnectRequest: true,
          disconnectRequest: false,
        };

        const createMutation = serviceType === "WATER" ? waterMutation : sewerageMutation;
        const updateMutation = serviceType === "WATER" ? waterUpdateMutation : sewerageUpdateMutation;
        const createResponse = await executeMutation(createMutation, createPayload);
        const createdConnection = createResponse?.[responseKey]?.[0];
        const updateConnection = await updatePayloadOfWSRestoration(createdConnection, serviceType);
        const updatePayload = { [connectionKey]: updateConnection, reconnectRequest: true, disconnectRequest: false };
        const updateResponse = await executeMutation(updateMutation, updatePayload);
        const finalConnection = updateResponse?.[responseKey]?.[0] || createdConnection;
        Digit.SessionStorage.set("WS_DISCONNECTION", { ...applicationData, DisconnectionResponse: finalConnection });
        const responsePath = userType === "citizen" ? "/digit-ui/citizen/ws/restoration-acknowledge" : "/digit-ui/employee/ws/ws-restoration-response?applicationNumber=" + finalConnection?.applicationNo;
        history.push(responsePath);
      } catch (submitError) {
        setIsEnableLoader(false);
        setError({ key: "error", message: submitError?.response?.data?.Errors?.[0]?.message || submitError?.message || "Unable to submit reconnection application" });
      }
    };
    if (showDemandClearance) {
      return (<div style={{ padding: "24px", color: "#172b4d" }}>
        <Header styles={{ fontSize: "24px", margin: "0 0 24px" }}>▭ Government Reconnection Demand Clearance</Header>
        <div style={{ maxWidth: "620px", background: "#f7f9fc", border: "1px solid #dce5f0", borderRadius: "20px", padding: "26px" }}>
          <h3 style={{ color: "#8498b5", fontSize: "13px", letterSpacing: "1px", marginTop: 0 }}>DEMAND FEE ASSESSMENT</h3>
          {estimateLoading ? <Loader /> : estimateRows.length > 0 ? estimateRows.map((item, index) => <div key={item?.taxHeadCode || index} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e5ebf3" }}><span style={{ color: "#597294" }}>{formatEstimateLabel(item?.taxHeadCode)}</span><strong>₹{Number(item?.estimateAmount ?? item?.amount ?? 0).toLocaleString("en-IN")}</strong></div>) : <div style={{ color: "#597294", padding: "14px 0" }}>No demand components were returned by the estimate service.</div>}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px", marginTop: "14px", border: "1px solid #cfe0ff", borderRadius: "12px", background: "#eef5ff", fontSize: "18px", fontWeight: 700 }}><span>Total Demand Clearance Fee:</span><span style={{ color: "#224bd6" }}>₹{estimateTotal.toLocaleString("en-IN")}</span></div>
          <p style={{ color: "#8498b5", lineHeight: 1.6, marginBottom: 0 }}>All reconnection demands are auto-calculated by the Delhi Water Board central server in accordance with NCT tariff bylaws section 12.1.</p>
        </div>
        <ActionBar style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}><SubmitBar label="← Back" onSubmit={() => setShowDemandClearance(false)} /><SubmitBar label={isEnableLoader ? "Submitting..." : "Submit Reconnection"} onSubmit={handleSubmitReconnection} disabled={isEnableLoader} /></ActionBar>
        {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} onClose={() => setError(null)} />}
      </div>);
    }
    const choiceStyle = (selected) => ({ flex: 1, padding: "12px 16px", borderRadius: "14px", border: selected ? "1px solid #4b35f5" : "1px solid #d5deea", background: selected ? "#4b35f5" : "#fff", color: selected ? "#fff" : "#172b4d", fontWeight: 700, cursor: "pointer" });
    return (<div style={{ padding: "24px", color: "#172b4d" }}>
      <Header styles={{ fontSize: "24px", margin: "0 0 24px" }}>Ownership &amp; Disconnection Validation</Header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", marginBottom: "28px" }}>
        {/* <div style={{ background: "#f7f9fc", border: "1px solid #dce5f0", borderRadius: "20px", padding: "26px" }}><h3 style={{ color: "#8498b5", fontSize: "13px", letterSpacing: "1px", marginTop: 0 }}>INACTIVE CONNECTION RECORD FOUND</h3>{[["Original Applicant", holder?.name || "NA"],["Registered Phone", holder?.mobileNumber ? "******" + holder.mobileNumber.slice(-4) : "NA"],["Meter Serial No", connection?.meterId || connection?.additionalDetails?.meterId || "NA"],["Disconnection Logged on", connection?.disconnectionDate || connection?.dateEffectiveFrom || "NA"],["Outstanding Arrears", "₹0 (Fully Settled)"],["Address", addressText]].map(([label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "18px", padding: "12px 0", borderBottom: "1px solid #e5ebf3" }}><span style={{ color: "#8097b8" }}>{label}:</span><strong style={{ textAlign: "right" }}>{value}</strong></div>)}<div style={{ border: "1px solid #3548f5", borderRadius: "16px", padding: "14px", marginTop: "18px", color: "#2336c8", fontSize: "13px", lineHeight: 1.8 }}><strong>VALIDATION AUDIT CHECKED:</strong><br />✓ State check: <b>DISCONNECTED</b> (Sanctioned for Reactivation).<br />✓ Bill status check: <b>CLEAR</b> (No outstanding billing dues found).</div></div> */}
        <div style={{ border: "1px solid #dce5f0", borderRadius: "20px", padding: "26px" }}><h3 style={{ color: "#8498b5", fontSize: "13px", letterSpacing: "1px", marginTop: 0 }}>RECONNECTION AUTHORIZATION DOCUMENTS</h3><label style={{ fontWeight: 700, display: "block", margin: "28px 0 8px" }}>Upload Property Ownership Proof (Registry / Sale Deed)</label><UploadFile id="reconnection-ownership-proof" accept=".pdf" buttonType="button" onUpload={handleOwnershipUpload} onDelete={() => setOwnershipDocument(null)} message={ownershipDocument?.fileName || "Drag & drop your property deed PDF here or click to browse from files (Max 5MB)"} /></div>
      </div>
      <div style={{ background: "#f7f9fc", border: "1px solid #dce5f0", borderRadius: "20px", padding: "26px" }}><h3 style={{ margin: 0, fontSize: "16px" }}>ⓘ PROPERTY ALTERATION &amp; EXTENSION ASSESSMENT</h3><p style={{ color: "#597294", marginTop: "6px" }}>Under Delhi Jal Board bylaws, please declare if there are any physical structural alterations, area extensions, dwelling unit additions, or changes to the original building plan/usage made during disconnection.</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}><div><label style={{ display: "block", fontWeight: 700, margin: "12px 0" }}>1. HAS THE PROPERTY BEEN PHYSICALLY ALTERED OR EXTENDED?</label><div style={{ display: "flex", gap: "10px" }}><button type="button" style={choiceStyle(isAltered)} onClick={() => setIsAltered(true)}>Yes, Altered/Extended</button><button type="button" style={choiceStyle(!isAltered)} onClick={() => setIsAltered(false)}>No, Unchanged</button></div>{isAltered && <input style={{ width: "100%", padding: "12px", marginTop: "14px", border: "1px solid #d5deea", borderRadius: "14px", boxSizing: "border-box" }} placeholder="New dwelling units added (e.g. 1)" value={dwellingUnits} onChange={(e) => setDwellingUnits(e.target.value)} />}</div><div><label style={{ display: "block", fontWeight: 700, margin: "12px 0" }}>2. ANY MODIFICATION TO ORIGINAL BUILDING PLAN OR USAGE?</label><div style={{ display: "flex", gap: "10px" }}><button type="button" style={choiceStyle(isModified)} onClick={() => setIsModified(true)}>Yes, Modified Plan/Usage</button><button type="button" style={choiceStyle(!isModified)} onClick={() => setIsModified(false)}>No, Unmodified</button></div>{isModified && <input style={{ width: "100%", padding: "12px", marginTop: "14px", border: "1px solid #d5deea", borderRadius: "14px", boxSizing: "border-box" }} placeholder="Area extended (Sq. M.) (e.g. 60)" value={extendedArea} onChange={(e) => setExtendedArea(e.target.value)} />}</div></div><div style={{ background: "#f0f2ff", border: "1px solid #d7dcff", borderRadius: "16px", padding: "18px", marginTop: "20px" }}><strong style={{ color: "#2d31c9" }}>ASSESSMENT BREAKDOWN:</strong><div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0", gap: "18px" }}><span>Original Plot Size: <b>{originalArea} Sq. M.</b></span><span>Extended Area: <b>+{areaAdded} Sq. M.</b></span><span>New Total Area: <b>{totalArea} Sq. M.</b></span></div><div style={{ borderTop: "1px solid #dce1ff", paddingTop: "12px", color: "#597294", lineHeight: 1.8 }}>✓ Total Area ({totalArea} Sq. M.) is under 200 Sq. M.: Exempt from IFC.<br />✓ No additional dwelling units registered.<br />✓ No building plan or usage modifications declared.</div></div></div>
      <ActionBar style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", borderTop: "1px solid #e5ebf3", paddingTop: "20px" }}><SubmitBar label="← Back" onSubmit={() => history.goBack()} /><SubmitBar label="Proceed to Demand Note →" onSubmit={handleProceedToDemand} disabled={estimateLoading} /></ActionBar>
      {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} onClose={() => setError(null)} />}
    </div>);
  }
  console.log("applicationData",applicationData)
  return (
    <div style={{ margin: "16px" }}>
    <Header styles={{fontSize: "32px", marginLeft: "18px"}}>{t("WS_WATER_AND_SEWERAGE_RESTORATION")}</Header>
    <FormStep
          config={config}
          onSelect={handleEmployeeSubmit}
          onSkip={onSkip}
          t={t}       
    >
      <div style={{padding:"10px",paddingTop:"20px",marginTop:"10px"}}>
      {!applicationData?.applicationData?.connectionNo ? (
        <div style={{ marginBottom: "20px" }}>
          <CardSectionHeader>{t("WS_SEARCH_CONNECTION_LABEL") || "Search Disconnected Connection"}</CardSectionHeader>
          <LabelFieldPair>
            <CardLabel style={{ fontWeight: "700", marginTop: "10px" }}>{t("WS_CONSUMER_CODE_LABEL") || "Connection / K-Number"}</CardLabel>
            <div className="field" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <TextInput
                t={t}
                type={"text"}
                value={searchConnNo}
                onChange={(e) => setSearchConnNo(e.target.value)}
                placeholder={t("ENTER_CONNECTION_NUMBER") || "Enter Connection Number / K-Number"}
              />
              <SubmitBar
                label={isSearching ? t("SEARCHING") || "Searching..." : t("ES_COMMON_SEARCH") || "Search"}
                onSubmit={() => fetchConnection(searchConnNo)}
                disabled={isSearching || !searchConnNo?.trim()}
              />
            </div>
          </LabelFieldPair>
        </div>
      ) : (
        <React.Fragment>
          <CardSectionHeader>{t("CS_TITLE_APPLICATION_DETAILS")}</CardSectionHeader>
          <StatusTable>
            <Row key={t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")} label={`${t("PDF_STATIC_LABEL_CONSUMER_NUMBER_LABEL")}`} text={applicationData?.applicationData?.connectionNo} className="border-none" />
            <Row key={t("PDF_STATIC_LABEL_TYPE_OF_SERVICE_LABEL")} label={`${t("PDF_STATIC_LABEL_TYPE_OF_SERVICE_LABEL")}`} text={applicationData?.applicationData?.serviceType} className="border-none" />
            <Row key={t("PDF_STATIC_LABEL_PROPERTY_ID_LABEL")} label={`${t("PDF_STATIC_LABEL_PROPERTY_ID_LABEL")}`} text={applicationData?.applicationData?.propertyId} className="border-none" />
          </StatusTable>
        </React.Fragment>
      )}        
     
          
          <LabelFieldPair>
          <CardLabel style={{ marginTop: "-5px", fontWeight: "700", display: "inline" }} className="card-label-smaller">
            {t("WS_RESTORATION_PROPOSED_DATE")+ "*"} 
            <div className={`tooltip`} style={{position: "absolute", marginLeft: "4px"}}>
            <InfoIcon/>
            <span className="tooltiptext" style={{
                    whiteSpace: Digit.Utils.browser.isMobile() ? "unset" : "nowrap",
                    fontSize: "medium",
                  }}>
                    {t("SHOULD_BE_DATE")+ " " + (slaData?.slaDays || 0) + " " + t("DAYS_OF_APPLICATION_DATE")}
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
          <LabelFieldPair>
              <CardLabel style={{ marginTop: "-5px", fontWeight: "700", display: "inline" }} className="card-label-smaller">{t("WS_RESTORATION_REASON") + "*"}</CardLabel>              
              <div className="field">
                <TextArea
                  isMandatory={false}
                  optionKey="i18nKey"
                  t={t}
                  name={"reason"}
                  value={disconnectionData.reason?.value || (typeof disconnectionData.reason === "string" ? disconnectionData.reason : "")}
                  onChange={(e) => filedChange({code:"reason" , value:e.target.value})}
                />  
                </div>            
          </LabelFieldPair>
                  {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} warning={error?.warning} onClose={() => setError(null)} />}
      </div>


    </FormStep>
    <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
          {
            <SubmitBar label={t("ACTION_TEST_SUBMIT")} onSubmit={() => onSubmit(disconnectionData)} style={{ margin: "10px 10px 0px 0px" }} disabled={!applicationData?.applicationData?.connectionNo || isSearching} />}
     </ActionBar>
    </div>
  );

};


export default WSRestorationForm;