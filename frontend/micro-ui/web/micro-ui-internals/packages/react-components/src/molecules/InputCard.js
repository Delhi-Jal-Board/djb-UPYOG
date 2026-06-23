import React from "react";
import PropTypes from "prop-types";
import CardHeader from "../atoms/CardHeader";
import CardText from "../atoms/CardText";
import SubmitBar from "../atoms/SubmitBar";
import LinkButton from "../atoms/LinkButton";
import CardCaption from "../atoms/CardCaption";

const InputCard = ({
  t,
  children,
  texts = {},
  submit = false,
  inputs = [],
  inputRef,
  onNext,
  onSkip,
  isDisable,
  onAdd,
  isMultipleAllow = false,
  cardStyle = {},
  className,
}) => {
  const isMobile = window.Digit.Utils.browser.isMobile();
  // TODO: inputs handle
  return (
    <div className={className || ""} style={cardStyle}>
      {texts.headerCaption && <CardCaption>{t(texts.headerCaption)}</CardCaption>}
      {texts?.header && <CardHeader>{t(texts.header)}</CardHeader>}
      {texts?.cardText && <CardText>{t(texts.cardText)}</CardText>}
      <div className="formcomposer-section-grid">{children}</div>

      {texts.submitBarLabel ? (
        <div className="formcomposer-section-button">
          <SubmitBar disabled={isDisable} submit={submit} label={t(texts.submitBarLabel)} onSubmit={onNext} />{" "}
        </div>
      ) : null}
      {texts.skipLabel ? <CardText style={{ marginTop: "10px", textAlign: isMobile ? "center" : "left" }}> {t(texts.skipLabel)} </CardText> : null}
      {texts.skipText ? <LinkButton label={t(texts.skipText)} onClick={onSkip} /> : null}
      {isMultipleAllow && texts.addMultipleText ? <LinkButton label={t(texts.addMultipleText)} onClick={onAdd} /> : null}
    </div>
  );
};

InputCard.propTypes = {
  text: PropTypes.object,
  submit: PropTypes.bool,
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  onAdd: PropTypes.func,
  t: PropTypes.func,
};

InputCard.defaultProps = {
  texts: {},
  submit: false,
  onNext: undefined,
  onSkip: undefined,
  onAdd: undefined,
  t: (value) => value,
};

export default InputCard;
