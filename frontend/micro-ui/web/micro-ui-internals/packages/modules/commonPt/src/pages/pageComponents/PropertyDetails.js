import {
  CardHeader, FormStep, LinkButton, Loader, Row, StatusTable, SubmitBar
} from "@djb25/digit-ui-react-components";
import React from "react";
import { Link } from "react-router-dom";
import _ from "lodash";
import Timeline from "../../components/CPTTimeline";

const getAddress = (address, t, property) => {
  if (!address && !property) return "";
  const addrObj = typeof address === "object" && address !== null ? address : {};
  const propAddr = property?.address || {};
  const addDetails = property?.additionalDetails || property?.address?.additionalDetails || {};

  const parts = [];

  // 1. House No / Door No
  const houseNo =
    addrObj?.doorNo ||
    addrObj?.houseNo ||
    addrObj?.houseDoorNo ||
    propAddr?.doorNo ||
    propAddr?.houseNo ||
    propAddr?.houseDoorNo ||
    property?.doorNo ||
    property?.houseNo ||
    "";
  if (houseNo && String(houseNo).trim() && String(houseNo).trim() !== "NA") {
    parts.push(String(houseNo).trim());
  }

  // 2. Building / Colony Name
  const building =
    addrObj?.buildingName ||
    addrObj?.buildingColonyName ||
    propAddr?.buildingName ||
    propAddr?.buildingColonyName ||
    property?.buildingName ||
    "";
  if (building && String(building).trim() && String(building).trim() !== "NA") {
    parts.push(String(building).trim());
  }

  // 3. Street / Street Name / AddressLine1
  const street =
    addrObj?.street ||
    addrObj?.streetName ||
    addrObj?.addressLine1 ||
    propAddr?.street ||
    propAddr?.streetName ||
    propAddr?.addressLine1 ||
    property?.street ||
    property?.addressLine1 ||
    "";
  if (street && String(street).trim() && String(street).trim() !== "NA") {
    parts.push(String(street).trim());
  }

  // 4. AddressLine2
  const addressLine2 =
    addrObj?.addressLine2 ||
    propAddr?.addressLine2 ||
    property?.addressLine2 ||
    "";
  if (addressLine2 && String(addressLine2).trim() && String(addressLine2).trim() !== "NA") {
    parts.push(String(addressLine2).trim());
  }

  // 5. Landmark
  const landmark =
    addrObj?.landmark ||
    addrObj?.landmarkName ||
    propAddr?.landmark ||
    propAddr?.landmarkName ||
    property?.landmark ||
    "";
  if (landmark && String(landmark).trim() && String(landmark).trim() !== "NA") {
    parts.push(String(landmark).trim());
  }

  // 6. Locality
  const tenantId =
    addrObj?.tenantId ||
    propAddr?.tenantId ||
    property?.tenantId ||
    Digit.ULBService.getCurrentTenantId();
  const localityRaw = addrObj?.locality || propAddr?.locality || property?.locality;
  const localityCode = localityRaw?.code || (typeof localityRaw === "string" ? localityRaw : null);

  let localityText = "";
  if (localityCode && Digit.Utils?.pt?.getMohallaLocale) {
    const locLocale = Digit.Utils.pt.getMohallaLocale(localityCode, tenantId);
    localityText = t ? t(locLocale) : locLocale;
  }
  if (!localityText || localityText === localityCode) {
    localityText = localityRaw?.name || localityRaw?.code || "";
  }
  if (localityText && String(localityText).trim() && String(localityText).trim() !== "NA") {
    parts.push(String(localityText).trim());
  }

  // 7. Assembly
  const assemblyVal =
    addrObj?.assembly ||
    addrObj?.Assembly ||
    addrObj?.actualAssembly ||
    addrObj?.additionalDetails?.assembly ||
    propAddr?.assembly ||
    propAddr?.Assembly ||
    propAddr?.actualAssembly ||
    propAddr?.additionalDetails?.assembly ||
    addDetails?.assembly ||
    property?.assembly ||
    "";
  const assemblyText = typeof assemblyVal === "object" ? assemblyVal?.name || assemblyVal?.code || "" : String(assemblyVal || "");
  if (assemblyText && assemblyText.trim() && assemblyText.trim() !== "NA") {
    parts.push(assemblyText.trim());
  }

  // 8. Zone
  const zoneVal =
    addrObj?.zone ||
    addrObj?.Zone ||
    addrObj?.actualZone ||
    addrObj?.additionalDetails?.zone ||
    propAddr?.zone ||
    propAddr?.Zone ||
    propAddr?.actualZone ||
    propAddr?.additionalDetails?.zone ||
    addDetails?.zone ||
    property?.zone ||
    "";
  const zoneText = typeof zoneVal === "object" ? zoneVal?.name || zoneVal?.code || "" : String(zoneVal || "");
  if (zoneText && zoneText.trim() && zoneText.trim() !== "NA") {
    parts.push(zoneText.trim());
  }

  // 9. Ward
  const wardVal =
    addrObj?.ward ||
    addrObj?.Ward ||
    addrObj?.block ||
    addrObj?.Block ||
    addrObj?.actualWard ||
    addrObj?.additionalDetails?.ward ||
    addrObj?.additionalDetails?.block ||
    propAddr?.ward ||
    propAddr?.Ward ||
    propAddr?.block ||
    propAddr?.Block ||
    propAddr?.actualWard ||
    propAddr?.additionalDetails?.ward ||
    propAddr?.additionalDetails?.block ||
    addDetails?.ward ||
    property?.ward ||
    "";
  const wardText = typeof wardVal === "object" ? wardVal?.name || wardVal?.code || "" : String(wardVal || "");
  if (wardText && wardText.trim() && wardText.trim() !== "NA") {
    parts.push(wardText.trim());
  }

  // 10. City
  let cityText = "";
  if (tenantId && Digit.Utils?.pt?.getCityLocale) {
    const cityLocale = Digit.Utils.pt.getCityLocale(tenantId);
    cityText = t ? t(cityLocale) : cityLocale;
  }
  if (!cityText || cityText === tenantId) {
    cityText = addrObj?.city || propAddr?.city || tenantId || "";
  }
  if (cityText && String(cityText).trim() && String(cityText).trim() !== "NA") {
    parts.push(String(cityText).trim());
  }

  // 11. Pincode
  const pincode =
    addrObj?.pincode ||
    addrObj?.pinCode ||
    propAddr?.pincode ||
    propAddr?.pinCode ||
    property?.pincode ||
    "";
  if (pincode && String(pincode).trim() && String(pincode).trim() !== "NA") {
    parts.push(String(pincode).trim());
  }

  // Deduplicate parts case-insensitively while preserving order
  const uniqueParts = [];
  parts.forEach((p) => {
    if (p && !uniqueParts.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
      uniqueParts.push(p);
    }
  });

  return uniqueParts.join(", ");
};

