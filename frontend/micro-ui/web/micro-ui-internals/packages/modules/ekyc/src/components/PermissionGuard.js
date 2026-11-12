import React from "react";
import { Redirect } from "react-router-dom";
import { hasAnyPermission } from "../utils/accessControl";

const PermissionGuard = ({
  permissions = [],
  children,
  redirectTo = "/digit-ui/citizen/ekyc-home",
}) => {
  const allowed = hasAnyPermission(permissions);

  if (!allowed) {
    return <Redirect to={redirectTo} />;
  }

  return children;
};

export default PermissionGuard;