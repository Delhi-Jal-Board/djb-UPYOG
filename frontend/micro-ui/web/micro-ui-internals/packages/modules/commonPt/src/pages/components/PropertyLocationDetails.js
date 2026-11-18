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
  const baseInitialAssembly = initialAddress?.assembly || "";
  const baseInitialBlock = initialAddress?.block || initialAddress?.ward || "";
  const baseInitialZone = initialAddress?.zone || "";

  const rawInitActualAssembly = initialAddress?.actualAssembly || "";
  const rawInitActualWard = initialAddress?.actualWard || "";
  const rawInitActualZone = initialAddress?.actualZone || "";

  const isInitActualIdentical =
    (!rawInitActualAssembly || rawInitActualAssembly === baseInitialAssembly) &&
    (!rawInitActualWard || rawInitActualWard === baseInitialBlock) &&
    (!rawInitActualZone || rawInitActualZone === baseInitialZone);

  const initActualAssembly = isInitActualIdentical ? "" : rawInitActualAssembly;
  const initActualWard = isInitActualIdentical ? "" : rawInitActualWard;
  const initActualZone = isInitActualIdentical ? "" : rawInitActualZone;

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
    actualAssembly: initActualAssembly,
    actualWard: initActualWard,
    actualZone: initActualZone,
    colonyMcdCategory: initialAddress?.colonyMcdCategory || "",

  });

  const isPropertyFound = window.location.href.includes("ws/old-application") || window.location.href.includes("/edit-property/") || window.location.href.includes("/edit-application");
  const lastCptKeyRef = React.useRef(null);
  const lastSentAddressRef = React.useRef(null);
  const onSelectRef = React.useRef(onSelect);
  const onChangeRef = React.useRef(props?.props?.onChange);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onChangeRef.current = props?.props?.onChange;
  });

  useEffect(() => {
    if (props.register) {
      props.register({ name: "cpt" });
      props.register({ name: "cptId" });
    }
  }, [props.register]);

  useEffect(() => {
    if (formDataProp?.cpt?.details) {
      const details = formDataProp.cpt.details;
      const propId = details?.propertyId || details?.id || "";
      const modTime = details?.auditDetails?.lastModifiedTime || details?.auditDetails?.createdTime || "";
      const cptKey = `${propId}_${modTime}`;
      if (lastCptKeyRef.current === cptKey) {
        return;
      }
      lastCptKeyRef.current = cptKey;
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
      const rawNoOfFloors =
        additionalDetails.numberOfFloors ||
        additionalDetails.noOfFloors ||
        details.numberOfFloors ||
        addressData.numberOfFloors ||
        addressData.noOfFloors ||
        details.noOfFloors ||
        "";
      const rawTotalNoOfFloors =
        additionalDetails.totalNoOfFloors ||
        additionalDetails.totalFloors ||
        details.totalNoOfFloors ||
        details.totalFloors ||
        addressData.totalNoOfFloors ||
        addressData.totalFloors ||
        details.noOfFloors ||
        "";

        const baseAssembly = additionalDetails.assembly || addressData.assembly || addressData.additionalDetails?.assembly || "";
        const baseBlock = additionalDetails.block || addressData.block || addressData.additionalDetails?.block || addressData.ward || "";
        const baseZone = additionalDetails.zone || addressData.zone || addressData.additionalDetails?.zone || "";

        const rawActualAssembly = addressData.actualAssembly || additionalDetails.actualAssembly || addressData.additionalDetails?.actualAssembly || "";
        const rawActualWard = addressData.actualWard || additionalDetails.actualWard || addressData.additionalDetails?.actualWard || "";
        const rawActualZone = addressData.actualZone || additionalDetails.actualZone || addressData.additionalDetails?.actualZone || "";

        const isActualIdentical =
          (!rawActualAssembly || rawActualAssembly === baseAssembly) &&
          (!rawActualWard || rawActualWard === baseBlock) &&
          (!rawActualZone || rawActualZone === baseZone);

        const actualAssemblyVal = isActualIdentical ? "" : rawActualAssembly;
        const actualWardVal = isActualIdentical ? "" : rawActualWard;
        const actualZoneVal = isActualIdentical ? "" : rawActualZone;

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
        assembly: baseAssembly,
        block: baseBlock,
        zone: baseZone,
        zroLocation: zroCode,
        zro: zroValue,
        subLocality: addressData.subLocality || "",
        // Address lines from API
        addressLine1: addressData.addressLine1 || "",
        addressLine2: addressData.addressLine2 || "",
        noOfFloors: rawNoOfFloors,
        numberOfFloors: rawNoOfFloors,
        totalNoOfFloors: rawTotalNoOfFloors,
        totalFloors: rawTotalNoOfFloors,

        actualAssembly: actualAssemblyVal,
        actualWard: actualWardVal,
        actualZone: actualZoneVal,
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
          assembly: baseAssembly,
          block: baseBlock,
          zone: baseZone,
          subLocality: addressData.subLocality || "",
          addressLine1: addressData.addressLine1 || "",
          addressLine2: addressData.addressLine2 || "",
          noOfFloors: rawNoOfFloors,
          numberOfFloors: rawNoOfFloors,
          totalNoOfFloors: rawTotalNoOfFloors,
          totalFloors: rawTotalNoOfFloors,
          actualWard: actualWardVal,
          actualZone: actualZoneVal,
          actualAssembly: actualAssemblyVal,

        },
      });
    } else if (formDataProp?.cpt === null) {
      if (lastCptKeyRef.current === "CLEARED") return;
      lastCptKeyRef.current = "CLEARED";
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
      if (typeof onSelectRef.current === "function") {
        onSelectRef.current(config?.key || "address", clearedData);
      }
    }
  }, [formDataProp?.cpt?.details, formDataProp?.cpt]);

  const handleAddressSelect = React.useCallback(
    (key, data) => {
      const dataStr = JSON.stringify(data);
      if (lastSentAddressRef.current === dataStr) {
        return;
      }
      lastSentAddressRef.current = dataStr;

      setFormData((prev) => {
        const updated = { ...prev, ...data };
        if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
        return updated;
      });

      if (onChangeRef.current) {
        onChangeRef.current(data);
      }
      if (typeof onSelectRef.current === "function") {
        onSelectRef.current(key, data, { shouldDirty: true, shouldValidate: true });
      }
    },
    []
  );

  return (
    <AddressDetails
      t={t}
      formData={formData}
      onSelect={handleAddressSelect}
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