const PropertyDetails = ({ t, config, onSelect, userType, formData }) => {
  const tenantId = (formData?.knowyourproperty?.KnowProperty?.code === "YES" || sessionStorage.getItem("VisitedLightCreate") === "false" ? formData?.cptSearchQuery?.city : formData?.cpt?.details?.tenantId ) || Digit.ULBService.getCitizenCurrentTenant();
  // if (window.location.href.includes("/tl/tradelicence/edit-application/") || window.location.href.includes("/renew-trade/")) {
  //   sessionStorage.setItem("EditFormData", JSON.stringify(formData));
  // }
  if(window.location.href.includes("/tl/tradelicence/edit-application/") || window.location.href.includes("/renew-trade/") && JSON.parse(sessionStorage.getItem("EditFormData") ))
  {
    let EditformData = JSON.parse(sessionStorage.getItem("EditFormData"));
    formData = {...formData,...EditformData};
  }
  const { isLoading, isError, error, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    {
      filters: { propertyIds: formData?.cptId?.id || formData?.cpt?.details?.propertyId ? (formData?.knowyourproperty?.KnowProperty?.code === "YES" || sessionStorage.getItem("VisitedLightCreate") === "false" ? formData?.cptId?.id : formData?.cpt?.details?.propertyId) : (window.location.href.includes("/tl/tradelicence/edit-application") || window.location.href.includes("/renew-trade/")  ? formData?.tradeLicenseDetail?.additionalDetail?.propertyId : formData?.cptId?.id || formData?.cpt?.details?.propertyId ) },
      tenantId: tenantId,
      privacy: Digit.Utils.getPrivacyObject(),
    },
    { 
      filters: { propertyIds: formData?.cptId?.id || formData?.cpt?.details?.propertyId ? (formData?.knowyourproperty?.KnowProperty?.code === "YES" || sessionStorage.getItem("VisitedLightCreate") === "false" ? formData?.cptId?.id : formData?.cpt?.details?.propertyId) : (window.location.href.includes("/tl/tradelicence/edit-application") || window.location.href.includes("/renew-trade/")  ? formData?.tradeLicenseDetail?.additionalDetail?.propertyId : formData?.cptId?.id || formData?.cpt?.details?.propertyId ) }, 
      tenantId: tenantId,
      privacy: Digit.Utils.getPrivacyObject(), }
  );

  const onSkip = () => onSelect();

  const goNext = () => {
    sessionStorage.setItem("cpt", propertyDetails?.Properties[0]);
    onSelect("cpt", { details: propertyDetails?.Properties[0] });
  };

  const reversedOwners= Array.isArray(propertyDetails?.Properties?.[0]?.owners) ? propertyDetails?.Properties?.[0]?.owners.slice().reverse():[];

  const firstProperty = propertyDetails?.Properties?.[0];
  const fullPropertyAddress = firstProperty ? getAddress(firstProperty?.address, t, firstProperty) : "";

  if (isLoading) {
    return <Loader />;
  }

  function getChangePropertyPath() {
    if(window.location.href.includes("/ws/modify-connection/"))
    return `/digit-ui/citizen/ws/modify-connection/${formData?.tenantId}/search-property`
    else if(window.location.href.includes("/ws/edit-application/"))
    return `/digit-ui/citizen/ws/edit-application/${formData?.tenantId}/search-property`
    else if(window.location.href.includes("/ws/"))
    return `/digit-ui/citizen/ws/create-application/search-property`
    else if(window.location.href.includes("/renew-trade/"))
    return `/digit-ui/citizen/tl/tradelicence/renew-trade/${formData?.applicationNumber}/${formData?.tenantId}/know-your-property`
    else if(window.location.href.includes("/edit-application"))
    return `/digit-ui/citizen/tl/tradelicence/edit-application/${formData?.applicationNumber}/${formData?.tenantId}/know-your-property`
    else
    return `/digit-ui/citizen/tl/tradelicence/new-application/know-your-property`
  }

  return (
    <React.Fragment>
      {window.location.href.includes("/citizen") ? <Timeline currentStep={window.location.href.includes("/ws/") ? 1 : 2} flow={window.location.href.includes("/ws/") ? "WS":""} businessService={"WS"} /> : null}
      <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip}>
        {propertyDetails && propertyDetails?.Properties?.length > 0 && (
          <React.Fragment>
            <CardHeader>{t("PT_DETAILS")}</CardHeader>
            <StatusTable>
              {/* <Row className="border-none" label={t(`PROPERTY_ID`)} text={propertyDetails?.Properties[0]?.propertyId} /> */}
              <Row className="border-none" label={t(`OWNER_NAME`)} text={reversedOwners?.[0]?.name} />
              <Row className="border-none" textStyle={{ wordBreak: "break-word" }} label={t(`PROPERTY_ADDRESS`)} text={fullPropertyAddress} 
              privacy={ {
                uuid: propertyDetails?.Properties?.[0]?.owners?.[0]?.uuid,
                fieldName: ["doorNo" , "street" , "landmark"], 
                model: "Property",
                showValue: true,
                loadData: {
                  serviceName: "/property-services/property/_search",
                  requestBody: {},
                  requestParam: { tenantId:propertyDetails?.Properties[0]?.tenantId, propertyIds:propertyDetails?.Properties[0]?.propertyId },
                  jsonPath: "Properties[0].address.street",
                  d: (res) => {
                    const prop = _.get(res, "Properties[0]");
                    return getAddress(prop?.address, t, prop);
                  },
                  isArray: false,
                },
              }}/>
              <Row className="border-none" label={t(`PT_MUTATION_STATUS`)} text={t(propertyDetails?.Properties[0]?.status)} />
              <div style={{ textAlign: "left" }}>
                <Link
                  to={`/digit-ui/citizen/commonpt/view-property?propertyId=${propertyDetails?.Properties[0]?.propertyId}&tenantId=${propertyDetails?.Properties[0]?.tenantId}`}
                >
                  <LinkButton style={{ textAlign: "left" }} label={t("PT_VIEW_MORE_DETAILS")} />
                </Link>
                <Link
                  to={getChangePropertyPath()}
                >
                  <LinkButton style={{ textAlign: "left" }} label={t("PT_CHANGE_PROPERTY")} onClick={() => {sessionStorage.setItem("changePropertySelected", "yes"); sessionStorage.setItem("EditFormData", JSON.stringify(formData))}} />
                </Link>
              </div>
            </StatusTable>
            <SubmitBar style={{ marginTop: "10px" }} onSubmit={goNext} label={t("CS_COMMON_NEXT")} />
          </React.Fragment>
        )}
      </FormStep>
    </React.Fragment>
  );
};
export default PropertyDetails;