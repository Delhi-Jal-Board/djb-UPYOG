export const setAddressDetailsLW = (data) => {
  let { locationDet, propertyAddress } = data;
  let address =
    (Array.isArray(locationDet) ? locationDet[0] : locationDet) || (Array.isArray(propertyAddress) ? propertyAddress[0] : propertyAddress);

  console.log(address, "address_debug");

  if (!address) return data;

  const latVal =
    address?.latitude !== undefined && address?.latitude !== null && address?.latitude !== ""
      ? address.latitude
      : address?.Latitude !== undefined && address?.Latitude !== null && address?.Latitude !== ""
      ? address.Latitude
      : address?.geoLocation?.latitude !== undefined && address?.geoLocation?.latitude !== null && address?.geoLocation?.latitude !== ""
      ? address.geoLocation.latitude
      : address?.locality?.latitude !== undefined && address?.locality?.latitude !== null && address?.locality?.latitude !== ""
      ? address.locality.latitude
      : undefined;

  const lngVal =
    address?.longitude !== undefined && address?.longitude !== null && address?.longitude !== ""
      ? address.longitude
      : address?.Longitude !== undefined && address?.Longitude !== null && address?.Longitude !== ""
      ? address.Longitude
      : address?.geoLocation?.longitude !== undefined && address?.geoLocation?.longitude !== null && address?.geoLocation?.longitude !== ""
      ? address.geoLocation.longitude
      : address?.locality?.longitude !== undefined && address?.locality?.longitude !== null && address?.locality?.longitude !== ""
      ? address.locality.longitude
      : undefined;

  const lat = latVal !== undefined ? (typeof latVal === "number" ? latVal : parseFloat(latVal) || latVal) : undefined;
  const lng = lngVal !== undefined ? (typeof lngVal === "number" ? lngVal : parseFloat(lngVal) || lngVal) : undefined;

  const resolveCodeOrName = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "object") {
      return (val.code || val.name || val.i18nKey || "").trim();
    }
    return String(val);
  };

  const actualWard =
    resolveCodeOrName(address?.actualWard) ||
    resolveCodeOrName(address?.block) ||
    resolveCodeOrName(address?.ward) ||
    resolveCodeOrName(address?.locality?.ward) ||
    "";

  const actualAssembly =
    resolveCodeOrName(address?.actualAssembly) ||
    resolveCodeOrName(address?.assembly) ||
    resolveCodeOrName(address?.Assembly) ||
    resolveCodeOrName(address?.locality?.assembly) ||
    "";

  const actualZone =
    resolveCodeOrName(address?.actualZone) ||
    resolveCodeOrName(address?.zone) ||
    resolveCodeOrName(address?.locality?.zone) ||
    "";

  const assembly =
    resolveCodeOrName(address?.assembly) ||
    resolveCodeOrName(address?.Assembly) ||
    resolveCodeOrName(address?.locality?.assembly) ||
    actualAssembly ||
    "";

  const block =
    resolveCodeOrName(address?.block) ||
    resolveCodeOrName(address?.ward) ||
    resolveCodeOrName(address?.locality?.ward) ||
    actualWard ||
    "";

  const zone =
    resolveCodeOrName(address?.zone) ||
    resolveCodeOrName(address?.locality?.zone) ||
    actualZone ||
    "";

  let propAddress = {
    city: address?.city?.code || address?.city?.name || address?.city,
    houseNo: address?.houseNo || address?.houseDoorNo || address?.doorNo,
    street: address?.street || address?.buildingColonyName || address?.streetName,
    landmark: address?.landmark || address?.landmarkName,
    pincode: address?.pincode || address?.pinCode,
    latitude: lat,
    longitude: lng,
    geoLocation: (lat !== undefined || lng !== undefined) ? {
      latitude: lat,
      longitude: lng,
    } : (address?.geoLocation || {}),
    locality: {
      code: address?.locality?.code || address?.locality?.name || address?.locality,
      name: address?.locality?.name,
      latitude: address?.locality?.latitude ? address?.locality?.latitude : lat,
      longitude: address?.locality?.longitude ? address?.locality?.longitude : lng,
    },
    addressLine1: address?.addressLine1,
    addressLine2: address?.addressLine2,
    assembly: assembly,
    block: block,
    zone: zone,
    zroLocation: resolveCodeOrName(address?.zro) || resolveCodeOrName(address?.zroLocation) || zone,
    addressType: resolveCodeOrName(address?.addressType),
    subLocality: resolveCodeOrName(address?.subLocality),
    actualWard: actualWard,
    actualAssembly: actualAssembly,
    actualZone: actualZone,
    colonyMcdCategory: address?.colonyMcdCategory,
    noOfFloors: address?.noOfFloors?.code || address?.noOfFloors?.name || (typeof address?.noOfFloors === "string" ? address?.noOfFloors : undefined),
  };

  data.address = propAddress;
  return data;
};

