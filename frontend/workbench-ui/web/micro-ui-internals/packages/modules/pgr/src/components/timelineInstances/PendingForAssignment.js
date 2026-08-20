import React from "react";
import { CheckPoint } from "@djb25/workbench-ui-react-components";

const PendingForAssignment = ({ isCompleted, text, complaintFiledDate, customChild }) => {
  return <CheckPoint isCompleted={isCompleted} label={text} customChild={customChild} />;
};

export default PendingForAssignment;
