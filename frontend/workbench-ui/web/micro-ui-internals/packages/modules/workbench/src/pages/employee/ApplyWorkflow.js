import { Header, Dropdown, LabelFieldPair, CardLabel, Card, Button, Toast, TextInput, Modal, CloseSvg } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import ReactJson from "react-json-view";
import { saveAs } from "file-saver";

const Heading = (props) => {
  return <h1 className="heading-m">{props.t("WBH_SELECT_OPERATION")}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div style={{ cursor: "pointer" }} onClick={props.onClick}>
      <CloseSvg />
    </div>
  );
};

function ApplyWorkflow() {
  const { t } = useTranslation();
  const { control, formState: localFormState, watch, trigger } = useForm();

  const [tenant, setTenant] = useState("");
  const [schemaCode, setSchemaCode] = useState(""); // Default value
  const [business, setBusiness] = useState("");
  const [businessService, setBusinessService] = useState("");
  const [selectedUniqueIdentifier, setSelectedUniqueIdentifier] = useState(null);
  const [jsonData, setJsonData] = useState({});
  const [workflowOperationData, setWorkflowOperationData] = useState("");
  const schemaCodePayload = "WORKFLOW.BusinessServices";
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isModalOpen, setModalOpen] = useState(false); // State to track modal visibility.
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [shouldCallApi, setShouldCallApi] = useState(false);
  // State for managing the toast notification
  const [toastProps, setToastProps] = useState({
    label: "",
    error: false,
    warning: false,
    isDleteBtn: false,
  });

  const handleApplyChanges = () => {
    setModalOpen(true); // Open the modal.
  };

  const handleCancel = () => {
    setModalOpen(false); // Close the modal when cancel is clicked.
    setShouldCallApi(false);
  };

  const MdmsCriteria = {
    tenantId: tenantId,
    moduleDetails: [
      {
        moduleName: "common-masters",
        masterDetails: [
          {
            name: "WorkbenchWorkflowOperation",
          },
        ],
      },
    ],
  };
  const businessServiceMdmsCriteria = {
    tenantId: tenantId,
    schemaCode: schemaCodePayload,
    limit: 200,
  };

  const { isLoading, data } = Digit.Hooks.useCustomAPIHook({
    url: `/${Digit.Hooks.workbench.getMDMSContextPath()}/v2/_search`,
    body: { MdmsCriteria: businessServiceMdmsCriteria },
    config: {
      select: (data) => {
        console.log("Fetched MDMS Data for business services:", data);

        return {
          uniqueIdentifierData: data?.mdms?.map((item) => ({
            i18nKey: item?.uniqueIdentifier,
            code: item?.uniqueIdentifier,
            tenant: item?.data?.tenantId,
            schemaCode: item?.schemaCode,
            business: item?.data?.business,
            businessService: item?.data?.businessService,
            data: item?.data,
          })),
        };
      },
    },
  });

  console.log("Unique Identifier Data:", data?.uniqueIdentifierData);

  const { dataVal } = Digit.Hooks.useCustomAPIHook({
    url: `/${Digit.Hooks.workbench.getMDMSContextPath()}/v1/_search`,
    body: { MdmsCriteria },
    config: {
      select: (dataVal) => {
        console.log("Fetched MDMS Data for Workflow operation:", dataVal);
        const mappedData = dataVal?.MdmsRes?.["common-masters"]?.WorkbenchWorkflowOperation.map((item) => ({
          i18nKey: item?.code,
          code: item?.code,
        }));
        setWorkflowOperationData(mappedData);
        return {
          workflowOperationData: mappedData,
        };
      },
    },
  });

  const { isLoading: isApplying } = Digit.Hooks.useCustomAPIHook({
    url: "/apply-workflow/api/v1/_process",
    body: shouldCallApi
      ? {
        BusinessService: {
          tenantId: tenantId,
          uniqueIdentifier: selectedUniqueIdentifier?.code,
          applyType: selectedOperation?.code === "CREATE_WORKFLOW" ? "create" : "update",
        },
      }
      : null,
    config: {
      enabled: shouldCallApi,
      onSuccess: (data) => {
        setToastProps({
          label: t("Workflow Applied Successfully"),
          error: false,
          warning: false,
          isDleteBtn: true,
        });
        setModalOpen(false);
        setShouldCallApi(false);
      },
      onError: (error) => {
        setToastProps({
          label: t("Error occurred while applying workflow"),
          error: true,
          warning: false,
          isDleteBtn: true,
        });
      },
      select: (data) => {
        console.log("Workflow applied:", data);
        setModalOpen(false);
        setShouldCallApi(false);
      },
    },
  });

  const handleApply = () => {
    if (!selectedOperation) {
      alert("Please select an operation to proceed.");
      return;
    }
    setShouldCallApi(true);
  };

  useEffect(() => {
    console.log("workflowOperationData updated:", workflowOperationData);
  }, [workflowOperationData]);

  useEffect(() => {
    if (selectedUniqueIdentifier) {
      const selectedData = data?.uniqueIdentifierData?.find((item) => item.code === selectedUniqueIdentifier.code);
      if (selectedData) {
        setTenant(selectedData.tenant);
        setBusiness(selectedData.business);
        setBusinessService(selectedData.businessService);
        setSchemaCode(selectedData.schemaCode), setJsonData(selectedData.data);
      }
    }
  }, [selectedUniqueIdentifier, data]);

  const handleDownloadJson = () => {
    if (!jsonData || Object.keys(jsonData).length === 0) {
      alert("No data available to download JSON file.");
      return;
    }
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    saveAs(blob, "workflow-data.json"); // Save as a .json file
  };

  return (
    <React.Fragment>
      {/* <Header className="works-header-search">{t("WBH_WORKFLOW_CREATE/UPDATE_SERVICE")}</Header> */}

      <Card className="manage-master-wrapper">
        <div className="workbench-form-grid-3">
          <LabelFieldPair>
            <CardLabel className="card-label-smaller">{t("WBH_UNIQUE_IDENTIFIER")}</CardLabel>
            <Controller
              control={control}
              name="tenant"
              render={(props) => (
                <Dropdown
                  // className="form-field"
                  //selected={tenantOptions}
                  selected={selectedUniqueIdentifier}
                  select={(value) => {
                    setSelectedUniqueIdentifier(value);
                    props.onChange(value);
                  }}
                  option={data?.uniqueIdentifierData}
                  optionKey="i18nKey"
                  t={t}
                />
              )}
            />
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel className="card-label-smaller">{t("WBH_TENANT")}</CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="tenant"
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  validate: { pattern: (val) => (/^[a-zA-Z0-9/-\s]*$/.test(val) ? true : t("ERR_DEFAULT_INPUT_FIELD_MSG")) },
                }}
                render={(props) => <TextInput value={tenant} />}
              />
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel className="card-label-smaller">{t("WBH_SCHEMA_CODE")}</CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="schemacode"
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  validate: { pattern: (val) => (/^[a-zA-Z0-9/-\s]*$/.test(val) ? true : t("ERR_DEFAULT_INPUT_FIELD_MSG")) },
                }}
                render={(props) => <TextInput value={schemaCode} />}
              />
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel className="card-label-smaller">{t("WBH_BUSINESS")}</CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="business"
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  validate: { pattern: (val) => (/^[a-zA-Z0-9/-\s]*$/.test(val) ? true : t("ERR_DEFAULT_INPUT_FIELD_MSG")) },
                }}
                render={(props) => <TextInput value={business} />}
              />
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel className="card-label-smaller">{t("WBH_BUSINESS_SERVICE")}</CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="businessservice"
                //defaultValue={comingDataFromAPI?.assetBookRefNo}
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  validate: { pattern: (val) => (/^[a-zA-Z0-9/-\s]*$/.test(val) ? true : t("ERR_DEFAULT_INPUT_FIELD_MSG")) },
                }}
                render={(props) => (
                  <TextInput
                    value={businessService}
                  // disable={false}
                  // autoFocus={focusIndex.index === editAssignDetails?.key && focusIndex.type === "BookPagereference"}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
        </div>
        <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end", marginTop: "24px" }}>
          <Button label="Apply changes" onButtonClick={handleApplyChanges} />
          <Button label="Download Json" onButtonClick={handleDownloadJson} />
          {/* Modal */}
          {isModalOpen && (
            <Modal
              headerBarMain={<Heading t={t} />}
              headerBarEnd={<CloseBtn onClick={handleCancel} />}
              actionCancelLabel={t("CS_COMMON_CANCEL")}
              actionCancelOnSubmit={handleCancel}
              actionSaveLabel={isApplying ? "Applying..." : "Apply"}
              actionSaveOnSubmit={handleApply} // Call handleApply on Apply button click
              formId="modal-action"
              popupStyles={{}}
            >
              <div className="workbench-form-grid-2" style={{ padding: "14px" }}>
                <LabelFieldPair>
                  <CardLabel>{t("WBH_SELECT_OPERATION")}</CardLabel>
                  <Controller
                    control={control}
                    name="selectoperation"
                    render={(props) => (
                      <Dropdown
                        // className="form-field"
                        placeholder={t("WBH_SELECT_OPERATION")}
                        selected={props.value}
                        select={(value) => {
                          props.onChange(value);
                          setSelectedOperation(value); // Update local state for selected operation
                        }}
                        option={workflowOperationData} // Options for dropdown
                        optionKey="i18nKey" // Use the `i18nKey` for the dropdown options
                        t={t}
                      />
                    )}
                  />
                </LabelFieldPair>
                {/* Note below the Apply button */}
                <LabelFieldPair>
                  <CardLabel>{t("WBH_NOTE")}</CardLabel>
                  <Controller
                    control={control}
                    name="note"
                    render={(props) => (
                      <TextInput value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={t("WBH_NOTE_PLACEHOLDER")} t={t} />
                    )}
                  />
                </LabelFieldPair>
              </div>
            </Modal>
          )}
        </div>
      </Card>

      {jsonData && Object.keys(jsonData).length > 0 && (
        <Card className="manage-master-wrapper">
          <div style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}>
            <ReactJson style={{ fontSize: "16px" }} src={jsonData} name={false} collapsed={false} enableClipboard={true} />
          </div>
        </Card>
      )}

      <div>
        {/* Show Toast based on the state */}
        {toastProps.label && (
          <Toast
            label={toastProps.label}
            error={toastProps.error}
            warning={toastProps.warning}
            isDleteBtn={toastProps.isDleteBtn}
            onClose={() => setToastProps({ ...toastProps, label: "" })} // Close Toast
          />
        )}
      </div>
    </React.Fragment>
  );
}

export default ApplyWorkflow;
