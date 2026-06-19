import React, { Fragment, useState } from "react";
import {
  Card,
  CardSubHeader,
  StatusTable,
  Row,
  SubmitBar,
  Loader,
  ActionBar,
  CheckBox,
  LinkButton,
  EditIcon,
  GenericFileIcon,
  Menu,
  Toast,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useParams } from "react-router-dom";

// ─── Constants ───────────────────────────────────────────────────────────────

const ActionButton = ({ jumpTo, state }) => {
  const history = useHistory();
  function routeTo() {
    history.push(jumpTo, { ...state, isEditing: true });
  }
  return (
    <LinkButton label={<EditIcon style={{ width: "20px", height: "20px", fill: "#F47738" }} />} style={{ margin: 0, padding: 0 }} onClick={routeTo} />
  );
};

const checkForNA = (value) => (value !== null && value !== undefined && value !== "" ? value : "N/A");

const boolToYesNo = (value, t) => {
  if (value === true || value === "true" || String(value).toLowerCase() === "yes") return t("CORE_COMMON_YES");
  if (value === false || value === "false" || String(value).toLowerCase() === "no") return t("CORE_COMMON_NO");
  if (value === "true") return t("CORE_COMMON_YES");
  if (value === "false") return t("CORE_COMMON_NO");
};
/**
 * Robust data extraction for comparison.
 * The API returns { applicationReviewInfo: { newData: { ... }, oldData: { ... } } }
 */
const extractReviewData = (searchData, flowState) => {
  const rawData = searchData && Object.keys(searchData).length > 0 ? searchData : flowState?.reviewData || {};

  // Navigate through applicationReviewInfo -> newData/oldData
  const reviewWrapper = rawData?.applicationReviewInfo || rawData?.applicationReview || rawData;
  const applicationData = (Array.isArray(reviewWrapper) ? reviewWrapper[0] : reviewWrapper) || {};

  return {
    newData: applicationData?.newData || applicationData,
    oldData: applicationData?.oldData || null,
  };
};