export const setOwnerDetails = (data) => {
  const { address, owners } = data;
  let institution = {},
    owner = [];
  if (owners && owners.length > 0) {
    if (data?.ownershipCategory?.value === "INSTITUTIONALPRIVATE" || data?.ownershipCategory?.value === "INSTITUTIONALGOVERNMENT") {
      institution.designation = owners[0]?.designation;
      institution.name = owners[0]?.inistitutionName;
      institution.nameOfAuthorizedPerson = owners[0]?.name;
      institution.tenantId = address?.city?.code;
      institution.type = owners[0]?.inistitutetype?.value;
      let document = [];
      if (owners[0]?.documents["proofIdentity"]?.fileStoreId) {
        document.push({
          fileStoreId: owners[0]?.documents["proofIdentity"]?.fileStoreId || "",
          documentType: owners[0]?.documents["proofIdentity"]?.documentType?.code || "",
        });
      }
      owner.push({
        altContactNumber: owners[0]?.altContactNumber,
        correspondenceAddress: owners[0]?.permanentAddress,
        designation: owners[0]?.designation,
        emailId: owners[0]?.emailId,
        sameAsPropertyAddress: owners[0]?.isCorrespondenceAddress,
        mobileNumber: owners[0]?.mobileNumber,
        name: owners[0]?.name,
        ownerType: owners[0]?.ownerType?.code || "NONE",
        documents: document,
      });
      data.institution = institution;
      data.owners = owner;
    } else {
      owners.map((ownr) => {
        let document = [];
        if (ownr?.ownerType?.code != "NONE") {
          if (ownr?.documents && ownr?.documents["specialProofIdentity"]) {
            document.push({
              fileStoreId: ownr?.documents["specialProofIdentity"]?.fileStoreId || "",
              documentType: ownr?.documents["specialProofIdentity"]?.documentType?.code || "",
            });
          }
        }
        if (ownr?.documents && ownr?.documents["proofIdentity"]?.fileStoreId) {
          document.push({
            fileStoreId: ownr?.documents["proofIdentity"]?.fileStoreId || "",
            documentType: ownr?.documents["proofIdentity"]?.documentType?.code || "",
          });
        }
        owner.push({
          emailId: ownr?.emailId,
          fatherOrHusbandName: ownr?.fatherOrHusbandName,
          gender: ownr?.gender?.value,
          sameAsPropertyAddress: ownr?.isCorrespondenceAddress,
          mobileNumber: ownr?.mobileNumber,
          name: ownr?.name,
          ownerType: ownr?.ownerType?.code || "NONE",
          permanentAddress: ownr?.permanentAddress,
          relationship: ownr?.relationship?.code,
          documents: document,
        });
      });
      data.owners = owner;
    }
  }
  return data;
};

