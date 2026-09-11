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

const createHeaderMapping = (t) => ({
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
});

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

export const getEkycExcelData = (consumerList = [], t = (k) => k) => {
    const headerMapping = createHeaderMapping(t);

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

    return excelData;
};

export const downloadEkycExcel = (consumerList = [], { fileName = "eKYC_Data", vendorName = "" } = {}, t = (k) => k) => {
    const excelData = getEkycExcelData(consumerList, t);
    const cleanFileName = vendorName ? `${fileName}_${vendorName.replace(/[^a-zA-Z0-9]/g, "_")}` : fileName;
    Digit.Download.Excel(excelData, cleanFileName);
};
