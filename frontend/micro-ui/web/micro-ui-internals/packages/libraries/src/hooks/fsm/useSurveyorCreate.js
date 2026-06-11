import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useSurveyorCreate = (tenantId) => {
  return useMutation((data) => SurveyorCreateActions(data, tenantId));
};

const SurveyorCreateActions = async (data, tenantId) => {
  const response = await FSMService.createSurveyor(data, tenantId);
  // Request utility returns { error: true } on failure instead of throwing
  if (response?.error || response?.Errors) {
    const message = response?.data?.Errors?.[0]?.message || response?.Errors?.[0]?.message || response?.message || "Something went wrong";
    throw new Error(message);
  }
  return response;
};

export default useSurveyorCreate;
