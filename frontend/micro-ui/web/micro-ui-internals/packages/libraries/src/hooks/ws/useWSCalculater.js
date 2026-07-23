import { WSService } from "../../services/elements/WS";
import { useMutation } from "react-query";

const useWSCalculater = ({ tenantId, filters, config = {} } = {}) => {
  return useMutation((data) => WSService.WSCalculateCharges({ details: data, tenantId, filters }), config);
};

export default useWSCalculater;
