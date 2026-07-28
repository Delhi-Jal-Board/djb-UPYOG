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
  EditIcon,
  DeleteIcon,
  Modal,
  CardText,
  Dropdown,
  AddIcon,
} from "@djb25/digit-ui-react-components";

import { useQueryClient } from "react-query";

import { useHistory, useParams } from "react-router-dom";
import ConfirmationBox from "../../components/Confirmation";
import { CloseSvg } from "@djb25/digit-ui-react-components";

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

const DriverDetails = () => {
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;
  // const state = Digit.ULBService.getStateId();
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { id: dsoId } = useParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type?.toLowerCase();

  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  // const [config, setCurrentConfig] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [vendors, setVendors] = useState([]);

  const [selectedOption, setSelectedOption] = useState({});

  const { data: driverData, isLoading, refetch } = Digit.Hooks.fsm.useDriverDetails(tenantId, { ids: dsoId }, { staleTime: Infinity });

  const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { sortBy: "name", sortOrder: "ASC", status: "ACTIVE" }, {});

  const { mutate: mutateDriver } = Digit.Hooks.fsm.useDriverUpdate(tenantId);

  const { mutate: mutateVendor } = Digit.Hooks.fsm.useVendorUpdate(tenantId);

  function onActionSelect(action) {
    setSelectedAction(action);
    setDisplayMenu(false);
  }
  useEffect(() => {
    if (vendorData) {
      let vendors = vendorData.map((data) => data.dsoDetails);
      setVendors(vendors);
    }
  }, [vendorData]);

  useEffect(() => {
    refetch();
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
        return history.push(`/digit-ui/${userType}/vendor/registry/modify-driver/${dsoId}`);
      case "HOME":
        if (userType === "citizen") {
          return history.push(`/digit-ui/citizen/vendor`);
        }
        return history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=DRIVER`);
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
        return handleDeleteDriver();
      case "DELETE_VENDOR":
        return handleDeleteVendor();
      case "ADD_VENDOR":
        return handleAddVendor();
      case "EDIT_VENDOR":
        return handleEditVendor();
      default:
        break;
    }
  };

  const handleDeleteDriver = () => {
    let driverDetails = driverData?.[0]?.driverData;
    const formData = {
      driver: {
        ...driverDetails,
        status: "INACTIVE",
      },
    };

    mutateDriver(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "DELETE_DRIVER" });
        queryClient.invalidateQueries("DSO_SEARCH");

        setTimeout(() => {
          closeToast();
          history.push(`/digit-ui/employee/fsm/registry`);
        }, 5000);
      },
    });
    setShowModal(false);
  };

  const handleDeleteVendor = () => {
    let formData = {};
    let dsoDetails = driverData?.[0]?.vendorDetails?.vendor?.[0];
    let getDriverVendorDetails = dsoDetails?.drivers;

    getDriverVendorDetails = getDriverVendorDetails.map((data) => {
      if (data.id === dsoId) {
        data.vendorDriverStatus = "INACTIVE";
      }
      return data;
    });

    formData = {
      vendor: {
        ...dsoDetails,
        owner: {
          ...dsoDetails.owner,
          gender: dsoDetails.owner?.gender || "OTHERS",
        },
        drivers: getDriverVendorDetails,
      },
    };

    mutateVendor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "DELETE_VENDOR" });
        queryClient.invalidateQueries("FSM_VENDOR_SEARCH");
        refetch();
        setTimeout(closeToast, 5000);
      },
    });
    setShowModal(false);
  };

  const handleAddVendor = () => {
    let dsoDetails = selectedOption;
    let driverDetails = driverData?.[0]?.driverData;
    driverDetails.vendorDriverStatus = "ACTIVE";
    const formData = {
      vendor: {
        ...dsoDetails,
        owner: {
          ...dsoDetails.owner,
          gender: dsoDetails.owner?.gender || "OTHERS",
        },
        drivers: dsoDetails.drivers ? [...dsoDetails.drivers, driverDetails] : [driverDetails],
      },
    };
    mutateVendor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        refetch();
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "ADD_VENDOR" });
        queryClient.invalidateQueries("DSO_SEARCH");
        refetch();
        setTimeout(closeToast, 5000);
      },
    });
    setShowModal(false);
    setSelectedAction(null);
  };

  const handleEditVendor = () => {
    let dsoDetails = selectedOption;
    let driverDetails = driverData?.[0]?.driverData;
    driverDetails.vendorDriverStatus = "ACTIVE";

    const formData = {
      vendor: {
        ...dsoDetails,
        owner: {
          ...dsoDetails.owner,
          gender: dsoDetails.owner?.gender || "OTHERS",
        },
        drivers: dsoDetails.drivers ? [...dsoDetails.drivers, driverDetails] : [driverDetails],
      },
    };

    mutateVendor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "EDIT_VENDOR" });
        refetch();
        queryClient.invalidateQueries("DSO_SEARCH");
        setTimeout(closeToast, 5000);
      },
    });
    setShowModal(false);
    setSelectedAction(null);
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
        return "ES_FSM_REGISTRY_DELETE_POPUP_HEADER";
      case "ADD_VENDOR":
        return "ES_FSM_REGISTRY_ADD_VENDOR_POPUP_HEADER";
      case "EDIT_VENDOR":
        return "ES_FSM_REGISTRY_ADD_VENDOR_POPUP_HEADER";
      default:
        break;
    }
  };

  const renderModalContent = () => {
    if (selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR") {
      return (
        <ConfirmationBox t={t} title={"ES_FSM_REGISTRY_DELETE_TEXT"} />
        // <div className="confirmation_box">
        //   <span>{t(`ES_FSM_REGISTRY_DELETE_TEXT`)} </span>
        // </div>
      );
    }
    if (selectedAction === "ADD_VENDOR") {
      return (
        <React.Fragment>
          <CardText>{t(`ES_FSM_REGISTRY_SELECT_VENODOR`)}</CardText>
          <Dropdown t={t} option={vendors} value={selectedOption} selected={selectedOption} select={setSelectedOption} optionKey={"name"} />
        </React.Fragment>
      );
    }
    if (selectedAction === "EDIT_VENDOR") {
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

  return !isLoading ? (
    <React.Fragment>
      <div className="employee-form-content">
        <Card style={{ position: "relative", backgroundColor: "#fff" }}>
          {driverData?.[0]?.employeeResponse?.map((detail, index) => (
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
                              onClick={() => onActionSelect("ADD_VENDOR")}
                              style={{ cursor: "pointer" }}
                            >
                              <AddIcon className="" fill="#a82227" />
                            </span>
                          )}
                          {value.value !== "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                            <div
                              className="add-details-link hover-button"
                              onClick={() => onActionSelect("EDIT_VENDOR")}
                              style={{ cursor: "pointer" }}
                            >
                              <EditIcon />
                            </div>
                          )}
                          {value.value !== "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                            <div
                              className="add-details-link hover-button"
                              onClick={() => onActionSelect("DELETE_VENDOR")}
                              style={{ cursor: "pointer" }}
                            >
                              <DeleteIcon className="delete" fill="#a82227" />
                            </div>
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
          formId="modal-action"
        >
          {selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR" ? (
            renderModalContent()
          ) : (
            <Card style={{ boxShadow: "none" }}>{renderModalContent()}</Card>
          )}
        </Modal>
      )}
      {showToast && (
        <Toast
          error={showToast.key === "error" ? true : false}
          label={t(showToast.key === "success" ? `ES_FSM_REGISTRY_${showToast.action}_SUCCESS` : showToast.action)}
          onClose={closeToast}
        />
      )}
      <ActionBar style={{ zIndex: "19" }}>
        {displayMenu ? <Menu localeKeyPrefix={"ES_FSM_REGISTRY_ACTION"} options={["EDIT", "DELETE"]} t={t} onSelect={onActionSelect} /> : null}
        <SubmitBar label={t("ES_COMMON_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
      </ActionBar>
    </React.Fragment>
  ) : (
    <Loader />
  );
};

export default DriverDetails;
