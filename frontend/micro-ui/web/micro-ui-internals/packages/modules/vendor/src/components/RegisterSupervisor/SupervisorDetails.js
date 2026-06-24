import React, { useEffect, useReducer, useState } from "react";
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
  Table,
  CloseSvg,
} from "@djb25/digit-ui-react-components";
import { useQueryClient } from "react-query";
import { useHistory, useParams, useLocation } from "react-router-dom";
import ConfirmationBox from "../Confirmation";
import { formInitValue, formReducer, tableColumnConfig } from "../../config/tableConfig";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div className="icon-bg-secondary" onClick={props.onClick}>
      <CloseSvg />
    </div>
  );
};

const SupervisorDetails = (props) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id: supervisorId } = useParams();
  const userInfo = Digit.SessionStorage.get("User")?.info;
  const userType = userInfo?.type?.toLowerCase();

  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedOption, setSelectedOption] = useState({});
  const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { sortBy: "name", sortOrder: "ASC", status: "ACTIVE" }, {});
  const { data: supervisorSearchResponse, isLoading, refetch } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { ids: supervisorId },
    { staleTime: Infinity }
  );

  const supervisorData = React.useMemo(() => {
    if (!supervisorSearchResponse?.supervisors?.length) return [];

    return supervisorSearchResponse.supervisors.map((data) => {
      // Find the mapped vendor if we have vendorData loaded
      const mappedVendor = vendorData?.find((v) => v.dsoDetails?.id === data.vendorId || v.dsoDetails?.vendorId === data.vendorId);
      const vendorName = mappedVendor?.dsoDetails?.name || data.vendorId || "ES_FSM_REGISTRY_DETAILS_ADD_VENDOR";

      return {
        supervisorData: data,
        vendorDetails: { vendor: mappedVendor ? [mappedVendor.dsoDetails] : [] },
        employeeResponse: [
          {
            title: "ES_VENDOR_SUPERVISOR_BASIC_DETAILS",
            values: [
              { title: "ES_VENDOR_SUPERVISOR_FULL_NAME", value: data?.name },
              { title: "ES_VENDOR_SUPERVISOR_MOBILE_NUMBER", value: data?.owner?.mobileNumber || data?.mobileNo },
              { title: "ES_VENDOR_SUPERVISOR_EMAIL_ID", value: data?.owner?.emailId },
              { title: "ES_VENDOR_SUPERVISOR_STAFF_CODE", value: data?.employeeId || "N/A" },
              { title: "ES_VENDOR_SUPERVISOR_GENDER", value: data?.owner?.gender },
              {
                title: "ES_VENDOR_SUPERVISOR_AGENCY_NAME",
                value: vendorName,
                type: "custom",
              },
            ],
          },
        ],
      };
    });
  }, [supervisorSearchResponse, vendorData]);

  const { mutate: mutateSupervisor } = Digit.Hooks.fsm.useSupervisorUpdate(tenantId);
  const { mutate: mutateVendor } = Digit.Hooks.fsm.useVendorUpdate(tenantId);

  useEffect(() => {
    if (vendorData) {
      let vendors = vendorData.map((data) => data.dsoDetails);
      setVendors(vendors);
    }
  }, [vendorData]);

  useEffect(() => {
    refetch();
    if (location.state?.showSuccessToast) {
      setShowToast({
        key: "success",
        action: "UPDATE_SUPERVISOR",
      });
    }
  }, []);

  useEffect(() => {
    switch (selectedAction) {
      case "DELETE":
      case "ADD_VENDOR":
      case "EDIT_VENDOR":
      case "DELETE_VENDOR":
        return setShowModal(true);
      case "EDIT":
        return history.push(`/digit-ui/${userType}/vendor/registry/modify-supervisor/${supervisorId}`);
      case "HOME":
        return history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=SUPERVISOR`);
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  const [formState, dispatch] = useReducer(formReducer, formInitValue);

  let paginationParms = {
    limit: formState?.tableForm?.limit || 10,
    offset: formState?.tableForm?.offset || 0,
    sortBy: formState?.tableForm?.sortBy || "createdTime",
    sortOrder: formState?.tableForm?.sortOrder || "DESC",
  };

  const { data: dashboardData, isLoading: isDashboradLoading } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { ...paginationParms, status: "ACTIVE,DISABLED", supervisorId },
    { enabled: !!tenantId, keepPreviousData: true },
  );

  const closeToast = () => {
    setShowToast(null);
  };

  const handleModalAction = () => {
    switch (selectedAction) {
      case "DELETE":
        return handleDeleteSupervisor();
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

  const handleDeleteSupervisor = () => {
    let details = supervisorData?.[0]?.supervisorData;
    const formData = {
      supervisor: {
        ...details,
        status: "INACTIVE",
      },
    };

    mutateSupervisor(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "DELETE_SUPERVISOR" });
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");
        setTimeout(() => {
          closeToast();
          history.push(`/digit-ui/${userType}/vendor/search-vendor`);
        }, 5000);
      },
    });
    setShowModal(false);
  };

  const handleDeleteVendor = () => {
    let dsoDetails = supervisorData?.[0]?.vendorDetails?.vendor?.[0];
    let getSupervisorVendorDetails = dsoDetails?.supervisors || [];

    getSupervisorVendorDetails = getSupervisorVendorDetails.map((data) => {
      if (data.id === supervisorId) {
        data.vendorSupervisorStatus = "INACTIVE";
      }
      return data;
    });

    const formData = {
      vendor: {
        ...dsoDetails,
        supervisors: getSupervisorVendorDetails,
      },
    };

    mutateVendor(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: () => {
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
    let details = supervisorData?.[0]?.supervisorData;
    details.vendorSupervisorStatus = "ACTIVE";
    const formData = {
      vendor: {
        ...dsoDetails,
        supervisors: dsoDetails.supervisors ? [...dsoDetails.supervisors, details] : [details],
      },
    };
    mutateVendor(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
        refetch();
        setTimeout(closeToast, 5000);
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "ADD_VENDOR" });
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");
        refetch();
        setTimeout(closeToast, 5000);
      },
    });
    setShowModal(false);
    setSelectedAction(null);
  };

  const handleEditVendor = () => {
    let dsoDetails = selectedOption;
    let details = supervisorData?.[0]?.supervisorData;
    details.vendorSupervisorStatus = "ACTIVE";

    const formData = {
      vendor: {
        ...dsoDetails,
        supervisors: dsoDetails.supervisors ? [...dsoDetails.supervisors, details] : [details],
      },
    };

    mutateVendor(formData, {
      onError: (error) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: () => {
        setShowToast({ key: "success", action: "EDIT_VENDOR" });
        refetch();
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");
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
        return "ES_VENDOR_SUPERVISOR_DELETE_POPUP_HEADER";
      case "ADD_VENDOR":
      case "EDIT_VENDOR":
        return "ES_VENDOR_SUPERVISOR_ADD_VENDOR_POPUP_HEADER";
      default:
        break;
    }
  };

  const renderModalContent = () => {
    if (selectedAction === "DELETE" || selectedAction === "DELETE_VENDOR") {
      return <ConfirmationBox t={t} title={"ES_VENDOR_SUPERVISOR_DELETE_TEXT"} />;
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

  const filteredData = React.useMemo(() => {
    return (dashboardData?.surveyors || []).map((item) => {
      const owner = item?.owner || {};
      const roleCodes = owner?.roles?.map((role) => role.code)?.join(", ") || "";

      return {
        ...item,
        id: item?.id || "",
        surveyorName: item?.name || owner?.name || "",
        mobileNo: item?.mobileNo || owner?.mobileNumber || "",
        email: owner?.emailId || "",
        vendorId: item?.vendorId || "",
        tenantId: item?.tenantId || "",
        supervisorId: item?.supervisorId || "",
        status: item?.status || "",
        roleCodes,
        userName: owner?.userName || "",
        gender: owner?.gender || "",
        serviceType: item?.additionalDetails?.serviceType || "",
        createdTime: item?.auditDetails?.createdTime || 0,
        lastModifiedTime: item?.auditDetails?.lastModifiedTime || 0,
      };
    });
  }, [dashboardData?.surveyors]);

  if (isLoading) {
    return <Loader />;
  }

  const totalRecords = dashboardData?.dashboardInfo?.totalRecords || dashboardData?.totalCount || 0;

  const actions = {
    onPageSizeChange: (e) => {
      const newLimit = Number(e.target.value);

      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          limit: newLimit,
          offset: 0, // reset page
        },
      });
    },

    onNextPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(formState?.tableForm?.offset) + Number(formState?.tableForm?.limit),
        },
      }),

    onPrevPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(formState?.tableForm?.offset) - Number(formState?.tableForm?.limit),
        },
      }),

    onLastPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Math.ceil(totalRecords / formState?.tableForm?.limit) * formState?.tableForm?.limit - Number(formState?.tableForm?.limit),
        },
      }),

    onFirstPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: 0 },
      }),
    onSortingByData: (e) => {
      if (e.length > 0) {
        const [{ id, desc }] = e;
        const sortOrder = desc ? "DESC" : "ASC";
        const sortBy = id;

        if (!(formState.tableForm.sortBy === sortBy && formState.tableForm.sortOrder === sortOrder)) {
          dispatch({
            action: "mutateTableForm",
            data: {
              ...formState.tableForm,
              sortBy: id,
              sortOrder: desc ? "DESC" : "ASC",
            },
          });
        }
      }
    },
  };

  const handleReview = (id) => {
    history.push(`/digit-ui/${userType}/ekyc/assign/surveyor-details/${id}`);
  };

  console.log(userInfo?.roles?.map((ele) => ele.code)?.includes("SUPERVISOR"));

  return (
    <React.Fragment>
      <div className="employee-form-content">
        <Card className="flex-box flex-box-col flex-gap-5">
          {supervisorData?.[0]?.employeeResponse?.map((detail, index) => {
            return (
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
                                <div
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
                                </div>
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

                {userInfo?.roles?.map((ele) => ele.code)?.includes("SUPERVISOR") && (
                  <div
                    className="add-details-link hover-button"
                    style={{
                      margin: "10px 16px",
                      color: "#a82227",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontWeight: "bold",
                    }}
                    onClick={() => history.push(`/digit-ui/${userType}/vendor/registry/new-surveyor`)}
                  >
                    <AddIcon fill="#a82227" />
                    {t(`ES_FSM_REGISTRY_DETAILS_TYPE_SURVEYOR_ADD`)}
                  </div>
                )}
              </React.Fragment>
            );
          })}
          <Table
            t={t}
            disableSort={false}
            autoSort={false}
            manualPagination={true}
            currentPage={Math.floor(formState?.tableForm?.offset / formState?.tableForm?.limit)}
            onPageSizeChange={actions.onPageSizeChange}
            onNextPage={actions.onNextPage}
            onPrevPage={actions.onPrevPage}
            onLastPage={actions.onLastPage}
            onFirstPage={actions.onFirstPage}
            totalRecords={totalRecords}
            onSort={actions.onSortingByData}
            data={filteredData}
            columns={tableColumnConfig(t, handleReview)}
            inboxStyles={{ overflowX: "scroll", overflowY: "hidden" }}
            tableStyle={{ width: "70%" }}
            isLoading={isDashboradLoading}
          />
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
          duration={5000}
        />
      )}
      <ActionBar style={{ zIndex: "19" }}>
        {displayMenu ? (
          <Menu
            localeKeyPrefix={"ES_VENDOR_SUPERVISOR_ACTION"}
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

export default SupervisorDetails;
