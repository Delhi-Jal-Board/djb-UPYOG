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
  AddIcon,
  Dropdown,
} from "@djb25/digit-ui-react-components";

import { useQueryClient } from "react-query";

import { useHistory, useParams } from "react-router-dom";
import { CloseSvg } from "@djb25/digit-ui-react-components";
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

const VehicleDetails = (props) => {
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;
  // const state = Digit.ULBService.getStateId();
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  let { id: vehicleNumber } = useParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = userInfo?.type?.toLowerCase();
  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  // const [config, setCurrentConfig] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedOption, setSelectedOption] = useState({});
  const [vehicleId, setVehicleId] = useState(null);

  const { data: vehicleData, isLoading, refetch } = Digit.Hooks.fsm.useVehicleDetails(
    tenantId,
    { registrationNumber: vehicleNumber },
    { staleTime: Infinity }
  );

  useEffect(() => {
    if (!isLoading && vehicleData) {
      setVehicleId(vehicleData?.[0]?.vehicleData?.id);
    }
  }, [vehicleData, isLoading]);

  const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { sortBy: "name", sortOrder: "ASC", status: "ACTIVE" }, {});

  useEffect(() => {
    if (vendorData) {
      let vendors = vendorData.map((data) => data.dsoDetails);
      setVendors(vendors);
    }
  }, [vendorData]);

  const { mutate } = Digit.Hooks.fsm.useUpdateVehicle(tenantId);

  const { mutate: mutateVendor } = Digit.Hooks.fsm.useVendorUpdate(tenantId);

  function onActionSelect(action) {
    setDisplayMenu(false);
    setSelectedAction(action);
  }

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
        return history.push(`/digit-ui/${userType}/vendor/registry/modify-vehicle/${vehicleNumber}`);
      case "HOME":
        if (userType === "citizen") {
          return history.push(`/digit-ui/citizen/vendor`);
        }
        return history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=VEHICLE`);
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  const closeToast = () => {
    setShowToast(null);
  };

  const closeModal = () => {
    setSelectedAction(null);
    setSelectedOption({});
    setShowModal(false);
  };

  const handleAddVendor = () => {
    let dsoDetails = selectedOption;
    let vehicleDetails = vehicleData?.[0]?.vehicleData;
    vehicleDetails.vendorVehicleStatus = "ACTIVE";

    const formData = {
      vendor: {
        ...dsoDetails,
        owner: {
          ...dsoDetails.owner,
          gender: dsoDetails.owner?.gender || "OTHERS",
        },
        vehicles: dsoDetails.vehicles ? [...dsoDetails.vehicles, vehicleDetails] : [vehicleDetails],
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

  const handleEditVendor = () => {
    let dsoDetails = selectedOption;
    let vehicleDetails = vehicleData?.[0]?.vehicleData;
    vehicleDetails.vendorVehicleStatus = "ACTIVE";

    const formData = {
      vendor: {
        ...dsoDetails,
        owner: {
          ...dsoDetails.owner,
          gender: dsoDetails.owner?.gender || "OTHERS",
        },
        vehicles: dsoDetails.vehicles ? [...dsoDetails.vehicles, vehicleDetails] : [vehicleDetails],
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

  const handleDeleteVendor = () => {
    let formData = {};
    let dsoDetails = vehicleData?.[0]?.vendorDetails?.vendor?.[0];
    let getVehicleVendorDetails = dsoDetails?.vehicles;

    getVehicleVendorDetails = getVehicleVendorDetails.map((data) => {
      if (data.id === vehicleId) {
        data.vendorVehicleStatus = "INACTIVE";
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
        vehicles: getVehicleVendorDetails,
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

  const handleModalAction = () => {
    switch (selectedAction) {
      case "DELETE":
        return handleDelete();
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

  const handleDelete = () => {
    let vehicleDetails = vehicleData?.[0]?.vehicleData;
    const formData = {
      vehicle: {
        ...vehicleDetails,
        status: "INACTIVE",
      },
    };

    mutate(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "DELETE_VEHICLE" });
        queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
        setTimeout(() => {
          closeToast();
          history.push(`/digit-ui/employee/fsm/registry`);
        }, 5000);
      },
    });
    setShowModal(false);
  };

  const renderModalContent = () => {
    if (selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR") {
      return <ConfirmationBox t={t} title={"ES_FSM_REGISTRY_DELETE_TEXT"} />;
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

  if (isLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {!isLoading ? (
        <div className="employee-form-content">
          <Card className="vehicle-details-card" style={{ position: "relative" }}>
            {vehicleData?.[0]?.employeeResponse?.map((detail, index) => (
              <React.Fragment key={index}>
                {index > 0 && <CardSectionHeader style={{ marginBottom: "16px", marginTop: "32px" }}>{t(detail.title)}</CardSectionHeader>}
                <Card className="card-with-background" style={{ margin: "10px 16px", padding: "20px" }}>
                  <div className="additional-grid">
                    {detail?.values?.map((value, index) => {
                      return value?.type === "custom" ? (
                        <React.Fragment key={index}>
                          <div className="additional-label">{t(value.title)}</div>
                          <div className="additional-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {value.value === "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                              <div
                                onClick={() => onActionSelect("ADD_VENDOR")}
                                style={{ color: "#a82227", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                              >
                                <AddIcon className="" fill="#a82227" /> {t(value.value) || "N/A"}
                              </div>
                            )}
                            {value.value !== "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR" && (
                              <React.Fragment>
                                <span>{value.value}</span>
                                <div
                                  className="add-details-link hover-button"
                                  onClick={() => onActionSelect("EDIT_VENDOR")}
                                  style={{ cursor: "pointer" }}
                                >
                                  <EditIcon fill="#a82227" />
                                </div>
                                <div
                                  className="add-details-link hover-button"
                                  onClick={() => onActionSelect("DELETE_VENDOR")}
                                  style={{ cursor: "pointer" }}
                                >
                                  <DeleteIcon className="delete" fill="#a82227" />
                                </div>
                              </React.Fragment>
                            )}
                          </div>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={index}>
                          <div className="additional-label">{t(value.title)}</div>
                          <div className="additional-value" style={value.value === "ACTIVE" ? { color: "green" } : {}}>
                            {t(value.value) || "N/A"}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </Card>
              </React.Fragment>
            ))}
          </Card>

          {showModal && (
            <Modal
              headerBarMain={<Heading label={t(modalHeading())} />}
              headerBarEnd={<CloseBtn onClick={closeModal} />}
              actionCancelLabel={t("CS_COMMON_CANCEL")}
              actionCancelOnSubmit={closeModal}
              actionSaveLabel={t(selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR" ? "ES_EVENT_DELETE" : "CS_COMMON_SUBMIT")}
              // actionSaveOnSubmit={handleDelete}
              actionSaveOnSubmit={handleModalAction}
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
        </div>
      ) : (
        <Loader />
      )}
    </React.Fragment>
  );
};

export default VehicleDetails;
