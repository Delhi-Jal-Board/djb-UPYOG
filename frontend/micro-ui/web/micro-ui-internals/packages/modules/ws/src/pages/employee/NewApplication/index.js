import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  ActionBar,
  CardLabel,
  CardLabelError,
  CardSectionSubText,
  CardText,
  CheckBox,
  CollapsibleCardPage,
  DatePicker,
  Dropdown,
  RadioButtons,
  SubmitBar,
  TextArea,
  TextInput,
  Toast,
  UploadFile,
  Loader,
  LabelFieldPair,
  VerticalTimeline,
} from "@djb25/digit-ui-react-components";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createPayloadOfWS, updatePayloadOfWS } from "../../../utils";
import dropdownData from "../../../config/dropdown_data.json";

const FORM_STORAGE_KEY = "WS_EMPLOYEE_NEW_APPLICATION_FORM";
const MAX_FILE_SIZE = 5242880;
const SUPPORTED_FILE_TYPES = /(\.pdf|\.png|\.jpe?g)$/i;

const DECLARATION_POINTS = [
  "I understand that sanction of connection does not acknowledge or confer any title, ownership or occupancy right in favour of the applicant.",
  "I declare that there is no dispute on property and there is no stay from any court of law against obtaining water/ sewerage connection.",
  "The Property on which connection is being applied is not booked/unauthorized/encroachment of Govt.Land/misuse etc.",
  "I further undertake that in case of any dispute about the ownership of the property I will absolve DJB from any legal battle in the court of law as the water connection applied for is related to supply of potable water and not to decide the ownership of property.",
  "I further undertake to pay the charges as and when demanded by DJB, and in the event of non-payment, DJB will be at liberty to disconnect the services being provided by DJB.",
  "I further undertake that I have not taken 'DJB Employee Rebate' against any other Premise/Connection.",
  "In case of variation in plot size as per document submitted by the undersigned and on actual measurement by DJB representative, difference of Infrastructure charge/any other charge on actual measurement will be paid by me.",
  "In case connection is found non-feasible on technical ground as per any prevalent policy of DJB the water connection may be denied or if sanctioned inadvertently, the said sanction may be withdrawn and may be disconnected without any notice.",
  "I hereby undertake that all the facts and documents submitted are true and correct, in case of any misrepresentation or wrong facts etc., sanction of connection may be disconnected without any notice..",
];

