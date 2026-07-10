// import Dashboard from "../components/Dashboard";
// import Inbox from "../pages/employee/Inbox";
// import Create from "../pages/employee/Create";
// import Mapping from "../pages/employee/Mapping";
// import EKYCForm from "../pages/employee/EKYCForm";
// import Review from "../components/Review";
// import AssignEkyc from "../components/AssignEkyc";
// import AdminDashboard from "../components/AdminDashboard";
// import CeoDashboard from "../components/CeoDashboard";
// import VendorDetailsCard from "../components/VendorDetailsCard";
// import SupervisorDetailsCard from "../components/SupervisorDetailsCard";
// import SurveyorDetailsCard from "../components/SurveyorDetailsCard";

// export const ekycRoutes = [
//     {
//         path: "/dashboard",
//         component: Dashboard,
//         layout: "normal",
//         breadcrumb: "EKYC_DASHBOARD",
//     },
//     {
//         path: "/inbox",
//         component: Inbox,
//         layout: "normal",
//         breadcrumb: "EKYC_INBOX",
//     },
//     {
//         path: "/create-kyc",
//         component: Create,
//         layout: "normal",
//         breadcrumb: "EKYC_CREATE_KYC",
//     },
//     {
//         path: "/consumer-details",
//         component: EKYCForm,
//         layout: "normal",
//         breadcrumb: "EKYC_CONSUMER_DETAILS",
//     },
//     {
//         path: "/address-details",
//         component: EKYCForm,
//         layout: "normal",
//         breadcrumb: "EKYC_ADDRESS_DETAILS",
//     },
//     {
//         path: "/property-info",
//         component: EKYCForm,
//         layout: "normal",
//         breadcrumb: "EKYC_PROPERTY_INFO",
//     },
//     {
//         path: "/meter-details",
//         component: EKYCForm,
//         layout: "normal",
//         breadcrumb: "EKYC_METER_DETAILS",
//     },
//     {
//         path: "/mapping",
//         component: Mapping,
//         layout: "normal",
//         breadcrumb: "EKYC_MAPPING",
//     },
//     {
//         path: ["/assign"],
//         component: AssignEkyc,
//         layout: "normal",
//         breadcrumb: [
//             {
//                 label: "EKYC_ASSIGN",
//                 path: "/digit-ui/employee/ekyc/assign"
//             }
//         ],
//     },
//     {
//         path: ["/review/:kno", "/review"],
//         component: Review,
//         layout: "action",
//         breadcrumb: [
//             {
//                 label: "EKYC_INBOX",
//                 path: "/digit-ui/employee/ekyc/inbox:kno",
//             },
//             {
//                 label: "EKYC_REVIEW",
//             },
//         ],
//     },
//     {
//         path: "/admin-dashboard",
//         component: AdminDashboard,
//         layout: "normal",
//         breadcrumb: "EKYC_ADMIN_DASHBOARD",
//     },
//     {
//         path: "/ceo-dashboard",
//         component: CeoDashboard,
//         layout: "normal",
//         breadcrumb: "CEO_M.F_DOR_FINANCE_VIEW",
//     },
//     {
//         path: ["/vendors/:vendorId", "/vendors"],
//         component: VendorDetailsCard,
//         layout: "normal",
//         breadcrumb: [
//             {
//                 label: "EKYC_VENDORS",
//                 path: "/digit-ui/employee/ekyc/vendors:vendorId",
//             },
//             {
//                 label: "EKYC_VENDOR_DETAILS",
//             },
//         ],
//     },
//     {
//         path: ["/supervisor-dashboard/:id", "/supervisor-dashboard"],
//         component: SupervisorDetailsCard,
//         layout: "action",
//         breadcrumb: [
//             {
//                 label: "EKYC_SUPERVISOR_DASHBOARD",
//                 path: "/digit-ui/employee/ekyc/supervisor-dashboard:id",
//             },
//             {
//                 label: "EKYC_SUPERVISOR_DETAILS",
//             },
//         ],
//     },
//     {
//         path: ["/surveyor-dashboard/:id", "/surveyor-dashboard"],
//         component: SurveyorDetailsCard,
//         layout: "action",
//         breadcrumb: [
//             {
//                 label: "EKYC_SURVEYOR_DASHBOARD",
//                 path: "/digit-ui/employee/ekyc/surveyor-dashboard/:id",
//             },
//             {
//                 label: "EKYC_SURVEYOR_DETAILS",
//             },
//         ],
//     },
// ];

