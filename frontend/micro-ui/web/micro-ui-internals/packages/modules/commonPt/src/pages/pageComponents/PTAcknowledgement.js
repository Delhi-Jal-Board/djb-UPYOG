import { Banner, Card, CardText, LinkButton, Loader, Row, StatusTable, SubmitBar } from "@djb25/digit-ui-react-components";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useHistory } from "react-router-dom";
// import getPTAcknowledgementData from "../../../getPTAcknowledgementData";
import { convertToPropertyLightWeight, convertToUpdatePropertyLightWeight } from "../utils";

const GetActionMessage = (props) => {
  const { t } = useTranslation();
  if (props.isSuccess) {
    return !window.location.href.includes("edit-application") ? (window.location.href.includes("employee") ?  t("CS_NEW_PROPERTY_APPLICATION_CREATED_SUCCESS") : t("CS_NEW_PROPERTY_APPLICATION_SUBMITTED_SUCCESS")) : t("CS_PROPERTY_UPDATE_APPLICATION_SUCCESS");
  } else if (props.isLoading) {
    return !window.location.href.includes("edit-application") ? t("CS_PROPERTY_APPLICATION_PENDING") : t("CS_PROPERTY_UPDATE_APPLICATION_PENDING");
  } else if (!props.isSuccess) {
    return !window.location.href.includes("edit-application") ? t("CS_PROPERTY_APPLICATION_FAILED") : t("CS_PROPERTY_UPDATE_APPLICATION_FAILED");
  }
};

const rowContainerStyle = {
  padding: "4px 0px",
  justifyContent: "space-between",
};

const BannerPicker = (props) => {
  return (
    <Banner
      message={GetActionMessage(props)}
      applicationNumber={props.data?.Properties?.[0]?.acknowldgementNumber}
      info={props.isSuccess ? props.t("PT_APPLICATION_NO") : ""}
      successful={props.isSuccess}
    />
  );
};