const NAME_PATTERN = /^[a-zA-Z\s.'-]{1,50}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;
const OFFICE_PATTERN = /^[0-9]{6,12}$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const NUMBER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_PATTERN = /^[0-9]{9,18}$/;
const COLLAPSIBLE_CONTENT_TAB = "__WS_SECTION_CONTENT__";

const createOption = (code, name) => ({ code, name });

const SUB_LOCALITY_OPTIONS = {};

const WATER_CONNECTION_USED_BY_OPTIONS = [
  createOption("5 Star Hotel", "5 Star Hotel"),
  createOption("4/5 Star Hotel", "4/5 Star Hotel"),
  createOption("Ex-Army Service", "Ex-Army Service"),
  createOption("General", "General"),
  createOption("Bank", "Bank"),
  createOption("Airport", "Airport"),
  createOption("Govt. College", "Govt. College"),
];

const PROPERTY_CATEGORY_OPTIONS = [
  createOption("COMMERCIAL", "Commercial"),
  createOption("INDUSTRIAL", "Industrial"),
  createOption("INSTITUTIONAL", "Institutional"),
  createOption("MIXED", "Mixed"),
];

const PROPERTY_TYPE_OPTIONS = [
  createOption("APARTMENT", "Apartment"),
  createOption("BANQUET_HALL", "Banquet Hall"),
  createOption("BUNGALOWS", "Bungalows"),
  createOption("DDA_FLATS", "DDA flats"),
  createOption("DHARAMSHALAS_HOSTELS", "Dharamshalas or Hostels"),
  createOption("GOVT_FLATS", "Govt. Flats"),
  createOption("GROUP_HOUSING_SOCIETY", "Group Housing Society"),
  createOption("HOTEL_GUEST_HOUSES", "Hotel or Guest Houses"),
  createOption("INDIVIDUAL_HOUSE", "Individual House"),
  createOption("MALL_CINEPLEX", "Mall or Cineplex"),
  createOption("OFFICE_COMPLEX", "Office complex"),
  createOption("SCHOOL", "School"),
  createOption("HOSPITAL_NURSING_HOME", "Hospital/Nursing Home"),
];

const USAGE_TYPE_OPTIONS = [
  createOption("BSES_RAJDHANI", "B.S.E.S. RAJDHANI"),
  createOption("BSES_YAMUNA", "B.S.E.S. YAMUNA"),
  createOption("BANQUET_HALL_PARTY_HALL", "Banquet hall/ Party hall"),
  createOption("BEAUTY_PARLORS", "Beauty Parlors"),
  createOption("BLIND_SCHOOLS", "Blind Schools"),
  createOption("BOTTLING_PLANT", "Bottling Plant"),
  createOption("CPWD", "C.P.W.D."),
  createOption("CENTRAL_GOVT_OFFICES", "Central Govt. Offices"),
  createOption("CINEPLEX", "Cineplex"),
  createOption("CLINIC_PATHLAB", "Clinic/Pathlab"),
  createOption("COOP_GROUP_HOUSING", "Co-operative Group Housing Society"),
  createOption("COLD_STORAGE", "Cold Storage"),
  createOption("COLOUR_DYE_SHOP", "Colour Dye shop/factory"),
  createOption("COOLING_PLANT", "Cooling Plant"),
  createOption("COURTS", "Courts"),
  createOption("DSIIDC", "D.S.I.I.D.C"),
  createOption("DDA", "Delhi Development Authority"),
  createOption("DELHI_FIRE_SERVICE", "Delhi Fire Service (Fire Station)"),
  createOption("DELHI_GOVT_OFFICE", "Delhi Govt. Office"),
];

const NO_OF_FLOORS_OPTIONS = [
  createOption("BASEMENT", "Basement"),
  createOption("GROUND_FLOOR", "Ground Floor"),
  createOption("1_FLOOR", "1 Floor"),
  createOption("2_FLOOR", "2 Floor"),
  createOption("3_FLOOR", "3 Floor"),
  createOption("4_FLOOR", "4 Floor"),
  createOption("5_FLOOR", "5 Floor"),
  createOption("6_FLOOR", "6 Floor"),
];

const PROOF_OF_IDENTITY_OPTIONS = [
  createOption("AADHAAR", "Aadhaar"),
  createOption("PAN", "PAN"),
  createOption("VOTER_ID", "Voter ID"),
  createOption("PASSPORT", "Passport"),
  createOption("DRIVING_LICENSE", "Driving License"),
];

const OWNERSHIP_DOCUMENTS_OPTIONS = [
  createOption("ELECTRICITY_BILL", "Electricity bills"),
  createOption("PROPERTY_TAX_RECEIPT", "Property Tax Receipt"),
  createOption("SALE_DEED", "Sale Deed"),
];

const OTHER_DOCUMENTS_OPTIONS = [createOption("NOC_FROM_OWNER", "NOC From Owner"), createOption("OTHERS", "Others")];

const OWNERSHIP_STATUS_OPTIONS = [
  createOption("SELF_OWNED", "Self Owned"),
  createOption("LEASED", "Leased"),
  createOption("RENTED", "Rented"),
  createOption("GOVERNMENT_ALLOTTED", "Government Allotted"),
];

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const ViewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CameraCaptureModal = ({ onCapture, onClose, t }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        setError(t("WS_CAMERA_ACCESS_ERROR") || "Camera Access Error");
        console.error("Error accessing camera: ", err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);

      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], `applicant_photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      }, "image/jpeg");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error ? (
        <div style={{ color: "white", marginBottom: "20px" }}>{error}</div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ maxWidth: "100%", maxHeight: "80%", backgroundColor: "black", transform: "scaleX(-1)" }}
        />
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
        {!error && (
          <button
            type="button"
            onClick={capturePhoto}
            style={{
              padding: "10px 20px",
              background: "#f47738",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {t("WS_CAPTURE_PHOTO") || "Capture"}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "10px 20px",
            background: "white",
            color: "#f47738",
            border: "1px solid #f47738",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {t("CS_COMMON_CANCEL") || "Cancel"}
        </button>
      </div>
    </div>
  );
};

const DEFAULT_SECTION_STATE = {
  application: true,
  applicant: true,
  contact: true,
  djbEmployee: true,
  governmentEmployee: true,
  address: true,
  usage: true,
  bank: true,
  rainWaterHarvesting: true,
  documents: true,
  declaration: true,
};

const DEFAULT_FORM_VALUES = {
  typeOfRequest: null,
  connectionType: null,
  applicant: {
    firstName: "",
    middleName: "",
    lastName: "",
    ParentorSpouse: "",
    applicantIdProofFile: null,
  },
  contact: {
    emailId: "",
    mobileNumber: "",
    whatsAppNumber: "",
  },
  applicationSelection: {
    serviceType: dropdownData.serviceTypes[0],
    applicantType: dropdownData.applicantTypes[0],
    connectionType: dropdownData.connectionTypes[0],
    categoryType: dropdownData.categoryTypes[1],
    subCategory: dropdownData.subCategories[0],
    temporaryConnection: null,
    ownerAuthorizationDoc: null,
    ownerContactNumber: "",
    ownerOtp: "",
    isOwnerVerified: false,
    domesticType: { code: "INDIVIDUAL", name: "Individual" },
    commercialType: null,
    departmentType: null,
    govtOrganization: {
      organizationName: "",
      natureOfWork: "",
      organizationDocument: null,
    },
  },
  djbEmployee: {
    isDjbEmployee: false,
    employeeId: "",
    retirementDate: "",
    officeNameAndAddress: "",
  },
  governmentEmployee: {
    isGovernmentEmployee: false,
    organizationName: "",
    natureOfWork: "",
    organizationDocument: null,
  },
  propertyAddress: {
    address: "",
    landmark: "",
    pinCode: "",
    locality: null,
    subLocality: null,
    state: "",
    district: "",
    city: "",
    street: "",
    houseNo: "",
    block: "",
    assembly: null,
    ward: null,
  },
  useDetails: {
    propertyCategory: null,
    propertyType: null,
    noOfFloors: null,
    hospitalBeds: "",
    plotArea: "",
    builtUpArea: "",
    waterConnectionCategory: null,
    gender: null,
    NumberofDwellingUnits: "",
    SelectYearofConstruction: null,
    WaterConnectionUsageType: null,
  },
  bankDetails: {
    bankName: "",
    branchName: "",
    ifscCode: "",
    bankAccountNumber: "",
  },
  rainWaterHarvesting: {
    applyForAdequacyCertificate: false,
  },
  documents: {
    applicantPhoto: null,
    proofOfIdentity: null,
    identityProofNumber: "",
    identityProofFile: null,
    ownershipStatus: null,
    ownershipDocumentNumber: "",
    ownershipDocumentFile: null,
    otherDocument: null,
    otherDocumentNumber: "",
    otherDocumentFile: null,
  },
  declaration: {
    submittedBy: null,
    signatureFile: null,
    agree: false,
  },
  zro: null,
  cpt: { id: "", details: null },
};

const fieldWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
};

const secondaryButtonStyle = {
  background: "#FFFFFF",
  border: "1px solid #0B4B66",
  boxShadow: "none",
  color: "#0B4B66",
};

const actionBarStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const ProfileImagePreview = ({ fileStoreId }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (fileStoreId) {
        try {
          const tenantId = Digit.ULBService.getStateId();
          const response = await Digit.UploadServices.Filefetch([fileStoreId], tenantId);
          const url = response?.data?.fileStoreIds?.[0]?.url;
          if (url) {
            let differentFormats = url?.split(",") || [];
            let fileURL = "";
            differentFormats.map((link) => {
              if (!link.includes("large") && !link.includes("medium") && !link.includes("small")) {
                fileURL = link;
              }
            });
            setImageUrl(fileURL || differentFormats[0]);
          }
        } catch (err) {
          console.error("Error fetching image URL:", err);
          setImageUrl(null);
        }
      }
    };
    fetchImageUrl();
  }, [fileStoreId]);

  if (!imageUrl) return null;
  return <img src={imageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
};

// const ProfileImageUpload = ({ value, onUpload, isUploading, error, t, label, required }) => {
//   const fileInputRef = React.useRef(null);
//   const fileStoreId = value?.fileStoreId;
//   const [imageUrl, setImageUrl] = useState(null);

//   useEffect(() => {
//     const fetchImageUrl = async () => {
//       if (fileStoreId) {
//         try {
//           const tenantId = Digit.ULBService.getStateId();
//           const response = await Digit.UploadServices.Filefetch([fileStoreId], tenantId);
//           const url = response?.data?.fileStoreIds?.[0]?.url;
//           if (url) {
//             let differentFormats = url?.split(",") || [];
//             let fileURL = "";
//             differentFormats.map((link) => {
//               if (!link.includes("large") && !link.includes("medium") && !link.includes("small")) {
//                 fileURL = link;
//               }
//             });
//             setImageUrl(fileURL || differentFormats[0]);
//           }
//         } catch (err) {
//           console.error("Error fetching image URL:", err);
//           setImageUrl(null);
//         }
//       } else {
//         setImageUrl(null);
//       }
//     };
//     fetchImageUrl();
//   }, [fileStoreId]);

//   const handleEditClick = () => {
//     fileInputRef.current.click();
//   };

//   return (
//     <div className="avatar-upload-container">
//       {label && <CardLabel style={{ textAlign: "center", marginBottom: "16px", fontWeight: "700" }}>{`${t(label)}${required ? "*" : ""}`}</CardLabel>}
//       <div className="avatar-wrapper">
//         <div className="avatar-circle" onClick={handleEditClick}>
//           {imageUrl ? (
//             <img src={imageUrl} alt="Profile" />
//           ) : (
//             <div className="avatar-placeholder">
//               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
//                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//                 <circle cx="12" cy="7" r="4" />
//               </svg>
//             </div>
//           )}
//         </div>
//         <div className="avatar-edit-icon" onClick={handleEditClick}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B4B66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
//           </svg>
//         </div>
//       </div>
//       <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={onUpload} />
//       {isUploading && <div style={{ fontSize: "14px", marginTop: "8px", color: "#505A5F" }}>Uploading...</div>}
//       {error && <CardLabelError style={{ textAlign: "center", marginTop: "8px" }}>{error}</CardLabelError>}
//     </div>
//   );
// };

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#0B4B66",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  padding: 0,
  textDecoration: "underline",
};

const getStoredFormData = () => {
  if (typeof window === "undefined") return {};
  try {
    const savedData = window.sessionStorage.getItem(FORM_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    return {};
  }
};

const buildDefaultValues = () => ({
  zro: DEFAULT_FORM_VALUES.zro,
  typeOfRequest: DEFAULT_FORM_VALUES.typeOfRequest,
  connectionType: DEFAULT_FORM_VALUES.connectionType,
  applicant: { ...DEFAULT_FORM_VALUES.applicant },
  contact: { ...DEFAULT_FORM_VALUES.contact },
  djbEmployee: { ...DEFAULT_FORM_VALUES.djbEmployee },
  propertyAddress: { ...DEFAULT_FORM_VALUES.propertyAddress },
  useDetails: { ...DEFAULT_FORM_VALUES.useDetails },
  bankDetails: { ...DEFAULT_FORM_VALUES.bankDetails },
  rainWaterHarvesting: { ...DEFAULT_FORM_VALUES.rainWaterHarvesting },
  applicationSelection: { ...DEFAULT_FORM_VALUES.applicationSelection },
  documents: { ...DEFAULT_FORM_VALUES.documents },
  declaration: { ...DEFAULT_FORM_VALUES.declaration },
  cpt: { id: "", details: null },
});

const resolveNestedValue = (value, path) =>
  path.split(".").reduce((accumulator, currentKey) => {
    if (accumulator === null || accumulator === undefined) return undefined;
    return accumulator[currentKey];
  }, value);

const getDisplayValue = (value, t) => {
  if (value === null || value === undefined || value === "") return t("CS_COMMON_NOT_AVAILABLE");
  if (typeof value === "boolean") return value ? t("CS_COMMON_YES") : t("CS_COMMON_NO");
  if (typeof value === "object") {
    if (value?.fileName) return value.fileName;
    if (value?.i18nKey) return t(value.i18nKey);
    if (value?.name) return t(value.name);
    if (value?.code) return t(value.code);
  }
  return t(String(value));
};

const FieldBlock = ({ label, required, error, children, hint, isFullWidth }) => {
  return (
    <div style={{ ...fieldWrapperStyle, ...(isFullWidth ? { gridColumn: "1 / -1" } : {}) }}>
      <CardLabel style={{ fontWeight: "600", marginBottom: "0px" }}>{required ? `${label} *` : label}</CardLabel>
      {children}
      {hint ? <CardText style={{ color: "#505A5F", fontSize: "14px", marginBottom: "0px", marginTop: "0px" }}>{hint}</CardText> : null}
      {error ? <CardLabelError>{error?.message || error}</CardLabelError> : null}
    </div>
  );
};

const SectionCard = ({ title, description, isOpen = true, children, sectionRef, sectionKey, onEditClick }) => {
  return (
    <div className="ws-new-application-collapsible" style={{ marginBottom: "16px", position: "relative" }} ref={sectionRef} data-section={sectionKey}>
      {onEditClick && (
        <div
          onClick={onEditClick}
          style={{
            position: "absolute",
            top: "20px",
            right: "50px",
            zIndex: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#0B4B66",
            fontSize: "14px",
            fontWeight: "600",
          }}
          title="Edit Section"
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
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Edit
        </div>
      )}
      <CollapsibleCardPage defaultOpen={isOpen} defaultTab={COLLAPSIBLE_CONTENT_TAB} tabs={[COLLAPSIBLE_CONTENT_TAB]} title={title}>
        {() => (
          <React.Fragment>
            {description ? <CardSectionSubText style={{ marginBottom: "16px" }}>{description}</CardSectionSubText> : null}
            <div className="formcomposer-section-grid">{children}</div>
          </React.Fragment>
        )}
      </CollapsibleCardPage>
    </div>
  );
};

const handleView = async (fileStoreId, tenantId) => {
  try {
    const response = await Digit.UploadServices.Filefetch([fileStoreId], tenantId);
    const url = response?.data?.fileStoreIds?.[0]?.url;
    if (url) {
      const differentFormats = url?.split(",") || [];
      let fileURL = "";
      differentFormats.map((link) => {
        if (!link.includes("large") && !link.includes("medium") && !link.includes("small")) {
          fileURL = link;
        }
      });
      window.open(fileURL || differentFormats[0], "_blank");
    }
  } catch (error) {
    console.error("Error fetching file URL:", error);
  }
};

const PreviewItem = ({ label, value, isFullWidth }) => {
  const { t } = useTranslation();
  const stateId = Digit.ULBService.getStateId();
  const isFile = value && typeof value === "object" && value?.fileStoreId;

  return (
    <div style={{ ...fieldWrapperStyle, ...(isFullWidth ? { gridColumn: "1 / -1" } : {}) }}>
      <CardLabel style={{ fontWeight: "600", marginBottom: "0px" }}>{t(label)}</CardLabel>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <CardText style={{ marginBottom: "0px", marginTop: "0px" }}>{getDisplayValue(value, t)}</CardText>
        {isFile && (
          <div
            onClick={() => handleView(value.fileStoreId, stateId)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#0B4B66" }}
            title={t("CS_COMMON_VIEW_DOCUMENT")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

const FileUploadField = ({ id, label, value, onUpload, onDelete, error, isUploading, helperText, required }) => {
  return (
    <FieldBlock label={label} required={required} error={error} hint={helperText}>
      <UploadFile
        accept="image/*,.pdf,.png,.jpeg,.jpg"
        buttonType="button"
        error={!!error}
        id={id}
        message={value?.fileStoreId ? "1 file uploaded" : "No file uploaded"}
        onDelete={onDelete}
        onUpload={onUpload}
      />
      {isUploading && <CardText style={{ marginTop: "8px" }}>Uploading file...</CardText>}
      {value?.fileStoreId && !isUploading && (
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#F3F4F6",
            padding: "4px 12px",
            borderRadius: "20px",
            width: "fit-content",
            border: "1px solid #E5E7EB",
          }}
        >
          <CardText style={{ margin: 0, fontSize: "14px", color: "#374151", fontWeight: "500" }}>{value.fileName}</CardText>
          <div onClick={onDelete} style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#6B7280" }} title="Remove File">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      )}
    </FieldBlock>
  );
};

const NewApplication = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { data: allCities, isLoading } = Digit.Hooks.useTenants();

  const stateId = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId() || Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code;

  const [previewMode, setPreviewMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [collapsedSections, setCollapsedSections] = useState(DEFAULT_SECTION_STATE);
  const [showToast, setShowToast] = useState(null);
  const [uploadingFields, setUploadingFields] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // API Integration States
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [appDetails, setAppDetails] = useState({});
  const [waterAndSewerageBoth, setWaterAndSewerageBoth] = useState(null);
  const [propertyId, setPropertyId] = useState(new URLSearchParams(location.search).get("propertyId"));
  const initialFormValues = buildDefaultValues();
  const [city, setCity] = useState("");

  const { data: ZROLocation } = Digit.Hooks.ws.useWSConfigMDMS.ZROLocation(tenantId);
  const { data: ConnectionType } = Digit.Hooks.ws.useWSConfigMDMS.ConnectionCategory(tenantId);

  const mappedZROLocation = useMemo(() => {
    return ZROLocation?.map((item) => ({
      ...item,
      i18nKey: item?.i18nKey || item?.name || item?.code,
    }));
  }, [ZROLocation]);

  useEffect(() => {
    if (allCities && tenantId && !city) {
      const currentCity = allCities?.find((c) => c.code === tenantId);
      if (currentCity) {
        setCity(currentCity);
        setValue("propertyAddress.city", currentCity);
      }
    }
  }, [allCities, tenantId]);

  const { data: egovLocationData } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  const boundaryData = useMemo(() => {
    const tenantBoundary = egovLocationData?.["egov-location"]?.TenantBoundary || [];
    const revenueData = tenantBoundary.find((item) => item?.hierarchyType?.code === "REVENUE");
    const boundary = revenueData?.boundary || [];
    return Array.isArray(boundary) ? boundary : [boundary];
  }, [egovLocationData]);

  const structuredLocalityData = useMemo(() => {
    let localities = [];
    const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

    const extractLocalities = (node, zone = null, ward = null) => {
      if (!node) return;

      let currentZone = zone;
      let currentWard = ward;

      if (node.label === "Zone" || node.label === "ZONE") {
        currentZone = node.localname || node.code || node.name;
      }
      if (node.label === "Ward" || node.label === "WARD" || node.label === "Block" || node.label === "BLOCK") {
        currentWard = node.code || node.localname || node.name;
      }

      if (node.label === "Locality" || node.label === "LOCALITY") {
        localities.push({
          ...node,
          name: node.localname || node.name || node.code,
          i18nKey: node.i18nKey || `${tenantId.replace(".", "_")}_REVENUE_${node.code}`.toUpperCase(),
          zone: currentZone,
          ward: currentWard,
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => extractLocalities(child, currentZone, currentWard));
      }
    };

    boundaries.forEach((rootNode) => extractLocalities(rootNode));

    return localities;
  }, [boundaryData, tenantId]);

  const fetchedPincodes = useMemo(() => {
    const pinSet = new Set();
    structuredLocalityData.forEach((loc) => {
      if (loc.pincode) {
        const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
        pins.forEach((p) => {
          if (p) {
            const sanitizedPin = p.toString().split(".")[0];
            pinSet.add(sanitizedPin);
          }
        });
      }
    });

    return Array.from(pinSet)
      .sort()
      .map((pin) => ({
        code: pin,
        name: pin,
        i18nKey: pin,
      }));
  }, [structuredLocalityData]);

  // Refs for auto-stepper
  const sectionRefs = {
    application: React.useRef(null),
    applicant: React.useRef(null),
    contact: React.useRef(null),
    djbEmployee: React.useRef(null),
    governmentEmployee: React.useRef(null),
    propertyAddress: React.useRef(null),
    useDetails: React.useRef(null),
    bankDetails: React.useRef(null),
    documents: React.useRef(null),
    declaration: React.useRef(null),
  };

  // Current Year
  const currentYear = new Date().getFullYear();

  // Generate 1970 to Current Year
  const yearOptions = [];
  for (let year = 1970; year <= currentYear; year++) {
    yearOptions.push({
      i18nKey: `${year}`,
      code: `${year}`,
      value: `${year}`,
    });
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: initialFormValues,
    shouldUnregister: false, // Ensures values persist during preview mode
  });

  const formValues = watch();
  const isGovernmentOrganization = watch("applicant.isGovernmentOrganization");
  const isDjbEmployee = watch("djbEmployee.isDjbEmployee");
  const isGovernmentEmployee = watch("governmentEmployee.isGovernmentEmployee");
  const selectedPropertyType = watch("useDetails.propertyType");
  const selectedLocality = watch("propertyAddress.locality");
  const selectedSubLocality = watch("propertyAddress.subLocality");
  const pCode = watch("propertyAddress.pinCode");

  const filteredLocalities = useMemo(() => {
    if (!pCode) return structuredLocalityData;
    return structuredLocalityData.filter((loc) => {
      if (!loc.pincode) return false;
      const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
      return pins.some((p) => p.toString() === pCode);
    });
  }, [structuredLocalityData, pCode]);

  const selectedSubCategory = watch("applicationSelection.subCategory");
  const selectedCommercialType = watch("applicationSelection.commercialType");
  const subCategoryIsCommercial = selectedSubCategory?.code === "COMMERCIAL";
  const commercialTypeIsGov = selectedCommercialType?.code === "GOV";
  const hasPendingUpload = Object.values(uploadingFields).some(Boolean);
  const isHospitalProperty = selectedPropertyType?.code === "HOSPITAL" || selectedPropertyType?.code === "HOSPITAL_NURSING_HOME";

  const selectedApplicantType = watch("applicationSelection.applicantType");
  const isTenantOrRelative = selectedApplicantType?.code === "TENANT" || selectedApplicantType?.code === "RELATIVE";
  const isOwnerVerified = watch("applicationSelection.isOwnerVerified");
  const subCategoryIsDomestic = selectedSubCategory?.code === "DOMESTIC";

  const selectedConnectionType = watch("applicationSelection.connectionType");
  const connectionTypeIsTemporary = selectedConnectionType?.code === "Temporary";
  const selectedDomesticType = watch("applicationSelection.domesticType");
  const activeType = selectedSubCategory?.code === "DOMESTIC" ? selectedDomesticType : selectedCommercialType;

  const applicantSectionTitle = useMemo(() => {
    if (activeType?.code === "INDIVIDUAL") return "Applicant Details";
    if (activeType?.code === "ORGANIZATION") return "Authorized Person Details";
    return "Details of Applicant";
  }, [activeType]);

  const timelineConfig = [
    { sectionId: "application", route: "application-selection", actions: "Application Selection" },
    { sectionId: "applicant", route: "applicant-details", actions: applicantSectionTitle },
    ...(isDjbEmployee ? [{ sectionId: "djbEmployee", route: "djb-employee", actions: "For DJB Employee" }] : []),
    ...(isGovernmentEmployee ? [{ sectionId: "governmentEmployee", route: "government-employee", actions: "For Government Employee" }] : []),
    { sectionId: "propertyAddress", route: "property-address", actions: "Property Address" },
    { sectionId: "useDetails", route: "use-details", actions: "Property & Connection Use Details" },
    { sectionId: "bankDetails", route: "bank-details", actions: "Bank Details" },
    { sectionId: "documents", route: "documents", actions: "Documents to be Attached" },
    { sectionId: "declaration", route: "declaration", actions: "Declaration/Undertaking" },
    { sectionId: "Review", route: "review", actions: "Review Application" },
  ].map((step, index) => ({
    ...step,
    timeLine: [{ actions: step.actions, currentStep: index + 1 }],
  }));

  // Auto-stepper intersection observer
  useEffect(() => {
    if (previewMode) return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -50% 0px", // Focus on the upper half of the screen
      threshold: [0, 0.1, 0.5, 1.0],
    };

    const handleIntersection = (entries) => {
      // Find the entry that has the largest intersection ratio
      const mostVisible = entries.reduce((prev, current) => {
        return current.intersectionRatio > (prev ? prev.intersectionRatio : 0) ? current : prev;
      }, null);

      if (mostVisible && mostVisible.isIntersecting) {
        const sectionKey = mostVisible.target.getAttribute("data-section");
        const stepIndex = timelineConfig.findIndex((c) => c.sectionId === sectionKey);
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex + 1);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [previewMode, sectionRefs, timelineConfig]);

  // --- API HOOKS ---
  const { data: propertyDetails, isLoading: isPropertyLoading } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: tenantId },
    { filters: { propertyIds: propertyId }, tenantId: tenantId, enabled: !!propertyId }
  );

  const { mutate: waterMutation } = Digit.Hooks.ws.useWaterCreateAPI("WATER");
  const { mutate: waterUpdateMutation } = Digit.Hooks.ws.useWSApplicationActions("WATER");
  const { mutate: sewerageMutation } = Digit.Hooks.ws.useWaterCreateAPI("SEWERAGE");
  const { mutate: sewerageUpdateMutation } = Digit.Hooks.ws.useWSApplicationActions("SEWERAGE");

  useEffect(() => {
    if (!isGovernmentOrganization) {
      setValue("applicant.governmentOrganizationName", "");
      clearErrors("applicant.governmentOrganizationName");
    }
  }, [isGovernmentOrganization, setValue, clearErrors]);

  useEffect(() => {
    if (!isDjbEmployee) {
      setValue("djbEmployee.employeeId", "");
      setValue("djbEmployee.retirementDate", "");
      setValue("djbEmployee.officeNameAndAddress", "");
      clearErrors("djbEmployee.employeeId");
      clearErrors("djbEmployee.retirementDate");
      clearErrors("djbEmployee.officeNameAndAddress");
    }
  }, [isDjbEmployee, setValue, clearErrors]);

  useEffect(() => {
    if (!isGovernmentEmployee) {
      setValue("governmentEmployee.organizationName", "");
      setValue("governmentEmployee.natureOfWork", "");
      setValue("governmentEmployee.organizationDocument", null);
      clearErrors("governmentEmployee.organizationName");
      clearErrors("governmentEmployee.natureOfWork");
      clearErrors("governmentEmployee.organizationDocument");
    }
  }, [isGovernmentEmployee, setValue, clearErrors]);

  useEffect(() => {
    if (!isHospitalProperty) {
      setValue("useDetails.hospitalBeds", "");
      clearErrors("useDetails.hospitalBeds");
    }
  }, [isHospitalProperty, setValue, clearErrors]);

  useEffect(() => {
    if (!isTenantOrRelative) {
      setValue("applicationSelection.ownerAuthorizationDoc", null);
      setValue("applicationSelection.ownerContactNumber", "");
      setValue("applicationSelection.ownerOtp", "");
      setValue("applicationSelection.isOwnerVerified", false);
      setIsOtpSent(false);
      clearErrors("applicationSelection.ownerAuthorizationDoc");
      clearErrors("applicationSelection.ownerContactNumber");
      clearErrors("applicationSelection.ownerOtp");
    }
  }, [isTenantOrRelative, setValue, clearErrors]);

  useEffect(() => {
    if (!subCategoryIsDomestic) {
      setValue("applicationSelection.domesticType", null);
      clearErrors("applicationSelection.domesticType");
    }
  }, [subCategoryIsDomestic, setValue, clearErrors]);

  useEffect(() => {
    if (activeType?.code !== "ORGANIZATION") {
      setValue("applicationSelection.departmentType", null);
      setValue("applicationSelection.govtOrganization.organizationName", "");
      setValue("applicationSelection.govtOrganization.natureOfWork", "");
      setValue("applicationSelection.govtOrganization.organizationDocument", null);
      clearErrors("applicationSelection.departmentType");
      clearErrors("applicationSelection.govtOrganization.organizationName");
      clearErrors("applicationSelection.govtOrganization.natureOfWork");
      clearErrors("applicationSelection.govtOrganization.organizationDocument");
    }
  }, [activeType?.code, setValue, clearErrors]);

  useEffect(() => {
    if (!connectionTypeIsTemporary) {
      setValue("applicationSelection.temporaryConnection", null);
      clearErrors("applicationSelection.temporaryConnection");
    }
  }, [connectionTypeIsTemporary, setValue, clearErrors]);

  useEffect(() => {
    // Logic for subLocality was removed as it is replaced by MDMS locality logic
  }, [selectedLocality?.code, setValue]);

  const closeToast = () => setShowToast(null);
  const closeToastOfError = () => setShowToast(null);

  const toggleSection = (sectionKey) => {
    setCollapsedSections((previousState) => ({
      ...previousState,
      [sectionKey]: !previousState[sectionKey],
    }));
  };

  const getFieldError = (fieldName) => resolveNestedValue(errors, fieldName);

  const uploadFile = async (event, fieldName, onChange) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      onChange(null);
      return;
    }
    setUploadingFields((previousState) => ({ ...previousState, [fieldName]: true }));
    clearErrors(fieldName);

    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size should be 5 MB or less.");
      }
      if (!SUPPORTED_FILE_TYPES.test(file.name)) {
        throw new Error("Only PDF, PNG, JPG and JPEG files are supported.");
      }
      const response = await Digit.UploadServices.Filestorage("WS", file, stateId);
      const fileStoreId = response?.data?.files?.[0]?.fileStoreId;

      if (!fileStoreId) {
        throw new Error("File upload failed. Please try again.");
      }

      onChange({
        fileName: file.name,
        fileSize: file.size,
        fileStoreId,
        fileType: file.type,
      });
      clearErrors(fieldName);
    } catch (error) {
      onChange(null);
      setError(fieldName, { type: "manual", message: error?.message || "File upload failed. Please try again." });
      setShowToast({ key: "error", message: error?.message || "File upload failed. Please try again." });
    } finally {
      setUploadingFields((previousState) => ({ ...previousState, [fieldName]: false }));
    }
  };

  const handleCapture = async (file) => {
    setShowCamera(false);
    setUploadingFields((prev) => ({ ...prev, "documents.applicantPhoto": true }));
    try {
      const response = await Digit.UploadServices.Filestorage("WS", file, stateId);
      const fileStoreId = response?.data?.files?.[0]?.fileStoreId;
      if (fileStoreId) {
        setValue("documents.applicantPhoto", {
          fileName: file.name,
          fileSize: file.size,
          fileStoreId,
          fileType: file.type,
        });
        clearErrors("documents.applicantPhoto");
      }
    } catch (error) {
      setShowToast({ key: "error", message: "Failed to upload photo" });
    } finally {
      setUploadingFields((prev) => ({ ...prev, "documents.applicantPhoto": false }));
    }
  };

  const clearUploadedFile = (fieldName, onChange) => {
    onChange(null);
    clearErrors(fieldName);
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onPreview = (data) => {
    if (hasPendingUpload) {
      setShowToast({ warning: true, message: "Please wait for all file uploads to complete." });
      return;
    }
    setPreviewMode(true);
    scrollToTop();
  };

  const onSubmit = async (data) => {
    if (hasPendingUpload) {
      setShowToast({ warning: true, message: "Please wait for all file uploads to complete." });
      return;
    }

    if (!propertyDetails?.Properties?.[0]) {
      setShowToast({ key: "error", message: "ERR_INVALID_PROPERTY_ID" });
      return;
    }

    try {
      // Inject property details into the form data for payload generation
      const formDataWithProperty = {
        ...data,
        cpt: {
          details: propertyDetails?.Properties?.[0],
        },
      };

      const payload = await createPayloadOfWS(formDataWithProperty);

      let waterAndSewerageLoader = false;
      if (payload?.water && payload?.sewerage) waterAndSewerageLoader = true;

      if (waterAndSewerageLoader) {
        setWaterAndSewerageBoth(true);
        sessionStorage.setItem("setWaterAndSewerageBoth", JSON.stringify(true));
      } else {
        sessionStorage.setItem("setWaterAndSewerageBoth", JSON.stringify(false));
      }

      let waterConnection = { WaterConnection: payload, disconnectRequest: false, reconnectRequest: false };
      let sewerageConnection = { SewerageConnection: payload, disconnectRequest: false, reconnectRequest: false };

      // Case 1: Both Water and Sewerage
      if (payload?.water && payload?.sewerage) {
        if (waterMutation && sewerageMutation) {
          setIsEnableLoader(true);
          await waterMutation(waterConnection, {
            onError: (error) => {
              setIsEnableLoader(false);
              setShowToast({
                key: "error",
                message: error?.response?.data?.Errors?.[0].message || error,
              });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (waterData) => {
              let response = await updatePayloadOfWS(waterData?.WaterConnection?.[0], "WATER");
              let waterConnectionUpdate = { WaterConnection: response, disconnectRequest: false, reconnectRequest: false };

              waterUpdateMutation(waterConnectionUpdate, {
                onError: (error) => {
                  setIsEnableLoader(false);
                  setShowToast({
                    key: "error",
                    message: error?.response?.data?.Errors?.[0].message || error,
                  });
                  setTimeout(closeToastOfError, 5000);
                },
                onSuccess: async (waterUpdateData) => {
                  setAppDetails((prev) => ({ ...prev, waterConnection: waterUpdateData?.WaterConnection?.[0] }));

                  await sewerageMutation(sewerageConnection, {
                    onError: (error) => {
                      setIsEnableLoader(false);
                      setShowToast({
                        key: "error",
                        message: error?.response?.data?.Errors?.[0].message || error,
                      });
                      setTimeout(closeToastOfError, 5000);
                    },
                    onSuccess: async (sewerageData) => {
                      let response = await updatePayloadOfWS(sewerageData?.SewerageConnections?.[0], "SEWERAGE");
                      let sewerageConnectionUpdate = { SewerageConnection: response, disconnectRequest: false, reconnectRequest: false };

                      await sewerageUpdateMutation(sewerageConnectionUpdate, {
                        onError: (error) => {
                          setIsEnableLoader(false);
                          setShowToast({
                            key: "error",
                            message: error?.response?.data?.Errors?.[0].message || error,
                          });
                          setTimeout(closeToastOfError, 5000);
                        },
                        onSuccess: async (sewerageUpdateData) => {
                          setAppDetails((prev) => ({ ...prev, sewerageConnection: sewerageUpdateData?.SewerageConnections?.[0] }));
                          window.sessionStorage.removeItem(FORM_STORAGE_KEY);
                          history.push(
                            `/digit-ui/employee/ws/ws-response?applicationNumber=${waterUpdateData?.WaterConnection?.[0]?.applicationNo}&applicationNumber1=${sewerageUpdateData?.SewerageConnections?.[0]?.applicationNo}`
                          );
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        }
      }
      // Case 2: Only Water
      else if (payload?.water && !payload?.sewerage) {
        if (waterMutation) {
          setIsEnableLoader(true);
          await waterMutation(waterConnection, {
            onError: (error) => {
              setIsEnableLoader(false);
              setShowToast({
                key: "error",
                message: error?.response?.data?.Errors?.[0].message || error,
              });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data) => {
              let response = await updatePayloadOfWS(data?.WaterConnection?.[0], "WATER");
              let waterConnectionUpdate = { WaterConnection: response };
              waterUpdateMutation(waterConnectionUpdate, {
                onError: (error) => {
                  setIsEnableLoader(false);
                  setShowToast({
                    key: "error",
                    message: error?.response?.data?.Errors?.[0].message || error,
                  });
                  setTimeout(closeToastOfError, 5000);
                },
                onSuccess: (data) => {
                  setAppDetails((prev) => ({ ...prev, waterConnection: data?.WaterConnection?.[0] }));
                  window.sessionStorage.removeItem(FORM_STORAGE_KEY);
                  history.push(`/digit-ui/employee/ws/ws-response?applicationNumber=${data?.WaterConnection?.[0]?.applicationNo}`);
                },
              });
            },
          });
        }
      }
      // Case 3: Only Sewerage
      else if (payload?.sewerage && !payload?.water) {
        if (sewerageMutation) {
          setIsEnableLoader(true);
          await sewerageMutation(sewerageConnection, {
            onError: (error) => {
              setIsEnableLoader(false);
              setShowToast({
                key: "error",
                message: error?.response?.data?.Errors?.[0].message || error,
              });
              setTimeout(closeToastOfError, 5000);
            },
            onSuccess: async (data) => {
              let response = await updatePayloadOfWS(data?.SewerageConnections?.[0], "SEWERAGE");
              let sewerageConnectionUpdate = { SewerageConnection: response };
              await sewerageUpdateMutation(sewerageConnectionUpdate, {
                onError: (error) => {
                  setIsEnableLoader(false);
                  setShowToast({
                    key: "error",
                    message: error?.response?.data?.Errors?.[0].message || error,
                  });
                  setTimeout(closeToastOfError, 5000);
                },
                onSuccess: (data) => {
                  setAppDetails((prev) => ({ ...prev, sewerageConnection: data?.SewerageConnections?.[0] }));
                  window.sessionStorage.removeItem(FORM_STORAGE_KEY);
                  history.push(`/digit-ui/employee/ws/ws-response?applicationNumber1=${data?.SewerageConnections?.[0]?.applicationNo}`);
                },
              });
            },
          });
        }
      }
    } catch (error) {
      setIsEnableLoader(false);
      setShowToast({ key: "error", message: "Failed to generate payload or submit application." });
    }
  };

  const onEdit = () => {
    setPreviewMode(false);
    scrollToTop();
  };

  const handleSectionEdit = (sectionKey) => {
    setPreviewMode(false);
    setTimeout(() => {
      const element = sectionRefs[sectionKey]?.current;
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const onReset = () => {
    reset(DEFAULT_FORM_VALUES);
    setPreviewMode(false);
    setCollapsedSections(DEFAULT_SECTION_STATE);
    setUploadingFields({});
    setShowToast(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(FORM_STORAGE_KEY);
    }
    scrollToTop();
  };

  if (isEnableLoader || isPropertyLoading) {
    return <Loader />;
  }

  return (
    <div>
      <style>
        {`
          .ws-new-application-collapsible .collapsible-card-tabs {
            display: none;
          }

          .ws-new-application-collapsible .collapsible-card-tab-content {
            padding: 0;
          }

          .avatar-upload-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            grid-column: 1 / -1;
          }

          .avatar-wrapper {
            position: relative;
            width: 120px;
            height: 120px;
          }

          .avatar-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #E5E7EB;
            overflow: hidden;
            background-color: #F3F4F6;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .avatar-circle:hover {
            border-color: #0B4B66;
            opacity: 0.9;
          }

          .avatar-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .avatar-edit-icon:hover {
            transform: scale(1.1);
            background-color: #F9FAFB;
          }

          .document-action-btn {
            background: #E5E7EB;
            border: 1px solid #9CA3AF;
            border-radius: 4px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            cursor: pointer;
            font-weight: 500;
            min-height: 40px;
          }
          .document-action-btn:hover {
            background: #D1D5DB;
          }
          .document-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}
      </style>
      {/* <Header>{t("New Water / Sewerage Application")}</Header> */}

      <div className="employee-form-section-wrapper">
        {!previewMode && <VerticalTimeline config={timelineConfig} currentActiveIndex={currentStep - 1} showFinalStep={false} />}

        <div style={{ flex: "1", overflowY: "auto", minWidth: 0 }}>
          {/* <Card style={{ marginBottom: "16px" }}>
          <CardSubHeader>{previewMode ? t("Preview Application") : t("Application Form")}</CardSubHeader>
        </Card> */}
          <div style={{ display: previewMode ? "none" : "block" }}>
            <SectionCard
              isOpen={collapsedSections.application}
              onToggle={toggleSection}
              sectionKey="application"
              title={t("WS_APPLICATION_SELECTION")}
              sectionRef={sectionRefs.application}
            >
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("WS_SERVICE_TYPE")}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name={"applicationSelection.serviceType"}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value}
                        disable={false}
                        option={dropdownData.serviceTypes}
                        errorStyle={!!getFieldError("applicationSelection.serviceType")}
                        select={props.onChange}
                        optionKey="name"
                        onBlur={props.onBlur}
                        t={t}
                      />
                    )}
                  />
                </div>
              </LabelFieldPair>
              {getFieldError("applicationSelection.serviceType") && (
                <CardLabelError>{getFieldError("applicationSelection.serviceType")?.message}</CardLabelError>
              )}

              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("WS_APPLICANT_TYPE")}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name={"applicationSelection.applicantType"}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value}
                        disable={false}
                        option={dropdownData.applicantTypes}
                        errorStyle={!!getFieldError("applicationSelection.applicantType")}
                        select={props.onChange}
                        optionKey="name"
                        onBlur={props.onBlur}
                        t={t}
                      />
                    )}
                  />
                </div>
              </LabelFieldPair>
              {getFieldError("applicationSelection.applicantType") && (
                <CardLabelError>{getFieldError("applicationSelection.applicantType")?.message}</CardLabelError>
              )}

              {isTenantOrRelative && (
                <React.Fragment>
                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{t("WS_OWNER_AUTHORIZATION")}</CardLabel>
                    <div className="field">
                      <Controller
                        control={control}
                        name="applicationSelection.ownerAuthorizationDoc"
                        rules={{ required: isTenantOrRelative ? "Owner Authorization is required" : false }}
                        render={(props) => (
                          <FileUploadField
                            error={getFieldError("applicationSelection.ownerAuthorizationDoc")}
                            id="owner-auth-doc"
                            isUploading={!!uploadingFields["applicationSelection.ownerAuthorizationDoc"]}
                            onDelete={() => clearUploadedFile("applicationSelection.ownerAuthorizationDoc", props.onChange)}
                            onUpload={(event) => uploadFile(event, "applicationSelection.ownerAuthorizationDoc", props.onChange)}
                            value={props.value}
                          />
                        )}
                      />
                    </div>
                  </LabelFieldPair>

                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{t("WS_OWNER_CONTACT_NUMBER")}</CardLabel>
                    <div className="field" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          name="applicationSelection.ownerContactNumber"
                          inputRef={register({
                            required: isTenantOrRelative ? "Owner Contact Number is required" : false,
                            pattern: { value: MOBILE_PATTERN, message: "Enter a valid 10-digit mobile number." },
                          })}
                          errorStyle={!!getFieldError("applicationSelection.ownerContactNumber")}
                          maxlength={10}
                          disable={isOwnerVerified}
                        />
                      </div>
                      {!isOwnerVerified && (
                        <button
                          type="button"
                          style={linkButtonStyle}
                          onClick={() => {
                            const mobile = watch("applicationSelection.ownerContactNumber");
                            if (MOBILE_PATTERN.test(mobile)) {
                              setIsOtpSent(true);
                              setOtpError(null);
                            } else {
                              setError("applicationSelection.ownerContactNumber", { type: "manual", message: "Enter a valid mobile number first." });
                            }
                          }}
                        >
                          {isOtpSent ? t("WS_RESEND_OTP") : t("WS_VERIFY")}
                        </button>
                      )}
                      {isOwnerVerified && <span style={{ color: "green", fontSize: "14px", fontWeight: "600" }}>{t("WS_VERIFIED")} ✓</span>}
                    </div>
                  </LabelFieldPair>
                  {getFieldError("applicationSelection.ownerContactNumber") && (
                    <CardLabelError>{getFieldError("applicationSelection.ownerContactNumber")?.message}</CardLabelError>
                  )}

                  {isOtpSent && !isOwnerVerified && (
                    <LabelFieldPair>
                      <CardLabel className="card-label-smaller">{t("WS_OTP_VERIFICATION")}</CardLabel>
                      <div className="field" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <TextInput
                            name="applicationSelection.ownerOtp"
                            inputRef={register({
                              required: isOtpSent ? "OTP is required" : false,
                            })}
                            errorStyle={!!getFieldError("applicationSelection.ownerOtp") || !!otpError}
                            maxlength={6}
                          />
                        </div>
                        <button
                          type="button"
                          style={linkButtonStyle}
                          onClick={() => {
                            const otp = watch("applicationSelection.ownerOtp");
                            if (otp && otp.length === 6) {
                              setValue("applicationSelection.isOwnerVerified", true);
                              setIsOtpSent(false);
                              setOtpError(null);
                              clearErrors("applicationSelection.ownerOtp");
                            } else {
                              setOtpError("Enter 6 digit OTP");
                            }
                          }}
                        >
                          {t("WS_CONFIRM")}
                        </button>
                      </div>
                    </LabelFieldPair>
                  )}
                  {(getFieldError("applicationSelection.ownerOtp") || otpError) && (
                    <CardLabelError>{getFieldError("applicationSelection.ownerOtp")?.message || otpError}</CardLabelError>
                  )}
                </React.Fragment>
              )}

              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("WS_CONNECTION_TYPE")}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name={"applicationSelection.connectionType"}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value}
                        disable={false}
                        option={ConnectionType}
                        errorStyle={!!getFieldError("applicationSelection.connectionType")}
                        select={props.onChange}
                        optionKey="name"
                        onBlur={props.onBlur}
                        t={t}
                      />
                    )}
                  />
                </div>
              </LabelFieldPair>
              {getFieldError("applicationSelection.connectionType") && (
                <CardLabelError>{getFieldError("applicationSelection.connectionType")?.message}</CardLabelError>
              )}

              {connectionTypeIsTemporary && (
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_TEMPORARY_CONNECTION")}</CardLabel>
                  <div className="field">
                    <Controller
                      control={control}
                      name={"applicationSelection.temporaryConnection"}
                      rules={{ required: connectionTypeIsTemporary ? t("REQUIRED_FIELD") : false }}
                      isMandatory={true}
                      render={(props) => (
                        <Dropdown
                          className="form-field"
                          selected={props.value}
                          disable={false}
                          option={dropdownData.temporaryConnectionTypes}
                          errorStyle={!!getFieldError("applicationSelection.temporaryConnection")}
                          select={props.onChange}
                          optionKey="name"
                          onBlur={props.onBlur}
                          t={t}
                        />
                      )}
                    />
                  </div>
                </LabelFieldPair>
              )}
              {connectionTypeIsTemporary && getFieldError("applicationSelection.temporaryConnection") && (
                <CardLabelError>{getFieldError("applicationSelection.temporaryConnection")?.message}</CardLabelError>
              )}

              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("WS_CATEGORY_TYPE")}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name={"applicationSelection.subCategory"}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value}
                        disable={false}
                        option={dropdownData.subCategories}
                        errorStyle={!!getFieldError("applicationSelection.subCategory")}
                        select={props.onChange}
                        optionKey="name"
                        onBlur={props.onBlur}
                        t={t}
                      />
                    )}
                  />
                </div>
              </LabelFieldPair>
              {getFieldError("applicationSelection.subCategory") && (
                <CardLabelError>{getFieldError("applicationSelection.subCategory")?.message}</CardLabelError>
              )}

              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("WS_WATER_DEMAND_TYPE")}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name={"applicationSelection.categoryType"}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value}
                        disable={false}
                        option={dropdownData.categoryTypes}
                        errorStyle={!!getFieldError("applicationSelection.categoryType")}
                        select={props.onChange}
                        optionKey="name"
                        onBlur={props.onBlur}
                        t={t}
                      />
                    )}
                  />
                </div>
              </LabelFieldPair>
              {getFieldError("applicationSelection.categoryType") && (
                <CardLabelError>{getFieldError("applicationSelection.categoryType")?.message}</CardLabelError>
              )}

              {subCategoryIsDomestic && (
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_DOMESTIC_TYPE")}</CardLabel>
                  <div className="field">
                    <Controller
                      control={control}
                      name="applicationSelection.domesticType"
                      rules={{ required: subCategoryIsDomestic ? t("REQUIRED_FIELD") : false }}
                      render={(props) => (
                        <RadioButtons
                          onSelect={props.onChange}
                          selectedOption={props.value}
                          optionsKey="name"
                          options={[
                            { code: "INDIVIDUAL", name: "Individual" },
                            { code: "ORGANIZATION", name: "Organization" },
                          ]}
                          t={t}
                        />
                      )}
                    />
                  </div>
                </LabelFieldPair>
              )}
              {subCategoryIsDomestic && getFieldError("applicationSelection.domesticType") && (
                <CardLabelError>{getFieldError("applicationSelection.domesticType")?.message}</CardLabelError>
              )}

              {subCategoryIsCommercial && (
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_COMMERCIAL_TYPE")}</CardLabel>
                  <div className="field">
                    <Controller
                      control={control}
                      name={"applicationSelection.commercialType"}
                      rules={{ required: t("REQUIRED_FIELD") }}
                      isMandatory={true}
                      render={(props) => (
                        <RadioButtons
                          onSelect={props.onChange}
                          selectedOption={props.value}
                          options={[
                            { code: "INDIVIDUAL", name: "Individual" },
                            { code: "ORGANIZATION", name: "Organization" },
                          ]}
                          optionsKey="name"
                          t={t}
                        />
                      )}
                    />
                  </div>
                </LabelFieldPair>
              )}

              {activeType?.code === "ORGANIZATION" && (
                <React.Fragment>
                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{`${t("WS_DEPARTMENT_TYPE")} *`}</CardLabel>
                    <div className="field">
                      <Controller
                        control={control}
                        name="applicationSelection.departmentType"
                        rules={{ required: activeType?.code === "ORGANIZATION" ? t("REQUIRED_FIELD") : false }}
                        render={(props) => (
                          <RadioButtons
                            onSelect={props.onChange}
                            selectedOption={props.value}
                            options={[
                              { code: "GOVERNMENT", name: "Government" },
                              { code: "NON_GOVERNMENT", name: "Non-Government" },
                            ]}
                            optionsKey="name"
                            t={t}
                          />
                        )}
                      />
                    </div>
                  </LabelFieldPair>
                  {getFieldError("applicationSelection.departmentType") && (
                    <CardLabelError>{getFieldError("applicationSelection.departmentType")?.message}</CardLabelError>
                  )}

                  <div style={{ gridColumn: "1 / -1", marginTop: "16px", marginBottom: "16px" }}>
                    <h2 style={{ color: "#0B4B66", fontSize: "18px", fontWeight: "700" }}>{t("WS_DEPARTMENT_ORGANIZATION_DETAILS")}</h2>
                  </div>

                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{t("WS_ORGANIZATION_DEPARTMENT_NAME")}</CardLabel>
                    <div className="field">
                      <TextInput
                        name="applicationSelection.govtOrganization.organizationName"
                        inputRef={register({ required: activeType?.code === "ORGANIZATION" ? "Organization/Department Name is required" : false })}
                        errorStyle={!!getFieldError("applicationSelection.govtOrganization.organizationName")}
                        placeholder={t("WS_ORGANIZATION_DEPARTMENT_NAME")}
                      />
                    </div>
                  </LabelFieldPair>
                  {getFieldError("applicationSelection.govtOrganization.organizationName") && (
                    <CardLabelError>{getFieldError("applicationSelection.govtOrganization.organizationName")?.message}</CardLabelError>
                  )}

                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{t("WS_NATURE_OF_WORK")}</CardLabel>
                    <div className="field">
                      <TextInput
                        name="applicationSelection.govtOrganization.natureOfWork"
                        inputRef={register({ required: activeType?.code === "ORGANIZATION" ? "Nature of Work is required" : false })}
                        errorStyle={!!getFieldError("applicationSelection.govtOrganization.natureOfWork")}
                        placeholder={t("WS_NATURE_OF_WORK")}
                      />
                    </div>
                  </LabelFieldPair>
                  {getFieldError("applicationSelection.govtOrganization.natureOfWork") && (
                    <CardLabelError>{getFieldError("applicationSelection.govtOrganization.natureOfWork")?.message}</CardLabelError>
                  )}

                  <LabelFieldPair>
                    <CardLabel className="card-label-smaller">{t("WS_ORG_DEPT_DOCUMENT")}</CardLabel>
                    <div className="field">
                      <Controller
                        control={control}
                        name="applicationSelection.govtOrganization.organizationDocument"
                        rules={{ required: activeType?.code === "ORGANIZATION" ? "Document is required" : false }}
                        render={(props) => (
                          <FileUploadField
                            error={getFieldError("applicationSelection.govtOrganization.organizationDocument")}
                            id="org-dept-doc"
                            isUploading={!!uploadingFields["applicationSelection.govtOrganization.organizationDocument"]}
                            onDelete={() => clearUploadedFile("applicationSelection.govtOrganization.organizationDocument", props.onChange)}
                            onUpload={(event) => uploadFile(event, "applicationSelection.govtOrganization.organizationDocument", props.onChange)}
                            value={props.value}
                          />
                        )}
                      />
                    </div>
                  </LabelFieldPair>
                </React.Fragment>
              )}
            </SectionCard>
          </div>

          {/* <SectionCard
            description={t("WS_GOVT_CONNECTION_DESC")}
            isOpen={collapsedSections.governmentEmployee}
            onToggle={toggleSection}
            sectionKey="governmentEmployee"
            title={t("WS_GOVERNMENT_CONNECTION")}
            sectionRef={sectionRefs.governmentEmployee}
          >
            <FieldBlock label={t("WS_GOVERNMENT_CONNECTION")}>
              <Controller
                control={control}
                name="governmentEmployee.isGovernmentEmployee"
                render={(props) => (
                  <CheckBox
                    checked={!!props.value}
                    label={t("WS_APPLICANT_IS_GOVT_CONNECTION")}
                    onChange={(event) => props.onChange(event.target.checked)}
                  />
                )}
              />
            </FieldBlock>

            {isGovernmentEmployee && (
              <React.Fragment>
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_ORGANIZATION_NAME")}</CardLabel>
                  <div className="field">
                    <TextInput
                      name="governmentEmployee.organizationName"
                      inputRef={register({ required: isGovernmentEmployee ? "Organization Name is required" : false })}
                      errorStyle={!!getFieldError("governmentEmployee.organizationName")}
                    />
                  </div>
                </LabelFieldPair>
                {getFieldError("governmentEmployee.organizationName") && (
                  <CardLabelError>{getFieldError("governmentEmployee.organizationName")?.message}</CardLabelError>
                )}

                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_NATURE_OF_WORK")}</CardLabel>
                  <div className="field">
                    <TextInput
                      name="governmentEmployee.natureOfWork"
                      inputRef={register({ required: isGovernmentEmployee ? "Nature of Work is required" : false })}
                      errorStyle={!!getFieldError("governmentEmployee.natureOfWork")}
                    />
                  </div>
                </LabelFieldPair>
                {getFieldError("governmentEmployee.natureOfWork") && (
                  <CardLabelError>{getFieldError("governmentEmployee.natureOfWork")?.message}</CardLabelError>
                )}

                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_UPLOAD_DOCUMENT")}</CardLabel>
                  <div className="field">
                    <Controller
                      control={control}
                      name="governmentEmployee.organizationDocument"
                      rules={{ required: isGovernmentEmployee ? "Document is required" : false }}
                      render={(props) => (
                        <FileUploadField
                          error={getFieldError("governmentEmployee.organizationDocument")}
                          id="govt-org-doc"
                          isUploading={!!uploadingFields["governmentEmployee.organizationDocument"]}
                          onDelete={() => clearUploadedFile("governmentEmployee.organizationDocument", props.onChange)}
                          onUpload={(event) => uploadFile(event, "governmentEmployee.organizationDocument", props.onChange)}
                          value={props.value}
                        />
                      )}
                    />
                  </div>
                </LabelFieldPair>
              </React.Fragment>
            )}
          </SectionCard> */}

          <div style={{ display: previewMode ? "none" : "block" }}>
            <React.Fragment>
              <SectionCard
                description={t("WS_APPLICANT_DETAILS_DESC")}
                isOpen={collapsedSections.applicant}
                onToggle={toggleSection}
                sectionKey="applicant"
                title={t(applicantSectionTitle)}
                sectionRef={sectionRefs.applicant}
              >
                {/* <Controller
                  control={control}
                  name="applicant.UploadPicture"
                  rules={{ validate: (value) => !!value || "Applicant Picture is required." }}
                  render={(props) => (
                    <ProfileImageUpload
                      error={getFieldError("applicant.UploadPicture")?.message}
                      isUploading={!!uploadingFields["applicant.UploadPicture"]}
                      label="WS_UPLOAD_PICTURE"
                      onUpload={(event) => uploadFile(event, "applicant.UploadPicture", props.onChange)}
                      required
                      t={t}
                      value={props.value}
                    />
                  )}
                /> */}

                <FieldBlock error={getFieldError("applicant.firstName")} label={t("WS_FIRST_NAME")} required>
                  <TextInput
                    errorStyle={!!getFieldError("applicant.firstName")}
                    inputRef={register({
                      pattern: { value: NAME_PATTERN, message: "Use letters only." },
                      required: "First Name is required.",
                    })}
                    name="applicant.firstName"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("applicant.middleName")} label={t("WS_MIDDLE_NAME")}>
                  <TextInput
                    errorStyle={!!getFieldError("applicant.middleName")}
                    inputRef={register({
                      pattern: { value: NAME_PATTERN, message: "Use letters only." },
                    })}
                    name="applicant.middleName"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("applicant.lastName")} label={t("WS_LAST_NAME")} required>
                  <TextInput
                    errorStyle={!!getFieldError("applicant.lastName")}
                    inputRef={register({
                      pattern: { value: NAME_PATTERN, message: "Use letters only." },
                      required: "Last Name is required.",
                    })}
                    name="applicant.lastName"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.gender")} label={t("WS_GENDER")} required>
                  <Controller
                    control={control}
                    name="useDetails.gender"
                    rules={{ required: "Gender is required." }}
                    render={(props) => (
                      <Dropdown
                        option={[
                          { name: "Male", code: "MALE", i18nKey: "MALE" },
                          { name: "Female", code: "FEMALE", i18nKey: "FEMALE" },
                        ]}
                        optionKey="i18nKey"
                        selected={props.value}
                        select={props.onChange}
                        t={t}
                      />
                    )}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("applicant.ParentorSpouse")} label={t("WS_PARENT_OR_SPOUSE")} required>
                  <TextInput
                    errorStyle={!!getFieldError("applicant.ParentorSpouse")}
                    inputRef={register({
                      pattern: { value: NAME_PATTERN, message: "Use letters only." },
                      required: "Parent/ spouse Name is required.",
                    })}
                    name="applicant.ParentorSpouse"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("contact.emailId")} label={t("WS_EMAIL_ID")} required>
                  <TextInput
                    errorStyle={!!getFieldError("contact.emailId")}
                    inputRef={register({
                      pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address." },
                      required: "Email ID is required.",
                    })}
                    name="contact.emailId"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("contact.mobileNumber")} label={t("WS_MOBILE_NUMBER")} required>
                  <TextInput
                    errorStyle={!!getFieldError("contact.mobileNumber")}
                    inputRef={register({
                      pattern: { value: MOBILE_PATTERN, message: "Enter a valid 10-digit mobile number." },
                      required: "Mobile Number is required.",
                    })}
                    maxlength={10}
                    name="contact.mobileNumber"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("contact.whatsAppNumber")} label={t("WS_WHATS_APP_NUMBER")}>
                  <TextInput
                    errorStyle={!!getFieldError("contact.whatsAppNumber")}
                    inputRef={register({
                      pattern: { value: MOBILE_PATTERN, message: "Enter a valid 10-digit WhatsApp number." },
                    })}
                    maxlength={10}
                    name="contact.whatsAppNumber"
                  />
                </FieldBlock>
              </SectionCard>

              <SectionCard
                description={t("WS_DJB_EMPLOYEE_DESC")}
                isOpen={collapsedSections.employee}
                onToggle={toggleSection}
                sectionKey="djbEmployee"
                title={t("WS_DJB_EMPLOYEE")}
                sectionRef={sectionRefs.djbEmployee}
              >
                <FieldBlock label={t("WS_DJB_EMPLOYEE")}>
                  <Controller
                    control={control}
                    name="djbEmployee.isDjbEmployee"
                    render={(props) => (
                      <CheckBox
                        checked={!!props.value}
                        label={t("WS_APPLICANT_IS_DJB_EMPLOYEE")}
                        onChange={(event) => props.onChange(event.target.checked)}
                      />
                    )}
                  />
                </FieldBlock>

                {isDjbEmployee && (
                  <React.Fragment>
                    <FieldBlock error={getFieldError("djbEmployee.employeeId")} label={t("WS_EMPLOYEE_ID")} required={isDjbEmployee}>
                      <TextInput
                        errorStyle={!!getFieldError("djbEmployee.employeeId")}
                        inputRef={register({
                          required: isDjbEmployee ? "Employee ID is required." : false,
                        })}
                        name="djbEmployee.employeeId"
                      />
                    </FieldBlock>

                    <FieldBlock error={getFieldError("djbEmployee.retirementDate")} label={t("WS_DATE_OF_RETIREMENT")} required={isDjbEmployee}>
                      <Controller
                        control={control}
                        name="djbEmployee.retirementDate"
                        rules={{ required: isDjbEmployee ? "Date of Retirement is required." : false }}
                        render={(props) => <DatePicker date={props.value} onChange={props.onChange} />}
                      />
                    </FieldBlock>

                    <FieldBlock
                      error={getFieldError("djbEmployee.officeNameAndAddress")}
                      isFullWidth
                      label={t("WS_OFFICE_NAME_AND_ADDRESS")}
                      required={isDjbEmployee}
                    >
                      <TextArea
                        className={getFieldError("djbEmployee.officeNameAndAddress") ? "employee-card-input-error" : ""}
                        inputRef={register({
                          required: isDjbEmployee ? "Office Name & Address is required." : false,
                        })}
                        name="djbEmployee.officeNameAndAddress"
                        style={{ minHeight: "96px" }}
                      />
                    </FieldBlock>
                  </React.Fragment>
                )}
              </SectionCard>

              <SectionCard
                description={t("WS_PROPERTY_ADDRESS_DESC")}
                isOpen={collapsedSections.address}
                onToggle={toggleSection}
                sectionKey="propertyAddress"
                title={t("WS_PROPERTY_ADDRESS")}
                sectionRef={sectionRefs.propertyAddress}
              >
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">{t("WS_ZRO_LOCATION")}</CardLabel>
                  <div className="field">
                    <Controller
                      control={control}
                      name={"zro"}
                      rules={{ required: t("REQUIRED_FIELD") }}
                      isMandatory={true}
                      render={(props) => (
                        <div>
                          <Dropdown
                            className="form-field"
                            selected={props.value}
                            disable={false}
                            option={mappedZROLocation}
                            errorStyle={!!getFieldError("zro")}
                            select={props.onChange}
                            optionKey="i18nKey"
                            onBlur={props.onBlur}
                            t={t}
                          />
                        </div>
                      )}
                    />
                  </div>
                </LabelFieldPair>
                {getFieldError("zro") && <CardLabelError>{getFieldError("zro")?.message}</CardLabelError>}
                <FieldBlock error={getFieldError("propertyAddress.pinCode")} label={t("WS_PIN_CODE")} required>
                  <Controller
                    control={control}
                    name="propertyAddress.pinCode"
                    rules={{ required: "Pin Code is required." }}
                    render={(props) => (
                      <Dropdown
                        option={fetchedPincodes}
                        optionKey="i18nKey"
                        selected={
                          fetchedPincodes?.find((p) => p.code === props.value) ||
                          (props.value ? { code: props.value, name: props.value, i18nKey: props.value } : null)
                        }
                        select={(val) => {
                          const newPin = val?.code;
                          if (newPin !== props.value) {
                            setValue("propertyAddress.locality", null);
                            setValue("propertyAddress.zone", "");
                            setValue("propertyAddress.block", "");
                            setValue("propertyAddress.address", "");
                          }
                          props.onChange(newPin);
                        }}
                        t={t}
                      />
                    )}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.locality")} label={t("WS_LOCALITY")} required>
                  <Controller
                    control={control}
                    name="propertyAddress.locality"
                    rules={{ required: "Locality is required." }}
                    render={(props) => (
                      <Dropdown
                        option={filteredLocalities}
                        optionKey="i18nKey"
                        selected={props.value}
                        select={(val) => {
                          props.onChange(val);
                          if (val?.zone) setValue("propertyAddress.zone", val.zone);
                          if (val?.ward) setValue("propertyAddress.block", val.ward);
                          if (val?.localname) setValue("propertyAddress.address", val.localname);
                          if (val?.pincode) {
                            const p = Array.isArray(val.pincode) ? val.pincode[0] : val.pincode;
                            if (p) {
                              setValue("propertyAddress.pinCode", p.toString().split(".")[0]);
                            }
                          }
                        }}
                        t={t}
                      />
                    )}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.state")} label={t("WS_STATE")}>
                  <Controller
                    control={control}
                    name="propertyAddress.city"
                    render={(props) => (
                      <Dropdown
                        className="form-field"
                        selected={props.value || city}
                        select={(val) => {
                          setCity(val);
                          props.onChange(val);
                        }}
                        option={allCities}
                        optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                        optionKey="i18nKey"
                        t={t}
                        style={{ width: "100%" }}
                        placeholder={t("WS_SELECT")}
                      />
                    )}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.street")} label={t("WS_STREET")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.street")} inputRef={register()} name="propertyAddress.street" />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.houseNo")} label={t("WS_HOUSE_NO")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.houseNo")} inputRef={register()} name="propertyAddress.houseNo" />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.Assembly")} label={t("WS_ASSEMBLY")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.Assembly")} inputRef={register()} name="propertyAddress.Assembly" />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.block")} label={t("WS_BLOCK")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.block")} inputRef={register()} name="propertyAddress.block" />
                </FieldBlock>

                <FieldBlock error={getFieldError("propertyAddress.zone")} label={t("WS_ZONE")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.zone")} inputRef={register()} name="propertyAddress.zone" />
                </FieldBlock>
                <FieldBlock error={getFieldError("propertyAddress.landmark")} label={t("WS_LANDMARK")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.landmark")} inputRef={register()} name="propertyAddress.landmark" />
                </FieldBlock>
                <FieldBlock error={getFieldError("propertyAddress.Latitude")} label={t("WS_LATITUDE")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.Latitude")} inputRef={register()} name="propertyAddress.Latitude" />
                </FieldBlock>
                <FieldBlock error={getFieldError("propertyAddress.Longitude")} label={t("WS_LONGITUDE")}>
                  <TextInput errorStyle={!!getFieldError("propertyAddress.Longitude")} inputRef={register()} name="propertyAddress.Longitude" />
                </FieldBlock>
                <FieldBlock error={getFieldError("propertyAddress.address")} isFullWidth label={t("WS_ADDRESS")}>
                  <TextArea
                    className={getFieldError("propertyAddress.address") ? "employee-card-input-error" : ""}
                    inputRef={register({
                      required: "Address is required.",
                    })}
                    name="propertyAddress.address"
                    style={{ minHeight: "96px" }}
                  />
                </FieldBlock>
              </SectionCard>

              <SectionCard
                description={t("WS_USE_DETAILS_DESC")}
                isOpen={collapsedSections.usage}
                onToggle={toggleSection}
                sectionKey="useDetails"
                title={t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}
                sectionRef={sectionRefs.useDetails}
              >
                <FieldBlock error={getFieldError("useDetails.propertyCategory")} label={t("WS_PROPERTY_CATEGORY")} required>
                  <Controller
                    control={control}
                    name="useDetails.propertyCategory"
                    rules={{ required: "Property Category is required." }}
                    render={(props) => (
                      <Dropdown option={PROPERTY_CATEGORY_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("useDetails.propertyType")} label={t("WS_PROPERTY_TYPE")} required>
                  <Controller
                    control={control}
                    name="useDetails.propertyType"
                    rules={{ required: "Property Type is required." }}
                    render={(props) => (
                      <Dropdown option={PROPERTY_TYPE_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("useDetails.WaterConnectionUsageType")} label={t("WS_WATER_CONNECTION_USAGE_TYPE")} required>
                  <Controller
                    control={control}
                    name="useDetails.WaterConnectionUsageType"
                    rules={{ required: "Usage Type is required." }}
                    render={(props) => (
                      <Dropdown option={USAGE_TYPE_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.noOfFloors")} label={t("WS_NUMBER_OF_FLOORS")} required>
                  <Controller
                    control={control}
                    name="useDetails.noOfFloors"
                    rules={{ required: "No. of Floors is required." }}
                    render={(props) => (
                      <Dropdown option={NO_OF_FLOORS_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                  {/* <TextInput
                    errorStyle={!!getFieldError("useDetails.noOfFloors")}
                    inputRef={register({
                      pattern: { value: NUMBER_PATTERN, message: "Enter a valid whole number." },
                      required: "No. of Floors is required.",
                    })}
                    name="useDetails.noOfFloors"
                  /> */}
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.plotArea")} label={t("WS_PLOT_AREA")} required>
                  <TextInput
                    errorStyle={!!getFieldError("useDetails.plotArea")}
                    inputRef={register({
                      pattern: { value: DECIMAL_PATTERN, message: "Enter a valid numeric value." },
                      required: "Plot Area is required.",
                    })}
                    name="useDetails.plotArea"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.builtUpArea")} label={t("WS_BUILT_UP_AREA")} required>
                  <TextInput
                    errorStyle={!!getFieldError("useDetails.builtUpArea")}
                    inputRef={register({
                      pattern: { value: DECIMAL_PATTERN, message: "Enter a valid numeric value." },
                      required: "Built Up Area is required.",
                    })}
                    name="useDetails.builtUpArea"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.SelectYearofConstruction")} label={t("WS_SELECT_YEAR_OF_CONSTRUCTION")} required>
                  <Controller
                    control={control}
                    name="useDetails.SelectYearofConstruction"
                    rules={{ required: "Select Year of Construction is required." }}
                    render={(props) => <Dropdown option={yearOptions} optionKey="value" selected={props.value} select={props.onChange} t={t} />}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("useDetails.NumberofDwellingUnits")} label={t("WS_NUMBER_OF_DWELLING_UNITS")} required>
                  <TextInput
                    errorStyle={!!getFieldError("useDetails.NumberofDwellingUnits")}
                    inputRef={register({
                      pattern: { value: DECIMAL_PATTERN, message: "Enter a valid numeric value." },
                      required: "Built Up Area is required.",
                    })}
                    name="useDetails.NumberofDwellingUnits"
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("useDetails.NumberofRooms")} label={t("WS_NUMBER_OF_ROOMS")} required>
                  <TextInput
                    errorStyle={!!getFieldError("useDetails.NumberofRooms")}
                    inputRef={register({
                      pattern: { value: DECIMAL_PATTERN, message: "Enter a valid numeric value." },
                      required: "Built Up Area is required.",
                    })}
                    name="useDetails.NumberofRooms"
                  />
                </FieldBlock>

                {isHospitalProperty ? (
                  <FieldBlock error={getFieldError("useDetails.hospitalBeds")} label={t("WS_NUMBER_OF_BEDS")} required>
                    <TextInput
                      errorStyle={!!getFieldError("useDetails.hospitalBeds")}
                      inputRef={register({
                        pattern: { value: NUMBER_PATTERN, message: "Enter a valid whole number." },
                        required: isHospitalProperty ? "No. of Beds is required for Hospital / Nursing Home." : false,
                      })}
                      name="useDetails.hospitalBeds"
                    />
                  </FieldBlock>
                ) : null}
              </SectionCard>

              <SectionCard
                description="Refund or payment-linked bank account details."
                isOpen={collapsedSections.bank}
                onToggle={toggleSection}
                sectionKey="bankDetails"
                title="Bank Details"
                sectionRef={sectionRefs.bankDetails}
              >
                <FieldBlock error={getFieldError("bankDetails.bankName")} label="Name of the Bank" required>
                  <TextInput
                    errorStyle={!!getFieldError("bankDetails.bankName")}
                    inputRef={register({
                      required: "Bank Name is required.",
                    })}
                    name="bankDetails.bankName"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("bankDetails.branchName")} label="Name of the Branch" required>
                  <TextInput
                    errorStyle={!!getFieldError("bankDetails.branchName")}
                    inputRef={register({
                      required: "Branch Name is required.",
                    })}
                    name="bankDetails.branchName"
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("bankDetails.ifscCode")} label="IFSC Code" required>
                  <TextInput
                    errorStyle={!!getFieldError("bankDetails.ifscCode")}
                    inputRef={register({
                      pattern: { value: IFSC_PATTERN, message: "Enter a valid IFSC code." },
                      required: "IFSC Code is required.",
                    })}
                    name="bankDetails.ifscCode"
                    onChange={(event) => {
                      event.target.value = event.target.value.toUpperCase();
                    }}
                  />
                </FieldBlock>

                <FieldBlock error={getFieldError("bankDetails.bankAccountNumber")} label="Bank Account No." required>
                  <TextInput
                    errorStyle={!!getFieldError("bankDetails.bankAccountNumber")}
                    inputRef={register({
                      pattern: { value: ACCOUNT_PATTERN, message: "Enter a valid bank account number." },
                      required: "Bank Account Number is required.",
                    })}
                    name="bankDetails.bankAccountNumber"
                  />
                </FieldBlock>
              </SectionCard>

              <SectionCard
                description="Documents to be attached. Maximum allowed file size is 5 MB."
                isOpen={collapsedSections.documents}
                onToggle={toggleSection}
                sectionKey="documents"
                title="Documents to be Attached"
                sectionRef={sectionRefs.documents}
              >
                {/* Applicant Photo Row */}
                <Controller
                  control={control}
                  name="documents.applicantPhoto"
                  render={(props) => (
                    <FileUploadField
                      error={getFieldError("documents.applicantPhoto")}
                      id="applicant-photo"
                      isUploading={!!uploadingFields["documents.applicantPhoto"]}
                      label="Upload Applicant Photo"
                      onDelete={() => clearUploadedFile("documents.applicantPhoto", props.onChange)}
                      onUpload={(event) => uploadFile(event, "documents.applicantPhoto", props.onChange)}
                      value={props.value}
                    />
                  )}
                />
                <FieldBlock label="Click Applicant Photo">
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="document-action-btn" onClick={() => setShowCamera(true)}>
                      <CameraIcon /> Click Photo
                    </button>
                    {watch("documents.applicantPhoto")?.fileStoreId && (
                      <React.Fragment>
                        <button
                          type="button"
                          className="document-action-btn"
                          style={{ width: "50px" }}
                          onClick={() => handleView(watch("documents.applicantPhoto")?.fileStoreId, stateId)}
                          title="View Photo"
                        >
                          <ViewIcon />
                        </button>
                      </React.Fragment>
                    )}
                  </div>
                  {watch("documents.applicantPhoto")?.fileStoreId && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#F3F4F6",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        width: "fit-content",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <CardText style={{ margin: 0, fontSize: "14px", color: "#374151", fontWeight: "500" }}>
                        {watch("documents.applicantPhoto").fileName}
                      </CardText>
                      <div
                        onClick={() => clearUploadedFile("documents.applicantPhoto", (val) => setValue("documents.applicantPhoto", val))}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#6B7280" }}
                        title="Remove Photo"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                    </div>
                  )}
                </FieldBlock>

                {/* Proof of Identity Row */}
                <FieldBlock error={getFieldError("documents.proofOfIdentity")} label="Proof of Identity *" required>
                  <Controller
                    control={control}
                    name="documents.proofOfIdentity"
                    rules={{ required: "Proof of Identity is required." }}
                    render={(props) => (
                      <Dropdown option={PROOF_OF_IDENTITY_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("documents.identityProofNumber")} label="Proof of Identity Document">
                  <TextInput name="documents.identityProofNumber" inputRef={register()} placeholder="Identity No." />
                </FieldBlock>

                {/* Identity Upload Row */}
                <Controller
                  control={control}
                  name="documents.identityProofFile"
                  rules={{ validate: (value) => !!value || "Upload Identity Proof is required." }}
                  render={(props) => (
                    <FileUploadField
                      error={getFieldError("documents.identityProofFile")}
                      id="identity-proof-file"
                      isUploading={!!uploadingFields["documents.identityProofFile"]}
                      label="Proof of Identity Upload Document *"
                      onDelete={() => clearUploadedFile("documents.identityProofFile", props.onChange)}
                      onUpload={(event) => uploadFile(event, "documents.identityProofFile", props.onChange)}
                      required
                      value={props.value}
                    />
                  )}
                />
                <FieldBlock label="View Document">
                  <button
                    type="button"
                    className="document-action-btn"
                    onClick={() => handleView(watch("documents.identityProofFile")?.fileStoreId, stateId)}
                    disabled={!watch("documents.identityProofFile")?.fileStoreId}
                  >
                    <ViewIcon /> View
                  </button>
                </FieldBlock>

                {/* Proof of Ownership Row */}
                <FieldBlock error={getFieldError("documents.ownershipStatus")} label="Proof of Ownership *" required>
                  <Controller
                    control={control}
                    name="documents.ownershipStatus"
                    rules={{ required: "Ownership Proof is required." }}
                    render={(props) => (
                      <Dropdown option={OWNERSHIP_DOCUMENTS_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("documents.ownershipDocumentNumber")} label="Proof of Ownership Document">
                  <TextInput name="documents.ownershipDocumentNumber" inputRef={register()} placeholder="Ownership No." />
                </FieldBlock>

                {/* Ownership Upload Row */}
                <Controller
                  control={control}
                  name="documents.ownershipDocumentFile"
                  rules={{ validate: (value) => !!value || "Upload Ownership Document is required." }}
                  render={(props) => (
                    <FileUploadField
                      error={getFieldError("documents.ownershipDocumentFile")}
                      id="ownership-document-file"
                      isUploading={!!uploadingFields["documents.ownershipDocumentFile"]}
                      label="Proof of Ownership Upload Document *"
                      onDelete={() => clearUploadedFile("documents.ownershipDocumentFile", props.onChange)}
                      onUpload={(event) => uploadFile(event, "documents.ownershipDocumentFile", props.onChange)}
                      required
                      value={props.value}
                    />
                  )}
                />
                <FieldBlock label="View Document">
                  <button
                    type="button"
                    className="document-action-btn"
                    onClick={() => handleView(watch("documents.ownershipDocumentFile")?.fileStoreId, stateId)}
                    disabled={!watch("documents.ownershipDocumentFile")?.fileStoreId}
                  >
                    <ViewIcon /> View
                  </button>
                </FieldBlock>

                {/* Other Row */}
                <FieldBlock error={getFieldError("documents.otherDocument")} label="Other">
                  <Controller
                    control={control}
                    name="documents.otherDocument"
                    render={(props) => (
                      <Dropdown option={OTHER_DOCUMENTS_OPTIONS} optionKey="name" selected={props.value} select={props.onChange} t={t} />
                    )}
                  />
                </FieldBlock>
                <FieldBlock error={getFieldError("documents.otherDocumentNumber")} label="Other Document">
                  <TextInput name="documents.otherDocumentNumber" inputRef={register()} placeholder="Other Document No." />
                </FieldBlock>

                {/* Other Upload Row */}
                <Controller
                  control={control}
                  name="documents.otherDocumentFile"
                  rules={{ validate: (value) => !!value || "Other Upload Document is required." }}
                  render={(props) => (
                    <FileUploadField
                      error={getFieldError("documents.otherDocumentFile")}
                      id="other-document-file"
                      isUploading={!!uploadingFields["documents.otherDocumentFile"]}
                      label="Other Upload Document *"
                      onDelete={() => clearUploadedFile("documents.otherDocumentFile", props.onChange)}
                      onUpload={(event) => uploadFile(event, "documents.otherDocumentFile", props.onChange)}
                      required
                      value={props.value}
                    />
                  )}
                />
                <FieldBlock label="View Document">
                  <button
                    type="button"
                    className="document-action-btn"
                    onClick={() => handleView(watch("documents.otherDocumentFile")?.fileStoreId, stateId)}
                    disabled={!watch("documents.otherDocumentFile")?.fileStoreId}
                  >
                    <ViewIcon /> View
                  </button>
                </FieldBlock>
              </SectionCard>
              <SectionCard
                description="Declaration and undertaking to be signed by the applicant."
                isOpen={collapsedSections.declaration}
                onToggle={toggleSection}
                sectionKey="declaration"
                title="Declaration/Undertaking"
                sectionRef={sectionRefs.declaration}
              >
                {DECLARATION_POINTS.map((point, index) => (
                  <p key={index}>
                    <span>{String(index + 1)}.</span>
                    <span>{point}</span>
                  </p>
                ))}

                <FieldBlock error={getFieldError("propertyAddress.otherDocument")}></FieldBlock>

                <FieldBlock error={getFieldError("declaration.submittedBy")} label="Submitted By" required>
                  <Controller
                    control={control}
                    name="declaration.submittedBy"
                    rules={{ required: "Submission type is required." }}
                    render={(props) => (
                      <Dropdown
                        option={[
                          { code: "SELF", name: "SELF" },
                          { code: "RELATIVE", name: "Relative" },
                        ]}
                        optionKey="name"
                        selected={props.value}
                        select={props.onChange}
                        t={t}
                      />
                    )}
                  />
                </FieldBlock>

                <Controller
                  control={control}
                  name="declaration.signatureFile"
                  render={(props) => (
                    <FileUploadField
                      error={getFieldError("declaration.signatureFile")}
                      id="signature-file"
                      isUploading={!!uploadingFields["declaration.signatureFile"]}
                      label="Upload Signature"
                      onDelete={() => clearUploadedFile("declaration.signatureFile", props.onChange)}
                      onUpload={(event) => uploadFile(event, "declaration.signatureFile", props.onChange)}
                      value={props.value}
                    />
                  )}
                />
              </SectionCard>
            </React.Fragment>
          </div>

          {previewMode && (
            <React.Fragment>
              <SectionCard
                description="Selected request and connection type."
                isOpen={collapsedSections.application}
                onToggle={toggleSection}
                sectionKey="application"
                title="Application Selection"
                onEditClick={() => handleSectionEdit("application")}
              >
                <PreviewItem label="ZRO Location" value={formValues?.zro} />
                <PreviewItem label="Service Type" value={formValues?.applicationSelection?.serviceType} />
                <PreviewItem label="Applicant Type" value={formValues?.applicationSelection?.applicantType} />
                <PreviewItem label="Connection Type" value={formValues?.applicationSelection?.connectionType} />
                {formValues?.applicationSelection?.connectionType?.code === "TEMPORARY" && (
                  <PreviewItem label="Temporary Connection" value={formValues?.applicationSelection?.temporaryConnection} />
                )}
                {isTenantOrRelative && (
                  <React.Fragment>
                    <PreviewItem label="Owner Authorization" value={formValues?.applicationSelection?.ownerAuthorizationDoc} />
                    <PreviewItem label="Owner Contact Number" value={formValues?.applicationSelection?.ownerContactNumber} />
                  </React.Fragment>
                )}
                <PreviewItem label="Category Type" value={formValues?.applicationSelection?.categoryType} />
                <PreviewItem label="Sub Category" value={formValues?.applicationSelection?.subCategory} />
                {formValues?.applicationSelection?.subCategory?.code === "DOMESTIC" && (
                  <PreviewItem label="Domestic Type" value={formValues?.applicationSelection?.domesticType} />
                )}
                {formValues?.applicationSelection?.subCategory?.code === "COMMERCIAL" && (
                  <React.Fragment>
                    <PreviewItem label="Commercial Type" value={formValues?.applicationSelection?.commercialType} />
                    {formValues?.applicationSelection?.commercialType?.code === "ORGANIZATION" && (
                      <React.Fragment>
                        <PreviewItem label="Department Type" value={formValues?.applicationSelection?.departmentType} />
                        <PreviewItem label="Organization Name" value={formValues?.applicationSelection?.govtOrganization?.organizationName} />
                        <PreviewItem label="Nature of Work" value={formValues?.applicationSelection?.govtOrganization?.natureOfWork} />
                        <PreviewItem label="Organization Document" value={formValues?.applicationSelection?.govtOrganization?.organizationDocument} />
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}
              </SectionCard>

              <SectionCard
                description="Applicant identity and organization information."
                isOpen={collapsedSections.applicant}
                onToggle={toggleSection}
                sectionKey="applicant"
                title={applicantSectionTitle}
                onEditClick={() => handleSectionEdit("applicant")}
              >
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <div className="avatar-wrapper" style={{ cursor: "default" }}>
                    <div className="avatar-circle" style={{ cursor: "default" }}>
                      {formValues?.applicant?.UploadPicture?.fileStoreId ? (
                        <ProfileImagePreview fileStoreId={formValues?.applicant?.UploadPicture?.fileStoreId} />
                      ) : (
                        <div className="avatar-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <PreviewItem label="First Name" value={formValues?.applicant?.firstName} />
                <PreviewItem label="Middle Name" value={formValues?.applicant?.middleName} />
                <PreviewItem label="Last Name" value={formValues?.applicant?.lastName} />
                <PreviewItem label="Gender" value={formValues?.useDetails?.gender} />
                <PreviewItem label="Parent/ spouse" value={formValues?.applicant?.ParentorSpouse} />
                <PreviewItem label="Email ID" value={formValues?.contact?.emailId} />
                <PreviewItem label="Mobile Number" value={formValues?.contact?.mobileNumber} />
                <PreviewItem label="WhatsApp Number" value={formValues?.contact?.whatsAppNumber} />
                <PreviewItem isFullWidth label="Uploaded ID Proof" value={formValues?.documents?.identityProofFile} />
              </SectionCard>

              <SectionCard
                description="DJB employee-specific information."
                isOpen={collapsedSections.djbEmployee}
                onToggle={toggleSection}
                sectionKey="djbEmployee"
                title="For DJB Employee"
                onEditClick={() => handleSectionEdit("djbEmployee")}
              >
                <PreviewItem label="DJB Employee" value={formValues?.djbEmployee?.isDjbEmployee} />
                {formValues?.djbEmployee?.isDjbEmployee ? (
                  <React.Fragment>
                    <PreviewItem label="Employee ID" value={formValues?.djbEmployee?.employeeId} />
                    <PreviewItem label="Date of Retirement" value={formValues?.djbEmployee?.retirementDate} />
                    <PreviewItem isFullWidth label="Office Name & Address" value={formValues?.djbEmployee?.officeNameAndAddress} />
                  </React.Fragment>
                ) : null}
              </SectionCard>

              {formValues?.governmentEmployee?.isGovernmentEmployee && (
                <SectionCard
                  description="Government employee organization details."
                  isOpen={collapsedSections.governmentEmployee}
                  onToggle={toggleSection}
                  sectionKey="governmentEmployee"
                  title="For Government Employee"
                  onEditClick={() => handleSectionEdit("governmentEmployee")}
                >
                  <PreviewItem label="Organization Name" value={formValues?.governmentEmployee?.organizationName} />
                  <PreviewItem label="Nature of Work" value={formValues?.governmentEmployee?.natureOfWork} />
                  <PreviewItem label="Organization Document" value={formValues?.governmentEmployee?.organizationDocument} />
                </SectionCard>
              )}

              <SectionCard
                description="Property address and administrative boundary values."
                isOpen={collapsedSections.address}
                onToggle={toggleSection}
                sectionKey="address"
                title="Property Address"
                onEditClick={() => handleSectionEdit("propertyAddress")}
              >
                <PreviewItem label="Pin Code" value={formValues?.propertyAddress?.pinCode} />
                <PreviewItem label="State" value={formValues?.propertyAddress?.state} />
                <PreviewItem label="District" value={formValues?.propertyAddress?.district} />
                <PreviewItem label="City" value={formValues?.propertyAddress?.city} />
                <PreviewItem label="Locality" value={formValues?.propertyAddress?.locality} />
                <PreviewItem label="Street" value={formValues?.propertyAddress?.street} />
                <PreviewItem label="House No" value={formValues?.propertyAddress?.houseNo} />
                <PreviewItem label="Block" value={formValues?.propertyAddress?.block} />
                <PreviewItem label="Zone" value={formValues?.propertyAddress?.zone} />
                <PreviewItem label="Landmark" value={formValues?.propertyAddress?.landmark} />
                <PreviewItem isFullWidth label="Address" value={formValues?.propertyAddress?.address} />
              </SectionCard>

              <SectionCard
                description="Property and connection usage values."
                isOpen={collapsedSections.usage}
                onToggle={toggleSection}
                sectionKey="usage"
                title="Property and Water Connection Use Details"
                onEditClick={() => handleSectionEdit("useDetails")}
              >
                <PreviewItem label="Property Type" value={formValues?.useDetails?.propertyType} />
                <PreviewItem label="Plot Area (Sq. m.)" value={formValues?.useDetails?.plotArea} />
                <PreviewItem label="Built-up Area (Sq. m.)" value={formValues?.useDetails?.builtUpArea} />
                <PreviewItem label="Number of Floors" value={formValues?.useDetails?.noOfFloors} />
                <PreviewItem label="Number of Dwelling Units" value={formValues?.useDetails?.NumberofDwellingUnits} />
                {formValues?.useDetails?.propertyType?.code === "HOSPITAL" ||
                  formValues?.useDetails?.propertyType?.code === "HOSPITAL_NURSING_HOME" ? (
                  <PreviewItem label="No. of Beds" value={formValues?.useDetails?.hospitalBeds} />
                ) : null}
                <PreviewItem label="Year of Construction" value={formValues?.useDetails?.SelectYearofConstruction} />
                <PreviewItem label="Water Connection Usage Type" value={formValues?.useDetails?.WaterConnectionUsageType} />
              </SectionCard>

              <SectionCard
                description="Banking information as entered in the form."
                isOpen={collapsedSections.bank}
                onToggle={toggleSection}
                sectionKey="bank"
                title="Bank Details"
                onEditClick={() => handleSectionEdit("bankDetails")}
              >
                <PreviewItem label="Name of the Bank" value={formValues?.bankDetails?.bankName} />
                <PreviewItem label="Name of the Branch" value={formValues?.bankDetails?.branchName} />
                <PreviewItem label="IFSC Code" value={formValues?.bankDetails?.ifscCode} />
                <PreviewItem label="Bank Account No." value={formValues?.bankDetails?.bankAccountNumber} />
              </SectionCard>

              <SectionCard
                description="Uploaded supporting documents."
                isOpen={collapsedSections.documents}
                onToggle={toggleSection}
                sectionKey="documents"
                title="Documents to be Attached"
                onEditClick={() => handleSectionEdit("documents")}
              >
                <PreviewItem label="Applicant Photo" value={formValues?.documents?.applicantPhoto} />
                <PreviewItem label="Proof of Identity" value={formValues?.documents?.proofOfIdentity} />
                <PreviewItem label="Identity No." value={formValues?.documents?.identityProofNumber} />
                <PreviewItem label="Upload Identity Proof" value={formValues?.documents?.identityProofFile} />
                <PreviewItem label="Ownership Status" value={formValues?.documents?.ownershipStatus} />
                <PreviewItem label="Ownership No." value={formValues?.documents?.ownershipDocumentNumber} />
                <PreviewItem label="Upload Ownership Document" value={formValues?.documents?.ownershipDocumentFile} />
                <PreviewItem label="Other" value={formValues?.documents?.otherDocument} />
                <PreviewItem label="Other Document No." value={formValues?.documents?.otherDocumentNumber} />
                <PreviewItem label="Other Upload Document" value={formValues?.documents?.otherDocumentFile} />
              </SectionCard>

              <SectionCard
                description="Applicant declaration details."
                isOpen={collapsedSections.declaration}
                onToggle={toggleSection}
                sectionKey="declaration"
                title="Declaration/Undertaking"
                onEditClick={() => handleSectionEdit("declaration")}
              >
                <PreviewItem label="Submitted By" value={formValues?.declaration?.submittedBy} />
                <PreviewItem isFullWidth label="Signature" value={formValues?.declaration?.signatureFile} />
                <PreviewItem label="Agreed" value={formValues?.declaration?.agree ? "Yes" : "No"} />
              </SectionCard>
            </React.Fragment>
          )}
        </div>
      </div>

      <ActionBar style={actionBarStyle}>
        {!previewMode ? (
          <React.Fragment>
            <SubmitBar label="Reset" onSubmit={onReset} style={secondaryButtonStyle} />
            <SubmitBar disabled={hasPendingUpload || !formValues?.declaration?.agree} label={hasPendingUpload ? "Uploading..." : "Preview"} onSubmit={handleSubmit(onPreview)} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SubmitBar label="Edit Details" onSubmit={onEdit} style={secondaryButtonStyle} />
            <SubmitBar disabled={hasPendingUpload || !formValues?.declaration?.agree} label={hasPendingUpload ? "Uploading..." : "Submit"} onSubmit={handleSubmit(onSubmit)} />
          </React.Fragment>
        )}
      </ActionBar>

      {showToast ? <Toast error={showToast?.key === "error"} label={showToast?.message} onClose={closeToast} warning={showToast?.warning} /> : null}
      {showCamera && <CameraCaptureModal onCapture={handleCapture} onClose={() => setShowCamera(false)} t={t} />}
    </div>
  );
};

export default NewApplication;
