export const heroConfig = {
  badge: "TRAINING & GUIDES",
  title: "Delhi Jal Board User Guide",
  description:
    "Explore live interactive step-by-step manuals, operational guides, and downloadable official training documentation for Citizens and Employees.",
};

export const filterHeaderConfig = {
  title: "Filter Manuals by Service Module",
  subtitle: "Select a specific DJB service module to view related live guides & documentation",
};

export const ekycGuides = [
  { label: "📘 eKYC Manual Hub (Main Landing)", url: "/user_mannual_ekyc_/index.html" },
  { label: "📱 Surveyor Login & Survey Manual", url: "/user_mannual_ekyc_/surveyor_login.html" },
  { label: "🏗️ Surveyor Account Creation Guide", url: "/user_mannual_ekyc_/surveyor_creation.html" },
  { label: "👔 Supervisor Login & Audit Manual", url: "/user_mannual_ekyc_/supervisor_login.html" },
  { label: "📋 Supervisor Account Creation Guide", url: "/user_mannual_ekyc_/supervisor_creation.html" },
  { label: "🏢 Vendor Portal & Login Manual", url: "/user_mannual_ekyc_/vendor_login.html" },
  { label: "🏬 Vendor Account Creation Guide", url: "/user_mannual_ekyc_/vendor_creation.html" },
  { label: "🔑 Employee Login & Keycloak SSO Guide", url: "/user_mannual_ekyc_/employee_login.html" },
];

export const pdfServices = [
  {
    id: "ekyc",
    label: "🛡️ eKYC Verification & Onboarding Manual",
    url: "https://drive.google.com/file/d/1Dac8BhS7QB3yiDbK22-LD3qzU2ahGcR0/preview",
    updated: "2026",
    desc: "Complete guide for consumer eKYC, door-to-door verification, surveyor mapping & supervisor audits.",
  },
  {
    id: "ocr_meter",
    label: "📸 OCR Meter Reading & Billing Manual",
    url: "https://drive.google.com/file/d/1lnQRszh8BGju85WDXfyR-15gyHHKBSPv/preview",
    updated: "2026",
    desc: "Field-work app manual for DJB Meter Readers & Supervisors covering camera OCR photo capture, verification, offline sync & bill generation.",
  },
  {
    id: "pod_app",
    label: "📦 Proof of Delivery (PoD) Application Manual",
    url: "https://drive.google.com/file/d/1PzqZ4yWg4w_1zWM-chlMFezLYeR_4KxR/preview",
    updated: "2026",
    desc: "Field-work app manual for DJB staff to scan bill QR codes, verify KNO & bill details, capture bill photo evidence & record delivery outcome.",
  },
  {
    id: "nirikshan",
    label: "🔍 Nirikshan Digital Field Inspection Manual",
    url: "https://docs.google.com/document/d/1U1AZLwRaa7HQm4bZfqTFD5j4VjbNB5lS/preview",
    updated: "2026",
    desc: "Digital field-inspection application for DJB inspectors to record site observations, capture photo evidence, validate GPS location & digitally submit inspection records.",
  },
  {
    id: "water_tanker",
    label: "🚰 Water Tanker Booking & Delivery Manual",
    url: "",
    updated: "2026",
    desc: "Step-by-step user manual for online water tanker booking, tracking delivery & payment options.",
  },
  {
    id: "water_sewerage",
    label: "💧 Water & Sewerage Services Citizen Charter",
    url: "",
    updated: "2026",
    desc: "Guidelines for new water/sewer connections, bill payment, ownership mutation & grievance redressal.",
  },
];

export const moduleOptions = [
  { value: "all", label: "🌐 All Modules & Services" },
  { value: "ekyc", label: "🛡️ eKYC Verification & Management" },
  { value: "ocr_meter", label: "📸 OCR Meter Reading Application" },
  { value: "pod_app", label: "📦 Proof of Delivery (PoD) Application" },
  { value: "nirikshan", label: "🔍 Nirikshan Field Inspection App" },
  { value: "water_tanker", label: "🚰 Water Tanker Services (WT)" },
  { value: "water_sewerage", label: "💧 Water & Sewerage Services" },
];

