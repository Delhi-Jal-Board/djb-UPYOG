import React, { useEffect, useMemo, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import BreakLine from "../atoms/BreakLine";
import Card from "../atoms/Card";
import CardLabel from "../atoms/CardLabel";
import CardText from "../atoms/CardText";
import CardSubHeader from "../atoms/CardSubHeader";
// import CardSectionHeader from "../atoms/CardSectionHeader";
import CardLabelDesc from "../atoms/CardLabelDesc";
import CardLabelError from "../atoms/CardLabelError";
import TextArea from "../atoms/TextArea";
import TextInput from "../atoms/TextInput";
import ActionBar from "../atoms/ActionBar";
import SubmitBar from "../atoms/SubmitBar";
import LabelFieldPair from "../atoms/LabelFieldPair";
import LinkButton from "../atoms/LinkButton";
import CollapsibleCardPage from "./CollapsibleCardPage";

import { useTranslation } from "react-i18next";
import MobileNumber from "../atoms/MobileNumber";
import _ from "lodash";

/**
 * @typedef {Object} FormComposerProps
 * @property {Object} [defaultValues]
 * @property {Object} [appData]
 * @property {(data: any) => void} onSubmit
 * @property {() => void} [onSecondayActionClick]
 * @property {(accessors: { setValue: Function, getValues: Function }) => void} [getFormAccessors]
 * @property {(setValue: Function, formData: Object, formState: Object) => void} [onFormValueChange]
 * @property {Array} config
 * @property {boolean} [inline]
 * @property {boolean} [noBreakLine]
 * @property {Object} [cardStyle]
 * @property {boolean} [noBoxShadow]
 * @property {boolean} [isDisabled]
 * @property {string} [formId]
 * @property {string} [formClassName]
 * @property {string} [cardClassName]
 * @property {string} [cardFormWrapperClassName]
 * @property {React.ReactNode} [children]
 * @property {boolean} [childrenAtTheBottom]
 * @property {string} [heading]
 * @property {Object} [headingStyle]
 * @property {string} [description]
 * @property {string} [text]
 * @property {boolean} [submitInForm]
 * @property {string} [label]
 * @property {Object} [buttonStyle]
 * @property {string} [secondaryActionLabel]
 * @property {() => void} [onSkip]
 * @property {boolean} [showSkip]
 * @property {Object} [skipStyle]
 */

/**
 * @param {FormComposerProps} props
 */

export const FormComposer = (props) => {
  const { register, handleSubmit, setValue, getValues, reset, watch, control, formState, errors, setError, clearErrors, className } = useForm({
    defaultValues: props.defaultValues,
    mode: props.mode || "onSubmit",
  });
  const { t } = useTranslation();
  const formData = watch();

  useEffect(() => {
    const iseyeIconClicked = sessionStorage.getItem("eyeIconClicked");
    if (
      props?.appData &&
      !props?.appData?.ConnectionHolderDetails?.[0]?.sameAsOwnerDetails &&
      iseyeIconClicked &&
      Object.keys(props?.appData)?.length > 0 &&
      !_.isEqual(props?.appData?.ConnectionHolderDetails?.[0], formData?.ConnectionHolderDetails?.[0])
    ) {
      reset({ ...props?.appData });
    }
  }, [props?.appData, formData, props?.appData?.ConnectionHolderDetails]);

  useEffect(() => {
    props.getFormAccessors && props.getFormAccessors({ setValue, getValues });
  }, []);

  function onSubmit(data) {
    props.onSubmit(data);
  }

  function onSecondayActionClick(data) {
    props.onSecondayActionClick();
  }

  useEffect(() => {
    props.onFormValueChange && props.onFormValueChange(setValue, formData, formState);
  }, [formData]);

  const fieldSelector = (type, populators, isMandatory, disable = false, component, config) => {
    const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;

    switch (type) {
      case "text":
      case "date":
      case "number":
      case "password":
      case "time":
        return (
          <div className="field-container">
            {populators?.componentInFront ? (
              <span className={`component-in-front ${disable && "disabled-label"}`}>{populators.componentInFront}</span>
            ) : null}
            <TextInput
              className="field"
              {...populators}
              inputRef={register(populators.validation)}
              isRequired={isMandatory}
              type={type}
              disable={disable}
              watch={watch}
            />
          </div>
        );
      case "textarea":
        return (
          <TextArea className="field" name={populators?.name || ""} {...populators} inputRef={register(populators.validation)} disable={disable} />
        );
      case "mobileNumber":
        return (
          <Controller
            render={(props) => (
              <MobileNumber className={populators?.className || "field"} onChange={props.onChange} value={props.value} disable={disable} />
            )}
            defaultValue={populators.defaultValue}
            name={populators?.name}
            control={control}
          />
        );
      case "custom":
        return (
          <Controller
            render={(props) => populators.component({ ...props, setValue }, populators.customProps)}
            defaultValue={populators.defaultValue}
            name={populators?.name}
            control={control}
          />
        );
      case "component":
        return (
          <Controller
            render={(props) => (
              <Component
                userType={"employee"}
                t={t}
                setValue={setValue}
                onSelect={setValue}
                config={config}
                data={formData}
                formData={formData}
                register={register}
                errors={errors}
                props={props}
                setError={setError}
                clearErrors={clearErrors}
                formState={formState}
                onBlur={props.onBlur}
              />
            )}
            name={config.key}
            control={control}
          />
        );
      case "form":
        return (
          <form className={props.formClassName}>
            <Component
              userType={"employee"}
              t={t}
              setValue={setValue}
              onSelect={setValue}
              config={config}
              data={formData}
              formData={formData}
              register={register}
              errors={errors}
              setError={setError}
              clearErrors={clearErrors}
              formState={formState}
              control={control}
            />
          </form>
        );
      default:
        return populators?.dependency !== false ? populators : null;
    }
  };

  const getCombinedStyle = (placementinBox) => {
    switch (placementinBox) {
      case 0:
        return {
          border: "solid",
          borderRadius: "5px",
          padding: "10px",
          paddingTop: "20px",
          marginTop: "10px",
          borderColor: "#f3f3f3",
          background: "#FAFAFA",
          marginBottom: "20px",
        };
      case 1:
        return {
          border: "solid",
          borderRadius: "5px",
          padding: "10px",
          paddingTop: "20px",
          marginTop: "-30px",
          borderColor: "#f3f3f3",
          background: "#FAFAFA",
          borderTop: "0px",
          borderBottom: "0px",
        };
      case 2:
        return {
          border: "solid",
          borderRadius: "5px",
          padding: "10px",
          paddingTop: "20px",
          marginTop: "-30px",
          borderColor: "#f3f3f3",
          background: "#FAFAFA",
          marginBottom: "20px",
          borderTop: "0px",
        };
      default:
    }
  };

  // const titleStyle = { color: "#505A5F", fontWeight: "700", fontSize: "16px" };

  // Section headers span both columns in the grid
  // const getCombinedComponent = (section) => {
  //   if (section.head && section.subHead) {
  //     return (
  //       <div className="grid-title">
  //         <CardSectionHeader style={props?.sectionHeadStyle ? props?.sectionHeadStyle : { margin: "5px 0px" }} id={section.headId}>
  //           {t(section.head)}
  //         </CardSectionHeader>
  //         <CardSectionHeader style={titleStyle} id={`${section.headId}_DES`}>
  //           {t(section.subHead)}
  //         </CardSectionHeader>
  //       </div>
  //     );
  //   } else if (section.head) {
  //     return (
  //       <div className="grid-title">
  //         <CardSectionHeader style={props?.sectionHeadStyle ? props?.sectionHeadStyle : {}} id={section.headId}>
  //           {t(section.head)}
  //         </CardSectionHeader>
  //       </div>
  //     );
  //   } else {
  //     return null;
  //   }
  // };

  const formFields = useMemo(
    () =>
      props.config?.map((section, index, array) => {
        return (
          <React.Fragment key={index}>
            {/* 
              Each section gets its own 2-column grid wrapper.
              Section header spans both columns.
              Fields default to 1 column each (side by side).
              Set field.colSpan = "span 2" in config for a full-width single field.
            */}
            {section?.isCollapsible ? (
              <CollapsibleCardPage title={t(section.head)} defaultOpen={section.isDefaultOpen}>
                <div
                  className={`formcomposer-section-grid ${section.className ? section.className : ""} ${
                    props.cardFormWrapperClassName ? props.cardFormWrapperClassName : ""
                  }`}
                >
                  {section.body.map((field, index) => {
                    const Component =
                      typeof field?.component === "string" ? Digit.ComponentRegistryService.getComponent(field?.component) : field?.component;

                    if (props.inline) {
                      return (
                        <React.Fragment key={index}>
                          <div
                            style={{
                              gridColumn: field?.colSpan ? field.colSpan : "span 1",
                              ...(field.isInsideBox ? getCombinedStyle(field?.placementinbox) : {}),
                            }}
                          >
                            <LabelFieldPair>
                              {!field.withoutLabel && (
                                <CardLabel style={{ color: field.isSectionText ? "#505A5F" : "" }} className={field?.disable ? "disabled-label" : ""}>
                                  {t(field.label)}
                                  {field.isMandatory ? " * " : null}
                                  {field.labelChildren && field.labelChildren}
                                </CardLabel>
                              )}
                              {errors && errors[field.populators?.name] && Object.keys(errors[field.populators?.name]).length ? (
                                <CardLabelError>{t(field.populators.error || errors[field.populators?.name]?.message)}</CardLabelError>
                              ) : null}
                              <div style={field.withoutLabel ? { width: "100%" } : {}} className="field">
                                {fieldSelector(field.type, field.populators, field.isMandatory, field?.disable, field?.component, field)}
                                {field?.description && <CardLabel>{t(field.description)}</CardLabel>}
                              </div>
                            </LabelFieldPair>
                          </div>
                        </React.Fragment>
                      );
                    }

                    return (
                      <Fragment key={index}>
                        {field.type === "component" ? (
                          <Controller
                            name={field.key}
                            control={control}
                            render={(props) => {
                              return (
                                <>
                                  <Component
                                    userType={"employee"}
                                    t={t}
                                    setValue={setValue}
                                    onSelect={setValue}
                                    config={field}
                                    data={formData}
                                    formData={{
                                      ...formData,
                                      [field.key]: props.value || {}, // ✅ inject latest value
                                    }}
                                    register={register}
                                    errors={errors}
                                    setError={setError}
                                    clearErrors={clearErrors}
                                    formState={formState}
                                    style={{
                                      gridColumn: field?.colSpan ? field.colSpan : "span 1",
                                      ...props?.fieldStyle,
                                    }}
                                  />
                                </>
                              );
                            }}
                          />
                        ) : (
                          <div>
                            <LabelFieldPair
                              key={index}
                              style={{
                                gridColumn: field?.colSpan ? field.colSpan : "span 1",
                              }}
                            >
                              {!field.withoutLabel && (
                                <CardLabel
                                  style={{
                                    color: field.isSectionText ? "#505A5F" : "",
                                  }}
                                >
                                  {t(field.label)}
                                  {field.isMandatory ? " * " : null}
                                  {field.labelChildren && field.labelChildren}
                                </CardLabel>
                              )}
                              <div style={field.withoutLabel ? { width: "100%", ...props?.fieldStyle } : {}} className="field">
                                {fieldSelector(field.type, field.populators, field.isMandatory, field?.disable, field?.component, field)}
                                {field?.description && <CardText style={{ fontSize: "14px", marginTop: "-24px" }}>{t(field?.description)}</CardText>}
                              </div>
                            </LabelFieldPair>
                            {field?.populators?.name &&
                            errors &&
                            errors[field?.populators?.name] &&
                            Object.keys(errors[field?.populators?.name]).length ? (
                              <CardLabelError style={{ gridColumn: field?.colSpan ? field.colSpan : "span 1", fontSize: "12px", marginTop: "8px" }}>
                                {t(field?.populators?.error || errors[field?.populators?.name]?.message)}
                              </CardLabelError>
                            ) : null}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </CollapsibleCardPage>
            ) : (
              <div
                className={`formcomposer-section-grid ${section.className ? section.className : ""} ${
                  props.cardFormWrapperClassName ? props.cardFormWrapperClassName : ""
                }`}
              >
                {/* {section && getCombinedComponent(section)} */}

                {section.body.map((field, index) => {
                  const Component =
                    typeof field?.component === "string" ? Digit.ComponentRegistryService.getComponent(field?.component) : field?.component;
                  if (props.inline) {
                    return (
                      <React.Fragment key={index}>
                        <div
                          style={{
                            gridColumn: field?.colSpan ? field.colSpan : "span 1",
                            ...(field.isInsideBox ? getCombinedStyle(field?.placementinbox) : {}),
                          }}
                        >
                          <LabelFieldPair>
                            {!field.withoutLabel && (
                              <CardLabel style={{ color: field.isSectionText ? "#505A5F" : "" }} className={field?.disable ? "disabled-label" : ""}>
                                {t(field.label)}
                                {field.isMandatory ? " * " : null}
                                {field.labelChildren && field.labelChildren}
                              </CardLabel>
                            )}
                            {errors && errors[field.populators?.name] && Object.keys(errors[field.populators?.name]).length ? (
                              <CardLabelError>{t(field.populators.error || errors[field.populators?.name]?.message)}</CardLabelError>
                            ) : null}
                            <div style={field.withoutLabel ? { width: "100%" } : {}} className="field">
                              {fieldSelector(field.type, field.populators, field.isMandatory, field?.disable, field?.component, field)}
                              {field?.description && <CardLabel>{t(field.description)}</CardLabel>}
                            </div>
                          </LabelFieldPair>
                        </div>
                      </React.Fragment>
                    );
                  }

                  return (
                    <Fragment key={index}>
                      {field.type === "component" ? (
                        <Controller
                          name={field.key}
                          control={control}
                          render={(props) => {
                            return (
                              <>
                                <Component
                                  userType={"employee"}
                                  t={t}
                                  setValue={setValue}
                                  onSelect={setValue}
                                  config={field}
                                  data={formData}
                                  formData={{
                                    ...formData,
                                    [field.key]: props.value || {}, // ✅ inject latest value
                                  }}
                                  register={register}
                                  errors={errors}
                                  setError={setError}
                                  clearErrors={clearErrors}
                                  formState={formState}
                                  {...field?.props}
                                  style={{
                                    gridColumn: field?.colSpan ? field.colSpan : "span 1",
                                    ...props?.fieldStyle,
                                  }}
                                />
                              </>
                            );
                          }}
                        />
                      ) : (
                        <div>
                          <LabelFieldPair
                            key={index}
                            style={{
                              gridColumn: field?.colSpan ? field.colSpan : "span 1",
                            }}
                          >
                            {!field.withoutLabel && (
                              <CardLabel
                                style={{
                                  color: field.isSectionText ? "#505A5F" : "",
                                }}
                              >
                                {t(field.label)}
                                {field.isMandatory ? " * " : null}
                                {field.labelChildren && field.labelChildren}
                              </CardLabel>
                            )}
                            <div style={field.withoutLabel ? { width: "100%", ...props?.fieldStyle } : {}} className="field">
                              {fieldSelector(field.type, field.populators, field.isMandatory, field?.disable, field?.component, field)}
                              {field?.description && <CardText style={{ fontSize: "14px", marginTop: "-24px" }}>{t(field?.description)}</CardText>}
                            </div>
                          </LabelFieldPair>
                          {field?.populators?.name &&
                          errors &&
                          errors[field?.populators?.name] &&
                          Object.keys(errors[field?.populators?.name]).length ? (
                            <CardLabelError style={{ gridColumn: field?.colSpan ? field.colSpan : "span 1", fontSize: "12px", marginTop: "8px" }}>
                              {t(field?.populators?.error || errors[field?.populators?.name]?.message)}
                            </CardLabelError>
                          ) : null}
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            )}

            {!props.noBreakLine && (array.length - 1 === index ? null : <BreakLine style={props?.breaklineStyle ? props?.breaklineStyle : {}} />)}
          </React.Fragment>
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.config, formData]
  );

  const getCardStyles = () => {
    let styles = props.cardStyle || {};
    if (props.noBoxShadow) styles = { ...styles, boxShadow: "none" };
    return styles;
  };

  const isDisabled = props.isDisabled || false;
  const checkKeyDown = (e) => {
    const keyCode = e.keyCode ? e.keyCode : e.key ? e.key : e.which;
    if (keyCode === 13) {
      e.preventDefault();
    }
  };

  const cardContent = (
    <React.Fragment>
      {props.isCollapsible ? (
        <CollapsibleCardPage title={props.heading} defaultOpen={props.isDefaultOpen}>
          {!props.childrenAtTheBottom && props.children}
          {props.description && <CardLabelDesc className={"repos"}> {props.description} </CardLabelDesc>}
          {props.text && <CardText>{props.text}</CardText>}
          <div className={`formcomposer-grid-container-form ${props?.cardFormWrapperClassName ? props.cardFormWrapperClassName : ""}`}>
            {formFields}
          </div>
          {props.childrenAtTheBottom && props.children}
          {props.submitInForm && (
            <SubmitBar label={t(props.label)} style={{ ...props?.buttonStyle }} submit="submit" disabled={isDisabled} className="w-full" />
          )}
          {props.secondaryActionLabel && (
            <div className="primary-label-btn" style={{ margin: "20px auto 0 auto" }} onClick={onSecondayActionClick}>
              {props.secondaryActionLabel}
            </div>
          )}
          {!props.submitInForm && props.label && (
            <ActionBar>
              <SubmitBar label={t(props.label)} submit="submit" disabled={isDisabled} />
              {props.onSkip && props.showSkip && <LinkButton style={props?.skipStyle} label={t(`CS_SKIP_CONTINUE`)} onClick={props.onSkip} />}
            </ActionBar>
          )}
        </CollapsibleCardPage>
      ) : (
        <React.Fragment>
          {!props.childrenAtTheBottom && props.children}
          {props.heading && <CardSubHeader style={{ ...props.headingStyle }}> {props.heading} </CardSubHeader>}
          {props.description && <CardLabelDesc className={"repos"}> {props.description} </CardLabelDesc>}
          {props.text && <CardText>{props.text}</CardText>}
          <div className={`formcomposer-grid-container-form ${props?.cardFormWrapperClassName ? props.cardFormWrapperClassName : ""}`}>
            {formFields}
          </div>
          {props.childrenAtTheBottom && props.children}
          {props.submitInForm && (
            <SubmitBar label={t(props.label)} style={{ ...props?.buttonStyle }} submit="submit" disabled={isDisabled} className="w-full" />
          )}
          {props.secondaryActionLabel && (
            <div className="primary-label-btn" style={{ margin: "20px auto 0 auto" }} onClick={onSecondayActionClick}>
              {props.secondaryActionLabel}
            </div>
          )}
          {!props.submitInForm && props.label && (
            <ActionBar>
              <SubmitBar label={t(props.label)} submit="submit" disabled={isDisabled} />
              {props.onSkip && props.showSkip && <LinkButton style={props?.skipStyle} label={t(`CS_SKIP_CONTINUE`)} onClick={props.onSkip} />}
            </ActionBar>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );

  return (
    <form
      style={{ minHeight: "100%", height: "100%", overflowY: "scroll", flex: "1" }}
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => checkKeyDown(e)}
      id={props.formId}
      className={`${props.formClassName} no-scrollbar`}
    >
      {props.noCard ? (
        cardContent
      ) : (
        <Card className={`form-composer-card ${className ? props.cardClassName : ""}`} style={getCardStyles()}>
          {cardContent}
        </Card>
      )}
    </form>
  );
};
