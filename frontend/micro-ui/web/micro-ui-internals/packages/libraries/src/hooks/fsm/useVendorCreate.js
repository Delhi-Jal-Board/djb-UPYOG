import { useMutation } from "react-query";
import { FSMService } from "../../services/elements/FSM";

const useVendorCreate = (tenantId) => {
  return useMutation((vendorData) => VendorCreateActions(vendorData, tenantId));
};

const VendorCreateActions = async (vendorData, tenantId) => {
  const response = await FSMService.createVendor(vendorData, tenantId);

  if (response?.error) {
    throw new Error(response?.data?.Errors?.[0]?.message || response?.message || "Vendor creation failed");
  }

  return response;
};

export default useVendorCreate;
