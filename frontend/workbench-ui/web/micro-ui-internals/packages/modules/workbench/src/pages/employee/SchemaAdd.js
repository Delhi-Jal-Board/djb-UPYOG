import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Card, LabelFieldPair, CardLabel, TextInput, SubmitBar, Toast, TextArea, ActionBar } from "@djb25/digit-ui-react-components";

const SchemaAdd = ({ parentRoute }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [definition, setDefinition] = useState("");
  const [showToast, setShowToast] = useState(null);

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
          setShowToast({ error: false, label: t("WBH_SCHEMA_CREATED_SUCCESSFULLY") });
          setTimeout(() => {
            history.push(`/${window?.contextPath}/employee/workbench/manage-master-data`);
          }, 1500);
        },
        onError: (resp) => {
          setShowToast({ error: true, label: resp?.response?.data?.Errors?.[0]?.message || t("WBH_SCHEMA_CREATION_FAILED") });
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
            <CardLabel>{t("WBH_SCHEMA_DEFINITION")}</CardLabel>
            <div className="field">
              <TextArea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder={"Enter JSON Schema definition here"}
                rows={3}
                style={{ width: "100%", height: "300px" }}
              />
            </div>
          </LabelFieldPair>
        </div>
      </Card>

      <ActionBar>
        <SubmitBar label={t("WBH_ACTION_SUBMIT")} onSubmit={onSubmit} />
      </ActionBar>

      {showToast && <Toast error={showToast.error} label={showToast.label} onClose={() => setShowToast(null)} />}
    </React.Fragment>
  );
};

export default SchemaAdd;
