const excludedKeys = ["firstName", "middleName", "lastName", "zoneCode"];

const formatValue = (value, t) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return "";
  }

  if (typeof value === "string") {
    const cleanValue = value.replace(/<br\s*\/?>/gi, "").trim();

    if (!cleanValue) {
      return "";
    }

    if (cleanValue.toLowerCase() === "true") {
      return t("CS_YES");
    }

    if (cleanValue.toLowerCase() === "false") {
      return t("CS_NO");
    }

    return cleanValue;
  }

  return value;
};

export const getEkycExcelData = (consumerList = [], t = (key) => key) => {
  return consumerList.map((item) => {
    const row = {};

    const consumerName = [item.firstName, item.middleName, item.lastName]
      .map((name) => (typeof name === "string" ? name.replace(/<br\s*\/?>/gi, "").trim() : ""))
      .filter(Boolean)
      .join(" ");

    if (consumerName) {
      row[t("CONSUMER_NAME") || "Consumer Name"] = consumerName;
    }

    Object.entries(item).forEach(([key, value]) => {
        if (excludedKeys.includes(key)) {
            return;
        }
        
        row[t(key.toUpperCase()) || key] = formatValue(value, t);
    });
    
    return row;
  });
};

export const downloadEkycReport = async ({ tenantId, ekycStatus, fromDate, toDate, vendorId, surveyorId, fileName, t, setLoading, showToast }) => {
  setLoading(true);

  try {
    const response = await Digit.EkycService.application_list({
      tenantId,
      offset: 0,
      limit: 10000,
      reportDownload: true,
      ekycStatus,
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(vendorId && { vendorId }),
      ...(surveyorId && { surveyorId }),
    });

    const consumerList = response?.consumerList || [];

    if (consumerList.length === 0) {
      showToast({
        label: t("NO_DATA_FOUND") || "No data found for download.",
        error: true,
      });

      return;
    }

    consumerList.forEach((item) => {
      if (item.assignedTime) {
        item.assignedTime = new Date(item.assignedTime).toLocaleDateString("en-GB");
      }

      if (item.submittedAt) {
        item.submittedAt = new Date(item.submittedAt).toLocaleDateString("en-GB");
      }
    });

    const excelData = getEkycExcelData(consumerList, t);

    Digit.Download.Excel(excelData, fileName);

    showToast({
      label: t("EKYC_DOWNLOAD_SUCCESS") || "eKYC data downloaded successfully.",
      error: false,
    });
  } catch (error) {
    console.error("Failed to download eKYC data:", error);

    showToast({
      label: t("EKYC_DOWNLOAD_FAILED") || "Failed to download eKYC data. Please try again.",
      error: true,
    });
  } finally {
    setLoading(false);
  }
};
