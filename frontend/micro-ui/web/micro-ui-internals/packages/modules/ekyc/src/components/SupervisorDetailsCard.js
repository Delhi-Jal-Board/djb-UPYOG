import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, Loader, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { downloadSupervisorPDF } from "../utils/reportDownloader";

const SurveyorStatsCell = ({ surveyorId, type }) => {
    const { data, isLoading } = Digit.Hooks.ekyc.useEkycSurveyorDashboard(
        {},
        {
            tenantId: "dl.djb",
            offset: 0,
            limit: 1,
            surveyorId: surveyorId,
        },
        {
            enabled: !!surveyorId,
            staleTime: 60000,
        }
    );

    if (isLoading) return "...";

    const dashboardInfo = data?.dashboardInfo || {};
    const total = dashboardInfo?.total || 0;
    const completed = dashboardInfo?.completed || 0;
    const pending = dashboardInfo?.pending || 0;
    const progress = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";

    if (type === "total") return total;
    if (type === "completed") return completed;
    if (type === "pending") return pending;
    if (type === "progress") return progress;

    return null;
};

const SupervisorDetailsCard = () => {
    const { t } = useTranslation();
    const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
    const { id: supervisorId } = useParams();
    const ownerIds = Digit.SessionStorage.get("User")?.info?.uuid;
    const searchParams = supervisorId ? { ids: supervisorId } : { ownerIds };

    const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
        tenantId,
        searchParams,
        { staleTime: Infinity }
    );

    const supervisor = useMemo(() => {
        return supervisorSearchResponse?.supervisors?.[0] || null;
    }, [supervisorSearchResponse]);

    const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { status: "ACTIVE" }, { enabled: !!tenantId });

    const vendorName = useMemo(() => {
        if (!vendorData || !supervisor?.vendorId) return "N/A";
        const mappedVendor = vendorData.find((v) => v.dsoDetails?.id === supervisor.vendorId || v.dsoDetails?.vendorId === supervisor.vendorId);
        return mappedVendor?.dsoDetails?.name || supervisor.vendorId || "N/A";
    }, [vendorData, supervisor?.vendorId]);

    const fullName = supervisor?.owner?.name || supervisor?.name || "N/A";
    const employeeId = supervisor?.employeeId || supervisor?.owner?.uuid || supervisor?.id;
    const mobileNumber = supervisor?.owner?.mobileNumber || supervisor?.mobileNo || "N/A";

    // Fetch surveyors connected to the logged-in supervisor
    const { data: surveyorsResponse, isLoading: isSurveyorsLoading } = Digit.Hooks.fsm.useSurveyorSearch(
        tenantId,
        { supervisorIds: supervisor?.id },
        { enabled: !!tenantId && !!supervisor?.id }
    );

    const surveyors = useMemo(() => {
        return surveyorsResponse?.surveyors || surveyorsResponse?.surveyor || [];
    }, [surveyorsResponse]);

    const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress({
        enabled: !!tenantId,
        keepPreviousData: true,
    });

    const cards = useMemo(() => [
        {
            label: "TOTAL_EKYC_APPLICATIONS",
            count: progressData?.totalKnos || 0,
            color: "#0B2559",
            type: "today",
        },
        {
            label: "TOTAL_ASSIGNMENTS",
            count: progressData?.totalAssignments || 0,
            color: "#3B82F6",
            type: "week",
        },
        {
            label: "EKYC_COMPLETED",
            count: progressData?.completedKnos || 0,
            color: "#10B981",
            type: "month",
        },
        {
            label: "PENDING_APPLICATIONS",
            count: (progressData?.totalKnos || 0) - (progressData?.completedKnos || 0),
            color: "#F59E0B",
            type: "pending",
        },
        {
            label: "OVERALL_PROGRESS",
            count: `${progressData?.overallProgressPercent || 0}%`,
            color: "#A855F7",
            type: "progress",
        },
    ], [progressData]);

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
                accessor: (row) => row?.name || row?.owner?.name || "N/A",
                Cell: ({ row }) => (
                    <a
                        href={`/digit-ui/citizen/ekyc/surveyor-dashboard/${row.original.id}`}
                        style={{ color: "#1D70B8", fontWeight: "600", textDecoration: "none" }}
                    >
                        {row.original?.name || row.original?.owner?.name || "N/A"}
                    </a>
                ),
            },
            {
                Header: t("MOBILE_NUMBER") || "Mobile Number",
                accessor: (row) => row?.owner?.mobileNumber || row?.mobileNo || "N/A",
                id: "mobileNumber",
            },
            {
                Header: t("STATUS") || "Status",
                accessor: "status",
                Cell: ({ value }) => (
                    <span className={`status-badge ${value === "ACTIVE" ? "verified" : "pending"}`}>
                        {t(value) || value}
                    </span>
                ),
            },
            {
                Header: t("TOTAL_EKYC_APPLICATIONS") || "Total eKYC Applications",
                accessor: (row) => row?.totalEkycApplications || 0,
                id: "totalEkycApplications",
                Cell: ({ row }) => <SurveyorStatsCell surveyorId={row.original?.owner?.uuid} type="total" />,
            },
            {
                Header: t("EKYC_COMPLETED") || "eKYC Completed",
                accessor: (row) => row?.ekycCompleted || 0,
                id: "ekycCompleted",
                Cell: ({ row }) => <SurveyorStatsCell surveyorId={row.original?.owner?.uuid} type="completed" />,
            },
            {
                Header: t("PENDING_APPLICATIONS") || "Pending Applications",
                accessor: (row) => row?.pendingApplications || 0,
                id: "pendingApplications",
                Cell: ({ row }) => <SurveyorStatsCell surveyorId={row.original?.owner?.uuid} type="pending" />,
            },
            {
                Header: t("OVERALL_PROGRESS") || "Overall Progress",
                accessor: (row) => row?.overallProgress || "N/A",
                id: "overallProgress",
                Cell: ({ row }) => <SurveyorStatsCell surveyorId={row.original?.owner?.uuid} type="progress" />,
            }
            // {
            //     Header: t("ACTIONS") || "Actions",
            //     Cell: ({ row }) => (
            //         <a
            //             href={`/digit-ui/citizen/ekyc/surveyor-dashboard/${row.original.id}`}
            //             className="download-action-btn"
            //             style={{
            //                 display: "inline-block",
            //                 padding: "6px 12px",
            //                 fontSize: "12px",
            //                 textDecoration: "none",
            //                 textAlign: "center"
            //             }}
            //         >
            //             {t("VIEW_DASHBOARD") || "View Dashboard"}
            //         </a>
            //     ),
            // },
        ],
        [t]
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

        setReportLoading(true);
        try {
            const surveyorsList = surveyors || [];

            const rowsWithStats = await Promise.all(
                surveyorsList.map(async (surveyor) => {
                    try {
                        const response = await Digit.EkycService.dashboard(
                            {},
                            {
                                tenantId: "dl.djb",
                                offset: 0,
                                limit: 1,
                                surveyorId: surveyor.owner?.uuid,
                                fromDate: range.from.getTime(),
                                toDate: range.to.getTime(),
                            }
                        );
                        const info = response?.dashboardInfo || {};
                        const total = info.total || 0;
                        const completed = info.completed || 0;
                        const pending = info.pending || 0;
                        const progress = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
                        return {
                            ...surveyor,
                            total,
                            completed,
                            pending,
                            progress,
                        };
                    } catch (err) {
                        console.error("Failed to fetch stats for surveyor:", surveyor.id, err);
                        return {
                            ...surveyor,
                            total: 0,
                            completed: 0,
                            pending: 0,
                            progress: "0%",
                        };
                    }
                })
            );

            const overallResponse = await Digit.EkycService.dashboard(
                {},
                {
                    tenantId: "dl.djb",
                    offset: 0,
                    limit: 1,
                    supervisorId: supervisor?.owner?.uuid,
                    fromDate: range.from.getTime(),
                    toDate: range.to.getTime(),
                }
            );

            downloadSupervisorPDF({
                rows: rowsWithStats,
                supervisorName: fullName,
                mobileNumber,
                vendorName,
                dashboardInfo: overallResponse?.dashboardInfo || {},
                t,
            });
        } catch (err) {
            console.error("Failed to fetch dashboard data for report download:", err);
        } finally {
            setReportLoading(false);
            setShowReportMenu(false);
            setShowCustomPicker(false);
        }
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

        setReportLoading(true);
        try {
            const surveyorsList = surveyors || [];

            const rowsWithStats = await Promise.all(
                surveyorsList.map(async (surveyor) => {
                    try {
                        const response = await Digit.EkycService.dashboard(
                            {},
                            {
                                tenantId: "dl.djb",
                                offset: 0,
                                limit: 1,
                                surveyorId: surveyor.owner?.uuid,
                                fromDate: from.getTime(),
                                toDate: to.getTime(),
                            }
                        );
                        const info = response?.dashboardInfo || {};
                        const total = info.total || 0;
                        const completed = info.completed || 0;
                        const pending = info.pending || 0;
                        const progress = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
                        return {
                            ...surveyor,
                            total,
                            completed,
                            pending,
                            progress,
                        };
                    } catch (err) {
                        console.error("Failed to fetch stats for surveyor:", surveyor.id, err);
                        return {
                            ...surveyor,
                            total: 0,
                            completed: 0,
                            pending: 0,
                            progress: "0%",
                        };
                    }
                })
            );

            const overallResponse = await Digit.EkycService.dashboard(
                {},
                {
                    tenantId: "dl.djb",
                    offset: 0,
                    limit: 1,
                    supervisorId: supervisor?.owner?.uuid,
                    fromDate: from.getTime(),
                    toDate: to.getTime(),
                }
            );

            downloadSupervisorPDF({
                rows: rowsWithStats,
                supervisorName: fullName,
                mobileNumber,
                vendorName,
                dashboardInfo: overallResponse?.dashboardInfo || {},
                t,
            });
        } catch (err) {
            console.error("Failed to fetch custom dashboard data for report download:", err);
        } finally {
            setReportLoading(false);
            setShowReportMenu(false);
            setShowCustomPicker(false);
        }
    };

    const StatCard = ({ title, value, type, color, isLoading }) => (
        <div className={`stat-card ${type}`} style={color ? { borderLeft: `5px solid ${color}` } : {}}>
            {isLoading ? (
                <React.Fragment>
                    <div className="stat-title skeleton skeleton-text"></div>
                    <div className="stat-value skeleton skeleton-number"></div>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <div className="stat-title">{title}</div>
                    <div className="stat-value" style={color ? { color } : {}}>{value}</div>
                </React.Fragment>
            )}
        </div>
    );

    if (isSupervisorSearchLoading) {
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
                        color={card.color}
                        isLoading={isProgressLoading}
                    />
                ))}
            </div>

            {/* Details */}
            <div className="ekyc-dashboard-section">
                <div className="details-grid">
                    <div className="detail-item">
                        <span className="label">{t("MOBILE")}:</span>
                        <span className="value">{supervisor?.owner?.mobileNumber || supervisor?.mobileNo || "N/A"}</span>
                    </div>

                    <div className="detail-item">
                        <span className="label">{t("EMAIL")}:</span>
                        <span className="value">{supervisor?.owner?.emailId || "N/A"}</span>
                    </div>

                    <div className="detail-item">
                        <span className="label">{t("GENDER")}:</span>
                        <span className="value">{supervisor?.owner?.gender || "N/A"}</span>
                    </div>

                    <div className="detail-item">
                        <span className="label">{t("STATUS")}:</span>
                        <span className="value">{supervisor?.status || "N/A"}</span>
                    </div>

                    <div className="detail-item">
                        <span className="label">{t("SERVICE_TYPE")}:</span>
                        <span className="value">{supervisor?.additionalDetails?.serviceType || "N/A"}</span>
                    </div>

                    <div className="detail-item">
                        <span className="label">{t("VENDOR_NAME") || "Vendor Name"}:</span>
                        <span className="value">{vendorName}</span>
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
                    isLoading={isSurveyorsLoading}
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