export const liveGuideCards = [
  {
    id: "nirikshan",
    borderColor: "#0284c7",
    title: "Nirikshan Field Inspection App",
    iconType: "nirikshan",
    items: [
      { bold: "Digital Inspection & Reporting:", text: "Replaces paper-based site inspections with continuous mobile app recording." },
      { bold: "Photo Evidence & GPS Tagging:", text: "Capture clear site photographs and validate exact physical location via GPS." },
      { bold: "Standard Operating Sequence:", text: "Fresh login session → verify assigned project → uninterrupted capture → single submit." },
      { bold: "Troubleshooting & Authorization:", text: "Step-by-step resolution for session staleness, missing assignments & GPS permissions." },
    ],
    actionBtn: {
      text: "View Nirikshan Workflow Guide",
      targetId: "nirikshan-interactive-hub",
      color: "#0284c7",
      shadowColor: "rgba(2, 132, 199, 0.25)",
      type: "scroll",
    },
  },
  {
    id: "water_sewerage",
    borderColor: "#1f5fa8",
    title: "Water & Sewerage Services",
    iconType: "water",
    badge: "COMING SOON",
    items: [
      { bold: "New Connection:", text: "Submit property info, ownership proof, and consumer photos." },
      { bold: "Online Bill Payment:", text: "Enter K-No. to instantly fetch and pay water charges." },
      { bold: "Disconnection & Mutation:", text: "Transfer ownership or request temporary service hold online." },
    ],
    actionBtn: {
      text: "Interactive Guide Coming Soon",
      type: "coming_soon",
      color: "#475569",
      bgColor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },
  },
  {
    id: "water_tanker",
    borderColor: "#00b4d8",
    title: "Water Tanker Services (WT)",
    iconType: "tanker",
    badge: "COMING SOON",
    items: [
      { bold: "Emergency Booking:", text: "Request immediate water delivery for water scarce areas." },
      { bold: "Live Tanker Tracking:", text: "Monitor driver location and estimated arrival time on map." },
      { bold: "Trip Reports:", text: "View fill point details and delivery confirmation photos." },
    ],
    actionBtn: {
      text: "Interactive Guide Coming Soon",
      type: "coming_soon",
      color: "#475569",
      bgColor: "#f0f9ff",
      borderColor: "#bae6fd",
    },
  },
  {
    id: "ekyc",
    borderColor: "#10b981",
    title: "eKYC Verification & Management (EKYC)",
    iconType: "ekyc",
    items: [
      { bold: "Surveyor Field Verification:", text: "Perform door-to-door consumer identity & property verification using mobile app." },
      { bold: "Supervisor & Vendor Review:", text: "Review surveyor submitted data, verify identity documents, and process applications." },
      { bold: "ZRO & Admin Approval:", text: "Execute final ZRO approval workflow, track real-time analytics, and role permissions." },
    ],
    actionBtn: {
      text: "Start eKYC Interactive Manual",
      url: "/user_mannual_ekyc_/index.html",
      color: "#10b981",
      shadowColor: "rgba(16, 185, 129, 0.25)",
      type: "url",
    },
  },
  {
    id: "ocr_meter",
    borderColor: "#8b5cf6",
    title: "OCR Meter Reading Application",
    iconType: "ocr",
    items: [
      { bold: "Camera OCR Photo Capture:", text: "Take water meter photograph; AI automatically detects meter reading digits." },
      { bold: "Human Verification & Edit:", text: "Field staff compare detected digits against meter photo with edit/re-scan options." },
      { bold: "Offline Storage & Sync All:", text: "Save readings locally without internet; upload pending records via SYNC ALL." },
      { bold: "Supervisor UMS Approval:", text: "Supervisors review photo evidence, approve readings & generate consumer bills." },
    ],
    actionBtn: {
      text: "View OCR Workflow Guide",
      targetId: "ocr-interactive-hub",
      color: "#8b5cf6",
      shadowColor: "rgba(139, 92, 246, 0.25)",
      type: "scroll",
    },
  },
  {
    id: "pod_app",
    borderColor: "#f59e0b",
    title: "Proof of Delivery (PoD) Application",
    iconType: "pod",
    items: [
      { bold: "Bill QR Code Scanning:", text: "Scan QR code printed on physical bill for instant auto-verification of KNO & Bill No." },
      { bold: "Bill Photo Evidence:", text: "Capture readable camera photo of delivered bill as official digital proof." },
      { bold: "Delivery Status Classification:", text: "Record outcome (In Hand, Family, Security, Letterbox, Refused, Premises Closed, Untraceable)." },
      { bold: "Connected DJB Pipeline:", text: "Bridges Meter Reading → Bill Generation → Physical Bill Delivery → Proof of Delivery." },
    ],
    actionBtn: {
      text: "View PoD Workflow Guide",
      targetId: "pod-interactive-hub",
      color: "#f59e0b",
      shadowColor: "rgba(245, 158, 11, 0.25)",
      type: "scroll",
    },
  },
];

