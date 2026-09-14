import React, { useState } from "react";
import { FormStep, TextInput, CardLabel, MobileNumber, RadioButtons, Dropdown } from "@djb25/digit-ui-react-components";

const EmergencyFixedPointApplicantDetails = ({ t, config, onSelect, formData }) => {
  const user = Digit.UserService.getUser().info;
  const inputStyles = { width: user.type === "EMPLOYEE" ? "100%" : "86%" };
  let validation = {};
  const [applicantName, setName] = useState(
    (user.type === "EMPLOYEE" ? "" : user?.name) ||
    formData?.owner?.applicantName ||
    formData?.infodetails?.existingDataSet?.owner?.applicantName ||
    ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    (user.type === "EMPLOYEE" ? "" : user?.mobileNumber) ||
    formData?.owner?.mobileNumber ||
    formData?.infodetails?.existingDataSet?.owner?.mobileNumber ||
    ""
  );
  const [gender, setGender] = useState(formData?.owner?.gender || "");
  const [dateOfBirth, setDateofBirth] = useState(formData?.owner?.dateOfBirth || formData?.owner?.requestDetails?.applicantName || "");
  const [emailId, setEmail] = useState(
    (user.type === "EMPLOYEE" ? "" : user?.emailId) || formData?.owner?.emailId || formData?.infodetails?.existingDataSet?.owner?.emailId || ""
  );
  const [alternateNumber, setAltMobileNumber] = useState(
    formData?.owner?.alternateNumber || formData?.infodetails?.existingDataSet?.owner?.alternateNumber || ""
  );
  const [guardianName, setGuardian] = useState(formData?.owner?.guardianName || "");
  const [relationShipType, setRelationShipType] = useState(formData?.owner?.relationShipType || "");

  // New Dropdown States
  const [fixedPoint, setFixedPoint] = useState(formData?.owner?.fixedPoint || "");
  const [autoPopulatedAddress, setAutoPopulatedAddress] = useState(null);

  // New Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearch = React.useCallback((val) => {
    setSearchQuery(val);
  }, []);

  const handleFixedPointSelect = (selected) => {
    setFixedPoint(selected);
    if (selected && typeof selected === "object") {
      const applicant = selected.applicantDetail;
      if (applicant) {
        setName(applicant.name || applicantName);
        setMobileNumber(applicant.mobileNumber || mobileNumber);
        setAltMobileNumber(applicant.alternateNumber || alternateNumber);
        setEmail(applicant.emailId || emailId);
      }

      const addr = selected.address;
      if (addr) {
        const addressData = {
          houseNo: addr.houseNo || "",
          streetName: addr.streetName || "",
          addressLine1: addr.addressLine1 || "",
          addressLine2: addr.addressLine2 || "",
          landmark: addr.landmark || "",
          city: addr.city || "",
          cityCode: addr.cityCode || "",
          locality: addr.locality || "",
          localityCode: addr.localityCode || "",
          pincode: addr.pincode ? addr.pincode.toString().split(".")[0] : "",
        };
        setAutoPopulatedAddress(addressData);

        // Silent update to parent params so AddressDetails picks it up immediately
        onSelect("multiple", {
          address: addressData,
          silent: true
        });
      }
    } else {
      setAutoPopulatedAddress(null);
    }
  };

  const [isExistingFixedPoint, setIsExistingFixedPoint] = useState(
    formData?.owner?.isExistingFixedPoint || { code: "YES", name: "Yes", i18nKey: "YES" }
  );

  const existingFixedPointOptions = [
    { code: "YES", name: "Yes", i18nKey: "YES" },
    { code: "NO", name: "No", i18nKey: "NO" }
  ];

  const handleExistingFixedPointSelect = (selected) => {
    setIsExistingFixedPoint(selected);
    setFixedPoint("");
  };


  function setOwnerName(e) {
    setName(e.target.value);
  }
  function setOwnerEmail(e) {
    setEmail(e.target.value);
  }
  function setMobileNo(e) {
    setMobileNumber(e.target.value);
  }
  function setAltMobileNo(e) {
    setAltMobileNumber(e.target.value);
  }
  function setGuardiansName(e) {
    setGuardian(e.target.value);
  }

  function setBirthDate(e) {
    setDateofBirth(e.target.value);
  }

  const tenantId = Digit.ULBService.getCurrentTenantId();

  // Fetch Fixed Points based on search query
  const { data: fixedPointsData } = Digit.Hooks.wt.useFixedPointSearchAPI(
    {
      tenantId,
      filters: {
        limit: 1000,
        ...(debouncedSearchQuery ? { name: debouncedSearchQuery } : {})
      },
    },
    { enabled: isExistingFixedPoint?.code === "YES" }
  );

  const fixedPointOptions = fixedPointsData?.waterTankerBookingDetail?.map(fp => ({
    ...fp,
    name: fp?.applicantDetail?.name || fp?.applicantDetail?.fixedPointId || "NA",
  })) || [];

  const { data: applicantGender } = Digit.Hooks.useEnabledMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "GenderType" }], {
    select: (data) => {
      const formattedData = data?.["common-masters"]?.["GenderType"];
      return formattedData;
    },
  });

  let genderOptions = [];

  applicantGender &&
    applicantGender.map((genderoption) => {
      if (genderoption.code !== "TRANSGENDER")
        genderOptions.push({ i18nKey: `${genderoption.code}`, code: `${genderoption.code}`, name: `${genderoption.code}` });
    });

  const GuardianOptions = [
    { name: "Husband", code: "HUSBAND", i18nKey: "COMMON_HUSBAND" },
    { name: "Father", code: "FATHER", i18nKey: "COMMON_FATHER" },
  ];

 const goNext = () => {

  let owner = formData.owner || {};

  let applicantDetails = {
    ...owner,
    applicantName:
      isExistingFixedPoint?.code === "YES"
        ? fixedPoint?.applicantDetail?.name || fixedPoint?.name || ""
        : typeof fixedPoint === "string"
          ? fixedPoint
          : fixedPoint?.name || "",

    mobileNumber:
      isExistingFixedPoint?.code === "YES"
        ? fixedPoint?.applicantDetail?.mobileNumber || mobileNumber || ""
        : mobileNumber || "",

    alternateNumber:
      isExistingFixedPoint?.code === "YES"
        ? fixedPoint?.applicantDetail?.alternateNumber || alternateNumber || ""
        : alternateNumber || "",

    emailId:
      isExistingFixedPoint?.code === "YES"
        ? fixedPoint?.applicantDetail?.emailId || emailId || ""
        : emailId || "",

    gender,
    dateOfBirth,
    relationShipType,
    guardianName,
    fixedPoint,
    isExistingFixedPoint,
  };

  if (autoPopulatedAddress) {
    onSelect("multiple", {
      owner: applicantDetails,
      address: autoPopulatedAddress,
      navigationKey: config.key,
    });
  } else {
    onSelect(config.key, applicantDetails, false);
  }
};

  const normalizeForCompare = (val) => {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "object") {
      if (val.code !== undefined) return val.code;
      if (val.uuid !== undefined) return val.uuid;
      if (val.id !== undefined) return val.id;
      try {
        return JSON.stringify(val);
      } catch (e) {
        return String(val);
      }
    }
    return String(val);
  };

  const lastSentValue = React.useRef(null);
  React.useEffect(() => {
    // Skip silent updates if there is no user-entered data yet
    const hasUserData = fixedPoint || mobileNumber || emailId || alternateNumber;
    if (!hasUserData) {
      return;
    }

    let finalApplicantName = "";
    if (isExistingFixedPoint?.code === "YES") {
      finalApplicantName = fixedPoint?.applicantDetail?.name || fixedPoint?.name || "";
    } else {
      finalApplicantName = typeof fixedPoint === "string" ? fixedPoint : fixedPoint?.name || "";
    }

    let applicantDetails = {
      applicantName: finalApplicantName,
      mobileNumber,
      gender,
      dateOfBirth,
      alternateNumber,
      relationShipType,
      guardianName,
      emailId,
      fixedPoint,
      isExistingFixedPoint,
    };

    let isDifferent = false;
    if (!lastSentValue.current) {
      isDifferent = true;
    } else {
      for (const key of Object.keys(applicantDetails)) {
        if (normalizeForCompare(lastSentValue.current[key]) !== normalizeForCompare(applicantDetails[key])) {
          isDifferent = true;
          break;
        }
      }
    }

    // Also verify against the actual parent formData to prevent unnecessary triggers
    const parentOwner = formData?.owner || {};
    let isDifferentFromParent = false;
    for (const key of Object.keys(applicantDetails)) {
      const localVal = normalizeForCompare(applicantDetails[key]);
      const parentVal = normalizeForCompare(parentOwner[key]);
      if (localVal !== parentVal) {
        // Guard: do not overwrite filled parent data with empty values during race conditions
        if (!localVal && parentVal) {
          continue;
        }
        isDifferentFromParent = true;
      }
    }

    if (isDifferent || isDifferentFromParent) {
      lastSentValue.current = applicantDetails;
      onSelect(config.key, { ...applicantDetails, silent: true }, false);
    }
  }, [fixedPoint, isExistingFixedPoint, mobileNumber, gender, dateOfBirth, alternateNumber, relationShipType, guardianName, emailId, onSelect, config.key, formData?.owner]);

  return (
    <React.Fragment>
      <FormStep
        config={config}
        onSelect={goNext}
        t={t}
        isDisabled={
          !fixedPoint || !mobileNumber || config?.additionaFields?.guardianName
            ? !guardianName
            : null || config?.additionaFields?.dateofBirth
              ? !dateOfBirth
              : null || config?.additionaFields?.gender
                ? !gender
                : null
        }
        // className={"search-form-wrapper"}
      >
        <React.Fragment>
          <div className="form-field wns-search-field">
            <CardLabel>
              {`${t("WT_EXISTING_FIXED_POINT", "Existing Fixed Point/Delivery Point?")}`} <span className="astericColor">*</span>
            </CardLabel>
            <RadioButtons
              t={t}
              options={existingFixedPointOptions}
              optionsKey="i18nKey"
              name="isExistingFixedPoint"
              value={isExistingFixedPoint}
              selectedOption={isExistingFixedPoint}
              onSelect={handleExistingFixedPointSelect}
              style={{ display: "flex", gap: "30px", marginBottom: "0px" }}
              innerStyles={{ minWidth: "24%", marginBottom: "0px" }}
            />
          </div>
          <div className="form-field wns-search-field">
            <CardLabel>
              {`${t("Fixed Point/Delivery Point")}`}
            </CardLabel>
            {isExistingFixedPoint?.code === "YES" ? (
              <Dropdown
                className="form-field"
                selected={fixedPoint}
                option={fixedPointOptions}
                select={handleFixedPointSelect}
                optionKey="name"
                t={t}
                name="fixedPoint"
                placeholder={t("WT_SELECT_FIXED_POINT", "Select Fixed Point")}
                onSearch={handleSearch}
              />
            ) : (
              <TextInput
                t={t}
                type={"text"}
                isMandatory={false}
                name="fixedPointText"
                value={typeof fixedPoint === "string" ? fixedPoint : fixedPoint?.name || ""}
                onChange={(e) => setFixedPoint(e.target.value)}
                style={inputStyles}
                placeholder={t("WT_ENTER_FIXED_POINT", "Enter Fixed Point")}
              />
            )}
          </div>
          {config?.additionaFields?.gender ? (
            <div className="form-field wns-search-field">
              <CardLabel>
                {`${t("COMMON_GENDER")}`} <span className="astericColor">*</span>
              </CardLabel>
              <RadioButtons
                t={t}
                options={genderOptions}
                style={{ display: "flex", flexWrap: "wrap", maxHeight: "30px" }}
                innerStyles={{ minWidth: "24%" }}
                optionsKey="i18nKey"
                name={`gender`}
                value={gender}
                selectedOption={gender}
                onSelect={setGender}
                labelKey="i18nKey"
                isPTFlow={true}
              />
            </div>
          ) : null}

          <div className="form-field wns-search-field">
            <CardLabel>
              {`${t("COMMON_MOBILE_NUMBER")}`} <span className="astericColor">*</span>
            </CardLabel>
            <MobileNumber
              value={mobileNumber}
              name="mobileNumber"
              onChange={(value) => setMobileNo({ target: { value } })}
              {...{ required: true, pattern: "[6-9]{1}[0-9]{9}", type: "tel", title: t("CORE_COMMON_APPLICANT_MOBILE_NUMBER_INVALID") }}
            />
          </div>
          <div className="form-field wns-search-field">
            <CardLabel>{`${t("COMMON_ALT_MOBILE_NUMBER")}`}</CardLabel>
            <MobileNumber
              value={alternateNumber}
              name="alternateNumber"
              onChange={(value) => setAltMobileNo({ target: { value } })}
              {...{ required: false, pattern: "[6-9]{1}[0-9]{9}", type: "tel", title: t("CORE_COMMON_APPLICANT_MOBILE_NUMBER_INVALID") }}
            />
          </div>



          {config?.additionaFields?.dateofBirth ? (
            <div className="form-field wns-search-field">
              <CardLabel>
                {`${t("COMMON_BIRTH_DATE")}`} <span className="astericColor">*</span>
              </CardLabel>
              <TextInput
                t={t}
                type={"date"}
                isMandatory={false}
                optionKey="i18nKey"
                name="dateOfBirth"
                value={dateOfBirth}
                onChange={setBirthDate}
                style={inputStyles}
                max={new Date().toISOString().split("T")[0]}
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  validDate: (val) => (/^\d{4}-\d{2}-\d{2}$/.test(val) ? true : t("ERR_DEFAULT_INPUT_FIELD_MSG")),
                }}
              />
            </div>
          ) : null}

          {config?.additionaFields?.guardianName ? (
            <div className="form-field wns-search-field">
              <CardLabel>
                {`${t("COMMON_GUARDIAN")}`} <span className="astericColor">*</span>
              </CardLabel>
              <TextInput
                t={t}
                type={"text"}
                isMandatory={false}
                optionKey="i18nKey"
                name="guardianName"
                style={inputStyles}
                value={guardianName}
                onChange={setGuardiansName}
                ValidationRequired={true}
                {...(validation = {
                  isRequired: true,
                  pattern: "^[a-zA-Z ]+$",
                  type: "tel",
                  title: t("PT_NAME_ERROR_MESSAGE"),
                })}
              />
            </div>
          ) : null}

          {config?.additionaFields?.guardianName ? (
            <div className="form-field wns-search-field">
              <CardLabel>
                {`${t("COMMON_RELATIONTYPE")}`} <span className="astericColor">*</span>
              </CardLabel>
              <Dropdown
                className="form-field"
                selected={relationShipType}
                option={GuardianOptions}
                select={setRelationShipType}
                optionKey="i18nKey"
                t={t}
                name="relationShipType"
                placeholder={"Select"}
              />
            </div>
          ) : null}
          <div className="form-field wns-search-field">
            <CardLabel>
              {`${t("COMMON_EMAIL_ID")}`}
            </CardLabel>
            <TextInput
              t={t}
              type={"email"}
              // isMandatory={false}
              optionKey="i18nKey"
              name="emailId"
              value={emailId}
              style={inputStyles}
              onChange={setOwnerEmail}
              ValidationRequired={true}
              {...(validation = {
                isRequired: true,
                pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\\.[a-zA-Z]{3,4}$",
                type: "email",
                title: t("PT_NAME_ERROR_MESSAGE"),
              })}
            />
          </div>
        </React.Fragment>
      </FormStep>
    </React.Fragment>
  );
};

export default EmergencyFixedPointApplicantDetails;
