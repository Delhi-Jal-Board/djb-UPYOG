import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import Label from "../atoms/Label";
import TextInput from "../atoms/TextInput";
import Dropdown from "../atoms/Dropdown";
import UploadFile from "../atoms/UploadFile";
import Toast from "../atoms/Toast";
import FormStep from "./FormStep";
import { useLocation } from "react-router-dom";
import CardLabelError from "../atoms/CardLabelError";
import Modal from "../hoc/Modal";
import Button from "../atoms/Button";

const allOptions = [
  { name: "Correspondence", code: "CORRESPONDENCE", i18nKey: "COMMON_ADDRESS_TYPE_CORRESPONDENCE" },
  { name: "Permanent", code: "PERMANENT", i18nKey: "COMMON_ADDRESS_TYPE_PERMANENT" },
  { name: "Other", code: "OTHER", i18nKey: "COMMON_ADDRESS_TYPE_OTHER" },
];

const AddressDetails = ({ t, config, onSelect, formData, isEdit, userDetails, disable, ...props }) => {
  const { showZRO: configShowZRO, mappedZROLocation: configMappedZROLocation, hideNextButton: configHideNextButton } = config || {};
  const showZRO = props.showZRO !== undefined ? props.showZRO : configShowZRO;
  const mappedZROLocation = props.mappedZROLocation !== undefined ? props.mappedZROLocation : configMappedZROLocation;
  const hideNextButton = props.hideNextButton !== undefined ? props.hideNextButton : configHideNextButton;

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { data: zroLocationsData } = Digit.Hooks.ws.useWSConfigMDMS.ZROLocation(tenantId, { enabled: !!showZRO && !mappedZROLocation });

  const _mappedZROLocation = useMemo(() => {
    if (mappedZROLocation) return mappedZROLocation;
    return zroLocationsData?.map((item) => ({
      ...item,
      i18nKey: item?.i18nKey || item?.name || item?.code,
    }));
  }, [mappedZROLocation, zroLocationsData]);

  const { data: allCities } = Digit.Hooks.useTenants();
  const convertToObject = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    return { i18nKey: value, code: value, value: value };
  };
  const [pincode, setPincode] = useState(
    (formData?.pincode || formData?.address?.pincode || formData?.infodetails?.existingDataSet?.address?.pincode)?.toString().split(".")[0] || ""
  );
  const [city, setCity] = useState(
    convertToObject(formData?.city) || formData?.address?.city || formData?.infodetails?.existingDataSet?.address?.cityValue || ""
  );
  const [locality, setLocality] = useState(
    convertToObject(formData?.locality) || formData?.address?.locality || formData?.infodetails?.existingDataSet?.address?.locality || ""
  );
  const [houseNo, setHouseNo] = useState(
    formData?.houseNo || formData?.address?.houseNo || formData?.infodetails?.existingDataSet?.address?.houseNo || ""
  );
  const [streetName, setstreetName] = useState(
    formData?.streetName || formData?.address?.streetName || formData?.infodetails?.existingDataSet?.address?.streetName || ""
  );
  const [landmark, setLandmark] = useState(
    formData?.landmark || formData?.address?.landmark || formData?.infodetails?.existingDataSet?.address?.landmark || ""
  );
  const [addressLine1, setAddressLine1] = useState(
    formData?.addressLine1 ||
    formData?.subLocality ||
    formData?.address?.addressLine1 ||
    formData?.address?.subLocality ||
    formData?.infodetails?.existingDataSet?.address?.addressline1 ||
    ""
  );
  const [addressLine2, setAddressLine2] = useState(
    formData?.addressLine2 || formData?.address?.addressLine2 || formData?.infodetails?.existingDataSet?.address?.addressline2 || ""
  );
  const [doorImage, setDoorImage] = useState(formData?.doorImage || null);
  const [doorImageId, setDoorImageId] = useState(formData?.doorImageId || null);
  const [toast, setToast] = useState(null);
  const [addressType, setAddressType] = useState(
    convertToObject(formData?.addressType) || formData?.address?.addressType || formData?.infodetails?.existingDataSet?.address?.addressType
      ? allOptions.find(
        (a) =>
          a.code ===
          (formData?.addressType?.code ||
            formData?.addressType ||
            formData?.address?.addressType ||
            formData?.infodetails?.existingDataSet?.address?.addressType)
      ) ||
      convertToObject(formData?.addressType) ||
      formData?.address?.addressType ||
      formData?.infodetails?.existingDataSet?.address?.addressType
      : allOptions.find((a) => a.code === "PERMANENT")
  );
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [latitude, setLatitude] = useState(
    formData?.latitude || formData?.address?.latitude || formData?.infodetails?.existingDataSet?.address?.latitude || ""
  );
  const [longitude, setLongitude] = useState(
    formData?.longitude || formData?.address?.longitude || formData?.infodetails?.existingDataSet?.address?.longitude || ""
  );
  const [zone, setZone] = useState(formData?.zone || formData?.address?.zone || "");
  const [block, setBlock] = useState(formData?.block || formData?.address?.block || "");
  const [assembly, setAssembly] = useState(formData?.assembly || formData?.address?.assembly || "");
  const [zro, setZro] = useState(formData?.zro || formData?.address?.zro || formData?.infodetails?.existingDataSet?.address?.zro || "");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [subLocality, setSubLocality] = useState(
    formData?.subLocality || formData?.address?.subLocality || formData?.infodetails?.existingDataSet?.address?.subLocality || ""
  );
  const [wardRemark, setWardRemark] = useState(
    formData?.wardRemark || formData?.address?.wardRemark || formData?.infodetails?.existingDataSet?.address?.wardRemark || ""
  );
  const [actualAssembly, setActualAssembly] = useState(
    formData?.actualAssembly || formData?.address?.actualAssembly || formData?.infodetails?.existingDataSet?.address?.actualAssembly || ""
  );
  const [actualZone, setActualZone] = useState(
    formData?.actualZone || formData?.address?.actualZone || formData?.infodetails?.existingDataSet?.address?.actualZone || ""
  );
  const [actualWard, setActualWard] = useState(
    formData?.actualWard || formData?.address?.actualWard || formData?.infodetails?.existingDataSet?.address?.actualWard || ""
  );
  const [tempAssembly, setTempAssembly] = useState("");
  const [tempZone, setTempZone] = useState("");
  const [tempWard, setTempWard] = useState("");
  const [showModal, setShowModal] = useState(false);

  const {
    control,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (allCities?.length > 0 && !city) {
      const delhi = allCities.find(
        (c) => c.name?.toLowerCase() === "delhi" || c.code?.toLowerCase().includes("delhi") || c.i18nKey?.toLowerCase().includes("delhi")
      );
      if (delhi) setCity(delhi);
    }
  }, [allCities, city]);

  const resolveNestedValue = (value, path) =>
    path.split(".").reduce((accumulator, currentKey) => {
      if (accumulator === null || accumulator === undefined) return undefined;
      return accumulator[currentKey];
    }, value);

  const getFieldError = (fieldName) => resolveNestedValue(errors, fieldName);
  const location = useLocation();

  const isEkyc = window.location.pathname.includes("/ekyc");
  const queryParams = new URLSearchParams(location.search);
  const urlKno = queryParams.get("kno");
  const searchKno = isEkyc
    ? urlKno || location?.state?.kNumber || location?.state?.kno || formData?.kNumber || formData?.kno || sessionStorage.getItem("EKYC_K_NUMBER")
    : null;

  const { data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchKno, fetchType: "ADDRESS" } },
    { enabled: !!searchKno && isEkyc, cacheTime: 0 }
  );

  const availableAddressTypeOptions = useMemo(() => {
    const usedAddressTypes = location.state?.usedAddressTypes || [];
    if (usedAddressTypes.length === 3) {
      // If all are available → show only "Other"
      return allOptions.filter((opt) => opt.code === "OTHER");
    }
    // Otherwise, show whatever is not used
    return allOptions.filter((opt) => !usedAddressTypes.includes(opt.code));
  }, [location.state?.usedAddressTypes]);
  const locationTenantId = city?.code || tenantId;
  const { data: egovLocationData } = Digit.Hooks.useCommonMDMS(locationTenantId, "egov-location", ["TenantBoundary"]);

  const boundaryData = useMemo(() => {
    const tenantBoundary = egovLocationData?.["egov-location"]?.TenantBoundary || [];
    const revenueData = tenantBoundary.find((item) => item?.hierarchyType?.code === "REVENUE");
    const boundary = revenueData?.boundary || [];
    return Array.isArray(boundary) ? boundary : [boundary];
  }, [egovLocationData]);

  const { assemblyOptions, zoneOptions, wardOptions } = useMemo(() => {
    const assemblies = new Map();
    const zones = new Map();
    const wards = new Map();

    const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

    const traverse = (node) => {
      if (!node) return;
      if (node.label === "Zone" || node.label === "ZONE") {
        const code = node.code || node.localname || node.name;
        const name = node.name || node.localname || code;
        if (code) zones.set(code, { code, i18nKey: code, name: name });
      }
      if (node.label === "Ward" || node.label === "WARD" || node.label === "Block" || node.label === "BLOCK") {
        const code = node.code || node.localname || node.name;
        if (code) wards.set(code, { code, i18nKey: code, name: code });
      }
      if (node.label === "Assembly Constituency" || node.label === "ASSEMBLY_CONSTITUENCY") {
        const code = node.code || node.localname || node.name;
        if (code) assemblies.set(code, { code, i18nKey: code, name: code });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    boundaries.forEach(traverse);

    return {
      assemblyOptions: Array.from(assemblies.values()),
      zoneOptions: Array.from(zones.values()),
      wardOptions: Array.from(wards.values()),
    };
  }, [boundaryData]);

  const structuredLocalityData = useMemo(() => {
    let localities = [];
    const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

    const extractLocalities = (node, zone = null, ward = null, assembly = null) => {
      if (!node) return;

      let currentZone = zone;
      let currentWard = ward;
      let currentAssembly = assembly;

      if (node.label === "Zone" || node.label === "ZONE") {
        currentZone = node.localname || node.code || node.name;
      }
      if (node.label === "Ward" || node.label === "WARD" || node.label === "Block" || node.label === "BLOCK") {
        currentWard = node.code || node.localname || node.name;
      }
      if (node.label === "Assembly Constituency" || node.label === "ASSEMBLY_CONSTITUENCY") {
        currentAssembly = node.code || node.localname || node.name;
      }

      // Specifically target nodes that are officially labeled as Locality
      if (node.label === "Locality" || node.label === "LOCALITY") {
        localities.push({
          ...node,
          name: node.localname || node.name || node.code,
          i18nKey: node.i18nKey || `${locationTenantId.replace(".", "_")}_REVENUE_${node.code}`.toUpperCase(),
          zone: currentZone,
          ward: currentWard,
          assembly: currentAssembly,
        });
      }
      // Always traverse down in case there are nested boundaries underneath
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => extractLocalities(child, currentZone, currentWard, currentAssembly));
      }
    };

    boundaries.forEach((rootNode) => extractLocalities(rootNode));

    return localities;
  }, [boundaryData, locationTenantId]);

  const fetchedPincodes = useMemo(() => {
    const pinSet = new Set();

    structuredLocalityData.forEach((loc) => {
      if (loc.pincode) {
        const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
        pins.forEach((p) => {
          if (p) {
            const sanitizedPin = p.toString().split(".")[0];
            pinSet.add(sanitizedPin);
          }
        });
      }
    });

    if (pinSet.size === 0 && city?.pincode) {
      const pins = Array.isArray(city.pincode) ? city.pincode : [city.pincode];
      pins.forEach((p) => pinSet.add(p.toString()));
    }

    return Array.from(pinSet)
      .sort()
      .map((pin) => ({
        code: pin,
        name: pin,
        i18nKey: pin,
      }));
  }, [structuredLocalityData, city]);

  const filteredLocalities = useMemo(() => {
    // If pincode is not provided, show all localities
    if (!pincode) return structuredLocalityData;

    // Check if the entered pincode exists in our data
    const pincodeExists = structuredLocalityData.some((loc) => {
      if (!loc.pincode) return false;
      const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
      return pins.some((p) => p.toString() === pincode);
    });

    // If pincode exists in data, filter localities. If not (manual entry), show all localities.
    if (pincodeExists) {
      return structuredLocalityData.filter((loc) => {
        if (!loc.pincode) return false;
        const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
        return pins.some((p) => p.toString() === pincode);
      });
    }

    return structuredLocalityData;
  }, [structuredLocalityData, pincode]);

  useEffect(() => {
    handleGetLocation();
  }, []);

  const extractApplicationData = (searchData) => {
    if (!searchData) return null;
    const reviewWrapper = searchData?.applicationReviewInfo || searchData?.applicationReview || searchData;
    const applicationData = (Array.isArray(reviewWrapper) ? reviewWrapper[0] : reviewWrapper) || {};
    return applicationData?.newData || applicationData;
  };

  useEffect(() => {
    if (isEkyc && searchData) {
      const appData = extractApplicationData(searchData);
      const rawData = appData || formData?.connectionDetails;
      const apiAddress =
        rawData?.addressDetails || rawData?.address || rawData?.propertyInfo?.address || rawData?.connectionDetails?.address || rawData || {};

      if (apiAddress && Object.keys(apiAddress).length > 0) {
        const pin = apiAddress.pinCode || apiAddress.pincode;
        if (!pincode && pin) setPincode(pin.toString().split(".")[0]);

        const house = apiAddress.flatHouseNumber || apiAddress.houseNo;
        if (!houseNo && house) setHouseNo(house);

        if (!streetName && apiAddress.streetName) setstreetName(apiAddress.streetName);

        const addr1 = apiAddress.subLocality || apiAddress.addressLine1;
        if (!addressLine1 && addr1) setAddressLine1(addr1);

        const addr2 = apiAddress.landmark || apiAddress.addressLine2;
        if (!addressLine2 && addr2) setAddressLine2(addr2);

        if (!landmark && apiAddress.landmark) setLandmark(apiAddress.landmark);

        if (!city && apiAddress.city) {
          const cityObj = allCities?.find((c) => c.code === apiAddress.city || c.name === apiAddress.city) || convertToObject(apiAddress.city);
          if (cityObj) setCity(cityObj);
        }
        if (!locality && apiAddress.locality && structuredLocalityData?.length > 0) {
          const locObj =
            structuredLocalityData.find(
              (l) => l.code === apiAddress.locality || l.name === apiAddress.locality || l.i18nKey === apiAddress.locality
            ) || convertToObject(apiAddress.locality);
          if (locObj) setLocality(locObj);
        }
        if (!zone && apiAddress.zone) setZone(apiAddress.zone);
        if (!block && (apiAddress.block || apiAddress.ward)) setBlock(apiAddress.block || apiAddress.ward);
        if (!assembly && apiAddress.assembly) setAssembly(apiAddress.assembly);
        if (!zro && apiAddress.zro) setZro(apiAddress.zro);

        const lat = apiAddress.latitude;
        if (!latitude && lat) setLatitude(lat);

        const lng = apiAddress.longitude;
        if (!longitude && lng) setLongitude(lng);

        if (!subLocality && apiAddress.subLocality) setSubLocality(apiAddress.subLocality);
        if (!wardRemark && apiAddress.wardRemark) setWardRemark(apiAddress.wardRemark);

        if (!doorImageId && apiAddress.doorPhotoFilestoreId) {
          setDoorImageId(apiAddress.doorPhotoFilestoreId);
          setDoorImage(apiAddress.doorPhotoFilestoreId); // or a generic string, since API only returns ID
        }
      }
    }
  }, [searchData, isEkyc, allCities, structuredLocalityData]);

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await Digit.UploadServices.Filestorage("EKYC", file);
      const id = res?.data?.files?.[0]?.fileStoreId;
      if (id) {
        setDoorImage(file.name);
        setDoorImageId(id);
      }
    } catch (err) {
      setToast({ type: "error", message: "Upload failed" });
    }
  };

  const addressUpdateRef = React.useRef(null);
  useEffect(() => {
    if (formData?.address) {
      const addressData = formData.address;

      // Skip processing if this data originated from our own silent update
      // to prevent an infinite setState loop between the two useEffects
      if (addressData.silent) return;

      const addressStr = JSON.stringify(addressData) + "_" + (structuredLocalityData?.length || 0) + "_" + (allCities?.length || 0);
      if (addressUpdateRef.current === addressStr) return;
      addressUpdateRef.current = addressStr;

      const cityObj =
        allCities?.find((c) => c.code === addressData.cityCode || c.code === addressData.city || c.name === addressData.city) || addressData.city;
      if (cityObj && JSON.stringify(cityObj) !== JSON.stringify(city)) setCity(cityObj);

      const newPincode = addressData.pincode?.toString().split(".")[0] || "";
      if (newPincode !== pincode) setPincode(newPincode);

      if ((addressData.houseNo || "") !== houseNo) setHouseNo(addressData.houseNo || "");
      if ((addressData.streetName || "") !== streetName) setstreetName(addressData.streetName || "");
      if ((addressData.landmark || "") !== landmark) setLandmark(addressData.landmark || "");

      const newAddr1 = addressData.addressLine1 || addressData.subLocality || "";
      if (newAddr1 !== addressLine1) setAddressLine1(newAddr1);

      if ((addressData.addressLine2 || "") !== addressLine2) setAddressLine2(addressData.addressLine2 || "");
      if ((addressData.latitude || "") !== latitude) setLatitude(addressData.latitude || "");
      if ((addressData.longitude || "") !== longitude) setLongitude(addressData.longitude || "");
      if ((addressData.zro || "") !== zro) setZro(addressData.zro || "");
      if ((addressData.subLocality || "") !== subLocality) setSubLocality(addressData.subLocality || "");
      if ((addressData.wardRemark || "") !== wardRemark) setWardRemark(addressData.wardRemark || "");
      if ((addressData.actualAssembly || "") !== actualAssembly) setActualAssembly(addressData.actualAssembly || "");
      if ((addressData.actualZone || "") !== actualZone) setActualZone(addressData.actualZone || "");
      if ((addressData.actualWard || "") !== actualWard) setActualWard(addressData.actualWard || "");

      if (addressData.doorImageId) {
        if (addressData.doorImage !== doorImage) setDoorImage(addressData.doorImage);
        if (addressData.doorImageId !== doorImageId) setDoorImageId(addressData.doorImageId);
      }

      const localityObj = structuredLocalityData.find(
        (l) => l.code === addressData.localityCode || l.code === addressData.locality || l.i18nKey === addressData.locality
      );
      const targetLocality = localityObj || addressData.locality || null;
      if (JSON.stringify(targetLocality) !== JSON.stringify(locality)) setLocality(targetLocality);

      // Derive Zone/Block/Assembly from Locality if missing
      const newZone = addressData.zone || localityObj?.zone || "";
      if (newZone !== zone) setZone(newZone);

      const newBlock = addressData.block || localityObj?.ward || "";
      if (newBlock !== block) setBlock(newBlock);

      const newAssembly = addressData.assembly || localityObj?.assembly || "";
      if (newAssembly !== assembly) setAssembly(newAssembly);

      const typeObj = allOptions.find((a) => a.code === addressData.addressType);
      if (typeObj && JSON.stringify(typeObj) !== JSON.stringify(addressType)) setAddressType(typeObj);
    }
  }, [formData?.address, allCities, structuredLocalityData]);

  const goNext = async () => {
    let ownerAddress = formData.address;
    let addressStep = {
      ...ownerAddress,
      pincode,
      city,
      locality,
      houseNo,
      landmark,
      addressLine1,
      addressLine2,
      streetName,
      addressType,
      latitude,
      longitude,
      assembly,
      zone,
      block,
      zro,
      subLocality,
      wardRemark,
      actualAssembly,
      actualZone,
      actualWard,
      ...(config?.doorImage ? { doorImage, doorImageId } : {}),
    };

    if (window.location.pathname.includes("/ekyc")) {
      try {
        await Digit.CustomService.getResponse({
          url: "/ekyc-service/user/application/_update",
          params: { tenantId },
          data: {
            RequestInfo: {},
            updateType: "ADDRESS",
            kno: searchKno,
            ...addressStep,
          },
        });
        setToast({ type: "success", message: "Address updated successfully!" });
      } catch (err) {
        setToast({ type: "error", message: "Failed to update address" });
      }
    }

    if (config?.key) {
      onSelect(config.key, { ...formData[config.key], ...addressStep }, false);
    } else if (config === undefined) {
      onSelect(addressStep);
    }
  };
  /* If `config` is undefined and all required address fields are filled, it creates an `addressStep` object
    containing the address details and calls the `onSelect` function with it.
   **/

  // This one
  const lastSentValue = React.useRef(null);
  useEffect(() => {
    const isEkyc = config?.doorImage;
    const addressStep = {
      pincode,
      city,
      locality,
      houseNo,
      landmark,
      addressLine1,
      addressLine2,
      streetName,
      addressType,
      latitude,
      longitude,
      assembly,
      zone,
      block,
      zro,
      subLocality,
      wardRemark,
      actualAssembly,
      actualZone,
      actualWard,
      ...(isEkyc ? { doorImage, doorImageId } : {}),
    };

    if (config?.key) {
      let isDifferent = true;
      try {
        isDifferent = JSON.stringify(lastSentValue.current) !== JSON.stringify(addressStep);
      } catch (e) {
        isDifferent = Object.keys(addressStep).some((k) => lastSentValue.current?.[k] !== addressStep[k]);
      }
      if (isDifferent) {
        lastSentValue.current = addressStep;
        onSelect(config.key, { ...addressStep, silent: true }, false, null, false, true);
      }
    } else if (config === undefined) {
      const mandatoryFields = isEkyc
        ? houseNo && locality && pincode && addressLine1 && streetName && latitude && longitude && doorImageId
        : houseNo && city && locality && pincode && addressLine1 && streetName && addressLine2 && latitude && longitude;

      if (mandatoryFields) {
        onSelect(addressStep);
      }
    }
  }, [
    pincode,
    city,
    locality,
    houseNo,
    landmark,
    addressLine1,
    addressLine2,
    streetName,
    addressType,
    latitude,
    longitude,
    zone,
    block,
    assembly,
    zro,
    doorImageId,
    subLocality,
    wardRemark,
    actualAssembly,
    actualZone,
    actualWard,
    config?.key,
    onSelect,
  ]);

  useEffect(() => {
    if (selectedAddress && Object.keys(selectedAddress).length) {
      setPincode(selectedAddress.pinCode?.toString().split(".")[0]);
      setCity(allCities?.find((ele) => ele.name === selectedAddress.city));
      setLocality(structuredLocalityData?.find((ele) => ele.i18nKey === selectedAddress.locality));
      setHouseNo(selectedAddress.houseNumber);
      setstreetName(selectedAddress.streetName);
      setLandmark(selectedAddress.landmark);
      setAddressLine1(selectedAddress.address);
      setAddressLine2(selectedAddress.address2);
      setLatitude(selectedAddress.latitude);
      setLongitude(selectedAddress.longitude);
      setAssembly(selectedAddress.assembly);
      setZone(selectedAddress.zone);
      setBlock(selectedAddress.block);
      setAddressType(allOptions?.find((ele) => ele.code === selectedAddress.addressType));
      setZro(selectedAddress.zro);
      setSubLocality(selectedAddress.subLocality);
      setWardRemark(selectedAddress.wardRemark);
      setActualAssembly(selectedAddress.actualAssembly);
      setActualZone(selectedAddress.actualZone);
      setActualWard(selectedAddress.actualWard);
      if (config?.doorImage) {
        setDoorImage(selectedAddress.doorImage);
        setDoorImageId(selectedAddress.doorImageId);
      }
    }
  }, [selectedAddress]);

  const lastErrorState = React.useRef(null);
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (lastErrorState.current !== hasErrors) {
      lastErrorState.current = hasErrors;
      if (hasErrors && props.setError && config?.key) {
        props.setError(config.key, { type: "custom", message: "Validation failed" });
      } else if (props.clearErrors && config?.key) {
        props.clearErrors(config.key);
      }
    }
  }, [errors, config?.key, props.setError, props.clearErrors]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);
      },
      (error) => {
        console.error(error);
        alert("Unable to fetch location");
      }
    );
  };

  return (
    <React.Fragment>
      <FormStep
        config={hideNextButton ? { ...config, texts: { ...config?.texts, submitBarLabel: null } } : config}
        onSelect={goNext}
        t={t}
        isDisabled={
          config?.doorImage
            ? !houseNo || !locality || !pincode || !addressLine1 || !streetName || !doorImageId
            : !houseNo || !city || !locality || !pincode || !addressLine1 || (showZRO && !zro)
        }
      >
        {userDetails?.addresses?.length && (
          <div style={{ gridColumn: "span 2" }}>
            <Label>{t("FORM_SELECT_ADDRESS_FROM_LIST")}</Label>
            <Dropdown
              className="form-field"
              selected={selectedAddress}
              select={setSelectedAddress}
              disable={isEdit}
              option={userDetails?.addresses}
              optionKey="address"
              optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
              t={t}
              style={{ width: "100%" }}
              placeholder={"Select Address Type"}
            />
          </div>
        )}

        {showZRO && (
          <div>
            <Label>
              {t("WS_ZRO_LOCATION")} <span className="check-page-link-button">*</span>
            </Label>
            <div className="field">
              <Controller
                control={control}
                name={"zro"}
                defaultValue={zro}
                rules={{ required: t("REQUIRED_FIELD") }}
                render={(props) => (
                  <Dropdown
                    className="form-field"
                    selected={zro}
                    disable={disable}
                    option={_mappedZROLocation}
                    errorStyle={!!getFieldError("zro")}
                    select={setZro}
                    optionKey="i18nKey"
                    t={t}
                    placeholder={"Select ZRO Location"}
                  />
                )}
              />
              {getFieldError("zro") && <CardLabelError>{getFieldError("zro")?.message}</CardLabelError>}
            </div>
          </div>
        )}
        <div>
          <Label>
            {`${t("COMMON_ADDRESS_TYPE")}`} <span className="check-page-link-button">*</span>
          </Label>
          <Dropdown
            className="form-field"
            selected={addressType}
            select={setAddressType}
            disable={disable || isEdit}
            option={availableAddressTypeOptions}
            optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
            optionKey="i18nKey"
            t={t}
            style={{ width: "100%" }}
            placeholder={"Select Address Type"}
          />
        </div>
        {!config?.doorImage && (
          <div>
            <Label>
              {`${t("CORE_COMMON_PROFILE_CITY")}`} <span className="check-page-link-button">*</span>
            </Label>
            <Controller
              control={control}
              name={"city"}
              defaultValue={city}
              rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
              render={(props) => (
                <Dropdown
                  className="form-field"
                  selected={city}
                  select={setCity}
                  option={allCities}
                  disable={true}
                  optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                  optionKey="i18nKey"
                  t={t}
                  style={{ width: "100%" }}
                  placeholder={"Select"}
                />
              )}
            />
          </div>
        )}
        <div style={{ position: "relative" }}>
          <Label>
            {`${t("PINCODE")}`} <span className="check-page-link-button">*</span>
          </Label>
          <TextInput
            value={pincode}
            onChange={(e) => {
              const newPin = e.target.value.replace(/\D/g, "").slice(0, 6);
              if (newPin !== pincode) {
                setLocality(null);
                setAssembly("");
                setZone("");
                setBlock("");
                setLatitude("");
                setLongitude("");
                setAddressLine1("");
                // setAddressLine2("");
              }
              setPincode(newPin);
              setShowPincodeSuggestions(true);
            }}
            onFocus={() => setShowPincodeSuggestions(true)}
            onBlur={() => {
              // Small delay to allow click on suggestion list items
              setTimeout(() => setShowPincodeSuggestions(false), 200);
            }}
            style={{ width: "100%" }}
            maxlength={6}
            disabled={disable}
          />
          {showPincodeSuggestions && fetchedPincodes?.length > 0 && (
            <div
              className="options-card"
              style={{
                position: "absolute",
                zIndex: 100,
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                backgroundColor: "white",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              {fetchedPincodes
                .filter((p) => !pincode || p.code.toLowerCase().includes(pincode.toLowerCase()))
                .map((p, index) => (
                  <div
                    key={index}
                    className="cp profile-dropdown--item"
                    style={{ padding: "10px", borderBottom: "1px solid #eee", cursor: "pointer" }}
                    onClick={() => {
                      setPincode(p.code);
                      setShowPincodeSuggestions(false);
                    }}
                  >
                    {p.code}
                  </div>
                ))}
            </div>
          )}
        </div>
        <div>
          <Label>
            {`${t("LOCALITY")}`} <span className="check-page-link-button">*</span>
          </Label>
          <Controller
            control={control}
            name={"locality"}
            defaultValue={locality}
            rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={locality}
                disable={disable}
                select={(val) => {
                  setLocality(val);
                  if (val?.latitude) setLatitude(val.latitude);
                  if (val?.longitude) setLongitude(val.longitude);
                  if (val?.localname) setAddressLine1(val.localname);
                  if (val?.assembly) setAssembly(val.assembly);
                  if (val?.zone) setZone(val.zone);
                  if (val?.ward) {
                    setBlock(val.ward);
                  }
                }}
                option={filteredLocalities}
                optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                optionKey="i18nKey"
                t={t}
                style={{ width: "100%" }}
                placeholder={"Select"}
              />
            )}
          />
        </div>

        <div>
          <Label>{`${t("SubLocality")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            optionKey="i18nKey"
            name="subLocality"
            value={subLocality}
            style={{ width: "100%" }}
            placeholder={"Enter Sub-locality"}
            onChange={(e) => {
              setSubLocality(e.target.value);
            }}
            disabled={disable}
            ValidationRequired={true}
            validation={{
              isRequired: true,
              pattern: "^[a-zA-Z0-9 ,\\-]+$",
              type: "text",
              title: t("SUB_LOCALITY_ERROR_MESSAGE"),
            }}
          />
        </div>
        <div>
          <Label>{`${t("STREET_NAME")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            optionKey="i18nKey"
            name="streetName"
            value={streetName}
            style={{ width: "100%" }}
            placeholder={"Enter Street Name"}
            onChange={(e) => {
              setstreetName(e.target.value);
            }}
            disabled={disable}
            ValidationRequired={true}
            validation={{
              pattern: "^[a-zA-Z0-9 ,\\-]+$",
              type: "text",
              title: t("STREET_NAME_ERROR_MESSAGE"),
            }}
          />
        </div>
        <div>
          <Label>
            {`${t(config?.doorImage ? "EKYC_SUB_LOCALITY" : "ADDRESS_LINE1")}`} <span className="check-page-link-button">*</span>
          </Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            optionKey="i18nKey"
            name="addressLine1"
            value={addressLine1}
            style={{ width: "100%" }}
            placeholder={config?.doorImage ? "Enter Sub-locality" : "Enter Address"}
            onChange={(e) => {
              setAddressLine1(e.target.value);
            }}
            disabled={disable}
            ValidationRequired={false}
          />
        </div>
        {!config?.doorImage && (
          <div>
            <Label>{`${t("ADDRESS_LINE2")}`}</Label>
            <TextInput
              t={t}
              type={"text"}
              isMandatory={false}
              optionKey="i18nKey"
              name="addressLine2"
              value={addressLine2}
              style={{ width: "100%" }}
              placeholder={"Enter Address"}
              onChange={(e) => {
                setAddressLine2(e.target.value);
              }}
              disabled={disable}
              ValidationRequired={false}
            />
          </div>
        )}
        {config?.doorImage && (
          <div>
            <Label>
              {`${t("EKYC_DOOR_IMAGE")}`} <span className="check-page-link-button">*</span>
            </Label>
            <UploadFile
              onUpload={uploadFile}
              onDelete={() => {
                setDoorImage(null);
                setDoorImageId(null);
              }}
              id={"doorImage"}
              message={doorImage ? `1 ${t("COMMON_FILE_ADDED")}` : t("CS_COMMON_NO_FILE_SELECTED")}
              accept="image/*"
              buttonProps={{ label: t("CS_COMMON_CHOOSE_FILE") }}
            />
          </div>
        )}

        <div>
          <Label>{`${t("HOUSE_NO")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            optionKey="i18nKey"
            name="houseNo"
            value={houseNo}
            style={{ width: "100%" }}
            placeholder={"Enter House No"}
            onChange={(e) => {
              setHouseNo(e.target.value);
            }}
            disabled={disable}
            ValidationRequired={true}
            validation={{
              isRequired: true,
              pattern: "^[a-zA-Z0-9 ,\\-]+$",
              type: "text",
              title: t("HOUSE_NO_ERROR_MESSAGE"),
            }}
          />
        </div>

        <div>
          <Label>{`${t("LATITUDE_GEOTAG")}`}</Label>

          <TextInput
            t={t}
            type="text"
            isMandatory={false}
            name="latitude"
            value={latitude}
            onChange={(e) => {
              setLatitude(e.target.value);
            }}
            disabled={disable}
            style={{ width: "100%" }}
            placeholder="Enter latitude (e.g. 28.6139)"
            ValidationRequired={true}
            validation={{
              required: false,
              pattern: "^-?[0-9]+(?:\\.[0-9]+)?$",
              type: "number",
              title: t("SV_ADDRESS_PINCODE_INVALID"),
            }}
            step="any"
            className="form-field"
          />
        </div>

        <div>
          <Label>{`${t("LONGITUDE_GEOTAG")}`}</Label>

          <TextInput
            t={t}
            type="text"
            isMandatory={false}
            name="longitude"
            value={longitude}
            onChange={(e) => {
              setLongitude(e.target.value);
            }}
            disabled={disable}
            style={{ width: "100%" }}
            placeholder="Enter longitude (e.g. 28.6139)"
            ValidationRequired={true}
            validation={{
              required: false,
              pattern: "^-?[0-9]+(?:\\.[0-9]+)?$",
              type: "number",
              title: t("SV_ADDRESS_PINCODE_INVALID"),
            }}
            step="any"
            className="form-field"
          />
        </div>
        <div>
          <Label>{`${t("COMMON_ASSEMBLY")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            name="assembly"
            value={assembly}
            style={{ width: "100%" }}
            placeholder={"Enter Assembly"}
            onChange={(e) => setAssembly(e.target.value)}
            disabled={true}
          />
        </div>
        {/* <div>
              <Label>
                {`${t("WARD")}`} <span className="check-page-link-button">*</span>
              </Label>
              <TextInput
                t={t}
                type={"text"}
                isMandatory={false}
                name="ward"
                value={ward}
                style={{ width: "100%" }}
                placeholder={"Enter Ward"}
                onChange={(e) => setWard(e.target.value)}
              />
            </div> */}
        <div>
          <Label>{`${t("COMMON_WARD")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            name="block"
            value={block}
            style={{ width: "100%" }}
            placeholder={"Enter Ward"}
            onChange={(e) => setBlock(e.target.value)}
            disabled={true}
          />
        </div>
        <div>
          <Label>{`${t("COMMON_ZONE")}`}</Label>
          <TextInput
            t={t}
            type={"text"}
            isMandatory={false}
            name="zone"
            value={zone}
            style={{ width: "100%" }}
            placeholder={"Enter Zone"}
            onChange={(e) => setZone(e.target.value)}
            disabled={true}
          />
        </div>
        <div>
          <Label>{`${t("LANDMARK")}`}</Label>
          <TextInput
            t={t}
            type={"textarea"}
            isMandatory={false}
            optionKey="i18nKey"
            name="landmark"
            value={landmark}
            style={{ width: "100%" }}
            placeholder={"Enter Landmark"}
            onChange={(e) => {
              setLandmark(e.target.value);
            }}
            disabled={disable}
            ValidationRequired={true}
            validation={{
              isRequired: false,
              pattern: "^[a-zA-Z0-9 ]+$",
              type: "textarea",
              title: t("LANDMARK_ERROR_MESSAGE"),
            }}
          />
        </div>
        {props?.showMapActualLocation && (
          <React.Fragment>
            <div>
              {!disable && (
                <Button
                  label={t("MAP ACTUAL LOCATION") || "Map Actual Location"}
                  onButtonClick={() => {
                    setTempAssembly(actualAssembly);
                    setTempZone(actualZone);
                    setTempWard(actualWard);
                    setShowModal(true);
                  }}
                  type="button"
                />
              )}
              {(actualAssembly || actualZone || actualWard) && (
                <div style={{ marginTop: "16px", padding: "16px", border: "1px solid #E3E3E3", backgroundColor: "#FAFAFA", borderRadius: "4px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "16px", columnGap: "32px" }}>
                    {actualAssembly && (
                      <div style={{ display: "flex" }}>
                        <span style={{ minWidth: "150px", color: "#505A5F", fontWeight: "400" }}>{t("COMMON_CURRENT_ASSEMBLY")}</span>
                        <span style={{ fontWeight: "500", color: "#0B0C0C", wordBreak: "break-word" }}>{actualAssembly}</span>
                      </div>
                    )}
                    {actualWard && (
                      <div style={{ display: "flex" }}>
                        <span style={{ minWidth: "150px", color: "#505A5F", fontWeight: "400" }}>{t("COMMON_CURRENT_WARD")}</span>
                        <span style={{ fontWeight: "500", color: "#0B0C0C", wordBreak: "break-word" }}>{actualWard}</span>
                      </div>
                    )}
                    {actualZone && (
                      <div style={{ display: "flex" }}>
                        <span style={{ minWidth: "150px", color: "#505A5F", fontWeight: "400" }}>{t("COMMON_CURRENT_ZONE")}</span>
                        <span style={{ fontWeight: "500", color: "#0B0C0C", wordBreak: "break-word" }}>
                          {t(zoneOptions.find((z) => z.code === actualZone)?.name || actualZone)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )}
      </FormStep>
      {showModal && (
        <Modal
          headerBarMain={t("MAP ACTUAL LOCATION") || "View Modal"}
          headerBarEnd={
            <div onClick={() => setShowModal(false)} style={{ cursor: "pointer", fontWeight: "bold", padding: "0 10px" }}>
              X
            </div>
          }
          actionCancelLabel={t("CANCEL")}
          actionClearLabel={t("CLEAR")}
          actionClearOnSubmit={(e) => {
            e?.preventDefault();
            setTempAssembly("");
            setTempZone("");
            setTempWard("");
          }}
          actionCancelOnSubmit={(e) => {
            e?.preventDefault();
            setShowModal(false);
          }}
          actionSaveLabel={t("SAVE")}
          actionSaveOnSubmit={(e) => {
            e?.preventDefault();
            setActualAssembly(tempAssembly);
            setActualZone(tempZone);
            setActualWard(tempWard);
            setShowModal(false);
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <Label>{`${t("COMMON_CURRENT_ASSEMBLY")}`}</Label>
              <Dropdown
                className="form-field"
                selected={
                  assemblyOptions.find((a) => a.code === tempAssembly) ||
                  (tempAssembly ? { code: tempAssembly, i18nKey: tempAssembly, name: tempAssembly } : null)
                }
                disable={disable}
                select={(val) => setTempAssembly(val?.code || "")}
                option={assemblyOptions}
                optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                optionKey="i18nKey"
                t={t}
                placeholder={"Select Assembly"}
              />
            </div>

            <div>
              <Label>{`${t("COMMON_CURRENT_ZONE")}`}</Label>
              <Dropdown
                className="form-field"
                selected={zoneOptions.find((z) => z.code === tempZone) || (tempZone ? { code: tempZone, i18nKey: tempZone, name: tempZone } : null)}
                disable={disable}
                select={(val) => setTempZone(val?.code || "")}
                option={zoneOptions}
                optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                optionKey="name"
                t={t}
                placeholder={"Select Zone"}
              />
            </div>

            <div>
              <Label>{`${t("COMMON_CURRENT_WARD")}`}</Label>
              <Dropdown
                className="form-field"
                selected={wardOptions.find((w) => w.code === tempWard) || (tempWard ? { code: tempWard, i18nKey: tempWard, name: tempWard } : null)}
                disable={disable}
                select={(val) => setTempWard(val?.code || "")}
                option={wardOptions}
                optionCardStyles={{ overflowY: "auto", maxHeight: "300px" }}
                optionKey="i18nKey"
                t={t}
                placeholder={"Select Ward"}
              />
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast label={t(toast.message)} error={toast.type === "error"} onClose={() => setToast(null)} />}
    </React.Fragment>
  );
};

export default AddressDetails;
