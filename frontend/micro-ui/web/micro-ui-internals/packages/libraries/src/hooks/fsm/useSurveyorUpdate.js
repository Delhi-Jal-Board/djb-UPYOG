import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useSurveyorUpdate = (tenantId) => {
  return useMutation((surveyorData) => SurveyorUpdateActions(surveyorData, tenantId));
};

const SurveyorUpdateActions = async (surveyorData, tenantId) => {
  const response = await FSMService.updateSurveyor(surveyorData, tenantId);
  if (response instanceof Error || response?.error || response?.Errors || response?.response?.data?.Errors) {
    const apiError = response?.response?.data || response?.data || response;
    const message = apiError?.Errors?.[0]?.message || apiError?.error?.message || response?.message || "Something went wrong";
    throw new Error(message);
  }
  return response;
};

export default useSurveyorUpdate;
