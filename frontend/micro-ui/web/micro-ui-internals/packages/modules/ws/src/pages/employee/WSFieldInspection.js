import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardSubHeader,
  CardLabel,
  CardText,
  CardSectionSubText,
  Header,
  LabelFieldPair,
  TextInput,
  TextArea,
  Dropdown,
  CheckBox,
  UploadFile,
  SubmitBar,
  ActionBar,
  Toast,
  Banner,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const initialChecklist = {
  inspectionDate: new Date().toISOString().split("T")[0],
  inspectionTime: "11:30 AM",
  siteInspectorName: "",
  inspectorEmployeeId: "",
  isLicensedPlumberPresent: { code: "YES", name: "YES" },
  isConsumerRepresentativePresent: { code: "YES", name: "YES" },
  consumerIdentityVerified: false,
  knoDetailsMatched: false,
  propertyAddressVerified: false,
  localityColonyVerified: false,
  propertyUseVerified: false,
  plotDetailsVerified: false,
  existingWaterConnectionChecked: false,
  proposedConnectionPointIdentified: false,
  waterMainAndRoadAccessFeasible: false,
  meterLocationIdentifiedAndAccessible: false,
  licensedPlumberVerified: false,
  siteConditionsMatchedApplication: false,
  siteAccessibility: { code: "ACCESSIBLE", name: "ACCESSIBLE" },
  proposedMeterLocation: { code: "INSIDE_PREMISES", name: "INSIDE_PREMISES" },
  siteFeasibilityObserved: { code: "FEASIBLE", name: "FEASIBLE" },
  siteInspectorRemarks: "",
};

const initialDeclaration = {
  agreed: false,
  inspectorName: "",
  submissionDate: new Date().toISOString().split("T")[0],
};

const emptyConnectionDetails = {
  kno: "",
  applicationNo: "",
  connectionNo: "",
  tenantId: "",
  status: "",
  applicationType: "",
  knoIssuanceDate: "",
  knoIssuanceDateEpoch: null,
  zone: "",
  zroOffice: "",
  connectionType: "",
  connectionCategory: "",
  applicationStatus: "",
  assignedLicensedPlumber: "",
  propertyAddress: "",
  city: "",
  pincode: "",
  locality: "",
  subLocality: "",
  colonyCategory: "",
  propertyUse: "",
  ownershipType: "",
  houseNo: "",
  consumerName: "",
  mobileNumber: "",
  emailId: "",
  applicantType: "",
  identityType: "",
  alternateContactNumber: "",
  plotNumber: "",
  plotArea: "",
  plotAreaUnit: "",
  numberOfFloors: "",
  coveredArea: "",
  roadWidth: "",
  propertyType: "",
  buildingStatus: "",
  existingWaterConnection: "",
};

const yesNoOptions = [
  { code: "YES", name: "YES" },
  { code: "NO", name: "NO" },
];

const siteAccessibilityOptions = [
  { code: "ACCESSIBLE", name: "ACCESSIBLE" },
  { code: "INACCESSIBLE", name: "INACCESSIBLE" },
  { code: "PARTIALLY_ACCESSIBLE", name: "PARTIALLY_ACCESSIBLE" },
];

const proposedMeterLocationOptions = [
  { code: "INSIDE_PREMISES", name: "INSIDE_PREMISES" },
  { code: "OUTSIDE_PREMISES", name: "OUTSIDE_PREMISES" },
  { code: "BOUNDARY_WALL", name: "BOUNDARY_WALL" },
  { code: "METER_CHAMBER", name: "METER_CHAMBER" },
];

const siteFeasibilityOptions = [
  { code: "FEASIBLE", name: "FEASIBLE" },
  { code: "NOT_FEASIBLE", name: "NOT_FEASIBLE" },
  { code: "FEASIBLE_WITH_CONDITIONS", name: "FEASIBLE_WITH_CONDITIONS" },
];

