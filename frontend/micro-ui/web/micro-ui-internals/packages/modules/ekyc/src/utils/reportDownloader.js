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


// export const downloadSupervisorReport = async ({
//     rows,
//     supervisorName,
//     mobileNumber,
//     surveyorName,
//     vendorName,
//     dashboardInfo,
//     t,
// }) => {
//     const tenantId = Digit.ULBService.getCurrentTenantId();
//     const initData = Digit.SessionStorage.get("initData");
//     const tenants = initData?.tenants || [];
//     const tenantInfo = tenants.find((tenant) => tenant.code === tenantId);

//     const capitalize = (text) =>
//         text && text.substr(0, 1).toUpperCase() + text.substr(1);
//     const ulbCamel = (ulb) =>
//         ulb &&
//         ulb
//             .toLowerCase()
//             .split(" ")
//             .map(capitalize)
//             .join(" ");

//     const name = "Delhi Jal Board";
//     const email = "contact@delhijalboard.nic.in";
//     const phoneNumber = "+91-11-23538416";

//     const currentDate = new Date();
//     const formattedDate = currentDate.toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric"
//     });
//     const formattedTime = currentDate.toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         hour12: false
//     });
//     const downloadDateTime = `${formattedDate} ${formattedTime}`;

//     const isValDefined = (val) => val !== undefined && val !== null && val !== "";

//     const details = [
//         {
//             title: t("SUPERVISOR_DETAILS"),
//             asSectionHeader: true,
//             values: [
//                 { title: t("SUPERVISOR_NAME"), value: supervisorName },
//                 { title: t("MOBILE_NUMBER"), value: mobileNumber },
//                 { title: t("VENDOR_NAME"), value: vendorName },
//                 { title: t("SURVEYOR_NAME"), value: surveyorName }
//             ].filter((item) => isValDefined(item.value)),
//         },
//         {
//             title: t("SUMMARY_STATISTICS"),
//             asSectionHeader: true,
//             values: [
//                 { title: t("TOTAL_ASSIGNED"), value: dashboardInfo?.total || 0 },
//                 { title: t("COMPLETED"), value: dashboardInfo?.completed || 0 },
//                 { title: t("PENDING"), value: dashboardInfo?.pending || 0 },
//                 { title: t("SUBMITTED"), value: dashboardInfo?.submittedCount || 0 },
//             ].filter((item) => isValDefined(item.value)),
//         },
//     ];

//     if (
//         window.Digit &&
//         window.Digit.Utils &&
//         window.Digit.Utils.pdf &&
//         window.Digit.Utils.pdf.generateSupervisorReport
//     ) {
//         window.Digit.Utils.pdf.generateSupervisorReport({
//             tenantId,
//             logo: null,
//             name,
//             email,
//             phoneNumber,
//             heading: t("EKYC_SUPERVISOR_REPORT"),
//             details,
//             applicationNumber: mobileNumber,
//             rows,
//             t,
//             hideApplicationNumber: true,
//             downloadTime: downloadDateTime,
//         });
//     } else {
//         console.error("Digit.Utils.pdf.generateSupervisorReport is not available");
//     }
// };