export const faqs = [
  {
    q: "What is the Nirikshan Module and how does it work?",
    a:
      "Nirikshan is DJB's digital field-inspection application. It allows authorized field inspectors to go to assigned sites, record findings, capture photo evidence, validate GPS location, fill dynamic project requirements, and digitally submit inspection reports directly from their mobile devices.",
  },
  {
    q: "How does Nirikshan differ from the Meter Reading and Proof of Delivery (PoD) Apps?",
    a:
      "While Meter Reading App focuses on consumer meter digit capture for billing, and PoD App focuses on physical bill delivery tracking, Nirikshan is a standalone digital field-inspection system for site visits, project audits, photographic evidence, and formal inspection reporting.",
  },
  {
    q: "What is the Golden Rule for using the Nirikshan Application?",
    a:
      "Always start with a FRESH LOGIN SESSION (Logout → Close App → Reopen → Login) and complete the inspection without unnecessary interruption or switching apps. Prolonged inactivity or app switching can cause session timeouts and authorization errors.",
  },
  {
    q: "How do I fix an 'Authorization Error' during Nirikshan field inspection?",
    a:
      "If you see 'You are not authorised to perform the actions', perform the fresh login sequence: Logout → Close App → Reopen → Login Again → Verify Dashboard → Open Nirikshan. If the issue persists, take a screenshot and contact your administrator.",
  },
  {
    q: "How do I register for a new Water & Sewerage connection?",
    a:
      "To register for a new water connection, click on 'Consumer Login' or 'Register' in the top right menu. Once logged in, navigate to 'Water & Sewerage Services' -> 'Apply New Connection'. Fill in applicant details, property details, and upload the required proof of identity and property ownership document.",
  },
  {
    q: "How can I book an emergency Water Tanker?",
    a:
      "Go to 'Water Tanker Services' on the portal or call our emergency hotline at 8383068300 / 1916. You can submit an emergency tanker request by specifying your area locality and delivery address.",
  },
  {
    q: "How do I complete eKYC verification for my application?",
    a:
      "Log in to the portal and navigate to 'eKYC Verification'. Surveyors and Field Officers conduct identity verification, upload consumer documents, and submit for Supervisor and ZRO approval.",
  },
  {
    q: "What is the difference between the Meter Reading App and the Proof of Delivery (PoD) App?",
    a:
      "The Meter Reading App is used by field staff to capture water meter photos and read meter digits via OCR to generate bills. The Proof of Delivery (PoD) App is used subsequently when delivering the physical bill to scan its QR code, capture a photo of the delivered bill, and record the exact delivery outcome (e.g. Delivered in hand, to family, placed in letter box, or address untraceable).",
  },
  {
    q: "What should employees do if Keycloak SSO session expires?",
    a:
      "If your employee session expires or displays an access token error, click on 'Employee Login' in the main navigation header to re-authenticate securely via Keycloak SSO.",
  },
];

