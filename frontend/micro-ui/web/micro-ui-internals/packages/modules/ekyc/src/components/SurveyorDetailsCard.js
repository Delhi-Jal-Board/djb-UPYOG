import React, { useMemo, useState, useRef, useEffect } from "react";
// import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

import { Card, SubmitBar, ActionBar, Menu, Loader, Table } from "@djb25/digit-ui-react-components";

import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import AssignEkycModal from "./AssignEkycModal";
import { downloadSurveyorPDF } from "../utils/reportDownloader";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";

const SurveyorDetailsDashboard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [showModal, setShowModal] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  const { id: surveyorId } = useParams();
  const ownerIds = Digit.SessionStorage.get("User")?.info?.uuid;

  const { t } = useTranslation();

  const { data: surveyorSearchById, isLoading: isLoadingId } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { ids: surveyorId },
    { enabled: !!surveyorId, staleTime: Infinity }
  );

  const hasFoundById = !!(surveyorSearchById?.surveyors?.length);

  const { data: surveyorSearchByOwner, isLoading: isLoadingOwner } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    surveyorId ? { ownerIds: surveyorId } : { ownerIds },
    { enabled: !surveyorId || (!isLoadingId && !hasFoundById), staleTime: Infinity }
  );

  const surveyorSearchResponse = useMemo(() => {
    if (surveyorId && hasFoundById) {
      return surveyorSearchById;
    }
    return surveyorSearchByOwner;
  }, [surveyorId, hasFoundById, surveyorSearchById, surveyorSearchByOwner]);

  const isLoading = surveyorId ? (isLoadingId || (isLoadingOwner && !hasFoundById)) : isLoadingOwner;

  const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);

  const surveyor = useMemo(() => {
    return surveyorSearchResponse?.surveyors?.[0] || null;
  }, [surveyorSearchResponse]);

  const { data: vendorData, isLoading: isVendorLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );
  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );
  const vendorName = useMemo(() => {
    if (surveyor?.vendorName) return surveyor.vendorName;
    if (!vendorData || !surveyor?.vendorId) return "N/A";
    const mappedVendor = vendorData.find((v) => v.dsoDetails?.id === surveyor.vendorId || v.dsoDetails?.vendorId === surveyor.vendorId);
    return mappedVendor?.dsoDetails?.name || surveyor.vendorId || "N/A";
  }, [vendorData, surveyor?.vendorId, surveyor?.vendorName]);

  const supervisorName = useMemo(() => {
    if (surveyor?.supervisorName) return surveyor.supervisorName;
    if (!supervisorSearchResponse?.supervisors || !surveyor?.supervisorId) return "N/A";
    const mappedSupervisor = supervisorSearchResponse.supervisors.find(
      (s) => s.id === surveyor.supervisorId || s.owner?.uuid === surveyor.supervisorId
    );
    return mappedSupervisor?.name || mappedSupervisor?.owner?.name || surveyor.supervisorId || "N/A";
  }, [supervisorSearchResponse, surveyor?.supervisorId, surveyor?.supervisorName]);
  const fullName = surveyor?.owner?.name || surveyor?.name || "N/A";
  const employeeId = surveyor?.employeeId || surveyor?.owner?.uuid || surveyor?.id;
  const mobileNumber = surveyor?.owner?.mobileNumber || surveyor?.mobileNo || "N/A";

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const queryParams = {
    tenantId: "dl.djb",
    offset: currentPage * pageSize,
    limit: pageSize,
    surveyorId: surveyor?.owner?.uuid,
  };

  const { isFetching: isDashboardLoading, data: dashboardData = {}, refetch: refetchDashboard } = Digit.Hooks.ekyc.useEkycSurveyorDashboard(
    {},
    queryParams,
    {
      enabled: !!queryParams.tenantId && !!queryParams.surveyorId,
      keepPreviousData: true,
    }
  );

  const toTitleCase = (str) => {
    if (!str) return "";
    // Handle dot-notation values like "CONSUMERTYPE.INDIVIDUAL" → "Individual"
    const cleanStr = String(str).includes(".") ? String(str).split(".").pop() : String(str);
    return cleanStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const knoColumns = useMemo(
    () => [
      {
        Header: t("KNO") || "KNO",
        accessor: "kno",
      },
      {
        Header: t("CONSUMER_NAME") || "Consumer Name",
        accessor: (row) => toTitleCase(`${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim()),
        id: "consumerName",
      },
      {
        Header: t("ZONE") || "Zone",
        accessor: (row) => toTitleCase(row.zoneName),
        id: "zoneName",
      },
      {
        Header: t("EKYC_STATUS") || "eKYC Status",
        accessor: "ekycStatus",
        Cell: ({ value }) => {
          const status = (value || "NA").toUpperCase();
          return value ? <span className={`ekyc-status-tag ${status}`}>{toTitleCase(value)}</span> : "-";
        },
      },
      {
        Header: t("SUBMITTED_AT") || "Submitted At",
        accessor: "submittedAt",
        Cell: ({ value }) => (value ? Digit.DateUtils.ConvertEpochToDate(value) : "-"),
      },
      {
        Header: t("ASSIGNED_AT") || "Assigned At",
        accessor: "assignedAt",
        Cell: ({ value }) => (value ? Digit.DateUtils.ConvertEpochToDate(value) : "-"),
      },
    ],
    [t]
  );

  // ─── Download Report hooks (must be before any early returns) ───────

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [customDate, setCustomDate] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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

  const isPageLoading = isLoading || isVendorLoading || isSupervisorSearchLoading;

  if (isPageLoading && !surveyor) {
    return <Loader />;
  }

  if (!surveyor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_SURVEYOR_FOUND")}</div>
      </Card>
    );
  }

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

  const handleDownload = async () => {
    setReportLoading(true);
    try {
      const response = await Digit.EkycService.dashboard(
        {},
        {
          tenantId: "dl.djb",
          offset: 0,
          limit: 1000,
          surveyorId: surveyor?.owner?.uuid,
        }
      );

      const rows = response?.dashboardInfo?.consumerList || [];

      downloadSurveyorPDF({
        rows: rows,
        surveyorName: fullName,
        vendorName,
        supervisorName,
        employeeId,
        mobileNumber,
        dashboardInfo: response?.dashboardInfo || {},
        t,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data for report download:", err);
    } finally {
      setReportLoading(false);
    }
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

  const StatCard = ({ title, value, type, isLoading, icon }) => (
    <div className={`stat-card ${type}`}>
      {isLoading ? (
        <React.Fragment>
          <div className="stat-title skeleton skeleton-text"></div>
          <div className="stat-value skeleton skeleton-number"></div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {icon && <div className="stat-icon">{icon}</div>}
        </React.Fragment>
      )}
    </div>
  );

  const options = [{ action: "Assign" }, { action: "EKYC_REASSIGN" }];

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    setShowModal(option.action);
  };

  const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId || "dl.djb",
        offset: 0,
        limit: 10000,
        surveyorId: surveyor?.owner?.uuid,
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
        "status", "source", "submittedAt", "assignedAt", "connectionType", "approvedAt",
        "alternateMobileNo", "city", "state", "addressType", "addressProofType", "mrcode",
        "areacode", "verificationStatus", "surveyorId", "supervisorId", "vendorId",
        "assignmentType", "assignmentValue", "assignedTime", "isSelfAssigned", "userType",
        "tenantName", "tenantMobile", "doorPhotoFilestoreId", "panFilestoreId",
        "documentProofFilestoreId", "buildingImageFileStoreId", "propertyDocumentFileStoreId",
        "meterPhotoFileStoreId", "modifiedBy", "zoneCode", "propertyType", "subPropertyCategory"
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
        fatherOrHusbandName: t("FATHER_HUSBUND_NAME"),
        dob: t("DOB"),
        consumerType: t("CONSUMER_TYPE"),
        createdTime: t("CREATED_TIME"),
        lastModifiedTime: t("LAST_MODIFIED_TIME"),
        meterLatitude: t("EKYC_METER_LATITUDE1"),
        meterLongitude: t("EKYC_METER_LONGITUDE1"),
      };

      const skipTitleCase = ["kno", "mobileNumber", "emailId", "email", "pincode", "mrkey", "dob", "createdTime", "lastModifiedTime", "meterLatitude", "meterLongitude"];
      const translatedFields = ["meterMake", "meterLocation"];

      const excelData = consumerList.map((item) => {
        const cleanObj = {};

        const fullName = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
        if (fullName) {
          cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = toTitleCase(fullName);
        }

        Object.keys(item).forEach(key => {
          if (excludedKeys.includes(key)) return;

          let val = item[key];
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

      const cleanFileName = `eKYC_Data_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      Digit.Download.Excel(excelData, cleanFileName);
    } catch (error) {
      console.error("Error downloading eKYC Excel:", error);
    } finally {
      setEkycDownloadLoading(false);
    }
  };

  const closeModal = async () => {
    setShowModal(null);
  };

  return (
    <Card className="surveyor-dashboard">
      {/* Header + Download Report */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-dashboard-header">
          <div className="avatar">{fullName?.charAt(0)?.toUpperCase()}</div>

          <div className="header-content">
            <h2 className="name">{fullName}</h2>

            <div className="designation">{surveyor?.description || t("FIELD_SURVEYOR")}</div>

            {/* <div className="employee-id">
              {t("EMPLOYEE_ID")}: {employeeId}
            </div> */}
          </div>
        </div>

        {/* Download Report — far right */}
        <div className="report-download">
          <button
            className="download-btn"
            disabled={reportLoading}
            onClick={handleDownload}
          >
            {reportLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_REPORT") || "Download Report"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-wrapper">
        <StatCard title={t("TOTAL_ASSIGNED")} value={dashboardData?.dashboardInfo?.total || 0} type="today" isLoading={isDashboardLoading} icon={<FaUsers />} />
        <StatCard title={t("COMPLETED")} value={dashboardData?.dashboardInfo?.completed || 0} type="week" isLoading={isDashboardLoading} icon={<FaCheckCircle />} />
        <StatCard title={t("PENDING")} value={dashboardData?.dashboardInfo?.pending || 0} type="pending" isLoading={isDashboardLoading} icon={<FaClock />} />
        <StatCard title={t("SUBMITTED")} value={dashboardData?.dashboardInfo?.submittedCount || 0} type="month" isLoading={isDashboardLoading} icon={<FaChartLine />} />
      </div>

      {/* Charts */}
      <div className="charts-wrapper">
        {/* Weekly Chart */}
        {/* <div className="chart-card">
          <h3 className="chart-title">{t("WEEKLY_SURVEY_PROGRESS")}</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="completed" fill="#0B2559" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* Pie Chart */}
        {/* <div className="chart-card">
          <h3 className="chart-title">{t("CASE_DISTRIBUTION")}</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div> */}
      </div>

      {/* Details */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-details-wrapper">
          {/* Left side details */}
          <div className="details-left">
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">{t("MOBILE")}</span>
                <span className="value">{surveyor?.owner?.mobileNumber || surveyor?.mobileNo || "N/A"}</span>
              </div>

              <div className="detail-item">
                <span className="label">{t("EMAIL")}</span>
                <span className="value">{surveyor?.owner?.emailId || "N/A"}</span>
              </div>

              <div className="detail-item">
                <span className="label">{t("GENDER")}</span>
                <span className="value">{surveyor?.owner?.gender || "N/A"}</span>
              </div>

              <div className="detail-item">
                <span className="label">{t("STATUS")}</span>
                <span className="value">{surveyor?.status || "N/A"}</span>
              </div>

              {/* <div className="detail-item">
                <span className="label">{t("SERVICE_TYPE")}</span>
                <span className="value">{surveyor?.additionalDetails?.serviceType || "N/A"}</span>
              </div> */}

              <div className="detail-item">
                <span className="label">{t("VENDOR_NAME") || "Vendor Name"}</span>
                <span className="value">{vendorName}</span>
              </div>

              <div className="detail-item">
                <span className="label">{t("SUPERVISOR_NAME") || "Supervisor Name"}</span>
                <span className="value">{supervisorName}</span>
              </div>
            </div>
          </div>

          {/* Right side download card */}
          <div className="details-right">
            <div className="download-card">
              <h4>{t("DOWNLOAD_EKYC_DATA") || "Download eKYC Data"}</h4>
              <p>
                {t("DOWNLOAD_EKYC_DATA_DESC") ||
                  "Export the complete eKYC verification records for your assigned jurisdiction into Excel format."}
              </p>
              <div className="report-download" ref={reportMenuRef}>
                <button
                  className="download-excel-btn"
                  disabled={ekycDownloadLoading}
                  onClick={() => {
                    setShowReportMenu((p) => !p);
                    setShowCustomPicker(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_EXCEL") || "Download Excel"}
                </button>

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
                            <input
                              type="date"
                              value={customDate.from}
                              onChange={(e) => setCustomDate({ ...customDate, from: e.target.value })}
                            />
                          </label>
                          <label>
                            <span>To</span>
                            <input
                              type="date"
                              value={customDate.to}
                              onChange={(e) => setCustomDate({ ...customDate, to: e.target.value })}
                            />
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <Card className="dashboard-card">
        <Table
          t={t}
          tableTitle={t("ASSIGNED_KNOS")}
          tableClass="ekycTable"
          data={dashboardData?.dashboardInfo?.consumerList || []}
          columns={knoColumns}
          isLoading={isDashboardLoading}
          totalRecords={dashboardData?.dashboardInfo?.total}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          showAutoSerialNo={true}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < (dashboardData?.dashboardInfo?.totalPages || 1) - 1) {
              setCurrentPage((prev) => prev + 1);
            }
          }}
          onPrevPage={() => {
            if (currentPage > 0) {
              setCurrentPage((prev) => prev - 1);
            }
          }}
          onFirstPage={() => {
            setCurrentPage(0);
          }}
          onLastPage={() => {
            setCurrentPage(Math.max((dashboardData?.dashboardInfo?.totalPages || 1) - 1, 0));
          }}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </Card>
      {/* Actions */}
      {roles.includes("EKYC_SUPERVISOR") && (
        <ActionBar>
          <SubmitBar label={t("EKYC_ASSIGN_KNOS")} onSubmit={() => setShowOptions((prev) => !prev)} />

          {showOptions && (
            <Menu
              options={options}
              optionKey={"action"}
              t={t}
              onSelect={handleMenuSelect}
              style={{
                color: "#FFFFFF",
                fontSize: "18px",
              }}
            />
          )}
        </ActionBar>
      )}

      {showModal && <AssignEkycModal surveyor={surveyor} isReassign={showModal === "EKYC_REASSIGN"} closeModal={closeModal} refetchDashboard={refetchDashboard} />}
    </Card>
  );
};

export default SurveyorDetailsDashboard;
