import {
  Card,
  CardHeader,
  CardSubHeader,
  Row,
  StatusTable,
  SubmitBar,
  LinkButton,
  EditIcon,
  GenericFileIcon,
  Modal,
  ActionBar,
} from "@djb25/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { checkForNA } from "../../../utils";

const ActionButton = ({ onClick }) => {
  return (
    <LinkButton
      label={<EditIcon style={{ marginTop: "-10px", float: "right", position: "relative", bottom: "10px" }} />}
      className="check-page-link-button"
      onClick={onClick}
    />
  );
};

const openFilePDF = (fileId) => {
  Digit.UploadServices.Filefetch([fileId], Digit.ULBService.getStateId())
    .then((res) => {
      const concatenatedUrls = res?.data?.fileStoreIds?.[0]?.url;
      if (concatenatedUrls) {
        const urlArray = concatenatedUrls.split(",");
        const fileUrl = urlArray[0];
        if (fileUrl) {
          window.open(fileUrl, "_blank");
        }
      }
    })
    .catch((error) => console.error("Error fetching file:", error));
};

const CheckPage = ({ data, onSubmit, onEdit }) => {
  const { t } = useTranslation();
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const handleViewDocument = async (fileStoreId) => {
    if (fileStoreId) {
      if (typeof fileStoreId === "object" && fileStoreId.type) {
        const fileURL = URL.createObjectURL(fileStoreId);
        setDocFileUrl(fileURL);
        if (fileStoreId.type.includes("pdf")) {
          setDocFileType("pdf");
        } else {
          setDocFileType("image");
        }
        setShowDocModal(true);
      } else {
        try {
          const res = await Digit.UploadServices.FileFetchbyid(fileStoreId, Digit.ULBService.getStateId());
          if (res?.data) {
            const blob =
              res.data instanceof Blob
                ? res.data
                : new Blob([res.data], { type: res.headers["content-type"] || res.headers["Content-Type"] || "image/jpeg" });
            const fileURL = URL.createObjectURL(blob);
            setDocFileUrl(fileURL);
            const contentType = res.headers["content-type"] || res.headers["Content-Type"] || "";
            if (contentType.toLowerCase().includes("pdf")) {
              setDocFileType("pdf");
            } else {
              setDocFileType("image");
            }
            setShowDocModal(true);
          }
        } catch (err) {
          console.error("Failed to fetch file URL via FileFetchbyid", err);
        }
      }
    }
  };

  const cpt = data?.cpt?.details || {};
  let propertyAddress = data?.propertyAddress || {};
  if (Object.keys(propertyAddress).length === 0) {
    propertyAddress = cpt?.address || {};
  }
  const additionalDetails = cpt?.additionalDetails || {};

  let connectionDetails = data?.ConnectionDetails?.[0] || data?.ConnectionDetails || data?.connectionDetails?.[0] || data?.connectionDetails || {};
  if (Array.isArray(connectionDetails)) {
    connectionDetails = connectionDetails[0] || {};
  }
  let holderDetails =
    data?.ConnectionHolderDetails?.[0] || data?.ConnectionHolderDetails || data?.connectionHolderDetails?.[0] || data?.connectionHolderDetails || {};
  if (Array.isArray(holderDetails)) {
    holderDetails = holderDetails[0] || {};
  }
  const useDetails = data?.useDetails?.useDetails || data?.useDetails || {};
  const bankDetails = data?.bankDetails?.bankDetails || data?.bankDetails || {};
  const documents = data?.DocumentsRequired?.documents || data?.documents?.documents || [];
  const declaration = data?.declarationData || data?.declaration || {};
  const djbEmployee = data?.djbEmployee?.djbEmployee || data?.djbEmployee || {};

  return (
    <React.Fragment>
      <Card className="overflow-y-scroll">
        <CardHeader>{t("WS_COMMON_SUMMARY")}</CardHeader>
        <div>
          <CardSubHeader>{t("WS_COMMON_PROPERTY_DETAILS")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row label={t("WS_PROPERTY_ID_LABEL")} text={`${t(checkForNA(cpt?.propertyId))}`} actionButton={<ActionButton onClick={onEdit} />} />
          </StatusTable>

          <CardSubHeader>{t("WS_COMMON_CONNECTION_DETAIL")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row
              label={t("WS_SERVICE_TYPE")}
              text={`${t(
                checkForNA(connectionDetails?.serviceType?.i18nKey || connectionDetails?.serviceType?.code || connectionDetails?.serviceType)
              )}`}
              actionButton={<ActionButton onClick={onEdit} />}
            />
            <Row
              label={t("WS_CONNECTION_TYPE")}
              text={`${t(
                checkForNA(connectionDetails?.connectionType?.i18nKey || connectionDetails?.connectionType?.code || connectionDetails?.connectionType)
              )}`}
            />
            <Row
              label={t("WS_WATER_DEMAND_TYPE")}
              text={`${t(
                checkForNA(
                  connectionDetails?.waterDemandType?.i18nKey || connectionDetails?.waterDemandType?.code || connectionDetails?.waterDemandType
                )
              )}`}
            />
            <Row
              label={t("WS_APPLICANT_TYPE")}
              text={`${t(
                checkForNA(connectionDetails?.applicantType?.i18nKey || connectionDetails?.applicantType?.code || connectionDetails?.applicantType)
              )}`}
            />
            <Row
              label={t("WS_SERVICE_TYPE")}
              text={`${t(
                checkForNA(connectionDetails?.domesticType?.i18nKey || connectionDetails?.domesticType?.code || connectionDetails?.domesticType)
              )}`}
            />
            {connectionDetails?.domesticType?.code === "ORGANIZATION" && (
              <React.Fragment>
                <Row
                  label={t("WS_DEPARTMENT_TYPE")}
                  text={`${t(
                    checkForNA(
                      connectionDetails?.departmentType?.i18nKey || connectionDetails?.departmentType?.code || connectionDetails?.departmentType
                    )
                  )}`}
                />
                <Row label={t("WS_ORGANIZATION_DEPARTMENT_NAME")} text={`${t(checkForNA(connectionDetails?.institutionName))}`} />
                <Row label={t("WS_NATURE_OF_WORK")} text={`${t(checkForNA(connectionDetails?.natureOfWork))}`} />
                {connectionDetails?.orgDeptDocument && (
                  <Row
                    label={t("WS_ORG_DEPT_DOCUMENT")}
                    text={
                      <span
                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                        onClick={() => openFilePDF(connectionDetails?.orgDeptDocument)}
                      >
                        <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                      </span>
                    }
                  />
                )}
              </React.Fragment>
            )}
          </StatusTable>

          <CardSubHeader>{t("WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row label={t("WS_OWN_DETAIL_NAME")} text={`${t(checkForNA(holderDetails?.name))}`} actionButton={<ActionButton onClick={onEdit} />} />
            <Row label={t("WS_OWN_DETAIL_MIDDLE_NAME")} text={`${t(checkForNA(holderDetails?.middleName))}`} />
            <Row label={t("WS_OWN_DETAIL_LAST_NAME")} text={`${t(checkForNA(holderDetails?.lastName))}`} />
            <Row
              label={t("WS_CONN_HOLDER_OWN_DETAIL_GENDER_LABEL")}
              text={`${t(checkForNA(holderDetails?.gender?.i18nKey || holderDetails?.gender?.code || holderDetails?.gender))}`}
            />
            <Row label={t("WS_OWN_DETAIL_GUARDIAN_LABEL")} text={`${t(checkForNA(holderDetails?.guardian))}`} />
            <Row
              label={t("WS_CONN_HOLDER_OWN_DETAIL_RELATION_LABEL")}
              text={`${t(checkForNA(holderDetails?.relationship?.i18nKey || holderDetails?.relationship?.code || holderDetails?.relationship))}`}
            />
            <Row label={t("CORE_COMMON_MOBILE_NUMBER")} text={`${t(checkForNA(holderDetails?.mobileNumber))}`} />
            <Row label={t("CORE_COMMON_WHATSAPP_MOBILE_NUMBER")} text={`${t(checkForNA(holderDetails?.watsAppMobileNumber))}`} />
            <Row label={t("CORE_COMMON_EMAIL_ID")} text={`${t(checkForNA(holderDetails?.emailId))}`} />
          </StatusTable>

          <CardSubHeader>{t("WS_PROPERTY_LOCATION_DETAILS")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row
              label={t("WS_ZRO_LOCATION")}
              text={`${t(checkForNA(propertyAddress?.zro?.name || propertyAddress?.zro || propertyAddress?.zroLocation || additionalDetails?.zroLocation || propertyAddress?.additionalDetails?.zroLocation))}`}
              actionButton={<ActionButton onClick={onEdit} />}
            />
            <Row
              label={t("COMMON_ADDRESS_TYPE")}
              text={`${t(checkForNA(propertyAddress?.addressType?.i18nKey || propertyAddress?.addressType?.code || propertyAddress?.addressType))}`}
            />
            <Row label={t("CITY")} text={`${t(checkForNA(propertyAddress?.city?.name || propertyAddress?.city?.code || propertyAddress?.city))}`} />
            <Row label={t("PINCODE")} text={`${t(checkForNA(propertyAddress?.pincode || propertyAddress?.pinCode))}`} />
            <Row
              label={t("LOCALITY")}
              text={`${t(checkForNA(propertyAddress?.locality?.name || propertyAddress?.locality?.code || propertyAddress?.locality))}`}
            />
            <Row
              label={t("SubLocality")}
              text={`${t(checkForNA(propertyAddress?.subLocality?.name || propertyAddress?.subLocality?.code || propertyAddress?.subLocality))}`}
            />
            <Row label={t("STREET_NAME")} text={`${t(checkForNA(propertyAddress?.streetName || propertyAddress?.street))}`} />
            <Row label={t("ADDRESS_LINE1")} text={`${t(checkForNA(propertyAddress?.addressLine1 || propertyAddress?.street))}`} />
            <Row label={t("ADDRESS_LINE2")} text={`${t(checkForNA(propertyAddress?.addressLine2))}`} />
            <Row label={t("HOUSE_NO")} text={`${t(checkForNA(propertyAddress?.houseNo || propertyAddress?.doorNo))}`} />
            <Row label={t("LATITUDE")} text={`${t(checkForNA(propertyAddress?.latitude))}`} />
            <Row label={t("LONGITUDE")} text={`${t(checkForNA(propertyAddress?.longitude))}`} />
            <Row
              label={t("ASSEMBLY")}
              text={`${t(checkForNA(propertyAddress?.assembly?.name || propertyAddress?.assembly?.code || propertyAddress?.assembly || additionalDetails?.assembly))}`}
            />

            <Row label={t("WARD")} text={`${t(checkForNA(propertyAddress?.block?.name || propertyAddress?.block?.code || propertyAddress?.block || propertyAddress?.ward?.name || propertyAddress?.ward?.code || propertyAddress?.ward || additionalDetails?.ward))}`} />
            <Row label={t("ZONE")} text={`${t(checkForNA(propertyAddress?.zone?.name || propertyAddress?.zone?.code || propertyAddress?.zone || additionalDetails?.zone))}`} />

            <Row
              label={t("ACTUAL ASSEMBLY")}
              text={`${t(checkForNA(propertyAddress?.actualAssembly || additionalDetails?.actualAssembly))}`}
            />
            <Row label={t("ACTUAL WARD")} text={`${t(checkForNA(propertyAddress?.actualWard || additionalDetails?.actualWard))}`} />
            <Row label={t("ACTUAL ZONE")} text={`${t(checkForNA(propertyAddress?.actualZone || additionalDetails?.actualZone))}`} />
            <Row label={t("LANDMARK")} text={`${t(checkForNA(propertyAddress?.landmark))}`} />
          </StatusTable>

          <CardSubHeader>{t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row
              label={t("WS_CATEGORY_TYPE")}
              text={`${t(checkForNA(useDetails?.categoryType?.i18nKey || useDetails?.categoryType?.code || useDetails?.categoryType))}`}
              actionButton={<ActionButton onClick={onEdit} />}
            />
            <Row
              label={t("WS_PROPERTY_CATEGORY")}
              text={`${t(checkForNA(useDetails?.propertyCategory?.i18nKey || useDetails?.propertyCategory?.code || useDetails?.propertyCategory))}`}
            />
            <Row
              label={t("WS_PROPERTY_TYPE")}
              text={`${t(checkForNA(useDetails?.propertyType?.i18nKey || useDetails?.propertyType?.code || useDetails?.propertyType))}`}
            />
            <Row
              label={t("WS_WATER_CONNECTION_USAGE_TYPE")}
              text={`${t(
                checkForNA(
                  useDetails?.WaterConnectionUsageType?.i18nKey || useDetails?.WaterConnectionUsageType?.code || useDetails?.WaterConnectionUsageType || useDetails?.waterConnectionUsageType?.i18nKey || useDetails?.waterConnectionUsageType?.code || useDetails?.waterConnectionUsageType
                )
              )}`}
            />
            <Row
              label={t("WS_NUMBER_OF_FLOORS")}
              text={`${t(checkForNA(useDetails?.noOfFloors?.i18nKey || useDetails?.noOfFloors?.code || useDetails?.noOfFloors))}`}
            />
            <Row label={t("WS_PLOT_AREA")} text={`${t(checkForNA(useDetails?.plotArea))}`} />
            <Row label={t("WS_BUILT_UP_AREA")} text={`${t(checkForNA(useDetails?.builtUpArea))}`} />
            <Row
              label={t("WS_SELECT_YEAR_OF_CONSTRUCTION")}
              text={`${t(checkForNA(useDetails?.SelectYearofConstruction?.i18nKey || useDetails?.SelectYearofConstruction?.value || useDetails?.SelectYearofConstruction?.code || useDetails?.SelectYearofConstruction || useDetails?.constructionYear?.i18nKey || useDetails?.constructionYear?.code || useDetails?.constructionYear))}`}
            />
            <Row label={t("WS_NUMBER_OF_DWELLING_UNITS")} text={`${t(checkForNA(useDetails?.NumberofDwellingUnits || useDetails?.noOfDwellingUnits))}`} />
          </StatusTable>

          <CardSubHeader>{t("WS_DJB_EMPLOYEE")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row
              label={t("WS_DJB_EMPLOYEE")}
              text={`${djbEmployee?.isDjbEmployee ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}`}
              actionButton={<ActionButton onClick={onEdit} />}
            />
            {djbEmployee?.isDjbEmployee && (
              <React.Fragment>
                <Row label={t("WS_EMPLOYEE_ID")} text={`${t(checkForNA(djbEmployee?.employeeId))}`} />
                <Row label={t("WS_DATE_OF_RETIREMENT")} text={`${t(checkForNA(djbEmployee?.dor))}`} />
                <Row label={t("WS_EMPLOYEE_DESIGNATION")} text={`${t(checkForNA(djbEmployee?.designation))}`} />
              </React.Fragment>
            )}
          </StatusTable>

          <CardSubHeader>{t("WS_BANK_DETAILS")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row label={t("WS_BANK_NAME")} text={`${t(checkForNA(bankDetails?.bankName))}`} actionButton={<ActionButton onClick={onEdit} />} />
            <Row label={t("WS_BRANCH_NAME")} text={`${t(checkForNA(bankDetails?.bankBranchName || bankDetails?.branchName))}`} />
            <Row label={t("WS_IFSC_CODE")} text={`${t(checkForNA(bankDetails?.ifscCode))}`} />
            <Row label={t("WS_ACCOUNT_NUMBER")} text={`${t(checkForNA(bankDetails?.bankAccountNumber || bankDetails?.accountNumber))}`} />
          </StatusTable>

          <CardSubHeader>{t("WS_DOCUMENTS")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            {documents?.map((doc, index) => (
              <React.Fragment key={index}>
                <Row
                  label={t(`${doc?.documentType?.replaceAll(".", "_")}`)}
                  text={checkForNA(doc?.documentUid)}
                  actionButton={index === 0 ? <ActionButton onClick={onEdit} /> : null}
                />
                <Row
                  // label={t("WS_VIEW_DOCUMENT")}
                  text={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                      onClick={() => openFilePDF(doc?.fileStoreId || doc?.documentUid)}
                    >
                      <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                    </span>
                  }
                />
              </React.Fragment>
            ))}
          </StatusTable>

          {/* <CardSubHeader>{t("WS_DECLARATION")}</CardSubHeader>
          <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
            <Row
              label={t("WS_SUBMITTED_BY")}
              text={`${t(checkForNA(declaration?.submittedBy?.name || declaration?.submittedBy?.code || declaration?.submittedBy))}`}
              actionButton={<ActionButton onClick={onEdit} />}
            />
            {(declaration?.signatureFileStoreId || declaration?.signatureFile) && (
              <React.Fragment>
                <Row label={t("WS_UPLOAD_SIGNATURE_FILE")} text={checkForNA(declaration?.signatureFile?.name || "1")} />
                <Row
                  text={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                      onClick={() => handleViewDocument(declaration?.signatureFileStoreId || declaration?.signatureFile)}
                    >
                      <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                    </span>
                  }
                />
              </React.Fragment>
            )}
            <Row label={t("WS_AGREE_DECLARATION")} text={declaration?.agree ? t("CS_COMMON_YES") : t("CS_COMMON_NO")} />
          </StatusTable> */}
        </div>

        <ActionBar>
          <SubmitBar label={t("CS_COMMON_SUBMIT")} onSubmit={onSubmit} style={{ width: "150px" }} />
        </ActionBar>
      </Card>
      {showDocModal && (
        <Modal
          open={showDocModal}
          headerBarMain={t("WS_VIEW_DOCUMENT") || "View Document"}
          headerBarEnd={
            <div className="icon-bg-secondary" onClick={() => setShowDocModal(false)} style={{ cursor: "pointer", padding: "5px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </div>
          }
          center
          actionCancelOnSubmit={() => setShowDocModal(false)}
          actionCancelLabel={t("CS_COMMON_CLOSE") || "Close"}
          popupStyles={{ width: "80%", maxWidth: "800px" }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "300px" }}>
            {docFileType === "pdf" ? (
              <iframe src={docFileUrl} title="Document Preview" width="100%" height="500px" style={{ border: "none" }} />
            ) : (
              <img
                src={docFileUrl}
                alt="Document Preview"
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "4px" }}
              />
            )}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default CheckPage;
