import React from "react";

/**
 * @typedef {"normal" | "action"} LayoutType
 */

/**
 * @param {{ layoutClass?: LayoutType, children: React.ReactNode }} props
 */
const LayoutWrapper = ({ layoutClass = "normal", style, children }) => {
  return (
    <div style={style} className={layouts[layoutClass]}>
      {children}
    </div>
  );
};

export default LayoutWrapper;

const layouts = {
  normal: "employee-form no-scrollbar",
  action: "employee-form employee-form-content-with-action-bar no-scrollbar",
};
