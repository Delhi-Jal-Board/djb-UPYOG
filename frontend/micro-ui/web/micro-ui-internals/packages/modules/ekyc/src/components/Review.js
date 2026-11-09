import React, { useState } from "react";
import {
  Card,
  SubmitBar,
  // Loader,
  ActionBar,
  CheckBox,
  LinkButton,
  GenericFileIcon,
  Menu,
  Toast,
  Table,
  MdClose,
  Modal
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useParams } from "react-router-dom";

const checkForNA = (value) => (value !== null && value !== undefined && value !== "" ? value : "N/A");

const boolToYesNo = (value, t) => {
  if (value === true || value === "true" || String(value).toLowerCase() === "yes") return t("CORE_COMMON_YES");
  if (value === false || value === "false" || String(value).toLowerCase() === "no") return t("CORE_COMMON_NO");
  if (value === "true") return t("CORE_COMMON_YES");
  if (value === "false") return t("CORE_COMMON_NO");
};

// ── All-fields mapping (headerMapping keys match flat API response keys) ──
const headerMapping = [
  { key: "updateType", label: "UPDATE_TYPE" },
  { key: "kno", label: "KNO" },
  { key: "pidNumber", label: "PID_NUMBER" },
  { key: "subPropertyCategory", label: "SUB_PROPERTY_CATEGORY" },
  { key: "propertyType", label: "PROPERTY_TYPE" },
  { key: "noOfFloor", label: "NO_OF_FLOOR" },
  { key: "noOfRooms", label: "NO_OF_ROOMS" },
  { key: "noOfBeds", label: "NO_OF_BEDS" },
  { key: "buildingImageFileStoreId", label: "BUILDING_IMAGE_FILE_STORE_ID" },
  { key: "propertyDocumentFileStoreId", label: "PROPERTY_DOCUMENT_FILE_STORE_ID" },
  { key: "floorNo", label: "FLOOR_NO" },
  { key: "numberOfDwellingUnits", label: "NUMBER_OF_DWELLING_UNITS" },
  { key: "modifiedBy", label: "MODIFIED_BY" },
  { key: "ekycStatus", label: "EKYC_STATUS" },
  { key: "fullAddress", label: "FULL_ADDRESS" },
  { key: "flatHouseNumber", label: "FLAT_HOUSE_NUMBER" },
  { key: "streetName", label: "STREET_NAME" },
  { key: "subLocality", label: "SUB_LOCALITY" },
  { key: "landmark", label: "EKYC_LANDMARK" },
  { key: "pinCode", label: "EKYC_PINCODE" },
  { key: "ward", label: "WARD" },
  { key: "assembly", label: "EKYC_ASSEMBLY" },
  { key: "locality", label: "EKYC_LOCALITY" },
  { key: "zoneName", label: "ZONE" },
  { key: "doorPhotoFilestoreId", label: "DOOR_PHOTO_FILE_STORE_ID" },
  { key: "gpsValid", label: "GPS_VALID", isBool: true },
  { key: "latitude", label: "LATITUDE" },
  { key: "longitude", label: "LONGITUDE" },
  { key: "consumerType", label: "CONSUMER_TYPE" },
  { key: "occupantType", label: "OCCUPANT_TYPE" },
  { key: "knoCategory", label: "KNO_CATEGORY" },
  { key: "firstName", label: "FIRST_NAME" },
  { key: "lastName", label: "LAST_NAME" },
  { key: "middleName", label: "MIDDLE_NAME" },
  { key: "gender", label: "GENDER" },
  { key: "mobileNo", label: "MOBILE_NUMBER" },
  { key: "noOfPerson", label: "NUMBER_OF_PERSON" },
  { key: "proofOfIdentityType", label: "PROOF_OF_IDENTITY_TYPE" },
  { key: "documentNumber", label: "DOCUMENT_NUMBER" },
  { key: "consentGiven", label: "CONSENT_GIVEN", isBool: true },
  { key: "parentSpouse", label: "PARENT_SPOUSE" },
  { key: "email", label: "EMAIL" },
  { key: "whatsappNo", label: "WHATSAPP_NO" },
  { key: "informantIsConsumer", label: "INFORMANT_IS_CONSUMER" },
  { key: "informantName", label: "INFORMANT_NAME" },
  { key: "informantRelation", label: "INFORMANT_RELATION" },
  { key: "panFilestoreId", label: "PAN_FILE_STORE_ID" },
  { key: "documentProofFilestoreId", label: "DOCUMENT_PROOF_FILE_STORE_ID" },
  { key: "ownerMobile", label: "OWNER_MOBILE" },
  { key: "ownerVerificationDone", label: "OWNER_VERIFICATION_DONE", isBool: true },
  { key: "designation", label: "DESIGNATION" },
  { key: "department", label: "DEPARTMENT" },
  { key: "employeeId", label: "EMPLOYEE_ID" },
  { key: "landlineNo", label: "LANDLINE_NO" },
  { key: "contactPerson", label: "CONTACT_PERSON" },
  { key: "relation", label: "RELATION" },
  { key: "entityName", label: "ENTITY_NAME" },
  { key: "meterStatus", label: "METER_STATUS" },
  { key: "meterCondition", label: "METER_CONDITION" },
  { key: "meterNumber", label: "METER_NUMBER" },
  { key: "meterMake", label: "METER_MAKE" },
  { key: "workingStatus", label: "WORKING_STATUS" },
  { key: "meterLocation", label: "METER_LOCATION" },
  { key: "meterLocationAddress", label: "METER_LOCATION_ADDRESS" },
  { key: "meterLatitude", label: "EKYC_METER_LATITUDE1" },
  { key: "meterLongitude", label: "EKYC_METER_LONGITUDE1" },
  { key: "meterPhotoFileStoreId", label: "METER_PHOTO_FILE_STORE_ID" },
  { key: "lastBillRaised", label: "LAST_BILL_RAISED", isBool: true },
  { key: "lastBillReceivedDate", label: "LAST_BILL_RECEIVED_DATE" },
  { key: "lastBillNotRaisedReason", label: "LAST_BILL_NOT_RAISED_REASON" },
  { key: "accessToMeter", label: "ACCESS_TO_METER", isBool: true },
  { key: "sewerConnection", label: "SEWER_CONNECTION", isBool: true },
  { key: "septicTank", label: "SEPTIC_TANK", isBool: true },
  { key: "systemMeterId", label: "SYSTEM_METER_ID" },
  { key: "caNumber", label: "CA_NUMBER" },
];