const PTAcknowledgement = ({ onSuccess, onSelect, formData, redirectUrl, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const stateId = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();

  let data = location?.state?.data;
  if (onSelect) {
    data = formData?.cptNewProperty?.property;
  }
  const propertyFromState = location?.state?.property || (onSelect && formData?.cptNewProperty?.property ? formData?.cptNewProperty?.property : null);

  let createNUpdate = false;
  let { data: mdmsConfig, isLoading } = Digit.Hooks.pt.useMDMS(stateId, "PropertyTax", "PTWorkflow");
  (mdmsConfig?.PropertyTax?.PTWorkfow || []).forEach((data) => {
    if (data.enable) {
      if (data.businessService.includes("WNS")) {
        createNUpdate = true;
      }
    }
  });

  const mutation = Digit.Hooks.pt.usePropertyAPI(
    data?.locationDet?.city ? data.locationDet?.city?.code : tenantId,
    true // create
  );

  const mutationForUpdate = Digit.Hooks.pt.usePropertyAPI(
    data?.locationDet?.city ? data.locationDet?.city?.code : tenantId,
    false // update
  );

  const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const { tenants } = storeData || {};

  useEffect(() => {
    if (propertyFromState) return; // Skip if already created
    try {
      let tenant = userType === "employee" ? tenantId : data?.locationDet?.city?.code;
      data.tenantId = tenant;

      let formdata = convertToPropertyLightWeight(data);
      formdata.Property.tenantId = formdata?.Property?.tenantId || tenant;

      mutation.mutate(formdata, {
        onSuccess,
      });

      if (!createNUpdate) {
        if (!(mutation.isLoading && mutation.isIdle)) {
          if (mutation.isSuccess) {
            /* setTimeout(() => {
              const queryParams = new URLSearchParams(location.search);
              const redirectUrlFromQuery = queryParams.get("redirectToUrl");
              const finalRedirectUrl = (redirectUrl && redirectUrl !== "undefined") ? redirectUrl : (redirectUrlFromQuery && redirectUrlFromQuery !== "undefined" ? redirectUrlFromQuery : null);
              if (finalRedirectUrl) {
                history.push(`${finalRedirectUrl}?propertyId=${mutation?.data?.Properties[0]?.propertyId}&tenantId=${formdata.Property.tenantId}`, {
                  ...location?.state?.prevState,
                });
                const scrollConst = finalRedirectUrl?.includes("employee/tl") ? 1600 : 300;
                setTimeout(() => window.scrollTo(0, scrollConst), 400);
                return;
              }
            }, 3000); */
          }
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    let tenant = userType === "employee" ? tenantId : data?.locationDet?.city?.code;

    const queryParams = new URLSearchParams(location.search);
    const redirectUrlFromQuery = queryParams.get("redirectToUrl");
    const finalRedirectUrl = (redirectUrl && redirectUrl !== "undefined") ? redirectUrl : (redirectUrlFromQuery && redirectUrlFromQuery !== "undefined" ? redirectUrlFromQuery : null);

    if (mutation.isSuccess) {
      /* setTimeout(() => {
        if (finalRedirectUrl) {
          history.push(`${finalRedirectUrl}?propertyId=${mutation?.data?.Properties[0]?.propertyId}&tenantId=${tenant}`, {
            ...location?.state?.prevState,
          });
          const scrollConst = finalRedirectUrl?.includes("employee/tl") ? 1600 : 300;
          setTimeout(() => window.scrollTo(0, scrollConst), 400);
          return;
        }
      }, 3000); */
    }
  }, [mutation]);

  useEffect(() => {
    if (mutation.isSuccess && createNUpdate) {
      try {
        let tenant = userType === "employee" ? tenantId : data?.locationDet?.city?.code;
        data.tenantId = tenant;

        let formdata = convertToUpdatePropertyLightWeight(data);
        formdata.Property.tenantId = formdata?.Property?.tenantId || tenant;

        mutationForUpdate.mutate(formdata, {
          onSuccess,
        });

        if (mutationForUpdate.isSuccess) {
          /* setTimeout(() => {
            if (redirectUrl) {
              history.push(
                `${redirectUrl}?propertyId=${mutationForUpdate?.data?.Properties[0]?.propertyId}&tenantId=${mutationForUpdate?.data?.Properties[0]?.tenantId}`,
                { ...location?.state?.prevState }
              );
              const scrollConst = redirectUrl?.includes("employee/tl") ? 1600 : 300;
              setTimeout(() => window.scrollTo(0, scrollConst), 400);
              return;
            }
          }, 3000); */
        }
      } catch (er) {}
    }
  }, [mutation.isSuccess]);

  const isMutationLoading = propertyFromState ? false : (mutation.isLoading || mutation.isIdle);
  const isMutationSuccess = propertyFromState ? true : mutation.isSuccess;
  const responseData = propertyFromState ? { Properties: [propertyFromState] } : mutation.data;

  const onNext = () => {
    if (isMutationSuccess) {
      sessionStorage.setItem("Digit_OBPS_PT",JSON.stringify(responseData?.Properties?.[0]))
      sessionStorage.setItem("Digit_FSM_PT",JSON.stringify(responseData?.Properties?.[0]))
      
      const queryParams = new URLSearchParams(location.search);
      const redirectUrlFromQuery = queryParams.get("redirectToUrl");
      const finalRedirectUrl = (redirectUrl && redirectUrl !== "undefined") ? redirectUrl : (redirectUrlFromQuery && redirectUrlFromQuery !== "undefined" ? redirectUrlFromQuery : null);
      
      if (finalRedirectUrl) {
        history.push(
          `${finalRedirectUrl}?propertyId=${responseData?.Properties[0]?.propertyId}&tenantId=${responseData?.Properties[0]?.tenantId}`,
          { ...location?.state?.prevState }
        );
        return;
      }

      if (onSelect) {
        onSelect("cpt", { details: responseData?.Properties?.[0] });
      }
    }
  };

  return isMutationLoading ? (
    <Loader />
  ) : (
    <Card>
      <BannerPicker t={t} data={responseData} isSuccess={isMutationSuccess} isLoading={isMutationLoading} />
      {isMutationSuccess && <CardText>{window.location.href.includes("employee") ? t("CS_CREATE_PROPERTY_SUCCESS_EMP_RESPONSE") : t("CS_CREATE_PROPERTY_SUCCESS_CITIZEN_RESPONSE")}</CardText>}
      {!isMutationSuccess && <CardText>{t("CS_FILE_PROPERTY_FAILED_RESPONSE")}</CardText>}

      <StatusTable>
        {isMutationSuccess && (
          <Row
            rowContainerStyle={rowContainerStyle}
            last
            label={t("PT_COMMON_TABLE_COL_PT_ID")}
            text={responseData?.Properties[0]?.propertyId}
            textStyle={{ whiteSpace: "pre", width: "200%" }}
          />
        )}
      </StatusTable>
      {/* {mutation.isSuccess && !onSelect && <SubmitBar label={t("PT_DOWNLOAD_ACK_FORM")} onSubmit={null} />} */}
      {isMutationSuccess &&
        (window.location.href.includes("/citizen/") || window.location.href.includes("/employee/")) &&
        (onSelect ? (
          <SubmitBar label={t("CS_COMMON_PROCEED")} onSubmit={onNext} />
        ) : (
          <SubmitBar
            label={t("CS_COMMON_PROCEED")}
            onSubmit={() => {
              const queryParams = new URLSearchParams(location.search);
              const redirectUrlFromQuery = queryParams.get("redirectToUrl");
              const finalRedirectUrl = (redirectUrl && redirectUrl !== "undefined") ? redirectUrl : (redirectUrlFromQuery && redirectUrlFromQuery !== "undefined" ? redirectUrlFromQuery : null);
              if (finalRedirectUrl) {
                history.push(
                  `${finalRedirectUrl}?propertyId=${responseData?.Properties[0]?.propertyId}&tenantId=${responseData?.Properties[0]?.tenantId}`,
                  { ...location?.state?.prevState }
                );
              } else {
                history.push(window.location.href.includes("/employee/") ? "/digit-ui/employee" : "/digit-ui/citizen");
              }
            }}
          />
        ))}
    </Card>
  );
};

export default PTAcknowledgement;
