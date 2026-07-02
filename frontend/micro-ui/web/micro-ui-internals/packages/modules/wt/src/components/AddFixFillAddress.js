import React, { useState, useEffect, useMemo, useRef } from "react";
import { CardLabel, TextInput, Dropdown, Card, CardSubHeader, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";
import { geocodeAddress } from "../utils/geocodingUtils";

const allOptions = [
  { name: "Correspondence", code: "CORRESPONDENCE", i18nKey: "COMMON_ADDRESS_TYPE_CORRESPONDENCE" },
  { name: "Permanent", code: "PERMANENT", i18nKey: "COMMON_ADDRESS_TYPE_PERMANENT" },
  { name: "Other", code: "OTHER", i18nKey: "COMMON_ADDRESS_TYPE_OTHER" },
];

const AddFixFillAddress = ({ t, config, formData, onSelect, isEdit, userDetails }) => {
  const { data: allCities } = Digit.Hooks.useTenants();
  const location = useLocation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const usedAddressTypes = location.state?.usedAddressTypes || [];
  const [pincode, setPincode] = useState(formData?.address?.pincode || "");
  const [city, setCity] = useState(formData?.address?.city || null);
  const [locality, setLocality] = useState(formData?.address?.locality || null);
  const [houseNo, setHouseNo] = useState(formData?.address?.houseNo || "");
  const [streetName, setStreetName] = useState(formData?.address?.streetName || "");
  const [landmark, setLandmark] = useState(formData?.address?.landmark || "");
  const [addressLine1, setAddressLine1] = useState(formData?.address?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(formData?.address?.addressLine2 || "");
  const [addressType, setAddressType] = useState(
    formData?.address?.addressType
      ? allOptions.find((a) => a.code === formData.address.addressType) || formData.address.addressType
      : allOptions.find((a) => a.code === "PERMANENT")
  );
  const [zone, setZone] = useState(formData?.address?.zone || "");
  const [block, setBlock] = useState(formData?.address?.block || "");
  const [assembly, setAssembly] = useState(formData?.address?.assembly || "");
  const [latitude, setLatitude] = useState(formData?.address?.latitude || "");
  const [longitude, setLongitude] = useState(formData?.address?.longitude || "");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geocodedAddress, setGeocodedAddress] = useState(null);
  const isInitialized = useRef(!isEdit);
  const lastSyncedAddress = useRef(null);
  const lastBookingId = useRef(null);

  // ✅ Address type filter
  const availableAddressTypeOptions = useMemo(() => {
    if (usedAddressTypes.length === 3) {
      return allOptions.filter((opt) => opt.code === "OTHER");
    }
    return allOptions.filter((opt) => !usedAddressTypes.includes(opt.code));
  }, [usedAddressTypes]);

  const { data: egovLocationData } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    if (!city && allCities && allCities.length > 0) {
      const defaultCity = allCities.find((c) => c.code === tenantId) || allCities[0];
      setCity(defaultCity);
    }
  }, [allCities, city, tenantId]);

  const boundaryData = useMemo(() => {
    const tenantBoundary = egovLocationData?.["egov-location"]?.TenantBoundary || [];

    const revenueData = tenantBoundary.find((item) => item?.hierarchyType?.code === "REVENUE");

    const boundary = revenueData?.boundary || [];
    return Array.isArray(boundary) ? boundary : [boundary];
  }, [egovLocationData]);

  const structuredLocality = useMemo(() => {
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
          i18nkey: node.i18nkey || `${tenantId.replace(".", "_")}_REVENUE_${node.code}`.toUpperCase(),
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
  }, [boundaryData, tenantId]);

  // ✅ Extract Pincodes from ALL structured localities
  const fetchedPincodes = useMemo(() => {
    const pinSet = new Set();

    // First, scan all structured localities to find every valid pincode
    structuredLocality.forEach((loc) => {
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

    // Fallback to city defaults if no pincodes found in localities
    if (pinSet.size === 0 && city?.pincode) {
      const pins = Array.isArray(city.pincode) ? city.pincode : [city.pincode];
      pins.forEach((p) => {
        if (p) {
          const sanitizedPin = p.toString().split(".")[0];
          pinSet.add(sanitizedPin);
        }
      });
    }

    return Array.from(pinSet)
      .sort()
      .map((pin) => ({
        code: pin,
        name: pin,
        i18nKey: pin,
      }));
  }, [structuredLocality, city]);

  // ✅ Filter Localities based on selected Pincode
  const filteredLocalities = useMemo(() => {
    if (!pincode) return structuredLocality;

    // Check if current pincode exists in the fetched list
    const isPincodeInList = fetchedPincodes.some((p) => p.code === pincode);

    // If pincode is entered manually (not in list), show all localities
    if (!isPincodeInList) return structuredLocality;

    return structuredLocality.filter((loc) => {
      if (!loc.pincode) return false;
      const pins = Array.isArray(loc.pincode) ? loc.pincode : [loc.pincode];
      return pins.some((p) => p.toString() === pincode);
    });
  }, [structuredLocality, pincode, fetchedPincodes]);

  // ✅ Sync with formData if it changes (edit mode) - only run once or when externally changed
  useEffect(() => {
    // Reset if id/bookingId changes
    const currentId = formData?.id || formData?.bookingId || formData?.address?.id;
    if (currentId && lastBookingId.current !== currentId) {
      isInitialized.current = false;
      lastBookingId.current = currentId;
    }

    if (formData?.address && !isInitialized.current && allCities) {
      const addressData = formData.address;

      // Phase 1: Sync basic fields (City must be set for boundaryData to trigger)
      const cityObj =
        allCities.find((c) => c.code === addressData.cityCode || c.code === addressData.city || c.name === addressData.city) || addressData.city;

      if (cityObj && (!city || (city.code !== cityObj.code && city !== cityObj))) {
        setCity(cityObj || null);
      }

      setPincode(addressData.pincode?.toString().split(".")[0] || "");
      setHouseNo(addressData.houseNo || "");
      setStreetName(addressData.streetName || "");
      setLandmark(addressData.landmark || "");
      setAddressLine1(addressData.addressLine1 || "");
      // setAddressLine2(addressData.addressLine2 || "");
      setAddressType(
        allOptions.find((a) => a.code === addressData.addressType) || addressData.addressType || allOptions.find((a) => a.code === "PERMANENT")
      );
      setZone(addressData.zone || "");
      setBlock(addressData.block || addressData.ward || "");
      setAssembly(addressData.assembly || addressData.constituency || "");
      setLatitude(addressData.latitude || "");
      setLongitude(addressData.longitude || "");

      // Phase 2: Wait for structuredLocality or if there is no cityCode to wait for
      if (structuredLocality?.length > 0 || !addressData.cityCode) {
        const localityObj = structuredLocality.find(
          (l) => l.code === addressData.localityCode || l.code === addressData.locality || l.i18nkey === addressData.locality
        );
        setLocality(localityObj || addressData.locality || null);

        // If Zone/Block/Assembly are missing in addressData, try to get them from localityObj
        if (localityObj) {
          if (!addressData.zone && localityObj.zone) setZone(localityObj.zone);
          if (!addressData.block && localityObj.ward) setBlock(localityObj.ward);
          if (!addressData.assembly && localityObj.assembly) setAssembly(localityObj.assembly);
        }

        // Only mark as fully initialized once everything (locality included) is ready
        isInitialized.current = true;
        lastSyncedAddress.current = JSON.stringify(addressData);
      }
    }
  }, [formData?.address, city, allCities, structuredLocality]);

  // ✅ Get current location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => { }
    );
  }, []);

  // ✅ Auto-fill from selected address
  useEffect(() => {
    if (selectedAddress && Object.keys(selectedAddress).length) {
      setPincode(selectedAddress.pinCode);
      setCity(allCities?.find((c) => c.name === selectedAddress.city));
      setLocality(Array.isArray(boundaryData) ? boundaryData.find((l) => l.i18nkey === selectedAddress.locality) : null);
      setHouseNo(selectedAddress.houseNumber);
      setStreetName(selectedAddress.streetName);
      setLandmark(selectedAddress.landmark);
      setAddressLine1(selectedAddress.address);
      // setAddressLine2(selectedAddress.address2);
      setZone(selectedAddress.zone);
      setBlock(selectedAddress.block);
      setAssembly(selectedAddress.assembly);
      setLatitude(selectedAddress.latitude);
      setLongitude(selectedAddress.longitude);
      setAddressType(allOptions.find((a) => a.code === selectedAddress.addressType));
    }
  }, [selectedAddress, structuredLocality]);

  const getLatLng = async () => {
    try {
      setLoading(true);
      setError(null);

      const parts = [
        houseNo,
        streetName,
        addressLine1,
        addressLine2,
        locality?.name || (typeof locality === "string" ? locality : ""),
        city?.name || (typeof city === "string" ? city : ""),
        pincode,
      ].filter(Boolean);

      const fullAddress = parts.join(", ");

      if (!fullAddress.trim()) {
        setError(t("WT_ENTER_ADDRESS_DETAILS_FIRST"));
        setLoading(false);
        return;
      }

      const data = await geocodeAddress(fullAddress);

      if (data && data.length > 0) {
        setLatitude(data[0].lat);
        setLongitude(data[0].lon);
        setGeocodedAddress(data[0].display_name);
      } else {
        setError(t("WT_LOCATION_NOT_FOUND"));
      }
    } catch (err) {
      setError(t("WT_GEOCODING_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-trigger geocoding on Address Line 1 change
  useEffect(() => {
    if (!addressLine1 || addressLine1.trim().length < 5) return;

    const timer = setTimeout(() => {
      getLatLng();
    }, 1000);

    return () => clearTimeout(timer);
  }, [addressLine1]);

  // ✅ 🔥 MAIN SYNC (replaces onSelect)
  useEffect(() => {
    if (!onSelect || !isInitialized.current) return;

    const currentAddress = {
      pincode: pincode || "",
      city: city?.code || city || null,
      locality: locality?.code || locality || null,
      houseNo: houseNo || "",
      landmark: landmark || "",
      addressLine1: addressLine1 || "",
      addressLine2: addressLine2 || "",
      streetName: streetName || "",
      addressType: addressType?.code || addressType || null,
      zone: zone || "",
      block: block || "",
      assembly: assembly || "",
      latitude: latitude || "",
      longitude: longitude || "",
    };

    // Only call onSelect if data has actually changed from what we last received or sent
    const addressString = JSON.stringify(currentAddress);
    if (lastSyncedAddress.current !== addressString) {
      lastSyncedAddress.current = addressString;
      onSelect(config?.key || "address", currentAddress);
    }
  }, [pincode, city, locality, houseNo, landmark, addressLine1, addressLine2, streetName, addressType, zone, block, assembly, latitude, longitude]);

  return (
    <CollapsibleCardPage title={t("WT_ADDRESS_DETAILS")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <div style={{ position: "relative" }}>
          <CardLabel>{t("PINCODE")}</CardLabel>
          <TextInput
            value={pincode}
            onChange={(e) => {
              const newPin = e.target.value.replace(/\D/g, "").slice(0, 6);
              if (newPin !== pincode) {
                setLocality(null);
                setZone("");
                setBlock("");
                setLatitude("");
                setLongitude("");
                setAddressLine1("");
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
          <CardLabel>{t("LOCALITY")}</CardLabel>
          <Dropdown
            selected={locality}
            select={(val) => {
              setLocality(val);
              if (val?.latitude) setLatitude(val.latitude);
              if (val?.longitude) setLongitude(val.longitude);
              if (val?.localname) setAddressLine1(val.localname);
              if (val?.zone) setZone(val.zone);
              if (val?.ward) setBlock(val.ward);
              if (val?.assembly) setAssembly(val.assembly);
            }}
            option={filteredLocalities}
            optionKey="i18nkey"
            t={t}
            style={{ width: "100%" }}
            isSearchable={true}
          />
        </div>

        {/* House No */}
        <div>
          <CardLabel>{t("HOUSE_NO")}</CardLabel>
          <TextInput value={houseNo} onChange={(e) => setHouseNo(e.target.value)} style={{ width: "100%" }} />
        </div>

        {/* Street */}
        <div>
          <CardLabel>{t("STREET_NAME")}</CardLabel>
          <TextInput value={streetName} onChange={(e) => setStreetName(e.target.value)} style={{ width: "100%" }} />
        </div>

        {/* Address Line 1 */}
        <div>
          <CardLabel>{t("ADDRESS_LINE1")}</CardLabel>
          <TextInput value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} style={{ width: "100%" }} />
        </div>

        {/* Address Line 2 */}
        <div>
          <CardLabel>{t("ADDRESS_LINE2")}</CardLabel>
          <TextInput value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <CardLabel>{t("BLOCK")}</CardLabel>
          <TextInput value={block} onChange={(e) => setBlock(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <CardLabel>{t("ZONE")}</CardLabel>
          <TextInput value={zone} onChange={(e) => setZone(e.target.value)} style={{ width: "100%" }} />
        </div>
        {/* Latitude */}
        <div>
          <CardLabel>{t("LATITUDE")}</CardLabel>
          <TextInput value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: "100%" }} />
        </div>

        {/* Longitude */}
        <div>
          <CardLabel>{t("LONGITUDE")}</CardLabel>
          <TextInput value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div>
          <CardLabel>{t("ASSEMBLY_CONSTITUENCY")}</CardLabel>
          <TextInput value={assembly} onChange={(e) => setAssembly(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div>
          <CardLabel>{t("LANDMARK")}</CardLabel>
          <TextInput value={landmark} onChange={(e) => setLandmark(e.target.value)} style={{ width: "100%" }} />
        </div>
      </div>
    </CollapsibleCardPage>
  );
};

export default AddFixFillAddress;
