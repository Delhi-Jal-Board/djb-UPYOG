export const stringReplaceAll = (str = "", searcher = "", replaceWith = "") => {
  if (searcher === "") return str;
  while (str.includes(searcher)) {
    str = str.replace(searcher, replaceWith);
  }
  return str;
};
export const checkForNotNull = (value = "") => {
  return value && value != null && value !== undefined && value !== "" ? true : false;
};

export const checkForNA = (value = "") => {
  return checkForNotNull(value) ? value : "NA";
};

export const convertTo12HourFormat = (time) => {
  if (!time) return "NA"; // Handle empty or invalid values

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "NA"; // Handle empty or invalid values

  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

// for replacing digit-ui
export const APPLICATION_PATH = "/digit-ui";

//Custom function which will return the formdata and inside formdata we are building the Payload.
export const waterTankerPayload = (data) => {
  const formdata = {
    waterTankerBookingDetail: {
      tenantId: data?.tenantId,
      tankerType: (data?.requestDetails?.tankerType?.code || data?.requestDetails?.tankerType || "")?.toUpperCase(),
      waterType: data?.requestDetails?.waterType?.code,
      tankerQuantity: data?.requestDetails?.tankerQuantity?.code,
      waterQuantity: data?.requestDetails?.waterQuantity?.code,
      description: data?.requestDetails?.description,
      deliveryDate: data?.requestDetails?.deliveryDate,
      deliveryTime: data?.requestDetails?.deliveryTime,
      extraCharge: data?.requestDetails?.extraCharge ? "Y" : "N",
      addressDetailId: data?.address?.addressDetailId || "",
      applicantDetail: {
        name: data?.owner?.applicantName,
        mobileNumber: data?.owner?.mobileNumber,
        alternateNumber: data?.owner?.alternateNumber,
        emailId: data?.owner?.emailId,
      },
      address: {
        addressType: data?.address?.addressType?.code,
        pincode: data?.address?.pincode,
        city: data?.address?.city?.city?.name || "DJB",
        cityCode: data?.address?.city?.city?.code || "DJB",
        addressLine1: data?.address?.addressLine1,
        addressLine2: data?.address?.addressLine2,
        locality: data?.address?.locality?.i18nKey,
        localityCode: data?.address?.locality?.code,
        streetName: data?.address?.streetName,
        houseNo: data?.address?.houseNo,
        landmark: data?.address?.landmark,
        latitude: data?.address?.latitude,
        longitude: data?.address?.longitude,
      },

      WTfileStoreId: data?.requestDetails?.fileStoreId,
      bookingStatus: "BOOKING_CREATED",
      workflow: {
        action: "APPLY",
        comments: "",
        businessService: "watertanker",
        moduleName: "request-service.water_tanker",
      },
    },
  };
  return formdata;
};
export const mobileToiletPayload = (data) => {
  const formdata = {
    mobileToiletBookingDetail: {
      tenantId: data?.tenantId,
      description: data?.toiletRequestDetails?.specialRequest,
      noOfMobileToilet: data?.toiletRequestDetails?.mobileToilet?.code,
      deliveryFromDate: data?.toiletRequestDetails?.deliveryfromDate,
      deliveryToDate: data?.toiletRequestDetails?.deliverytoDate,
      deliveryFromTime: data?.toiletRequestDetails?.deliveryfromTime,
      deliveryToTime: data?.toiletRequestDetails?.deliverytoTime,
      addressDetailId: data?.address?.addressDetailId || "",
      applicantDetail: {
        name: data?.owner?.applicantName,
        mobileNumber: data?.owner?.mobileNumber,
        alternateNumber: data?.owner?.alternateNumber,
        emailId: data?.owner?.emailId,
      },
      address: {
        addressType: data?.address?.addressType?.code,
        pincode: data?.address?.pincode,
        city: data?.address?.city?.city?.name || "DJB",
        cityCode: data?.address?.city?.city?.code || "DJB",
        addressLine1: data?.address?.addressLine1,
        addressLine2: data?.address?.addressLine2,
        locality: data?.address?.locality?.i18nKey,
        localityCode: data?.address?.locality?.code,
        streetName: data?.address?.streetName,
        houseNo: data?.address?.houseNo,
        landmark: data?.address?.landmark,
      },

      bookingStatus: "BOOKING_CREATED",
      workflow: {
        action: "APPLY",
        comments: "",
        businessService: "mobileToilet",
        moduleName: "request-service.mobile_toilet",
      },
    },
  };
  return formdata;
};

export const treePruningPayload = (data) => {
  const formdata = {
    treePruningBookingDetail: {
      tenantId: data?.tenantId,
      latitude: data?.treePruningRequestDetails?.latitude,
      longitude: data?.treePruningRequestDetails?.longitude,
      reasonForPruning: data?.treePruningRequestDetails?.reasonOfPruning?.code,
      applicantDetail: {
        name: data?.owner?.applicantName,
        mobileNumber: data?.owner?.mobileNumber,
        alternateNumber: data?.owner?.alternateNumber,
        emailId: data?.owner?.emailId,
      },
      documentDetails: [
        {
          documentType: "Site Photograph",
          fileStoreId: data?.treePruningRequestDetails?.supportingDocumentFile,
        },
      ],
      address: {
        addressType: data?.address?.addressType?.code,
        pincode: data?.address?.pincode,
        city: data?.address?.city?.city?.name || "DJB",
        cityCode: data?.address?.city?.city?.code || "DJB",
        addressLine1: data?.address?.addressLine1,
        addressLine2: data?.address?.addressLine2,
        locality: data?.address?.locality?.i18nKey,
        localityCode: data?.address?.locality?.code,
        streetName: data?.address?.streetName,
        houseNo: data?.address?.houseNo,
        landmark: data?.address?.landmark,
      },

      bookingStatus: "BOOKING_CREATED",
      workflow: {
        action: "APPLY",
        comments: "",
        businessService: "treePruning",
        moduleName: "request-service.tree_pruning",
      },
    },
  };
  return formdata;
};

export const fillingPointPayload = (data) => {
  return {
    RequestInfo: {
      userInfo: {
        uuid: Digit.UserService.getUser()?.info?.uuid || "user-123",
      },
    },
    fillingPoints: [
      {
        id: data?.id,
        bookingId: data?.bookingId,
        tenantId: data?.tenantId,
        fillingPointName: data?.owner?.fillingPointName,
        emergencyName: data?.owner?.emergencyName,
        eeName: data?.owner?.eeName,
        eeEmail: data?.owner?.eeEmail,
        eeMobile: data?.owner?.eeMobile,
        aeName: data?.owner?.aeName,
        aeEmail: data?.owner?.aeEmail,
        aeMobile: data?.owner?.aeMobile,
        jeName: data?.owner?.jeName,
        jeEmail: data?.owner?.jeEmail,
        jeMobile: data?.owner?.jeMobile,
        status: data?.status,
        address: {
          houseNo: data?.address?.houseNo,
          streetName: data?.address?.streetName,
          addressLine1: data?.address?.addressLine1,
          addressLine2: data?.address?.addressLine2,
          landmark: data?.address?.landmark,
          city: data?.address?.city?.name || data?.address?.city || "DJB",
          cityCode: data?.address?.cityCode || data?.address?.city?.code || "DJB",
          locality: data?.address?.locality?.label || data?.address?.locality?.name || data?.address?.locality || "",
          localityCode: data?.address?.locality?.code || data?.address?.localityCode || "",
          pincode: data?.address?.pincode,
          latitude: data?.address?.latitude,
          longitude: data?.address?.longitude,
          ward: data?.address?.ward || data?.address?.block || "",
          zone: data?.address?.zone || "",
          constituency: data?.address?.assembly || data?.address?.constituency || "",
          type: "FILLING-POINT",
        },
      },
    ],
  };
};

export const fixedPointPayload = (data) => {
  return {
    waterTankerBookingDetail: {
      bookingId: data?.bookingId || "",
      bookingNo: data?.bookingNo || null,
      tenantId: data?.tenantId,
      mobileNumber: data?.owner?.mobileNumber || "",
      applicantDetail: {
        applicantId: data?.owner?.applicantId || null,
        bookingId: data?.bookingId || "",
        name: data?.owner?.name || data?.owner?.applicantName || "",
        mobileNumber: data?.owner?.mobileNumber || "",
        alternateNumber: data?.owner?.alternateNumber || "",
        emailId: data?.owner?.emailId || "",
        type: "FIXED-POINT",
      },

      address: {
        addressId: data?.address?.addressId || null,
        applicantId: data?.address?.applicantId || null,
        houseNo: data?.address?.houseNo || "",
        streetName: data?.address?.streetName || "",
        addressLine1: data?.address?.addressLine1 || "",
        addressLine2: data?.address?.addressLine2 || "",
        landmark: data?.address?.landmark || "",
        city: data?.address?.city?.name || data?.address?.city || "DJB",
        cityCode: data?.address?.cityCode || data?.address?.city?.code || "DJB",
        locality: data?.address?.locality?.label || data?.address?.locality?.name || data?.address?.locality || "",
        localityCode: data?.address?.locality?.code || data?.address?.localityCode || "",
        latitude: data?.address?.latitude || "",
        longitude: data?.address?.longitude || "",
        pincode: data?.address?.pincode || "",
        ward: data?.address?.ward || data?.address?.block || "",
        zone: data?.address?.zone || "",
        constituency: data?.address?.assembly || data?.address?.constituency || "",
        type: "FIXED-POINT",
      },
    },
  };
};

export const emergencyWaterTankerPayload = (data) => {
  const fixedPoint = data?.owner?.fixedPoint;
  const applicantDetailFromFP = fixedPoint?.applicantDetail || {};
  const addressFromFP = fixedPoint?.address || {};

  const formdata = {
    waterTankerBookingDetail: {
      id: data?.id || data?.waterTankerBookingDetail?.id || "",
      bookingNo: data?.bookingNo || data?.waterTankerBookingDetail?.bookingNo || null,
      applicantId: applicantDetailFromFP?.applicantId || data?.owner?.applicantId || "",
      tenantId: data?.tenantId,
      tankerType: (data?.requestDetails?.tankerType?.code || data?.requestDetails?.tankerType || "")?.toUpperCase(),
      waterType: data?.requestDetails?.waterType?.code || data?.requestDetails?.waterType,
      tankerQuantity: data?.requestDetails?.tankerQuantity?.code || data?.requestDetails?.tankerQuantity,
      waterQuantity: data?.requestDetails?.waterQuantity?.code || data?.requestDetails?.waterQuantity?.value || data?.requestDetails?.waterQuantity,
      description: data?.requestDetails?.description,
      deliveryDate: data?.requestDetails?.deliveryDate,
      deliveryTime: data?.requestDetails?.deliveryTime,
      extraCharge: data?.requestDetails?.extraCharge ? "Y" : "N",
      addressDetailId: addressFromFP?.addressId || data?.address?.addressDetailId || "",
      vendorId: data?.dispatchDetails?.vendor?.id || data?.owner?.vendor?.id || "",
      vehicleId: data?.dispatchDetails?.vehicle?.id || data?.owner?.vehicle?.id || "",
      driverId:
        data?.dispatchDetails?.driver?.owner?.uuid ||
        data?.dispatchDetails?.driver?.ownerId ||
        data?.dispatchDetails?.driver?.uuid ||
        data?.dispatchDetails?.driver?.id ||
        data?.owner?.driver?.owner?.uuid ||
        data?.owner?.driver?.ownerId ||
        "",
      fillingPointId: data?.dispatchDetails?.fillingPoint?.id || data?.owner?.fillingPoint?.id || "",
      vehicleType: data?.dispatchDetails?.vehicle?.vehicleType || data?.owner?.vehicle?.vehicleType || "",
      vehicleCapacity: data?.dispatchDetails?.vehicle?.capacity || data?.owner?.vehicle?.capacity || "",
      applicantDetail: {
        applicantId: applicantDetailFromFP?.applicantId || data?.owner?.applicantId || "",
        bookingId: applicantDetailFromFP?.bookingId || "",
        name: data?.owner?.applicantName || applicantDetailFromFP?.name || "",
        mobileNumber: data?.owner?.mobileNumber || applicantDetailFromFP?.mobileNumber || "",
        alternateNumber: data?.owner?.alternateNumber || applicantDetailFromFP?.alternateNumber || "",
        emailId: data?.owner?.emailId || applicantDetailFromFP?.emailId || "",
        gender: data?.owner?.gender || applicantDetailFromFP?.gender || null,
        type: "FIXED-POINT",
        fixedPointId: applicantDetailFromFP?.fixedPointId || "",
      },
      address: {
        applicantId: addressFromFP?.applicantId || applicantDetailFromFP?.applicantId || "",
        addressId: addressFromFP?.addressId || data?.address?.addressId || "",
        addressType: data?.address?.addressType?.code || data?.address?.addressType || "CORRESPONDENCE",
        pincode: data?.address?.pincode || addressFromFP?.pincode || "",
        city: data?.address?.city?.city?.name || data?.address?.city?.name || data?.address?.city || addressFromFP?.city || "",
        cityCode: data?.address?.city?.city?.code || data?.address?.cityCode || addressFromFP?.cityCode || "DJB",
        addressLine1: data?.address?.addressLine1 || addressFromFP?.addressLine1 || "",
        addressLine2: data?.address?.addressLine2 || addressFromFP?.addressLine2 || "",
        locality: data?.address?.locality?.i18nKey || data?.address?.locality?.name || data?.address?.locality || addressFromFP?.locality || "",
        localityCode: data?.address?.locality?.code || data?.address?.localityCode || addressFromFP?.localityCode || "",
        streetName: data?.address?.streetName || addressFromFP?.streetName || "",
        houseNo: data?.address?.houseNo || addressFromFP?.houseNo || "",
        landmark: data?.address?.landmark || addressFromFP?.landmark || "",
        latitude: data?.address?.latitude || addressFromFP?.latitude || "",
        longitude: data?.address?.longitude || addressFromFP?.longitude || "",
        ward: data?.address?.ward || data?.address?.block || addressFromFP?.ward || "",
        zone: data?.address?.zone || addressFromFP?.zone || "",
        constituency: data?.address?.assembly || data?.address?.constituency || addressFromFP?.constituency || "",
      },
      WTfileStoreId: data?.requestDetails?.fileStoreId,
      bookingStatus: "BOOKING_CREATED",
      workflow: {
        action: "CREATE",
        comments: "",
        businessService: "watertanker-fixedpoint",
        moduleName: "request-service.water_tanker",
      },
    },
  };
  return formdata;
};

export const updateEmergencyWaterTankerPayload = (data) => {
  const fixedPoint = data?.owner?.fixedPoint;
  const applicantDetailFromFP = fixedPoint?.applicantDetail || {};
  const addressFromFP = fixedPoint?.address || {};

  const formdata = {
    waterTankerBookingDetail: {
      id: data?.id || data?.waterTankerBookingDetail?.id || "",
      bookingNo: data?.bookingNo || data?.waterTankerBookingDetail?.bookingNo || null,
      bookingId: data?.bookingId || data?.waterTankerBookingDetail?.bookingId || "",
      applicantId: applicantDetailFromFP?.applicantId || data?.owner?.applicantId || data?.applicantId || "",
      tenantId: data?.tenantId,
      tankerType: (data?.requestDetails?.tankerType?.code || data?.requestDetails?.tankerType || "")?.toUpperCase(),
      waterType: data?.requestDetails?.waterType?.code || data?.requestDetails?.waterType,
      tankerQuantity: data?.requestDetails?.tankerQuantity?.code || data?.requestDetails?.tankerQuantity,
      waterQuantity: data?.requestDetails?.waterQuantity?.code || data?.requestDetails?.waterQuantity?.value || data?.requestDetails?.waterQuantity,
      description: data?.requestDetails?.description,
      deliveryDate: data?.requestDetails?.deliveryDate,
      deliveryTime: data?.requestDetails?.deliveryTime,
      extraCharge: data?.requestDetails?.extraCharge ? "Y" : "N",
      addressDetailId: addressFromFP?.addressId || data?.address?.addressDetailId || data?.addressDetailId || "",
      vendorId: data?.dispatchDetails?.vendor?.id || data?.owner?.vendor?.id || data?.vendorId || "",
      vehicleId: data?.dispatchDetails?.vehicle?.id || data?.owner?.vehicle?.id || data?.vehicleId || "",
      driverId:
        data?.dispatchDetails?.driver?.owner?.uuid ||
        data?.dispatchDetails?.driver?.ownerId ||
        data?.dispatchDetails?.driver?.uuid ||
        data?.dispatchDetails?.driver?.id ||
        data?.owner?.driver?.owner?.uuid ||
        data?.owner?.driver?.ownerId ||
        data?.driverId ||
        "",
      fillingPointId: data?.dispatchDetails?.fillingPoint?.id || data?.owner?.fillingPoint?.id || data?.fillingPointId || "",
      vehicleType: data?.dispatchDetails?.vehicle?.vehicleType || data?.owner?.vehicle?.vehicleType || data?.vehicleType || "",
      vehicleCapacity: data?.dispatchDetails?.vehicle?.capacity || data?.owner?.vehicle?.capacity || data?.vehicleCapacity || "",
      applicantDetail: {
        applicantId: applicantDetailFromFP?.applicantId || data?.owner?.applicantId || data?.applicantDetail?.applicantId || "",
        bookingId: applicantDetailFromFP?.bookingId || data?.applicantDetail?.bookingId || "",
        name: data?.owner?.applicantName || applicantDetailFromFP?.name || data?.applicantDetail?.name || "",
        mobileNumber: data?.owner?.mobileNumber || applicantDetailFromFP?.mobileNumber || data?.applicantDetail?.mobileNumber || "",
        alternateNumber: data?.owner?.alternateNumber || applicantDetailFromFP?.alternateNumber || data?.applicantDetail?.alternateNumber || "",
        emailId: data?.owner?.emailId || applicantDetailFromFP?.emailId || data?.applicantDetail?.emailId || "",
        gender: data?.owner?.gender || applicantDetailFromFP?.gender || data?.applicantDetail?.gender || null,
        type: "FIXED-POINT",
        fixedPointId: applicantDetailFromFP?.fixedPointId || data?.applicantDetail?.fixedPointId || "",
      },
      address: {
        applicantId: addressFromFP?.applicantId || applicantDetailFromFP?.applicantId || data?.address?.applicantId || "",
        addressId: addressFromFP?.addressId || data?.address?.addressId || data?.address?.addressDetailId || "",
        addressType: data?.address?.addressType?.code || data?.address?.addressType || "CORRESPONDENCE",
        pincode: data?.address?.pincode || addressFromFP?.pincode || "",
        city: data?.address?.city?.city?.name || data?.address?.city?.name || data?.address?.city || addressFromFP?.city || "",
        cityCode: data?.address?.city?.city?.code || data?.address?.cityCode || addressFromFP?.cityCode || "DJB",
        addressLine1: data?.address?.addressLine1 || addressFromFP?.addressLine1 || "",
        addressLine2: data?.address?.addressLine2 || addressFromFP?.addressLine2 || "",
        locality: data?.address?.locality?.i18nKey || data?.address?.locality?.name || data?.address?.locality || addressFromFP?.locality || "",
        localityCode: data?.address?.locality?.code || data?.address?.localityCode || addressFromFP?.localityCode || "",
        streetName: data?.address?.streetName || addressFromFP?.streetName || "",
        houseNo: data?.address?.houseNo || addressFromFP?.houseNo || "",
        landmark: data?.address?.landmark || addressFromFP?.landmark || "",
        latitude: data?.address?.latitude || addressFromFP?.latitude || "",
        longitude: data?.address?.longitude || addressFromFP?.longitude || "",
        ward: data?.address?.ward || data?.address?.block || addressFromFP?.ward || "",
        zone: data?.address?.zone || addressFromFP?.zone || "",
        constituency: data?.address?.assembly || data?.address?.constituency || addressFromFP?.constituency || "",
      },
      WTfileStoreId: data?.requestDetails?.fileStoreId || data?.WTfileStoreId || null,
      bookingStatus: data?.bookingStatus || "BOOKING_CREATED",
      
    },
  };
  return formdata;
};
