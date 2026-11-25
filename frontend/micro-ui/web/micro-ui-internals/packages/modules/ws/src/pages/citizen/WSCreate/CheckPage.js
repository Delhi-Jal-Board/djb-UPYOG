import {
  Card,
  CardHeader,
  CardSubHeader,
  CardText,
  CitizenInfoLabel,
  LinkButton,
  Row,
  StatusTable,
  SubmitBar,
  EditIcon,
  Header,
  CardSectionHeader,
  GenericFileIcon,
} from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, Link } from "react-router-dom";
import { getFiles } from "../../../utils";
import Timeline from "../../../components/Timeline";
import WSDocument from "../../../pageComponents/WSDocument";

const maskDocNumber = (val) => {
  if (!val || val === "NA") return val || "";
  const str = String(val).trim();
  if (!str || str === "NA") return str;
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
};

const CheckPage = ({ onSubmit, value }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const match = useRouteMatch();
  let isMobile = window.Digit.Utils.browser.isMobile();
  const { ConnectionHolderDetails, plumberPreference, serviceName, waterConectionDetails, sewerageConnectionDetails, documents, cpt } = value;
  let routeLink = `/digit-ui/citizen/ws/create-application`;
  if (window.location.href.includes("/edit-application")) routeLink = `/digit-ui/citizen/ws/edit-application/${value?.tenantId}`;

  function routeTo(jumpTo) {
    location.href = jumpTo;
  }

  const connectionDetails = value?.ConnectionDetails?.[0] || value?.ConnectionDetails || {};
  const propertyAddress = value?.propertyLocationDetails || {};
  const useDetails = value?.waterConnection?.useDetails || {};
  const djbEmployee = value?.djbEmployee || {};
  const disability = value?.disability || value?.additionalDetails || {};
  const rainWaterHarvesting = value?.rainWaterHarvesting || value?.additionalDetails || {};
  const sewerTreatmentPlant = value?.sewerTreatmentPlant || value?.additionalDetails || {};
  const bankDetails =
    value?.bankDetails?.bankDetails ||
    value?.bankDetails ||
    value?.additionalDetails?.bankDetails ||
    value?.additionalDetails ||
    {};
  const additionalDetails = {};

  const baseAssembly =
    propertyAddress?.assembly?.name ||
    propertyAddress?.assembly?.code ||
    propertyAddress?.assembly ||
    cpt?.details?.address?.assembly ||
    additionalDetails?.assembly ||
    "";
  const baseWard =
    propertyAddress?.block?.name ||
    propertyAddress?.block?.code ||
    propertyAddress?.block ||
    propertyAddress?.ward?.name ||
    propertyAddress?.ward?.code ||
    propertyAddress?.ward ||
    cpt?.details?.address?.ward ||
    cpt?.details?.address?.block ||
    additionalDetails?.ward ||
    "";
  const baseZone =
    propertyAddress?.zone?.name ||
    propertyAddress?.zone?.code ||
    propertyAddress?.zone ||
    cpt?.details?.address?.zone ||
    additionalDetails?.zone ||
    "";

  const getValidActualValue = (actualVal, baseVal) => {
    if (!actualVal) return null;
    const str = String(typeof actualVal === "object" ? actualVal?.name || actualVal?.code || "" : actualVal).trim();
    const baseStr = String(typeof baseVal === "object" ? baseVal?.name || baseVal?.code || "" : baseVal).trim();
    if (!str || str === "NA" || str === "null" || str === "undefined") return null;
    if (baseStr && str.toUpperCase() === baseStr.toUpperCase()) return null;
    return str;
  };

  const validActualAssembly = getValidActualValue(
    propertyAddress?.actualAssembly,
    baseAssembly
  );
  const validActualWard = getValidActualValue(
    propertyAddress?.actualWard,
    baseWard
  );
  const validActualZone = getValidActualValue(
    propertyAddress?.actualZone,
    baseZone
  );

  const checkForNA = (val) => (val ? val : "CS_NA");
  const onEdit = () => {};
  const ActionButton = () => null;
  const openFilePDF = async (fileStoreId) => {
    if (fileStoreId) {
      getFiles([fileStoreId], value?.tenantId || Digit.ULBService.getStateId());
    }
  };

  let propAddArr = [];
  if (cpt && cpt?.details && Object.keys(cpt?.details).length > 0) {
    if (cpt?.details?.address?.doorNo) {
      propAddArr.push(cpt?.details?.address?.doorNo);
    }
    if (cpt?.details?.address?.street) {
      propAddArr.push(cpt?.details?.address?.street);
    }
    if (cpt?.details?.address?.landmark) {
      propAddArr.push(cpt?.details?.address?.landmark);
    }
    if (cpt?.details?.address?.locality?.code) {
      propAddArr.push(t(Digit.Utils.pt.getMohallaLocale(cpt?.details?.address?.locality?.code, cpt?.details?.tenantId)));
    }
    if (cpt?.details?.tenantId) {
      propAddArr.push(t(Digit.Utils.pt.getCityLocale(cpt?.details?.tenantId)));
    }
    if (cpt?.details?.address?.pincode) {
      propAddArr.push(cpt?.details?.address?.pincode);
    }
  }
  const reversedOwners = Array.isArray(cpt?.details?.owners) ? cpt?.details?.owners.slice().reverse() : [];

  const getDocumentSectionHeader = (docType) => {
    if (!docType) return "";
    const upper = docType.toUpperCase();
    if (upper.includes("SEWER") || upper.includes("STP")) {
      return t("WS_SEWER_TREATMENT_PLANT_CERTIFICATE") && t("WS_SEWER_TREATMENT_PLANT_CERTIFICATE") !== "WS_SEWER_TREATMENT_PLANT_CERTIFICATE"
        ? t("WS_SEWER_TREATMENT_PLANT_CERTIFICATE")
        : "Sewer Treatment Plant (STP) Certificate";
    }
    if (upper.includes("RAIN") || upper.includes("HARVEST")) {
      return t("WS_RAIN_WATER_HARVESTING_CERTIFICATE") && t("WS_RAIN_WATER_HARVESTING_CERTIFICATE") !== "WS_RAIN_WATER_HARVESTING_CERTIFICATE"
        ? t("WS_RAIN_WATER_HARVESTING_CERTIFICATE")
        : "Rain Water Harvesting Certificate";
    }
    return t(docType?.split(".").slice(0, 2).join("_"));
  };

  return (
    <React.Fragment>
      <Timeline currentStep={4} />
      <Header styles={{ fontSize: "32px" }}>{t("WS_COMMON_SUMMARY")}</Header>
      <Card style={{ paddingRight: "16px" }}>
        <CardHeader styles={{ fontSize: "28px" }}>{t(`WS_BASIC_DETAILS_HEADER`)}</CardHeader>
        <StatusTable>
          {/* <Row className="border-none" label={t("WS_PROPERTY_ID_LABEL")} text={cpt?.details?.propertyId} /> */}
          <Row className="border-none" label={t("WS_OWNERS_NAME_LABEL")} text={t(reversedOwners[0]?.name)} />
          <Row className="border-none" label={t("WS_COMMON_TABLE_COL_ADDRESS")} text={propAddArr.join(", ")} />
          <Row className="border-none" label={t("WS_CONNECTION_DETAILS_STATUS_LABEL")} text={t(cpt?.details?.status)} />
        </StatusTable>
        <div style={{ textAlign: "left" }}>
          <Link to={`/digit-ui/citizen/commonpt/view-property?propertyId=${cpt?.details?.propertyId}&tenantId=${cpt?.details?.tenantId}`}>
            <LinkButton style={{ textAlign: "left" }} label={t("PT_VIEW_PROPERTY")} />
          </Link>
        </div>
      </Card>
      <Card style={{ paddingRight: "16px" }}>
        <div style={{ position: "relative" }}>
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
            {(() => {
              const authRepName =
                value?.additionalDetails?.authorizedRepresentativeName ||
                connectionDetails?.authorizedRepresentativeName;
              const authRepDesig =
                value?.additionalDetails?.authorizedRepresentativeDesignation ||
                connectionDetails?.authorizedRepresentativeDesignation;
              const authRepMobile =
                value?.additionalDetails?.authorizedRepresentativeMobileNumber ||
                value?.additionalDetails?.authorizedMobileNumber ||
                connectionDetails?.authorizedRepresentativeMobileNumber;

              if (authRepName || authRepDesig || authRepMobile) {
                return (
                  <React.Fragment>
                    {authRepName && <Row label={t("Authorized Representative Name")} text={authRepName} />}
                    {authRepDesig && <Row label={t("Authorized Representative Designation")} text={authRepDesig} />}
                    {authRepMobile && <Row label={t("Authorized Representative Mobile Number")} text={authRepMobile} />}
                  </React.Fragment>
                );
              }
              return null;
            })()}
            <Row
              label={t("WS_Billing_Address_Type")}
              text={`${t(
                checkForNA(
                  connectionDetails?.addressType?.i18nKey ||
                    connectionDetails?.addressType?.name ||
                    (typeof connectionDetails?.addressType?.code === "string"
                      ? connectionDetails.addressType.code === "PERMANENT"
                        ? "Permanent"
                        : connectionDetails.addressType.code === "CORRESPONDENCE"
                        ? "Correspondence"
                        : connectionDetails.addressType.code
                      : null) ||
                    (typeof connectionDetails?.addressType === "string"
                      ? connectionDetails.addressType === "PERMANENT"
                        ? "Permanent"
                        : connectionDetails.addressType === "CORRESPONDENCE"
                        ? "Correspondence"
                        : connectionDetails.addressType
                      : null) ||
                    data?.additionalDetails?.addressType
                )
              )}`}
            />
            {(() => {
              const addrTypeStr =
                (typeof connectionDetails?.addressType === "string"
                  ? connectionDetails.addressType
                  : connectionDetails?.addressType?.code || connectionDetails?.addressType?.name) ||
                data?.additionalDetails?.addressType ||
                "";
              const compAddrStr =
                connectionDetails?.completeAddress ||
                data?.additionalDetails?.completeAddress ||
                "";
              if (
                compAddrStr &&
                compAddrStr !== addrTypeStr &&
                ["PERMANENT", "CORRESPONDENCE", "Permanent", "Correspondence"].includes(addrTypeStr)
              ) {
                return (
                  <Row
                    label={t("Complete Address")}
                    text={`${checkForNA(compAddrStr)}`}
                  />
                );
              }
              return null;
            })()}
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

          <CardHeader styles={{ fontSize: "28px" }}>{t("WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER")}</CardHeader>
        </div>
        <StatusTable>
          <Row
            className="border-none"
            textStyle={isMobile ? { marginRight: "-5px" } : {}}
            label={t("WS_OWN_MOBILE_NO")}
            text={ConnectionHolderDetails?.[0]?.mobileNumber}
          />
          <Row className="border-none" label={t("WS_OWN_DETAIL_NAME")} text={ConnectionHolderDetails?.[0]?.name} />
          <Row label={t("WS_OWN_DETAIL_MIDDLE_NAME")} text={`${ConnectionHolderDetails?.[0]?.middleName}`} />
          <Row className="border-none" label={t("WS_OWN_DETAIL_LAST_NAME")} text={ConnectionHolderDetails?.[0]?.lastName} />

          <Row
            className="border-none"
            label={t("WS_OWN_DETAIL_GENDER_LABEL")}
            text={t(ConnectionHolderDetails?.[0]?.gender?.i18nKey) || t("CS_NA")}
          />
          <Row className="border-none" label={t("WS_OWN_DETAIL_GUARDIAN_LABEL")} text={ConnectionHolderDetails?.[0]?.guardian || t("CS_NA")} />
          <Row
            className="border-none"
            label={t("WS_CONN_HOLDER_OWN_DETAIL_RELATION_LABEL")}
            text={t(ConnectionHolderDetails?.[0]?.relationship?.i18nKey) || t("CS_NA")}
          />
          <Row className="border-none" label={t("WS_EMAIL_ID")} text={ConnectionHolderDetails?.[0]?.emailId || t("CS_NA")} />
        </StatusTable>
      </Card>

      <CardSubHeader>{t("WS_DIVYANGJAN_INFORMATION") && t("WS_DIVYANGJAN_INFORMATION") !== "WS_DIVYANGJAN_INFORMATION" ? t("WS_DIVYANGJAN_INFORMATION") : "Divyangjan Information"}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row label={t("WS_DIVYANGJAN_INFORMATION") && t("WS_DIVYANGJAN_INFORMATION") !== "WS_DIVYANGJAN_INFORMATION" ? t("WS_DIVYANGJAN_INFORMATION") : "Divyangjan Information"} text={`${disability?.isDivyangjan ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}`} />
      </StatusTable>

      <CardSubHeader>{t("WS_DJB_EMPLOYEE_INFORMATION") && t("WS_DJB_EMPLOYEE_INFORMATION") !== "WS_DJB_EMPLOYEE_INFORMATION" ? t("WS_DJB_EMPLOYEE_INFORMATION") : "DJB Employee Information"}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row
          label={t("WS_DJB_EMPLOYEE_INFORMATION") && t("WS_DJB_EMPLOYEE_INFORMATION") !== "WS_DJB_EMPLOYEE_INFORMATION" ? t("WS_DJB_EMPLOYEE_INFORMATION") : "DJB Employee Information"}
          text={`${djbEmployee?.isDjbEmployee ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")}`}
          actionButton={<ActionButton onClick={onEdit} />}
        />
        {djbEmployee?.isDjbEmployee && (
          <React.Fragment>
            <Row label={t("WS_EMPLOYEE_ID")} text={`${t(checkForNA(djbEmployee?.employeeId))}`} />
            <Row label={t("WS_EMPLOYEE_DESIGNATION")} text={`${t(checkForNA(djbEmployee?.designation))}`} />
            {djbEmployee?.document && (
              <Row
                label={t("WS_UPLOAD_EMPLOYEE_ID_DOC")}
                text={
                  <span
                    style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                    onClick={() => openFilePDF(djbEmployee?.document)}
                  >
                    <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                  </span>
                }
              />
            )}
          </React.Fragment>
        )}
      </StatusTable>

      <CardSubHeader>{t("WS_RAIN_WATER_HARVESTING_INFORMATION") && t("WS_RAIN_WATER_HARVESTING_INFORMATION") !== "WS_RAIN_WATER_HARVESTING_INFORMATION" ? t("WS_RAIN_WATER_HARVESTING_INFORMATION") : "Rain Water Harvesting Information"}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row
          label={t("Rain Water Harvesting Certificate")}
          text={`${
            rainWaterHarvesting?.hasCertificate || rainWaterHarvesting?.isRainwaterHarvesting
              ? t("CORE_COMMON_YES")
              : t("CORE_COMMON_NO")
          }`}
        />
        {(rainWaterHarvesting?.hasCertificate || rainWaterHarvesting?.isRainwaterHarvesting) && (
          <Row
            label={t("Having Rain water harvesting Adequacy certificate?")}
            text={`${
              rainWaterHarvesting?.hasAdequacyCertificate || rainWaterHarvesting?.hasRainWaterHarvestingAdequacyCertificate || rainWaterHarvesting?.applyForAdequacyCertificate
                ? t("CORE_COMMON_YES")
                : t("CORE_COMMON_NO")
            }`}
          />
        )}
        {(rainWaterHarvesting?.validityDate || rainWaterHarvesting?.validityUpTo || rainWaterHarvesting?.rwhValidityUpTo || rainWaterHarvesting?.date) && (
          <Row
            label={t("Validity up to date")}
            text={checkForNA(rainWaterHarvesting?.validityDate || rainWaterHarvesting?.validityUpTo || rainWaterHarvesting?.rwhValidityUpTo || rainWaterHarvesting?.date)}
          />
        )}
        {(() => {
          const doc = (documents?.documents || []).find((d) => {
            const dt = (d?.documentType || "").toUpperCase();
            return dt.includes("RAIN") || dt.includes("HARVEST");
          });
          if (!doc) return null;
          const docSubType = doc?.documentType
            ? doc.documentType.split(".").pop().replace(/_/g, " ").toUpperCase()
            : "RAIN WATER HARVESTING CERTIFICATE";
          const docUid = doc?.documentUid || doc?.documentNumber || rainWaterHarvesting?.rainWaterHarvestingDocumentNumber || "NA";
          return (
            <React.Fragment>
              <Row label={t("Rain Water Harvesting Certificate*")} text={docSubType} />
              <Row label={t("Document Number")} text={maskDocNumber(docUid)} />
              {doc?.fileStoreId && (
                <Row
                  label={t("Upload Document*")}
                  text={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                      onClick={() => openFilePDF(doc.fileStoreId)}
                    >
                      <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                    </span>
                  }
                />
              )}
            </React.Fragment>
          );
        })()}
      </StatusTable>

      <CardSubHeader>{t("WS_SEWER_TREATMENT_PLANT_INFORMATION") && t("WS_SEWER_TREATMENT_PLANT_INFORMATION") !== "WS_SEWER_TREATMENT_PLANT_INFORMATION" ? t("WS_SEWER_TREATMENT_PLANT_INFORMATION") : "Sewer Treatment Plant (STP) Information"}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row
          label={t("Sewer Treatment Plant (STP)")}
          text={`${
            sewerTreatmentPlant?.hasCertificate || sewerTreatmentPlant?.hasStp || sewerTreatmentPlant?.isSewerTreatmentPlant
              ? t("CORE_COMMON_YES")
              : t("CORE_COMMON_NO")
          }`}
        />
        {(sewerTreatmentPlant?.hasCertificate || sewerTreatmentPlant?.hasStp || sewerTreatmentPlant?.isSewerTreatmentPlant) && (
          <Row
            label={t("Having STP certificate issued by DPCC?")}
            text={`${
              sewerTreatmentPlant?.hasAdequacyCertificate || sewerTreatmentPlant?.hasStpAdequacyCertificate || sewerTreatmentPlant?.hasSewerTreatmentPlantAdequacyCertificate || sewerTreatmentPlant?.applyForAdequacyCertificate || sewerTreatmentPlant?.applyForStpAdequacyCertificate
                ? t("CORE_COMMON_YES")
                : t("CORE_COMMON_NO")
            }`}
          />
        )}
        {(sewerTreatmentPlant?.validityDate || sewerTreatmentPlant?.stpValidityDate || sewerTreatmentPlant?.sewerTreatmentPlantValidityDate || sewerTreatmentPlant?.stpValidityUpTo || sewerTreatmentPlant?.date) && (
          <Row
            label={t("Validity up to date")}
            text={checkForNA(sewerTreatmentPlant?.validityDate || sewerTreatmentPlant?.stpValidityDate || sewerTreatmentPlant?.sewerTreatmentPlantValidityDate || sewerTreatmentPlant?.stpValidityUpTo || sewerTreatmentPlant?.date)}
          />
        )}
        {(() => {
          const doc = (documents?.documents || []).find((d) => {
            const dt = (d?.documentType || "").toUpperCase();
            return dt.includes("SEWER") || dt.includes("STP");
          });
          if (!doc) return null;
          const docSubType = doc?.documentType
            ? doc.documentType.split(".").pop().replace(/_/g, " ").toUpperCase()
            : "SEWER TREATMENT PLANT";
          const docUid = doc?.documentUid || doc?.documentNumber || sewerTreatmentPlant?.sewerTreatmentPlantDocumentNumber || "NA";
          return (
            <React.Fragment>
              <Row label={t("Sewer Treatment Plant (STP) Certificate*")} text={docSubType} />
              <Row label={t("Document Number")} text={maskDocNumber(docUid)} />
              {doc?.fileStoreId && (
                <Row
                  label={t("Upload Document*")}
                  text={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f47738" }}
                      onClick={() => openFilePDF(doc.fileStoreId)}
                    >
                      <GenericFileIcon /> {t("CS_COMMON_VIEW")}
                    </span>
                  }
                />
              )}
            </React.Fragment>
          );
        })()}
      </StatusTable>

      <CardSubHeader>{t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        {/* <Row
          label={t("WS_ZRO_LOCATION")}
          text={`${t(
            checkForNA(
              propertyAddress?.zro?.name ||
                propertyAddress?.zro ||
                propertyAddress?.zroLocation ||
                additionalDetails?.zroLocation ||
                propertyAddress?.additionalDetails?.zroLocation
            )
          )}`}
          actionButton={<ActionButton onClick={onEdit} />}
        /> */}
        <Row
          label={t("COMMON_ADDRESS_TYPE")}
          text={`${t(checkForNA(propertyAddress?.addressType?.i18nKey || propertyAddress?.addressType?.code || propertyAddress?.addressType))}`}
          actionButton={<ActionButton onClick={onEdit} />}
        />
        <Row
          label={t("CORE_COMMON_PROFILE_CITY")}
          text={`${t(checkForNA(propertyAddress?.city?.name || propertyAddress?.city?.code || propertyAddress?.city))}`}
        />
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
        <Row label={t("ADDRESS_LINE2")} text={`${t(checkForNA(propertyAddress?.addressLine2))}`} />
        <Row label={t("HOUSE_NO")} text={`${t(checkForNA(propertyAddress?.houseNo || propertyAddress?.doorNo))}`} />
        <Row label={t("LATITUDE_GEOTAG")} text={`${t(checkForNA(propertyAddress?.latitude))}`} />
        <Row label={t("LONGITUDE_GEOTAG")} text={`${t(checkForNA(propertyAddress?.longitude))}`} />
        <Row
          label={t("COMMON_ASSEMBLY")}
          text={`${t(
            checkForNA(
              propertyAddress?.assembly?.name ||
                propertyAddress?.assembly?.code ||
                propertyAddress?.assembly ||
                cpt?.details?.address?.assembly ||
                additionalDetails?.assembly
            )
          )}`}
        />

        <Row
          label={t("COMMON_WARD")}
          text={`${t(
            checkForNA(
              propertyAddress?.block?.name ||
                propertyAddress?.block?.code ||
                propertyAddress?.block ||
                propertyAddress?.ward?.name ||
                propertyAddress?.ward?.code ||
                propertyAddress?.ward ||
                cpt?.details?.address?.ward ||
                cpt?.details?.address?.block ||
                additionalDetails?.ward
            )
          )}`}
        />
        <Row
          label={t("COMMON_ZONE")}
          text={`${t(
            checkForNA(
              propertyAddress?.zone?.name ||
                propertyAddress?.zone?.code ||
                propertyAddress?.zone ||
                cpt?.details?.address?.zone ||
                additionalDetails?.zone
            )
          )}`}
        />

        {validActualAssembly ? (
          <Row
            label={
              t("COMMON_CURRENT_ASSEMBLY") &&
              t("COMMON_CURRENT_ASSEMBLY") !== "Assembly" &&
              t("COMMON_CURRENT_ASSEMBLY") !== "COMMON_CURRENT_ASSEMBLY"
                ? t("COMMON_CURRENT_ASSEMBLY")
                : "Actual Assembly"
            }
            text={`${t(validActualAssembly)}`}
          />
        ) : null}

        {validActualWard ? (
          <Row
            label={
              t("COMMON_CURRENT_WARD") &&
              t("COMMON_CURRENT_WARD") !== "Ward" &&
              t("COMMON_CURRENT_WARD") !== "COMMON_CURRENT_WARD"
                ? t("COMMON_CURRENT_WARD")
                : "Actual Ward"
            }
            text={`${t(validActualWard)}`}
          />
        ) : null}

        {validActualZone ? (
          <Row
            label={
              t("COMMON_CURRENT_ZONE") &&
              t("COMMON_CURRENT_ZONE") !== "Zone" &&
              t("COMMON_CURRENT_ZONE") !== "COMMON_CURRENT_ZONE"
                ? t("COMMON_CURRENT_ZONE")
                : "Actual Zone"
            }
            text={`${t(validActualZone)}`}
          />
        ) : null}
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
              useDetails?.WaterConnectionUsageType?.i18nKey ||
                useDetails?.WaterConnectionUsageType?.code ||
                useDetails?.WaterConnectionUsageType ||
                useDetails?.waterConnectionUsageType?.i18nKey ||
                useDetails?.waterConnectionUsageType?.code ||
                useDetails?.waterConnectionUsageType
            )
          )}`}
        />
        <Row
          label={t("WS_NUMBER_OF_FLOORS")}
          text={`${t(
            checkForNA(
              useDetails?.numberOfFloors?.i18nKey ||
                useDetails?.numberOfFloors?.code ||
                useDetails?.numberOfFloors ||
                useDetails?.noOfFloors?.i18nKey ||
                useDetails?.noOfFloors?.code ||
                useDetails?.noOfFloors ||
                property?.additionalDetails?.numberOfFloors ||
                property?.additionalDetails?.noOfFloors ||
                property?.noOfFloors
            )
          )}`}
        />
        {(useDetails?.totalNoOfFloors || useDetails?.totalFloors || property?.totalNoOfFloors || property?.totalFloors || property?.additionalDetails?.totalNoOfFloors || property?.additionalDetails?.totalFloors) && (
          <Row
            label={t("Total Number of floor in the Building")}
            text={`${t(checkForNA(useDetails?.totalNoOfFloors || useDetails?.totalFloors || property?.totalNoOfFloors || property?.totalFloors || property?.additionalDetails?.totalNoOfFloors || property?.additionalDetails?.totalFloors))}`}
          />
        )}
        <Row label={t("WS_PLOT_AREA")} text={`${t(checkForNA(useDetails?.plotArea))}`} />
        <Row label={t("WS_BUILT_UP_AREA")} text={`${t(checkForNA(useDetails?.builtUpArea))}`} />
        {useDetails?.heightOfTheBuilding && (
          <Row label={t("WS_HEIGHT_OF_THE_BUILDING(meters)")} text={`${t(checkForNA(useDetails?.heightOfTheBuilding))}`} />
        )}
        <Row
          label={t("WS_SELECT_YEAR_OF_CONSTRUCTION")}
          text={`${t(
            checkForNA(
              useDetails?.SelectYearofConstruction?.i18nKey ||
                useDetails?.SelectYearofConstruction?.value ||
                useDetails?.SelectYearofConstruction?.code ||
                useDetails?.SelectYearofConstruction ||
                useDetails?.constructionYear?.i18nKey ||
                useDetails?.constructionYear?.code ||
                useDetails?.constructionYear
            )
          )}`}
        />
        {(String(
          useDetails?.propertyCategory?.code ||
            useDetails?.propertyCategory?.name ||
            useDetails?.propertyCategory ||
            cpt?.additionalDetails?.propertyCategory?.code ||
            cpt?.additionalDetails?.propertyCategory ||
            cpt?.propertyType?.propertyCategory ||
            cpt?.usageCategory ||
            ""
        ).toUpperCase().includes("RESIDENTIAL")) ? (
          <Row label={t("WS_NUMBER_OF_DWELLING_UNITS")} text={`${t(checkForNA(useDetails?.NumberofDwellingUnits || useDetails?.noOfDwellingUnits))}`} />
        ) : null}
        {(Array.isArray(useDetails?.questions || cpt?.additionalDetails?.questions)
          ? (useDetails?.questions || cpt?.additionalDetails?.questions)
          : []
        ).map((q, idx) => {
          const qText = typeof q === "object" ? q?.question || q?.questionText || q?.title || `Question ${idx + 1}` : `Question ${idx + 1}`;
          const aText = typeof q === "object" ? (typeof q?.answer === "object" ? (q?.answer?.name || q?.answer?.value || q?.answer?.code) : q?.answer) : q;
          const trimmedQ = String(qText || "").trim();
          const displayLabel = trimmedQ.toLowerCase().startsWith("question") ? trimmedQ : `${trimmedQ}`;
          return <Row key={`question_${idx}`} label={displayLabel} text={`${t(checkForNA(aText))}`} />;
        })}
      </StatusTable>

      {/* <Card style={{ paddingRight: "16px" }}>
        <div style={{ position: "relative" }}>
          <CardHeader styles={{ fontSize: "28px" }}>{t("WS_COMMON_CONNECTION_DETAIL")}</CardHeader>
          <LinkButton
            label={<EditIcon style={{ marginTop: "-10px", float: "right", position: "relative", bottom: "32px" }} />}
            style={{ width: "100px", display: "inline" }}
            onClick={() => routeTo(`${routeLink}/service-name`)}
          />
        </div>
        <StatusTable>
          <Row
            className="border-none"
            textStyle={isMobile ? { marginRight: "-10px" } : {}}
            label={t("WS_SERVICE_NAME_LABEL")}
            text={t(serviceName?.i18nKey)}
          />
          {waterConectionDetails && Object.keys(waterConectionDetails)?.length > 0 && (
            <div>
              <Row className="border-none" label={t("WS_NO_OF_TAPS_PROPOSED")} text={waterConectionDetails?.proposedTaps} />
              <Row className="border-none" label={t("WS_SERV_DETAIL_PIPE_SIZE")} text={t(waterConectionDetails?.proposedPipeSize?.i18nKey)} />
            </div>
          )}
          {sewerageConnectionDetails && Object.keys(sewerageConnectionDetails)?.length > 0 && (
            <div>
              <Row className="border-none" label={t("WS_NO_OF_WATER_CLOSETS")} text={sewerageConnectionDetails?.proposedWaterClosets} />
              <Row className="border-none" label={t("WS_SERV_DETAIL_NO_OF_TOILETS")} text={sewerageConnectionDetails?.proposedToilets} />
            </div>
          )}
        </StatusTable>
      </Card> */}
      <CardSubHeader>{t("WS_BANK_DETAILS")}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row label={t("WS_NAME_OF_BANK")} text={`${t(checkForNA(bankDetails?.bankName))}`} actionButton={<ActionButton onClick={onEdit} />} />
        <Row label={t("WS_NAME_OF_BRANCH")} text={`${t(checkForNA(bankDetails?.bankBranchName || bankDetails?.branchName))}`} />
        <Row label={t("WS_IFSC_CODE")} text={`${t(checkForNA(bankDetails?.ifscCode))}`} />
        <Row label={t("WS_BANK_ACCOUNT_NO")} text={`${t(checkForNA(bankDetails?.bankAccountNumber || bankDetails?.accountNumber))}`} />
      </StatusTable>
      <Card style={{ paddingRight: "16px" }}>
        <div style={{ position: "relative" }}>
          <CardHeader styles={{ fontSize: "28px" }}>{t("WS_COMMON_DOCUMENT_DETAILS")}</CardHeader>
          <LinkButton
            label={<EditIcon style={{ marginTop: "-10px", float: "right", position: "relative", bottom: "32px" }} />}
            style={{ width: "100px", display: "inline" }}
            onClick={() => routeTo(`${routeLink}/document-details`)}
          />
        </div>
        {documents &&
          documents?.documents
            .filter((doc) => {
              const dt = (doc?.documentType || "").toUpperCase();
              return (
                !dt.includes("DJB_EMPLOYEE") &&
                !dt.includes("EMPLOYEE_ID") &&
                !dt.includes("SEWER") &&
                !dt.includes("STP") &&
                !dt.includes("RAIN") &&
                !dt.includes("HARVEST")
              );
            })
            .map((doc, index, array) => (
            <div key={`doc-${index}`}>
              {
                <div>
                  <CardSectionHeader>{getDocumentSectionHeader(doc?.documentType)}</CardSectionHeader>
                  <StatusTable>
                    {<WSDocument value={value} Code={doc?.documentType} index={index} />}
                    {array.length != index + 1 ? (
                      <hr style={{ color: "white", backgroundColor: "white", height: "2px", marginTop: "20px", marginBottom: "20px" }} />
                    ) : null}
                  </StatusTable>
                </div>
              }
            </div>
          ))}
      </Card>
      <SubmitBar label={t("CS_COMMON_SUBMIT")} onSubmit={onSubmit} style={{ marginLeft: "10px", maxWidth: "95%" }} />
    </React.Fragment>
  );
};
export default CheckPage;
