import { FormComposer, Loader, Dropdown, Localities, Header, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { newConfig } from "../../config/Create/config";
import _, { create, unset } from "lodash";
import { convertToPropertyLightWeight } from "../utils";

const CreatePropertyForm = ({ config, onSelect, value, userType, redirectUrl }) => {
  const [showToast, setShowToast] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const tenants = Digit.Hooks.pt.useTenants();
  const { t } = useTranslation();
  const location = useLocation();

  const [canSubmit, setCanSubmit] = useState(true);
  const defaultValues = React.useMemo(() => ({ ...value }), []);
  const history = useHistory();
  const match = useRouteMatch();
  sessionStorage.setItem("VisitedCommonPTSearch", true);
  sessionStorage.setItem("VisitedLightCreate", true);
  const isMobile = window.Digit.Utils.browser.isMobile();

  let allCities = Digit.Hooks.pt.useTenants()?.sort((a, b) => a?.i18nKey?.localeCompare?.(b?.i18nKey));
  if (window.location.href.includes("obps")) {
    allCities = Digit.SessionStorage.get("OBPS_TENANTS");
  }
  if (window.location.href.includes("fsm")) {
    allCities = Digit.SessionStorage.get("FSM_TENANTS");
  }
  const [formValue, setFormValue] = useState("");
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    if (location?.state && (!owners || owners.length === 0)) {
      const applicant = location.state?.applicant;
      const contact = location.state?.contact;
      const useDetails = location.state?.useDetails;
      const propertyAddress = location.state?.propertyAddress;

      if (applicant && contact) {
        setOwners([
          {
            name: `${applicant.firstName}${applicant.middleName ? ` ${applicant.middleName}` : ""}${
              applicant.lastName ? ` ${applicant.lastName}` : ""
            }`,
            mobileNumber: contact.mobileNumber,
            gender: useDetails?.gender || { code: "MALE", name: "Male" },
            fatherOrHusbandName: applicant.ParentorSpouse || "NA",
            relationship: { code: "FATHER", name: "Father" },
            ownerType: { code: "NONE", name: "None" },
            ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
          },
        ]);
      }

      if (propertyAddress || useDetails) {
        const initialFormValue = {
          locationDet: {
            cityCode: propertyAddress?.cityCode || propertyAddress?.city,
            locality: propertyAddress?.locality,
            houseDoorNo: propertyAddress?.houseNo || propertyAddress?.houseDoorNo,
            buildingColonyName: propertyAddress?.street || propertyAddress?.buildingColonyName,
            landmarkName: propertyAddress?.landmark || propertyAddress?.landmarkName,
          },
          waterConnection: {
            useDetails: useDetails,
          },
        };
        setFormValue(initialFormValue);
      }
    }
  }, [location?.state]);
  const [cityCode, setCityCode] = useState("");
  let enableSkip = userType == "employee" ? false : config?.isSkipEnabled || sessionStorage.getItem("skipenabled");
  // delete
  // const [_formData, setFormData,_clear] = Digit.Hooks.useSessionStorage("store-data",null);
  const [mutationHappened, setMutationHappened, clear] = Digit.Hooks.useSessionStorage("EMPLOYEE_MUTATION_HAPPENED", false);
  const [successData, setsuccessData, clearSuccessData] = Digit.Hooks.useSessionStorage("EMPLOYEE_MUTATION_SUCCESS_DATA", {});
  const { data: commonFields, isLoading } = Digit.Hooks.pt.useMDMS(Digit.ULBService.getStateId(), "PropertyTax", "CommonFieldsConfig");

  const mutation = Digit.Hooks.pt.usePropertyAPI(
    tenantId,
    true // create
  );

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
  }, []);

  const currentConfig = React.useMemo(() => {
    const isEmployee = userType === "employee" || window.location.href.includes("/employee/");
    return newConfig.filter((step) => {
      if (step.head === "PT_OWNERSHIP_DETAILS" && !isEmployee) {
        return false;
      }
      return true;
    });
  }, [userType]);

  if (isLoading) {
    return <Loader />;
  }

  const onSubmit = async () => {
    const loc = formValue?.locationDet;
    if (!loc?.addressType || !loc?.city || !loc?.pincode || !loc?.locality || !loc?.buildingColonyName) {
      setShowToast({ key: true, label: "Please fill all the mandatory fields" });
      return;
    }

    let ownersArray = owners && owners.length > 0 ? owners : formValue?.owners;
    // Inject logged in user details if ownersArray is empty
    if (!ownersArray || ownersArray.length === 0) {
      const userInfo = Digit.UserService.getUser()?.info;
      ownersArray = [
        {
          name: userInfo?.name || "Citizen",
          mobileNumber: userInfo?.mobileNumber,
          gender: { code: userInfo?.gender || "MALE", name: userInfo?.gender || "Male" },
          fatherOrHusbandName: "NA",
          relationship: { code: "FATHER", name: "Father" },
          ownerType: { code: "NONE", name: "None" },
          ownershipCategory: "INDIVIDUAL.SINGLEOWNER",
        }
      ];
    }

    if (
      (formValue?.owners?.ownershipCategory?.includes("MULTIPLEOWNERS") ||
        formValue?.owners?.[0]?.ownershipCategory?.code?.includes("MULTIPLEOWNERS")) &&
      formValue?.owners?.length == 1
    ) {
      setShowToast({ key: true, label: "PT_COMMON_ONE_MORE_OWNER_INFROMATION_REQUIRED" });
    } else {
      const payload = convertToPropertyLightWeight({ ...formValue, owners: ownersArray });
      payload.Property.tenantId = tenantId;

      mutation.mutate(payload, {
        onSuccess: (data) => {
          if (data?.Errors && data?.Errors.length > 0) {
            setShowToast({ key: true, label: data?.Errors[0]?.message || t("PT_COMMON_FAILED_TO_CREATE_PROPERTY") });
            return;
          }
          setShowToast({ key: false, label: `${t("CS_NEW_PROPERTY_APPLICATION_CREATED_SUCCESS")} - ${data?.Properties?.[0]?.propertyId}` });
          setTimeout(() => {
            if (onSelect) {
              onSelect("cptNewProperty", { property: data?.Properties?.[0] });
            } else {
              history.push(`${match.path}/save-property?redirectToUrl=${redirectUrl || ""}`, {
                property: data?.Properties?.[0]
              });
            }
          }, 3000);
        },
        onError: (error) => {
          setShowToast({ key: true, label: error?.response?.data?.Errors?.[0]?.message || t("PT_COMMON_FAILED_TO_CREATE_PROPERTY") });
        },
      });
    }
  };

  const onSkip = () => {
    onSelect("isSkip", true);
  };

  const onFormValueChange = (setValue, data, formState) => {
    // const city = data?.locationDet?.city;
    // const locality = data?.locationDet?.locality;

    // if (city?.code !== cityCode) {
    //   setCityCode(city?.code);
    // }
    if (!_.isEqual(data, formValue)) {
      setFormValue(data);
    }

    const currentData = { ...formValue, ...data };
    setCanSubmit(true);

    // if (!locality) {
    //   setCanSubmit(false);
    //   return;
    // }

    // setCanSubmit(true);
  };

  const getHeaderLabel = () => {
    let url = window.location.href;
    let moduleName = url?.split("=")?.[1]?.split("/")?.[3];
    if (moduleName) return t(`ES_COMMON_CREATE_PROPERTY_HEADER_${moduleName?.toUpperCase()}`);
    else return t("ES_COMMON_CREATE_PROPERTY_HEADER");
  };


  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={[{ timeLine: [{ actions: getHeaderLabel(), currentStep: 1 }] }]} showFinalStep={false} />
        <FormComposer
          onSkip={onSkip}
          showSkip={enableSkip}
          skipStyle={isMobile ? {} : { textAlign: "right", marginRight: "55px" }}
          onSubmit={onSubmit}
          noBoxShadow
          inline
          config={currentConfig}
          label={t("SUBMIT")}
          isDisabled={!canSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
          noCard={true}
        />
      </div>
      {showToast && (
        <Toast
          error={showToast.key}
          label={showToast.label}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default CreatePropertyForm;
