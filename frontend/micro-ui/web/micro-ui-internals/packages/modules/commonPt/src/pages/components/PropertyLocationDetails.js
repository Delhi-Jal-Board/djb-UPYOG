import React, { useState, useEffect } from "react";
import { AddressDetails, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import PropertySearchNSummary from "../pageComponents/PropertySearchNSummary";

const PropertyLocationDetails = ({ address, actionCancelOnSubmit, isEdit, onSelect, config, formData: formDataProp, ...props }) => {
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState(null);
  const [formData, setFormData] = useState({
    addressType: address?.addressType || "",
    pincode: address?.pinCode || "",
    city: address?.city || "",
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
    zroLocation: address?.zroLocation || "",
    subLocality: address?.subLocality || "",
    actualAssembly: address?.actualAssembly || "",
    actualWard: address?.actualWard || "",
    actualZone: address?.actualZone || "",
  });

  const isPropertyFound = window.location.href.includes("ws/old-application");

  useEffect(() => {
    if (props.register) {
      props.register({ name: "cpt" });
      props.register({ name: "cptId" });
    }
  }, [props.register]);

  useEffect(() => {
    if (formDataProp?.cpt?.details) {
      const details = formDataProp.cpt.details;
      const addressData = details.address || {};
      const additionalDetails = details.additionalDetails || {};

      const localityCode = addressData.locality?.code || addressData.locality || "";
      const lat =
        addressData.geoLocation?.latitude && addressData.geoLocation?.latitude !== 0
          ? addressData.geoLocation.latitude
          : addressData.locality?.latitude || addressData.latitude || "";
      const lng =
        addressData.geoLocation?.longitude && addressData.geoLocation?.longitude !== 0
          ? addressData.geoLocation.longitude
          : addressData.locality?.longitude || addressData.longitude || "";

      // Read zroLocation from address object first (where API returns it), then fallback to additionalDetails
      const zroCode = addressData.zroLocation || additionalDetails.zroLocation || addressData.additionalDetails?.zroLocation || "";
      // Convert to dropdown-compatible object so AddressDetails Dropdown can match it
      const zroValue = zroCode ? { code: zroCode, name: zroCode, i18nKey: zroCode } : "";

      setFormData({
        pincode: addressData.pincode || "",
        city: addressData.city || "",
        locality: localityCode,
        streetName: addressData.street || "",
        houseNo: addressData.houseNo || "",
        landmark: addressData.landmark || "",
        latitude: lat,
        longitude: lng,
        assembly: additionalDetails.assembly || addressData.additionalDetails?.assembly || "",
        block: additionalDetails.block || addressData.additionalDetails?.block || "",
        zone: additionalDetails.zone || addressData.additionalDetails?.zone || "",
        zroLocation: zroCode,
        zro: zroValue,
        subLocality: addressData.subLocality || "",
        actualAssembly: addressData.actualAssembly || additionalDetails.actualAssembly || addressData.additionalDetails?.actualAssembly || "",
        actualWard: addressData.actualWard || additionalDetails.actualWard || addressData.additionalDetails?.actualWard || "",
        actualZone: addressData.actualZone || additionalDetails.actualZone || addressData.additionalDetails?.actualZone || "",
        address: {
          ...addressData,
          city: addressData.city || "",
          pincode: addressData.pincode || "",
          locality: localityCode,
          streetName: addressData.street || "",
          houseNo: addressData.houseNo || "",
          addressLine1: addressData.street || "",
          latitude: lat,
          longitude: lng,
          zroLocation: zroCode,
          zro: zroValue,
          assembly: additionalDetails.assembly || addressData.additionalDetails?.assembly || "",
          block: additionalDetails.block || addressData.additionalDetails?.block || "",
          zone: additionalDetails.zone || addressData.additionalDetails?.zone || "",
          subLocality: addressData.subLocality || "",
          actualWard: addressData.actualWard || additionalDetails.actualWard || addressData.additionalDetails?.actualWard || "",
          actualZone: addressData.actualZone || additionalDetails.actualZone || addressData.additionalDetails?.actualZone || "",
          actualAssembly: addressData.actualAssembly || additionalDetails.actualAssembly || addressData.additionalDetails?.actualAssembly || "",
        },
      });
    } else if (formDataProp?.cpt === null) {
      const clearedData = {
        addressType: "",
        pincode: "",
        city: "",
        locality: "",
        streetName: "",
        houseNo: "",
        houseName: "",
        landmark: "",
        addressLine1: "",
        addressLine2: "",
        latitude: "",
        longitude: "",
        assembly: "",
        block: "",
        zone: "",
        zroLocation: "",
        subLocality: "",
        actualWard: "",
        actualZone: "",
        actualAssembly: "",
        zro: "",
        address: {},
      };
      setFormData(clearedData);
      onSelect(config?.key || "address", clearedData);
    }
  }, [formDataProp?.cpt?.details, formDataProp?.cpt]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <CollapsibleCardPage title={t("PT_LOCATION_DETAILS")} defaultOpen={true}>
      {/* {!window.location.href.includes("create-application/create-property") && (
          <PropertySearchNSummary config={config} onSelect={onSelect} formData={formDataProp} userType={window.location.href.includes("/employee/") ? "employee" : "citizen"} />
        )} */}
      {/* <div style={{ marginTop: "20px" }}> */}
      <AddressDetails
        t={t}
        formData={formData}
        onSelect={(key, data) => {
          setFormData((prev) => ({ ...prev, ...data }));
          onSelect(key, data);
        }}
        config={{ isCollapsible: false, ...config }}
        isEdit={isEdit}
        showZRO={true}
        showMapActualLocation={true}
        disable={isPropertyFound}
        hideNextButton={true}
      />
      {/* </div> */}
    </CollapsibleCardPage>
  );
};
export default PropertyLocationDetails;
