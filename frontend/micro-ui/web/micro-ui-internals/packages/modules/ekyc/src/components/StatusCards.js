import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Chartjs from "chart.js/auto";
import { FaChartBar, MdDownloadIcon } from "@djb25/digit-ui-react-components";

const getChartConstructor = () => {
  const C = Chartjs.Chart || Chartjs.default || Chartjs;
  return C;
};

const StatusCards = ({ countData }) => {
  const { t } = useTranslation();
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [customDate, setCustomDate] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const reportMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target)) {
        setShowReportMenu(false);
        setShowCustomPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb";
  }
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const fullName = loggedInUser?.name || "Admin";

  const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        reportDownload: true,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });

      const consumerList = response?.consumerList || [];
      if (consumerList.length === 0) {
        alert(t("NO_DATA_FOUND") || "No data found for download.");
        return;
      }

      const excludedKeys = [
        "status",
        "source",
        "assignedAt",
        "connectionType",
        "approvedAt",
        "alternateMobileNo",
        "city",
        "state",
        "addressType",
        "addressProofType",
        "mrcode",
        "areacode",
        "verificationStatus",
        "surveyorId",
        "supervisorId",
        "vendorId",
        "assignmentType",
        "assignmentValue",
        "assignedTime",
        "isSelfAssigned",
        "userType",
        "tenantName",
        "tenantMobile",
        "doorPhotoFilestoreId",
        "panFilestoreId",
        "documentProofFilestoreId",
        "buildingImageFileStoreId",
        "propertyDocumentFileStoreId",
        "meterPhotoFileStoreId",
        "modifiedBy",
        "zoneCode",
        "propertyType",
        "subPropertyCategory",
      ];

      const headerMapping = {
        kno: t("KNO"),
        firstName: t("FIRST_NAME"),
        middleName: t("MIDDLE_NAME"),
        lastName: t("LAST_NAME"),
        status: t("STATUS"),
        ekycStatus: t("EKYC_STATUS"),
        zoneName: t("ZONE"),
        zoneCode: t("ZONE_CODE"),
        assembly: t("EKYC_ASSEMBLY"),
        ward: t("WARD"),
        pincode: t("EKYC_PINCODE"),
        addressRaw: t("ADDRESS_RAW"),
        locality: t("EKYC_LOCALITY"),
        subLocality: t("SUB_LOCALITY"),
        flatHouseNumber: t("FLAT_HOUSE_NUMBER"),
        streetName: t("STREET_NAME"),
        landmark: t("EKYC_LANDMARK"),
        city: t("CITY"),
        state: t("STATE"),
        addressType: t("ADDRESS_TYPE"),
        addressProofType: t("ADDRESS_PROOF_TYPE"),
        mobileNo: t("MOBILE_NUMBER"),
        alternateMobileNo: t("ALTERNATE_MOBILE_NUMBER"),
        whatsappNo: t("WHATSAPP_NO"),
        email: t("EMAIL"),
        landlineNo: t("LANDLINE_NO"),
        mrkey: t("MR_KEY"),
        mrcode: t("MR_CODE"),
        areacode: t("AREA_CODE"),
        source: t("SOURCE"),
        submittedAt: t("SUBMITTED_AT"),
        assignedAt: t("ASSIGNED_AT"),
        connectionType: t("CONNECTION_TYPE"),
        Type: t("CONSUMER_TYPE"),
        occupantType: t("OCCUPANT_TYPE"),
        knoCategory: t("KNO_CATEGORY"),
        approvedAt: t("APPROVED_AT"),
        gender: t("GENDER"),
        parentSpouse: t("PARENT_SPOUSE"),
        fatherOrHusbandName: t("FATHER_HUSBUND_NAME"),
        relationship: t("RELATIONSHIP"),
        informantName: t("INFORMANT_NAME"),
        informantRelation: t("INFORMANT_RELATION"),
        informantIs: t("INFORMANT_IS"),
        contactPerson: t("CONTACT_PERSON"),
        relation: t("RELATION"),
        entityName: t("ENTITY_NAME"),
        designation: t("DESIGNATION"),
        department: t("DEPARTMENT"),
        employeeId: t("EMPLOYEE_ID"),
        ownerMobile: t("OWNER_MOBILE"),
        ownerVerificationDone: t("OWNER_VERIFICATION_DONE"),
        consentGiven: t("CONSENT_GIVEN"),
        proofOfIdentityType: t("PROOF_OF_IDENTITY_TYPE"),
        documentNumber: t("DOCUMENT_NUMBER"),
        noOfPerson: t("NUMBER_OF_PERSON"),
        latitude: t("LATITUDE"),
        longitude: t("LONGITUDE"),
        gpsValid: t("GPS_VALID"),
        meterNumber: t("METER_NUMBER"),
        meterMake: t("METER_MAKE"),
        meterStatus: t("METER_STATUS"),
        meterCondition: t("METER_CONDITION"),
        meterLocation: t("METER_LOCATION"),
        meterLocationAddress: t("METER_LOCATION_ADDRESS"),
        workingStatus: t("WORKING_STATUS"),
        sewerConnection: t("SEWER_CONNECTION"),
        septicTank: t("SEPTIC_TANK"),
        lastBillRaised: t("LAST_BILL_RAISED"),
        lastBillReceivedDate: t("LAST_BILL_RECEIVED_DATE"),
        accessToMeter: t("ACCESS_TO_METER"),
        systemMeterId: t("SYSTEM_METER_ID"),
        lastBillNotRaisedReason: t("LAST_BILL_NOT_RAISED_REASON"),
        waterConnectionYears: t("WATER_CONNECTION_YEARS"),
        sewerConnectionYears: t("SEWER_CONNECTION_YEARS"),
        pidNumber: t("PID_NUMBER"),
        propertyType: t("PROPERTY_TYPE"),
        subPropertyCategory: t("SUB_PROPERTY_CATEGORY"),
        noOfFloor: t("NO_OF_FLOOR"),
        noOfRooms: t("NO_OF_ROOMS"),
        noOfBeds: t("NO_OF_BEDS"),
        numberOfDwellingUnits: t("NUMBER_OF_DWELLING_UNITS"),
        floorNo: t("FLOOR_NO"),
        userType: t("USER_TYPE"),
        tenantName: t("TENANT_NAME"),
        tenantMobile: t("TENANT_MOBILE"),
        verificationStatus: t("VERIFICATION_STATUS"),
        houseBuiltDuration: t("HOUSE_BUILT_DURATION"),
        surveyorId: t("SURVEYOR_ID"),
        supervisorId: t("SUPERVISOR_ID"),
        vendorId: t("VENDOR_ID"),
        assignmentType: t("ASSIGNMENT_TYPE"),
        assignmentValue: t("ASSIGNMENT_VALUE"),
        assignedTime: t("ASSIGNED_TIME"),
        isSelfAssigned: t("IS_SELF_ASSIGNED"),
        doorPhotoFilestoreId: t("DOOR_PHOTO_FILESTORE_ID"),
        panFilestoreId: t("PAN_FILESTORE_ID"),
        documentProofFilestoreId: t("DOCUMENT_PROOF_FILESTORE_ID"),
        buildingImageFileStoreId: t("BUILDING_IMAGE_FILESTORE_ID"),
        propertyDocumentFileStoreId: t("PROPERTY_DOCUMENT_FILESTORE_ID"),
        meterPhotoFileStoreId: t("METER_PHOTO_FILESTORE_ID"),
        modifiedBy: t("MODIFIED_BY"),
        emailId: t("EMAIL_ID"),
        dob: t("DOB"),
        consumerType: t("CONSUMER_TYPE"),
        createdTime: t("CREATED_TIME"),
        lastModifiedTime: t("LAST_MODIFIED_TIME"),
        meterLatitude: t("EKYC_METER_LATITUDE1"),
        meterLongitude: t("EKYC_METER_LONGITUDE1"),
      };

      const toTitleCase = (str) => {
        if (!str) return "";
        // Handle dot-notation values like "CONSUMERTYPE.INDIVIDUAL" → "Individual"
        let cleanStr = String(str);
        if (cleanStr.includes(".") && !cleanStr.includes("@") && isNaN(Number(cleanStr))) {
          cleanStr = cleanStr.split(".").pop();
        }
        return cleanStr
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      };

      const skipTitleCase = [
        "kno",
        "mobileNumber",
        "emailId",
        "email",
        "pincode",
        "mrkey",
        "dob",
        "createdTime",
        "lastModifiedTime",
        "meterLatitude",
        "meterLongitude",
      ];
      const translatedFields = ["meterMake", "meterLocation"];

      const excelData = consumerList.map((item) => {
        const cleanObj = {};

        const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
        if (name) {
          cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = toTitleCase(name);
        }

        const keys = Object.keys(item);

        // submittedAt ko last column me bhejne ke liye
        const orderedKeys = [...keys.filter((key) => key !== "submittedAt"), ...(keys.includes("submittedAt") ? ["submittedAt"] : [])];

        orderedKeys.forEach((key) => {
          if (excludedKeys.includes(key)) return;

          let val = item[key];

          // Convert submittedAt timestamp to date/time
          if (key === "submittedAt" && val) {
            const date = new Date(Number(val));

            const pad = (n) => String(n).padStart(2, "0");

            val = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
              date.getSeconds()
            )}`;
          }

          if (typeof val === "object" && val !== null) {
            return;
          }

          if (String(val).toLowerCase() === "true") {
            val = t("CS_YES");
          } else if (String(val).toLowerCase() === "false") {
            val = t("CS_NO");
          }

          const friendlyHeader = headerMapping[key] || t(key.toUpperCase()) || key;

          if (typeof val === "string" && translatedFields.includes(key)) {
            cleanObj[friendlyHeader] = t(val);
          } else if (typeof val === "string" && !skipTitleCase.includes(key)) {
            cleanObj[friendlyHeader] = toTitleCase(val);
          } else {
            cleanObj[friendlyHeader] = val;
          }
        });
        return cleanObj;
      });

      const cleanFileName = `eKYC_All_Data_Admin_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      Digit.Download.Excel(excelData, cleanFileName);
    } catch (error) {
      console.error("Error downloading eKYC Excel:", error);
    } finally {
      setEkycDownloadLoading(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const start = new Date(now);
    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (filter === "week") {
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (filter === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    return null;
  };

  const handlePresetDownload = async (filter) => {
    const range = getDateRange(filter);
    if (!range) return;
    setShowReportMenu(false);
    setShowCustomPicker(false);
    await handleDownloadEkycData(range.from.getTime(), range.to.getTime());
  };

  const handleCustomDownload = async () => {
    if (!customDate.from || !customDate.to) {
      alert(t("SELECT_DATE_RANGE") || "Please select both From and To dates.");
      return;
    }
    const from = new Date(customDate.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customDate.to);
    to.setHours(23, 59, 59, 999);
    setShowReportMenu(false);
    setShowCustomPicker(false);
    await handleDownloadEkycData(from.getTime(), to.getTime());
  };

  const chartRef1 = useRef(null);
  const chartInstance1 = useRef(null);

  const efficiency = countData?.total > 0 ? Math.round(((countData?.submittedCount + countData?.completed) / countData?.total) * 100) : 0;
  const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num || 0);

  useEffect(() => {
    if (chartRef1.current) {
      if (chartInstance1.current) chartInstance1.current.destroy();
      const ctx1 = chartRef1.current.getContext("2d");
      const ChartConstructor = getChartConstructor();
      chartInstance1.current = new ChartConstructor(ctx1, {
        type: "doughnut",
        data: {
          labels: [t("EKYC_PENDING"), t("EKYC_COMPLETED"), t("EKYC_SUBMITTED"), t("EKYC_INPROCESS")],
          datasets: [
            {
              data: [countData?.pending, countData?.completed, countData?.submitted, countData?.inprocess],
              backgroundColor: ["#0c2a52", "#77B6EA", "#c8ddf5", "#49a3fb"],
              borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
              borderWidth: 2,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          cutout: "75%",
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          responsive: true,
        },
      });
    }

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
    };
  }, [countData, t]);

  const legendItems = [
    { color: "#77B6EA", label: t("EKYC_TOTAL"), value: countData?.total },
    { color: "#77B6EA", label: t("EKYC_COMPLETED"), value: countData?.completed },
    { color: "#0c2a52", label: t("EKYC_PENDING"), value: countData?.pending },
    { color: "#c8ddf5", label: t("EKYC_SUBMITTED_BY_VENDORS"), value: countData?.submittedCount },
    { color: "#c8ddf5", label: t("EKYC_SUBMITTED_BY_CITIZEN"), value: countData?.selfEkycCount || 0 },
    { color: "#c8ddf5", label: t("EKYC_REJECTED"), value: countData?.rejected || 0 },
  ];

  return (
    <div className="ekyc-employee-container">
      <div className="status-cards-wrapper">
        {/* Header */}
        <div className="status-cards-header">
          <div className="status-card-title">
            <FaChartBar size={32} color="#fff" backgroundColor="#065297" style={{ paddingInline: "4px", borderRadius: "4px  " }} />

            <h1 className="status-cards-h1">{t("EKYC_DASHBOARD_TITLE") || "eKYC Verification Dashboard"}</h1>
          </div>
          <div className="report-download" ref={reportMenuRef}>
            <button
              className="total-applications-card download-btn"
              disabled={ekycDownloadLoading}
              onClick={() => {
                setShowReportMenu((p) => !p);
                setShowCustomPicker(false);
              }}
            >
              {t("DOWNLOAD_REPORT") || "Download Report"}

              <MdDownloadIcon />

              {showReportMenu && (
                <div className="report-menu">
                  {[
                    { label: t("TODAY") || "Today", key: "today" },
                    { label: t("THIS_WEEK") || "This Week", key: "week" },
                    { label: t("THIS_MONTH") || "This Month", key: "month" },
                  ].map(({ label, key }) => (
                    <div key={key} className="menu-item" onClick={() => handlePresetDownload(key)}>
                      {label}
                    </div>
                  ))}

                  <div className="custom-date-trigger" onClick={() => setShowCustomPicker((p) => !p)}>
                    {t("CUSTOM_DATE") || "Custom Date"}
                  </div>

                  {showCustomPicker && (
                    <div className="custom-picker">
                      <div className="date-inputs">
                        <label>
                          <span>From</span>
                          <input type="date" value={customDate.from} onChange={(e) => setCustomDate({ ...customDate, from: e.target.value })} />
                        </label>
                        <label>
                          <span>To</span>
                          <input type="date" value={customDate.to} onChange={(e) => setCustomDate({ ...customDate, to: e.target.value })} />
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button
                          className="picker-cancel-btn"
                          onClick={() => {
                            setShowCustomPicker(false);
                            setCustomDate({ from: "", to: "" });
                          }}
                        >
                          {t("CANCEL") || "Cancel"}
                        </button>
                        <button className="picker-apply-btn" onClick={handleCustomDownload}>
                          {t("APPLY") || "Apply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Panels */}
        <div className="status-panels-grid">
          <div className="status-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">{t("EKYC_STATUS_BREAKDOWN") || "Status Breakdown"}</div>
                <div className="panel-subtitle">{t("EKYC_VERIFICATION_LIFECYCLE") || "Verification lifecycle"}</div>
              </div>

              <div className="completion-badge">{efficiency}% Complete</div>
            </div>

            <div className="status-breakdown-content">
              {/* Chart */}
              <div className="chart-wrapper">
                <canvas ref={chartRef1} style={{ width: "100%", height: "100%" }} />

                <div className="chart-center">
                  <div className="chart-percentage">{efficiency}%</div>
                  <div className="chart-label">{t("EKYC_COMPLETE") || "Complete"}</div>
                </div>
              </div>

              {/* Status Boxes */}
              <div className="status-boxes">
                {legendItems.map((item) => (
                  <div className="status-box" key={item.label}>
                    <div className="status-box-top">
                      <span className="status-indicator" style={{ backgroundColor: item.color }} />

                      <span className="status-name">{item.label}</span>
                    </div>

                    <div className="status-box-value">{formatNumber(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
