import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  SubmitBar,
  Loader,
  CardSectionHeader,
  ActionBar,
  Menu,
  Toast,
  Modal,
  CardText,
  Dropdown,
  AddIcon,
  CloseSvg,
} from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import { useHistory, useLocation, useParams } from "react-router-dom";
import ConfirmationBox from "../../components/Confirmation";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div onClick={props.onClick}>
      <CloseSvg />
    </div>
  );
};

const SurveyorDetails = (props) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id: surveyorId } = useParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type;

  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedOption, setSelectedOption] = useState({});
  const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { sortBy: "name", sortOrder: "ASC", status: "ACTIVE" }, {});
  const { data: surveyorSearchResponse, isLoading, refetch } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { ids: surveyorId },
    { staleTime: Infinity }
  );

  const surveyorData = React.useMemo(() => {
    if (!surveyorSearchResponse?.surveyors?.length) return [];

    return surveyorSearchResponse.surveyors.map((data) => {
      const mappedVendor = vendorData?.find((v) => v.dsoDetails?.id === data.vendorId || v.dsoDetails?.vendorId === data.vendorId);
      const vendorName = data.vendorName || mappedVendor?.dsoDetails?.name || data.vendorId || "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR";
      const supervisorName = data.supervisorName || data.reportingManager?.name || "N/A";

      return {
        surveyorData: data,
        vendorDetails: { vendor: mappedVendor ? [mappedVendor.dsoDetails] : [] },
        employeeResponse: [
          {
            title: "ES_VENDOR_SURVEYOR_BASIC_DETAILS",
            values: [
              { title: "ES_VENDOR_SURVEYOR_FULL_NAME", value: data?.name },
              { title: "ES_VENDOR_SURVEYOR_MOBILE_NUMBER", value: data?.owner?.mobileNumber || data?.mobileNo },
              { title: "ES_VENDOR_SURVEYOR_EMAIL_ID", value: data?.owner?.emailId },
              // { title: "ES_VENDOR_SURVEYOR_STAFF_CODE", value: data?.employeeId || "N/A" },
              { title: "ES_VENDOR_SURVEYOR_GENDER", value: data?.owner?.gender },
              { title: "ES_FSM_REGISTRY_INBOX_SUPERVISOR_NAME", value: supervisorName },
              {
                title: "ES_VENDOR_SURVEYOR_AGENCY_NAME",
                value: vendorName,
                type: "custom",
              },
            ],
          },
        ],
      };
    });
  }, [surveyorSearchResponse, vendorData]);

  const { mutate: mutateSurveyor } = Digit.Hooks.fsm.useSurveyorUpdate(tenantId);

  useEffect(() => {
    if (vendorData) {
      let vendors = vendorData.map((data) => data.dsoDetails);
      setVendors(vendors);
    }
  }, [vendorData]);

  useEffect(() => {
    refetch();
    if (location.state?.showSuccessToast) {
      setShowToast(location.state?.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    switch (selectedAction) {
      case "DELETE":
      case "ADD_VENDOR":
      case "EDIT_VENDOR":
      case "DELETE_VENDOR":
        return setShowModal(true);
      case "EDIT":
        return history.push(`/digit-ui/${userType}/vendor/registry/modify-surveyor/${surveyorId}`);
      case "HOME":
        return history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=SURVEYOR`);
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  const closeToast = () => {
    setShowToast(null);
  };

  const handleModalAction = () => {
    switch (selectedAction) {
      case "DELETE":
        return handleDeleteSurveyor();
      default:
        break;
    }
  };

  const handleDeleteSurveyor = () => {
    let details = surveyorData?.[0]?.surveyorData;
    const formData = {
      surveyor: {
        ...details,
        status: "INACTIVE",
      },
    };

    mutateSurveyor(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
      },
      onSuccess: () => {
        queryClient.invalidateQueries("SURVEYOR_SEARCH");
        history.push({
          pathname: `/digit-ui/${userType}/vendor/search-vendor`,
          state: {
            showSuccessToast: true,
            message: { key: "success", action: `ES_VENDOR_DELETE_SURVEYOR_SUCCESS` },
          },
        });
      },
    });
    setShowModal(false);
  };

  const closeModal = () => {
    setSelectedAction(null);
    setSelectedOption({});
    setShowModal(false);
  };

  const modalHeading = () => {
    switch (selectedAction) {
      case "DELETE":
      case "DELETE_VENDOR":
        return "ES_VENDOR_SURVEYOR_DELETE_POPUP_HEADER";
      case "ADD_VENDOR":
      case "EDIT_VENDOR":
        return "ES_VENDOR_SURVEYOR_ADD_VENDOR_POPUP_HEADER";
      default:
        break;
    }
  };

  const renderModalContent = () => {
    if (selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR") {
      return <ConfirmationBox t={t} title={"ES_VENDOR_SURVEYOR_DELETE_TEXT"} />;
    }
    if (selectedAction === "ADD_VENDOR" || selectedAction === "EDIT_VENDOR") {
      return (
        <React.Fragment>
          <CardText>{t(`ES_FSM_REGISTRY_SELECT_VENODOR`)}</CardText>
          <Dropdown t={t} option={vendors} value={selectedOption} selected={selectedOption} select={setSelectedOption} optionKey={"name"} />
        </React.Fragment>
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="employee-form-content">
        <Card>
          {surveyorData?.[0]?.employeeResponse?.map((detail, index) => (
            <React.Fragment key={index}>
              {index > 0 && <CardSectionHeader style={{ marginBottom: "16px", marginTop: "32px" }}>{t(detail.title)}</CardSectionHeader>}
              <Card className="card-with-background">
                <div className="additional-grid">
                  {detail?.values?.map((value, index) => {
                    return value?.type === "custom" ? (
                      <React.Fragment key={index}>
                        <div className="additional-label">{t(value.title)}</div>
                        <div className="additional-value" style={{ color: "#a82227", display: "flex", gap: "20px", alignItems: "center" }}>
                          {t(value.value) || "N/A"}
                          {value.value === "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                            <span
                              className="add-details-link hover-button"
                              onClick={() => setSelectedAction("ADD_VENDOR")}
                              style={{ cursor: "pointer" }}
                            >
                              <AddIcon fill="#a82227" />
                            </span>
                          )}
                          {value.value !== "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                            <React.Fragment>
                              {/* <div
                                className="add-details-link hover-button"
                                onClick={() => setSelectedAction("EDIT_VENDOR")}
                                style={{ cursor: "pointer" }}
                              >
                                <EditIcon />
                              </div>
                              <div
                                className="add-details-link hover-button"
                                onClick={() => setSelectedAction("DELETE_VENDOR")}
                                style={{ cursor: "pointer" }}
                              >
                                <DeleteIcon fill="#a82227" />
                              </div> */}
                            </React.Fragment>
                          )}
                        </div>
                      </React.Fragment>
                    ) : (
                      <React.Fragment key={index}>
                        <div className="additional-label">{t(value.title)}</div>
                        <div className="additional-value">{t(value.value) || "N/A"}</div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </Card>
            </React.Fragment>
          ))}
        </Card>
      </div>
      {showModal && (
        <Modal
          headerBarMain={<Heading label={t(modalHeading())} />}
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={closeModal}
          actionSaveLabel={t(selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR" ? "ES_EVENT_DELETE" : "CS_COMMON_SUBMIT")}
          actionSaveOnSubmit={handleModalAction}
        >
          <Card style={{ boxShadow: "none" }}>{renderModalContent()}</Card>
        </Modal>
      )}
      {showToast && (
        <Toast
          error={showToast.key === "error"}
          label={t(showToast.key === "success" ? `ES_VENDOR_${showToast.action}_SUCCESS` : showToast.action)}
          onClose={closeToast}
        />
      )}
      <ActionBar style={{ zIndex: "19" }}>
        {displayMenu ? (
          <Menu
            localeKeyPrefix={"ES_VENDOR_SURVEYOR_ACTION"}
            options={["EDIT", "DELETE"]}
            t={t}
            onSelect={(a) => {
              setDisplayMenu(false);
              setSelectedAction(a);
            }}
          />
        ) : null}
        <SubmitBar label={t("ES_COMMON_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
      </ActionBar>
    </React.Fragment>
  );
};

export default SurveyorDetails;
