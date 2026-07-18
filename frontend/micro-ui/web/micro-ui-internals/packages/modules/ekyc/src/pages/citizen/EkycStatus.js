import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardText,
  Loader,
  StatusTable,
  Row,
  InboxComposer,
  VerticalTimeline,
  SubmitBar,
} from "@djb25/digit-ui-react-components";
import SearchFormFieldsComponents from "../../components/SearchFormFieldsComponent";

const EkycStatus = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const history = useHistory();

  // Separate states for the input form state and the triggered search query
  const [formState, setFormState] = useState({
    searchForm: {
      kNumber: id && id !== ":id" ? id : "",
    },
    filterForm: {},
  });
  const [searchQuery, setSearchQuery] = useState(id && id !== ":id" ? id : "");
  const [errorMsg, setErrorMsg] = useState("");

  const tenantId = Digit.ULBService.getCurrentTenantId();

  // Sync states with URL id parameter change (e.g. back navigation or page load)
  // Added strict equality check to prevent infinite re-render loop
  useEffect(() => {
    const currentKNumber = formState?.searchForm?.kNumber || "";
    const targetKNumber = id && id !== ":id" ? id : "";
    if (currentKNumber !== targetKNumber) {
      setFormState({
        searchForm: { kNumber: targetKNumber },
        filterForm: {},
      });
      setSearchQuery(targetKNumber);
    }
  }, [id]);

  // Fetch eKYC review/status data - only triggers on 'searchQuery' state
  const { data: searchData, isLoading: isReviewLoading } = Digit.Hooks.ekyc.useEkycSearchReview(
    { kno: searchQuery, fetchType: "REVIEW" },
    tenantId,
    {
      enabled: !!searchQuery,
      retry: false,
      onError: (err) => {
        setErrorMsg(err?.message || t("EKYC_STATUS_NOT_FOUND", "eKYC Application not found."));
      },
    }
  );

  // Fetch connection/application details via useSearchConnection
  const { data: connectionSearchData, isLoading: isConnectionLoading } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchQuery } },
    { enabled: !!searchQuery, retry: false }
  );

  const isLoading = isReviewLoading || isConnectionLoading;

  const onSearchFormSubmit = (data) => {
    const val = data?.kNumber?.trim();
    if (!val) {
      setErrorMsg(t("EKYC_PLEASE_ENTER_KNO", "Please enter a valid K-Number."));
      return;
    }
    setErrorMsg("");
    setFormState({
      searchForm: data,
      filterForm: {},
    });
    setSearchQuery(val);
    history.push(`/digit-ui/citizen/ekyc/${val}`);
  };

  const searchFormDefaultValues = {
    kNumber: "",
  };

  const onSearchFormReset = (setSearchFormValue) => {
    setSearchFormValue("kNumber", "");
    setErrorMsg("");
    setFormState({
      searchForm: { kNumber: "" },
      filterForm: {},
    });
    setSearchQuery("");
    history.push("/digit-ui/citizen/ekyc/:id");
  };

  const SearchFormFields = useCallback(
    ({ registerRef, searchFormState, controlSearchForm }) => (
      <SearchFormFieldsComponents {...{ registerRef, searchFormState, controlSearchForm }} searchType="kno" className="search" />
    ),
    []
  );

  const propsForSearchForm = {
    SearchFormFields,
    onSearchFormSubmit,
    searchFormDefaultValues: formState?.searchForm,
    resetSearchFormDefaultValues: searchFormDefaultValues,
    onSearchFormReset,
    className: "search-form-wns-inbox",
  };

  const propsForInboxTable = {
    columns: [],
    data: [],
    limit: 10,
    offset: 0,
  };

  const propsForInboxMobileCards = {
    data: [],
  };

  const getStatusDetails = () => {
    if (!searchData) return null;
    const reviewWrapper = searchData?.applicationReviewInfo || searchData?.applicationReview || searchData;
    const appData = (Array.isArray(reviewWrapper) ? reviewWrapper[0] : reviewWrapper) || {};
    const newData = appData?.newData || appData;
    const connection = newData?.connectionDetails || newData || {};

    const naText = t("CS_NA", "N/A");
    const connRaw = connectionSearchData?.connectionDetails || connectionSearchData || {};
    const addrRaw = connectionSearchData?.addressDetails || {};
    const propRaw = connectionSearchData?.propertyInfo || {};
    const meterRaw = connectionSearchData?.meterDetails || {};

    const rawStatus = (connection?.ekycStatus || connection?.ekycstatus || connRaw?.ekycStatus || propRaw?.ekycStatus || meterRaw?.ekycStatus || "NA").toUpperCase();

    const reviewName = connection?.consumerName || [newData?.firstName, newData?.middleName, newData?.lastName].filter(Boolean).join(" ");
    const connName = connRaw?.consumerName || [connRaw?.firstName, connRaw?.middleName, connRaw?.lastName].filter(Boolean).join(" ");

    const reviewPhone = connection?.phoneNumber || connection?.mobileNo || connection?.mobileNumber;
    const connPhone = connRaw?.phoneNumber || connRaw?.mobileNo || connRaw?.mobileNumber || addrRaw?.mobileNo || addrRaw?.phoneNumber || addrRaw?.mobileNumber;

    const reviewType = connection?.connectionType || connection?.connectionCategory;
    const connType = connRaw?.connectionType || connRaw?.connectionCategory || connRaw?.knoCategory || propRaw?.connectionType || propRaw?.connectionCategory || meterRaw?.connectionCategory;

    return {
      kno: connection?.knumber || connection?.kno || connRaw?.knumber || connRaw?.kno || searchQuery,
      consumerName: (reviewName && reviewName !== naText && reviewName !== "") ? reviewName : (connName || naText),
      phoneNumber: (reviewPhone && reviewPhone !== naText && reviewPhone !== "") ? reviewPhone : (connPhone || naText),
      connectionType: (reviewType && reviewType !== naText && reviewType !== "") ? reviewType : (connType || naText),
      status: rawStatus,
    };
  };

  const details = getStatusDetails();

  // Visual Stepper configuration for VerticalTimeline
  const timelineConfig = [
    {
      route: "submitted",
      timeLine: [
        {
          currentStep: 1,
          actions: t("EKYC_STEP_SUBMITTED", "eKYC Survey Submitted"),
        },
      ],
    },
    {
      route: "verification",
      timeLine: [
        {
          currentStep: 2,
          actions: t("EKYC_STEP_UNDER_VERIFICATION", "Under Verification"),
        },
      ],
    },
    {
      route: "zro-decision",
      timeLine: [
        {
          currentStep: 3,
          actions: t("EKYC_STEP_ZRO_DECISION", "ZRO Decision"),
        },
      ],
    },
  ];

  let activeStepIndex = 0;
  if (details) {
    if (details.status === "APPROVED") {
      activeStepIndex = 3;
    } else if (details.status === "REJECTED") {
      activeStepIndex = 2;
    } else if (details.status === "PENDING_FOR_VERIFICATION") {
      activeStepIndex = 1;
    } else {
      activeStepIndex = 1;
    }
  }

  const getStatusText = (status) => {
    const key = `EKYC_STATUS_${status}`;
    const val = t(key);
    if (val === key) {
      if (status === "APPROVED") return "Approved";
      if (status === "REJECTED") return "Rejected";
      if (status === "PENDING_FOR_VERIFICATION") return "Pending For Verification";
      return status;
    }
    return val;
  };

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        {!isLoading && details && (
          <VerticalTimeline config={timelineConfig} currentActiveIndex={activeStepIndex} />
        )}
        <div className="employee-form-section">
          <div className="single-page-form-container">
            {/* 1. Search Form Card rendered with InboxComposer */}
            <Card className="ekyc-status-search-card">
              <CardHeader className="ekyc-status-card-header">
                {t("EKYC_APPLICATION_STATUS_TRACKER", "eKYC Application Status")}
              </CardHeader>
              <CardText className="ekyc-status-card-text">
                {t("EKYC_STATUS_TRACKER_SUBHEADER", "Enter your K-Number below to track the real-time status of your eKYC application.")}
              </CardText>

              <div className="status-search-composer-wrapper">
                <InboxComposer
                  {...{
                    isInboxLoading: false,
                    ...propsForSearchForm,
                    propsForInboxTable,
                    propsForInboxMobileCards,
                    formState,
                    showSearchOnMobile: true,
                  }}
                />
              </div>
            </Card>

            {errorMsg && (
              <div className="ekyc-status-error-msg">
                {errorMsg}
              </div>
            )}

            {/* 2. Results Card */}
            {isLoading && <Loader />}

            {!isLoading && details && (
              <Card className="ekyc-status-results-card">
                {/* Status overview and badge */}
                <div className="ekyc-status-overview-header">
                  <div>
                    <span className="ekyc-status-label-title">
                      {t("EKYC_CURRENT_STATUS", "Current Status")}
                    </span>
                    <div className="ekyc-status-value-text">
                      {getStatusText(details.status)}
                    </div>
                  </div>
                  <span className={`ekyc-status-badge ${details.status.toLowerCase()}`}>
                    {details.status}
                  </span>
                </div>

                {/* Details Table */}
                <div className="ekyc-status-details-section">
                  <h3 className="ekyc-status-details-title">
                    {t("EKYC_CONNECTION_SUMMARY", "Connection Summary")}
                  </h3>
                  <StatusTable>
                    <Row label={t("EKYC_K_NUMBER", "K-Number")} text={details.kno} />
                    <Row label={t("EKYC_CONSUMER_NAME", "Consumer Name")} text={details.consumerName} />
                    <Row label={t("EKYC_MOBILE_NO", "Mobile Number")} text={details.phoneNumber} />
                    <Row label={t("EKYC_CONNECTION_TYPE", "Connection Type")} text={details.connectionType} />
                  </StatusTable>
                </div>

                {/* View Application button */}
                <div className="ekyc-status-action-section" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                  <SubmitBar
                    label={t("EKYC_VIEW_APPLICATION", "View Application")}
                    onSubmit={() => history.push(`/digit-ui/citizen/ekyc/status/${details.kno}`)}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );

  
};

export default EkycStatus;
