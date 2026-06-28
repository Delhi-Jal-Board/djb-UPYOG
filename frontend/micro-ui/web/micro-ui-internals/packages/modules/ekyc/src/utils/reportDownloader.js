export const downloadSurveyorPDF = async ({
    rows,
    surveyorName,
    employeeId,
    mobileNumber,
    vendorName,
    supervisorName,
    dashboardInfo,
    t,
}) => {
    const tenantId = Digit.ULBService.getCurrentTenantId();
    const initData = Digit.SessionStorage.get("initData");
    const tenants = initData?.tenants || [];
    const tenantInfo = tenants.find((tenant) => tenant.code === tenantId);

    const capitalize = (text) =>
        text && text.substr(0, 1).toUpperCase() + text.substr(1);
    const ulbCamel = (ulb) =>
        ulb &&
        ulb
            .toLowerCase()
            .split(" ")
            .map(capitalize)
            .join(" ");

    const name = "Delhi Jal Board";
    const email = "contact@delhijalboard.nic.in";
    const phoneNumber = "+91-11-23538416";

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const formattedTime = currentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
    const downloadDateTime = `${formattedDate} ${formattedTime}`;

    const isValDefined = (val) => val !== undefined && val !== null && val !== "";

    const details = [
        {
            title: t("SURVEYOR_DETAILS"),
            asSectionHeader: true,
            values: [
                { title: t("SURVEYOR_NAME"), value: surveyorName },
                { title: t("MOBILE_NUMBER"), value: mobileNumber },
                { title: t("VENDOR_NAME"), value: vendorName },
                { title: t("SUPERVISOR_NAME"), value: supervisorName }
            ].filter((item) => isValDefined(item.value)),
        },
        {
            title: t("SUMMARY_STATISTICS"),
            asSectionHeader: true,
            values: [
                { title: t("TOTAL_ASSIGNED"), value: dashboardInfo?.total || 0 },
                { title: t("COMPLETED"), value: dashboardInfo?.completed || 0 },
                { title: t("PENDING"), value: dashboardInfo?.pending || 0 },
                { title: t("SUBMITTED"), value: dashboardInfo?.submittedCount || 0 },
            ].filter((item) => isValDefined(item.value)),
        },
    ];

    if (
        window.Digit &&
        window.Digit.Utils &&
        window.Digit.Utils.pdf &&
        window.Digit.Utils.pdf.generateSurveyorReport
    ) {
        window.Digit.Utils.pdf.generateSurveyorReport({
            tenantId,
            logo: null,
            name,
            email,
            phoneNumber,
            heading: t("EKYC_SURVEYOR_REPORT"),
            details,
            applicationNumber: employeeId,
            rows,
            t,
            hideApplicationNumber: true,
            downloadTime: downloadDateTime,
        });
    } else {
        console.error("Digit.Utils.pdf.generateSurveyorReport is not available");
    }
};


export const downloadSupervisorPDF = async ({
    rows,
    supervisorName,
    mobileNumber,
    vendorName,
    dashboardInfo,
    t,
}) => {
    const tenantId = Digit.ULBService.getCurrentTenantId();

    const name = "Delhi Jal Board";
    const email = "contact@delhijalboard.nic.in";
    const phoneNumber = "+91-11-23538416";

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const formattedTime = currentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
    const downloadDateTime = `${formattedDate} ${formattedTime}`;

    const isValDefined = (val) => val !== undefined && val !== null && val !== "";

    const details = [
        {
            title: t("SUPERVISOR_DETAILS") || "Supervisor Details",
            asSectionHeader: true,
            values: [
                { title: t("SUPERVISOR_NAME") || "Supervisor Name", value: supervisorName },
                { title: t("MOBILE_NUMBER") || "Mobile Number", value: mobileNumber },
                { title: t("VENDOR_NAME") || "Vendor Name", value: vendorName }
            ].filter((item) => isValDefined(item.value)),
        },
        {
            title: t("SUMMARY_STATISTICS") || "Summary Statistics",
            asSectionHeader: true,
            values: [
                { title: t("TOTAL_ASSIGNED") || "Total Assigned", value: dashboardInfo?.total || 0 },
                { title: t("COMPLETED") || "Completed", value: dashboardInfo?.completed || 0 },
                { title: t("PENDING") || "Pending", value: dashboardInfo?.pending || 0 },
                { title: t("SUBMITTED") || "Submitted", value: dashboardInfo?.submittedCount || 0 },
            ].filter((item) => isValDefined(item.value)),
        },
    ];

    // Map rows from surveyors format to the table template format
    const mappedRows = rows.map((row) => ({
        kno: row.name || row.owner?.name || "N/A",
        firstName: row.owner?.mobileNumber || row.mobileNo || "N/A",
        lastName: "",
        mobileNo: row.status || "N/A",
        zoneName: String(row.total || 0),
        ekycStatus: `${row.completed || 0} / ${row.pending || 0}`,
        submittedAt: 1717171717171, // dummy date
        progress: row.progress || "0%",
    }));

    // Intercept Hindi date formatting to show overall progress
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    let progressIndex = 0;
    Date.prototype.toLocaleDateString = function (...args) {
        if (progressIndex < mappedRows.length) {
            return mappedRows[progressIndex++].progress || "0%";
        }
        return originalToLocaleDateString.apply(this, args);
    };

    // Custom translator to rewrite headers
    const customT = (key) => {
        if (key === "KNO") return t("SURVEYOR_NAME") || "Surveyor Name";
        if (key === "CONSUMER") return t("MOBILE_NUMBER") || "Mobile Number";
        if (key === "MOBILE") return t("STATUS") || "Status";
        if (key === "ZONE") return t("TOTAL_EKYC_APPLICATIONS") || "Total eKYC Applications";
        if (key === "EKYC_STATUS") return t("COMPLETED_PENDING") || "Completed / Pending";
        if (key === "SUBMITTED_DATE") return t("OVERALL_PROGRESS") || "Overall Progress";
        if (key === "CONSUMER_LIST") return t("CONNECTED_SURVEYORS") || "Connected Surveyors";
        return t(key);
    };

    try {
        if (
            window.Digit &&
            window.Digit.Utils &&
            window.Digit.Utils.pdf &&
            window.Digit.Utils.pdf.generateSurveyorReport
        ) {
            window.Digit.Utils.pdf.generateSurveyorReport({
                tenantId,
                logo: null,
                name,
                email,
                phoneNumber,
                heading: t("EKYC_SUPERVISOR_REPORT") || "eKYC Supervisor Report",
                details,
                applicationNumber: mobileNumber,
                rows: mappedRows,
                t: customT,
                hideApplicationNumber: true,
                downloadTime: downloadDateTime,
            });
        } else {
            console.error("Digit.Utils.pdf.generateSurveyorReport is not available");
        }
    } finally {
        Date.prototype.toLocaleDateString = originalToLocaleDateString;
    }
};

