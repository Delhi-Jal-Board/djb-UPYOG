import Axios from "axios";
import Urls from "./urls";
export const UploadServices = {
  Filestorage: async (module, filedata, tenantId) => {
    const formData = new FormData();

    formData.append("file", filedata, filedata.name);
    formData.append("tenantId", tenantId);
    formData.append("module", module);
    let tenantInfo = window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? `?tenantId=${tenantId}` : "";
    const kc = window.keycloak;
    var config = {
      method: "post",
      url: `${Urls.FileStore}${tenantInfo}`,
      data: formData,
      headers: { "auth-token": kc.token ? kc.token : null },
    };

    return Axios(config);
  },

  MultipleFilesStorage: async (module, filesData, tenantId) => {
    const formData = new FormData();
    const filesArray = Array.from(filesData);
    filesArray?.forEach((fileData, index) => (fileData ? formData.append("file", fileData, fileData.name) : null));
    formData.append("tenantId", tenantId);
    formData.append("module", module);
    let tenantInfo = window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? `?tenantId=${tenantId}` : "";
    const kc = window.keycloak;
    var config = {
      method: "post",
      url: `${Urls.FileStore}${tenantInfo}`,
      data: formData,
      headers: { "Content-Type": "multipart/form-data", "auth-token": kc.token ? kc.token : null },
    };

    return Axios(config);
  },

  Filefetch: async (filesArray, tenantId) => {
    let tenantInfo = window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? `?tenantId=${tenantId}` : "";
    var config = {
      method: "get",
      url: `${Urls.FileFetch}${tenantInfo}`,
      params: {
        tenantId: tenantId,
        fileStoreIds: filesArray?.join(","),
      },
    };
    try {
      // ✅ TRY: attempt API call
      const res = await Axios(config);

      return res;
    } catch (error) {
      // ❌ CATCH: handle ALL failures (400, 503, network, etc.)

      console.error("🚨 FileFetch Error:", error?.response || error);

      return {
        success: false, // 🔥 important flag
        status: error?.response?.status || 500,
        data: error?.response?.data || null,
        message: error?.response?.data?.message || error.message || "File fetch failed",
        headers: error?.response?.headers || {},
      };
    }
  },

  FileFetchbyid: async (fileStoreId, tenantId) => {
    let tenantInfo = window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? `?tenantId=${tenantId}` : "";
    const kc = window.keycloak;
    var config = {
      method: "get",
      url: `${Urls.FileFetchById}${tenantInfo}`,
      params: {
        tenantId: tenantId,
        fileStoreId: fileStoreId,
      },
      responseType: "blob",
      headers: { "auth-token": kc.token ? kc.token : null },
    };
    try {
      const res = await Axios(config);

      return res;
    } catch (error) {
      console.error("🚨 FileFetchById Error:", error?.response || error);

      return {
        success: false,
        status: error?.response?.status || 500,
        data: error?.response?.data || null,
        message: error?.response?.data?.message || error.message || "File fetch by id failed",
        headers: error?.response?.headers || {},
      };
    }
  },

  DownloadFile: async (fileStoreId, tenantId, fileName = "document.pdf") => {
    if (!fileStoreId || !tenantId) return false;

    const previewWindow = window.open("about:blank", "_blank");
    const response = await UploadServices.Filefetch([fileStoreId], tenantId);
    const fileUrl = response?.data?.[fileStoreId];
    if (!fileUrl || response?.success === false) {
      previewWindow?.close();
      return false;
    }

    const downloadUrl = fileUrl.split(",").find((url) => !url.includes("large") && !url.includes("medium") && !url.includes("small")) || fileUrl.split(",")[0];
    if (previewWindow) previewWindow.location.href = downloadUrl;

    try {
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) throw new Error("File download failed");
      const blobUrl = URL.createObjectURL(await fileResponse.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      return true;
    } catch (error) {}

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  },
};

