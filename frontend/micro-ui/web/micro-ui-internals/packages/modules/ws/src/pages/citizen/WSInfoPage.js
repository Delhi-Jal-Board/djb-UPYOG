import React, { useState } from "react";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardText,
  CardSubHeader,
  SubmitBar,
  RadioButtons,
  Dropdown,
  Loader,
  CitizenInfoLabel,
  Label,
  TextInput,
} from "@djb25/digit-ui-react-components";

const getAddress = (address, t) => {
  return `${address?.doorNo ? `${address?.doorNo}, ` : ""} ${address?.street ? `${address?.street}, ` : ""}${
    address?.landmark ? `${address?.landmark}, ` : ""
  }${t(Digit.Utils.pt.getMohallaLocale(address?.locality.code, address?.tenantId))}, ${t(Digit.Utils.pt.getCityLocale(address?.tenantId))}${
    address?.pincode && t(address?.pincode) ? `, ${address.pincode}` : " "
    }`;
};

const WSInfoPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const isEmployee = window.location.href.includes("/employee");

  const [hasProperty, setHasProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchMobileNumber, setSearchMobileNumber] = useState("");

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userMobileNumber = Digit.UserService.getUser()?.info?.mobileNumber;
  const mobileNumberToSearch = isEmployee ? searchMobileNumber : userMobileNumber;

  const { isLoading, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { mobileNumber: mobileNumberToSearch }, tenantId: tenantId },
    {
      filters: { mobileNumber: mobileNumberToSearch },
      tenantId: tenantId,
      enabled: hasProperty?.code === "YES" && mobileNumberToSearch?.length === 10 ? true : false,
    }
  );

  const radioOptions = [
    { code: "YES", i18nKey: "TL_COMMON_YES" },
    { code: "NO", i18nKey: "TL_COMMON_NO" },
  ];

  const handleNext = () => {
    const isEmployee = window.location.href.includes("/employee");
    const baseUrl = isEmployee ? "/digit-ui/employee/ws" : "/digit-ui/citizen/ws";
    if (hasProperty?.code === "YES" && selectedProperty) {
      history.push(`${baseUrl}/old-application?propertyId=${selectedProperty.propertyId}`);
    } else if (hasProperty?.code === "YES" && !selectedProperty) {
      // Should not be reachable since button is disabled, but just in case
      return;
    } else {
      // Proceed without property
      history.push(`${baseUrl}/old-application`);
    }
  };

  const handleCreateProperty = () => {
    const propertyUrl = isEmployee ? "/digit-ui/employee/ws/create-application/create-property" : "/digit-ui/citizen/commonpt-home";
    history.push(propertyUrl);
  };

  const propertyOptions =
    propertyDetails?.Properties?.map((prop) => ({
      ...prop,
      displayName: `${prop.propertyId} - ${getAddress(prop.address, t)}`,
    })) || [];

  return (
    <React.Fragment>
      <Card>
        <CardHeader>{t("WS_COMMON_APPL_NEW_CONNECTION")}</CardHeader>

        <CitizenInfoLabel
          style={{ margin: "0px", textAlign: "left", marginBottom: "16px" }}
          textStyle={{ color: "#0B0C0C" }}
          text={t("WS_INFO_ESTIMATED_TIME_10_20_MINS")}
          showInfo={false}
        />

        <div style={{ marginBottom: "24px" }}>
          <CardSubHeader>{t("WS_DO_YOU_HAVE_EXISTING_PROPERTY")}</CardSubHeader>
          <RadioButtons
            t={t}
            options={radioOptions}
            optionsKey="i18nKey"
            value={hasProperty}
            selectedOption={hasProperty}
            onSelect={(val) => {
              setHasProperty(val);
              setSelectedProperty(null);
            }}
            style={{ display: "flex", gap: "24px" }}
          />
        </div>

        {hasProperty?.code === "YES" && (
          <div style={{ marginBottom: "24px" }}>
            {isEmployee && (
              <div style={{ display: "flex", gap: "24px", marginBottom: "16px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Label>{t("CORE_COMMON_MOBILE_NUMBER")}</Label>
                  <TextInput
                    t={t}
                    type={"number"}
                    isMandatory={false}
                    name="mobileNumber"
                    value={searchMobileNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 10) {
                        setSearchMobileNumber(val);
                        setSelectedProperty(null);
                      }
                    }}
                    placeholder={t("Enter mobile number")}
                    maxLength={10}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>{t("WS_SELECT_EXISTING_PROPERTY")}</Label>
                  <div className="field">
                    <Dropdown
                      className="form-field"
                      option={propertyOptions}
                      optionKey="displayName"
                      id="propertyId"
                      selected={selectedProperty}
                      select={setSelectedProperty}
                      t={t}
                      placeholder={t("PT_SELECT_PROPERTY")}
                      disable={isLoading || propertyOptions.length === 0}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEmployee && <Label>{t("WS_SELECT_EXISTING_PROPERTY")}</Label>}
            {isLoading && !isEmployee ? (
              <Loader />
            ) : (
              propertyOptions.length > 0 &&
              !isEmployee && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Dropdown
                    option={propertyOptions}
                    optionKey="displayName"
                    id="propertyId"
                    selected={selectedProperty}
                    select={setSelectedProperty}
                    t={t}
                    placeholder={t("PT_SELECT_PROPERTY")}
                  />
                  <span style={{ fontSize: "14px", color: "#505A5F" }}>{t("WS_PROPERTY_AUTOFILL_MSG")}</span>
                </div>
              )
            )}
          </div>
        )}

        {hasProperty?.code === "NO" && (
          <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <span onClick={handleCreateProperty}>
              <button className="submit-bar" type="button" style={{ color: "white", margin: 0 }}>
                {t("CPT_CREATE_PROPERTY")}
              </button>
            </span>
          </div>
        )}

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_COMMON_CONNECTION_DETAIL")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_SERVICE_TYPE")}</li>
          <li>{t("WS_CONNECTION_TYPE")}</li>
          <li>{t("WS_WATER_DEMAND_TYPE")}</li>
          <li>{t("WS_APPLICANT_TYPE")}</li>
          <li>{t("WS_DOMESTIC_TYPE")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_OWN_DETAIL_NAME")}</li>
          <li>{t("WS_OWN_DETAIL_MIDDLE_NAME")}</li>
          <li>{t("WS_OWN_DETAIL_LAST_NAME")}</li>
          <li>{t("WS_CONN_HOLDER_OWN_DETAIL_GENDER_LABEL")}</li>
          <li>{t("WS_OWN_DETAIL_GUARDIAN_LABEL")}</li>
          <li>{t("CORE_COMMON_MOBILE_NUMBER")}</li>
          <li>{t("WS_EMAIL_ID")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("PT_LOCATION_DETAILS")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_ZRO_LOCATION")}</li>
          <li>{t("COMMON_ADDRESS_TYPE")}</li>
          <li>{t("CITY")}</li>
          <li>{t("PINCODE")}</li>
          <li>{t("LOCALITY")}</li>
          <li>{t("SubLocality")}</li>
          <li>{t("STREET_NAME")}</li>
          <li>{t("ADDRESS_LINE1")}</li>
          <li>{t("ADDRESS_LINE2")}</li>
          <li>{t("HOUSE_NO")}</li>
          <li>{t("LATITUDE")}</li>
          <li>{t("LONGITUDE")}</li>
          <li>{t("ASSEMBLY")}</li>
          <li>{t("WARD")}</li>
          <li>{t("ZONE")}</li>
          <li>{t("LANDMARK")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_CATEGORY_TYPE")}</li>
          <li>{t("WS_PROPERTY_CATEGORY")}</li>
          <li>{t("WS_PROPERTY_TYPE")}</li>
          <li>{t("WS_WATER_CONNECTION_USAGE_TYPE")}</li>
          <li>{t("WS_NUMBER_OF_FLOORS")}</li>
          <li>{t("WS_PLOT_AREA")}</li>
          <li>{t("WS_BUILT_UP_AREA")}</li>
          <li>{t("WS_SELECT_YEAR_OF_CONSTRUCTION")}</li>
          <li>{t("WS_NUMBER_OF_DWELLING_UNITS")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_DJB_EMPLOYEE")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_EMPLOYEE_ID")}</li>
          <li>{t("WS_DATE_OF_RETIREMENT")}</li>
          <li>{t("WS_EMPLOYEE_DESIGNATION")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_BANK_DETAILS")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_NAME_OF_BANK")}</li>
          <li>{t("WS_NAME_OF_BRANCH")}</li>
          <li>{t("WS_IFSC_CODE")}</li>
          <li>{t("WS_BANK_ACCOUNT_NO")}</li>
        </ul>

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_DOCUMENTS")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_DOC_IDENTITY_PROOF")}</li>
          <li>{t("WS_DOC_ADDRESS_PROOF")}</li>
          <li>{t("WS_DOC_ELECTRICITY_BILL")}</li>
          <li>{t("WS_DOC_PLUMBER_REPORT")}</li>
          <li>{t("WS_DOC_BUILDING_PLAN")}</li>
          <li>{t("WS_DOC_PROPERTY_TAX_RECEIPT")}</li>
          <li>{t("WS_DOC_APPLICANT_PHOTOGRAPH")}</li>
        </ul>

        {/* <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_DECLARATION")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_DOC_IDENTITY_PROOF")}</li>
          <li>{t("WS_DOC_ADDRESS_PROOF")}</li>
          <li>{t("WS_DOC_ELECTRICITY_BILL")}</li>
          <li>{t("WS_DOC_PLUMBER_REPORT")}</li>
          <li>{t("WS_DOC_BUILDING_PLAN")}</li>
          <li>{t("WS_DOC_PROPERTY_TAX_RECEIPT")}</li>
          <li>{t("WS_DOC_APPLICANT_PHOTOGRAPH")}</li>
        </ul> */}

        {!hasProperty || (hasProperty?.code === "YES" && !selectedProperty) ? (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={() => {}} disabled={true} />
        ) : (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={handleNext} disabled={(hasProperty?.code === "NO" && isEmployee)}/>
        )}
      </Card>
    </React.Fragment>
  );
};

export default WSInfoPage;