export const ekycRoleCards = [
  {
    icon: "📱",
    title: "Surveyor Guide",
    desc: "Field survey, mobile app navigation, consumer photo capture & identity document upload.",
    btnText: "Start Surveyor Guide",
    url: "/user_mannual_ekyc_/surveyor_login.html",
  },
  {
    icon: "👔",
    title: "Supervisor Guide",
    desc: "Reviewing surveyor submitted data, verifying consumer documents & approving applications.",
    btnText: "Start Supervisor Guide",
    url: "/user_mannual_ekyc_/supervisor_login.html",
  },
  {
    icon: "🏢",
    title: "Vendor Guide",
    desc: "Contractor dashboard, surveyor allocation, onboarding team members & tracking progress.",
    btnText: "Start Vendor Guide",
    url: "/user_mannual_ekyc_/vendor_login.html",
  },
  {
    icon: "🔑",
    title: "Employee Login & SSO",
    desc: "Keycloak SSO authentication, 2FA Mobile Authenticator setup & employee portal access.",
    btnText: "Start Employee Guide",
    url: "/user_mannual_ekyc_/employee_login.html",
  },
];

export const ocrPipelineSteps = [
  { step: "01", title: "Login & OTP Verification", desc: "User logs in with ID/Password & verifies 5-digit OTP", icon: "🔑" },
  { step: "02", title: "Assigned Route Selection", desc: "Select assigned Meter Reading Division (MRD) & route", icon: "📍" },
  { step: "03", title: "Find Consumer / KNO", desc: "Search consumer record by Name, KNO, or Address", icon: "🔍" },
  { step: "04", title: "Capture Meter Photo", desc: "Open mobile camera and take clear photo of water meter", icon: "📷" },
  { step: "05", title: "AI OCR Auto-Detection", desc: "OCR extracts meter reading (e.g. photo → 01228)", icon: "🤖" },
  { step: "06", title: "Human Verification & Edit", desc: "Compare OCR result against photo; Edit or Re-scan if needed", icon: "✍️" },
  { step: "07", title: "Save & Offline SYNC ALL", desc: "Save reading locally; tap SYNC ALL when back online", icon: "💾" },
  { step: "08", title: "Supervisor UMS Approval", desc: "Supervisor reviews photo evidence & approves for final bill", icon: "📋" },
];

export const ocrRoleTasks = {
  meterReader: {
    icon: "🚶‍♂️",
    title: "Meter Reader / Field Staff Work",
    items: [
      "Visit assigned consumer property & verify KNO",
      "Capture meter photo & trigger AI OCR detection",
      "Compare OCR reading with photo & perform manual edit/re-scan if needed",
      "Save readings offline & execute SYNC ALL when connected",
    ],
  },
  supervisor: {
    icon: "👔",
    title: "Supervisor / UMS User Work",
    items: [
      "Log in to DJB User Management System (UMS)",
      "Navigate to Meter Read → Approval Queue",
      "Audit meter photo evidence vs submitted OCR reading",
      "Approve verified readings & generate / download final water bills",
    ],
  },
};

export const podPipelineSteps = [
  { step: "01", title: "Scan Bill QR Code", desc: "Open Bill Delivery → QR Scan & scan printed bill QR code", icon: "📷" },
  { step: "02", title: "Verify Bill & KNO", desc: "App verifies auto-detected KNO & Bill Number against physical bill", icon: "🔍" },
  { step: "03", title: "Capture Bill Photo", desc: "Take a clear camera photo of the delivered bill as digital evidence", icon: "📸" },
  { step: "04", title: "Select Delivery Outcome", desc: "Record status: In Hand, Family, Security, Letterbox, Refused, or Locked", icon: "📋" },
  { step: "05", title: "Confirm & Submit", desc: "Verify summary and submit Proof of Delivery (PoD) transaction", icon: "✅" },
];

export const podRelationshipSteps = [
  { icon: "📸", title: "Meter Reading App", desc: "Photo & OCR Reading" },
  { icon: "📄", title: "Bill Generation", desc: "Printed with QR Code" },
  { icon: "📦", title: "PoD App", desc: "QR Scan & Proof of Delivery" },
];