// import Dashboard from "../components/Dashboard";
// import Inbox from "../pages/employee/Inbox";
// import Create from "../pages/employee/Create";
// import Mapping from "../pages/employee/Mapping";
// import EKYCForm from "../pages/employee/EKYCForm";
// import Review from "../components/Review";
// import AssignEkyc from "../components/AssignEkyc";
// import AdminDashboard from "../components/AdminDashboard";
// import CeoDashboard from "../components/CeoDashboard";
// import VendorDetailsCard from "../components/VendorDetailsCard";
// import SupervisorDetailsCard from "../components/SupervisorDetailsCard";
// import SurveyorDetailsCard from "../components/SurveyorDetailsCard";

// // helper: har jagah listPath + label + detailLabel pattern repeat ho raha tha
// const withBreadcrumb = (listLabel, listPath, detailLabel) => [
//     { label: listLabel, path: `/digit-ui/employee/ekyc/${listPath}` },
//     { label: detailLabel },
// ];

// // simple routes (no params, no custom breadcrumb array) - ek jagah define
// const simpleRoutes = [
//     { path: "/dashboard", component: Dashboard, breadcrumb: "EKYC_DASHBOARD" },
//     { path: "/inbox", component: Inbox, breadcrumb: "EKYC_INBOX" },
//     { path: "/create-kyc", component: Create, breadcrumb: "EKYC_CREATE_KYC" },
//     { path: "/mapping", component: Mapping, breadcrumb: "EKYC_MAPPING" },
//     { path: "/admin-dashboard", component: AdminDashboard, breadcrumb: "EKYC_ADMIN_DASHBOARD" },
//     { path: "/ceo-dashboard", component: CeoDashboard, breadcrumb: "CEO_M.F_DOR_FINANCE_VIEW" },
// ].map((r) => ({ ...r, layout: "normal" }));

// // EKYCForm ke saare steps ek hi jagah se generate - repetition khatam
// const ekycFormSteps = [
//     ["consumer-details", "EKYC_CONSUMER_DETAILS"],
//     ["address-details", "EKYC_ADDRESS_DETAILS"],
//     ["property-info", "EKYC_PROPERTY_INFO"],
//     ["meter-details", "EKYC_METER_DETAILS"],
// ].map(([path, breadcrumb]) => ({
//     path: `/${path}`,
//     component: EKYCForm,
//     layout: "normal",
//     breadcrumb,
// }));

// // detail-card routes jinka pattern same hai (list + :id + detail)
// const detailCardRoutes = [
//     {
//         path: ["/assign"],
//         component: AssignEkyc,
//         layout: "normal",
//         breadcrumb: [{ label: "EKYC_ASSIGN", path: "/digit-ui/employee/ekyc/assign" }],
//     },
//     {
//         path: ["/review/:kno", "/review"],
//         component: Review,
//         layout: "action",
//         breadcrumb: withBreadcrumb("EKYC_INBOX", "inbox:kno", "EKYC_REVIEW"),
//     },
//     {
//         path: ["/vendors/:vendorId", "/vendors"],
//         component: VendorDetailsCard,
//         layout: "normal",
//         breadcrumb: withBreadcrumb("EKYC_VENDORS", "vendors:vendorId"),
//     },
//     {
//         path: ["/supervisor-dashboard/:id", "/supervisor-dashboard"],
//         component: SupervisorDetailsCard,
//         layout: "action",
//         breadcrumb: withBreadcrumb("EKYC_SUPERVISOR_DASHBOARD", "supervisor-dashboard:id"),
//     },
//     {
//         path: ["/surveyor-dashboard/:id", "/surveyor-dashboard"],
//         component: SurveyorDetailsCard,
//         layout: "action",
//         breadcrumb: withBreadcrumb("EKYC_SURVEYOR_DASHBOARD", "surveyor-dashboard/:id"),
//     },
// ];

// export const ekycRoutes = [
//     ...simpleRoutes,
//     ...ekycFormSteps,
//     ...detailCardRoutes,
// ];

