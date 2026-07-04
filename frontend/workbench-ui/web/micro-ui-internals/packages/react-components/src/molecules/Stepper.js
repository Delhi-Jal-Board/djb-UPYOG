import React from "react";

const Stepper = ({ steps = [], currentStep = 0, onStepClick = () => {}, t = (v) => v, allowNavigation = true, className }) => {
  return (
    <div className={`stepper-container${className ? " " + className : ""}`}>
      {steps.map((stepObj, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div className="stepper-item" key={index}>
            <div className="stepper-row">
              <div className={`stepper-circle ${isCompleted ? "completed" : isActive ? "active" : ""}`}>
                {isCompleted ? (
                  <svg width="14" height="10" viewBox="0 0 14 10">
                    <path
                      d="M4.7 9.99L0.28 5.58C-0.09 5.21 -0.09 4.6 0.28 4.22C0.66 3.85 1.26 3.85 1.64 4.22L4.7 7.28L12.36 0.28C12.79 -0.11 13.44 -0.08 13.84 0.35C14.24 0.78 14.19 1.46 13.77 1.84L4.7 9.99Z"
                      fill="white"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <div className={`stepper-label ${isActive ? "active" : ""}`} onClick={() => allowNavigation && isCompleted && onStepClick(index)}>
                {t(stepObj.head || stepObj.label)}
              </div>
            </div>

            {index !== steps.length - 1 && <div className={`stepper-line ${isCompleted ? "completed" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
