import { useQuery } from "react-query";
import { WSService } from "../../services/elements/WS";

const useOldValue = ({ tenantId, filters, businessService }, config = {}) => {
  const bService = businessService === "WATER" || businessService === "WS" ? "WS" : "SW";
  return useQuery(
    ["WS_WATER_SEARCH", tenantId, filters, bService],
    async () => await WSService.search({ tenantId, filters, businessService: bService }),
    {
      ...config,
    }
  );
};

export default useOldValue;
