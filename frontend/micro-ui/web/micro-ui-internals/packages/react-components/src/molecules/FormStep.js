import React from "react";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import TextArea from "../atoms/TextArea";
import CardLabel from "../atoms/CardLabel";
import CardLabelError from "../atoms/CardLabelError";
import TextInput from "../atoms/TextInput";
import InputCard from "./InputCard";
import CollapsibleCardPage from "../hoc/CollapsibleCardPage";
const FormStep = ({
  t,
  children,
  config,
  onSelect,
  onSkip,
  value,
  onChange,
  isDisabled,
  _defaultValues = {},
  forcedError,
  componentInFront,
  onAdd,
  cardStyle = {},
  isMultipleAllow = false,
  showErrorBelowChildren = false,
  childrenAtTheBottom = true,
  textInputStyle,
  className,
  isCollapsible = true,
  defaultOpen = true,
}) => {
  const { register, errors, handleSubmit } = useForm({
    defaultValues: _defaultValues,
  });

  const goNext = (data) => {
    onSelect(data);
  };

  var isDisable = isDisabled ? true : config.canDisable && Object.keys(errors).filter((i) => errors[i]).length;

  const inputs = config.inputs?.map((input, index) => {
    if (input.type === "text") {
      return (
        <React.Fragment key={index}>
          <CardLabel>{t(input.label)}</CardLabel>
          {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
          <div className="field-container" style={{ justifyContent: "left" }}>
            {componentInFront ? <span className="citizen-card-input citizen-card-input--front">{componentInFront}</span> : null}
            <TextInput
              key={index}
              name={input.name}
              value={value}
              onChange={onChange}
              minlength={input.validation.minlength}
              maxlength={input.validation.maxlength}
              pattern={input.validation?.pattern}
              title={input.validation?.title}
              placeholder={input.placeholder}
              inputRef={register(input.validation)}
              isMandatory={errors[input.name]}
              disable={input.disable ? input.disable : false}
              textInputStyle={textInputStyle}
            />
          </div>
        </React.Fragment>
      );
    }
    if (input.type === "textarea")
      return (
        <React.Fragment key={index}>
          <CardLabel>{t(input.label)}</CardLabel>
          <TextArea key={index} name={input.name} value={value} onChange={onChange} inputRef={register(input.validation)} maxLength="1024"></TextArea>
        </React.Fragment>
      );
    if (input.type === "date") {
      console.log("datedatedate");
      return (
        <React.Fragment key={index}>
          <CardLabel>
            {t(input.label)} {input.labelChildren && input.labelChildren}
          </CardLabel>
          {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
          <div className="field-container" style={{ justifyContent: "left" }}>
            <TextInput
              key={index}
              name={input.name}
              value={value}
              onChange={onChange}
              pattern={input.validation?.pattern}
              title={input.validation?.title}
              inputRef={register(input.validation)}
              isMandatory={errors[input.name]}
              disable={input.disable ? input.disable : false}
              textInputStyle={textInputStyle}
              type={input.type}
            />
          </div>
        </React.Fragment>
      );
    }
  });

  const _isCollapsible = config.isCollapsible !== undefined ? config.isCollapsible : isCollapsible;
  const _defaultOpen = config.defaultOpen !== undefined ? config.defaultOpen : defaultOpen;

  return (
    <form style={{ flex: "1" }} onSubmit={handleSubmit(goNext)}>
      {_isCollapsible ? (
        <CollapsibleCardPage title={t(config?.texts?.header)} defaultOpen={_defaultOpen}>
          <InputCard
            {...{ isDisable: isDisable, isMultipleAllow: isMultipleAllow }}
            {...config}
            texts={{ ...config.texts, header: null }}
            cardStyle={cardStyle}
            submit
            {...{ onSkip: onSkip, onAdd: onAdd }}
            t={t}
            className={className || ""}
          >
            {!childrenAtTheBottom && children}
            {inputs}
            {forcedError && !showErrorBelowChildren && <CardLabelError>{t(forcedError)}</CardLabelError>}
            {childrenAtTheBottom && children}
            {forcedError && showErrorBelowChildren && <CardLabelError>{t(forcedError)}</CardLabelError>}
          </InputCard>
        </CollapsibleCardPage>
      ) : (
        <InputCard
          {...{ isDisable: isDisable, isMultipleAllow: isMultipleAllow }}
          {...config}
          cardStyle={cardStyle}
          submit
          {...{ onSkip: onSkip, onAdd: onAdd }}
          t={t}
          className={className || ""}
        >
          {!childrenAtTheBottom && children}
          {inputs}
          {forcedError && !showErrorBelowChildren && <CardLabelError>{t(forcedError)}</CardLabelError>}
          {childrenAtTheBottom && children}
          {forcedError && showErrorBelowChildren && <CardLabelError>{t(forcedError)}</CardLabelError>}
        </InputCard>
      )}
    </form>
  );
};

FormStep.propTypes = {
  config: PropTypes.shape({}),
  onSelect: PropTypes.func,
  onSkip: PropTypes.func,
  onAdd: PropTypes.func,
  t: PropTypes.func,
};

FormStep.defaultProps = {
  config: {},
  onSelect: undefined,
  onSkip: undefined,
  onAdd: undefined,
  t: (value) => value,
};

export default FormStep;
