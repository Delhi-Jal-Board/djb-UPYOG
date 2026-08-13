import React from "react";
import { useTranslation } from "react-i18next";
import { TickMark } from "@djb25/digit-ui-react-components";

let actions = [];

const getAction = (flow) => {
 switch(flow){
    case "MUTATION": actions = [
      'WS_MUTATION_DETAILS',
      'WS_MUTATION_NEW_CONSUMER',
      'WS_MUTATION_DOCUMENTS',
      'WS_MUTATION_PREVIEW',
    ];
    break;
    default: actions = [
      'WS_COMMON_PROPERTY_DETAILS',
      'WS_COMMON_CONNECTION_DETAIL',
      'WS_COMMON_DOCUMENT_DETAILS',
      'WS_COMMON_SUMMARY',
    ];
 }
}
const Timeline = ({ currentStep = 1, flow="" }) => {
  const { t } = useTranslation();
  const isMobile = window.Digit.Utils.browser.isMobile();
  getAction(flow);
  return (
    <div className="timeline-container" style={isMobile?{}:{maxWidth:"960px",minWidth:"640px",marginRight:"auto"}} >
      {actions.map((action, index, arr) => (
        <div className="timeline-checkpoint" key={index}>
          <div className="timeline-content">
            <span className={`circle ${index <= currentStep - 1 && 'active'}`}>{index < currentStep - 1 ? <TickMark /> : index + 1}</span>
            <span className="secondary-color">{t(action)}</span>
          </div>
          {index < arr.length - 1 && <span className={`line ${index < currentStep - 1 && 'active'}`}></span>}
        </div>
      ))}
    </div>
  )
}

export default Timeline; 