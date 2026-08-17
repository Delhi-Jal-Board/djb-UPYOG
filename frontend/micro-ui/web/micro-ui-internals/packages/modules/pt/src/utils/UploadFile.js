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
    setDigiLockerFilename(null);
    setHasFile(false);
    if (props.onDocumentNumber) {
      props.onDocumentNumber("");
    }
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
          if (res2?.data) {
            const rawBytes = new Uint8Array(res2.data);

            // Case 1: Backend returned a JSON-encoded string of the raw binary PDF.
            // It starts with `"` (0x22) and `%PDF` (0x25, 0x50, 0x44, 0x46).
            if (
              rawBytes.length > 5 &&
              rawBytes[0] === 0x22 &&
              rawBytes[1] === 0x25 &&
              rawBytes[2] === 0x50 &&
              rawBytes[3] === 0x44 &&
              rawBytes[4] === 0x46
            ) {
              console.log("[DigiLocker] Response is a JSON-encoded binary PDF string. Unescaping bytes...");
              const unescaped = new Uint8Array(rawBytes.length);
              let outIdx = 0;
              // Skip first quote (i=1) and last quote (i < length-1)
              for (let i = 1; i < rawBytes.length - 1; i++) {
                if (rawBytes[i] === 0x5c) {
                  // backslash '\'
                  i++;
                  const next = rawBytes[i];
                  if (next === 0x6e) unescaped[outIdx++] = 0x0a;
                  // \n
                  else if (next === 0x72) unescaped[outIdx++] = 0x0d;
                  // \r
                  else if (next === 0x74) unescaped[outIdx++] = 0x09;
                  // \t
                  else if (next === 0x22) unescaped[outIdx++] = 0x22;
                  // \"
                  else if (next === 0x5c) unescaped[outIdx++] = 0x5c;
                  // \\
                  else if (next === 0x62) unescaped[outIdx++] = 0x08;
                  // \b
                  else if (next === 0x66) unescaped[outIdx++] = 0x0c;
                  // \f
                  else unescaped[outIdx++] = next;
                } else {
                  unescaped[outIdx++] = rawBytes[i];
                }
              }
              blobData = new Blob([unescaped.slice(0, outIdx)], { type: "application/pdf" });
            }
            // Case 2: Backend returned raw binary PDF without quotes. Starts with `%PDF`
            else if (rawBytes.length > 4 && rawBytes[0] === 0x25 && rawBytes[1] === 0x50 && rawBytes[2] === 0x44 && rawBytes[3] === 0x46) {
              console.log("[DigiLocker] Response is a raw binary PDF.");
              blobData = new Blob([res2.data], { type: "application/pdf" });
            }
            // Case 3: Other JSON formats (arrays of bytes, base64 strings, or complex JSON objects)
            else {
              // Safe to decode as text because if it's base64 or valid JSON, it only contains standard ASCII/UTF-8
              const decoder = new TextDecoder("utf-8");
              const textStr = decoder.decode(res2.data);

              let parsedJson = null;
              try {
                parsedJson = JSON.parse(textStr);
              } catch (e) {
                // Not valid JSON
              }

              if (parsedJson) {
                if (Array.isArray(parsedJson)) {
                  console.log("[DigiLocker] Response is a JSON array of bytes.");
                  const arr = new Uint8Array(parsedJson);
                  blobData = new Blob([arr], { type: "application/pdf" });
                } else if (typeof parsedJson === "string") {
                  console.log("[DigiLocker] Response is a base64 string in JSON.");
                  const dataUri = parsedJson.startsWith("data:") ? parsedJson : `data:application/pdf;base64,${parsedJson}`;
                  try {
                    blobData = dataURItoBlob(dataUri);
                  } catch (e) {
                    console.error("Failed to parse JSON string as base64", e);
                  }
                } else if (typeof parsedJson === "object") {
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

                  const fsId = findFileStoreId(parsedJson);
                  if (fsId) {
                    console.log("[DigiLocker] Got fileStoreId from JSON:", fsId);
                    const fileRes = await Digit.UploadServices.FileFetchbyid(fsId, Digit.ULBService.getStateId());
                    blobData =
                      fileRes?.data instanceof Blob
                        ? fileRes.data
                        : new Blob([fileRes?.data || ""], { type: fileRes?.headers?.["content-type"] || "application/pdf" });
                  } else {
                    const b64 = findBase64(parsedJson);
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
                // Not JSON. Could be raw base64 string without quotes
                if (textStr.startsWith("JVBERi0x")) {
                  console.log("[DigiLocker] Response is a raw base64 string.");
                  try {
                    blobData = dataURItoBlob(`data:application/pdf;base64,${textStr}`);
                  } catch (e) {
                    console.error("Failed to parse raw text as base64", e);
                  }
                } else {
                  console.log("[DigiLocker] Response is unknown format, attempting binary PDF fallback.");
                  blobData = new Blob([res2.data], { type: "application/pdf" });
                }
              }
            }
          }

          const filename = `${doctype}_${uri[0].name || "document"}.pdf`;
          if (blobData && blobData.size > 0) convertToFile(e, blobData, filename);
          else setShowToast({ error: true, label: "Failed to read document from DigiLocker." });
        } else {
          setShowToast({ error: true, label: `Selected document (${props?.documentType || doctype}) is not available in your DigiLocker.` });
        }
      }
    } catch (error) {
      console.error("DigiLocker Fetch Error:", error);
      setShowToast({ error: true, label: "Please login to DigiLocker first to fetch documents." });
    }
  };
  const convertToFile = (e, blob, filename = "document.pdf") => {
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
                {digiLockerFilename
                  ? digiLockerFilename
                  : typeof inpRef.current.files[0]?.name !== "undefined" && !props?.file
                  ? inpRef.current.files[0]?.name
                  : props.file?.name}
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
    </Fragment>
  );
};

export default UploadFileDigiLocker;
