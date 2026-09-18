import { WSService } from "../../services/elements/WS";
import { useMutation } from "react-query";

const useWSBillingStatement = (businessService = "WS") => {
    return useMutation((details) => WSService.monthlyBillingSearch(details, {}, businessService));
};

export default useWSBillingStatement;
