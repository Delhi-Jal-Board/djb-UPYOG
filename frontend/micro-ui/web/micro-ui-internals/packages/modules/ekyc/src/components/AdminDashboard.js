import React, { useMemo, useState } from "react";
import { Card, Loader, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { ekycMockData } from "./mockData";

const AdminDashboard = () => {
    const { t } = useTranslation();
    const history = useHistory();
    let tenantId = Digit.ULBService.getCurrentTenantId();
    if (!tenantId || tenantId === "dl") {
        tenantId = "dl.djb";
    }
    const loggedInUser = Digit.SessionStorage.get("User")?.info;

    // Fetch all vendors from DSO search
    const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
        tenantId,
        { status: "ACTIVE" },
        { enabled: !!tenantId }
    );

    // Fetch assignment progress with hierarchy (supervisor and surveyor details)
    const { data: progressData, isLoading: isProgressLoading } = Digit.Hooks.ekyc.useEkycAssignmentProgress({
        enabled: !!tenantId,
        keepPreviousData: true,
    });

    const vendorsList = useMemo(() => {
        if (vendorSearchResponse && vendorSearchResponse.length > 0) {
            return vendorSearchResponse.map((v) => {
                const dso = v.dsoDetails || v;
                const supervisorsList = dso.supervisors || [];
                const surveyorsList = dso.surveyors || [];

                // Extract supervisor IDs for this vendor
                const supervisorIds = supervisorsList.map((s) => s.id || s.owner?.uuid).filter(Boolean);

                // Find supervisor reports in progressData matching these IDs
                const matchedReports = progressData?.supervisorReport?.filter(
                    (r) => supervisorIds.includes(r.supervisorId)
                ) || [];

                const completed = matchedReports.reduce((acc, r) => acc + (r.submittedKnos || 0), 0);
                const pending = matchedReports.reduce((acc, r) => acc + (r.pendingKnos || 0), 0);
                const total = matchedReports.reduce((acc, r) => acc + (r.totalKnos || 0), 0);
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const rejected = 0; // Default to 0 or calculate if data exists

                return {
                    id: dso.id || dso.vendorId || v.id || v.vendorId,
                    name: dso.name || dso.displayName || v.name || "N/A",
                    ownerName: dso.owner?.name || v.owner?.name || "N/A",
                    mobileNumber: dso.mobileNumber || dso.owner?.mobileNumber || v.mobileNumber || "N/A",
                    supervisors: supervisorsList.length,
                    surveyors: surveyorsList.length,
                    completed: completed,
                    progress: progress,
                    pending: pending,
                    rejected: rejected,
                };
            });
        }
        return [];
    }, [vendorSearchResponse, progressData]);

    const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);


    // Fetch all eKYC applications for the table
    const { data: applicationData, isFetching: isApplicationLoading } = Digit.Hooks.ekyc.useEkycApplicationList(
        {},
        {
            tenantId,
            offset: currentPage * pageSize,
            limit: pageSize,
        },
        {
            keepPreviousData: true,
        }
    );

    const fullName = loggedInUser?.name || "Admin";
    const mobileNumber = loggedInUser?.mobileNumber || "N/A";
    const email = loggedInUser?.emailId || "N/A";
    const roleText = loggedInUser?.roles?.map((r) => r.name).join(", ") || "EKYC Admin";


    const handleDownloadEkycData = async () => {
        setEkycDownloadLoading(true);
        try {
            const response = await Digit.EkycService.application_list({
                tenantId: tenantId,
                offset: 0,
                limit: 10000,
                reportDownload: true,
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

                const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
                if (name) {
                    cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = name;
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

            const cleanFileName = `eKYC_All_Data_Admin_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
            Digit.Download.Excel(excelData, cleanFileName);
        } catch (error) {
            console.error("Error downloading eKYC Excel:", error);
        } finally {
            setEkycDownloadLoading(false);
        }
    };

    return (
        <Card className="surveyor-dashboard">
            <div className="ekyc-dashboard-section">
                <div className="ekyc-dashboard-header">
                    <div className="avatar">{fullName?.charAt(0)?.toUpperCase()}</div>
                    <div className="header-content">
                        <h2 className="name">{fullName}</h2>
                        <div className="designation">{t("EKYC_ADMIN") || "eKYC Admin / Manager"}</div>
                        <div className="mobile-number">{mobileNumber}</div>

                    </div>
                </div>
                <button
                    className="download-excel-btn"
                    disabled={ekycDownloadLoading}
                    onClick={handleDownloadEkycData}
                    style={{ margin: 0, padding: "8px 16px", height: "auto", minHeight: "36px", width: "auto" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_EXCEL") || "Download Excel"}
                </button>
            </div>

            {/* Vendor Cards Section */}
            <div style={{ marginTop: "32px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#101828", marginBottom: "20px" }}>
                    {t("EKYC_VENDORS_PERFORMANCE") || "eKYC Vendors Performance"}
                </h3>

                {isVendorSearchLoading || isProgressLoading ? (
                    <Loader />
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "24px",
                        width: "100%"
                    }}>
                        {vendorsList.length === 0 ? (
                            <div style={{ gridColumn: "span 3", textAlign: "center", padding: "40px", color: "#64748B", fontSize: "16px" }}>
                                {t("NO_VENDORS_FOUND") || "No vendors found."}
                            </div>
                        ) : (
                            vendorsList.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    onClick={() => history.push(`/digit-ui/employee/ekyc/vendors/${vendor.id}`)}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "16px",
                                        padding: "24px",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                                        cursor: "pointer",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: "16px"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)";
                                        e.currentTarget.style.borderColor = "#CBD5E1";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
                                        e.currentTarget.style.borderColor = "#E2E8F0";
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#0B2559", margin: 0 }}>
                                                {vendor.name}
                                            </h4>
                                            {/* <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", marginBottom: 0 }}>
                                                {t("OWNER") || "Owner"}: <span style={{ fontWeight: "600", color: "#334155" }}>{vendor.ownerName}</span>
                                            </p> */}
                                            <p style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", marginBottom: 0 }}>
                                                {t("MOBILE") || "Mobile"}: {vendor.mobileNumber}
                                            </p>
                                        </div>
                                        <span style={{
                                            background: "#E0F2FE",
                                            color: "#0369A1",
                                            padding: "6px 12px",
                                            borderRadius: "999px",
                                            fontSize: "13px",
                                            fontWeight: "700"
                                        }}>
                                            {vendor.progress}%
                                        </span>
                                    </div>

                                    <div style={{ width: "100%", height: "8px", background: "#F1F5F9", borderRadius: "999px", overflow: "hidden" }}>
                                        <div style={{ width: `${vendor.progress}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6 0%, #10B981 100%)", borderRadius: "999px" }}></div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                        <div style={{ background: "#F8FAFC", padding: "12px 8px", borderRadius: "10px", textAlign: "center" }}>
                                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B" }}>{vendor.supervisors}</div>
                                            <div style={{ fontSize: "10px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", marginTop: "4px" }}>{t("SUPERVISORS") || "Supervisors"}</div>
                                        </div>
                                        <div style={{ background: "#F8FAFC", padding: "12px 8px", borderRadius: "10px", textAlign: "center" }}>
                                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B" }}>{vendor.surveyors}</div>
                                            <div style={{ fontSize: "10px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", marginTop: "4px" }}>{t("SURVEYORS") || "Surveyors"}</div>
                                        </div>
                                        <div style={{ background: "#F8FAFC", padding: "12px 8px", borderRadius: "10px", textAlign: "center" }}>
                                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#10B981" }}>{vendor.completed}</div>
                                            <div style={{ fontSize: "10px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", marginTop: "4px" }}>{t("COMPLETED") || "Completed"}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", borderTop: "1px solid #F1F5F9", paddingTop: "12px" }}>
                                        <span>{t("PENDING") || "Pending"}: <span style={{ fontWeight: "700", color: "#F59E0B" }}>{vendor.pending}</span></span>
                                        <span>{t("REJECTED") || "Rejected"}: <span style={{ fontWeight: "700", color: "#EF4444" }}>{vendor.rejected}</span></span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

        </Card>
    );
};

export default AdminDashboard;
