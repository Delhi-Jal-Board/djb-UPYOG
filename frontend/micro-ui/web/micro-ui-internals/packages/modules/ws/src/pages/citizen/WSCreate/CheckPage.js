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

const CheckPage = ({ onSubmit, value }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const match = useRouteMatch();
  let isMobile = window.Digit.Utils.browser.isMobile();
  const { ConnectionHolderDetails, plumberPreference, serviceName, waterConectionDetails, sewerageConnectionDetails, documents, cpt } = value;
  let routeLink = `/digit-ui/citizen/ws/create-application`;
  if (window.location.href.includes("/edit-application/")) routeLink = `/digit-ui/citizen/ws/edit-application/${value?.tenantId}`;

  function routeTo(jumpTo) {
    location.href = jumpTo;
  }

  const connectionDetails = value?.ConnectionDetails?.[0] || value?.ConnectionDetails || {};
  const propertyAddress = value?.propertyLocationDetails || {};
  const useDetails = value?.waterConnection?.useDetails || {};
  const djbEmployee = value?.djbEmployee || {};
  const bankDetails = value?.bankDetails || {};
  const additionalDetails = {};

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

  return (
    <React.Fragment>
      <Timeline currentStep={4} />
      <Header styles={{ fontSize: "32px" }}>{t("WS_COMMON_SUMMARY")}</Header>
      <Card style={{ paddingRight: "16px" }}>
        <CardHeader styles={{ fontSize: "28px" }}>{t(`WS_BASIC_DETAILS_HEADER`)}</CardHeader>
        <StatusTable>
          <Row className="border-none" label={t("WS_PROPERTY_ID_LABEL")} text={cpt?.details?.propertyId} />
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
      <CardSubHeader>{t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row
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
        />
        <Row
          label={t("COMMON_ADDRESS_TYPE")}
          text={`${t(checkForNA(propertyAddress?.addressType?.i18nKey || propertyAddress?.addressType?.code || propertyAddress?.addressType))}`}
        />
        <Row label={t("CORE_COMMON_PROFILE_CITY")} text={`${t(checkForNA(propertyAddress?.city?.name || propertyAddress?.city?.code || propertyAddress?.city))}`} />
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
        <Row label={t("LATITUDE_GEOTAG")} text={`${t(checkForNA(propertyAddress?.latitude))}`} />
        <Row label={t("LONGITUDE_GEOTAG")} text={`${t(checkForNA(propertyAddress?.longitude))}`} />
        <Row
          label={t("COMMON_ASSEMBLY")}
          text={`${t(
            checkForNA(propertyAddress?.assembly?.name || propertyAddress?.assembly?.code || propertyAddress?.assembly || additionalDetails?.assembly)
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
                additionalDetails?.ward
            )
          )}`}
        />
        <Row
          label={t("COMMON_ZONE")}
          text={`${t(checkForNA(propertyAddress?.zone?.name || propertyAddress?.zone?.code || propertyAddress?.zone || additionalDetails?.zone))}`}
        />

        <Row label={t("COMMON_CURRENT_ASSEMBLY")} text={`${t(checkForNA(propertyAddress?.actualAssembly || additionalDetails?.actualAssembly))}`} />
        <Row label={t("COMMON_CURRENT_WARD")} text={`${t(checkForNA(propertyAddress?.actualWard || additionalDetails?.actualWard))}`} />
        <Row label={t("COMMON_CURRENT_ZONE")} text={`${t(checkForNA(propertyAddress?.zone?.name || propertyAddress?.zone?.code || propertyAddress?.zone || propertyAddress?.actualZone || additionalDetails?.actualZone))}`} />
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
          text={`${t(checkForNA(useDetails?.noOfFloors?.i18nKey || useDetails?.noOfFloors?.code || useDetails?.noOfFloors))}`}
        />
        <Row label={t("WS_PLOT_AREA")} text={`${t(checkForNA(useDetails?.plotArea))}`} />
        <Row label={t("WS_BUILT_UP_AREA")} text={`${t(checkForNA(useDetails?.builtUpArea))}`} />
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

      <CardSubHeader>{t("WS_BANK_DETAILS")}</CardSubHeader>
      <StatusTable style={{ marginTop: "10px", marginBottom: "30px" }}>
        <Row label={t("WS_NAME_OF_BANK")} text={`${t(checkForNA(bankDetails?.bankName))}`} actionButton={<ActionButton onClick={onEdit} />} />
        <Row label={t("WS_NAME_OF_BRANCH")} text={`${t(checkForNA(bankDetails?.bankBranchName || bankDetails?.branchName))}`} />
        <Row label={t("WS_IFSC_CODE")} text={`${t(checkForNA(bankDetails?.ifscCode))}`} />
        <Row label={t("WS_BANK_ACCOUNT_NO")} text={`${t(checkForNA(bankDetails?.bankAccountNumber || bankDetails?.accountNumber))}`} />
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
          documents?.documents.map((doc, index) => (
            <div key={`doc-${index}`}>
              {
                <div>
                  <CardSectionHeader>{t(doc?.documentType?.split(".").slice(0, 2).join("_"))}</CardSectionHeader>
                  <StatusTable>
                    {<WSDocument value={value} Code={doc?.documentType} index={index} />}
                    {documents?.documents.length != index + 1 ? (
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