export const setOwnerDetailsLW = (data) => {
  const { locationDet, owners } = data;

  let institution = {},
    owner = [],
    document = [];

  data.ownershipCategory = data?.owners?.[0]?.ownershipCategory || "INDIVIDUAL.SINGLEOWNER";
  const ownershipCategoryCode = typeof data.ownershipCategory === "string" ? data.ownershipCategory : data.ownershipCategory?.code;

  if (ownershipCategoryCode?.includes("INSTITUTIONALPRIVATE") || ownershipCategoryCode?.includes("INSTITUTIONALGOVERNMENT")) {
    institution.designation = owners?.[0]?.designation;
    institution.name = owners?.[0]?.institutionName;
    institution.type = owners?.[0]?.institutionType?.code?.split(".")?.[1];
    institution.landlineNumber = owners?.[0]?.altContactNumber;
    institution.tenantId = locationDet?.city?.code || locationDet?.city;

    owner.push({
      altContactNumber: owners?.[0]?.altContactNumber,
      permanentAddress: owners?.[0]?.permanentAddress,
      correspondenceAddress: owners?.[0]?.permanentAddress,
      sameAsPropertyAddress: owners?.[0]?.isCorrespondenceAddress || owners?.[0]?.isCoresAddr,
      mobileNumber: owners?.[0]?.mobileNumber,
      name: owners?.[0]?.name,
      ownerType: "NONE",
      status: "ACTIVE",
      documents: document,
    });
    data.institution = institution;
    data.owners = owner;
  } else if (owners && owners.length > 0) {
    owners.map((own) => {
      owner.push({
        emailId: own?.emailId,
        fatherOrHusbandName: own?.fatherOrHusbandName,
        gender: own?.gender?.code || own?.gender?.value || own?.gender,
        sameAsPropertyAddress: own?.isCorrespondenceAddress || own?.isCoresAddr,
        mobileNumber: own?.mobileNumber,
        name: own?.name,
        ownerType: own?.ownerType?.code || own?.ownerType || "NONE",
        permanentAddress: own?.permanentAddress,
        relationship: own?.relationship?.code || own?.relationship,
        documents: own?.documents || document,
      });
    });
    data.owners = owner;
  } else if (data?.applicant && data?.contact) {
    const { applicant, contact, useDetails } = data;
    owner.push({
      name: `${applicant.firstName}${applicant.middleName ? ` ${applicant.middleName}` : ""}${applicant.lastName ? ` ${applicant.lastName}` : ""}`,
      mobileNumber: contact.mobileNumber,
      gender: useDetails?.gender?.code || useDetails?.gender || "MALE",
      fatherOrHusbandName: applicant.ParentorSpouse || "NA",
      relationship: "FATHER",
      ownerType: "NONE",
      status: "ACTIVE",
    });
    data.owners = owner;
  }
  return data;
};

const getUsageTypeLW = (data) => {
  if (data?.isResdential?.code == "RESIDENTIAL") {
    return data?.isResdential?.code;
  } else {
    return data?.usageCategory?.code;
  }
};

export const setPropertyDetailsLW = (data) => {
  let propertyDetails = {};

  const { waterConnection, useDetails: topUseDetails, locationDet, propertyAddress } = data;
  const useDetails = waterConnection?.useDetails || topUseDetails;
  const address =
    (Array.isArray(locationDet) ? locationDet[0] : locationDet) || (Array.isArray(propertyAddress) ? propertyAddress[0] : propertyAddress);

  const rawFloors = address?.noOfFloors || useDetails?.noOfFloors;
  const floorsCode = typeof rawFloors === "object" ? rawFloors?.code : rawFloors;
  let parsedFloors = 1;
  if (floorsCode === "BASEMENT") {
    parsedFloors = 0;
  } else if (floorsCode) {
    const p = parseInt(String(floorsCode).split("_")[0]);
    parsedFloors = isNaN(p) ? 1 : p;
  }

  propertyDetails = {
    propertyType: useDetails?.propertyType?.code || useDetails?.propertyType,
    usageCategory: useDetails?.propertyCategory?.code || useDetails?.propertyCategory,
    landArea: parseFloat(useDetails?.plotArea),
    superBuiltUpArea: parseFloat(useDetails?.builtUpArea),
    noOfFloors: parsedFloors,
    farArea: useDetails?.farArea,
    numberOfRooms: useDetails?.NumberofRooms,
    numberOfBeds: useDetails?.numberOfBeds,
    numberOfStudents: useDetails?.numberOfStudents,
    servantQuarterArea: useDetails?.servantQuarterArea,
    heightOfTheBuilding: useDetails?.heightOfTheBuilding,
  };

  data.propertyDetails = propertyDetails;
  return data;
};

