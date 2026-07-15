import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useSupervisorCreate = (tenantId) => {
  return useMutation((data) => SupervisorCreateActions(data, tenantId));
};

const SupervisorCreateActions = async (data, tenantId) => {
  const response = await FSMService.createSupervisor(data, tenantId);
  if (response instanceof Error || response?.error || response?.Errors || response?.response?.data?.Errors) {
    const apiError = response?.response?.data || response?.data || response;
    const message = apiError?.Errors?.[0]?.message || apiError?.error?.message || response?.message || "Something went wrong";
    throw new Error(message);
  }
  return response;
};

export default useSupervisorCreate;
