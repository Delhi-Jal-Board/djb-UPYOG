import React from "react";
import { useTranslation } from "react-i18next";
import { TickMark, VerticalTimeline } from "@djb25/digit-ui-react-components";

let actions = [];

const getAction = (flow) => {
 switch(flow){
    default: actions = [
      'WS_COMMON_DISCONNECTION_DETAIL',
      'WS_COMMON_DOCUMENT_DETAILS',
      'WS_COMMON_SUMMARY',
    ]
 }
}
const DisconnectTimeline = ({ currentStep = 1, flow="" }) => {
  const { t } = useTranslation();
  const isMobile = window.Digit.Utils.browser.isMobile();
  getAction(flow);
  const timelineConfig = actions.map((action, index) => ({
    route: `step-${index + 1}`,
    timeLine: [{ actions: action, currentStep: index + 1 }],
  }));

  return (
    <VerticalTimeline config={timelineConfig} currentActiveIndex={currentStep - 1} showFinalStep={false} />
  );
}

export default DisconnectTimeline; 