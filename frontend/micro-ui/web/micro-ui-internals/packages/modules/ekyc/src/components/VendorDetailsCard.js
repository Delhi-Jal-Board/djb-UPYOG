import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, Loader, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { ekycMockData } from "./mockData";
import { downloadVendorPDF } from "../utils/reportDownloader";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine, FaMapMarkedAlt } from "react-icons/fa";

const VendorDetailsCard = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
    const { vendorId } = useParams();

    // Fetch assignment progress with hierarchy (supervisor and surveyor details)
    const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress({
        enabled: !!tenantId,
        keepPreviousData: true,
    });

    // Fetch all vendors from DSO search
    const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    // Fetch all supervisors to filter by vendor
    const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    const loggedInUser = Digit.SessionStorage.get("User")?.info;

    // Match vendor details
    const vendor = useMemo(() => {
        const userUuid = loggedInUser?.uuid;
        const userMobile = loggedInUser?.mobileNumber;

        // Helper to check if a vendor matches the logged in user
        const matchesUser = (v) => {
            const ownerUuid = v.owner?.uuid || v.owner?.id;
            const ownerMobile = v.owner?.mobileNumber || v.mobileNumber;
            return (userUuid && ownerUuid === userUuid) || (userMobile && ownerMobile === userMobile);
        };

        // Find in real API search first
        if (vendorSearchResponse) {
            if (vendorId) {
                const matched = vendorSearchResponse.find(
                    (v) => v.dsoDetails?.id === vendorId || v.dsoDetails?.vendorId === vendorId || v.id === vendorId || v.vendorId === vendorId
                );
                if (matched) return matched.dsoDetails || matched;
            } else {
                // Try matching logged in user
                const matched = vendorSearchResponse.find((v) => matchesUser(v.dsoDetails || v));
                if (matched) return matched.dsoDetails || matched;
                // Default to first vendor if no match found
                if (vendorSearchResponse.length > 0) return vendorSearchResponse[0].dsoDetails || vendorSearchResponse[0];
            }
        }

        // Fall back to ekycMockData vendors
        if (vendorId) {
            return ekycMockData.vendors.find((v) => v.id === Number(vendorId) || v.name === vendorId) || ekycMockData.vendors[0];
        } else {
            // Match mock vendor with user name or return first
            const matchedMock = ekycMockData.vendors.find((v) => v.name?.toLowerCase() === loggedInUser?.name?.toLowerCase());
            return matchedMock || ekycMockData.vendors[0];
        }
    }, [vendorSearchResponse, vendorId, loggedInUser]);

    // Supervisors belonging to this vendor
    const vendorSupervisors = useMemo(() => {
        if (!supervisorSearchResponse?.supervisors) {
            // Mock fallback if supervisors count is present
            if (vendor && Array.isArray(ekycMockData.vendors)) {
                // Return dummy supervisors based on vendor name or id
                const mockSupList = Array.from({ length: vendor.supervisors || 5 }, (_, i) => ({
                    id: `SUP_V_${vendor.id || 1}_${i}`,
                    name: `Supervisor ${i + 1} (${vendor.name})`,
                    mobileNo: `99999120${i}`,
                    status: "ACTIVE",
                    totalKnos: Math.round(1000 + Math.random() * 4000),
                    submittedKnos: Math.round(500 + Math.random() * 2000),
                    pendingKnos: Math.round(200 + Math.random() * 1000),
                    progressPercent: Math.round(40 + Math.random() * 50),
                }));
                return mockSupList;
            }
            return [];
        }

        // Filter real supervisors belonging to this vendor
        const currentVendorId = vendor?.id || vendor?.vendorId || vendorId;
        const matchedSups = supervisorSearchResponse.supervisors.filter(
            (s) => s.vendorId === currentVendorId
        );

        return matchedSups.map((sup) => {
            // Find progress report for this supervisor in progressData
            const report = progressData?.supervisorReport?.find(
                (r) => r.supervisorId === sup.id || r.supervisorId === sup.owner?.uuid
            );

            return {
                id: sup.id || sup.owner?.uuid,
                name: sup.name || sup.owner?.name || "N/A",
                mobileNo: sup.owner?.mobileNumber || sup.mobileNo || "N/A",
                status: sup.status || "ACTIVE",
                totalKnos: report?.totalKnos || 0,
                submittedKnos: report?.submittedKnos || 0,
                pendingKnos: report?.pendingKnos || 0,
                progressPercent: report?.progressPercent || 0,
            };
        });
    }, [supervisorSearchResponse, vendor, progressData, vendorId]);

    const vendorName = vendor?.name || "N/A";
    const mobileNumber = vendor?.mobileNumber || vendor?.owner?.mobileNumber || "N/A";
    const email = vendor?.owner?.emailId || "N/A";
    const status = vendor ? "ACTIVE" : "N/A";
    const jurisdictions = useMemo(() => {
        if (Array.isArray(vendor?.jurisdictions)) {
            return vendor.jurisdictions.join(", ");
        }
        return "N/A";
    }, [vendor]);

    // KPI stats calculation
    const cards = useMemo(() => {
        const hasRealData = vendorSupervisors.some((s) => s.totalKnos > 0);

        const totalKnos = hasRealData 
            ? vendorSupervisors.reduce((acc, s) => acc + (s.totalKnos || 0), 0)
            : (progressData?.totalKnos || vendor?.assignedConnections || 0);

        const completedKnos = hasRealData
            ? vendorSupervisors.reduce((acc, s) => acc + (s.submittedKnos || 0), 0)
            : (progressData?.completedKnos || vendor?.completedEkyc || 0);

        const pendingKnos = hasRealData
            ? vendorSupervisors.reduce((acc, s) => acc + (s.pendingKnos || 0), 0)
            : (totalKnos - completedKnos);

        const progressPercent = totalKnos > 0 ? Math.round((completedKnos / totalKnos) * 100) : (vendor?.progress || 0);

        return [
            {
                label: "TOTAL_EKYC_APPLICATIONS",
                count: totalKnos,
                color: "#0B2559",
                type: "today",
                icon: <FaUsers />,
            },
            {
                label: "TOTAL_ASSIGNMENTS",
                count: totalKnos,
                color: "#3B82F6",
                type: "week",
                icon: <FaMapMarkedAlt />,
            },
            {
                label: "EKYC_COMPLETED",
                count: completedKnos,
                color: "#10B981",
                type: "month",
                icon: <FaCheckCircle />,
            },
            {
                label: "PENDING_APPLICATIONS",
                count: pendingKnos,
                color: "#F59E0B",
                type: "pending",
                icon: <FaClock />,
            },
            {
                label: "OVERALL_PROGRESS",
                count: `${progressPercent}%`,
                color: "#A855F7",
                type: "progress",
                icon: <FaChartLine />,
            },
        ];
    }, [vendorSupervisors, vendor, progressData]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

    const handleDownloadEkycData = async () => {
        setEkycDownloadLoading(true);
        try {
            const response = await Digit.EkycService.application_list({
                tenantId: tenantId,
                offset: 0,
                limit: 10000,
                reportDownload: true
            });

            const consumerList = response?.consumerList || [];
            
            if (!consumerList || consumerList.length === 0) {
                alert(t("NO_EKYC_DATA_FOUND") || "No eKYC data found to download.");
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

            const cleanFileName = `eKYC_Data_${vendorName.replace(/[^a-zA-Z0-9]/g, "_")}`;
            Digit.Download.Excel(excelData, cleanFileName);
        } catch (error) {
            console.error("Failed to download eKYC data:", error);
            alert(t("EKYC_DOWNLOAD_FAILED") || "Failed to download eKYC data. Please try again.");
        } finally {
            setEkycDownloadLoading(false);
        }
    };

    const paginatedSupervisors = useMemo(() => {
        const start = currentPage * pageSize;
        const end = start + pageSize;
        return vendorSupervisors.slice(start, end);
    }, [vendorSupervisors, currentPage, pageSize]);

    const supervisorColumns = useMemo(
        () => [
            {
                Header: t("SUPERVISOR_NAME") || "Supervisor Name",
                accessor: (row) => row?.name || "N/A",
                Cell: ({ row }) => (
                    <a
                        href={`/digit-ui/employee/ekyc/assign/surveyor-details/${row.original.id}`}
                        style={{ color: "#1D70B8", fontWeight: "600", textDecoration: "none" }}
                        onClick={(e) => {
                            // If user is employee or citizen, route properly
                            const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";
                            e.preventDefault();
                            history.push(`/digit-ui/${userType}/ekyc/assign/surveyor-details/${row.original.id}`);
                        }}
                    >
                        {row.original?.name || "N/A"}
                    </a>
                ),
            },
            {
                Header: t("MOBILE_NUMBER") || "Mobile Number",
                accessor: (row) => row?.mobileNo || "N/A",
                id: "mobileNumber",
            },
            {
                Header: t("STATUS") || "Status",
                accessor: (row) => row?.status || "ACTIVE",
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
                accessor: (row) => `${row?.progressPercent || row?.progressPercent === 0 ? row.progressPercent : row.progress}%`,
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

    const handleDownload = () => {
        setReportLoading(true);
        try {
            const rowsWithStats = vendorSupervisors.map((s) => ({
                name: s.name,
                mobileNo: s.mobileNo,
                status: s.status,
                total: s.totalKnos,
                completed: s.submittedKnos,
                pending: s.pendingKnos,
                progress: `${s.progressPercent}%`
            }));

            const totalKnos = vendorSupervisors.reduce((acc, s) => acc + (s.totalKnos || 0), 0) || vendor?.assignedConnections || 0;
            const completedKnos = vendorSupervisors.reduce((acc, s) => acc + (s.submittedKnos || 0), 0) || vendor?.completedEkyc || 0;

            downloadVendorPDF({
                rows: rowsWithStats,
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
            console.error("Failed to generate report:", err);
        } finally {
            setReportLoading(false);
            setShowReportMenu(false);
            setShowCustomPicker(false);
        }
    };

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

    const isPageLoading = isProgressLoading || isVendorSearchLoading || isSupervisorSearchLoading;

    if (isPageLoading && !vendor) {
        return <Loader />;
    }

    if (!vendor) {
        return (
            <Card>
                <div style={{ padding: "24px" }}>{t("NO_VENDOR_FOUND") || "No Vendor Found"}</div>
            </Card>
        );
    }

    return (
        <Card className="surveyor-dashboard">
            {/* Header + Download Report */}
            <div className="ekyc-dashboard-section">
                <div className="ekyc-dashboard-header">
                    <div className="avatar">{vendorName?.charAt(0)?.toUpperCase()}</div>

                    <div className="header-content">
                        <h2 className="name">{vendorName}</h2>
                        <div className="designation">{t("VENDOR_AGENCY") || "Agency / Vendor"}</div>
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
                {
                cards.map((card, idx) => (
                    <StatCard
                        key={idx}
                        title={t(card.label)}
                        value={card.count}
                        type={card.type}
                        isLoading={isPageLoading}
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
                                <span className="label">{t("STATUS")}</span>
                                <span className="value">{status}</span>
                            </div>

                            <div className="detail-item">
                                <span className="label">{t("JURISDICTIONS") || "Jurisdictions"}</span>
                                <span className="value">{jurisdictions}</span>
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
                    tableTitle={t("CONNECTED_SUPERVISORS") || "Connected Supervisors"}
                    tableClass="ekycTable"
                    data={paginatedSupervisors}
                    columns={supervisorColumns}
                    isLoading={isPageLoading}
                    totalRecords={vendorSupervisors.length}
                    currentPage={currentPage}
                    pageSizeLimit={pageSize}
                    isPaginationRequired={true}
                    onNextPage={() => {
                        if (currentPage < Math.ceil(vendorSupervisors.length / pageSize) - 1) {
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
                        setCurrentPage(Math.max(Math.ceil(vendorSupervisors.length / pageSize) - 1, 0));
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

export default VendorDetailsCard;