const Review = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  let { kno, applicationId } = useParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [agree, setAgree] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [toastData, setToastData] = useState({ error: false, label: "" });

  const options = [{ action: t("APPROVE") }, { action: t("REJECT") }];

  const activeKno = kno || applicationId;
  
  const { data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: activeKno, fetchType: "REVIEW" } },
    { enabled: !!activeKno }
  );

  const newData = searchData?.applicationReview?.newData;
  const oldData = searchData?.applicationReview?.oldData;

  const reviewTableData = headerMapping.map((field) => {
    const newValue = newData?.[field.key];
    const oldValue = oldData?.[field.key];
    const normalizeValue = (value) => (value === null || value === undefined || value === "" ? "" : String(value));
    const isChanged = !!oldData && oldValue !== undefined && normalizeValue(newValue) !== normalizeValue(oldValue);

    return {
      fieldName: field.preTranslated ? field.label : t(field.label),
      oldValue: field.isBool ? boolToYesNo(oldValue, t) : checkForNA(oldValue),
      newValue: field.isBool ? boolToYesNo(newValue, t) : checkForNA(newValue),
      isChanged,
    };
  });

  const reviewTableColumns = [
    {
      Header: t("EKYC_FIELD_NAME"),
      accessor: "fieldName",
      width: 30,
      disableSortBy: true,
      Cell: ({ value }) => <span className="review-table__field">{value}</span>,
    },
    {
      Header: t("EKYC_EXISTING_INFORMATION"),
      accessor: "oldValue",
      width: 35,
      disableSortBy: true,
      Cell: ({ value }) => <span className="review-table__old-value">{value}</span>,
    },
    {
      Header: t("EKYC_PROPOSED_UPDATES"),
      accessor: "newValue",
      width: 35,
      disableSortBy: true,
      Cell: ({ row, value }) => (
        <div className={`review-table__new-value ${row.original.isChanged ? "review-table__new-value--changed" : ""}`}>
          <span>{value}</span>
          {row.original.isChanged && <span className="review-table__changed-badge">{t("EKYC_CHANGED")}</span>}
        </div>
      ),
    },
  ];

  const workflowMutation = Digit.Hooks.ekyc.useEkycWorkflow(tenantId);

  const userRoles = Digit.SessionStorage.get("User")?.info?.roles?.map((ele) => ele.code) || [];
  const isZRO = userRoles.includes("EKYC_ZRO") || userRoles.includes("ZRO");
  const isSupervisorOrSurveyorOrVendor = userRoles.includes("EKYC_SURVEYOR") || userRoles.includes("EKYC_VENDOR");

  const isStatusView = location.pathname.includes("/status/");
  const hideEditButton = (isSupervisorOrSurveyorOrVendor && !isZRO) || isStatusView;

  const handleDeclaration = () => setAgree(!agree);

  const loggedInUserInfo = Digit.UserService.getUser()?.info;

  const { data: userData } = Digit.Hooks.useUserSearch(tenantId, { uuid: [loggedInUserInfo?.uuid] }, {}, { enabled: !!loggedInUserInfo?.uuid });
  const supervisorData = userData?.user || [];

  const matchedSupervisor = supervisorData?.find((s) => s?.uuid === loggedInUserInfo?.uuid || s?.userName === loggedInUserInfo?.userName);
  const supervisorId = matchedSupervisor?.uuid || loggedInUserInfo?.uuid;

  const handleReject = async () => {
    const payload = {
      RequestInfo: {
        apiId: "Rainmaker",
        ver: "1.0",
        msgId: "message-id",
        tenantId: tenantId,
        authToken: Digit.UserService.getUser()?.access_token,
      },
      kno: activeKno,
      action: "REJECTED",
      remarks: "Application rejected by reviewer",
      reviewedBy: supervisorId,
      // role: currentUserRole,
      role: "ZRO",
    };
    try {
      const result = await workflowMutation.mutateAsync(payload);
      if (result) {
        setToastData({
          error: true,
          label: t("EKYC_APPLICATION_REJECT_SUCCESSFUL") || "Application Rejected Successfully",
        });
        setShowToast(true);
        setTimeout(() => {
          history.push("/digit-ui/employee/ekyc/inbox");
        }, 2000);
      }
    } catch (err) {
      console.error("Reject Error:", err);
      const errMsg =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.Errors?.[0]?.message ||
        err?.Errors?.[0]?.message ||
        t("EKYC_REJECT_ERROR") ||
        "Reject failed. Please try again.";
      setToastData({ error: true, label: errMsg });
      setShowToast(true);
    }
  };

  const handleApprove = async () => {
    const payload = {
      RequestInfo: {
        apiId: "Rainmaker",
        ver: "1.0",
        msgId: "message-id",
        tenantId: tenantId,
        authToken: Digit.UserService.getUser()?.access_token,
      },
      kno: activeKno,
      action: "APPROVED",
      remarks: "All documents verified",
      reviewedBy: supervisorId,
      // role: currentUserRole,
      role: "ZRO",
    };
    try {
      const result = await workflowMutation.mutateAsync(payload);
      if (result) {
        setToastData({
          error: false,
          label: t("EKYC_APPLICATION_APPROVE_SUCCESSFUL") || "Application Approved Successfully",
        });
        setShowToast(true);
        setTimeout(() => {
          history.push("/digit-ui/employee/ekyc/inbox");
        }, 2000);
      }
    } catch (err) {
      console.error("Approve Error:", err);
      const errMsg =
        err?.response?.data?.Errors?.[0]?.message ||
        err?.Errors?.[0]?.message ||
        err?.message ||
        t("EKYC_APPROVE_ERROR") ||
        "Approve failed. Please try again.";
      setToastData({ error: true, label: errMsg });
      setShowToast(true);
    }
  };

  // const handleFinalSubmit = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const payload = {
  //       kno: activeKno,
  //       tenantId: tenantId,
  //       newData: {
  //         connectionDetails: connectionData,
  //         addressDetails: addressData,
  //         propertyInfo: propertyData,
  //         meterDetails: meterData,
  //       },
  //     };

  //     const result = await updateMutation.mutateAsync(payload);
  //     if (result) {
  //       history.push("/digit-ui/employee/ekyc/response", { success: true, result });
  //     }
  //   } catch (err) {
  //     console.error("Submit Error:", err);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleViewDocument = async (fileStoreId, selectedDoc, type) => {
    if (!fileStoreId) return;

    try {
      const response = await Digit.UploadServices.FileFetchbyid(fileStoreId, "dl.djb");

      if (!response?.data) return;

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: type === "image" ? "image/jpeg" : "application/pdf",
            });

      const blobUrl = URL.createObjectURL(blob);

      setPreviewUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return blobUrl;
      });

      setPreviewError(false);
      setDocumentName({name:selectedDoc, documentType:type});
      setShowPreview(true);
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    if (option.action === t("APPROVE")) {
      handleApprove();
    } else if (option.action === t("REJECT")) {
      handleReject();
    }
  };

  const documents = [
    {
      label: t("EKYC_DOOR_PHOTO"),
      fileStoreId: newData?.doorPhotoFilestoreId,
      type: "image",
    },
    {
      label: t("EKYC_METER_PHOTO"),
      fileStoreId: newData?.meterPhotoFileStoreId,
      type: "image",
    },
    {
      label: t("EKYC_BUILDING_IMAGE"),
      fileStoreId: newData?.buildingImageFileStoreId,
      type: "image",
    },
    {
      label: t("EKYC_PROPERTY_DOCUMENTS"),
      fileStoreId: newData?.propertyDocumentFileStoreId,
      type: "document",
    },
  ];

  const documentColumns = [
    {
      Header: t("CS_COMMON_DOCUMENT"),
      accessor: "label",
      disableSortBy: true,
    },
    {
      Header: t("CS_COMMON_STATUS"),
      accessor: "fileStoreId",
      disableSortBy: true,
      Cell: ({ value }) => (
        <span
          className={`review-document-status ${
            value
              ? "review-document-status--available"
              : "review-document-status--missing"
          }`}
        >
          <span className="review-document-status__dot" />
          {value ? t("EKYC_PHOTO_AVAILABLE") : t("CS_NA")}
        </span>
      ),
    },
    {
      Header: t("CS_COMMON_ACTION"),
      accessor: "action",
      disableSortBy: true,
      Cell: ({ row }) => {
        const document = row.original;

        return document.fileStoreId ? (
          <button
            type="button"
            className="review-document-button"
            onClick={() =>
              handleViewDocument(
                document.fileStoreId,
                document.label,
                document.type
              )
            }
            aria-label={`${t("EKYC_OPEN_DOCUMENT")} ${document.label}`}
          >
            <GenericFileIcon />
            <span>{t("EKYC_VIEW_DOCUMENT") || "View"}</span>
          </button>
        ) : (
          "-"
        );
      },
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <Card className="overflow-y-scroll">
        <div className="review-section-wrapper">
          <Table
            t={t}
            data={reviewTableData}
            columns={reviewTableColumns}
            className="review-table"
            disableSort
            autoSort={false}
            manualPagination={false}
            pageSizeLimit={headerMapping.length}
            isPaginationRequired={false}
            isTableScrollable
            tableTitle={t("EKYC_ALL_DETAILS") || "All Details"}
          />
        </div>

        <div className="review-section-wrapper">
          <Table
            t={t}
            data={documents}
            columns={documentColumns}
            disableSort={true}
            manualPagination={false}
            isPaginationRequired={false}
            className="review-table"
            tableClass="review-details-table"
            // className="table"
            tableTitle={t("EKYC_DOCUMENTS") || "All Details"}
          />
        </div>

        {!hideEditButton && (
          <div className="review-declaration">
            <CheckBox
              id="agreeDeclaration"
              name="agreeDeclaration"
              label={<span className="review-declaration__label">{t("EKYC_FINAL_DECLARATION")}</span>}
              onChange={handleDeclaration}
              checked={agree}
            />
          </div>
        )}

        {!hideEditButton && (
          <ActionBar>
            <SubmitBar label={t("TAKE_ACTION_FOR_APPROVE_REJECT")} onSubmit={() => setShowOptions((prev) => !prev)} disabled={!agree} />
            {showOptions && <Menu options={options} optionKey={"action"} t={t} onSelect={handleMenuSelect} className="review-action-menu" />}
          </ActionBar>
        )}
      </Card>

      {showPreview && (
        <Modal
          headerBarMain={documentName.name}
          headerBarEnd={
            <button
              type="button"
              className="review-preview-modal__close"
              onClick={() => {
                setShowPreview(false);
                setDocumentName("");
              }}
              aria-label={t("CORE_COMMON_CLOSE")}
            >
              <MdClose />
            </button>
          }
          hideSubmit
          width="fitContent"
          className="review-preview-modal"
        >
          {!previewError ? (
            documentName?.type === "document" ? (
              <iframe src={previewUrl} title={documentName?.name} className="review-preview-modal__pdf" />
            ) : (
              <img className="review-preview-modal__image" src={previewUrl} alt={documentName?.name} onError={() => setPreviewError(true)} />
            )
          ) : (
            <div className="review-preview-modal__fallback">
              <p>{t("EKYC_DOCUMENT_PREVIEW_NOT_AVAILABLE")}</p>
              <LinkButton label={t("EKYC_OPEN_IN_NEW_TAB")} onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")} />
            </div>
          )}
        </Modal>
      )}
      {showToast && <Toast error={toastData.error} label={toastData.label} onClose={() => setShowToast(false)} />}
    </div>
  );
};

export default Review;