import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, Loader, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { downloadSupervisorPDF } from "../utils/reportDownloader";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";

const SupervisorDetailsCard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
  const { id: supervisorId } = useParams();
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  // Fetch all supervisors to get details if assignment progress fails
  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  // Resolve vendorId of this supervisor if available
  const targetVendorId = useMemo(() => {
    const targetId = supervisorId || loggedInUser?.uuid;
    if (!targetId || !supervisorSearchResponse?.supervisors) return null;
    const matchedSup = supervisorSearchResponse.supervisors.find(
      (s) => s.id?.toLowerCase() === targetId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === targetId?.toLowerCase()
    );
    return matchedSup?.vendorId || null;
  }, [supervisorId, loggedInUser, supervisorSearchResponse]);

  // Fetch assignment progress with hierarchy (supervisor and surveyor details)
  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    targetVendorId ? { vendorId: targetVendorId, vendorIds: [targetVendorId] } : {},
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
  );

  // Fetch all surveyors to get details of connected surveyors if assignment progress fails
  const { data: surveyorSearchResponse, isLoading: isSurveyorSearchLoading } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  // Fetch all vendors from DSO search
  const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  const supervisor = useMemo(() => {
    const targetOwnerOrId = supervisorId || loggedInUser?.uuid;
    if (!targetOwnerOrId) return null;

    // Step 0: resolve real supervisor entity id (handles self-login case
    // where we only have the owner/auth uuid, not the supervisor record id)
    let resolvedSupervisorId = supervisorId; // if URL already has entity id, trust it
    if (!resolvedSupervisorId && supervisorSearchResponse?.supervisors && targetOwnerOrId) {
      const selfSup = supervisorSearchResponse.supervisors.find(
        (s) => s.owner?.uuid?.toLowerCase() === targetOwnerOrId?.toLowerCase() || s.id?.toLowerCase() === targetOwnerOrId?.toLowerCase()
      );
      resolvedSupervisorId = selfSup?.id;
    }

    const targetId = resolvedSupervisorId || targetOwnerOrId;

    // 1. Find the supervisor profile from search response
    let matchedSup = null;
    if (supervisorSearchResponse?.supervisors) {
      matchedSup = supervisorSearchResponse.supervisors.find(
        (s) => s.id?.toLowerCase() === targetId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === targetId?.toLowerCase()
      );
    }

    // 2. Find progress report for this supervisor from progressData
    let progressReport = null;
    if (progressData?.supervisorReport && targetId) {
      progressReport = progressData.supervisorReport.find(
        (s) => s.supervisorId?.toLowerCase() === targetId?.toLowerCase() || s.id?.toLowerCase() === targetId?.toLowerCase()
      );
    }

    // 3. If we found the supervisor in search response, enrich and return
    if (matchedSup) {
      const matchedSurveyors = surveyorSearchResponse?.surveyors
        ? surveyorSearchResponse.surveyors
            .filter((surv) => surv.supervisorId === (matchedSup.id || matchedSup.owner?.uuid))
            .map((surv) => {
              let realStats = null;
              if (progressData?.supervisorReport) {
                for (const report of progressData.supervisorReport) {
                  if (
                    report.supervisorId?.toLowerCase() !== matchedSup.id?.toLowerCase() &&
                    report.id?.toLowerCase() !== matchedSup.id?.toLowerCase()
                  )
                    continue;
                  const matchedSurv = report.surveyors?.find(
                    (s) =>
                      (s.surveyorId &&
                        (s.surveyorId?.toLowerCase() === surv.id?.toLowerCase() ||
                          s.surveyorId?.toLowerCase() === surv.owner?.uuid?.toLowerCase())) ||
                      (s.id && (s.id?.toLowerCase() === surv.id?.toLowerCase() || s.id?.toLowerCase() === surv.owner?.uuid?.toLowerCase()))
                  );
                  if (matchedSurv) {
                    realStats = matchedSurv;
                    break;
                  }
                }
              }

              return {
                surveyorId: surv.id || surv.owner?.uuid,
                surveyorName: surv.name || surv.owner?.name || "N/A",
                mobileNo: surv.owner?.mobileNumber || surv.mobileNo || "N/A",
                email: surv.owner?.emailId || "N/A",
                gender: surv.owner?.gender || "N/A",
                status: surv.status || "ACTIVE",
                totalKnos: realStats?.totalKnos || 0,
                submittedKnos: realStats?.submittedKnos || 0,
                pendingKnos: realStats?.pendingKnos || 0,
                progressPercent: realStats?.progressPercent || 0,
              };
            })
        : [];

      const totalKnos = progressReport?.totalKnos || matchedSurveyors.reduce((acc, s) => acc + (s.totalKnos || 0), 0);
      const submittedKnos = progressReport?.submittedKnos || matchedSurveyors.reduce((acc, s) => acc + (s.submittedKnos || 0), 0);
      const pendingKnos = progressReport?.pendingKnos || matchedSurveyors.reduce((acc, s) => acc + (s.pendingKnos || 0), 0);
      const progressPercent = progressReport ? progressReport.progressPercent : totalKnos > 0 ? Math.round((submittedKnos / totalKnos) * 100) : 0;

      return {
        supervisorId: matchedSup.id || matchedSup.owner?.uuid,
        supervisorName: matchedSup.name || matchedSup.owner?.name || "N/A",
        mobileNo: matchedSup.owner?.mobileNumber || matchedSup.mobileNo || "N/A",
        email: matchedSup.owner?.emailId || matchedSup.owner?.email || matchedSup.email || matchedSup.emailId || "N/A",
        gender: matchedSup.owner?.gender || matchedSup.gender || "N/A",
        status: matchedSup.status || "ACTIVE",
        assignedZoneId: matchedSup.assignedZoneId || "N/A",
        vendorId: matchedSup.vendorId,
        surveyors: matchedSurveyors,
        totalKnos,
        submittedKnos,
        pendingKnos,
        progressPercent,
      };
    }

    // 4. Fallback: If not found in search response, but we have progressData report, return it and enrich with loggedInUser details
    if (progressReport) {
      const isSelf = targetId?.toLowerCase() === loggedInUser?.uuid?.toLowerCase();
      const supervisorName = isSelf ? loggedInUser?.name || progressReport.supervisorName || "N/A" : progressReport.supervisorName || "N/A";
      const mobileNo = isSelf ? loggedInUser?.mobileNumber || progressReport.mobileNo || "N/A" : progressReport.mobileNo || "N/A";

      const matchedSupForFallback = supervisorSearchResponse?.supervisors?.find(
        (s) =>
          s.id?.toLowerCase() === (progressReport.supervisorId || progressReport.id)?.toLowerCase() ||
          s.owner?.uuid?.toLowerCase() === (progressReport.supervisorId || progressReport.id)?.toLowerCase()
      );

      const email =
        matchedSupForFallback?.owner?.emailId ||
        matchedSupForFallback?.owner?.email ||
        matchedSupForFallback?.email ||
        (isSelf ? loggedInUser?.emailId : null) ||
        progressReport.email ||
        "N/A";
      const gender =
        matchedSupForFallback?.owner?.gender ||
        matchedSupForFallback?.gender ||
        (isSelf ? loggedInUser?.gender : null) ||
        progressReport.gender ||
        "N/A";

      const surveyorsMapped = progressReport.surveyors
        ? progressReport.surveyors.map((surv) => {
            const matchedSurv = surveyorSearchResponse?.surveyors?.find(
              (s) => s.id?.toLowerCase() === surv.surveyorId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === surv.surveyorId?.toLowerCase()
            );

            return {
              surveyorId: surv.surveyorId || surv.id,
              surveyorName: matchedSurv?.name || matchedSurv?.owner?.name || surv.surveyorName || "N/A",
              mobileNo: matchedSurv?.owner?.mobileNumber || matchedSurv?.mobileNo || surv.mobileNo || "N/A",
              email: matchedSurv?.owner?.emailId || matchedSurv?.owner?.email || matchedSurv?.email || surv.email || "N/A",
              gender: matchedSurv?.owner?.gender || matchedSurv?.gender || surv.gender || "N/A",
              status: matchedSurv?.status || surv.status || "ACTIVE",
              totalKnos: surv.totalKnos || 0,
              submittedKnos: surv.submittedKnos || 0,
              pendingKnos: surv.pendingKnos || 0,
              progressPercent: surv.progressPercent || 0,
            };
          })
        : [];

      return {
        supervisorId: progressReport.supervisorId || progressReport.id,
        supervisorName,
        mobileNo,
        email,
        gender,
        status: progressReport.status || "ACTIVE",
        assignedZoneId: progressReport.assignedZoneId || "N/A",
        vendorId: progressReport.vendorId,
        surveyors: surveyorsMapped,
        totalKnos: progressReport.totalKnos || 0,
        submittedKnos: progressReport.submittedKnos || 0,
        pendingKnos: progressReport.pendingKnos || 0,
        progressPercent: progressReport.progressPercent || 0,
      };
    }

    return null;
  }, [progressData, supervisorSearchResponse, surveyorSearchResponse, supervisorId, loggedInUser]);

  const fullName = supervisor?.supervisorName || "N/A";
  const mobileNumber = supervisor?.mobileNo || "N/A";
  const email = supervisor?.email || (supervisor?.supervisorId === loggedInUser?.uuid ? loggedInUser?.emailId : null) || "N/A";
  const gender = supervisor?.gender || (supervisor?.supervisorId === loggedInUser?.uuid ? loggedInUser?.gender : null) || "N/A";
  const status = supervisor?.status || "N/A";
  const assignedZone = supervisor?.assignedZoneId || "N/A";

  const vendorName = useMemo(() => {
    if (!vendorSearchResponse || !supervisor) return "N/A";
    const targetVendorId = supervisor.vendorId;
    if (!targetVendorId) return "N/A";
    const matchedVendor = vendorSearchResponse.find(
      (v) =>
        v.dsoDetails?.id === targetVendorId || v.dsoDetails?.vendorId === targetVendorId || v.id === targetVendorId || v.vendorId === targetVendorId
    );
    return matchedVendor?.dsoDetails?.name || matchedVendor?.name || "N/A";
  }, [vendorSearchResponse, supervisor]);

  const surveyors = useMemo(() => {
    return supervisor?.surveyors || [];
  }, [supervisor]);

  const cards = useMemo(
    () => [
      {
        label: "TOTAL_EKYC_APPLICATIONS",
        count: supervisor?.totalKnos || 0,
        color: "#0B2559",
        type: "today",
        icon: <FaUsers />,
      },
      {
        label: "EKYC_COMPLETED",
        count: supervisor?.submittedKnos || 0,
        color: "#10B981",
        type: "month",
        icon: <FaCheckCircle />,
      },
      {
        label: "PENDING_APPLICATIONS",
        count: supervisor?.pendingKnos || 0,
        color: "#F59E0B",
        type: "pending",
        icon: <FaClock />,
      },
      {
        label: "OVERALL_PROGRESS",
        count: `${supervisor?.progressPercent || 0}%`,
        color: "#A855F7",
        type: "progress",
        icon: <FaChartLine />,
      },
    ],
    [supervisor]
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const paginatedSurveyors = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return surveyors.slice(start, end);
  }, [surveyors, currentPage, pageSize]);

  const surveyorColumns = useMemo(
    () => [
      {
        Header: t("SURVEYOR_NAME") || "Surveyor Name",
        accessor: (row) => row?.surveyorName || "N/A",
        Cell: ({ row }) => {
          const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";
          const targetPath = `/digit-ui/${userType}/ekyc/surveyor-dashboard/${row.original.surveyorId}`;
          return (
            <a
              href={targetPath}
              style={{ color: "#1D70B8", fontWeight: "600", textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                history.push(targetPath);
              }}
            >
              {row.original?.surveyorName || "N/A"}
            </a>
          );
        },
      },
      {
        Header: t("MOBILE_NUMBER") || "Mobile Number",
        accessor: (row) => row?.mobileNo || "N/A",
        id: "mobileNumber",
      },
      {
        Header: t("STATUS") || "Status",
        accessor: () => "ACTIVE",
        id: "status",
        Cell: ({ value }) => <span className={`status-badge verified`}>{t(value) || value}</span>,
      },
      {
        Header: t("TOTAL_EKYC_APPLICATIONS") || "Total eKYC Applications",
        accessor: (row) => row?.totalKnos || 0,
        id: "totalEkycApplications",
      },
      {
        Header: t("EKYC_COMPLETED") || "eKYC Completed",
        accessor: (row) => row?.submittedKnos || 0,
        id: "ekycCompleted",
      },
      {
        Header: t("PENDING_APPLICATIONS") || "Pending Applications",
        accessor: (row) => row?.pendingKnos || 0,
        id: "pendingApplications",
      },
      {
        Header: t("OVERALL_PROGRESS") || "Overall Progress",
        accessor: (row) => `${row?.progressPercent || 0}%`,
        id: "overallProgress",
      },
    ],
    [t, history]
  );

  // Report Download logic
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

  const handleDownload = () => {
    setReportLoading(true);
    try {
      const rowsWithStats = surveyors.map((s) => ({
        name: s.surveyorName,
        mobileNo: s.mobileNo,
        status: s.status,
        total: s.totalKnos,
        completed: s.submittedKnos,
        pending: s.pendingKnos,
        progress: `${s.progressPercent}%`,
      }));

      const totalKnos = supervisor?.totalKnos || 0;
      const completedKnos = supervisor?.submittedKnos || 0;

      downloadSupervisorPDF({
        rows: rowsWithStats,
        supervisorName: fullName,
        vendorName,
        mobileNumber,
        email,
        dashboardInfo: {
          total: totalKnos,
          completed: completedKnos,
          pending: totalKnos - completedKnos,
          submittedCount: completedKnos,
        },
        t,
      });
    } catch (err) {
      console.error("Failed to generate supervisor report:", err);
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

  const handleDownloadEkycData = async (fromDate, toDate) => {
    if (!surveyors || surveyors.length === 0) {
      alert(t("NO_SURVEYORS_ASSIGNED") || "No surveyors assigned to this supervisor.");
      return;
    }

    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId || "dl.djb",
        offset: 0,
        limit: 10000,
        supervisorId: supervisor?.supervisorId || supervisorId,
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

        const fullName = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
        if (fullName) {
          cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = toTitleCase(fullName);
        }

        Object.keys(item).forEach((key) => {
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

      const cleanFileName = `eKYC_Data_Supervisor_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
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

  const isPageLoading = isProgressLoading || isSupervisorSearchLoading || isSurveyorSearchLoading || isVendorSearchLoading;

  if (isPageLoading && !supervisor) {
    return <Loader />;
  }

  if (!supervisor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_SUPERVISOR_FOUND")}</div>
      </Card>
    );
  }

  return (
    <Card className="surveyor-dashboard">
      {/* Header + Download Report */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-dashboard-header">
          <div className="avatar">{fullName?.charAt(0)?.toUpperCase()}</div>

          <div className="header-content">
            <h2 className="name">{fullName}</h2>
            <div className="designation">{t("FIELD_SUPERVISOR") || "Field Supervisor"}</div>
          </div>
        </div>

        {/* Download Report — far right */}
        <div className="report-download">
          <button className="download-btn" disabled={reportLoading} onClick={handleDownload}>
            {reportLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_REPORT") || "Download Report"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-wrapper">
        {cards.map((card, idx) => (
          <StatCard key={idx} title={t(card.label)} value={card.count} type={card.type} isLoading={isProgressLoading} icon={card.icon} />
        ))}
      </div>

      {/* Details */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-details-wrapper">
          {/* Top Row: Mobile, Email, and Download eKYC Data */}
          <div className="details-top-row">
            <div className="detail-item">
              <span className="label">{t("MOBILE")}</span>
              <span className="value">{mobileNumber}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("EMAIL")}</span>
              <span className="value">{email}</span>
            </div>

            <div className="download-card">
              <div>
                <h4>{t("DOWNLOAD_EKYC_DATA") || "Download eKYC Data"}</h4>
                <p>
                  {t("DOWNLOAD_EKYC_DATA_DESC") || "Export the complete eKYC verification records for your assigned jurisdiction into Excel format."}
                </p>
              </div>
              <div className="report-download" ref={reportMenuRef}>
                <button
                  className="download-excel-btn"
                  disabled={ekycDownloadLoading}
                  onClick={() => {
                    setShowReportMenu((p) => !p);
                    setShowCustomPicker(false);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
              </div>
            </div>
          </div>

          {/* Bottom Row: Remaining Details */}
          <div className="details-grid-row">
            <div className="detail-item">
              <span className="label">{t("GENDER")}</span>
              <span className="value">{t(gender) || gender}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("STATUS")}</span>
              <span className="value">{status}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("ASSIGNED_ZONE") || "Assigned Zone"}</span>
              <span className="value">
                {assignedZone && assignedZone !== "N/A" ? (
                  <div className="selected-zones" style={{ marginTop: "4px" }}>
                    <span className="selected-zone-chip">{t(assignedZone.trim().toUpperCase()) || assignedZone}</span>
                  </div>
                ) : (
                  assignedZone
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="label">{t("VENDOR_NAME") || "Vendor Name"}</span>
              <span className="value">{vendorName}</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="dashboard-card">
        <Table
          t={t}
          tableTitle={t("CONNECTED_SURVEYORS") || "Connected Surveyors"}
          tableClass="ekycTable"
          isTableScrollable={true}
          data={paginatedSurveyors}
          columns={surveyorColumns}
          isLoading={isProgressLoading}
          totalRecords={surveyors.length}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < Math.ceil(surveyors.length / pageSize) - 1) {
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
            setCurrentPage(Math.max(Math.ceil(surveyors.length / pageSize) - 1, 0));
          }}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </Card>
    </Card>
  );
};

export default SupervisorDetailsCard;
