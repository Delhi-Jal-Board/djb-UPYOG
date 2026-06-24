import React, { Fragment, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header, Card, CloseSvg, Menu, ActionBar, SubmitBar, Modal, CardText } from "@djb25/digit-ui-react-components";
import ApplicationDetailsTemplate from "../../../../../templates/ApplicationDetails";

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

const EventDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const history = useHistory();
  const [showModal, setShowModal] = useState(false);
  const [displayMenu, setDisplayMenu] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { isLoading, data } = Digit.Hooks.events.useEventDetails(tenantId, { ids: id });

  const [, setMutationHappened] = Digit.Hooks.useSessionStorage("EMPLOYEE_EVENT_MUTATION_HAPPENED", false);
  const [, , clearError] = Digit.Hooks.useSessionStorage("EMPLOYEE_EVENT_ERROR_DATA", false);
  const [, , clearSuccessData] = Digit.Hooks.useSessionStorage("EMPLOYEE_EVENT_MUTATION_SUCCESS_DATA", false);

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
  }, []);

  function onActionSelect(action) {
    // setSelectedAction(action);
    if (action === "EDIT") {
      history.push(`/digit-ui/employee/engagement/event/edit-event/${id}`);
    }
    if (action === "DELETE") {
      setShowModal(true);
    }
    setDisplayMenu(false);
  }

  const handleDelete = () => {
    const details = {
      events: [
        {
          ...data?.applicationData,
          status: "CANCELLED",
        },
      ],
    };
    history.push("/digit-ui/employee/engagement/event/response?delete=true", details);
  };

  return (
    <Fragment>
      <Header>{t("ES_TITLE_APPLICATION_DETAILS")}</Header>
      <ApplicationDetailsTemplate
        applicationData={data?.applicationData}
        applicationDetails={data}
        isLoading={isLoading}
        isDataLoading={isLoading}
        // workflowDetails={workflowDetails}
        // businessService={
        //   workflowDetails?.data?.applicationBusinessService
        //     ? workflowDetails?.data?.applicationBusinessService
        //     : data?.applicationData?.businessService
        // }
      />
      <ActionBar>
        {displayMenu ? <Menu localeKeyPrefix={"ES_EVENT"} options={["EDIT", "DELETE"]} t={t} onSelect={onActionSelect} /> : null}
        <SubmitBar label={t("ES_COMMON_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
      </ActionBar>
      {showModal && (
        <Modal
          headerBarMain={<Heading label={t("ES_EVENT_DELETE_POPUP_HEADER")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowModal(false)} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setShowModal(false)}
          actionSaveLabel={t("ES_EVENT_DELETE")}
          actionSaveOnSubmit={handleDelete}
        >
          <Card style={{ boxShadow: "none" }}>
            <CardText>{t(`ES_EVENT_DELETE_TEXT`)}</CardText>
          </Card>
        </Modal>
      )}
    </Fragment>
  );
};

export default EventDetails;
