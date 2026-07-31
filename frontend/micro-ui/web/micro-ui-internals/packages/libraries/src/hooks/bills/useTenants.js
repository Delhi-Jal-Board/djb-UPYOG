import React, { useState } from "react";

const useTenants = () => {
  const tenantInfo = Digit.SessionStorage.get("BILLS_TENANTS");
  const initDataTenants = Digit.SessionStorage.get("initData")?.tenants;

  const [tenants, setTenants] = useState(tenantInfo && tenantInfo.length > 0 ? tenantInfo : initDataTenants);

  return tenants;
};

export default useTenants;
