import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { TickMark } from "./svgindex";

const VerticalTimeline = ({ config, onSelect, showFinalStep, currentActiveIndex, ...props }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const currentRoute = location.pathname.split("/").pop();

  if (currentRoute === "info") return null;

  const steps = config
    .filter((item) => item.timeLine && item.timeLine.length > 0)
    .reduce((acc, item) => {
      const stepInfo = item.timeLine[0];
      const stepIndex = acc.findIndex((s) => s.key === stepInfo.currentStep);

      if (stepIndex === -1) {
        acc.push({
          key: stepInfo.currentStep,
          label: stepInfo.actions,
          routes: [item.route],
          stepNumber: stepInfo.currentStep,
        });
      } else {
        acc[stepIndex].routes.push(item.route);
      }
      return acc;
    }, [])
    .sort((a, b) => a.stepNumber - b.stepNumber);

  if (showFinalStep) {
    steps.push({
      key: "final-submit",
      label: "Review & Submit",
      routes: ["check", "wt-acknowledgement", "mt-acknowledgement", "tp-acknowledgement"],
      stepNumber: steps.length + 1,
    });
  }

  // 🔥 NEW LOGIC HERE
  let activeStepIndex;

  if (typeof currentActiveIndex === "number") {
    activeStepIndex = currentActiveIndex;
  } else {
    const currentStepIndex = steps.findIndex((step) => step.routes.includes(currentRoute));
    activeStepIndex = currentStepIndex !== -1 ? currentStepIndex : 0;
  }

  const handleStepClick = (route, index) => {
    if (onSelect) onSelect(route, index);
  };

  return (
    <React.Fragment>
      <div className="vertical-timeline-container">
        <div className="vertical-timeline-wrapper">
          {steps.map((step, index) => {
            const isCompleted = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <div
                key={index}
                className={`vertical-timeline-step ${isCompleted ? "completed" : ""} ${isActive ? "activeTimeline active" : ""}`}
                onClick={() => handleStepClick(step.routes[0], index)}
              >
                <div className={`vertical-timeline-connector ${index < activeStepIndex ? "completed" : ""}`}></div>

                <div className="vertical-timeline-pill">{isCompleted ? <TickMark /> : step.stepNumber}</div>

                <div className="vertical-timeline-content">
                  <div className="vertical-timeline-label">{t(step.label)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};

export default VerticalTimeline;
