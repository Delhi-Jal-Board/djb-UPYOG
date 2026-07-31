import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useVendorCreate = (tenantId) => {
  return useMutation((vendorData) => VendorCreateActions(vendorData, tenantId));
};

const VendorCreateActions = async (vendorData, tenantId) => {
  const response = await FSMService.createVendor(vendorData, tenantId);

  if (response instanceof Error || response?.error || response?.Errors || response?.response?.data?.Errors) {
    const apiError = response?.response?.data || response?.data || response;
    const message = apiError?.Errors?.[0]?.message || apiError?.error?.message || response?.message || "Vendor creation failed";
    throw new Error(message);
  }

  return response;
};

export default useVendorCreate;
