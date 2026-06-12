import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useSupervisorCreate = (tenantId) => {
  return useMutation((data) => SupervisorCreateActions(data, tenantId));
};

const SupervisorCreateActions = async (data, tenantId) => {
  const response = await FSMService.createSupervisor(data, tenantId);
  // Request utility returns { error: true } on failure instead of throwing
  if (response?.error || response?.Errors) {
    const message = response?.data?.Errors?.[0]?.message || response?.Errors?.[0]?.message || response?.message || "Something went wrong";
    throw new Error(message);
  }
  return response;
};

export default useSupervisorCreate;
