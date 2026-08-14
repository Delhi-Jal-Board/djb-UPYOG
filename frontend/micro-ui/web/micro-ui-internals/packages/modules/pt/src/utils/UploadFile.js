import React, { useEffect, useRef, useState, Fragment } from "react";
import ButtonSelector from "./ButtonSelector";
import { useTranslation } from "react-i18next";
import RemoveableTag from "./RemoveableTag";
import { Toast } from "@djb25/digit-ui-react-components";

const getRandomId = () => {
  return Math.floor((Math.random() || 1) * 139);
};

const getCitizenStyles = (value) => {
  let citizenStyles = {};
  if (value == "propertyCreate") {
    citizenStyles = {
      textStyles: {
        whiteSpace: "nowrap",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "80%",
      },
      tagStyles: {
        width: "90%",
        flexWrap: "nowrap",
      },
      inputStyles: {
        width: "44%",
        minHeight: "2rem",
        maxHeight: "3rem",
        top: "20%",
      },
      buttonStyles: {
        height: "auto",
        minHeight: "2rem",
        width: "40%",
        maxHeight: "3rem",
      },
      tagContainerStyles: {
        width: "60%",
        display: "flex",
        marginTop: "0px",
      },
      closeIconStyles: {
        width: "20px",
      },
      containerStyles: {
        padding: "10px",
        marginTop: "0px",
      },
    };
  } else if (value == "IP") {
    citizenStyles = {
      textStyles: {
        whiteSpace: "nowrap",
        maxWidth: "250px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      tagStyles: {
        marginLeft: "-30px",
      },
      inputStyles: {},
      closeIconStyles: {
        position: "absolute",
        marginTop: "-12px",
      },
      buttonStyles: {},
      tagContainerStyles: {},
    };
  } else if (value == "OBPS") {
    citizenStyles = {
      containerStyles: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        flexWrap: "wrap",
        margin: "0px",
        padding: "0px",
      },
      tagContainerStyles: {
        margin: "0px",
        padding: "0px",
        width: "46%",
      },
      tagStyles: {
        height: "auto",
        padding: "5px",
        margin: 0,
        width: "100%",
        margin: "5px",
      },
      textStyles: {
        wordBreak: "break-word",
        height: "auto",
        lineHeight: "16px",
        overflow: "hidden",
        // minHeight: "35px",
        maxHeight: "34px",
      },
      inputStyles: {
        width: "43%",
        minHeight: "42px",
        maxHeight: "42px",
        top: "5px",
        left: "5px",
      },
      buttonStyles: {
        height: "auto",
        minHeight: "40px",
        width: "43%",
        maxHeight: "40px",
        margin: "5px",
        padding: "0px",
      },
      closeIconStyles: {
        width: "20px",
      },
      uploadFile: {
        minHeight: "50px",
      },
    };
  } else {
    citizenStyles = {
      textStyles: {},
      tagStyles: {},
      inputStyles: {},
      buttonStyles: {},
      tagContainerStyles: {},
    };
  }
  return citizenStyles;
};

