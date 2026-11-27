import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import {
  Card,
  CardSectionHeader,
  StatusTable,
  Row,
  SubmitBar,
  LinkButton,
  EditIcon,
  ActionBar,
  Toast,
  VerticalTimeline,
} from "@djb25/digit-ui-react-components";
import { convertToPropertyLightWeight } from "../utils";

const getText = (val) => {
  if (val === undefined || val === null || val === "") return "NA";
  if (typeof val === "object") {
    return val?.name || val?.i18nKey || val?.code || val?.value || "NA";
  }
  return String(val);
};

const getLocalizedText = (val, t) => {
  if (val === undefined || val === null || val === "") return "NA";
  if (typeof val === "object") {
    const key = val?.i18nKey || val?.code || val?.name || val?.value;
    return key ? t(key) : "NA";
  }
  return t(val);
};

const PropertyPreview = ({ onSelect, redirectUrl, userType, onSuccess }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const basePath = location.pathname.replace(/\/preview\/?$/, "");

  const previewData = location?.state?.formData || Digit.SessionStorage.get("PT_CREATE_PROPERTY_DATA") || {};

  const locationDet = previewData?.locationDet || {};
  const useDetails = previewData?.waterConnection?.useDetails || previewData?.useDetails || {};

  const rawOwners = previewData?.owners || [];
  const owners = (Array.isArray(rawOwners) && rawOwners.length > 0 ? rawOwners : []).map((owner) => {
    const fullName = owner?.name || "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = owner?.firstName || (nameParts.length > 0 && nameParts[0] ? nameParts[0] : "");
    const middleName = owner?.middleName || (nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "");
    const lastName = owner?.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "");
    const computedName = fullName || [firstName, middleName, lastName].filter(Boolean).join(" ");
    return {
      ...owner,
      firstName: firstName || "NA",
      middleName: middleName || "",
      lastName: lastName || "",
      name: computedName || "NA",
    };
  });

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const mutationTenantId = locationDet?.city?.code || locationDet?.city || tenantId;

  const mutation = Digit.Hooks.pt.usePropertyAPI(mutationTenantId, true);

  useEffect(() => {
    if (!previewData?.locationDet && !previewData?.waterConnection && !previewData?.owners) {
      history.replace(basePath);
    }
  }, [previewData, basePath, history]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const getHeaderLabel = () => {
    const key = "CS_COMMON_PREVIEW_PROPERTY_DETAILS";
    const trans = t(key);
    return trans && trans !== key ? trans : "Preview Property Details";
  };

  const handleEdit = () => {
    history.push({
      pathname: basePath,
      search: location.search,
      state: { formData: previewData, redirectUrl },
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = convertToPropertyLightWeight(previewData);
      payload.Property.tenantId = mutationTenantId;

      mutation.mutate(payload, {
        onSuccess: (data) => {
          setIsSubmitting(false);
          if (data?.Errors && data?.Errors.length > 0) {
            setShowToast({
              key: true,
              label: data?.Errors[0]?.message || t("PT_COMMON_FAILED_TO_CREATE_PROPERTY"),
            });
            return;
          }
          Digit.SessionStorage.del("PT_CREATE_PROPERTY_DATA");

          const createdProperty = data?.Properties?.[0];
          if (createdProperty) {
            sessionStorage.setItem("Digit_OBPS_PT", JSON.stringify(createdProperty));
            sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(createdProperty));
          }

          if (onSuccess) onSuccess();
          if (onSelect) {
            onSelect("cptNewProperty", { property: createdProperty });
          }

          const propertyId = createdProperty?.propertyId || "";
          const createdTenantId = createdProperty?.tenantId || mutationTenantId;
          const queryParams = new URLSearchParams(location.search);
          const redirectUrlFromQuery = queryParams.get("redirectToUrl") || queryParams.get("redirectUrl");
          const fallbackUrl = window.location.href.includes("/employee/") ? "/digit-ui/employee/ws/info" : "/digit-ui/citizen/ws/info";
          const finalRedirectUrl =
            redirectUrl && redirectUrl !== "undefined"
              ? redirectUrl
              : redirectUrlFromQuery && redirectUrlFromQuery !== "undefined"
              ? redirectUrlFromQuery
              : fallbackUrl;

          const isWsInfo = finalRedirectUrl.includes("ws/info");
          const separator = finalRedirectUrl.includes("?") ? "&" : "?";
          const targetUrl = isWsInfo
            ? `${finalRedirectUrl}${separator}hasProperty=YES&propertyId=${propertyId}`
            : `${finalRedirectUrl}${separator}propertyId=${propertyId}&tenantId=${createdTenantId}`;

          history.push(targetUrl, {
            property: createdProperty,
            propertyId: propertyId,
            hasProperty: "YES",
            fromPropertyCreate: true,
            ...location?.state?.prevState,
          });
        },
        onError: (error) => {
          setIsSubmitting(false);
          setShowToast({
            key: true,
            label: error?.response?.data?.Errors?.[0]?.message || t("PT_COMMON_FAILED_TO_CREATE_PROPERTY"),
          });
        },
      });
    } catch (err) {
      setIsSubmitting(false);
      setShowToast({
        key: true,
        label: err?.message || t("PT_COMMON_FAILED_TO_CREATE_PROPERTY"),
      });
    }
  };

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper" style={{ marginBottom: "80px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <VerticalTimeline
          config={[
            {
              timeLine: [{ actions: getHeaderLabel(), currentStep: 2 }],
            },
          ]}
          showFinalStep={false}
        />

        {/* Main Content: Single vertically-stacked card matching summary style */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Card style={{ width: "100%", padding: "28px 36px", margin: 0 }}>
            {/* Section 1: Property Address */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0b0c0c", margin: 0 }}>{t("PT_PROPERTY_ADDRESS_SUB_HEADER")}</h2>
              <LinkButton
                label={<EditIcon style={{ width: "20px", height: "20px", cursor: "pointer" }} />}
                className="check-page-link-button"
                onClick={handleEdit}
                style={{ margin: 0, padding: "4px" }}
              />
            </div>
            <StatusTable style={{ marginBottom: "36px" }}>
              <Row label={t("MYCITY_CODE_LABEL")} text={getLocalizedText(locationDet?.city, t)} />
              <Row label={t("CORE_COMMON_PINCODE")} text={getText(locationDet?.pincode)} />
              <Row label={t("PT_PROPERTY_ADDRESS_LOCALITY")} text={getLocalizedText(locationDet?.locality, t)} />
              {locationDet?.subLocality ? <Row label={t("PT_PROPERTY_ADDRESS_SUB_LOCALITY")} text={getText(locationDet?.subLocality)} /> : null}
              {locationDet?.colonyMcdCategory ? <Row label={t("WS_COLONY_CATEGORY")} text={getText(locationDet?.colonyMcdCategory)} /> : null}
              {locationDet?.streetName || locationDet?.street ? (
                <Row label={t("PT_PROPERTY_ADDRESS_STREET_NAME")} text={getText(locationDet?.streetName || locationDet?.street)} />
              ) : null}
              <Row label={t("PT_PROPERTY_ADDRESS_HOUSE_NO")} text={getText(locationDet?.houseNo || locationDet?.houseDoorNo)} />
              <Row label={t("WS_CONSUMER_RESIDES_FLOOR")} text={getLocalizedText(locationDet?.noOfFloors || locationDet?.numberOfFloors, t)} />
              <Row label={t("WS_TOTAL_FLOORS_IN_BUILDING")} text={getText(locationDet?.totalNoOfFloors || locationDet?.totalFloors)} />
              {/* <Row label={t("PT_PROPERTY_ADDRESS_LINE_1")} text={getText(locationDet?.addressLine1)} /> */}
              <Row label={t("PT_PROPERTY_ADDRESS_LINE_2")} text={getText(locationDet?.addressLine2 || "NA")} />
              <Row label={t("PT_PROPERTY_ADDRESS_LANDMARK")} text={getText(locationDet?.landmark || locationDet?.landmarkName)} />
              <Row label={t("CORE_COMMON_LATITUDE")} text={getText(locationDet?.latitude)} />
              <Row label={t("CORE_COMMON_LONGITUDE")} text={getText(locationDet?.longitude)} />
              <Row label={t("WS_ASSEMBLY")} text={getText(locationDet?.assembly)} />
              <Row label={t("WS_WARD")} text={getText(locationDet?.block || locationDet?.ward)} />
              <Row label={t("WS_ZONE")} text={getText(locationDet?.zone)} />
              {locationDet?.actualAssembly ? <Row label={t("WS_ACTUAL_ASSEMBLY")} text={getText(locationDet?.actualAssembly)} /> : null}
              {locationDet?.actualWard ? <Row label={t("WS_ACTUAL_WARD")} text={getText(locationDet?.actualWard)} /> : null}
              {locationDet?.actualZone ? <Row label={t("WS_ACTUAL_ZONE")} text={getText(locationDet?.actualZone)} /> : null}
            </StatusTable>

            {/* Section 2: Proposed Usage Details */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                marginTop: "32px",
                borderTop: "1px solid #e5ebf3",
                paddingTop: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0b0c0c", margin: 0 }}>{t("WS_PROPOSED_USAGE_DETAILS")}</h2>
              <LinkButton
                label={<EditIcon style={{ width: "20px", height: "20px", cursor: "pointer" }} />}
                className="check-page-link-button"
                onClick={handleEdit}
                style={{ margin: 0, padding: "4px" }}
              />
            </div>
            <StatusTable style={{ marginBottom: "36px" }}>
              <Row label={t("WS_PROPERTY_TYPE")} text={getLocalizedText(useDetails?.propertyType, t)} />
              <Row label={t("WS_CATEGORY_TYPE")} text={getLocalizedText(useDetails?.categoryType, t)} />
              <Row label={t("WS_PROPERTY_CATEGORY")} text={getLocalizedText(useDetails?.propertyCategory, t)} />
              <Row label={t("WS_WATER_CONNECTION_USAGE_TYPE")} text={getLocalizedText(useDetails?.WaterConnectionUsageType, t)} />
              <Row label={t("WS_PLOT_AREA")} text={getText(useDetails?.plotArea)} />
              <Row label={t("WS_BUILT_UP_AREA")} text={getText(useDetails?.builtUpArea)} />
              <Row label={t("WS_HEIGHT_OF_THE_BUILDING")} text={getText(useDetails?.heightOfTheBuilding)} />
              <Row label={t("WS_SELECT_YEAR_OF_CONSTRUCTION")} text={getText(useDetails?.SelectYearofConstruction || "NA")} />
              {Array.isArray(useDetails?.questions) &&
                useDetails.questions.map((qItem, idx) => (
                  <Row key={`q_prev_${idx}`} label={qItem?.question || `Question ${idx + 1}`} text={getText(qItem?.answer)} />
                ))}
              {/* Mixed Occupancy Details - Only for Institutional property category */}
              {(String(
                (typeof useDetails?.propertyCategory === "object"
                  ? useDetails?.propertyCategory?.code || useDetails?.propertyCategory?.name
                  : useDetails?.propertyCategory) ||
                  (typeof previewData?.propertyCategory === "object"
                    ? previewData?.propertyCategory?.code || previewData?.propertyCategory?.name
                    : previewData?.propertyCategory) ||
                  ""
              )
                .toUpperCase()
                .trim() === "INSTITUTIONAL") && (
                <React.Fragment>
                  <Row
                    label={t("WS_IS_PROPERTY_USED_FOR_MIXED_OCCUPANCIES") || "Mixed Occupancies"}
                    text={
                      useDetails?.isMixedOccupancy === "YES" || previewData?.isMixedOccupancy === "YES"
                        ? t("CS_COMMON_YES") || "Yes"
                        : useDetails?.isMixedOccupancy === "NO" || previewData?.isMixedOccupancy === "NO"
                        ? t("CS_COMMON_NO") || "No"
                        : "NA"
                    }
                  />
                  {/* If Mixed Occupancy is YES, show the usage list */}
                  {(useDetails?.isMixedOccupancy === "YES" || previewData?.isMixedOccupancy === "YES") &&
                    Array.isArray(useDetails?.mixedOccupancyDetails || previewData?.mixedOccupancyDetails) &&
                    (useDetails?.mixedOccupancyDetails || previewData?.mixedOccupancyDetails).length > 0 && (
                      <div style={{ marginTop: "12px", paddingTop: "12px" }}>
                        <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "8px", color: "#0b0c0c" }}>
                          {t("WS_MIXED_OCCUPANCY_DETAILS")}:
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #d1d5db" }}>
                              <th style={{ padding: "6px 10px", textAlign: "left" }}>{t("CS_COMMON_S_NO")}</th>
                              <th style={{ padding: "6px 10px", textAlign: "left" }}>{t("WS_PROPERTY_TYPE")}</th>
                              <th style={{ padding: "6px 10px", textAlign: "left" }}>{t("WS_BUILT_UP_AREA")}</th>
                              <th style={{ padding: "6px 10px", textAlign: "left" }}>{t("WS_HEIGHT_OF_THE_BUILDING(meters)")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(useDetails?.mixedOccupancyDetails || previewData?.mixedOccupancyDetails).map((r, i) => (
                              <tr key={`prev_mixed_${i}`} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "6px 10px" }}>{i + 1}</td>
                                <td style={{ padding: "6px 10px", fontWeight: "600" }}>{r.propertyTypeName || r.propertyTypeCode}</td>
                                <td style={{ padding: "6px 10px" }}>{r.builtUpArea} sq. meter</td>
                                <td style={{ padding: "6px 10px" }}>{r.heightOfTheBuilding} meter</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </React.Fragment>
              )}
              {/* {useDetails?.NumberofDwellingUnits ? (
                <Row
                  label={t("WS_NUMBER_OF_DWELLING_UNITS")}
                  text={getText(useDetails?.NumberofDwellingUnits)}
                />
              ) : null}
              {useDetails?.NumberofRooms ? (
                <Row label={t("WS_NUMBER_OF_ROOMS")} text={getText(useDetails?.NumberofRooms)} />
              ) : null}
              {useDetails?.numberOfBeds ? (
                <Row label={t("WS_NUMBER_OF_BEDS")} text={getText(useDetails?.numberOfBeds)} />
              ) : null}
              {useDetails?.numberOfStudents ? (
                <Row label={t("WS_NUMBER_OF_STUDENTS")} text={getText(useDetails?.numberOfStudents)} />
              ) : null} */}
            </StatusTable>

            {/* Section 3: Owner details */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                marginTop: "32px",
                borderTop: "1px solid #e5ebf3",
                paddingTop: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0b0c0c", margin: 0 }}>{t("PT_OWNER_DETAILS")}</h2>
              <LinkButton
                label={<EditIcon style={{ width: "20px", height: "20px", cursor: "pointer" }} />}
                className="check-page-link-button"
                onClick={handleEdit}
                style={{ margin: 0, padding: "4px" }}
              />
            </div>
            {owners && Array.isArray(owners) && owners.length > 0 ? (
              owners.map((owner, idx) => (
                <StatusTable
                  key={idx}
                  style={idx > 0 ? { marginTop: "20px", borderTop: "1px dashed #d6d5d4", paddingTop: "16px" } : { marginBottom: "20px" }}
                >
                  {owners.length > 1 && (
                    <CardSectionHeader style={{ marginBottom: "12px", fontSize: "16px" }}>{`${t("PT_OWNER")} ${idx + 1}`}</CardSectionHeader>
                  )}
                  <Row label={t("PT_FORM3_MOBILE_NUMBER")} text={getText(owner?.mobileNumber)} />
                  <Row label={t("CORE_COMMON_FIRST_NAME")} text={getText(owner?.firstName)} />
                  {owner?.middleName ? <Row label={t("CORE_COMMON_MIDDLE_NAME")} text={getText(owner?.middleName)} /> : null}
                  {owner?.lastName ? <Row label={t("CORE_COMMON_LAST_NAME")} text={getText(owner?.lastName)} /> : null}
                  {owner?.emailId || owner?.email ? <Row label={t("CORE_COMMON_EMAIL_ID")} text={getText(owner?.emailId || owner?.email)} /> : null}
                  <Row label={t("PT_FORM3_GENDER")} text={getLocalizedText(owner?.gender, t)} />
                </StatusTable>
              ))
            ) : (
              <StatusTable>
                <Row label={t("PT_OWNER_DETAILS")} text={"NA"} />
              </StatusTable>
            )}
          </Card>
        </div>
      </div>

      <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <SubmitBar
          label={t("CS_COMMON_BACK")}
          onSubmit={handleEdit}
          style={{
            marginRight: "16px",
          }}
        />
        <SubmitBar
          label={
            isSubmitting
              ? t("CS_COMMON_SUBMITTING")
              : t("CS_COMMON_PROCEED") && t("CS_COMMON_PROCEED") !== "CS_COMMON_PROCEED"
              ? t("CS_COMMON_PROCEED")
              : "Continue Application for New Connection"
          }
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          style={{
            whiteSpace: "nowrap",
            width: "auto",
            minWidth: "320px",
            padding: "0 24px",
          }}
        />
      </ActionBar>

      {showToast && <Toast error={showToast.key} label={showToast.label} isDleteBtn={true} onClose={() => setShowToast(null)} />}
    </React.Fragment>
  );
};

export default PropertyPreview;
