import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, Loader, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { downloadSupervisorPDF } from "../utils/reportDownloader";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine, FaMapMarkedAlt } from "react-icons/fa";

const SupervisorDetailsCard = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
    const { id: supervisorId } = useParams();
    const loggedInUser = Digit.SessionStorage.get("User")?.info;
    const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

    // Fetch assignment progress with hierarchy (supervisor and surveyor details)
    const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress({
        enabled: !!tenantId,
        keepPreviousData: true,
    });

    // Fetch all supervisors to get details if assignment progress fails
    const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    // Fetch all surveyors to get details of connected surveyors if assignment progress fails
    const { data: surveyorSearchResponse, isLoading: isSurveyorSearchLoading } = Digit.Hooks.fsm.useSurveyorSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    // Fetch all vendors from DSO search
    const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    const supervisor = useMemo(() => {
        // 1. Try to get supervisor from progressData if it succeeded
        if (progressData?.supervisorReport) {
            let found = null;
            if (supervisorId) {
                found = progressData.supervisorReport.find((s) => s.supervisorId === supervisorId);
            } else {
                const userUuid = loggedInUser?.uuid;
                if (userUuid) {
                    found = progressData.supervisorReport.find((s) => s.supervisorId === userUuid);
                }
            }
            if (found) return found;
        }

        // 2. Fallback to supervisorSearchResponse
        if (supervisorSearchResponse?.supervisors) {
            let matchedSup = null;
            if (supervisorId) {
                matchedSup = supervisorSearchResponse.supervisors.find(
                    (s) => s.id === supervisorId || s.owner?.uuid === supervisorId
                );
            } else {
                const userUuid = loggedInUser?.uuid;
                if (userUuid) {
                    matchedSup = supervisorSearchResponse.supervisors.find(
                        (s) => s.id === userUuid || s.owner?.uuid === userUuid
                    );
                }
            }

            if (matchedSup) {
                // Find surveyors belonging to this supervisor from surveyorSearchResponse
                const matchedSurveyors = surveyorSearchResponse?.surveyors
                    ? surveyorSearchResponse.surveyors
                        .filter((surv) => surv.supervisorId === (matchedSup.id || matchedSup.owner?.uuid))
                        .map((surv) => ({
                            surveyorId: surv.id || surv.owner?.uuid,
                            surveyorName: surv.name || surv.owner?.name || "N/A",
                            mobileNo: surv.owner?.mobileNumber || surv.mobileNo || "N/A",
                            status: surv.status || "ACTIVE",
                            totalKnos: 0,
                            submittedKnos: 0,
                            pendingKnos: 0,
                            progressPercent: 0,
                        }))
                    : [];

                return {
                    supervisorId: matchedSup.id || matchedSup.owner?.uuid,
                    supervisorName: matchedSup.name || matchedSup.owner?.name || "N/A",
                    mobileNo: matchedSup.owner?.mobileNumber || matchedSup.mobileNo || "N/A",
                    status: matchedSup.status || "ACTIVE",
                    assignedZoneId: matchedSup.assignedZoneId || "N/A",
                    vendorId: matchedSup.vendorId,
                    surveyors: matchedSurveyors,
                };
            }
        }

        return null;
    }, [progressData, supervisorSearchResponse, surveyorSearchResponse, supervisorId, loggedInUser?.uuid]);

    const fullName = supervisor?.supervisorName || "N/A";
    const mobileNumber = supervisor?.mobileNo || "N/A";
    const email = loggedInUser?.emailId || "N/A";
    const gender = loggedInUser?.gender || "N/A";
    const status = supervisor?.status || "N/A";
    const assignedZone = supervisor?.assignedZoneId || "N/A";

    const vendorName = useMemo(() => {
        if (!vendorSearchResponse || !supervisor) return "N/A";
        const targetVendorId = supervisor.vendorId;
        if (!targetVendorId) return "N/A";
        const matchedVendor = vendorSearchResponse.find(
            (v) => v.dsoDetails?.id === targetVendorId || v.dsoDetails?.vendorId === targetVendorId || v.id === targetVendorId || v.vendorId === targetVendorId
        );
        return matchedVendor?.dsoDetails?.name || matchedVendor?.name || "N/A";
    }, [vendorSearchResponse, supervisor]);

    const surveyors = useMemo(() => {
        return supervisor?.surveyors || [];
    }, [supervisor]);

    const cards = useMemo(() => [
        {
            label: "TOTAL_EKYC_APPLICATIONS",
            count: progressData?.totalKnos || supervisor?.totalKnos || 0,
            color: "#0B2559",
            type: "today",
            icon: <FaUsers />,
        },
        // {
        //     label: "TOTAL_ASSIGNMENTS",
        //     count: progressData?.totalAssignments || supervisor?.totalKnos || 0,
        //     color: "#3B82F6",
        //     type: "week",
        //     icon: <FaMapMarkedAlt />,
        // },
        {
            label: "EKYC_COMPLETED",
            count: progressData?.completedKnos || supervisor?.submittedKnos || 0,
            color: "#10B981",
            type: "month",
            icon: <FaCheckCircle />,
        },
        {
            label: "PENDING_APPLICATIONS",
            count: (progressData?.totalKnos || supervisor?.totalKnos || 0) - (progressData?.completedKnos || supervisor?.submittedKnos || 0),
            color: "#F59E0B",
            type: "pending",
            icon: <FaClock />,
        },
        {
            label: "OVERALL_PROGRESS",
            count: `${progressData?.overallProgressPercent || supervisor?.progressPercent || 0}%`,
            color: "#A855F7",
            type: "progress",
            icon: <FaChartLine />,
        },
    ], [progressData, supervisor]);

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
                    const targetPath = `/digit-ui/${userType}/ekyc/surveyor-dashboard/${row.original.surveyorId}`
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
                Cell: ({ value }) => (
                    <span className={`status-badge verified`}>
                        {t(value) || value}
                    </span>
                ),
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
            }
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

    // const handleDownload = () => {
    //     setReportLoading(true);
    //     try {
    //         const rowsWithStats = surveyors.map((s) => ({
    //             name: s.surveyorName,
    //             mobileNo: s.mobileNo,
    //             status: "ACTIVE",
    //             total: s.totalKnos,
    //             completed: s.submittedKnos,
    //             pending: s.pendingKnos,
    //             progress: `${s.progressPercent}%`
    //         }));

    //         downloadSupervisorPDF({
    //             rows: rowsWithStats,
    //             supervisorName: fullName,
    //             mobileNumber,
    //             vendorName,
    //             dashboardInfo: {
    //                 total: supervisor?.totalKnos || 0,
    //                 completed: supervisor?.submittedKnos || 0,
    //                 pending: supervisor?.pendingKnos || 0,
    //                 submittedCount: supervisor?.submittedKnos || 0,
    //             },
    //             t,
    //         });
    //     } catch (err) {
    //         console.error("Failed to generate report:", err);
    //     } finally {
    //         setReportLoading(false);
    //         setShowReportMenu(false);
    //         setShowCustomPicker(false);
    //     }
    // };

    const handlePresetDownload = (filter) => {
        handleDownload();
    };

    const handleCustomDownload = () => {
        if (!customDate.from || !customDate.to) {
            alert(t("SELECT_DATE_RANGE") || "Please select both From and To dates.");
            return;
        }
        handleDownload();
    };

    const handleDownloadEkycData = async () => {
        if (!surveyors || surveyors.length === 0) {
            alert(t("NO_SURVEYORS_ASSIGNED") || "No surveyors assigned to this supervisor.");
            return;
        }

        setEkycDownloadLoading(true);
        try {
            // Fetch for each surveyor under this supervisor in parallel
            const fetchPromises = surveyors.map(s =>
                Digit.EkycService.application_list({
                    tenantId: tenantId || "dl.djb",
                    offset: 0,
                    limit: 5000,
                    surveyorId: s.surveyorId || s.id,
                    reportDownload: true
                }).catch(err => {
                    console.error(`Error fetching applications for surveyor ${s.surveyorName}:`, err);
                    return { consumerList: [] };
                })
            );

            const results = await Promise.all(fetchPromises);
            const consumerList = results.flatMap(res => res?.consumerList || []);

            if (consumerList.length === 0) {
                alert(t("NO_DATA_FOUND") || "No data found for download.");
                return;
            }

            const excludedKeys = [
                "status", "source", "submittedAt", "assignedAt", "connectionType", "approvedAt",
                "alternateMobileNo", "city", "state", "addressType", "addressProofType", "mrcode",
                "areacode", "verificationStatus", "surveyorId", "supervisorId", "vendorId",
                "assignmentType", "assignmentValue", "assignedTime", "isSelfAssigned", "userType",
                "tenantName", "tenantMobile"
            ];

            const headerMapping = {
                kno: t("KNO") || "KNO",
                firstName: t("FIRST_NAME") || "First Name",
                middleName: t("MIDDLE_NAME") || "Middle Name",
                lastName: t("LAST_NAME") || "Last Name",
                gender: t("GENDER") || "Gender",
                mobileNumber: t("MOBILE_NUMBER") || "Mobile Number",
                emailId: t("EMAIL_ID") || "Email ID",
                fatherOrHusbandName: t("FATHER_HUSBUND_NAME") || "Father/Husband Name",
                relationship: t("RELATIONSHIP") || "Relationship",
                dob: t("DOB") || "Date of Birth",
                ekycStatus: t("EKYC_STATUS") || "eKYC Status",
                zoneName: t("ZONE") || "Zone",
                assembly: t("ASSEMBLY") || "Assembly",
                ward: t("WARD") || "Ward",
                pincode: t("PINCODE") || "Pincode",
                mrkey: t("MR_KEY") || "MR Key",
                createdTime: t("CREATED_TIME") || "Created Time",
                lastModifiedTime: t("LAST_MODIFIED_TIME") || "Last Modified Time",
            };

            const excelData = consumerList.map((item) => {
                const cleanObj = {};

                const fullName = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
                if (fullName) {
                    cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = fullName;
                }

                Object.keys(item).forEach(key => {
                    if (excludedKeys.includes(key)) return;

                    const val = item[key];
                    if (typeof val === "object" && val !== null) {
                        return;
                    }

                    const friendlyHeader = headerMapping[key] || t(key.toUpperCase()) || key;
                    cleanObj[friendlyHeader] = val;
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
                <div className="report-download" ref={reportMenuRef}>
                    <button
                        className="download-btn"
                        disabled={reportLoading}
                        onClick={() => {
                            setShowReportMenu((p) => !p);
                            setShowCustomPicker(false);
                        }}
                    >
                        {reportLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_REPORT") || "Download Report"}
                    </button>

                    {showReportMenu && (
                        <div className="report-menu">
                            {[
                                { label: t("TODAY") || "Today", key: "today" },
                                { label: t("THIS_WEEK") || "This Week", key: "week" },
                                { label: t("THIS_MONTH") || "This Month", key: "month" },
                            ].map(({ label, key }) => (
                                <div
                                    key={key}
                                    className="menu-item"
                                    onClick={() => handlePresetDownload(key)}
                                >
                                    {label}
                                </div>
                            ))}

                            <div
                                className="custom-date-trigger"
                                onClick={() => setShowCustomPicker((p) => !p)}
                            >
                                {t("CUSTOM_DATE") || "Custom Date"}
                            </div>

                            {showCustomPicker && (
                                <div className="custom-picker">
                                    <div className="date-field">
                                        <label className="date-label">
                                            {t("FROM_DATE") || "From"}
                                        </label>
                                        <input
                                            type="date"
                                            className="date-input"
                                            value={customDate.from}
                                            onChange={(e) =>
                                                setCustomDate((d) => ({ ...d, from: e.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="date-field">
                                        <label className="date-label">
                                            {t("TO_DATE") || "To"}
                                        </label>
                                        <input
                                            type="date"
                                            className="date-input"
                                            value={customDate.to}
                                            onChange={(e) =>
                                                setCustomDate((d) => ({ ...d, to: e.target.value }))
                                            }
                                        />
                                    </div>

                                    <button
                                        className="download-action-btn"
                                        onClick={handleCustomDownload}
                                    >
                                        {t("DOWNLOAD") || "Download"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-wrapper">
                {cards.map((card, idx) => (
                    <StatCard
                        key={idx}
                        title={t(card.label)}
                        value={card.count}
                        type={card.type}
                        isLoading={isProgressLoading}
                        icon={card.icon}
                    />
                ))}
            </div>

            {/* Details */}
            <div className="ekyc-dashboard-section">
                <div className="ekyc-details-wrapper">
                    {/* Left side details */}
                    <div className="details-left">
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="label">{t("MOBILE")}</span>
                                <span className="value">{mobileNumber}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("EMAIL")}</span>
                                <span className="value">{email}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("GENDER")}</span>
                                <span className="value">{gender}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("STATUS")}</span>
                                <span className="value">{status}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("ASSIGNED_ZONE") || "Assigned Zone"}</span>
                                <span className="value">{assignedZone}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("VENDOR_NAME") || "Vendor Name"}</span>
                                <span className="value">{vendorName}</span>
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
                            <button
                                className="download-excel-btn"
                                disabled={ekycDownloadLoading}
                                onClick={handleDownloadEkycData}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_EXCEL") || "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="dashboard-card">
                <Table
                    t={t}
                    tableTitle={t("CONNECTED_SURVEYORS") || "Connected Surveyors"}
                    tableClass="ekycTable"
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