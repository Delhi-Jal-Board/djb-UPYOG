import React, { useState, useEffect } from "react";
import { Modal, AddressDetails } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";

const Heading = ({ t }) => <h1 className="heading-m">{t("FILL_ADDRESS_DETAILS")}</h1>;
/**
 * AddressDetailss component renders a  popup for capturing and submitting user address details.
 * It utilizes Digit's UI components and services to present a form and update the user's profile address.
 * Using the `AddressDetails` component to handle all address-related input fields such as pincode, city, locality, street name, house number, landmark, and address lines.
 * - Displaying success or error toasts based on the response.
 */
const Address = ({ address, actionCancelOnSubmit, isEdit }) => {
  const { t } = useTranslation();
  const { data: allCities } = Digit.Hooks.useTenants();
  const { handleSubmit } = useForm();
  const [showToast, setShowToast] = useState(null);
  const [formData, setFormData] = useState({
    addressType: address?.addressType || "",
    pincode: address?.pinCode || "",
    city: typeof address?.city === "string"
      ? { code: Digit.ULBService.getCurrentTenantId(), name: address.city }
      : (address?.city || ""),
    locality: address?.locality || "",
    streetName: address?.streetName || "",
    houseNo: address?.houseNumber || "",
    houseName: address?.houseName || "",
    landmark: address?.landmark || "",
    addressLine1: address?.address || "",
    addressLine2: address?.address2 || "",
    latitude: address?.latitude || "",
    longitude: address?.longitude || "",
    assembly: address?.assembly || "",
    block: address?.block || "",
    zone: address?.zone || "",
  });
  /*
   * This component renders a modal for capturing and updating user address details.
   * - Manages form state for address fields like pincode, city, locality, etc., using `useState`.
   * - Uses `updateProfile` to send updated address details to the backend via `Digit.UserService.createAddressV2`.
   * - Displays success or error toasts based on the API response.
   * - Renders a form inside a modal using `AddressDetails` for input fields and React Hook Form for submission handling.
   */
  // timer for toast

  // Set default city if empty or improperly formatted by backend
  useEffect(() => {
    if (allCities && allCities.length > 0) {
      const tenantId = Digit.ULBService.getCurrentTenantId();
      const defaultCity = allCities.find(c => c.code === tenantId) || allCities[0];

      const currentCity = formData.city;
      if (!currentCity || typeof currentCity === "string" || currentCity.code === "Delhi") {
        setFormData(prev => ({ ...prev, city: defaultCity }));
      }
    }
  }, [allCities, formData.city]);

  const { createAddress, updateAddress: updateAddressMutation } = Digit.Hooks.useAddress(null, Digit.ULBService.getCurrentTenantId());

  const updateProfile = async () => {
    try {
      if (!formData.city) {
        setShowToast({ error: true, label: t("CORE_COMMON_CITY_REQUIRED") || "City is required" });
        return;
      }
      if (!formData.pincode && !formData.pinCode) {
        setShowToast({ error: true, label: t("CORE_COMMON_PINCODE_REQUIRED") || "Pincode is required" });
        return;
      }
      if (!formData.addressLine1 && !formData.address) {
        setShowToast({ error: true, label: t("CORE_COMMON_ADDRESS_REQUIRED") || "Address is required" });
        return;
      }

      const stateCode = Digit.ULBService.getStateId();
      const tenantId = Digit.ULBService.getCurrentTenantId();
      const user = Digit.UserService.getUser();
      const userInfo = user?.info;
      const userUuid = userInfo?.uuid || userInfo?.userUuid || "";

      if (!userInfo) {
        throw new Error("User session not found");
      }

      const requestData = {
        pinCode: formData.pincode || formData.pinCode,
        city: formData.city?.name || formData.city,
        address: formData.addressLine1 || formData.address,
        type: formData.addressType?.code || formData.addressType,
        tenantId: stateCode,
        userId: userInfo?.id,
        addressType:
          (formData.addressType?.code || formData.addressType) === "CORRESPONDENCE"
            ? "COPONDENCE"
            : formData.addressType?.code || formData.addressType,
        address2: formData.addressLine2,
        houseNumber: formData.houseNo,
        houseName: formData.houseName || formData.city?.name || formData.city,
        streetName: formData.streetName,
        landmark: formData.landmark,
        locality: formData.locality?.code || formData.locality,
      };

      createAddress.mutate(
        { address: requestData, userUuid },
        {
          onSuccess: (data) => {
            setShowToast({ key: "success", label: t("ADDRESS_UPDATED_SUCCESSFULLY") || "Address updated successfully" });
          },
          onError: (error) => {
            let message = t("CORE_COMMON_PROFILE_UPDATE_ERROR");
            try {
              const errorObj = typeof error === "string" ? JSON.parse(error) : error;
              message = errorObj?.message || message;
            } catch (e) { }
            setShowToast({
              error: true,
              label: message,
            });
          },
        }
      );
    } catch (error) {
      let message = t("CORE_COMMON_PROFILE_UPDATE_ERROR");
      try {
        const errorObj = JSON.parse(error);
        message = errorObj?.message || message;
      } catch (e) { }
      setShowToast({
        error: true,
        label: message,
      });
    }
  };

  const updateAddress = async () => {
    try {
      if (!formData.city) {
        setShowToast({ error: true, label: t("CORE_COMMON_CITY_REQUIRED") || "City is required" });
        return;
      }
      if (!formData.pincode && !formData.pinCode) {
        setShowToast({ error: true, label: t("CORE_COMMON_PINCODE_REQUIRED") || "Pincode is required" });
        return;
      }
      if (!formData.addressLine1 && !formData.address) {
        setShowToast({ error: true, label: t("CORE_COMMON_ADDRESS_REQUIRED") || "Address is required" });
        return;
      }

      const stateCode = Digit.ULBService.getStateId();
      const tenantId = Digit.ULBService.getCurrentTenantId();
      const user = Digit.UserService.getUser();
      const userInfo = user?.info;
      const userUuid = userInfo?.uuid || userInfo?.userUuid || "";

      if (!userInfo) {
        throw new Error("User session not found");
      }

      const requestUpdatedData = {
        pinCode: formData.pincode || formData.pinCode,
        city: formData.city?.name || formData.city,
        address: formData.addressLine1 || formData.address,
        type: formData.addressType?.code || formData.addressType,
        tenantId: stateCode,
        userId: address?.userId || userInfo?.id || userInfo?.userId || null,
        addressType:
          (formData.addressType?.code || formData.addressType) === "CORRESPONDENCE"
            ? "COPONDENCE"
            : formData.addressType?.code || formData.addressType,
        address2: formData.addressLine2,
        houseNumber: formData.houseNo,
        houseName: formData.houseName || formData.city?.name || formData.city,
        streetName: formData.streetName,
        landmark: formData.landmark,
        locality: formData.locality?.code || formData.locality,

        id: address?.id,
      };

      updateAddressMutation.mutate(
        { address: requestUpdatedData, userUuid },
        {
          onSuccess: (data) => {
            setShowToast({ key: "success", label: t("ADDRESS_UPDATED_SUCCESSFULLY") || "Address updated successfully" });
          },
          onError: (error) => {
            let message = t("CORE_COMMON_PROFILE_UPDATE_ERROR");
            try {
              const errorObj = typeof error === "string" ? JSON.parse(error) : error;
              message = errorObj?.message || message;
            } catch (e) { }
            setShowToast({
              error: true,
              label: message,
            });
          },
        }
      );
    } catch (error) {
      let message = t("CORE_COMMON_PROFILE_UPDATE_ERROR");
      try {
        const errorObj = JSON.parse(error);
        message = errorObj?.message || message;
      } catch (e) { }
      setShowToast({
        error: true,
        label: message,
      });
    }
  };

  return (
    <Modal
      headerBarMain={<Heading t={t} />}
      popupStyles={{
        backgroundColor: "#fff",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
      actionSaveLabel={isEdit ? "CS_COMMON_UPDATE" : t("CS_COMMON_SUBMIT")}
      actionCancelLabel={t("BACK")}
      actionCancelOnSubmit={actionCancelOnSubmit}
      actionSaveOnSubmit={handleSubmit(isEdit ? updateAddress : updateProfile)}
      formId="modal-action"
      setError={setShowToast}
      error={showToast?.label}
    >
      <div style={{ boxShadow: "none" }}>
        <AddressDetails
          t={t}
          formData={formData}
          onSelect={(key, data) => {
            if (typeof key === "string") {
              if (typeof data === "object" && data !== null) {
                setFormData((prev) => ({ ...prev, ...data }));
              } else {
                setFormData((prev) => ({ ...prev, [key]: data }));
              }
            } else if (typeof key === "object" && key !== null) {
              setFormData((prev) => ({ ...prev, ...key }));
            }
          }}
          isEdit={isEdit}
          config={{ isCollapsible: false, key: "address" }}
          hideNextButton={true}
        />
      </div>
    </Modal>
  );
};
export default Address;
