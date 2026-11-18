export const getPropertyTypeLocale = (value) => {
  return `PROPERTYTYPE_MASTERS_${value?.split(".")[0]}`;
};

export const getPropertySubtypeLocale = (value) => `PROPERTYTYPE_MASTERS_${value}`;

export const getVehicleType = (vehicle, t) => {
  return (vehicle?.i18nKey && vehicle?.capacity && `${t(vehicle.i18nKey)} - ${vehicle.capacity} ${t("CS_COMMON_CAPACITY_LTRS")}`) || null;
};

export const updateConfiguration = ({ config, defaultConfig, detailsConfig, customConfiguration, isDefaultConfig }) => {
  const fieldSectionNamesInsideConfig = [];
  const detailsConfigCopy = { ...detailsConfig };

  customConfiguration.forEach((detail) => {
    // Adding custom fields to FieldSection fields array (body)
    if (detailsConfigCopy[detail.name] && detail.addFields) {
      detailsConfigCopy[detail.name].body.push(...detail.addFields);
    }

    let body = [];

    // adding fields to body array
    if (detail?.fieldsOrder?.length > 0) {
      // fields order
      detail.fieldsOrder.forEach((fieldName) => {
        if (detailsConfigCopy[detail.name]) {
          body.push(detailsConfigCopy[detail.name].body.find((value) => value.name === fieldName));
        }
      });

      // adding remaining fields to the body array which are not in detail?.fieldsOrder
      if (detail?.allFields) {
        detailsConfigCopy[detail.name]?.body?.forEach((field) => {
          if (!detail?.fieldsOrder?.includes(field.name)) {
            body.push(detailsConfigCopy[detail.name].body.find((value) => value.name === field.name));
          }
        });
      }
    } else {
      body = detailsConfigCopy[detail.name].body;
    }

    // remove fields
    if (detail?.removeFields) {
      detail?.removeFields?.forEach((fieldName) => {
        body = body.filter((field) => field.name !== fieldName);
      });
    }

    // adding FieldSection to config
    if (detailsConfigCopy[detail.name]) {
      config.push({
        head: detailsConfigCopy[detail.name].head,
        body,
      });
      fieldSectionNamesInsideConfig.push(detail.name);
    }
  });

  // adding remaining FieldSection to config
  if (isDefaultConfig) {
    defaultConfig?.forEach((fieldSectionName) => {
      if (!fieldSectionNamesInsideConfig.includes(fieldSectionName) && detailsConfigCopy[fieldSectionName]) {
        config.push(detailsConfigCopy[fieldSectionName]);
        fieldSectionNamesInsideConfig.push(fieldSectionName);
      }
    });
  }
};

export const checkForEmployee = (...args) => window.Digit.Utils.checkForEmployee(...args);

/* methid to get date from epoch */
export const convertEpochToDate = (dateEpoch) => {
  // Returning null in else case because new Date(null) returns initial date from calender
  if (dateEpoch) {
    const dateFromApi = new Date(dateEpoch);
    let month = dateFromApi.getMonth() + 1;
    let day = dateFromApi.getDate();
    let year = dateFromApi.getFullYear();
    month = (month > 9 ? "" : "0") + month;
    day = (day > 9 ? "" : "0") + day;
    return `${year}-${month}-${day}`;
  } else {
    return null;
  }
};

// How to use above updateConfiguration function
// let config = [];

// const defaultConfig = ["applicationDetails", "propertyDetails", "locationDetails", "paymentDetails"];

// const { Customizations } = window.Digit;
// let employeeCustomizations = false;

// if (Customizations?.FSM?.getEmployeeApplicationCustomization) {
//   employeeCustomizations = Customizations?.FSM?.getEmployeeApplicationCustomization(defaultConfig, t);
// }

// if (employeeCustomizations?.config?.length > 0) {
//   updateConfiguration({
//     config,
//     defaultConfig,
//     detailsConfig,
//     customConfiguration: employeeCustomizations?.config,
//     isDefaultConfig: employeeCustomizations?.defaultConfig,
//   });
// } else {
//   defaultConfig.forEach((fieldSectionName) => config.push(detailsConfig[fieldSectionName]));
// }