const ReviewSection = ({ title, fields, newData, oldData, t, jumpTo, state }) => {
  return (
    <div
      className="review-section-wrapper"
      style={{ marginBottom: "48px", background: "#fff", borderRadius: "12px", border: "1px solid #EAECF0", overflow: "hidden" }}
    >
      <div
        style={{
          padding: "20px 24px",
          background: "#F9FAFB",
          borderBottom: "1px solid #EAECF0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <CardSubHeader style={{ margin: 0, fontSize: "18px", color: "#101828", fontWeight: "700" }}>{title}</CardSubHeader>
        {jumpTo && <ActionButton jumpTo={jumpTo} state={state} />}
      </div>

      <div style={{ padding: "0 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: "16px 0",
                  textAlign: "left",
                  color: "#667085",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  width: "30%",
                }}
              >
                {t("EKYC_FIELD_NAME")}
              </th>
              <th
                style={{
                  padding: "16px 0",
                  textAlign: "left",
                  color: "#667085",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  width: "35%",
                }}
              >
                {t("EKYC_EXISTING_INFORMATION")}
              </th>
              <th
                style={{
                  padding: "16px 0",
                  textAlign: "left",
                  color: "#667085",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  width: "35%",
                }}
              >
                {t("EKYC_PROPOSED_UPDATES")}
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, idx) => {
              const valNew = newData?.[field.key];
              const valOld = oldData?.[field.key];
              const isChanged = oldData && String(valNew) !== String(valOld) && valOld !== undefined && valOld !== null;

              return (
                <tr key={idx} style={{ borderTop: "1px solid #F2F4F7" }}>
                  <td style={{ padding: "16px 0", fontSize: "14px", color: "#344054", fontWeight: "500" }}>{t(field.label)}</td>
                  <td style={{ padding: "16px 0", fontSize: "14px", color: "#667085" }}>
                    {field.isBool ? boolToYesNo(valOld, t) : checkForNA(valOld)}
                  </td>
                  <td
                    style={{ padding: "16px 0", fontSize: "14px", color: isChanged ? "#1B8B32" : "#101828", fontWeight: isChanged ? "700" : "400" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {field.isBool ? boolToYesNo(valNew, t) : checkForNA(valNew)}
                      {isChanged && (
                        <span
                          style={{
                            background: "#ECFDF3",
                            color: "#067647",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600",
                          }}
                        >
                          {t("EKYC_CHANGED")}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Review = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  let { kno } = useParams();

  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ error: false, label: "" });

  const options = [
    { action: t("Approve") },
    { action: t("Reject") }
  ];

  const flowState = location.state || {};
  const { edits = {} } = flowState;
  const activeKno = kno;

  const { aadhaarData = {}, addressDetails: editedAddress = {}, propertyDetails: editedProperty = {}, meterDetails: editedMeter = {} } = edits;

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const workflowMutation = Digit.Hooks.ekyc.useEkycWorkflow(tenantId);
  const updateMutation = Digit.Hooks.ekyc.useEkycUpdate(tenantId);

  const { data: searchData, isLoading: isSearchLoading } = Digit.Hooks.ekyc.useEkycSearchReview({ kno: activeKno, fetchType: "REVIEW" }, tenantId, {
    enabled: !!activeKno,
  });

  // ── Data Consolidation ──────────────────────────────────────────────────
  const { newData: apiNewData, oldData: apiOldData } = extractReviewData(searchData, flowState);

  const prepareConsolidatedData = (data) => {
    if (!data) return null;
    const apiConn = data?.connectionDetails || data || {};
    const apiAddr = data?.addressDetails || data || {};
    const apiProp = data?.propertyInfo || data || {};
    const apiMeter = data?.meterDetails || data || {};

    return {
      connection: {
        consumerName:
          apiConn?.consumerName || (apiConn?.firstName ? [apiConn.firstName, apiConn.middleName, apiConn.lastName].filter(Boolean).join(" ") : null),
        address: apiConn?.address || apiConn?.addressRaw,
        connectionType: apiConn?.connectionType || apiConn?.connectionCategory,
        meterNumber: apiConn?.meterNumber || apiConn?.meterNo,
        phoneNumber: apiConn?.phoneNumber || apiConn?.mobileNo || apiConn?.mobileNumber,
        email: apiConn?.email,
        statusflag: apiConn?.statusflag || apiConn?.statusFlag,
        ekycStatus: apiConn?.ekycStatus,
        knumber: apiConn?.knumber || apiConn?.kno,
      },
      address: {
        fullAddress: apiAddr?.fullAddress || apiAddr?.addressRaw,
        flatHouseNumber: apiAddr?.flatHouseNumber || apiAddr?.flatNo,
        buildingTower: apiAddr?.buildingTower || apiAddr?.building,
        landmark: apiAddr?.landmark,
        pinCode: apiAddr?.pinCode || apiAddr?.pincode,
        ward: apiAddr?.ward || apiAddr?.locality,
        assembly: apiAddr?.assembly,
        gpsValid: apiAddr?.gpsValid,
        latitude: apiAddr?.latitude,
        longitude: apiAddr?.longitude,
        mobileNo: apiAddr?.mobileNo || apiAddr?.mobileNumber,
        whatsappNo: apiAddr?.whatsappNo,
        email: apiAddr?.email,
        noOfPerson: apiAddr?.noOfPerson || apiAddr?.noOfPersons,
        knumber: apiAddr?.knumber || apiAddr?.kno,
        doorPhotoFilestoreId: apiAddr?.doorPhotoFilestoreId,
      },
      property: {
        kno: apiProp?.kno,
        pidNumber: apiProp?.pidNumber,
        typeOfConnection: apiProp?.typeOfConnection,
        connectionCategory: apiProp?.connectionCategory,
        userType: apiProp?.userType,
        numberOfFloors: apiProp?.numberOfFloors || apiProp?.noOfFloor,
        tenantName: apiProp?.tenantName,
        tenantMobile: apiProp?.tenantMobile,
        ekycStatus: apiProp?.ekycStatus,
        propertyDocumentFileStoreId: apiProp?.propertyDocumentFileStoreId,
        buildingImageFileStoreId: apiProp?.buildingImageFileStoreId,
      },
      meter: {
        kno: apiMeter?.kno,
        metered: apiMeter?.meterStatus === "METERED" || apiMeter?.metered,
        meterNumber: apiMeter?.meterNumber || apiMeter?.meterNo,
        meterMake: apiMeter?.meterMake,
        meterLocationAddress: apiMeter?.meterLocationAddress,
        meterLatitude: apiMeter?.meterLatitude,
        meterLongitude: apiMeter?.meterLongitude,
        workingStatus: apiMeter?.workingStatus,
        lastBillRaised: apiMeter?.lastBillRaised,
        systemMeterId: apiMeter?.systemMeterId,
        meterPhotoFileStoreId: apiMeter?.meterPhotoFileStoreId,
      },
    };
  };

  const newDataRaw = prepareConsolidatedData(apiNewData);
  const oldDataRaw = prepareConsolidatedData(apiOldData);

  // Apply edits to newData if present
  const connectionData = {
    ...newDataRaw?.connection,
    consumerName: aadhaarData?.name || newDataRaw?.connection?.consumerName,
    phoneNumber: aadhaarData?.mobileNumber || newDataRaw?.connection?.phoneNumber,
    knumber: newDataRaw?.connection?.knumber || activeKno,
  };

  const addressData = {
    ...newDataRaw?.address,
    fullAddress: editedAddress?.fullAddress || newDataRaw?.address?.fullAddress,
    flatHouseNumber: editedAddress?.flatHouseNumber || editedAddress?.flatNo || newDataRaw?.address?.flatHouseNumber,
    buildingTower: editedAddress?.buildingTower || editedAddress?.building || newDataRaw?.address?.buildingTower,
    landmark: editedAddress?.landmark || newDataRaw?.address?.landmark,
    pinCode: editedAddress?.pinCode || editedAddress?.pincode || newDataRaw?.address?.pinCode,
    ward: editedAddress?.ward || newDataRaw?.address?.ward,
    assembly: editedAddress?.assembly || newDataRaw?.address?.assembly,
    gpsValid: editedAddress?.gpsValid !== undefined ? editedAddress.gpsValid : newDataRaw?.address?.gpsValid,
    latitude: editedAddress?.latitude || newDataRaw?.address?.latitude,
    longitude: editedAddress?.longitude || newDataRaw?.address?.longitude,
    mobileNo: editedAddress?.mobileNo || aadhaarData?.mobileNumber || newDataRaw?.address?.mobileNo,
    whatsappNo: editedAddress?.whatsappNo || aadhaarData?.whatsappNumber || newDataRaw?.address?.whatsappNo,
    email: editedAddress?.email || newDataRaw?.address?.email,
    noOfPerson: editedAddress?.noOfPerson || aadhaarData?.noOfPersons || newDataRaw?.address?.noOfPerson,
    knumber: editedAddress?.knumber || newDataRaw?.address?.knumber || activeKno,
    doorPhotoFilestoreId: editedAddress?.doorPhotoFileStoreId || newDataRaw?.address?.doorPhotoFilestoreId,
  };

  const propertyData = {
    ...newDataRaw?.property,
    kno: newDataRaw?.property?.kno || activeKno,
    pidNumber: editedProperty?.pidNumber || newDataRaw?.property?.pidNumber,
    typeOfConnection: editedProperty?.connectionTypeData?.label || newDataRaw?.property?.typeOfConnection,
    connectionCategory: editedProperty?.connectionCategoryData?.label || newDataRaw?.property?.connectionCategory,
    userType: editedProperty?.userTypeData?.label || newDataRaw?.property?.userType,
    numberOfFloors: editedProperty?.noOfFloorsData?.label || newDataRaw?.property?.numberOfFloors,
    propertyDocumentFileStoreId: editedProperty?.propertyDocumentFileStoreId || newDataRaw?.property?.propertyDocumentFileStoreId,
  };

  const meterData = {
    ...newDataRaw?.meter,
    kno: editedMeter?.kno || newDataRaw?.meter?.kno || activeKno,
    metered: editedMeter?.meterStatusData?.value === "Metered" || newDataRaw?.meter?.metered,
    meterNumber: newDataRaw?.meter?.meterNumber,
    meterMake: editedMeter?.meterMake || newDataRaw?.meter?.meterMake,
    meterLocationAddress: editedMeter?.meterLocation || newDataRaw?.meter?.meterLocationAddress,
    workingStatus: editedMeter?.workingStatusData?.value === "Working" || newDataRaw?.meter?.workingStatus,
    lastBillRaised: editedMeter?.lastBillRaisedData?.value === "Yes" || newDataRaw?.meter?.lastBillRaised,
    meterPhotoFileStoreId: editedMeter?.meterPhotoFileStoreId || newDataRaw?.meter?.meterPhotoFileStoreId,
  };

  // ── Section Fields Configuration ─────────────────────────────────────
  const connectionFields = [
    { label: "EKYC_K_NUMBER", key: "knumber" },
    { label: "EKYC_CONSUMER_NAME", key: "consumerName" },
    { label: "EKYC_ADDRESS", key: "address" },
    { label: "EKYC_CONNECTION_TYPE", key: "connectionType" },
    { label: "EKYC_METER_NO", key: "meterNumber" },
    { label: "EKYC_MOBILE_NO", key: "phoneNumber" },
    { label: "EKYC_EMAIL", key: "email" },
    { label: "EKYC_STATUS_FLAG", key: "statusflag" },
    { label: "EKYC_STATUS", key: "ekycStatus" },
  ];

  const addressFields = [
    { label: "EKYC_FULL_ADDRESS", key: "fullAddress" },
    { label: "EKYC_FLAT_HOUSE_NO", key: "flatHouseNumber" },
    { label: "EKYC_BUILDING_TOWER", key: "buildingTower" },
    { label: "EKYC_LANDMARK", key: "landmark" },
    { label: "EKYC_PINCODE", key: "pinCode" },
    { label: "EKYC_LOCALITY", key: "ward" },
    { label: "EKYC_ASSEMBLY", key: "assembly" },
    { label: "EKYC_GPS_VALID", key: "gpsValid", isBool: true },
    { label: "EKYC_LATITUDE", key: "latitude" },
    { label: "EKYC_LONGITUDE", key: "longitude" },
    { label: "EKYC_MOBILE_NO", key: "mobileNo" },
    { label: "EKYC_WHATSAPP_NO", key: "whatsappNo" },
    { label: "EKYC_EMAIL", key: "email" },
    { label: "EKYC_NO_OF_PERSONS", key: "noOfPerson" },
    { label: "EKYC_K_NUMBER", key: "knumber" },
  ];

  const propertyFields = [
    { label: "EKYC_CONNECTION_CATEGORY", key: "connectionCategory" },
    { label: "EKYC_PID_NUMBER", key: "pidNumber" },
    { label: "EKYC_TYPE_OF_CONNECTION", key: "typeOfConnection" },
    { label: "EKYC_USER_TYPE", key: "userType" },
    { label: "EKYC_FLOOR_COUNT", key: "numberOfFloors" },
    { label: "EKYC_TENANT_NAME", key: "tenantName" },
    { label: "EKYC_TENANT_MOBILE", key: "tenantMobile" },
    { label: "EKYC_STATUS", key: "ekycStatus" },
  ];

  const meterFields = [
    { label: "EKYC_METERED", key: "metered", isBool: true },
    { label: "EKYC_METER_NO", key: "meterNumber" },
    { label: "EKYC_METER_MAKE", key: "meterMake" },
    { label: "EKYC_METER_LOCATION_ADDRESS", key: "meterLocationAddress" },
    { label: "EKYC_METER_LATITUDE", key: "meterLatitude" },
    { label: "EKYC_METER_LONGITUDE", key: "meterLongitude" },
    { label: "EKYC_WORKING_STATUS", key: "workingStatus", isBool: true },
    { label: "EKYC_LAST_BILL_RAISED", key: "lastBillRaised", isBool: true },
    { label: "EKYC_SYSTEM_METER_ID", key: "systemMeterId" },
  ];

  const handleDeclaration = () => setAgree(!agree);

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
      reviewedBy: Digit.UserService.getUser()?.info?.userName,
      role: "ZRO",
    };
    try {
      const result = await workflowMutation.mutateAsync(payload);
      if (result) {
        history.push("/digit-ui/employee/ekyc/response", { success: true, result });
      }
    } catch (err) {
      console.error("Reject Error:", err);
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
      reviewedBy: Digit.UserService.getUser()?.info?.userName,
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
      setToastData({
        error: true,
        label: err?.message || err?.response?.data?.message || "Approve Error",
      });
      setShowToast(true);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        kno: activeKno,
        tenantId: tenantId,
        newData: {
          connectionDetails: connectionData,
          addressDetails: addressData,
          propertyInfo: propertyData,
          meterDetails: meterData,
        },
      };

      const result = await updateMutation.mutateAsync(payload);
      if (result) {
        history.push("/digit-ui/employee/ekyc/response", { success: true, result });
      }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDocument = (fileStoreId) => {
    if (!fileStoreId) return;
    const documentUrl = `https://dev-djb.nitcon.in/filestore/v1/files/id?tenantId=dl.djb&fileStoreId=${fileStoreId}`;
    setPreviewUrl(documentUrl);
    setShowPreview(true);
  };

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    if (option.action === t("Approve")) {
      handleApprove();
    } else if (option.action === t("Reject")) {
      handleReject();
    }
  };

  if (isSearchLoading || isSubmitting) return <Loader />;

  const baseUrl = "/digit-ui/employee/ekyc";

  return (
    <Fragment>
      <Card className="overflow-y-scroll">
        {/* ── 1. Connection Details ────────────────────────────────────── */}
        <ReviewSection
          title={t("EKYC_CONNECTION_DETAILS")}
          fields={connectionFields}
          newData={connectionData}
          oldData={oldDataRaw?.connection}
          t={t}
          jumpTo={`${baseUrl}/consumer-details?kno=${kno}`}
          state={{ ...flowState, kNumber: kno, kno, reviewData: searchData, edits }}
        />

        {/* ── 2. Address Details ──────────────────────────────────────── */}
        <ReviewSection
          title={t("EKYC_ADDRESS_DETAILS")}
          fields={addressFields}
          newData={addressData}
          oldData={oldDataRaw?.address}
          t={t}
          jumpTo={`${baseUrl}/address-details?kno=${kno}`}
          state={{ ...flowState, kNumber: kno, kno, reviewData: searchData, edits }}
        />

        {/* ── 3. Property Info ────────────────────────────────────────── */}
        <ReviewSection
          title={t("EKYC_PROPERTY_INFO")}
          fields={propertyFields}
          newData={propertyData}
          oldData={oldDataRaw?.property}
          t={t}
          jumpTo={`${baseUrl}/property-info?kno=${kno}`}
          state={{ ...flowState, kNumber: kno, kno, reviewData: searchData, edits }}
        />

        {/* ── 4. Meter Details ────────────────────────────────────────── */}
        <ReviewSection
          title={t("EKYC_METER_DETAILS")}
          fields={meterFields}
          newData={meterData}
          oldData={oldDataRaw?.meter}
          t={t}
          jumpTo={`${baseUrl}/meter-details?kno=${kno}`}
          state={{ ...flowState, kNumber: kno, kno, reviewData: searchData, edits }}
        />

        {/* ── 5. Documents ────────────────────────────────────────────── */}
        <div style={{ marginTop: "40px" }}>
          <CardSubHeader style={{ marginBottom: "20px" }}>{t("EKYC_DOCUMENTS")}</CardSubHeader>
          <StatusTable style={{ maxWidth: "600px" }}>
            <Row
              label={t("EKYC_DOOR_PHOTO")}
              text={addressData.doorPhotoFilestoreId ? t("EKYC_PHOTO_AVAILABLE") : t("CS_NA")}
              actionButton={
                addressData.doorPhotoFilestoreId && (
                  <div onClick={() => handleViewDocument(addressData.doorPhotoFilestoreId)}>
                    <GenericFileIcon style={{ cursor: "pointer", fill: "#F47738" }} />
                  </div>
                )
              }
            />
            <Row
              label={t("EKYC_METER_PHOTO")}
              text={meterData.meterPhotoFileStoreId ? t("EKYC_PHOTO_AVAILABLE") : t("CS_NA")}
              actionButton={
                meterData.meterPhotoFileStoreId && (
                  <div onClick={() => handleViewDocument(meterData.meterPhotoFileStoreId)}>
                    <GenericFileIcon style={{ cursor: "pointer", fill: "#F47738" }} />
                  </div>
                )
              }
            />
            <Row
              label={t("EKYC_BUILDING_IMAGE")}
              text={propertyData.buildingImageFileStoreId ? t("EKYC_PHOTO_AVAILABLE") : t("CS_NA")}
              actionButton={
                propertyData.buildingImageFileStoreId && (
                  <div onClick={() => handleViewDocument(propertyData.buildingImageFileStoreId)}>
                    <GenericFileIcon style={{ cursor: "pointer", fill: "#F47738" }} />
                  </div>
                )
              }
            />
            <Row
              label={t("EKYC_PROPERTY_DOCUMENTS")}
              text={propertyData.propertyDocumentFileStoreId ? t("EKYC_DOCS_AVAILABLE") : t("CS_NA")}
              actionButton={
                propertyData.propertyDocumentFileStoreId && (
                  <div onClick={() => handleViewDocument(propertyData.propertyDocumentFileStoreId)}>
                    <GenericFileIcon style={{ cursor: "pointer", fill: "#F47738" }} />
                  </div>
                )
              }
            />
          </StatusTable>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "1px solid #EAECF0" }}>
          <CheckBox
            id="agreeDeclaration"
            name="agreeDeclaration"
            label={<span style={{ fontSize: "16px", color: "#344054" }}>{t("EKYC_FINAL_DECLARATION")}</span>}
            onChange={handleDeclaration}
            checked={agree}
          />
        </div>

        {/* <ActionBar>
          <SubmitBar label={t("EKYC_REJECT")} onSubmit={handleReject} disabled={!agree} />
          <SubmitBar label={t("EKYC_APPROVE")} onSubmit={handleApprove} disabled={!agree} />
          <SubmitBar label={t("EKYC_SUBMIT_APPLICATION")} onSubmit={handleFinalSubmit} disabled={!agree} />
        </ActionBar> */}
        <ActionBar>
          <SubmitBar
            label={t("TAKE_ACTION_FOR_APPROVE_REJECT")}
            onSubmit={() => setShowOptions((prev) => !prev)}
            disabled={!agree}
          />
          {showOptions && (
            <Menu
              options={options}
              optionKey={"action"}
              t={t}
              onSelect={handleMenuSelect}
              style={{
                color: "#FFFFFF",
                fontSize: "18px",
              }}
            />
          )}
        </ActionBar>
      </Card>

      {/* ── Document Preview Modal ────────────────────────────────────── */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "70vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              onClick={() => setShowPreview(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "20px",
                color: "#333",
                background: "#eee",
                width: "30px",
                height: "30px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "50%",
              }}
            >
              ×
            </div>
            <img
              src={previewUrl}
              alt="Document Preview"
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div style={{ display: "none", padding: "40px", textAlign: "center" }}>
              <p>{t("EKYC_DOCUMENT_PREVIEW_NOT_AVAILABLE")}</p>
              <LinkButton label={t("EKYC_OPEN_IN_NEW_TAB")} onClick={() => window.open(previewUrl, "_blank")} />
            </div>
          </div>
        </div>
      )}
      {showToast && (
        <Toast
          error={toastData.error}
          label={toastData.label}
          onClose={() => setShowToast(false)}
        />
      )}
    </Fragment>
  );
};

export default Review;