export const convertToPropertyLightWeight = (data = {}) => {
  data = setOwnerDetailsLW(data);
  data = setAddressDetailsLW(data);
  data = setPropertyDetailsLW(data);

  let propertyType = data.propertyDetails?.propertyType;
  let noOfFloors = data.propertyDetails?.noOfFloors || 1;
  let ownershipCategory = data?.owners?.[0]?.ownershipCategory;

  const formdata = {
    Property: {
      tenantId: data.tenantId,
      address: data.address,
      propertyType: propertyType,
      ...data.propertyDetails,
      ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
      usageCategory: data.propertyDetails?.usageCategory,
      owners: [
        ...(data.owners || []).map((owner, index) => ({
          ...owner,
          additionalDetails: { ownerSequence: index, ownerName: owner?.name },
          documents: owner.documents
            ? Array.isArray(owner.documents)
              ? owner.documents
              : Object.keys(owner.documents).map((key) => {
                const doc = owner.documents[key];
                return { documentType: doc?.documentType?.code || doc?.documentType || "", fileStoreId: doc?.fileStoreId || "" };
              })
            : [],
          gender: typeof owner.gender === "string" ? owner.gender : owner.gender?.code || owner.gender?.value,
          ownerType: owner.ownerType?.code || owner.ownerType || "NONE",
          relationship: owner.relationship?.code || owner.relationship,
          inistitutetype: owner?.inistitutetype?.value,
          landlineNumber: owner?.altContactNumber,
          status: "ACTIVE",
        })),
      ],
      noOfFloors: noOfFloors,
      additionalDetails: {
        isRainwaterHarvesting: false,
        propertyType: propertyType,
        propertyCategory: data.propertyDetails?.usageCategory,
        categoryType: data.waterConnection?.useDetails?.categoryType?.code || data.useDetails?.categoryType?.code,
        waterConnectionUsageType: data.waterConnection?.useDetails?.WaterConnectionUsageType?.code || data.useDetails?.WaterConnectionUsageType?.code,
        yearOfConstruction: data.waterConnection?.useDetails?.SelectYearofConstruction?.value || data.useDetails?.SelectYearofConstruction?.value,
        numberOfDwellingUnits: data.waterConnection?.useDetails?.NumberofDwellingUnits || data.useDetails?.NumberofDwellingUnits,
        numberOfRooms: data.waterConnection?.useDetails?.NumberofRooms || data.useDetails?.NumberofRooms,
        numberOfFloors:
          (typeof (data.address?.noOfFloors || data.locationDet?.noOfFloors || data.propertyAddress?.noOfFloors || data.waterConnection?.useDetails?.noOfFloors || data.useDetails?.noOfFloors) === "object"
            ? (data.address?.noOfFloors?.code || data.locationDet?.noOfFloors?.code || data.propertyAddress?.noOfFloors?.code || data.waterConnection?.useDetails?.noOfFloors?.code || data.useDetails?.noOfFloors?.code)
            : (data.address?.noOfFloors || data.locationDet?.noOfFloors || data.propertyAddress?.noOfFloors || data.waterConnection?.useDetails?.noOfFloors || data.useDetails?.noOfFloors)) || 1,
        noOfFloors: noOfFloors,
        plotArea: data.waterConnection?.useDetails?.plotArea || data.useDetails?.plotArea,
        builtUpArea: data.waterConnection?.useDetails?.builtUpArea || data.useDetails?.builtUpArea,
        farArea: data.waterConnection?.useDetails?.farArea || data.useDetails?.farArea,
        servantQuarterArea: data.waterConnection?.useDetails?.servantQuarterArea || data.useDetails?.servantQuarterArea,
        numberOfStudents: data.waterConnection?.useDetails?.numberOfStudents || data.useDetails?.numberOfStudents,
        numberOfBeds: data.waterConnection?.useDetails?.numberOfBeds || data.useDetails?.numberOfBeds,
        heightOfTheBuilding: data.waterConnection?.useDetails?.heightOfTheBuilding || data.useDetails?.heightOfTheBuilding,
        latitude: data.address?.latitude,
        longitude: data.address?.longitude,
        geoLocation: data.address?.geoLocation,
        actualWard: data.address?.actualWard,
        actualAssembly: data.address?.actualAssembly,
        actualZone: data.address?.actualZone,
        assembly: data.address?.assembly,
        block: data.address?.block,
        zone: data.address?.zone,
        questions:
          data.waterConnection?.useDetails?.questions ||
          data.useDetails?.questions ||
          data.waterConnection?.questions ||
          data.waterConnection?.useDetails?.questionAnswers ||
          data.useDetails?.questionAnswers ||
          [],
        owners: [
          ...(data.owners || []).map((owner, index) => ({
            ...owner,
            additionalDetails: { ownerSequence: index, ownerName: owner?.name },
            documents: owner.documents
              ? Array.isArray(owner.documents)
                ? owner.documents
                : Object.keys(owner.documents).map((key) => {
                  const doc = owner.documents[key];
                  return { documentType: doc?.documentType?.code || doc?.documentType || "", fileStoreId: doc?.fileStoreId || "" };
                })
              : [],
            gender: typeof owner.gender === "string" ? owner.gender : owner.gender?.code || owner.gender?.value,
            ownerType: owner.ownerType?.code || owner.ownerType || "NONE",
            relationship: owner.relationship?.code || owner.relationship,
            inistitutetype: owner?.inistitutetype?.value,
            landlineNumber: owner?.altContactNumber,
            status: "ACTIVE",
          })),
        ],
      },
      creationReason: "CREATE",
      source: "MUNICIPAL_RECORDS",
      channel: "SYSTEM",
    },
  };

  const ownershipCategoryCode = typeof ownershipCategory === "string" ? ownershipCategory : ownershipCategory?.code;
  if (ownershipCategoryCode?.includes("INSTITUTIONALPRIVATE") || ownershipCategoryCode?.includes("INSTITUTIONALGOVERNMENT")) {
    formdata.Property.institution = data?.institution;
  }
  return formdata;
};

