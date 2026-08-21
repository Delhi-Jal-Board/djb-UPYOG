import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Card, LabelFieldPair, CardLabel, TextInput, SubmitBar, Toast, TextArea, ActionBar, Modal, CloseSvg, InfoIcon, AddIcon } from "@djb25/workbench-ui-react-components";

const schemaPlaceholder = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Generated schema",
  "type": "object",
  "required": [
    "key",
    "attributeList"
  ],
  "x-unique": [
    "key"
  ],
  "properties": {
    "key": {
      "type": "string"
    },
    "attributeList": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "jsonPath",
          "type"
        ],
        "properties": {
          "jsonPath": {
            "type": "string"
          },
          "type": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-ref-schema": [],
  "additionalProperties": false
}`;

const SchemaAdd = ({ parentRoute }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [definition, setDefinition] = useState("");
  const [showToast, setShowToast] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const reqCriteriaAdd = {
    url: `/${Digit.Hooks.workbench.getMDMSContextPath()}/schema/v1/_create`,
    params: {},
    body: {},
    config: {
      enabled: true,
    },
  };

  const mutation = Digit.Hooks.useCustomAPIMutationHook(reqCriteriaAdd);

  const onSubmit = () => {
    if (!code || !description || !definition) {
      setShowToast({ error: true, label: t("WBH_SCHEMA_ALL_FIELDS_MANDATORY") });
      return;
    }

    let parsedDefinition = {};
    try {
      parsedDefinition = JSON.parse(definition);
    } catch (e) {
      setShowToast({ error: true, label: t("WBH_SCHEMA_INVALID_JSON") });
      return;
    }

    const payload = {
      SchemaDefinition: {
        tenantId: tenantId,
        code: code,
        description: description,
        definition: parsedDefinition,
      },
    };

    mutation.mutate(
      {
        params: {},
        body: payload,
      },
      {
        onSuccess: (resp) => {
          if (resp?.error || resp?.ResponseInfo?.status === "FAILED") {
            const errorMsg = resp?.data?.Errors?.[0]?.message || resp?.message || t("WBH_SCHEMA_CREATION_FAILED");
            setShowToast({ error: true, label: errorMsg, isDleteBtn: true });
            return;
          }
          setShowToast({ error: false, label: t("WBH_SCHEMA_CREATED_SUCCESSFULLY") });
          setTimeout(() => {
            history.push(`/${window?.contextPath}/employee/workbench/manage-master-data`);
          }, 1500);
        },
        onError: (resp) => {
          const errorMsg = resp?.response?.data?.Errors?.[0]?.message || t("WBH_SCHEMA_CREATION_FAILED");
          setShowToast({ error: true, label: errorMsg, isDleteBtn: true });
        },
      }
    );
  };

  return (
    <React.Fragment>
      <Card className="manage-master-wrapper">
        <div className="workbench-form-grid-2">
          <LabelFieldPair>
            <CardLabel>{t("WBH_SCHEMA_CODE")}</CardLabel>
            <div className="field">
              <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder={"e.g. common-masters.Sample"} />
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel>{t("WBH_SCHEMA_DESCRIPTION")}</CardLabel>
            <div className="field">
              <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder={"Enter description here"} />
            </div>
          </LabelFieldPair>
        </div>
        <div style={{ marginTop: "12px" }}>
          <LabelFieldPair>
            <CardLabel style={{ marginBottom: "8px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span>{t("WBH_SCHEMA_DEFINITION")}</span>
                <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(true)} title="View Sample Schema">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0B0C10" }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </span>
              </span>
            </CardLabel>
            <div className="field">
              <TextArea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder={"Click the information (i) icon next to the label above to view and copy the expected JSON schema structure."}
                rows={15}
                style={{ width: "100%", height: "500px", fontFamily: "monospace" }}
              />
            </div>
          </LabelFieldPair>
        </div>
      </Card>

      <ActionBar>
        <SubmitBar label={t("WBH_ACTION_SUBMIT")} onSubmit={onSubmit} />
      </ActionBar>

      {showToast && <Toast error={showToast.error} label={showToast.label} isDleteBtn={true} onClose={() => setShowToast(null)} />}
      {showModal && (
        <Modal
          headerBarMain={<h1 className="heading-m">{t("WBH_SCHEMA_SAMPLE")}</h1>}
          headerBarEnd={
            <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingRight: "8px" }}>
              <div
                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                onClick={() => {
                  navigator.clipboard.writeText(schemaPlaceholder);
                  setShowToast({ error: false, label: t("WBH_ACTION_COPY_SAMPLE_TO_CLIPBOARD") });
                }}
                title={t("WBH_ACTION_COPY_SAMPLE")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#505A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </div>
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => setShowModal(false)}>
                <CloseSvg />
              </div>
            </div>
          }
          hideSubmit={true}
          popupStyles={{ width: "800px" }}
        >
          <div style={{ padding: "16px" }}>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "16px", borderRadius: "4px", maxHeight: "60vh", overflowY: "auto", fontFamily: "monospace" }}>
              {schemaPlaceholder}
            </pre>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default SchemaAdd;
