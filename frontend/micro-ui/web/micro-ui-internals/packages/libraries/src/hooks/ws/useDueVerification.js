import { useMutation } from "react-query";
import { WSService } from "../../services/elements/WS";

const useDueVerification = (tenantId, config = {}) => {
  return useMutation((data) => WSService.dueVerification(data, { tenantId }), config);
};

export default useDueVerification;