const WSFieldInspection = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const printRef = useRef();

  const loggedInUser = Digit.UserService.getUser()?.info;
  const currentTenantId = Digit.ULBService.getCurrentTenantId() || "dl";

  const [searchKno, setSearchKno] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Read-only connection details populated dynamically from Search API
  const [connectionDetails, setConnectionDetails] = useState({
    ...emptyConnectionDetails,
    tenantId: currentTenantId,
  });

  // Editable checklist state
  const [checklist, setChecklist] = useState({
    ...initialChecklist,
    siteInspectorName: loggedInUser?.name || "",
    inspectorEmployeeId: loggedInUser?.id ? String(loggedInUser.id) : (loggedInUser?.code || ""),
  });

  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [declaration, setDeclaration] = useState({
    ...initialDeclaration,
    inspectorName: loggedInUser?.name || "",
  });

  // Keep declaration inspector name in sync with checklist inspector name
  useEffect(() => {
    setDeclaration((prev) => ({
      ...prev,
      inspectorName: checklist.siteInspectorName,
    }));
  }, [checklist.siteInspectorName]);

  // Dynamic KNO Search using Search API (same as Mutation and Disconnection)
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const knoQuery = searchKno.trim();

    if (!knoQuery) {
      setToast({ key: "warning", message: t("WS_ENTER_KNO_WARNING", "Please enter K Number / Connection ID") });
      return;
    }

    setIsSearching(true);
    setToast(null);

    try {
      const tenantId = Digit.ULBService.getCurrentTenantId() || "dl";
      const params = { connectionNumber: knoQuery, searchType: "CONNECTION", isConnectionSearch: true };

      let connection = null;

      // 1. Search in Water Service by connectionNumber
      const wsResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "WS" }).catch(() => null);
      const waterData = wsResponse?.data || wsResponse;
      if (waterData?.WaterConnection && waterData.WaterConnection.length > 0) {
        connection = waterData.WaterConnection.find((c) => c.connectionNo === knoQuery) || waterData.WaterConnection[0];
      }

      // 2. Fallback search by applicationNumber if not found by connectionNumber
      if (!connection) {
        const appResponse = await Digit.WSService.search({ tenantId, filters: { applicationNumber: knoQuery }, businessService: "WS" }).catch(() => null);
        const appData = appResponse?.data || appResponse;
        if (appData?.WaterConnection && appData.WaterConnection.length > 0) {
          connection = appData.WaterConnection[0];
        }
      }

      // 3. Check in Sewerage Service if still not found
      if (!connection) {
        const swResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "SW" }).catch(() => null);
        const swData = swResponse?.data || swResponse;
        if (swData?.SewerageConnections && swData.SewerageConnections.length > 0) {
          connection = swData.SewerageConnections[0];
        }
      }

      // Dynamic check: if connection is not found, clear details and show error
      if (!connection) {
        setDataLoaded(false);
        setConnectionDetails({ ...emptyConnectionDetails, tenantId });
        setToast({
          key: "error",
          message: t("WS_NO_CONNECTION_FOUND_ERR", "Active connection not found for the given K Number"),
        });
        return;
      }

      // 4. Fetch Property Details if propertyId exists
      let property = connection.property;
      if (!property && connection.propertyId) {
        const propertyResponse = await Digit.PTService.search({
          tenantId: connection.tenantId || tenantId,
          filters: { propertyIds: connection.propertyId },
          auth: true,
        }).catch(() => null);
        property = propertyResponse?.Properties?.[0];
      }

      const holder = connection.connectionHolders?.[0] || {};
      const owner = property?.owners?.[0] || {};
      const addr = property?.address || connection.address || {};
      const addDetails = connection.additionalDetails || {};
      const propAddDetails = property?.additionalDetails || {};

      const issuanceEpoch = addDetails.knoIssuanceDate || connection.dateEffectiveFrom || connection.auditDetails?.createdTime;
      const formattedIssuanceDate = issuanceEpoch
        ? (Digit.DateUtils ? Digit.DateUtils.ConvertTimestampToDate(issuanceEpoch) : new Date(issuanceEpoch).toLocaleDateString("en-IN"))
        : "NA";

      const plumberInfo = connection.plumberInfo?.[0];
      const assignedPlumber = addDetails.assignedLicensedPlumber ||
        (plumberInfo?.name ? `${plumberInfo.name}${plumberInfo.licenseNo ? ` (${plumberInfo.licenseNo})` : ""}` : "NA");

      const formattedAddress = addr.addressLine1 ||
        [addr.doorNo || addr.houseNo, addr.buildingName, addr.street, addr.locality?.name].filter(Boolean).join(", ") ||
        "NA";

      setConnectionDetails({
        kno: connection.connectionNo || knoQuery,
        applicationNo: connection.applicationNo || "NA",
        connectionNo: connection.connectionNo || knoQuery,
        tenantId: connection.tenantId || tenantId,
        status: connection.status || connection.applicationStatus || "Active",
        applicationType: connection.applicationType || "NEW_WATER_CONNECTION",
        knoIssuanceDate: formattedIssuanceDate,
        knoIssuanceDateEpoch: issuanceEpoch || null,
        zone: addDetails.zone || addr.zone || addDetails.siteInspection?.zone || "NA",
        zroOffice: addDetails.zroOffice || addDetails.zroName || addDetails.subdivision || addDetails.zroLocation || "NA",
        connectionType: connection.connectionType || "NA",
        connectionCategory: addDetails.category || addDetails.connectionCategory || connection.waterSource || property?.propertyType || "NA",
        applicationStatus: connection.applicationStatus || connection.status || "Active",
        assignedLicensedPlumber: assignedPlumber,

        // Property Details
        propertyAddress: formattedAddress,
        city: addr.city || connection.tenantId?.split(".")?.[1]?.toUpperCase() || "NA",
        pincode: addr.pincode || "NA",
        locality: addr.locality?.name || addr.locality?.code || "NA",
        subLocality: addr.additionalDetails?.subLocality || addr.buildingName || addr.street || "NA",
        colonyCategory: propAddDetails.colonyCategory || addr.additionalDetails?.colonyCategory || "NA",
        propertyUse: property?.usageCategory || addDetails.propertyUse || property?.propertyType || "NA",
        ownershipType: property?.ownershipCategory || "NA",
        houseNo: addr.doorNo || addr.houseNo || property?.propertyId || "NA",

        // Consumer Details
        consumerName: holder.name || owner.name || "NA",
        mobileNumber: holder.mobileNumber || owner.mobileNumber || "NA",
        emailId: holder.emailId || owner.emailId || "NA",
        applicantType: holder.type || owner.type || "NA",
        identityType: holder.relationship || owner.ownerType || "NA",
        alternateContactNumber: holder.altContactNumber || addDetails.alternateMobileNumber || owner.alternatemobilenumber || "NA",

        // Plot Details
        plotNumber: addr.plotNo || propAddDetails.plotNo || addr.doorNo || "NA",
        plotArea: property?.landArea ? String(property.landArea) : (addDetails.plotArea ? String(addDetails.plotArea) : "NA"),
        plotAreaUnit: propAddDetails.plotAreaUnit || addDetails.plotAreaUnit || "NA",
        numberOfFloors: property?.noOfFloors ? String(property.noOfFloors) : (addDetails.noOfFloors ? String(addDetails.noOfFloors) : "NA"),
        coveredArea: propAddDetails.coveredArea || property?.superBuiltUpArea ? String(propAddDetails.coveredArea || property?.superBuiltUpArea) : "NA",
        roadWidth: addDetails.roadWidth || propAddDetails.roadWidth ? String(addDetails.roadWidth || propAddDetails.roadWidth) : "NA",
        propertyType: property?.propertyType || "NA",
        buildingStatus: propAddDetails.buildingStatus || addDetails.buildingStatus || "NA",
        existingWaterConnection: addDetails.existingWaterConnection || (connection.connectionNo ? "Yes" : "No"),
      });

      setDataLoaded(true);
      setToast({ key: "success", message: t("WS_KNO_FETCH_SUCCESS", "KNO details fetched successfully from DJB records.") });
    } catch (err) {
      console.error("Error searching KNO:", err);
      setDataLoaded(false);
      setConnectionDetails({ ...emptyConnectionDetails });
      setToast({ key: "error", message: err?.message || t("WS_KNO_SEARCH_ERROR", "Error fetching KNO details.") });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChecklistChange = (field, value) => {
    setChecklist((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Upload file handler via Digit.UploadServices
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size >= 5242880) {
      setToast({ key: "error", message: t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED", "Maximum file size is 5MB") });
      return;
    }

    setIsUploading(true);
    const tenantId = Digit.ULBService.getCurrentTenantId() || "dl";

    try {
      const res = await Digit.UploadServices.Filestorage("WS", file, tenantId);
      const fileStoreId = res?.data?.files?.[0]?.fileStoreId;
      if (fileStoreId) {
        setUploadedDocuments((prev) => [
          ...prev,
          {
            documentType: "SITE_INSPECTION_PHOTO",
            fileStoreId: fileStoreId,
            documentUid: file.name,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + " KB",
          },
        ]);
        setToast({ key: "success", message: t("WS_PHOTO_UPLOAD_SUCCESS", "Photograph uploaded successfully.") });
      } else {
        setToast({ key: "error", message: t("CS_FILE_UPLOAD_ERROR", "File upload failed.") });
      }
    } catch (err) {
      console.error("File upload error:", err);
      setToast({ key: "error", message: t("CS_FILE_UPLOAD_ERROR", "File upload failed.") });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleRemoveDocument = (indexToRemove) => {
    setUploadedDocuments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleReset = () => {
    if (window.confirm(t("WS_RESET_CONFIRMATION", "Are you sure you want to reset the checklist, evidence, and declaration?"))) {
      setChecklist({
        ...initialChecklist,
        siteInspectorName: loggedInUser?.name || "",
        inspectorEmployeeId: loggedInUser?.id ? String(loggedInUser.id) : (loggedInUser?.code || ""),
      });
      setUploadedDocuments([]);
      setDeclaration({
        ...initialDeclaration,
        inspectorName: loggedInUser?.name || "",
      });
      setToast({ key: "info", message: t("WS_CHECKLIST_RESET", "Checklist and declaration have been reset.") });
    }
  };

  // Dedicated print handler: iframe isolation ensures all 8 sections print completely without outer SPA layout clipping
  const handlePrint = () => {
    const printElement = document.getElementById("field-inspection-printable-document");
    if (!printElement) {
      window.print();
      return;
    }

    try {
      let iframe = document.getElementById("field-inspection-print-frame");
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      iframe = document.createElement("iframe");
      iframe.id = "field-inspection-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);

      const pri = iframe.contentWindow;
      pri.document.open();
      pri.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>DJB Site Inspection Form - ${connectionDetails.kno || connectionDetails.connectionNo || searchKno || "Water Connection"}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: Arial, Helvetica, sans-serif;
                color: #111111;
                margin: 0;
                padding: 0;
                font-size: 9.5pt;
                line-height: 1.35;
                background: #ffffff;
              }
              .print-header {
                text-align: center;
                border-bottom: 2px solid #003366;
                padding-bottom: 8px;
                margin-bottom: 12px;
              }
              .print-header h1 {
                font-size: 15pt;
                font-weight: bold;
                margin: 0 0 3px 0;
                color: #003366;
              }
              .print-header h2 {
                font-size: 11.5pt;
                font-weight: bold;
                margin: 0 0 3px 0;
                color: #222222;
              }
              .print-header .subtitle {
                font-size: 9pt;
                color: #555555;
              }
              .print-header .meta-bar {
                display: flex;
                justify-content: space-between;
                margin-top: 6px;
                font-size: 8.5pt;
                border-top: 1px solid #dddddd;
                padding-top: 4px;
              }
              .print-section {
                margin-bottom: 10px;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .print-section-header {
                background-color: #003366 !important;
                color: #ffffff !important;
                font-weight: bold;
                font-size: 9.5pt;
                padding: 4px 8px;
                margin-bottom: 4px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 4px;
                font-size: 8.5pt;
              }
              .print-table th, .print-table td {
                border: 1px solid #333333;
                padding: 4px 6px;
                vertical-align: top;
              }
              .print-label {
                font-weight: bold;
                background-color: #f7f7f7 !important;
                color: #222222;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-value {
                color: #111111;
                word-break: break-word;
              }
            </style>
          </head>
          <body>
            ${printElement.innerHTML}
          </body>
        </html>
      `);
      pri.document.close();

      setTimeout(() => {
        pri.focus();
        pri.print();
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    } catch (e) {
      console.warn("Iframe print fallback triggered:", e);
      window.print();
    }
  };

  // Submit Site Inspection to endpoint /site-inspection/_submit
  const handleSubmit = async () => {
    if (!dataLoaded) {
      setToast({ key: "error", message: t("WS_LOAD_KNO_FIRST", "Please search and load a valid KNO record first.") });
      return;
    }

    if (!checklist.inspectionDate) {
      setToast({ key: "error", message: t("WS_REQ_INSPECTION_DATE", "Please specify the Inspection Date.") });
      return;
    }

    if (!checklist.inspectionTime) {
      setToast({ key: "error", message: t("WS_REQ_INSPECTION_TIME", "Please specify the Inspection Time.") });
      return;
    }

    if (!checklist.siteInspectorName?.trim()) {
      setToast({ key: "error", message: t("WS_REQ_INSPECTOR_NAME", "Please enter Site Inspector Name.") });
      return;
    }

    if (!checklist.siteInspectorRemarks?.trim()) {
      setToast({ key: "error", message: t("WS_REQ_INSPECTOR_REMARKS", "Please enter Site Inspector Observations / Remarks.") });
      return;
    }

    if (uploadedDocuments.length === 0) {
      setToast({ key: "error", message: t("WS_REQ_EVIDENCE_PHOTO", "Please upload at least one Site Photograph evidence.") });
      return;
    }

    if (!declaration.agreed) {
      setToast({ key: "error", message: t("WS_REQ_DECLARATION_AGREE", "Please accept the Declaration before submitting the report.") });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    const inspectionDateEpoch = new Date(checklist.inspectionDate).getTime() || Date.now();
    const submissionDateEpoch = new Date(declaration.submissionDate).getTime() || Date.now();
    const knoIssuanceEpoch = connectionDetails.knoIssuanceDateEpoch || Date.now();

    const docsPayload = uploadedDocuments.map((doc) => ({
      documentType: doc.documentType || "SITE_INSPECTION_PHOTO",
      fileStoreId: doc.fileStoreId,
      documentUid: doc.documentUid || doc.fileName || "property_frontage.jpg",
    }));

    const submitPayload = {
      WaterConnection: {
        applicationNo: connectionDetails.applicationNo,
        connectionNo: connectionDetails.connectionNo,
        tenantId: connectionDetails.tenantId,
        status: connectionDetails.status || "Active",
        applicationType: connectionDetails.applicationType || "NEW_WATER_CONNECTION",
        inspectionInformation: {
          inspectionType: {
            code: "SITE_INSPECTION",
            i18nKey: "WS_SITE_INSPECTION",
          },
          inspectionDate: inspectionDateEpoch,
          inspectorName: checklist.siteInspectorName,
        },
        documents: docsPayload,
        additionalDetails: {
          siteInspection: {
            knoIssuanceDate: knoIssuanceEpoch,
            zone: connectionDetails.zone,
            zroOffice: connectionDetails.zroOffice,
            assignedLicensedPlumber: connectionDetails.assignedLicensedPlumber,
            inspectionTime: checklist.inspectionTime,
            inspectorEmployeeId: checklist.inspectorEmployeeId,
            isLicensedPlumberPresent: checklist.isLicensedPlumberPresent?.code || checklist.isLicensedPlumberPresent,
            isConsumerRepresentativePresent: checklist.isConsumerRepresentativePresent?.code || checklist.isConsumerRepresentativePresent,
            checklist: {
              consumerIdentityVerified: !!checklist.consumerIdentityVerified,
              knoDetailsMatched: !!checklist.knoDetailsMatched,
              propertyAddressVerified: !!checklist.propertyAddressVerified,
              localityColonyVerified: !!checklist.localityColonyVerified,
              propertyUseVerified: !!checklist.propertyUseVerified,
              plotDetailsVerified: !!checklist.plotDetailsVerified,
              existingWaterConnectionChecked: !!checklist.existingWaterConnectionChecked,
              proposedConnectionPointIdentified: !!checklist.proposedConnectionPointIdentified,
              waterMainAndRoadAccessFeasible: !!checklist.waterMainAndRoadAccessFeasible,
              meterLocationIdentifiedAndAccessible: !!checklist.meterLocationIdentifiedAndAccessible,
              licensedPlumberVerified: !!checklist.licensedPlumberVerified,
              siteConditionsMatchedApplication: !!checklist.siteConditionsMatchedApplication,
            },
            siteAccessibility: checklist.siteAccessibility?.code || checklist.siteAccessibility,
            proposedMeterLocation: checklist.proposedMeterLocation?.code || checklist.proposedMeterLocation,
            siteFeasibilityObserved: checklist.siteFeasibilityObserved?.code || checklist.siteFeasibilityObserved,
            siteInspectorRemarks: checklist.siteInspectorRemarks,
            declaration: {
              agreed: !!declaration.agreed,
              inspectorName: declaration.inspectorName || checklist.siteInspectorName,
              submissionDate: submissionDateEpoch,
            },
          },
        },
      },
    };

    try {
      let response = null;

      // 1. Primary service call
      if (Digit?.WSService?.submitSiteInspection) {
        try {
          response = await Digit.WSService.submitSiteInspection(submitPayload);
        } catch (apiErr) {
          console.warn("WSService.submitSiteInspection error:", apiErr);
        }
      }

      // 2. Gateway endpoint call /ws-services/wc/site-inspection/_submit
      if (!response && Digit?.CustomService?.getResponse) {
        try {
          response = await Digit.CustomService.getResponse({
            url: "/ws-services/wc/site-inspection/_submit",
            data: submitPayload,
          });
        } catch (gatewayErr) {
          console.warn("Gateway endpoint call failed, attempting direct path:", gatewayErr);
          response = await Digit.CustomService.getResponse({
            url: "/site-inspection/_submit",
            data: submitPayload,
          });
        }
      }

      setSubmittedData({
        ...submitPayload.WaterConnection,
        responseInfo: response?.ResponseInfo || response?.responseInfo,
      });
      setIsSubmittedSuccess(true);
      setToast({ key: "success", message: t("WS_SITE_INSPECTION_SUCCESS", "Site Inspection report submitted successfully!") });
    } catch (err) {
      console.error("Error submitting site inspection:", err);
      setToast({
        key: "error",
        message: err?.response?.data?.Errors?.[0]?.message || err?.message || t("WS_SUBMISSION_ERROR", "Submission failed. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable field grid styling
  const grid3Style = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px 20px",
    marginTop: "12px",
    marginBottom: "16px",
  };

  const grid2Style = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px 24px",
    marginTop: "16px",
    marginBottom: "16px",
  };

  // Checklist criteria items definition
  const checklistItems = [
    { label: "Consumer identity / applicant details verified at site", key: "consumerIdentityVerified" },
    { label: "KNO and application details matched", key: "knoDetailsMatched" },
    { label: "Property address and premises location verified", key: "propertyAddressVerified" },
    { label: "Locality / colony details verified", key: "localityColonyVerified" },
    { label: "Property use and category verified", key: "propertyUseVerified" },
    { label: "Plot details / area verified at site", key: "plotDetailsVerified" },
    { label: "Existing water connection / service line checked", key: "existingWaterConnectionChecked" },
    { label: "Proposed connection point identified", key: "proposedConnectionPointIdentified" },
    { label: "Water main and road access feasibility checked", key: "waterMainAndRoadAccessFeasible" },
    { label: "Meter installation location identified and accessible", key: "meterLocationIdentifiedAndAccessible" },
    { label: "Licensed plumber details / authorization verified", key: "licensedPlumberVerified" },
    { label: "Site conditions match application details", key: "siteConditionsMatchedApplication" },
  ];

  const plumberPresentValue = checklist.isLicensedPlumberPresent?.name || checklist.isLicensedPlumberPresent || "NA";
  const consumerPresentValue = checklist.isConsumerRepresentativePresent?.name || checklist.isConsumerRepresentativePresent || "NA";
  const accessibilityValue = checklist.siteAccessibility?.name || checklist.siteAccessibility || "NA";
  const meterLocValue = checklist.proposedMeterLocation?.name || checklist.proposedMeterLocation || "NA";
  const feasibilityValue = checklist.siteFeasibilityObserved?.name || checklist.siteFeasibilityObserved || "NA";

  // Render printable report component containing all form fields across all 8 sections
  const renderPrintView = () => (
    <div id="field-inspection-printable-document" className="field-inspection-print-view" ref={printRef}>
      {/* Official DJB Header */}
      <div className="print-header" style={{ textAlign: "center", borderBottom: "2px solid #003366", paddingBottom: "10px", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "0 0 4px 0", color: "#003366" }}>
          DELHI JAL BOARD : GOVT. OF NCT OF DELHI
        </h1>
        <h2 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0 0 4px 0", color: "#222" }}>
          SITE INSPECTION REPORT – NEW WATER CONNECTION
        </h2>
        <div className="subtitle" style={{ fontSize: "9.5pt", color: "#555" }}>
          Post KNO Issuance | Physical Field Inspection Assessment Form
        </div>
        <div className="meta-bar" style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "9pt", borderTop: "1px solid #ddd", paddingTop: "4px" }}>
          <span><strong>Application No:</strong> {connectionDetails.applicationNo || "NA"}</span>
          <span><strong>KNO / Connection No:</strong> {connectionDetails.kno || connectionDetails.connectionNo || searchKno || "NA"}</span>
          <span><strong>Report Date:</strong> {new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      {/* 1. Search KNO & Record Identification */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">1. SEARCH KNO & RECORD IDENTIFICATION</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "18%" }}>Searched KNO:</td>
              <td className="print-value" style={{ width: "32%" }}>{searchKno || connectionDetails.kno || "NA"}</td>
              <td className="print-label" style={{ width: "18%" }}>Record Retrieval:</td>
              <td className="print-value" style={{ width: "32%" }}>
                {dataLoaded ? "RECORD RETRIEVED FROM DJB DATABASE (VERIFIED)" : "MANUAL INSPECTION ENTRY"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. KNO Issuance Details */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">2. KNO ISSUANCE DETAILS</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "16%" }}>KNO:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.kno || "NA"}</td>
              <td className="print-label" style={{ width: "16%" }}>Application No:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.applicationNo || "NA"}</td>
              <td className="print-label" style={{ width: "17%" }}>KNO Issuance Date:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.knoIssuanceDate || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Zone:</td>
              <td className="print-value">{connectionDetails.zone || "NA"}</td>
              <td className="print-label">ZRO Name / Office:</td>
              <td className="print-value">{connectionDetails.zroOffice || "NA"}</td>
              <td className="print-label">Connection Type:</td>
              <td className="print-value">{connectionDetails.connectionType || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Category:</td>
              <td className="print-value">{connectionDetails.connectionCategory || "NA"}</td>
              <td className="print-label">Status:</td>
              <td className="print-value">{connectionDetails.applicationStatus || "NA"}</td>
              <td className="print-label">Assigned Plumber:</td>
              <td className="print-value">{connectionDetails.assignedLicensedPlumber || "NA"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Property Details */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">3. PROPERTY DETAILS</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "16%" }}>Property Address:</td>
              <td className="print-value" colSpan={3}>{connectionDetails.propertyAddress || "NA"}</td>
              <td className="print-label" style={{ width: "17%" }}>City / PIN:</td>
              <td className="print-value" style={{ width: "17%" }}>{`${connectionDetails.city || "Delhi"} - ${connectionDetails.pincode || "NA"}`}</td>
            </tr>
            <tr>
              <td className="print-label">Locality:</td>
              <td className="print-value">{connectionDetails.locality || "NA"}</td>
              <td className="print-label">Sub Locality:</td>
              <td className="print-value">{connectionDetails.subLocality || "NA"}</td>
              <td className="print-label">Colony Category:</td>
              <td className="print-value">{connectionDetails.colonyCategory || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Property Use:</td>
              <td className="print-value">{connectionDetails.propertyUse || "NA"}</td>
              <td className="print-label">Ownership Type:</td>
              <td className="print-value">{connectionDetails.ownershipType || "NA"}</td>
              <td className="print-label">House / Prop No:</td>
              <td className="print-value">{connectionDetails.houseNo || "NA"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Consumer Details */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">4. CONSUMER / APPLICANT DETAILS</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "16%" }}>Consumer Name:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.consumerName || "NA"}</td>
              <td className="print-label" style={{ width: "16%" }}>Mobile Number:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.mobileNumber || "NA"}</td>
              <td className="print-label" style={{ width: "17%" }}>Email ID:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.emailId || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Applicant Type:</td>
              <td className="print-value">{connectionDetails.applicantType || "NA"}</td>
              <td className="print-label">Identity Type:</td>
              <td className="print-value">{connectionDetails.identityType || "NA"}</td>
              <td className="print-label">Alt Contact No:</td>
              <td className="print-value">{connectionDetails.alternateContactNumber || "NA"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Plot Details */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">5. PLOT & PREMISES DETAILS</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "16%" }}>Plot Number:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.plotNumber || "NA"}</td>
              <td className="print-label" style={{ width: "16%" }}>Plot Area:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.plotArea ? `${connectionDetails.plotArea} ${connectionDetails.plotAreaUnit || ""}` : "NA"}</td>
              <td className="print-label" style={{ width: "17%" }}>No. of Floors:</td>
              <td className="print-value" style={{ width: "17%" }}>{connectionDetails.numberOfFloors || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Covered Area:</td>
              <td className="print-value">{connectionDetails.coveredArea || "NA"}</td>
              <td className="print-label">Road Width:</td>
              <td className="print-value">{connectionDetails.roadWidth || "NA"}</td>
              <td className="print-label">Property Type:</td>
              <td className="print-value">{connectionDetails.propertyType || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Building Status:</td>
              <td className="print-value">{connectionDetails.buildingStatus || "NA"}</td>
              <td className="print-label">Existing Water Conn:</td>
              <td className="print-value" colSpan={3}>{connectionDetails.existingWaterConnection || "NA"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Site Inspection Checklist */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">6. SITE INSPECTION CHECKLIST & OBSERVATIONS</div>
        <table className="print-table">
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "16%" }}>Inspection Date:</td>
              <td className="print-value" style={{ width: "17%" }}>{checklist.inspectionDate || "NA"}</td>
              <td className="print-label" style={{ width: "16%" }}>Inspection Time:</td>
              <td className="print-value" style={{ width: "17%" }}>{checklist.inspectionTime || "NA"}</td>
              <td className="print-label" style={{ width: "17%" }}>Inspector Name:</td>
              <td className="print-value" style={{ width: "17%" }}>{checklist.siteInspectorName || "NA"}</td>
            </tr>
            <tr>
              <td className="print-label">Inspector Emp ID:</td>
              <td className="print-value">{checklist.inspectorEmployeeId || "NA"}</td>
              <td className="print-label">Plumber Present:</td>
              <td className="print-value">{plumberPresentValue}</td>
              <td className="print-label">Consumer Present:</td>
              <td className="print-value">{consumerPresentValue}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: "6px", fontWeight: "bold", fontSize: "9.5pt" }}>Checklist Verification Criteria:</div>
        <table className="print-table" style={{ marginTop: "4px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ width: "6%", textAlign: "center" }}>S.No</th>
              <th style={{ width: "68%", textAlign: "left" }}>Inspection Checklist Item</th>
              <th style={{ width: "26%", textAlign: "center" }}>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>{item.label}</td>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {checklist[item.key] ? (
                    <span style={{ color: "#006600" }}>[✓] YES (Verified)</span>
                  ) : (
                    <span style={{ color: "#555555" }}>[ ] NO (Not Verified)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="print-table" style={{ marginTop: "6px" }}>
          <tbody>
            <tr>
              <td className="print-label" style={{ width: "20%" }}>Site Accessibility:</td>
              <td className="print-value" style={{ width: "30%" }}>{accessibilityValue}</td>
              <td className="print-label" style={{ width: "25%" }}>Proposed Meter Location:</td>
              <td className="print-value" style={{ width: "25%" }}>{meterLocValue}</td>
            </tr>
            <tr>
              <td className="print-label">Site Feasibility Observed:</td>
              <td className="print-value" colSpan={3} style={{ fontWeight: "bold" }}>{feasibilityValue}</td>
            </tr>
            <tr>
              <td className="print-label">Inspector Observations / Remarks:</td>
              <td className="print-value" colSpan={3} style={{ minHeight: "36px" }}>{checklist.siteInspectorRemarks || "None"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. Site Inspection Evidence */}
      <div className="print-section print-avoid-break">
        <div className="print-section-header">7. SITE INSPECTION EVIDENCE / PHOTOGRAPHS</div>
        {uploadedDocuments.length === 0 ? (
          <div style={{ padding: "6px 8px", fontStyle: "italic", fontSize: "9pt", border: "1px solid #ccc" }}>
            No photographs attached.
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ width: "8%", textAlign: "center" }}>S.No</th>
                <th style={{ width: "40%" }}>Document Type</th>
                <th style={{ width: "37%" }}>File Name / UID</th>
                <th style={{ width: "15%", textAlign: "center" }}>File Size</th>
              </tr>
            </thead>
            <tbody>
              {uploadedDocuments.map((doc, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center" }}>{idx + 1}</td>
                  <td>{doc.documentType || "SITE_INSPECTION_PHOTO"}</td>
                  <td>{doc.fileName || doc.documentUid || `Photo-${idx + 1}.jpg`}</td>
                  <td style={{ textAlign: "center" }}>{doc.fileSize || "NA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 8. Declaration & Signatures */}
      <div className="print-section print-avoid-break" style={{ marginTop: "8px" }}>
        <div className="print-section-header">8. DECLARATION & SIGNATURES</div>
        <div style={{ padding: "6px 8px", fontSize: "9pt", lineHeight: "1.35", border: "1px solid #333", marginBottom: "12px", backgroundColor: "#fafafa" }}>
          <strong>Declaration:</strong> I hereby declare that I have physically inspected the site and that the details, checklist responses, observations and photographs submitted in this inspection report are true and correct to the best of my knowledge. I understand that this report will be recorded against the respective KNO.
          <div style={{ marginTop: "4px" }}>
            <strong>Declaration Status:</strong>{" "}
            {declaration.agreed ? (
              <span style={{ color: "#006600", fontWeight: "bold" }}>[✓] YES (Agreed & Confirmed by Site Inspector)</span>
            ) : (
              <span style={{ color: "#555555" }}>[ ] Pending Confirmation</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderBottom: "1px solid #000", width: "220px", margin: "0 auto 4px auto" }}></div>
            <div style={{ fontWeight: "bold", fontSize: "9.5pt" }}>Signature of Site Inspector</div>
            <div style={{ fontSize: "8.5pt" }}>Name: {declaration.inspectorName || checklist.siteInspectorName || "____________________"}</div>
            <div style={{ fontSize: "8.5pt" }}>Emp ID: {checklist.inspectorEmployeeId || "____________________"}</div>
            <div style={{ fontSize: "8.5pt" }}>Date: {declaration.submissionDate || "____________________"}</div>
          </div>

          <div style={{ textAlign: "center", width: "45%" }}>
            <div style={{ borderBottom: "1px solid #000", width: "220px", margin: "0 auto 4px auto" }}></div>
            <div style={{ fontWeight: "bold", fontSize: "9.5pt" }}>Counter Signature (ZRO / EE)</div>
            <div style={{ fontSize: "8.5pt" }}>ZRO / Office: {connectionDetails.zroOffice || "____________________"}</div>
            <div style={{ fontSize: "8.5pt" }}>Zone: {connectionDetails.zone || "____________________"}</div>
            <div style={{ fontSize: "8.5pt" }}>Date: ____________________</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "8pt", color: "#666", marginTop: "16px", borderTop: "1px solid #ddd", paddingTop: "4px" }}>
        Delhi Jal Board | Water & Sewerage Department | Site Inspection Report | Computer Generated Printout
      </div>
    </div>
  );

  // Reusable Print Stylesheet
  const printStyleSheet = (
    <style>{`
      @media screen {
        .field-inspection-print-view {
          display: none !important;
        }
      }
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        html, body, #root, #root *, .main, .employee-app-wrapper, .employee-app-container, .ground-container, .form-container, .employee-app-container-inner, .employee-main-application-details {
          height: auto !important;
          min-height: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          position: static !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        header, nav, .topbar, .sidebar, .collapsible-sidebar, .action-bar-wrap, .digit-action-bar, .submit-bar, .toast, .breadcrumbs, .clear-both, .employee-header, .digit-header, .field-inspection-screen-view, .upyog-copyright-footer, div[style*="fixed"] {
          display: none !important;
        }
        .field-inspection-print-view {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #111111 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9.5pt !important;
          line-height: 1.35 !important;
        }
        .field-inspection-print-view * {
          visibility: visible !important;
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-header {
          text-align: center;
          border-bottom: 2px solid #003366;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .print-header h1 {
          font-size: 15pt;
          font-weight: bold;
          margin: 0 0 3px 0;
          color: #003366 !important;
        }
        .print-header h2 {
          font-size: 11.5pt;
          font-weight: bold;
          margin: 0 0 3px 0;
          color: #222222 !important;
        }
        .print-header .subtitle {
          font-size: 9pt;
          color: #555555 !important;
        }
        .print-header .meta-bar {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 8.5pt;
          border-top: 1px solid #dddddd;
          padding-top: 4px;
        }
        .print-section {
          margin-bottom: 10px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-section-header {
          background-color: #003366 !important;
          color: #ffffff !important;
          font-weight: bold !important;
          font-size: 9.5pt !important;
          padding: 4px 8px !important;
          margin-bottom: 4px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-bottom: 4px !important;
          font-size: 8.5pt !important;
        }
        .print-table th, .print-table td {
          border: 1px solid #333333 !important;
          padding: 4px 6px !important;
          vertical-align: top !important;
        }
        .print-label {
          font-weight: bold !important;
          background-color: #f7f7f7 !important;
          color: #222222 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-value {
          color: #111111 !important;
          word-break: break-word !important;
        }
      }
    `}</style>
  );

  // Render submission success view
  if (isSubmittedSuccess) {
    return (
      <React.Fragment>
        {/* CSS for printing */}
        <style>{`
          @media screen {
            .field-inspection-print-view {
              display: none !important;
            }
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            html, body, #root, .app-container, .ground-container {
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            header, nav, .topbar, .sidebar, .collapsible-sidebar, .action-bar-wrap, .digit-action-bar, .submit-bar, .toast, .breadcrumbs, .clear-both, .employee-header, .digit-header, .field-inspection-screen-view {
              display: none !important;
            }
            .field-inspection-print-view {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 9.5pt !important;
              line-height: 1.35 !important;
            }
            .field-inspection-print-view * {
              visibility: visible !important;
              box-sizing: border-box !important;
            }
            .print-section {
              margin-bottom: 10px !important;
            }
            .print-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-section-header {
              background-color: #003366 !important;
              color: #ffffff !important;
              font-weight: bold !important;
              font-size: 10pt !important;
              padding: 4px 8px !important;
              margin-bottom: 4px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 6px !important;
              font-size: 9pt !important;
            }
            .print-table th, .print-table td {
              border: 1px solid #333333 !important;
              padding: 4px 6px !important;
              vertical-align: top !important;
            }
            .print-label {
              font-weight: bold !important;
              background-color: #f7f7f7 !important;
              color: #222222 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-value {
              color: #111111 !important;
              word-break: break-word !important;
            }
          }
        `}</style>

        {/* Screen Success View */}
        <div className="field-inspection-screen-view">
          <Header>{t("WS_SITE_INSPECTION_HEADER", "Site Inspection – New Water Connection")}</Header>
          <Card>
            <Banner
              successful={true}
              message={t("WS_SITE_INSPECTION_SUBMITTED_SUCCESS", "Site Inspection Report Submitted Successfully")}
              applicationNumber={submittedData?.connectionNo || connectionDetails.connectionNo}
              info={t("WS_CONNECTION_NO_LABEL", "Connection No (KNO)")}
            />
            <CardText>
              {t(
                "WS_SITE_INSPECTION_SUCCESS_NOTE",
                "The physical site inspection report and checklist evidence have been successfully recorded against the connection."
              )}
            </CardText>
            <ActionBar>
              <SubmitBar
                label={t("WS_PRINT_FORM", "Print Form")}
                onSubmit={handlePrint}
                style={{ backgroundColor: "#e6f4ff", color: "#003366", border: "1px solid #91caff", marginRight: "12px" }}
              />
              <SubmitBar
                label={t("WS_INSPECT_ANOTHER_KNO", "Inspect Another KNO")}
                onSubmit={() => {
                  setIsSubmittedSuccess(false);
                  setDataLoaded(false);
                  setSearchKno("");
                  setUploadedDocuments([]);
                  setConnectionDetails({ ...emptyConnectionDetails });
                  setChecklist(initialChecklist);
                }}
                style={{ marginRight: "12px" }}
              />
              <SubmitBar
                label={t("CORE_COMMON_GO_TO_HOME", "Go to Home")}
                onSubmit={() => history.push("/digit-ui/employee/ws/water/inbox")}
              />
            </ActionBar>
          </Card>
        </div>

        {/* Complete Printable Report */}
        {renderPrintView()}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* CSS Stylesheet for Print & Screen Views */}
      <style>{`
        @media screen {
          .field-inspection-print-view {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body, #root, .app-container, .ground-container {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, .topbar, .sidebar, .collapsible-sidebar, .action-bar-wrap, .digit-action-bar, .submit-bar, .toast, .breadcrumbs, .clear-both, .employee-header, .digit-header, .field-inspection-screen-view {
            display: none !important;
          }
          .field-inspection-print-view {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111111 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
          }
          .field-inspection-print-view * {
            visibility: visible !important;
            box-sizing: border-box !important;
          }
          .print-section {
            margin-bottom: 10px !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-section-header {
            background-color: #003366 !important;
            color: #ffffff !important;
            font-weight: bold !important;
            font-size: 10pt !important;
            padding: 4px 8px !important;
            margin-bottom: 4px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 6px !important;
            font-size: 9pt !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #333333 !important;
            padding: 4px 6px !important;
            vertical-align: top !important;
          }
          .print-label {
            font-weight: bold !important;
            background-color: #f7f7f7 !important;
            color: #222222 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-value {
            color: #111111 !important;
            word-break: break-word !important;
          }
        }
      `}</style>

      {/* Interactive Screen View */}
      <div className="field-inspection-screen-view">
        <Header>{t("WS_SITE_INSPECTION_TITLE", "Site Inspection – New Water Connection")}</Header>
        <div style={{ color: "#505a5f", fontSize: "14px", marginTop: "-8px", marginBottom: "16px" }}>
          {t("WS_SITE_INSPECTION_SUBTITLE", "Post KNO issuance | Site Inspector Form")}
        </div>

        {/* Workflow Info Box */}
        <Card style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", marginBottom: "16px" }}>
          <CardText style={{ margin: 0, color: "#595959", fontSize: "14px", lineHeight: "1.5" }}>
            <strong>Workflow:</strong> KNO issuance, property, consumer and plot details are fetched from the application record. The site inspector completes the checklist, uploads site photographs and submits the inspection report. No approval process is included.
          </CardText>
        </Card>

        {/* Section 1: Search KNO */}
        <Card>
          <CardSubHeader>{t("WS_SEARCH_KNO_SECTION", "1. Search KNO")}</CardSubHeader>
          <div style={{ maxWidth: "600px", marginTop: "12px" }}>
            <LabelFieldPair>
              <CardLabel style={{ fontWeight: "600", width: "120px" }}>{`${t("WS_KNO_LABEL", "KNO")} *`}</CardLabel>
              <div className="field" style={{ display: "flex", gap: "12px", width: "100%" }}>
                <TextInput
                  name="searchKno"
                  value={searchKno}
                  onChange={(e) => setSearchKno(e.target.value)}
                  placeholder={t("WS_ENTER_KNO_PLACEHOLDER", "Enter KNO")}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                />
                <SubmitBar
                  label={isSearching ? t("COMMON_SEARCHING", "Searching...") : t("WS_FETCH_KNO_DETAILS", "Fetch KNO Details")}
                  onSubmit={handleSearch}
                  disabled={isSearching}
                />
              </div>
            </LabelFieldPair>
            <CardSectionSubText style={{ marginTop: "4px", fontSize: "12px" }}>
              {t("WS_SEARCH_KNO_HELPER", "The live DJB application should retrieve the issued KNO record and populate the read-only sections below.")}
            </CardSectionSubText>
          </div>
        </Card>

        {/* Section 2: KNO Issuance Details (Read-only) */}
        <Card>
          <CardSubHeader>{t("WS_KNO_ISSUANCE_DETAILS", "2. KNO Issuance Details")}</CardSubHeader>
          <CardSectionSubText>{t("WS_KNO_ISSUANCE_SUBTEXT", "Auto-fetched from KNO issuance record; read-only for site inspector.")}</CardSectionSubText>
          <div style={grid3Style}>
            <div>
              <CardLabel>{t("WS_KNO_LABEL", "KNO")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.kno} />
            </div>
            <div>
              <CardLabel>{t("WS_APPLICATION_NUMBER_LABEL", "Application Number")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.applicationNo} />
            </div>
            <div>
              <CardLabel>{t("WS_KNO_ISSUANCE_DATE_LABEL", "KNO Issuance Date")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.knoIssuanceDate} />
            </div>
            <div>
              <CardLabel>{t("WS_ZONE_LABEL", "Zone")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.zone} />
            </div>
            <div>
              <CardLabel>{t("WS_ZRO_NAME_OFFICE_LABEL", "ZRO Name / Office")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.zroOffice} />
            </div>
            <div>
              <CardLabel>{t("WS_CONNECTION_TYPE_LABEL", "Connection Type")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.connectionType} />
            </div>
            <div>
              <CardLabel>{t("WS_CONNECTION_CATEGORY_LABEL", "Connection Category")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.connectionCategory} />
            </div>
            <div>
              <CardLabel>{t("WS_APPLICATION_STATUS_LABEL", "Application Status")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.applicationStatus} />
            </div>
            <div>
              <CardLabel>{t("WS_ASSIGNED_LICENSED_PLUMBER_LABEL", "Assigned Licensed Plumber")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.assignedLicensedPlumber} />
            </div>
          </div>
        </Card>

        {/* Section 3: Property Details (Read-only) */}
        <Card>
          <CardSubHeader>{t("WS_PROPERTY_DETAILS", "3. Property Details")}</CardSubHeader>
          <CardSectionSubText>{t("WS_PREFILLED_FROM_CITIZEN_APP", "Prefilled from citizen application.")}</CardSectionSubText>
          <div style={grid3Style}>
            <div>
              <CardLabel>{t("WS_PROPERTY_ADDRESS_LABEL", "Property Address")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.propertyAddress} />
            </div>
            <div>
              <CardLabel>{t("WS_CITY_LABEL", "City")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.city} />
            </div>
            <div>
              <CardLabel>{t("WS_PIN_CODE_LABEL", "PIN Code")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.pincode} />
            </div>
            <div>
              <CardLabel>{t("WS_LOCALITY_LABEL", "Locality")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.locality} />
            </div>
            <div>
              <CardLabel>{t("WS_SUB_LOCALITY_LABEL", "Sub Locality")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.subLocality} />
            </div>
            <div>
              <CardLabel>{t("WS_COLONY_CATEGORY_LABEL", "Colony Category")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.colonyCategory} />
            </div>
            <div>
              <CardLabel>{t("WS_PROPERTY_USE_LABEL", "Property Use")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.propertyUse} />
            </div>
            <div>
              <CardLabel>{t("WS_OWNERSHIP_TYPE_LABEL", "Ownership Type")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.ownershipType} />
            </div>
            <div>
              <CardLabel>{t("WS_HOUSE_PROPERTY_NO_LABEL", "House / Property Number")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.houseNo} />
            </div>
          </div>
        </Card>

        {/* Section 4: Consumer Details (Read-only) */}
        <Card>
          <CardSubHeader>{t("WS_CONSUMER_DETAILS", "4. Consumer Details")}</CardSubHeader>
          <CardSectionSubText>{t("WS_PREFILLED_FROM_CITIZEN_APP", "Prefilled from citizen application.")}</CardSectionSubText>
          <div style={grid3Style}>
            <div>
              <CardLabel>{t("WS_CONSUMER_NAME_LABEL", "Consumer / Applicant Name")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.consumerName} />
            </div>
            <div>
              <CardLabel>{t("WS_MOBILE_NUMBER_LABEL", "Mobile Number")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.mobileNumber} />
            </div>
            <div>
              <CardLabel>{t("WS_EMAIL_ID_LABEL", "Email ID")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.emailId} />
            </div>
            <div>
              <CardLabel>{t("WS_APPLICANT_TYPE_LABEL", "Applicant Type")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.applicantType} />
            </div>
            <div>
              <CardLabel>{t("WS_IDENTITY_TYPE_LABEL", "Identity / Reference Type")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.identityType} />
            </div>
            <div>
              <CardLabel>{t("WS_ALT_CONTACT_LABEL", "Alternate Contact Number")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.alternateContactNumber} />
            </div>
          </div>
        </Card>

        {/* Section 5: Plot Details (Read-only) */}
        <Card>
          <CardSubHeader>{t("WS_PLOT_DETAILS", "5. Plot Details")}</CardSubHeader>
          <CardSectionSubText>{t("WS_PREFILLED_PLOT_INFO", "Prefilled plot / premises information as submitted in the application.")}</CardSectionSubText>
          <div style={grid3Style}>
            <div>
              <CardLabel>{t("WS_PLOT_NUMBER_LABEL", "Plot Number")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.plotNumber} />
            </div>
            <div>
              <CardLabel>{t("WS_PLOT_AREA_LABEL", "Plot Area")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.plotArea} />
            </div>
            <div>
              <CardLabel>{t("WS_PLOT_AREA_UNIT_LABEL", "Plot Area Unit")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.plotAreaUnit} />
            </div>
            <div>
              <CardLabel>{t("WS_NUMBER_OF_FLOORS_LABEL", "Number of Floors")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.numberOfFloors} />
            </div>
            <div>
              <CardLabel>{t("WS_COVERED_AREA_LABEL", "Covered Area")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.coveredArea} />
            </div>
            <div>
              <CardLabel>{t("WS_ROAD_WIDTH_LABEL", "Road Width")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.roadWidth} />
            </div>
            <div>
              <CardLabel>{t("WS_PROPERTY_TYPE_LABEL", "Property Type")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.propertyType} />
            </div>
            <div>
              <CardLabel>{t("WS_BUILDING_STATUS_LABEL", "Building Status")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.buildingStatus} />
            </div>
            <div>
              <CardLabel>{t("WS_EXISTING_WATER_CONN_LABEL", "Existing Water Connection")}</CardLabel>
              <TextInput disabled={true} value={connectionDetails.existingWaterConnection} />
            </div>
          </div>
        </Card>

        {/* Section 6: Site Inspection Checklist (Editable) */}
        <Card>
          <CardSubHeader>{t("WS_SITE_INSPECTION_CHECKLIST", "6. Site Inspection Checklist")}</CardSubHeader>
          <CardSectionSubText>{t("WS_CHECKLIST_SUBTEXT", "To be filled by the site inspector during the physical site visit.")}</CardSectionSubText>

          {/* Metadata Row 1 */}
          <div style={grid3Style}>
            <div>
              <CardLabel>{`${t("WS_INSPECTION_DATE_LABEL", "Inspection Date")} *`}</CardLabel>
              <TextInput
                type="date"
                value={checklist.inspectionDate}
                onChange={(e) => handleChecklistChange("inspectionDate", e.target.value)}
              />
            </div>
            <div>
              <CardLabel>{`${t("WS_INSPECTION_TIME_LABEL", "Inspection Time")} *`}</CardLabel>
              <TextInput
                value={checklist.inspectionTime}
                placeholder="11:30 AM"
                onChange={(e) => handleChecklistChange("inspectionTime", e.target.value)}
              />
            </div>
            <div>
              <CardLabel>{`${t("WS_INSPECTOR_NAME_LABEL", "Site Inspector Name")} *`}</CardLabel>
              <TextInput
                value={checklist.siteInspectorName}
                placeholder={t("WS_ENTER_INSPECTOR_NAME", "Enter inspector name")}
                onChange={(e) => handleChecklistChange("siteInspectorName", e.target.value)}
              />
            </div>
          </div>

          {/* Metadata Row 2 */}
          <div style={grid3Style}>
            <div>
              <CardLabel>{t("WS_INSPECTOR_EMPLOYEE_ID_LABEL", "Inspector Employee ID")}</CardLabel>
              <TextInput
                value={checklist.inspectorEmployeeId}
                placeholder={t("WS_EMPLOYEE_ID_PLACEHOLDER", "Employee ID")}
                onChange={(e) => handleChecklistChange("inspectorEmployeeId", e.target.value)}
              />
            </div>
            <div>
              <CardLabel>{t("WS_LICENSED_PLUMBER_PRESENT_LABEL", "Licensed Plumber Present?")}</CardLabel>
              <Dropdown
                option={yesNoOptions}
                selected={checklist.isLicensedPlumberPresent}
                select={(val) => handleChecklistChange("isLicensedPlumberPresent", val)}
                optionKey="name"
                t={t}
              />
            </div>
            <div>
              <CardLabel>{t("WS_CONSUMER_REP_PRESENT_LABEL", "Consumer / Representative Present?")}</CardLabel>
              <Dropdown
                option={yesNoOptions}
                selected={checklist.isConsumerRepresentativePresent}
                select={(val) => handleChecklistChange("isConsumerRepresentativePresent", val)}
                optionKey="name"
                t={t}
              />
            </div>
          </div>

          {/* 12 Checkboxes in 2 Columns using CheckBox */}
          <div style={grid2Style}>
            {/* Column 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <CheckBox
                checked={checklist.consumerIdentityVerified}
                onChange={(e) => handleChecklistChange("consumerIdentityVerified", e.target.checked)}
                label={t("WS_CHECKLIST_CONSUMER_IDENTITY", "Consumer identity / applicant details verified at site")}
              />
              <CheckBox
                checked={checklist.propertyAddressVerified}
                onChange={(e) => handleChecklistChange("propertyAddressVerified", e.target.checked)}
                label={t("WS_CHECKLIST_PROP_ADDRESS", "Property address and premises location verified")}
              />
              <CheckBox
                checked={checklist.propertyUseVerified}
                onChange={(e) => handleChecklistChange("propertyUseVerified", e.target.checked)}
                label={t("WS_CHECKLIST_PROP_USE", "Property use and category verified")}
              />
              <CheckBox
                checked={checklist.existingWaterConnectionChecked}
                onChange={(e) => handleChecklistChange("existingWaterConnectionChecked", e.target.checked)}
                label={t("WS_CHECKLIST_EXISTING_CONN", "Existing water connection / service line checked")}
              />
              <CheckBox
                checked={checklist.waterMainAndRoadAccessFeasible}
                onChange={(e) => handleChecklistChange("waterMainAndRoadAccessFeasible", e.target.checked)}
                label={t("WS_CHECKLIST_ROAD_ACCESS", "Water main and road access feasibility checked")}
              />
              <CheckBox
                checked={checklist.licensedPlumberVerified}
                onChange={(e) => handleChecklistChange("licensedPlumberVerified", e.target.checked)}
                label={t("WS_CHECKLIST_PLUMBER_AUTH", "Licensed plumber details / authorization verified")}
              />
            </div>

            {/* Column 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <CheckBox
                checked={checklist.knoDetailsMatched}
                onChange={(e) => handleChecklistChange("knoDetailsMatched", e.target.checked)}
                label={t("WS_CHECKLIST_KNO_MATCHED", "KNO and application details matched")}
              />
              <CheckBox
                checked={checklist.localityColonyVerified}
                onChange={(e) => handleChecklistChange("localityColonyVerified", e.target.checked)}
                label={t("WS_CHECKLIST_LOCALITY_VERIFIED", "Locality / colony details verified")}
              />
              <CheckBox
                checked={checklist.plotDetailsVerified}
                onChange={(e) => handleChecklistChange("plotDetailsVerified", e.target.checked)}
                label={t("WS_CHECKLIST_PLOT_DETAILS", "Plot details / area verified at site")}
              />
              <CheckBox
                checked={checklist.proposedConnectionPointIdentified}
                onChange={(e) => handleChecklistChange("proposedConnectionPointIdentified", e.target.checked)}
                label={t("WS_CHECKLIST_PROPOSED_POINT", "Proposed connection point identified")}
              />
              <CheckBox
                checked={checklist.meterLocationIdentifiedAndAccessible}
                onChange={(e) => handleChecklistChange("meterLocationIdentifiedAndAccessible", e.target.checked)}
                label={t("WS_CHECKLIST_METER_LOCATION", "Meter installation location identified and accessible")}
              />
              <CheckBox
                checked={checklist.siteConditionsMatchedApplication}
                onChange={(e) => handleChecklistChange("siteConditionsMatchedApplication", e.target.checked)}
                label={t("WS_CHECKLIST_SITE_CONDITIONS", "Site conditions match application details")}
              />
            </div>
          </div>

          {/* Dropdown Options Row */}
          <div style={grid3Style}>
            <div>
              <CardLabel>{`${t("WS_SITE_ACCESSIBILITY_LABEL", "Site Accessibility")} *`}</CardLabel>
              <Dropdown
                option={siteAccessibilityOptions}
                selected={checklist.siteAccessibility}
                select={(val) => handleChecklistChange("siteAccessibility", val)}
                optionKey="name"
                t={t}
              />
            </div>
            <div>
              <CardLabel>{`${t("WS_PROPOSED_METER_LOC_LABEL", "Proposed Meter Location")} *`}</CardLabel>
              <Dropdown
                option={proposedMeterLocationOptions}
                selected={checklist.proposedMeterLocation}
                select={(val) => handleChecklistChange("proposedMeterLocation", val)}
                optionKey="name"
                t={t}
              />
            </div>
            <div>
              <CardLabel>{`${t("WS_SITE_FEASIBILITY_LABEL", "Site Feasibility Observed")} *`}</CardLabel>
              <Dropdown
                option={siteFeasibilityOptions}
                selected={checklist.siteFeasibilityObserved}
                select={(val) => handleChecklistChange("siteFeasibilityObserved", val)}
                optionKey="name"
                t={t}
              />
            </div>
          </div>

          {/* Observations / Remarks */}
          <div style={{ marginTop: "16px" }}>
            <CardLabel>{`${t("WS_INSPECTOR_REMARKS_LABEL", "Site Inspector Observations / Remarks")} *`}</CardLabel>
            <TextArea
              name="siteInspectorRemarks"
              value={checklist.siteInspectorRemarks}
              placeholder={t("WS_ENTER_SITE_REMARKS", "Enter site observations, discrepancies, measurements and findings")}
              onChange={(e) => handleChecklistChange("siteInspectorRemarks", e.target.value)}
              style={{ minHeight: "90px" }}
            />
          </div>
        </Card>

        {/* Section 7: Site Inspection Evidence (Editable) */}
        <Card>
          <CardSubHeader>{t("WS_SITE_INSPECTION_EVIDENCE", "7. Site Inspection Evidence")}</CardSubHeader>
          <div style={{ marginTop: "12px" }}>
            <CardLabel>{`${t("WS_UPLOAD_SITE_PHOTOS", "Upload Site Photograph(s)")} *`}</CardLabel>
            <UploadFile
              id="site-inspection-photos"
              accept="image/*"
              onUpload={handleFileUpload}
              onDelete={() => setUploadedDocuments([])}
              message={
                uploadedDocuments.length > 0
                  ? `${uploadedDocuments.length} ${t("CS_ACTION_FILEUPLOADED", "file(s) uploaded")}`
                  : t("ES_NO_FILE_SELECTED_LABEL", "No file selected")
              }
              disabled={isUploading}
            />
            <CardSectionSubText style={{ marginTop: "6px", fontSize: "12px" }}>
              {t(
                "WS_UPLOAD_EVIDENCE_HELPER",
                "Upload photographs of property frontage, premises, proposed connection point and proposed meter installation location. No supporting documents or coordinates are required."
              )}
            </CardSectionSubText>

            {/* List of uploaded photos with remove option */}
            {uploadedDocuments.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {uploadedDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: "500", fontSize: "13px" }}>{doc.fileName || doc.documentUid}</span>
                      <span style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}>({doc.fileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#cf1322",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                      }}
                    >
                      {t("CS_COMMON_DELETE", "Remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Section 8: Declaration (Editable) */}
        <Card>
          <CardSubHeader>{t("WS_DECLARATION", "8. Declaration")}</CardSubHeader>
          <div style={{ marginTop: "12px", marginBottom: "16px" }}>
            <CheckBox
              checked={declaration.agreed}
              onChange={(e) => setDeclaration((prev) => ({ ...prev, agreed: e.target.checked }))}
              label={t(
                "WS_INSPECTION_DECLARATION_TEXT",
                "I hereby declare that I have physically inspected the site and that the details, checklist responses, observations and photographs submitted in this inspection report are true and correct to the best of my knowledge. I understand that this report will be recorded against the respective KNO."
              )}
            />
          </div>

          <div style={grid2Style}>
            <div>
              <CardLabel>{t("WS_INSPECTOR_NAME_LABEL", "Inspector Name")}</CardLabel>
              <TextInput disabled={true} value={declaration.inspectorName} />
            </div>
            <div>
              <CardLabel>{t("WS_SUBMISSION_DATE_LABEL", "Submission Date")}</CardLabel>
              <TextInput
                type="date"
                value={declaration.submissionDate}
                onChange={(e) => setDeclaration((prev) => ({ ...prev, submissionDate: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Bottom Actions */}
        <ActionBar>
          <SubmitBar
            label={t("WS_PRINT_FORM", "Print Form")}
            onSubmit={handlePrint}
            style={{ backgroundColor: "#e6f4ff", color: "#003366", border: "1px solid #91caff", marginRight: "12px" }}
          />
          <SubmitBar
            label={t("WS_RESET", "Reset")}
            onSubmit={handleReset}
            style={{ backgroundColor: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e", marginRight: "12px" }}
          />
          <SubmitBar
            label={isSubmitting ? t("WS_SUBMITTING", "Submitting...") : t("WS_SUBMIT_SITE_INSPECTION", "Submit Site Inspection")}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
          />
        </ActionBar>
      </div>

      {/* Complete Printable Report */}
      {renderPrintView()}

      {toast && (
        <Toast
          error={toast.key === "error"}
          warning={toast.key === "warning"}
          info={toast.key === "info"}
          label={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </React.Fragment>
  );
};

export default WSFieldInspection;