export const convertToUpdatePropertyLightWeight = (data = {}) => {
  data = setOwnerDetailsLW(data);
  data = setAddressDetailsLW(data);
  data = setPropertyDetailsLW(data);

  let propertyType = data.propertyDetails?.propertyType;
  let noOfFloors = data.propertyDetails?.noOfFloors || 1;

  const formdata = {
    Property: {
      id: data.id,
      accountId: data.accountId,
      acknowldgementNumber: data.acknowldgementNumber,
      propertyId: data.propertyId,
      status: data.status || "INWORKFLOW",
      tenantId: data.tenantId,
      address: data.address,
      propertyType: propertyType,
      ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
      owners: [
        ...data.owners.map((owner, index) => ({
          ...owner,
          additionalDetails: { ownerSequence: index, ownerName: owner?.name },
          documents: Object.keys(owner.documents).map((key) => {
            const { documentType, fileStoreId } = owner.documents[key];
            return { documentType: documentType.code, fileStoreId };
          }),
          gender: owner.gender?.code,
          ownerType: owner.ownerType?.code || "NONE",
          relationship: owner.relationship?.code,
          inistitutetype: owner?.inistitutetype?.value,
          landlineNumber: owner?.altContactNumber,
          status: "ACTIVE",
        })),
      ],
      noOfFloors: noOfFloors,
      additionalDetails: {
        isRainwaterHarvesting: false,
        categoryType: data.waterConnection?.useDetails?.categoryType?.code || data.useDetails?.categoryType?.code,
        waterConnectionUsageType: data.waterConnection?.useDetails?.WaterConnectionUsageType?.code || data.useDetails?.WaterConnectionUsageType?.code,
        yearOfConstruction: data.waterConnection?.useDetails?.SelectYearofConstruction?.value || data.useDetails?.SelectYearofConstruction?.value,
        numberOfDwellingUnits: data.waterConnection?.useDetails?.NumberofDwellingUnits || data.useDetails?.NumberofDwellingUnits,
        numberOfFloors:
          (typeof (data.address?.noOfFloors || data.locationDet?.noOfFloors || data.propertyAddress?.noOfFloors || data.waterConnection?.useDetails?.noOfFloors || data.useDetails?.noOfFloors) === "object"
            ? (data.address?.noOfFloors?.code || data.locationDet?.noOfFloors?.code || data.propertyAddress?.noOfFloors?.code || data.waterConnection?.useDetails?.noOfFloors?.code || data.useDetails?.noOfFloors?.code)
            : (data.address?.noOfFloors || data.locationDet?.noOfFloors || data.propertyAddress?.noOfFloors || data.waterConnection?.useDetails?.noOfFloors || data.useDetails?.noOfFloors)) || 1,
        noOfFloors: noOfFloors,
        plotArea: data.waterConnection?.useDetails?.plotArea || data.useDetails?.plotArea,
        builtUpArea: data.waterConnection?.useDetails?.builtUpArea || data.useDetails?.builtUpArea,
        farArea: data.waterConnection?.useDetails?.farArea || data.useDetails?.farArea,
        numberOfServantQuarters: data.waterConnection?.useDetails?.servantQuarterArea || data.useDetails?.servantQuarterArea,
        numberOfStudents: data.waterConnection?.useDetails?.numberOfStudents || data.useDetails?.numberOfStudents,
        numberOfBeds: data.waterConnection?.useDetails?.numberOfBeds || data.useDetails?.numberOfBeds,
        heightOfTheBuilding: data.waterConnection?.useDetails?.heightOfTheBuilding || data.useDetails?.heightOfTheBuilding,
        latitude: data.address?.latitude,
        longitude: data.address?.longitude,
        geoLocation: data.address?.geoLocation,
        actualWard: data.address?.actualWard,
        actualAssembly: data.address?.actualAssembly,
        actualZone: data.address?.actualZone,
        assembly: data.address?.assembly,
        block: data.address?.block,
        zone: data.address?.zone,
        questions:
          data.waterConnection?.useDetails?.questions ||
          data.useDetails?.questions ||
          data.waterConnection?.questions ||
          data.waterConnection?.useDetails?.questionAnswers ||
          data.useDetails?.questionAnswers ||
          [],
        owners: [
          ...data.owners.map((owner, index) => ({
            ...owner,
            additionalDetails: { ownerSequence: index, ownerName: owner?.name },
            documents: Object.keys(owner.documents).map((key) => {
              const { documentType, fileStoreId } = owner.documents[key];
              return { documentType: documentType.code, fileStoreId };
            }),
            gender: owner.gender?.code,
            ownerType: owner.ownerType?.code || "NONE",
            relationship: owner.relationship?.code,
            inistitutetype: owner?.inistitutetype?.value,
            landlineNumber: owner?.altContactNumber,
            status: "ACTIVE",
          })),
        ],
      },
      ...data.propertyDetails,
      creationReason: getCreationReason(data),
      source: "MUNICIPAL_RECORDS",
      channel: "CITIZEN",
      workflow: getWorkflow(data),
    },
  };

  let propertyInitialObject = JSON.parse(sessionStorage.getItem("propertyInitialObject"));
  if (checkArrayLength(propertyInitialObject?.units) && checkIsAnArray(formdata.Property?.units) && data?.isEditProperty) {
    propertyInitialObject.units = propertyInitialObject.units.filter((unit) => unit.active);
    let oldUnits = propertyInitialObject.units.map((unit) => {
      return { ...unit, active: false };
    });
    formdata.Property?.units.push(...oldUnits);
  }

  if (checkArrayLength(propertyInitialObject?.owners) && checkIsAnArray(formdata.Property?.owners)) {
    formdata.Property.owners = [...propertyInitialObject.owners];
  }
  if (propertyInitialObject?.auditDetails) {
    formdata.Property["auditDetails"] = { ...propertyInitialObject.auditDetails };
  }

  return formdata;
};

export const stringReplaceAll = (str = "", searcher = "", replaceWith = "") => {
  if (searcher == "") return str;
  while (str.includes(searcher)) {
    str = str.replace(searcher, replaceWith);
  }
  return str;
};
