import React, { useState, useEffect } from "react";
import { AddressDetails } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
// import PropertySearchNSummary from "../pageComponents/PropertySearchNSummary";

const PropertyLocationDetails = ({
  address,
  actionCancelOnSubmit,
  isEdit,
  onSelect,
  config,
  // hidePropertySearch = false,
  hideZRO,
  formData: formDataProp,
  ...props
}) => {
  const { t } = useTranslation();
  const initialAddress = address || formDataProp?.locationDet || formDataProp?.address || props?.props?.value || {};
  const [formData, setFormData] = useState({
    noOfFloors: address?.noOfFloors || "",
    // addressType: initialAddress?.addressType || "",
    pincode: initialAddress?.pincode || initialAddress?.pinCode || "",
    city: initialAddress?.city || "",
    locality: initialAddress?.locality || "",
    streetName: initialAddress?.streetName || initialAddress?.street || "",
    houseNo: initialAddress?.houseNo || initialAddress?.houseNumber || initialAddress?.houseDoorNo || "",
    houseName: initialAddress?.houseName || "",
    landmark: initialAddress?.landmark || initialAddress?.landmarkName || "",
    addressLine1: initialAddress?.addressLine1 || initialAddress?.address || "",
    addressLine2: initialAddress?.addressLine2 || initialAddress?.address2 || "",
    latitude: initialAddress?.latitude || initialAddress?.geoLocation?.latitude || "",
    longitude: initialAddress?.longitude || initialAddress?.geoLocation?.longitude || "",
    assembly: initialAddress?.assembly || "",
    block: initialAddress?.block || "",
    zone: initialAddress?.zone || "",
    zroLocation: initialAddress?.zroLocation || initialAddress?.zro?.code || initialAddress?.zro || "",
    subLocality: initialAddress?.subLocality || "",
    actualAssembly: initialAddress?.actualAssembly || initialAddress?.assembly || "",
    actualWard: initialAddress?.actualWard || initialAddress?.block || initialAddress?.ward || "",
    actualZone: initialAddress?.actualZone || initialAddress?.zone || "",
    colonyMcdCategory: initialAddress?.colonyMcdCategory || "",

  });

  const isPropertyFound = window.location.href.includes("ws/old-application") || window.location.href.includes("/edit-property/") || window.location.href.includes("/edit-application");

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
      const rawNoOfFloors = details.noOfFloors || additionalDetails.numberOfFloors || additionalDetails.noOfFloors || addressData.noOfFloors || "";
      const rawTotalNoOfFloors = details.totalNoOfFloors || details.totalFloors || additionalDetails.totalNoOfFloors || additionalDetails.totalFloors || addressData.totalNoOfFloors || addressData.totalFloors || "";

      setFormData({
        pincode: addressData.pincode || "",
        city: addressData.city || "",
        locality: localityCode,
        streetName: addressData.street || "",
        houseNo: addressData.houseNo || addressData.doorNo || "",
        landmark: addressData.landmark || "",
        latitude: lat,
        longitude: lng,
        // Read assembly/block/zone from addressData directly (API returns them there)
        assembly: additionalDetails.assembly || addressData.assembly || addressData.additionalDetails?.assembly || "",
        block: additionalDetails.block || addressData.block || addressData.additionalDetails?.block || "",
        zone: additionalDetails.zone || addressData.zone || addressData.additionalDetails?.zone || "",
        zroLocation: zroCode,
        zro: zroValue,
        subLocality: addressData.subLocality || "",
        // Address lines from API
        addressLine1: addressData.addressLine1 || "",
        addressLine2: addressData.addressLine2 || "",
        noOfFloors: rawNoOfFloors,
        totalNoOfFloors: rawTotalNoOfFloors,
        totalFloors: rawTotalNoOfFloors,

        actualAssembly: addressData.actualAssembly || additionalDetails.actualAssembly || addressData.additionalDetails?.actualAssembly || additionalDetails.assembly || addressData.assembly || "",
        actualWard: addressData.actualWard || additionalDetails.actualWard || addressData.additionalDetails?.actualWard || additionalDetails.block || addressData.block || addressData.ward || "",
        actualZone: addressData.actualZone || additionalDetails.actualZone || addressData.additionalDetails?.actualZone || additionalDetails.zone || addressData.zone || "",
        address: {
          ...addressData,
          city: addressData.city || "",
          pincode: addressData.pincode || "",
          locality: localityCode,
          streetName: addressData.street || "",
          houseNo: addressData.houseNo || addressData.doorNo || "",
          latitude: lat,
          longitude: lng,
          zroLocation: zroCode,
          zro: zroValue,
          assembly: additionalDetails.assembly || addressData.assembly || addressData.additionalDetails?.assembly || "",
          block: additionalDetails.block || addressData.block || addressData.additionalDetails?.block || "",
          zone: additionalDetails.zone || addressData.zone || addressData.additionalDetails?.zone || "",
          subLocality: addressData.subLocality || "",
          addressLine1: addressData.addressLine1 || "",
          addressLine2: addressData.addressLine2 || "",
          noOfFloors: rawNoOfFloors,
          totalNoOfFloors: rawTotalNoOfFloors,
          totalFloors: rawTotalNoOfFloors,
          actualWard: addressData.actualWard || additionalDetails.actualWard || addressData.additionalDetails?.actualWard || additionalDetails.block || addressData.block || addressData.ward || "",
          actualZone: addressData.actualZone || additionalDetails.actualZone || addressData.additionalDetails?.actualZone || additionalDetails.zone || addressData.zone || "",
          actualAssembly: addressData.actualAssembly || additionalDetails.actualAssembly || addressData.additionalDetails?.actualAssembly || additionalDetails.assembly || addressData.assembly || "",

        },
      });
    } else if (formDataProp?.cpt === null) {
      const clearedData = {
        // addressType: "",
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
        noOfFloors: "",
        totalNoOfFloors: "",
        totalFloors: "",
        address: {},
      };
      setFormData(clearedData);
      onSelect(config?.key || "address", clearedData);
    }
  }, [formDataProp?.cpt?.details, formDataProp?.cpt]);

  return (
    <AddressDetails
      t={t}
      formData={formData}
      onSelect={(key, data) => {
        setFormData((prev) => ({ ...prev, ...data }));
        if (props?.props?.onChange) {
          props.props.onChange(data);
        }
        if (typeof onSelect === "function") {
          onSelect(key, data, { shouldDirty: true, shouldValidate: true });
        }
      }}
      config={{ isCollapsible: true, ...config }}
      isEdit={isEdit}
      // showZRO={hideZRO ? false : true}
      // showAddressType={false} (Address Type commented out in property create)
      showAddressType={false}
      showMapActualLocation={true}
      showNoOfFloors={true}
      disable={isPropertyFound}
      hideNextButton={true}
      isVendor={props.isVendor}
    />
  );
};
export default PropertyLocationDetails;