const UploadFileDigiLocker = (props) => {
  const { t } = useTranslation();
  const inpRef = useRef();
  const [hasFile, setHasFile] = useState(false);
  const [prevSate, setprevSate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [digiLockerPreviewUrl, setDigiLockerPreviewUrl] = useState(null);
  const [showDigiLockerPreview, setShowDigiLockerPreview] = useState(false);
  const [digiLockerFilename, setDigiLockerFilename] = useState(null);
  const user_type = Digit.SessionStorage.get("userType");
  const { isLoading, isSuccess, error, count, data: dataNew, mutate: assessmentMutate } = Digit.Hooks.createTokenAPI("document");
  let extraStyles = {};
  const handleChange = () => {
    if (inpRef.current.files && inpRef.current.files[0]) {
      setHasFile(true);
      setprevSate(inpRef.current.files[0]);
    } else if (!digiLockerFilename) {
      setHasFile(false);
    }
  };
  const closeModal = () => {
    setShowModal(false);
  };
  // for common aligmnent issues added common styles
  extraStyles = getCitizenStyles("OBPS");
  const handleDelete = () => {
    inpRef.current.value = "";
    // Revoke blob URL to free memory
    if (digiLockerPreviewUrl) {
      URL.revokeObjectURL(digiLockerPreviewUrl);
      setDigiLockerPreviewUrl(null);
    }
    setDigiLockerFilename(null);
    setHasFile(false);
    props.onDelete();
  };
  const handleEmpty = () => {
    if (inpRef.current.files.length <= 0 && prevSate !== null) {
      inpRef.current.value = "";
      props.onDelete();
    }
  };

  if (props.uploadMessage && inpRef.current.value) {
    handleDelete();
    setHasFile(false);
  }
  useEffect(() => handleEmpty(), [inpRef?.current?.files]);

  useEffect(() => handleChange(), [props.message]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (digiLockerPreviewUrl) URL.revokeObjectURL(digiLockerPreviewUrl);
    };
  }, [digiLockerPreviewUrl]);

  const dataURItoBlob = (dataURI) => {
    var b64Data = dataURI.split(",")[1].replace(/\s/g, "");
    var binary = atob(b64Data);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: "application/pdf" });
  };
  /* this fetchDigiLockerDocuments function is used to fetch documents from Digilocker*/

  const fetchDigiLockerDocuments = async (e) => {
    e.preventDefault();
    try {
      const digiLockerToken = sessionStorage.getItem("DigiLocker.token1");
      if (!digiLockerToken) {
        setShowToast({ error: true, label: "Please login to DigiLocker first to fetch documents." });
        return;
      }
      let TokenReq = {
        authToken: digiLockerToken,
      };
      const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
      const res1 = await Digit.DigiLockerService.issueDoc({ TokenReq }, tenantId);
      if (!res1 || !res1.IssuedDoc) {
        setShowToast({ error: true, label: "Failed to fetch documents from DigiLocker. Please login again." });
        return;
      }

      let doctype = "DRVLC"; // default
      if (props?.documentType) {
        const code = props.documentType.toUpperCase();
        if (code.includes("AADHAAR") || code.includes("AADHAR")) doctype = "ADHAR";
        else if (code.includes("DRIVING") || code.includes("DRVLC")) doctype = "DRVLC";
        else if (code.includes("PAN")) doctype = "PANCR";
        else if (code.includes("VOTER")) doctype = "VOTER";
      }

      // Also try alternate doctype codes from API response
      const DOCTYPE_ALIASES = {
        ADHAR: ["ADHAR", "AADHAAR", "AADHAR"],
        DRVLC: ["DRVLC", "DRIVING"],
        PANCR: ["PANCR", "PANCH", "PAN"],
        VOTER: ["VOTER", "VOTERID"],
      };
      const aliases = DOCTYPE_ALIASES[doctype] || [doctype];
      let uri = res1.IssuedDoc.filter((item) => aliases.some((alias) => item.doctype === alias));

      if (uri?.length > 0) {
        // Extract document number from URI (last segment after the last '-')
        // e.g., "in.gov.pan-PANVR-DLSPG4304N" → "DLSPG4304N"
        const uriStr = uri[0].uri || "";
        const parts = uriStr.split("-");
        const documentNumber = parts.length > 1 ? parts[parts.length - 1] : "";
        if (documentNumber && props?.onDocumentNumber) {
          props.onDocumentNumber(documentNumber);
        }

        let TokenReqNew = {
          authToken: digiLockerToken,
          id: uriStr,
        };
        const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
        // Use uriFile to ensure we can handle raw binary PDFs properly
        const res2 = await Digit.DigiLockerService.uriFile({ TokenReq: TokenReqNew }, tenantId);

        console.log("[DigiLocker] uriFile response:", res2);

        let blobData = null;
        let contentType = res2?.headers?.["content-type"] || "";
        
        // Sometimes backend sends it as text/plain instead of JSON but it's still a JSON string
        let isJsonString = contentType.includes("application/json");
        
        if (res2?.data) {
          const firstBytes = new Uint8Array(res2.data, 0, 3);
          if (firstBytes[0] === 34 && firstBytes[1] === 37 && firstBytes[2] === 80) {
            // Starts with " % P -> It is an escaped JSON string of a PDF!
            isJsonString = true;
          }

          if (isJsonString) {
            // It's a JSON object or string, decode from arraybuffer
            const decoder = new TextDecoder("utf-8");
            const jsonString = decoder.decode(res2.data);
            const jsonObj = JSON.parse(jsonString);

            const findFileStoreId = (obj) => {
              if (!obj || typeof obj !== "object") return null;
              for (let key in obj) {
                if (key.toLowerCase() === "filestoreid") return obj[key];
                const found = findFileStoreId(obj[key]);
                if (found) return found;
              }
              return null;
            };

            const findBase64 = (obj) => {
              if (!obj || typeof obj !== "object") return null;
              for (let key in obj) {
                if (["doccontent", "filecontent", "base64"].includes(key.toLowerCase())) return obj[key];
                const found = findBase64(obj[key]);
                if (found && typeof found === "string") return found;
              }
              return null;
            };

            if (typeof jsonObj === "string") {
              if (jsonObj.startsWith("%PDF")) {
                console.log("[DigiLocker] Response is a literal PDF string. Trying to salvage corrupted bytes...");
                // The backend incorrectly returned a binary PDF as a UTF-8 JSON string.
                // We convert it back to a byte array as best as possible.
                const len = jsonObj.length;
                const arr = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  arr[i] = jsonObj.charCodeAt(i) & 0xFF;
                }
                blobData = new Blob([arr], { type: "application/pdf" });
              } else {
                // If it's a raw base64 string
                const dataUri = jsonObj.startsWith("data:") ? jsonObj : `data:application/pdf;base64,${jsonObj}`;
                try {
                  blobData = dataURItoBlob(dataUri);
                } catch (e) {
                  console.error("Failed to parse string as base64", e);
                }
              }
            } else {
              const fsId = findFileStoreId(jsonObj);

              if (fsId) {
                console.log("[DigiLocker] Got fileStoreId from JSON:", fsId);
                const fileRes = await Digit.UploadServices.FileFetchbyid(fsId, Digit.ULBService.getStateId());
                blobData = fileRes?.data instanceof Blob
                  ? fileRes.data
                  : new Blob([fileRes?.data || ""], { type: fileRes?.headers?.["content-type"] || "application/pdf" });
              } else {
                const b64 = findBase64(jsonObj);
                if (b64 && typeof b64 === "string") {
                  console.log("[DigiLocker] Got base64 content from JSON field");
                  const dataUri = b64.startsWith("data:") ? b64 : `data:application/pdf;base64,${b64}`;
                  blobData = dataURItoBlob(dataUri);
                } else {
                  console.log("[DigiLocker] JSON did not contain filestoreid or base64.");
                }
              }
            }
          } else {
            // It's already a binary format like PDF
            console.log("[DigiLocker] Treating response as raw binary PDF.", contentType);
            blobData = new Blob([res2.data], { type: "application/pdf" });
          }
            // Case 3: Failed to parse correctly or no known fields
            if (!blobData) {
              console.log("[DigiLocker] Treating response as raw binary PDF fallback.");
              // Try to salvage if it's somehow raw bytes in a string
              blobData = new Blob([res2?.data || res2], { type: "application/pdf" });
            }
          }

          const filename = `${doctype}_${uri[0].name || "document"}.pdf`;
          if (blobData && blobData.size > 0) convertToFile(e, blobData, filename);
          else setShowToast({ error: true, label: "Failed to read document from DigiLocker." });
        } else {
          setShowToast({ error: true, label: `Selected document (${props?.documentType || doctype}) is not available in your DigiLocker.` });
        }
      } catch (error) {
        console.error("DigiLocker Fetch Error:", error);
        setShowToast({ error: true, label: "Please login to DigiLocker first to fetch documents." });
      }
    };

    const convertToFile = (e, blob, filename = "document.pdf") => {
      // Create preview URL directly from the blob (no filestore round-trip needed)
      const previewUrl = URL.createObjectURL(blob);
      setDigiLockerPreviewUrl(previewUrl);

      var reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        var base64data = reader.result;
        var blobData = dataURItoBlob(base64data);
        let newFile = new File([blobData], filename, { type: "application/pdf" });
        setDigiLockerFilename(filename);
        setHasFile(true);
        props.onUpload(e, newFile);
      };
    };
    const Close = () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#0B0C0C" />
      </svg>
    );
    const showHint = props?.showHint || false;
    return (
      <Fragment>
        {showHint && <p className="cell-text">{t(props?.hintText)}</p>}
        <div
          className={`upload-file ${user_type === "employee" ? "" : "upload-file-max-width"} ${props.disabled ? " disabled" : ""}`}
          style={extraStyles?.uploadFile ? extraStyles?.uploadFile : {}}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              borderBottom: "1px solid #d6d5d4",
              paddingBottom: "10px",
              marginBottom: "10px",
            }}
          >
            <ButtonSelector
              theme="border"
              label={t("CS_COMMON_CHOOSE_FILE")}
              style={{ margin: 0, ...(props.disabled ? { display: "none" } : {}) }}
              textStyles={props?.textStyles}
              type={props.buttonType || "button"}
              onSubmit={() => inpRef.current.click()}
            />
            <span style={{ fontWeight: "bold" }}>OR</span>
            <div>
              <button
                className="digilocker-btn"
                type="button"
                onClick={(e) => fetchDigiLockerDocuments(e)}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 10px",
                  border: "1px solid #d6d5d4",
                  borderRadius: "2px",
                  background: "#f8f9fa",
                }}
              >
                <img src="https://meripehchaan.gov.in/assets/img/icon/digi.png" className="mr-2" style={{ width: "20px" }} />
                {t("CS_COMMON_FETCH_FROM_DIGILOCKER")}
              </button>
            </div>
            {/* DigiLocker eye icon — appears after a doc is successfully fetched */}
            {digiLockerPreviewUrl && (
              <button
                type="button"
                title={t("WS_VIEW_DOCUMENT") || "Preview document"}
                onClick={() => setShowDigiLockerPreview(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", padding: "4px",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 0 24 24" width="22" fill="#00497e">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </button>
            )}
          </div>
          {props?.uploadedFiles?.map((file, index) => {
            const fileDetailsData = file[1];
            return (
              <div className="tag-container" style={extraStyles ? extraStyles?.tagContainerStyles : null}>
                <RemoveableTag extraStyles={extraStyles} key={index} text={file[0]} onClick={(e) => props?.removeTargetedFile(fileDetailsData, e)} />
              </div>
            );
          })}
          {(!hasFile && !props.file) || props.error ? (
            <h2 className="file-upload-status">{props.message}</h2>
          ) : (
            <div className="tag-container" style={extraStyles ? extraStyles?.tagContainerStyles : null}>
              <div className="tag" style={extraStyles ? extraStyles?.tagStyles : null}>
                <span className="text" style={extraStyles ? extraStyles?.textStyles : null}>
                  {digiLockerFilename ? digiLockerFilename : (typeof inpRef.current.files[0]?.name !== "undefined" && !props?.file ? inpRef.current.files[0]?.name : props.file?.name)}
                </span>
                <span onClick={() => handleDelete()} style={extraStyles ? extraStyles?.closeIconStyles : null}>
                  <Close style={props.Multistyle} className="close" />
                </span>
              </div>
            </div>
          )}
          <input
            className={props.disabled ? "disabled" : ""}
            style={{ display: "none" }}
            ref={inpRef}
            type="file"
            id={props.id || `document-${getRandomId()}`}
            name="file"
            multiple={props.multiple}
            accept={props.accept}
            disabled={props.disabled}
            onChange={(e) => props.onUpload(e)}
            onClick={(event) => {
              const { target = {} } = event || {};
              target.value = "";
            }}
          />
        </div>
        {props.iserror && <p style={{ color: "red" }}>{props.iserror}</p>}
        {props?.showHintBelow && <p className="cell-text">{t(props?.hintText)}</p>}
        {showToast && <Toast error={showToast.error} warning={showToast.warning} label={t(showToast.label)} onClose={() => setShowToast(null)} />}
        {/* DigiLocker PDF Preview Modal */}
        {showDigiLockerPreview && digiLockerPreviewUrl && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}
            onClick={() => setShowDigiLockerPreview(false)}
          >
            <div
              style={{
                background: "#fff", borderRadius: "8px", width: "85%", maxWidth: "860px",
                overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              onClick={(ev) => ev.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#00497e" }}>
                <span style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>{t("WS_VIEW_DOCUMENT") || "View Document"}</span>
                <button
                  type="button"
                  onClick={() => setShowDigiLockerPreview(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" width="22" height="22">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                </button>
              </div>
              {/* PDF embed */}
              <embed
                src={digiLockerPreviewUrl}
                type="application/pdf"
                width="100%"
                height="520px"
                style={{ border: "none", display: "block" }}
              />
            </div>
          </div>
        )}
      </Fragment>
    );
  };

  export default UploadFileDigiLocker;
