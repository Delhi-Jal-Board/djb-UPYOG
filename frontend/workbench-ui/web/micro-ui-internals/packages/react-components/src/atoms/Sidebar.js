import React from "react";

const SideBar = ({ steps, currentStep, t, title }) => {
  return (
    <div className="registration__sidebar">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div className="registration__sidebar__content no-scrollbar">
          <p className="registration__sidebar-title">{title}</p>

          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="registration__step">
                {/* Line */}
                {index !== steps.length - 1 && (
                  <div className={`registration__step-line ${isCompleted ? "registration__step-line--completed" : ""}`} />
                )}

                {/* Circle */}
                <div
                  className={`registration__step-circle 
                    ${isActive ? "registration__step-circle--active" : ""}
                    ${isCompleted ? "registration__step-circle--completed" : ""}
                  `}
                >
                  {isCompleted ? "✓" : step.number}
                </div>

                {/* Text */}
                <div className="registration__step-content">
                  <p className="registration__step-label">Step {step.number}</p>
                  <p
                    className={`registration__step-title
                      ${isActive ? "registration__step-title--active" : ""}
                      ${isCompleted ? "registration__step-title--completed" : ""}
                    `}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">{t("CORE_COMMON_COPYRIGHT_FOOTER", "© 2026 Delhi Jal Board. All rights reserved.")}</div>
      </div>
    </div>
  );
};

export default SideBar;
