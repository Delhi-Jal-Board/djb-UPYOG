import React, { useState, useEffect } from "react";
import {
  LabelFieldPair,
  TextInput,
  LinkButton,
  Toast,
  StatusTable,
  Row,
  Card,
  Label,
  Dropdown,
  CollapsibleCardPage,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { useLocation, Link, useHistory } from "react-router-dom";
const getAddress = (address, t) => {
  return `${address?.doorNo ? `${address?.doorNo}, ` : ""} ${address?.street ? `${address?.street}, ` : ""}${
    address?.landmark ? `${address?.landmark}, ` : ""
  }${t(Digit.Utils.pt.getMohallaLocale(address?.locality.code, address?.tenantId))}, ${t(Digit.Utils.pt.getCityLocale(address?.tenantId))}${
    address?.pincode && t(address?.pincode) ? `, ${address.pincode}` : " "
  }`;
};

const PropertySearchNSummary = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const history = useHistory();
  let { pathname, state } = useLocation();
  state = state && (typeof state === "string" || state instanceof String) ? JSON.parse(state) : state;
  const isEditScreen = pathname.includes("/modify-application/");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const isEmpNewApplication = window.location.href.includes("/employee/tl/new-application");
  const isEmpRenewLicense =
    window.location.href.includes("/employee/tl/renew-application-details") || window.location.href.includes("/employee/tl/edit-application-details");
  const search = useLocation().search;
  const urlPropertyId = new URLSearchParams(search).get("propertyId");
  const [propertyId, setPropertyId] = useState(formData?.cptId?.id || (urlPropertyId !== "null" ? urlPropertyId : "") || "");
  const [searchPropertyId, setSearchPropertyId] = useState(urlPropertyId !== "null" ? urlPropertyId : "");
  const [showToast, setShowToast] = useState(null);
  const isMobile = window.Digit.Utils.browser.isMobile();
  const serachParams = window.location.href.includes("?")
    ? window.location.href.substring(window.location.href.indexOf("?") + 1, window.location.href.length)
    : "";

  const { isLoading, isError, error, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: searchPropertyId }, tenantId: tenantId },
    {
      filters: { propertyIds: searchPropertyId },
      tenantId: tenantId,
      enabled: searchPropertyId ? true : false,
      privacy: Digit.Utils.getPrivacyObject(),
    }
  );

  useEffect(() => {
    if (propertyId && (window.location.href.includes("/renew-application-details/") || window.location.href.includes("/edit-application-details/")))
      setSearchPropertyId(propertyId);
  }, [propertyId]);

  useEffect(() => {
    if ((isLoading == false && error && error == true) || propertyDetails?.Properties?.length == 0) {
      setShowToast({ error: true, label: "PT_ENTER_VALID_PROPERTY_ID" });
    }
  }, [error, propertyDetails]);
  useEffect(() => {
    onSelect("cpt", { details: propertyDetails?.Properties[0] });
    sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(propertyDetails?.Properties[0]));
    localStorage.setItem("pgrProperty", JSON.stringify(propertyDetails?.Properties[0]));
  }, [propertyDetails, pathname]);

  const searchProperty = () => {
    if (!propertyId) {
      setShowToast({ error: true, label: "PT_ENTER_PROPERTY_ID_AND_SEARCH" });
    }
    setSearchPropertyId(propertyId);
    if (window.location.pathname.includes("/tl/new-application")) {
      history.push(`/digit-ui/employee/tl/new-application?propertyId=${propertyId}`);
      const scrollConst = 1600;
      setTimeout(() => window.scrollTo(0, scrollConst), 0);
    } else if (window.location.pathname.includes("/ws/new-application"))
      history.push(`/digit-ui/employee/ws/new-application?propertyId=${propertyId}`);
  };

  const clearSearch = () => {
    setPropertyId("");
    setSearchPropertyId("");
    onSelect(config?.key, { id: "" });
    onSelect("cpt", null);
  };

  if (isEditScreen) {
    return <React.Fragment />;
  }

  const redirectBackUrl = window.location.pathname;

  let propertyAddress = "";

  if (propertyDetails && propertyDetails?.Properties.length) {
    propertyAddress = getAddress(propertyDetails?.Properties[0]?.address, t);
  }
  const getInputStyles = () => {
    if (window.location.href.includes("/ws/")) {
      return { fontWeight: "700" };
    } else return {};
  };

  const getOwnerNames = (propertyData) => {
    const getActiveOwners = propertyData?.owners?.filter((owner) => owner?.active);
    const getOwnersList = getActiveOwners
      .sort((a, b) => a?.additionalDetails?.ownerSequence - b?.additionalDetails?.ownerSequence)
      ?.map((activeOwner) => activeOwner?.name)
      ?.join(",");
    return getOwnersList ? getOwnersList : t("NA");
  };

  let clns = "";
  if (window.location.href.includes("/ws/")) clns = ":";

  return (
    <React.Fragment>
      <CollapsibleCardPage title={t("PT_PROPERTY_SEARCH")} defaultOpen={true}>
        {(window.location.href.includes("/tl/")
          ? !(formData?.tradedetils?.[0]?.structureType?.code === "MOVABLE") && (isEmpNewApplication || isEmpRenewLicense)
          : true) && (
          <React.Fragment>
            <LabelFieldPair>
              <Label style={getInputStyles()}>{`${t(`PROPERTY_ID`)}`}</Label>
              <div style={{ display: "flex", gap: "12px" }}>
                <TextInput
                  key={config?.key}
                  value={propertyId}
                  //isMandatory={true}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    onSelect(config?.key, { id: e.target.value });
                  }}
                  style={{ width: "80%", float: "left" }}
                  placeholder={`${t("PT_ENTER_PROPERTY_ID")}`}
                />
                <button className="submit-bar" type="button" style={{ color: "white" }} onClick={searchProperty}>
                  {`${t("PT_SEARCH")}`}
                </button>
                <button className="submit-bar" type="button" style={{ color: "white" }} onClick={clearSearch}>
                  {`${t("CLEAR")}`}
                </button>

                <span
                  onClick={() =>
                    history.push(`/digit-ui/${userType}/${pathname.split("/")[3]}/create-application/create-property`, { ...state, ...formData })
                  }
                >
                  <button className="submit-bar" type="button" style={{ color: "white" }}>
                    {t("CPT_CREATE_PROPERTY")}
                  </button>
                </span>
              </div>
            </LabelFieldPair>

            {searchPropertyId && propertyDetails && propertyDetails?.Properties.length ? (
              <React.Fragment>
                <Card className="card-with-background" style={{ margin: "16px 0px", padding: "20px", boxShadow: "none" }}>
                  <StatusTable style={{ padding: "0", margin: "0" }}>
                    <div className="formcomposer-section-grid" style={isMobile ? {} : {}}>
                      <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ color: "#000" }}
                        label={t(`PROPERTY_ID`)}
                        text={propertyDetails?.Properties[0]?.propertyId}
                      />
                      <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ color: "#000" }}
                        label={t(`OWNER_NAME`)}
                        text={getOwnerNames(propertyDetails?.Properties[0])}
                      />
                      <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ wordBreak: "break-word", color: "#000" }}
                        label={t(`PROPERTY_ADDRESS`)}
                        text={propertyAddress}
                        privacy={{
                          uuid: propertyDetails?.Properties[0]?.owners?.[0]?.uuid,
                          fieldName: ["doorNo", "street", "landmark"],
                          model: "Property",
                          showValue: true,
                          loadData: {
                            serviceName: "/property-services/property/_search",
                            requestBody: {},
                            requestParam: {
                              tenantId: propertyDetails?.Properties[0]?.tenantId,
                              propertyIds: propertyDetails?.Properties[0]?.propertyId,
                            },
                            jsonPath: "Properties[0].address.street",
                            d: (res) => {
                              let resultString =
                                (_.get(res, "Properties[0].address.doorNo") ? `${_.get(res, "Properties[0].address.doorNo")}, ` : "") +
                                (_.get(res, "Properties[0].address.street") ? `${_.get(res, "Properties[0].address.street")}, ` : "") +
                                (_.get(res, "Properties[0].address.landmark") ? `${_.get(res, "Properties[0].address.landmark")}` : "");
                              return resultString;
                            },
                            isArray: false,
                          },
                        }}
                      />
                    </div>
                  </StatusTable>
                </Card>
              </React.Fragment>
            ) : null}
            {showToast && (
              <Toast
                isDleteBtn={true}
                labelstyle={{ width: "100%" }}
                error={showToast.error}
                warning={showToast.warning}
                label={t(showToast.label)}
                onClose={() => {
                  setShowToast(null);
                }}
              />
            )}
          </React.Fragment>
        )}
      </CollapsibleCardPage>
    </React.Fragment>
  );
};

export default PropertySearchNSummary;