export const normalizeTenantId = (tenant) => {
  const digitObj = typeof Digit !== "undefined" ? Digit : window?.Digit;
  const currentTenant = digitObj?.ULBService?.getCurrentTenantId?.() || "dl.djb";
  if (!tenant || tenant === "dl") {
    return currentTenant && currentTenant.startsWith("dl") ? currentTenant : "dl.djb";
  }
  if (!tenant.includes(".")) {
    return currentTenant && currentTenant.startsWith(tenant) ? currentTenant : `${tenant}.djb`;
  }
  return tenant;
};

// In-memory cache & in-flight promises to eliminate duplicate network calls
const billingSlabCache = new Map();
const inFlightRequests = new Map();

export const clearBillingSlabCache = () => {
  billingSlabCache.clear();
  inFlightRequests.clear();
};

export const fetchBillingSlabDetails = async (tenantId, formData) => {
  const digitObj = typeof Digit !== "undefined" ? Digit : window?.Digit;
  if (!digitObj || !digitObj.FSMService || !digitObj.FSMService.billingSlabSearch) {
    return null;
  }

  const propertyLocation = formData?.address?.propertyLocation?.code;
  if (propertyLocation && propertyLocation !== "WITHIN_ULB_LIMITS") {
    return null;
  }

  const capacity =
    formData?.tripData?.vehicleType?.capacity ||
    formData?.selectTripNo?.vehicleCapacity?.capacity ||
    formData?.tripData?.vehicleCapacity;

  if (!capacity) {
    return null;
  }

  const { slum: slumDetails } = formData?.address || {};
  const isSlum =
    (typeof slumDetails === "string" && slumDetails && slumDetails !== "NO" && slumDetails !== "false") ||
    (typeof slumDetails === "object" && slumDetails?.code);
  const slum = isSlum ? "YES" : "NO";

  const targetTenant = normalizeTenantId(tenantId || formData?.address?.city?.code);

  const subtypeCode =
    formData?.subtype?.code ||
    (typeof formData?.subtype === "string" ? formData?.subtype : null);
  const parentPropTypeCode =
    formData?.propertyType?.code ||
    (typeof formData?.propertyType === "string" ? formData?.propertyType : null);

  const cacheKey = `${targetTenant}_${capacity}_${subtypeCode || ""}_${parentPropTypeCode || ""}_${slum}`;

  if (billingSlabCache.has(cacheKey)) {
    return billingSlabCache.get(cacheKey);
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const searchAttempts = [
    subtypeCode ? { tenant: targetTenant, filters: { propertyType: subtypeCode, capacity, slum } } : null,
    parentPropTypeCode && parentPropTypeCode !== subtypeCode ? { tenant: targetTenant, filters: { propertyType: parentPropTypeCode, capacity, slum } } : null,
    subtypeCode && slum === "YES" ? { tenant: targetTenant, filters: { propertyType: subtypeCode, capacity, slum: "NO" } } : null,
    { tenant: targetTenant, filters: { capacity } },
  ].filter(Boolean);

  const seenAttempts = new Set();
  const uniqueAttempts = searchAttempts.filter((att) => {
    const key = `${att.tenant}_${JSON.stringify(att.filters)}`;
    if (seenAttempts.has(key)) return false;
    seenAttempts.add(key);
    return true;
  });

  const fetchPromise = (async () => {
    for (const attempt of uniqueAttempts) {
      try {
        const res = await digitObj.FSMService.billingSlabSearch(attempt.tenant, attempt.filters);
        if (res?.billingSlab && res.billingSlab.length > 0) {
          billingSlabCache.set(cacheKey, res.billingSlab[0]);
          return res.billingSlab[0];
        }
      } catch (err) {
        console.warn("FSM billingSlabSearch attempt failed:", attempt, err);
      }
    }
    billingSlabCache.set(cacheKey, null);
    return null;
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

export const cleanup = (payload) => {
  if (payload) {
    return Object.keys(payload).reduce((acc, key) => {
      if (payload[key] === undefined) {
        return acc;
      }

      acc[key] = typeof payload[key] === "object" ? cleanup(payload[key]) : payload[key];
      return acc;
    }, {});
  }
};

