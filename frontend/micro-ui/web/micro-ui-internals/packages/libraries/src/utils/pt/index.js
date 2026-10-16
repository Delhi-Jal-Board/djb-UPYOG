export const getPropertyTypeLocale = (value) => {
  return `PROPERTYTAX_BILLING_SLAB_${value?.split(".")[0]}`;
};

export const getPropertySubtypeLocale = (value) => `PROPERTYTAX_BILLING_SLAB_${value}`;

export const stringReplaceAll = (str = "", searcher = "", replaceWith = "") => {
  if (searcher === "") return str;
  while (str.includes(searcher)) {
    str = str.replace(searcher, replaceWith);
  }
  return str;
};

/*   method to check not null  if not returns false*/
export const checkForNotNull = (value = "") => {
  return value && value != null && value != undefined && value != "" ? true : false;
};

export const convertDotValues = (value = "") => {
  return (
    (checkForNotNull(value) && ((value.replaceAll && value.replaceAll(".", "_")) || (value.replace && stringReplaceAll(value, ".", "_")))) || "NA"
  );
};

export const convertToLocale = (value = "", key = "") => {
  let convertedValue = convertDotValues(value);
  if (convertedValue === "NA") {
    return "PT_NA";
  }
  return `${key}_${convertedValue}`;
};
export const getMohallaLocale = (value = "", tenantId = "") => {
  let convertedValue = convertDotValues(tenantId);
  if (convertedValue === "NA" || !checkForNotNull(value)) {
    return "PT_NA";
  }
  convertedValue = convertedValue.toUpperCase();
  return convertToLocale(value, `${convertedValue}_REVENUE`);
};

export const getCityLocale = (value = "") => {
  let convertedValue = convertDotValues(value);
  if (convertedValue === "NA" || !checkForNotNull(value)) {
    return "PT_NA";
  }
  convertedValue = convertedValue.toUpperCase();
  return convertToLocale(convertedValue, `TENANT_TENANTS`);
};

export const convertDateToEpoch = (dateString, dayStartOrEnd = "dayend") => {
  //example input format : "2018-10-02"
  try {
    const parts = dateString.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const DateObj = new Date(Date.UTC(parts[1], parts[2] - 1, parts[3]));
    DateObj.setMinutes(DateObj.getMinutes() + DateObj.getTimezoneOffset());
    if (dayStartOrEnd === "dayend") {
      DateObj.setHours(DateObj.getHours() + 24);
      DateObj.setSeconds(DateObj.getSeconds() - 1);
    }
    return DateObj.getTime();
  } catch (e) {
    return dateString;
  }
};

export const toTitleCase = (value) => {
  if (!value || typeof value !== "string") return value;

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

export const formatPropertyAddress = (address, t) => {
  if (!address) return "";
  if (typeof address === "string") return address;

  const houseNo = address.houseNo || address.doorNo;
  const pincode = address.pincode || address.pinCode;
  const locality = address.locality?.name || address.subLocality || (address.locality?.code ? (t ? t(`TENANTS_MOHALLA_${address.locality.code}`) : address.locality.code) : null);

  const parts = [
    houseNo ? (String(houseNo).trim().toLowerCase().startsWith("h.no") ? houseNo : `H.No. ${houseNo}`) : null,
    address.buildingName,
    address.street,
    address.landmark,
    locality,
    address.block,
    address.zone,
    pincode ? (String(pincode).trim().toLowerCase().startsWith("pin") ? pincode : `PIN: ${pincode}`) : null,
  ];

  const formatted = parts
    .map((value, index) => {
      if (!value || !String(value).trim()) return null;

      // Keep H.No. and PIN labels unchanged.
      if (index === 0 || index === 7) return value;

      return toTitleCase(value);
    })
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");

  return formatted || "";
};