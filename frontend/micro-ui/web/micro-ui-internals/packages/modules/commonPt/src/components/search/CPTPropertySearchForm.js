import { CardLabelError, SearchField, SearchForm, SubmitBar, TextInput, Localities } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const SwitchComponent = (props) => {
  return (
    <div
      className="search-tabs-container PropertySearchFormSwitcher"
      style={{ marginBottom: "16px", display: "flex", gap: "24px", justifyContent: "flex-start", borderBottom: "1px solid #ccc" }}
    >
      {props.keys.map((key) => {
        const isSelected = props.searchBy === key;
        return (
          <div
            key={key}
            className={`search-tab ${isSelected ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              borderBottom: isSelected ? "2px solid #f47738" : "2px solid transparent",
              color: isSelected ? "#f47738" : "#0b0c0c",
              fontWeight: isSelected ? "bold" : "normal",
            }}
            onClick={() => {
              key === "searchDetail" && !sessionStorage.getItem("searchDetailValue") ? sessionStorage.setItem("searchDetailValue", 1) : "";
              key === "searchId" && sessionStorage.getItem("searchDetailValue") == 1 ? sessionStorage.setItem("searchDetailValue", 2) : "";
              props.onSwitch(key);
              props.onReset();
            }}
          >
            {props.t(`PT_SEARCH_BY_${key?.toUpperCase()}`)}
          </div>
        );
      })}
    </div>
  );
};
const SearchPTID = ({ tenantId, t, onSubmit, onReset, searchBy, PTSearchFields, setSearchBy, payload }) => {
  const { register, control, handleSubmit, setValue, watch, getValues, reset, formState } = useForm({
    defaultValues: {
      ...payload,
    },
  });
  const formValue = watch();
  const fields = PTSearchFields?.[searchBy] || {};

  useEffect(() => {
    if (sessionStorage.getItem("isCreateEnabledEmployee") === "true") {
      sessionStorage.removeItem("isCreateEnabledEmployee");
      history.replace("/digit-ui/employee");
    } else sessionStorage.removeItem("isCreateEnabledEmployee");
  });

  return (
    <div className="PropertySearchForm">
      <SearchForm onSubmit={onSubmit} handleSubmit={handleSubmit}>
        <SwitchComponent keys={Object.keys(PTSearchFields || {})} searchBy={searchBy} onReset={onReset} t={t} onSwitch={setSearchBy} />
        <div className="formcomposer-section-grid">
          {fields &&
            Object.keys(fields).map((key) => {
              let field = fields[key];
              let validation = field?.validation || {};
              return (
                <SearchField key={key}>
                  <label>
                    {t(field?.label)}
                    {`${field?.validation?.required ? "*" : ""}`}
                  </label>
                  {field?.type === "custom" ? (
                    <Controller
                      name={key}
                      defaultValue={formValue?.[key]}
                      rules={field.validation}
                      control={control}
                      render={(props, customProps) => (
                        <field.customComponent
                          selectLocality={(d) => {
                            props.onChange(d);
                          }}
                          tenantId={tenantId}
                          selected={formValue?.[key]}
                          {...field.customCompProps}
                        />
                      )}
                    />
                  ) : (
                    <div className="field-container">
                      {field?.componentInFront ? (
                        <span className="employee-card-input employee-card-input--front" style={{ flex: "none" }}>
                          {field?.componentInFront}
                        </span>
                      ) : null}
                      <TextInput
                        name={key}
                        type={field?.type}
                        inputRef={register({
                          value: getValues(key),
                          shouldUnregister: true,
                          ...validation,
                        })}
                      />
                    </div>
                  )}
                  <CardLabelError>{t(formState?.errors?.[key]?.message)}</CardLabelError>
                </SearchField>
              );
            })}
        </div>
        <div className="formcomposer-section-button" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div className="pt-search-action-reset generic-button clear-search" style={{ margin: 0 }}>
            <p
              onClick={() => {
                onReset({});
              }}
            >
              {t(`ES_COMMON_CLEAR_SEARCH`)}
            </p>
          </div>
          <div className="pt-search-action-submit submit-bar generic-button" style={{ margin: 0 }}>
            <SubmitBar label={t("ES_COMMON_SEARCH")} submit />
          </div>
        </div>
      </SearchForm>
    </div>
  );
};

export default SearchPTID;