import Dashboard from "../components/Dashboard";
import Inbox from "../pages/employee/Inbox";
import Create from "../pages/employee/Create";
import Mapping from "../pages/employee/Mapping";
import EKYCForm from "../pages/employee/EKYCForm";
import Review from "../components/Review";
import AssignEkyc from "../components/AssignEkyc";
import AdminDashboard from "../components/AdminDashboard";
import CeoDashboard from "../components/CeoDashboard";
import VendorDetailsCard from "../components/VendorDetailsCard";
import SupervisorDetailsCard from "../components/SupervisorDetailsCard";
import SurveyorDetailsCard from "../components/SurveyorDetailsCard";


// yeh function role (employee/citizen) leta hai aur uske hisaab se
// breadcrumb ka URL bana deta hai. Baaki sab kuch same rehta hai.
const breadcrumb = (userType, listLabel, listPath, detailLabel) => [
    { label: listLabel, path: `/digit-ui/${userType}/ekyc/${listPath}` },
    { label: detailLabel },
];

// 👇 isi function ko employee ke liye bhi call karenge, citizen ke liye bhi
export const getEkycRoutes = (userType) => [
    // ---- simple pages ----
    { path: "/dashboard", component: Dashboard, layout: "normal", breadcrumb: "EKYC_DASHBOARD" },
    { path: "/inbox", component: Inbox, layout: "normal", breadcrumb: "EKYC_INBOX" },
    { path: "/review/:kno", component: Review, layout: "normal", breadcrumb: "EKYC_REVIEW" },
    { path: "/create-kyc", component: Create, layout: "normal", breadcrumb: "EKYC_CREATE_KYC" },
    { path: "/mapping", component: Mapping, layout: "normal", breadcrumb: "EKYC_MAPPING" },
    { path: "/admin-dashboard", component: AdminDashboard, layout: "normal", breadcrumb: "EKYC_ADMIN_DASHBOARD" },
    { path: "/ceo-dashboard", component: CeoDashboard, layout: "normal", breadcrumb: "CEO_M.F_DOR_FINANCE_VIEW" },

    // ---- EKYC form ke 4 steps ----
    { path: "/consumer-details", component: EKYCForm, layout: "normal", breadcrumb: "EKYC_CONSUMER_DETAILS" },
    { path: "/address-details", component: EKYCForm, layout: "normal", breadcrumb: "EKYC_ADDRESS_DETAILS" },
    { path: "/property-info", component: EKYCForm, layout: "normal", breadcrumb: "EKYC_PROPERTY_INFO" },
    { path: "/meter-details", component: EKYCForm, layout: "normal", breadcrumb: "EKYC_METER_DETAILS" },

    // ---- assign ----
    {
        path: ["/assign"],
        component: AssignEkyc,
        layout: "normal",
        breadcrumb: [{ label: "EKYC_ASSIGN", path: `/digit-ui/${userType}/ekyc/assign` }],
    },

    // ---- detail-card wale routes ----
    //   {
    //     path: ["/review/:kno", "/review"],
    //     component: Review,
    //     layout: "action",
    //     breadcrumb: breadcrumb(userType, "EKYC_INBOX", "inbox:kno", "EKYC_REVIEW"),
    //   },
    {
        path: ["/vendors/:vendorId", "/vendors"],
        component: VendorDetailsCard,
        layout: "normal",
        breadcrumb: breadcrumb(userType, "EKYC_VENDORS", "vendors:vendorId", "EKYC_VENDOR_DETAILS"),
    },
    {
        path: ["/supervisor-dashboard/:id", "/supervisor-dashboard"],
        component: SupervisorDetailsCard,
        layout: "action",
        breadcrumb: breadcrumb(userType, "EKYC_SUPERVISOR_DASHBOARD", "supervisor-dashboard:id", "EKYC_SUPERVISOR_DETAILS"),
    },
    {
        path: ["/surveyor-dashboard/:id", "/surveyor-dashboard"],
        component: SurveyorDetailsCard,
        layout: "action",
        breadcrumb: breadcrumb(userType, "EKYC_SURVEYOR_DASHBOARD", "surveyor-dashboard/:id", "EKYC_SURVEYOR_DETAILS"),
    },
];

// dono role ke liye ready-made arrays — jaha jaruratho wahi import karo
export const ekycRoutes = getEkycRoutes("employee");        // employee ke liye
export const citizenEkycRoutes = getEkycRoutes("citizen");  // citizen ke liye