export const nirikshanPipelineSteps = [
  { step: "01", title: "Fresh User Login", desc: "Always start with fresh login (Logout → Close → Reopen → Login) to prevent stale session errors", icon: "🔑" },
  { step: "02", title: "Select Assigned Inspection", desc: "Open assigned section, select target record & carefully verify project/location details", icon: "📋" },
  { step: "03", title: "Start Nirikshan", desc: "Tap 'Start Nirikshan / Start Inspection' to initiate digital field inspection session", icon: "🚀" },
  { step: "04", title: "Record Inspection Findings", desc: "Enter observations, inspection findings & project-specific dynamic form fields", icon: "✍️" },
  { step: "05", title: "Capture Photographs", desc: "Take clear, relevant photographs showing the required subject; retake blurred photos immediately", icon: "📸" },
  { step: "06", title: "GPS & Location Validation", desc: "Enable GPS & location permissions to validate and attach exact site location coordinates", icon: "📍" },
  { step: "07", title: "Uninterrupted Execution", desc: "Complete inspection without leaving app or pausing to avoid session timeouts & auth errors", icon: "⚡" },
  { step: "08", title: "Quality Control Review", desc: "Verify inspection type, findings, photos, GPS tag, remarks & status prior to submission", icon: "🔎" },
  { step: "09", title: "Single Click Submit", desc: "Press Submit ONCE & wait for application processing without double-tapping", icon: "📤" },
  { step: "10", title: "Verify Confirmation", desc: "Confirm submission success message & verify status change to 'Submitted'", icon: "✅" },
];

export const nirikshanAppEcosystem = [
  {
    name: "Meter Reading App",
    purpose: "Record water-meter readings and billing",
    flow: "Meter Photo → OCR → Verify Reading → Bill",
    icon: "📸",
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
  },
  {
    name: "PoD App",
    purpose: "Record delivery of the generated bill",
    flow: "Scan Bill QR → Bill Photo → Delivery Status → Submit",
    icon: "📦",
    color: "#f59e0b",
    bgColor: "#fffbeb",
  },
  {
    name: "Nirikshan App",
    purpose: "Conduct field inspections & site evidence capture",
    flow: "Assigned Inspection → Field Visit → Evidence → Inspection Report",
    icon: "🔍",
    color: "#0284c7",
    bgColor: "#f0f9ff",
  },
];

export const nirikshanTroubleshooting = [
  {
    issue: "Authorization Error",
    msg: "'You are not authorised to perform the actions'",
    fix: "Logout → Close App → Reopen → Login Again → Verify Dashboard → Open Nirikshan",
    icon: "🚫",
  },
  {
    issue: "Inspection Not Visible",
    msg: "Assigned inspection missing from list",
    fix: "Refresh → Fresh Login → Verify Assignment. Contact supervisor if still unavailable.",
    icon: "🙈",
  },
  {
    issue: "GPS / Location Problem",
    msg: "GPS coordinates not captured or failed",
    fix: "Turn GPS ON → Grant Location Permissions → Ensure Connectivity → Retry capture",
    icon: "📍",
  },
  {
    issue: "Photo Capture Failure",
    msg: "Camera black screen or retake needed",
    fix: "Check Camera Permission → Ensure clear lighting → Retake photo immediately",
    icon: "📷",
  },
  {
    issue: "App Interruption / Crash",
    msg: "App unexpectedly closed or backgrounded",
    fix: "Reopen app → Fresh login if required → Verify saved info & inspection status before resuming",
    icon: "⚠️",
  },
];

export const pdfGuideText = {
  selectServiceTitle: "Select Service PDF Guide",
  hintBanner: "For best viewing and printing options, click 'Print / Download PDF' to open the document in full page view.",
  comingSoonTitle: "PDF Manual Coming Soon",
  comingSoonDesc:
    "The official PDF user manual for this service is currently being finalized. Please switch to the Live Guide tab to view the interactive documentation.",
};

const userGuideConfig = {
  heroConfig,
  filterHeaderConfig,
  ekycGuides,
  pdfServices,
  moduleOptions,
  liveGuideCards,
  faqs,
  ekycRoleCards,
  ocrPipelineSteps,
  ocrRoleTasks,
  podPipelineSteps,
  podRelationshipSteps,
  nirikshanPipelineSteps,
  nirikshanAppEcosystem,
  nirikshanTroubleshooting,
  pdfGuideText,
};

export default userGuideConfig;

