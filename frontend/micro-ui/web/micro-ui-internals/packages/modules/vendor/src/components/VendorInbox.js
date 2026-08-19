import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import { Card, Dropdown, Loader, SubmitBar, Toast, Modal, Table, ViewsIcon, MdClose } from "@djb25/digit-ui-react-components";
import VENDORLink from "./inbox/VENDORLink";
import ApplicationTable from "./inbox/ApplicationTable";
import Filter from "./inbox/Filter";
import { ToggleSwitch } from "@djb25/digit-ui-react-components";
import RegisteredVendorSearch from "./RegisteredVendorSearch";
import { useQueryClient } from "react-query";

const parseAdditionalDetails = (additionalDetails) => {
  if (!additionalDetails) return {};
  if (typeof additionalDetails === "object") return additionalDetails;
  if (typeof additionalDetails !== "string") return {};
  try {
    return JSON.parse(additionalDetails);
  } catch (error) {
    return {};
  }
};

const getFillingPointIdentifiers = (fillingPoint) => {
  if (!fillingPoint) return [];
  if (typeof fillingPoint === "string" || typeof fillingPoint === "number") return [String(fillingPoint)];

  return [
    fillingPoint?.id,
    fillingPoint?.fillingStationId,
    fillingPoint?.bookingId,
    fillingPoint?.fillingPointId,
    fillingPoint?.uuid,
    fillingPoint?.fillingpointmetadata?.fillingPointId,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);
};

const getRowFillingPointIdentifiers = (row = {}) => {
  const getIdentifiers = (fp) => (Array.isArray(fp) ? fp.flatMap(getFillingPointIdentifiers) : getFillingPointIdentifiers(fp));
  return Array.from(
    new Set([
      ...[
        row?.fillingPointId,
        row?.dsoDetails?.fillingPointId,
        row?.fillingpointmetadata?.fillingPointId,
        row?.fillingPtName,
        row?.filling_pt_name,
        row?.fillingPoint?.fillingPointId,
      ]
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map(String),
      ...getIdentifiers(row?.fillingPoint),
      ...getIdentifiers(row?.dsoDetails?.fillingPoint),
      ...getIdentifiers(row?.fillingPointDetail),
    ])
  );
};

const getSelectedFillingPointOption = (row, fillingPoints = []) => {
  const rowFillingPointIdentifiers = getRowFillingPointIdentifiers(row);
  if (!rowFillingPointIdentifiers.length) return null;

  return (
    fillingPoints.find((fillingPoint) =>
      getFillingPointIdentifiers(fillingPoint).some((identifier) => rowFillingPointIdentifiers.includes(identifier))
    ) || null
  );
};

const getFillingPointDisplayValue = (row = {}) => {
  if (Array.isArray(row?.fillingPoint)) {
    const list = row.fillingPoint.map((fp) => fp?.fillingPointName || fp?.fillingPointId).filter(Boolean);
    if (list.length > 0) return list.join(", ");
  }
  return (
    row?.fillingPoint?.fillingPointName ||
    row?.dsoDetails?.fillingPoint?.fillingPointName ||
    row?.fillingPointName ||
    row?.dsoDetails?.fillingPointName ||
    row?.fillingPointId ||
    row?.dsoDetails?.fillingPointId ||
    (typeof row?.fillingPoint === "string" ? row?.fillingPoint : null) ||
    (typeof row?.dsoDetails?.fillingPoint === "string" ? row?.dsoDetails?.fillingPoint : null) ||
    row?.fillingpointmetadata?.fillingPointId ||
    row?.filling_pt_name ||
    row?.fillingPtName ||
    "NA"
  );
};

const getSelectedVendorOption = (row = {}, vendors = []) => {
  const selectedVendorId = row?.vendor?.id || row?.vendorData?.id || row?.vendorId;
  if (!selectedVendorId) return null;

  return vendors.find((vendor) => vendor?.id === selectedVendorId) || row?.vendor || row?.vendorData || null;
};

const getSelectedSupervisorOption = (row = {}, supervisorsList = []) => {
  const supervisorId = row?.supervisorId;
  if (!supervisorId) return null;
  return supervisorsList.find((s) => s.id === supervisorId || s.owner?.uuid === supervisorId || s.name === supervisorId || s.owner?.name === supervisorId) || null;
};

const getVendorFillingPoints = (vendor = {}) => {
  const fillingPointOptions = [
    ...(Array.isArray(vendor?.fillingPoint) ? vendor.fillingPoint : [vendor?.fillingPoint]),
    ...(Array.isArray(vendor?.fillingPoints) ? vendor.fillingPoints : [vendor?.fillingPoints]),
  ].filter(Boolean);
  const uniqueFillingPoints = new Map();

  fillingPointOptions.forEach((fillingPoint) => {
    const identifier = getFillingPointIdentifiers(fillingPoint)[0] || fillingPoint?.fillingPointName || fillingPoint?.id;
    if (identifier && !uniqueFillingPoints.has(identifier)) {
      uniqueFillingPoints.set(identifier, fillingPoint);
    }
  });

  return Array.from(uniqueFillingPoints.values());
};

const getDriverFillingPointIdentifiers = (driver = {}) => {
  return Array.from(
    new Set(
      [
        driver?.fillingPointId,
        driver?.fillingStationId,
        driver?.additionalDetails?.fillingPointId,
        driver?.additionalDetails?.fillingStationId,
        driver?.fillingpointmetadata?.fillingPointId,
      ]
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map(String)
        .concat(
          getFillingPointIdentifiers(driver?.fillingPoint),
          getFillingPointIdentifiers(driver?.fillingPointDetail),
          getFillingPointIdentifiers(driver?.fillingPointDetails)
        )
    )
  );
};

const getVendorDriversForFillingPoint = (vendor, fillingPoint) => {
  const vendorDrivers = Array.isArray(vendor?.drivers)
    ? vendor.drivers.filter(Boolean).map((d) => ({
      ...d,
      displayName: `${d.name} (${d.owner?.mobileNumber || "N/A"})`,
    }))
    : [];
  if (!fillingPoint) return [];

  const selectedFillingPointIdentifiers = getFillingPointIdentifiers(fillingPoint);
  if (!selectedFillingPointIdentifiers.length) return vendorDrivers;

  return vendorDrivers.filter((driver) => {
    const driverFillingPointIdentifiers = getDriverFillingPointIdentifiers(driver);
    return (
      !driverFillingPointIdentifiers.length ||
      driverFillingPointIdentifiers.some((identifier) => selectedFillingPointIdentifiers.includes(identifier))
    );
  });
};

const getSelectedDriverOption = (row = {}, drivers = []) => {
  const selectedDriverId = row?.driverData?.id || row?.driver?.id;
  if (!selectedDriverId) return null;
  return drivers.find((driver) => driver?.id === selectedDriverId) || null;
};

const normalizeFillingPointForVehicleUpdate = (fillingPoint) => {
  if (!fillingPoint || typeof fillingPoint !== "object") return fillingPoint;

  const { id, ...rest } = fillingPoint;

  return {
    ...rest,
    fillingStationId: fillingPoint?.fillingStationId || id || fillingPoint?.bookingId || fillingPoint?.uuid || fillingPoint?.fillingPointId,
  };
};

const VendorInbox = (props) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  // const DSO = Digit.UserService.hasAccess(["FSM_DSO"]) || false;
  const GetCell = (value) => <span className="cell-text">{value}</span>;
  const FSTP = Digit.UserService.hasAccess("FSM_EMP_FSTPO") || false;
  const [tableData, setTableData] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedVendorForWorkOrder, setSelectedVendorForWorkOrder] = useState(null);
  const userInfo = Digit.SessionStorage.get("User");

  const userRoles = userInfo.info.roles;
  const userType = userInfo.info.type?.toLowerCase();

  const EKYC_ROLES = ["EKYC_SUPERVISOR", "EKYC_SURVEYOR"];
  const isEkycRole = userRoles?.some((role) => EKYC_ROLES.includes(role?.code || role));

  const openWorkOrderModal = (vendorDetails) => {
    setSelectedVendorForWorkOrder(vendorDetails);
    setShowWorkOrderModal(true);
  };

  const closeWorkOrderModal = () => {
    setSelectedVendorForWorkOrder(null);
    setShowWorkOrderModal(false);
  };

  const handleViewDocument = async (fileStoreId) => {
    if (!fileStoreId) return;
    try {
      const response = await Digit.UploadServices.Filefetch([fileStoreId], "dl");
      if (response?.data?.[fileStoreId]) {
        const fileUrl = response.data[fileStoreId].split(",")[0];
        window.open(fileUrl, "_blank");
      }
    } catch (e) {
      console.error(e);
      setShowToast({ key: "error", action: "Failed to fetch document." });
    }
  };

  const workOrderColumns = React.useMemo(
    () => [
      {
        Header: t("WT_NAME"),
        accessor: "name",
        Cell: ({ row }) => GetCell(row.original.name),
      },
      {
        Header: t("WT_MOBILE_NUMBER"),
        accessor: "mobileNumber",
        Cell: ({ row }) => GetCell(row.original.mobileNumber),
      },
      {
        Header: t("WT_EMAIL_ID"),
        accessor: "emailId",
        Cell: ({ row }) => GetCell(row.original.emailId),
      },
      {
        Header: t("WT_VALID_FROM"),
        accessor: "validFrom",
        Cell: ({ row }) => (row.original.validFrom ? Digit.DateUtils.ConvertEpochToDate(row.original.validFrom) : t("CS_NA")),
      },
      {
        Header: t("WT_VALID_TO"),
        accessor: "validTo",
        Cell: ({ row }) => (row.original.validTo ? Digit.DateUtils.ConvertEpochToDate(row.original.validTo) : t("CS_NA")),
      },
      {
        Header: t("WT_DOCUMENT"),
        accessor: "fileStoreId",
        Cell: ({ row }) =>
          row.original.fileStoreId ? (
            <div
              style={{ color: "#f47738", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => handleViewDocument(row.original.fileStoreId)}
            >
              <ViewsIcon />
            </div>
          ) : (
            t("CS_NA")
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const queryClient = useQueryClient();

  const { data: vendorData, refetch: refetchVendor } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { sortBy: "name", sortOrder: "ASC", status: "ACTIVE" },
    { enabled: false }
  );

  const { data: driverData, refetch: refetchDriver } = Digit.Hooks.fsm.useDriverSearch({
    tenantId,
    filters: {
      sortBy: "name",
      sortOrder: "ASC",
      status: "ACTIVE",
    },
  });

  const { mutate: mutateVendor } = Digit.Hooks.fsm.useVendorUpdate(tenantId);

  const { mutate: mutateVehicle } = Digit.Hooks.fsm.useUpdateVehicle(tenantId);

  const { mutate: mutateDriver } = Digit.Hooks.fsm.useDriverUpdate(tenantId);

  const { mutate: mutateSupervisor } = Digit.Hooks.fsm.useSupervisorUpdate(tenantId);
  const { mutate: mutateSurveyor } = Digit.Hooks.fsm.useSurveyorUpdate(tenantId);

  useEffect(() => {
    setTableData(props?.data?.table || []);
  }, [props]);

  useEffect(() => {
    if (props.selectedTab === "DRIVER" || props.selectedTab === "VEHICLE") {
      refetchVendor();
      refetchDriver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedTab]);

  useEffect(() => {
    if (vendorData) {
      let vendors = vendorData.map((data) => ({
        ...data.dsoDetails,
        displayName: `${data.dsoDetails.name} (${data.dsoDetails.mobileNumber || data.dsoDetails.owner?.mobileNumber || "N/A"})`,
      }));
      setVendors(vendors);
    }
  }, [vendorData]);

  useEffect(() => {
    if (driverData) {
      setDrivers(
        (driverData.driver || []).map((d) => ({
          ...d,
          displayName: `${d.name} (${d.owner?.mobileNumber || "N/A"})`,
        }))
      );
    }
  }, [driverData]);

  const closeToast = () => {
    setShowToast(null);
  };

  const updateVehicleRowState = (vehicleId, updates) => {
    setTableData((currentTableData) => currentTableData.map((vehicle) => (vehicle?.id === vehicleId ? { ...vehicle, ...updates } : vehicle)));
  };

  const getVehicleUpdatePayload = (vehicle, overrides = {}) => {
    const normalizedVehicle = {
      ...vehicle,
      ...overrides,
      driverData: overrides?.driverData || vehicle?.driverData || vehicle?.driver,
      fillingPoint: normalizeFillingPointForVehicleUpdate(
        Object.prototype.hasOwnProperty.call(overrides, "fillingPoint") ? overrides.fillingPoint : vehicle?.fillingPoint
      ),
    };

    delete normalizedVehicle.vendor;
    delete normalizedVehicle.popup;
    delete normalizedVehicle.driver;

    return {
      vehicle: normalizedVehicle,
    };
  };

  const getVendorPayloadForVehicle = (vendor, vehicles) => {
    return {
      vendor: {
        ...vendor,
        owner: {
          ...vendor?.owner,
          gender: vendor?.owner?.gender || "OTHERS",
        },
        vehicles,
      },
    };
  };

  const onVendorUpdate = (row) => {
    let formDetails = row.original.dsoDetails;
    const isDisable = formDetails?.status === "ACTIVE";
    const formData = {
      vendor: {
        ...formDetails,
        status: isDisable ? "DISABLED" : "ACTIVE",
        owner: {
          ...formDetails.owner,
          gender: formDetails?.owner?.gender || "OTHER",
          dob: formDetails?.owner?.dob || new Date(`1/1/1970`).getTime(),
          emailId: formDetails?.owner?.emailId || "abc@egov.com",
          relationship: formDetails?.owner?.relationship || "OTHER",
        },
      },
    };

    mutateVendor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
      },
      onSuccess: (data, variables) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
        } else {
          setShowToast({ key: "success", action: "VENDOR", isDisable });
          queryClient.invalidateQueries("DSO_SEARCH");
          props.refetchData();
        }
      },
    });
  };

  const onVehicleUpdate = (row) => {
    const isDisable = row.original?.status === "ACTIVE";
    const formData = getVehicleUpdatePayload(row.original, {
      status: isDisable ? "DISABLED" : "ACTIVE",
    });

    mutateVehicle(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
      },
      onSuccess: (data, variables) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
        } else {
          setShowToast({ key: "success", action: "VEHICLE", isDisable });
          queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
          props.refetchVendor();
          props.refetchData();
        }
      },
    });
  };

  const onDriverUpdate = (row) => {
    let formDetails = row.original;
    const isDisable = formDetails?.status === "ACTIVE";
    const formData = {
      driver: {
        ...formDetails,
        status: isDisable ? "DISABLED" : "ACTIVE",
        owner: {
          ...formDetails.owner,
          gender: formDetails?.owner?.gender || "OTHER",
          dob: formDetails?.owner?.dob || new Date(`1/1/1970`).getTime(),
          emailId: formDetails?.owner?.emailId || "abc@egov.com",
          relationship: formDetails?.owner?.relationship || "OTHER",
        },
      },
    };

    mutateDriver(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
      },
      onSuccess: (data, variables) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
        } else {
          setShowToast({ key: "success", action: "DRIVER", isDisable });
          queryClient.invalidateQueries("FSM_DRIVER_SEARCH");
          props.refetchVendor();
          props.refetchData();
        }
      },
    });
  };

  const onSupervisorUpdate = (row) => {
    let formDetails = row.original;
    const newStatus = formDetails?.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const newActive = newStatus === "ACTIVE";
    const formData = {
      supervisor: {
        ...formDetails,
        status: newStatus,
        active: newActive,
        owner: {
          ...formDetails?.owner,
          active: newActive,
          gender: formDetails?.owner?.gender || "OTHERS",
          dob: formDetails?.owner?.dob || new Date(`1/1/1970`).getTime(),
          emailId: formDetails?.owner?.emailId || "abc@egov.com",
          relationship: formDetails?.owner?.relationship || "OTHER",
        },
      },
    };
    mutateSupervisor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || error });
      },
      onSuccess: (data, variables) => {
        console.log("newStatus:", newStatus, "isDisable:", newStatus === "DISABLED");
        setShowToast({ key: "success", action: "SUPERVISOR", isDisable: newStatus === "DISABLED" });
        queryClient.invalidateQueries("FSM_SUPERVISOR_SEARCH");
        queryClient.invalidateQueries("SUPERVISOR_SEARCH");
        props.refetchData();
      },
    });
  };
  const onSurveyorUpdate = (row) => {
    let formDetails = row.original;
    const newStatus = formDetails?.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const newActive = newStatus === "ACTIVE";
    const formData = {
      surveyor: {
        ...formDetails,
        status: newStatus,
        active: newActive,
        owner: {
          ...formDetails?.owner,
          active: newActive,
          gender: formDetails?.owner?.gender || "OTHERS",
          dob: formDetails?.owner?.dob || new Date(`1/1/1970`).getTime(),
          emailId: formDetails?.owner?.emailId || "abc@egov.com",
          relationship: formDetails?.owner?.relationship || "OTHER",
        },
      },
    };
    mutateSurveyor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || error });
      },
      onSuccess: (data, variables) => {
        console.log("newStatus:", newStatus, "isDisable:", newStatus === "DISABLED");
        setShowToast({ key: "success", action: "SURVEYOR", isDisable: newStatus === "DISABLED" });
        queryClient.invalidateQueries("FSM_SURVEYOR_SEARCH");
        queryClient.invalidateQueries("SURVEYOR_SEARCH");
        props.refetchData();
      },
    });
  };

  //vendor dropdown in driver
  const onVendorSelect = (row, selectedOption) => {
    let driverData = row.original;
    // let formDetails = row.original.dsoDetails;

    let existingVendor = driverData?.vendor;
    let selectedVendor = selectedOption;
    delete driverData.vendor;
    driverData.vendorDriverStatus = "ACTIVE";
    if (existingVendor) {
      const drivers = existingVendor?.drivers;
      drivers.splice(
        drivers.findIndex((ele) => ele.id === driverData.id),
        1
      );
      // const formData = {
      //   vendor: {
      //     ...formDetails,
      //     drivers: drivers,
      //   },
      // };
    }
    const formData = {
      vendor: {
        ...selectedVendor,
        drivers: selectedVendor.drivers ? [...selectedVendor.drivers, driverData] : [driverData],
      },
    };

    mutateVendor(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "VENDOR" });
        queryClient.invalidateQueries("DSO_SEARCH");
        props.refetchVendor();
        props.refetchData();
      },
    });
  };

  const onVehicleVendorSelect = (row, selectedVendor) => {
    const currentVehicle = row.original;
    const existingVendor = currentVehicle?.vendor;

    if (!selectedVendor?.id || existingVendor?.id === selectedVendor?.id) {
      return;
    }

    const vehicleForVendorMapping = {
      ...currentVehicle,
      vendorVehicleStatus: "ACTIVE",
      fillingPoint: null,
      driverData: null,
      driver: null,
    };

    delete vehicleForVendorMapping.vendor;
    delete vehicleForVendorMapping.popup;
    delete vehicleForVendorMapping.driver;

    const addVehicleToSelectedVendor = () => {
      const selectedVendorVehicles = Array.isArray(selectedVendor?.vehicles) ? [...selectedVendor.vehicles] : [];
      const existingVehicleIndex = selectedVendorVehicles.findIndex((vehicle) => vehicle?.id === currentVehicle?.id);

      if (existingVehicleIndex > -1) {
        selectedVendorVehicles[existingVehicleIndex] = {
          ...selectedVendorVehicles[existingVehicleIndex],
          ...vehicleForVendorMapping,
          vendorVehicleStatus: "ACTIVE",
        };
      } else {
        selectedVendorVehicles.push(vehicleForVendorMapping);
      }

      const updatedSelectedVendor = {
        ...selectedVendor,
        vehicles: selectedVendorVehicles,
      };

      mutateVendor(getVendorPayloadForVehicle(selectedVendor, selectedVendorVehicles), {
        onError: (error) => {
          setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
        },
        onSuccess: (data) => {
          const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
          if (isError) {
            setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
            return;
          }
          updateVehicleRowState(currentVehicle?.id, {
            vendor: updatedSelectedVendor,
            fillingPoint: null,
            driverData: null,
            driver: null,
          });
          setShowToast({ key: "success", action: "VEHICLE", isDisable: false });
          queryClient.invalidateQueries("DSO_SEARCH");
          queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
          props.refetchData();
          props.refetchVendor && props.refetchVendor();
        },
      });
    };

    if (existingVendor?.id) {
      const existingVendorVehicles = Array.isArray(existingVendor?.vehicles)
        ? existingVendor.vehicles.map((vehicle) => (vehicle?.id === currentVehicle?.id ? { ...vehicle, vendorVehicleStatus: "INACTIVE" } : vehicle))
        : [];

      mutateVendor(getVendorPayloadForVehicle(existingVendor, existingVendorVehicles), {
        onError: (error) => {
          setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
        },
        onSuccess: (data) => {
          const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
          if (isError) {
            setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
            return;
          }
          addVehicleToSelectedVendor();
        },
      });
      return;
    }

    addVehicleToSelectedVendor();
  };

  const onDriverSelect = (row, selectedOption) => {
    const formData = getVehicleUpdatePayload(row.original, {
      driverData: selectedOption,
    });

    mutateVehicle(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error?.message || "UPDATE_FAILED" });
      },
      onSuccess: (data, variables) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", action: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "UPDATE_FAILED" });
          return;
        }
        updateVehicleRowState(row.original?.id, {
          driverData: selectedOption,
        });
        setShowToast({ key: "success", action: "VEHICLE", isDisable: false });
        queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
        /* Mandatory: Invalidate DSO_SEARCH to ensure vendorData in the parent component is refetched with the new driver assignment */
        queryClient.invalidateQueries("DSO_SEARCH");
        props.refetchData();
        props.refetchVendor();
      },
    });
  };

  const onVehicleFillingPointSelect = (row, selectedOption) => {
    const formData = getVehicleUpdatePayload(row.original, {
      fillingPoint: selectedOption,
    });

    mutateVehicle(formData, {
      onError: (error) => {
        setShowToast({
          key: "error",
          label: error?.message || error?.response?.data?.Errors?.[0]?.message || "Failed to map filling point",
        });
      },
      onSuccess: (data) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", label: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "Failed to map filling point" });
          return;
        }
        const mappedVendor = getSelectedVendorOption(row.original, vendors);
        const vendorDrivers = getVendorDriversForFillingPoint(mappedVendor, selectedOption);
        const selectedDriver = getSelectedDriverOption(row.original, vendorDrivers);

        updateVehicleRowState(row.original?.id, {
          fillingPoint: {
            ...selectedOption,
            fillingStationId:
              selectedOption?.fillingStationId ||
              selectedOption?.id ||
              selectedOption?.bookingId ||
              selectedOption?.uuid ||
              selectedOption?.fillingPointId,
          },
          ...(selectedDriver ? {} : { driverData: null, driver: null }),
        });
        setShowToast({ key: "success", label: "Filling point mapped successfully" });
        queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
        queryClient.invalidateQueries("DSO_SEARCH");
        props.refetchData();
        props.refetchVendor && props.refetchVendor();
      },
    });
  };

  const onSurveyorSupervisorSelect = (row, selectedSupervisor) => {
    let formDetails = row.original;
    const formData = {
      surveyor: {
        ...formDetails,
        supervisorId: selectedSupervisor?.id || null,
        supervisorName: selectedSupervisor?.name || selectedSupervisor?.owner?.name || null,
        owner: {
          ...formDetails?.owner,
          gender: formDetails?.owner?.gender || "OTHERS",
          dob: formDetails?.owner?.dob || new Date(`1/1/1970`).getTime(),
          emailId: formDetails?.owner?.emailId || "abc@egov.com",
          relationship: formDetails?.owner?.relationship || "OTHER",
        },
      },
    };

    mutateSurveyor(formData, {
      onError: (error) => {
        setShowToast({
          key: "error",
          label: error?.message || error || t("ES_FSM_REGISTRY_INBOX_FAILED_TO_UPDATE_SUPERVISOR"),
        });
      },
      onSuccess: (data) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          setShowToast({ key: "error", label: data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || t("ES_FSM_REGISTRY_INBOX_FAILED_TO_UPDATE_SUPERVISOR") });
          return;
        }
        setShowToast({ key: "success", label: t("ES_FSM_REGISTRY_INBOX_SUPERVISOR_MAPPED_SUCCESSFULLY") });
        queryClient.invalidateQueries(t("SURVEYOR_SEARCH"));
        props.refetchData();
      },
    });
  };

  //on search if the card is empty then it will
  const onSelectAdd = () => {
    switch (props.selectedTab) {
      case "VENDOR":
        return history.push(`/digit-ui/${userType}/vendor/registry/new-vendor`);
      case "VEHICLE":
        return history.push(`/digit-ui/${userType}/vendor/registry/new-vehicle`);
      case "DRIVER":
        return history.push(`/digit-ui/${userType}/vendor/registry/new-driver`);
      case "SUPERVISOR":
        return history.push(`/digit-ui/${userType}/vendor/registry/new-supervisor`);
      case "SURVEYOR":
        return history.push(`/digit-ui/${userType}/vendor/registry/new-surveyor`);
      default:
        break;
    }
  };

  const vendorIds = React.useMemo(() => {
    if (props.selectedTab === "VENDOR") {
      return tableData?.map((row) => row.id) || [];
    }
    return vendorData?.map((v) => v.dsoDetails?.id) || [];
  }, [props.selectedTab, tableData, vendorData]);
  const { data: additionalVendorData } = Digit.Hooks.vendor.useEmpvendorCommonSearch(
    {
      tenantId,
      filters: { vendorIds: vendorIds?.join(","), vendorId: vendorIds?.join(",") },
    },
    { enabled: vendorIds?.length > 0 }
  );

  const { data: allFillingPointsData, isLoading: isAllFillingPointsLoading } = Digit.Hooks.wt.useFillPointSearch(
    {
      tenantId,
      filters: { limit: 1000 },
    },
    { enabled: true }
  );

  const allFillingPoints = allFillingPointsData?.fillingPoints || [];

  const { data: supervisorSearchResponse } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: props.selectedTab === "SURVEYOR" }
  );

  const supervisors = React.useMemo(() => {
    const list = supervisorSearchResponse?.supervisors || supervisorSearchResponse?.supervisor || [];
    return list.map((s) => ({
      ...s,
      displayName: `${s.name || s.owner?.name || "N/A"} (${s.owner?.mobileNumber || s.mobileNo || "N/A"})`,
    }));
  }, [supervisorSearchResponse]);

  //used for columns in table
  const columns = React.useMemo(() => {
    switch (props.selectedTab) {
      case "VENDOR":
        return [
          //Vendor Name
          {
            Header: t("ES_VENDOR_INBOX_VENDOR_NAME"),
            accessor: "name",
            Cell: ({ row }) => {
              return (
                <div>
                  <Link to={`/digit-ui/${userType}/vendor/registry/vendor-details/` + row.original["id"]}>
                    <span className="link">{row.original.name}</span>
                  </Link>
                </div>
              );
            },
          },

          {
            Header: t("WT_MOBILE_NUMBER"),
            accessor: "mobileNumber",
            Cell: ({ row }) => {
              return <div>{row.original.mobileNumber}</div>;
            },
          },

          //creation date
          {
            Header: t("ES_VENDOR_INBOX_DATE_VENDOR_CREATION"),
            accessor: "createdTime",
            Cell: ({ row }) =>
              GetCell(row.original?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row.original?.auditDetails?.createdTime) : ""),
          },

          {
            Header: t("ES_VENDOR_INBOX_SERVICE_TYPE"),
            id: "serviceType",
            accessor: (row) => {
              let additionalDetails = row.dsoDetails?.additionalDetails;
              if (typeof additionalDetails === "string") {
                try {
                  additionalDetails = JSON.parse(additionalDetails);
                } catch (error) {
                  additionalDetails = {};
                }
              }
              return additionalDetails?.serviceType || "N/A";
            },
            Cell: ({ row }) => {
              let additionalDetails = row.original.dsoDetails?.additionalDetails;
              if (typeof additionalDetails === "string") {
                try {
                  additionalDetails = JSON.parse(additionalDetails);
                } catch (error) {
                  console.error("Error parsing additionalDetails:", error);
                  additionalDetails = {};
                }
              }

              const serviceType = additionalDetails?.serviceType || "N/A";
              return <div>{serviceType}</div>;
            },
          },

          //enabled/disabled
          {
            Header: t("ES_VENDOR_REGISTRY_INBOX_ENABLED"),
            id: "status",
            accessor: (row) => row.dsoDetails?.status || "",
            Cell: ({ row }) => {
              return (
                <ToggleSwitch
                  style={{ display: "flex", justifyContent: "left" }}
                  value={row.original?.dsoDetails?.status === "DISABLED" ? false : true}
                  onChange={() => onVendorUpdate(row)}
                  name={`switch-${row.id}`}
                />
              );
            },
          },
          // {
          //   Header: t("ES_VENDOR_ADDITIONAL_DETAILS"),
          //   disableSortBy: true,
          //   Cell: ({ row }) => {
          //     const vendorId = row.original?.id;

          //     // Guard: if data not yet loaded, show a neutral state
          //     if (!additionalVendorData) {
          //       return <span>Loading...</span>;
          //     }

          //     const hasDetails = row.original?.vendorAdditionalDetails !== null;
          //     return (
          //       <Link
          //         to={
          //           hasDetails
          //             ? `/digit-ui/${userType}/vendor/registry/additionaldetails/info?vendorId=` + vendorId
          //             : `/digit-ui/${userType}/vendor/registry/additionaldetails/modify-details?vendorId=` + vendorId
          //         }
          //       >
          //         <button
          //           className="submit-bar"
          //           style={{
          //             backgroundColor: hasDetails ? "#417505" : "#3A8DCC",
          //             color: "white",
          //           }}
          //         >
          //           {hasDetails ? "View Details" : "Add Details"}
          //         </button>
          //       </Link>
          //     );
          //   },
          // },
          ...(!(userType !== "CITIZEN" && isEkycRole)
            ? [
              {
                Header: t("ES_VENDOR_ADDITIONAL_DETAILS"),
                disableSortBy: true,
                Cell: ({ row }) => {
                  const vendorId = row.original?.id;

                  // Guard: if data not yet loaded, show a neutral state
                  if (!additionalVendorData) {
                    return <span>Loading...</span>;
                  }

                  const hasDetails = row.original?.vendorAdditionalDetails !== null;
                  return (
                    <Link
                      to={
                        !hasDetails
                          ? `/digit-ui/${userType}/vendor/registry/additionaldetails/modify-details?vendorId=` + vendorId
                          : `/digit-ui/${userType}/vendor/registry/vendor-details/` + vendorId
                      }
                    >
                      <button
                        className="submit-bar"
                        style={{
                          backgroundColor: hasDetails ? "#417505" : "#3A8DCC",
                          color: "white",
                        }}
                      >
                        {hasDetails ? "View Details" : "Add Details"}
                      </button>
                    </Link>
                  );
                },
              },
            ]
            : []),

          ...(!isEkycRole
            ? [
              {
                Header: t("VIEW_WORKORDER_DETAILS"),
                disableSortBy: true,
                Cell: ({ row }) => {
                  return (
                    <button
                      className="submit-bar"
                      style={{
                        backgroundColor: "#417505",
                        color: "white",
                      }}
                      onClick={() => openWorkOrderModal(row.original)}
                    >
                      {t("VIEW_WORKORDER_DETAILS")}
                    </button>
                  );
                },
              },
            ]
            : []),
        ];

      //if toggle on vehicle then it will show the below columns
      case "VEHICLE":
        return [
          //vehicle name/number
          {
            Header: t("ES_FSM_REGISTRY_INBOX_VEHICLE_NAME"),
            accessor: "registrationNumber",
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={`/digit-ui/${userType}/vendor/registry/vehicle-details/` + row.original["registrationNumber"]}>
                      <div>{row.original.registrationNumber}</div>
                    </Link>
                  </span>
                </div>
              );
            },
          },

          {
            Header: t("WT_MOBILE_NUMBER"),
            accessor: "mobileNumber",
            Cell: ({ row }) => {
              return <div>{row.original?.owner?.mobileNumber || "N/A"}</div>;
            },
          },

          //creation date
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DATE_VEHICLE_CREATION"),
            accessor: "createdTime",
            Cell: ({ row }) =>
              GetCell(row.original?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row.original?.auditDetails?.createdTime) : ""),
          },

          //vendor name
          {
            Header: "Map Vendor",
            id: "mapVendor",
            accessor: (row) => row.vendor?.name || row.vendorData?.name || "NA",
            Cell: ({ row }) => {
              return (
                <Dropdown
                  className="fsm-registry-dropdown"
                  selected={getSelectedVendorOption(row.original, vendors)}
                  option={vendors}
                  select={(value) => onVehicleVendorSelect(row, value)}
                  style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                  optionKey="displayName"
                  t={t}
                />
              );
            },
          },

          {
            Header: t("ES_VENDOR_INBOX_SERVICE_TYPE"),
            id: "serviceType",
            accessor: (row) => {
              let additionalDetail = row.additionalDetails;
              if (typeof additionalDetail === "string") {
                try {
                  additionalDetail = JSON.parse(additionalDetail);
                } catch (error) {
                  additionalDetail = {};
                }
              }
              return additionalDetail?.serviceType || "N/A";
            },
            Cell: ({ row }) => {
              let additionalDetail = row.original.additionalDetails;
              if (typeof additionalDetail === "string") {
                try {
                  additionalDetail = JSON.parse(additionalDetail);
                } catch (error) {
                  console.error("Error parsing additionalDetails:", error);
                  additionalDetail = {};
                }
              }

              const serviceType = additionalDetail?.serviceType || "N/A";
              return <div>{serviceType}</div>;
            },
          },

          {
            Header: t("WT_FILLING_POINT"),
            accessor: (row) => getFillingPointDisplayValue(row),
            id: "fillingPoint",
            minWidth: 250,
            Cell: ({ row }) => {
              const selectedVendor = getSelectedVendorOption(row.original, vendors);
              const vendorFillingPoints = getVendorFillingPoints(selectedVendor);

              return (
                <Dropdown
                  className="fsm-registry-dropdown"
                  selected={getSelectedFillingPointOption(row.original, vendorFillingPoints)}
                  option={vendorFillingPoints}
                  select={(value) => onVehicleFillingPointSelect(row, value)}
                  style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                  optionKey="fillingPointName"
                  t={t}
                  disable={!selectedVendor || !vendorFillingPoints.length}
                />
              );
            },
          },

          {
            Header: t("ES_FSM_REGISTRY_SELECT_DRIVER"),
            id: "driver",
            accessor: (row) => row.driverData?.name || row.driver?.name || "NA",
            minWidth: 250,
            Cell: ({ row }) => {
              const selectedVendor = getSelectedVendorOption(row.original, vendors);
              const selectedFillingPoint = getSelectedFillingPointOption(row.original, getVendorFillingPoints(selectedVendor));
              const availableDrivers = getVendorDriversForFillingPoint(selectedVendor, selectedFillingPoint);

              return (
                <Dropdown
                  className="fsm-registry-dropdown"
                  selected={getSelectedDriverOption(row.original, availableDrivers)}
                  option={availableDrivers}
                  select={(value) => onDriverSelect(row, value)}
                  optionKey="displayName"
                  t={t}
                  style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                  disable={!selectedFillingPoint || !availableDrivers.length}
                />
              );
            },
          },

          //enabled
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            id: "status",
            accessor: (row) => row.status || "",
            Cell: ({ row }) => {
              return (
                <ToggleSwitch
                  style={{ display: "flex", justifyContent: "left" }}
                  value={row.original?.status === "DISABLED" ? false : true}
                  onChange={() => onVehicleUpdate(row)}
                  name={`switch-${row.id}`}
                />
              );
            },
          },
        ];

      //if toggle on driver then it will show the below columns
      case "DRIVER":
        return [
          //Username
          {
            Header: t("ES_FSM_REGISTRY_INBOX_USERNAME"),
            id: "userName",
            accessor: (row) => row.owner?.userName || "NA",
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={`/digit-ui/${userType}/vendor/registry/driver-details/` + row.original["id"]}>
                      <div>{row.original.owner?.userName || "NA"}</div>
                    </Link>
                  </span>
                </div>
              );
            },
          },
          //driver name
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DRIVER_NAME"),
            accessor: "name",
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={`/digit-ui/${userType}/vendor/registry/driver-details/` + row.original["id"]}>
                      <div>{`${row.original.name || "N/A"}`}</div>
                    </Link>
                  </span>
                </div>
              );
            },
          },

          {
            Header: t("WT_MOBILE_NUMBER"),
            accessor: "mobileNumber",
            Cell: ({ row }) => {
              return <div>{row.original?.owner?.mobileNumber || "N/A"}</div>;
            },
          },

          //creation date
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DATE_DRIVER_CREATION"),
            accessor: "createdTime",
            Cell: ({ row }) =>
              GetCell(row.original?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row.original?.auditDetails?.createdTime) : ""),
          },

          //vendor name
          {
            Header: t("ES_FSM_REGISTRY_INBOX_VENDOR_NAME"),
            id: "vendorName",
            accessor: (row) => row.vendorData?.name || row.vendor?.name || "NA",
            minWidth: 250,
            Cell: ({ row }) => {
              return (
                <Dropdown
                  className="fsm-registry-dropdown"
                  selected={
                    vendors?.find((vendor) => (row.original.vendorData?.id || row.original.vendor?.id) === vendor.id) ||
                    row.original.vendorData ||
                    row.original.vendor
                  }
                  // selected={row.original.vendor}
                  option={vendors}
                  select={(value) => onVendorSelect(row, value)}
                  style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                  optionKey="displayName"
                  t={t}
                />
              );
            },
          },

          //enabled
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            id: "status",
            accessor: (row) => row.status || "",
            Cell: ({ row }) => {
              return (
                <ToggleSwitch
                  style={{ display: "flex", justifyContent: "left" }}
                  value={row.original?.status === "DISABLED" ? false : true}
                  onChange={() => onDriverUpdate(row)}
                  name={`switch-${row.id}`}
                />
              );
            },
          },
        ];
      case "SUPERVISOR":
      case "SURVEYOR":
        return [
          {
            Header: props.selectedTab === "SUPERVISOR" ? t("ES_FSM_REGISTRY_INBOX_SUPERVISOR_NAME") : t("ES_FSM_REGISTRY_INBOX_SURVEYOR_NAME"),
            accessor: "name",
            Cell: ({ row }) => {
              const detailsPath = props.selectedTab === "SUPERVISOR" ? "supervisor-details" : "surveyor-details";
              return (
                <div>
                  <span className="link">
                    <Link to={`/digit-ui/${userType}/vendor/registry/${detailsPath}/` + row.original["id"]}>
                      <div>{`${row.original.name || "N/A"}`}</div>
                    </Link>
                  </span>
                </div>
              );
            },
          },
          {
            Header: t("WT_MOBILE_NUMBER"),
            accessor: "mobileNumber",
            Cell: ({ row }) => {
              return <div>{row.original?.owner?.mobileNumber || "N/A"}</div>;
            },
          },
          ...(props.selectedTab === "SUPERVISOR"
            ? [
              {
                Header: t("ES_VENDOR_SUPERVISOR_ZONE_NAME"),
                id: "zoneId",
                accessor: (row) => row.assignedZoneId || "NA",
                Cell: ({ row }) => {
                  const zoneId = row.original?.assignedZoneId;
                  return <div>{zoneId ? t(zoneId) : "NA"}</div>;
                }
              },
              {
                Header: t("ES_VENDOR_SUPERVISOR_AGENCY_NAME") || "Agency Name",
                id: "agencyName",
                accessor: (row) => row.vendorName || row.vendorData?.name || row.vendor?.name || "NA",
                Cell: ({ row }) => {
                  return <div>{row.original?.vendorName || row.original?.vendorData?.name || row.original?.vendor?.name || "NA"}</div>;
                },
              },
            ]
            : []),
          ...(props.selectedTab === "SURVEYOR"
            ? [
              {
                Header: t("ES_FSM_REGISTRY_INBOX_SUPERVISOR_NAME"),
                id: "supervisor",
                accessor: (row) => row.supervisorName || row.reportingManager?.name || "NA",
                Cell: ({ row }) => {
                  return (
                    <Dropdown
                      className="fsm-registry-dropdown"
                      selected={getSelectedSupervisorOption(row.original, supervisors)}
                      option={supervisors}
                      select={(value) => onSurveyorSupervisorSelect(row, value)}
                      optionKey="displayName"
                      t={t}
                      style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                      disable={!supervisors.length}
                    />
                  );
                },
              },
            ]
            : []),
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DATE_CREATION"),
            accessor: "createdTime",
            Cell: ({ row }) =>
              GetCell(row.original?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row.original?.auditDetails?.createdTime) : ""),
          },
          // {
          //   Header: props.selectedTab === "SUPERVISOR" ? t("ES_VENDOR_SUPERVISOR_AGENCY_NAME") : t("ES_VENDOR_SURVEYOR_AGENCY_NAME"),
          //   id: "vendorName",
          //   accessor: (row) => row.vendorData?.name || row.vendor?.name || "NA",
          //   Cell: ({ row }) => {
          //     return <div>{row.original.vendorData?.name || row.original.vendor?.name || "NA"}</div>;
          //   },
          // },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            id: "status",
            accessor: (row) => row.status || "",
            Cell: ({ row }) => {
              return (
                <ToggleSwitch
                  style={{ display: "flex", justifyContent: "left" }}
                  value={row.original?.status === "DISABLED" ? false : true}
                  onChange={() => {
                    if (props.selectedTab === "SUPERVISOR") {
                      onSupervisorUpdate(row);
                    } else if (props.selectedTab === "SURVEYOR") {
                      onSurveyorUpdate(row);
                    }
                  }}
                  name={`switch-${row.id}`}
                />
              );
            },
          },
        ];
      default:
        return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedTab, vendors, drivers, tableData, additionalVendorData, allFillingPoints, supervisors, t]);

  const csvExportColumns = React.useMemo(() => {
    switch (props.selectedTab) {
      case "VENDOR":
        return [
          {
            Header: t("ES_VENDOR_INBOX_VENDOR_NAME"),
            exportAccessor: (row) =>
              `${row?.name || row?.dsoDetails?.name || "NA"} (${row?.mobileNumber || row?.owner?.mobileNumber || row?.dsoDetails?.mobileNumber || row?.dsoDetails?.owner?.mobileNumber || "NA"
              })`,
          },
          {
            Header: t("ES_VENDOR_INBOX_DATE_VENDOR_CREATION"),
            exportAccessor: (row) => (row?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row?.auditDetails?.createdTime) : ""),
          },
          {
            Header: t("WT_FILLING_POINT"),
            exportAccessor: (row) => getFillingPointDisplayValue(row),
          },
          {
            Header: t("ES_VENDOR_INBOX_SERVICE_TYPE"),
            exportAccessor: (row) => parseAdditionalDetails(row?.dsoDetails?.additionalDetails)?.serviceType || "N/A",
          },
          {
            Header: t("ES_VENDOR_REGISTRY_INBOX_ENABLED"),
            exportAccessor: (row) => row?.dsoDetails?.status || "NA",
          },
        ];
      case "VEHICLE":
        return [
          {
            Header: t("ES_FSM_REGISTRY_INBOX_VEHICLE_NAME"),
            exportAccessor: (row) => row?.registrationNumber || "NA",
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DATE_VEHICLE_CREATION"),
            exportAccessor: (row) => (row?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row?.auditDetails?.createdTime) : ""),
          },
          {
            Header: "Map Vendor",
            exportAccessor: (row) =>
              `${row?.vendor?.name || row?.vendorData?.name || "NA"} (${row?.vendor?.mobileNumber ||
              row?.vendor?.owner?.mobileNumber ||
              row?.vendorData?.mobileNumber ||
              row?.vendorData?.owner?.mobileNumber ||
              "NA"
              })`,
          },
          {
            Header: t("ES_VENDOR_INBOX_SERVICE_TYPE"),
            exportAccessor: (row) => parseAdditionalDetails(row?.additionalDetails)?.serviceType || "N/A",
          },
          {
            Header: t("WT_FILLING_POINT"),
            exportAccessor: (row) => getFillingPointDisplayValue(row),
          },
          {
            Header: t("ES_FSM_REGISTRY_SELECT_DRIVER"),
            exportAccessor: (row) =>
              `${row?.driverData?.name || row?.driver?.name || "NA"} (${row?.driverData?.owner?.mobileNumber || row?.driver?.owner?.mobileNumber || "NA"
              })`,
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            exportAccessor: (row) => row?.status || "NA",
          },
        ];
      case "DRIVER":
        return [
          {
            Header: t("ES_FSM_REGISTRY_INBOX_USERNAME"),
            exportAccessor: (row) => row?.owner?.userName || "NA",
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DRIVER_NAME"),
            exportAccessor: (row) => `${row?.name || "NA"} (${row?.owner?.mobileNumber || "NA"})`,
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_DATE_DRIVER_CREATION"),
            exportAccessor: (row) => (row?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row?.auditDetails?.createdTime) : ""),
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_VENDOR_NAME"),
            exportAccessor: (row) =>
              `${row?.vendorData?.name || row?.vendor?.name || "NA"} (${row?.vendorData?.mobileNumber ||
              row?.vendorData?.owner?.mobileNumber ||
              row?.vendor?.mobileNumber ||
              row?.vendor?.owner?.mobileNumber ||
              "NA"
              })`,
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            exportAccessor: (row) => row?.status || "NA",
          },
        ];
      case "SURVEYOR":
        return [
          {
            Header: t("USER_ID"),
            exportAccessor: (row) => row?.owner?.userName || "NA",
          },
          {
            Header: t("USER_NAME"),
            exportAccessor: (row) => row?.name || "NA",
          },
          {
            Header: t("VENDOR_NAME"),
            exportAccessor: (row) => row?.vendorName || row?.vendorData?.name || row?.vendor?.name || "NA",
          },
          {
            Header: t("SUPERVISOR_NAME"),
            exportAccessor: (row) => {
              const selectedSupervisor = getSelectedSupervisorOption(row, supervisors);
              return selectedSupervisor
                ? selectedSupervisor.name || selectedSupervisor.owner?.name || "NA"
                : row?.supervisorName || row?.reportingManager?.name || "NA";
            },
          },
          {
            Header: t("CREATION_DATE"),
            exportAccessor: (row) => (row?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row?.auditDetails?.createdTime) : ""),
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            exportAccessor: (row) => row?.status || "NA",
          },
        ];
      case "SUPERVISOR":
        return [
          {
            Header: t("USER_ID"),
            exportAccessor: (row) => row?.owner?.userName || "NA",
          },
          {
            Header: t("USER_NAME"),
            exportAccessor: (row) => row?.name || "NA",
          },
          {
            Header: t("ZONE"),
            exportAccessor: (row) => row?.assignedZoneId || "NA",
          },
          {
            Header: t("VENDOR_NAME"),
            exportAccessor: (row) => row?.vendorName || row?.vendorData?.name || row?.vendor?.name || "NA",
          },
          {
            Header: t("CREATION_DATE"),
            exportAccessor: (row) => (row?.auditDetails?.createdTime ? Digit.DateUtils.ConvertEpochToDate(row?.auditDetails?.createdTime) : ""),
          },
          {
            Header: t("ES_FSM_REGISTRY_INBOX_ENABLED"),
            exportAccessor: (row) => row?.status || "NA",
          },
        ];
      default:
        return [];
    }
  }, [props.selectedTab, supervisors, t]);

  const getCSVExportData = React.useCallback(async () => {
    if (props.selectedTab === "SUPERVISOR") {
      try {
        const response = await Digit.FSMService.supervisorSearch(tenantId, {
          status: "ACTIVE,DISABLED",
          name: props.searchParams?.name,
          mobileNumber: props.searchParams?.mobileNumber || undefined,
          limit: 100000,
          offset: 0,
        });
        return response?.supervisors || response?.supervisor || [];
      } catch (e) {
        console.error(e);
        return [];
      }
    }
    if (props.selectedTab === "SURVEYOR") {
      try {
        const response = await Digit.FSMService.surveyorSearch(tenantId, {
          status: "ACTIVE,DISABLED",
          name: props.searchParams?.name,
          mobileNumber: props.searchParams?.mobileNumber || undefined,
          limit: 100000,
          offset: 0,
        });
        return response?.surveyors || response?.surveyor || [];
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    if (props.selectedTab === "VENDOR") {
      try {
        const response = await Digit.FSMService.vendorSearch(tenantId, {
          status: "ACTIVE,DISABLED",
          name: props.searchParams?.name,
          mobileNumber: props.searchParams?.mobileNumber || undefined,
          limit: 100000,
          offset: 0,
        });
        return response?.vendors || response?.vendor || [];
      } catch (e) {
        console.error(e);
        return [];
      }
    }
    return tableData;
  }, [props.selectedTab, props.searchParams, tenantId, tableData]);

  // if it validate the user role then it starts working
  let result;
  if (props.isLoading || isAllFillingPointsLoading) {
    result = (
      <div
        style={{
          zIndex: 10,
          position: "relative",
          padding: "10px",
          backgroundColor: "#fff",
          width: "75px",
          height: "75px",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "auto",
        }}
      >
        <Loader />
      </div>
    );
  } else if (tableData.length === 0) {
    let emptyCardText = "";
    let emptyButtonText = "";
    if (props.selectedTab === "VENDOR") {
      emptyCardText = "ES_FSM_REGISTRY_EMPTY_CARD_VENDOR";
      // emptyButtonText = "ES_FSM_REGISTRY_EMPTY_BUTTON_VENDOR";
    } else if (props.selectedTab === "VEHICLE") {
      emptyCardText = "ES_FSM_REGISTRY_EMPTY_CARD_VEHICLE";
      // emptyButtonText = "ES_FSM_REGISTRY_EMPTY_BUTTON_VEHICLE";
    } else if (props.selectedTab === "SUPERVISOR") {
      emptyCardText = "ES_FSM_REGISTRY_EMPTY_CARD_SUPERVISOR";
      // emptyButtonText = "ES_FSM_REGISTRY_EMPTY_BUTTON_SUPERVISOR";
    } else if (props.selectedTab === "SURVEYOR") {
      emptyCardText = "ES_FSM_REGISTRY_EMPTY_CARD_SURVEYOR";
      // emptyButtonText = "ES_FSM_REGISTRY_EMPTY_BUTTON_SURVEYOR";
    } else {
      emptyCardText = "ES_FSM_REGISTRY_EMPTY_CARD_DRIVER";
      // emptyButtonText = "ES_FSM_REGISTRY_EMPTY_BUTTON_DRIVER";
    }
    result = (
      <Card className="flex-center flex-box">
        <div style={{ marginTop: "50px", marginBottom: "25px" }}>{t(emptyCardText)}</div>
        {emptyButtonText && <SubmitBar className="" label={t(emptyButtonText)} onSubmit={onSelectAdd} />}
      </Card>
    );

    //if data in table is greater than 0 then it will create table
  } else if (tableData.length > 0) {
    result = (
      <ApplicationTable
        className="table"
        t={t}
        data={tableData}
        columns={columns}
        onPageSizeChange={props.onPageSizeChange}
        currentPage={props.currentPage}
        onNextPage={props.onNextPage}
        onPrevPage={props.onPrevPage}
        pageSizeLimit={props.pageSizeLimit}
        onSort={props.onSort}
        disableSort={props.disableSort}
        sortParams={props.sortParams}
        totalRecords={props.totalRecords}
        showCSVExport={true}
        getCSVExportData={getCSVExportData}
        csvExportColumns={csvExportColumns}
        csvExportFileName={`vendor-${String(props.selectedTab || "registry").toLowerCase()}-inbox`}
      />
    );
  }

  const ekycRoles = {
    ekycVendor: "EKYC_VENDOR",
    supervisor: "EKYC_SUPERVISOR",
    employee: "EMPLOYEE",
  };

  const wtRoles = {
    wtVendor: "WT_VENDOR",
  };

  // Extract user role codes
  const userRoleCodes = userRoles.map((role) => role.code);

  // Get exact matched EKYC roles
  const matchedEkycRoles = Object.values(ekycRoles).filter((role) => userRoleCodes.includes(role));

  // Get exact matched WT roles
  const matchedWtRoles = Object.values(wtRoles).filter((role) => userRoleCodes.includes(role));
  const matchedRoles = {
    ekyc: matchedEkycRoles,
    wt: matchedWtRoles,
  };

  return (
    <div className="inbox-container">
      {props.userRole !== "FSM_EMP_FSTPO" && props.userRole !== "FSM_ADMIN" && !props.isSearch && (
        <div className="filters-container">
          <VENDORLink parentRoute={props.parentRoute} />
          <div style={{ marginTop: "24px" }}>
            <Filter
              searchParams={props.searchParams}
              paginationParms={props.paginationParms}
              applications={props.data}
              onFilterChange={props.onFilterChange}
              type="desktop"
            />
          </div>
        </div>
      )}
      <div
        style={{
          flex: 1,
          width: "100%",
          marginLeft: props.userRole === "FSM_ADMIN" ? "" : "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <RegisteredVendorSearch
          onSearch={props.onSearch}
          type="desktop"
          searchFields={props.searchFields}
          isInboxPage={!props?.isSearch}
          searchParams={props.searchParams}
          onTabChange={props.onTabChange}
          selectedTab={props.selectedTab}
          matchedRoles={matchedRoles}
        />
        <div className="result" style={{ marginLeft: FSTP || props.userRole === "FSM_ADMIN" ? "" : !props?.isSearch ? "24px" : "", flex: 1 }}>
          {result}
        </div>
      </div>
      {showToast && (
        <Toast
          error={showToast.key === "error" ? true : false}
          label={
            showToast.label
              ? t(showToast.label)
              : showToast.key === "success"
                ? t(`ES_FSM_REGISTRY_${showToast.action}_${showToast.isDisable ? "DISABLE" : "ENABLE"}_SUCCESS`)
                : t(showToast.action)
          }
          onClose={closeToast}
        />
      )}
      {showWorkOrderModal && (
        <Modal
          headerBarMain={
            <h1 className="heading-m" style={{ margin: 0 }}>
              {t("ES_VENDOR_WORKORDER_DETAILS_MODAL")}
            </h1>
          }
          headerBarEnd={
            <div className="icon-bg-secondary" onClick={closeWorkOrderModal} style={{ cursor: "pointer" }}>
              <MdClose />
            </div>
          }
          actionCancelLabel={t("CS_COMMON_CLOSE")}
          actionCancelOnSubmit={closeWorkOrderModal}
          hideSubmit={true}
          formId="modal-action"
        >
          <div style={{ padding: "16px" }}>
            {selectedVendorForWorkOrder?.dsoDetails?.vendorWorkOrder?.length > 0 ? (
              <Table t={t} data={selectedVendorForWorkOrder.dsoDetails.vendorWorkOrder} columns={workOrderColumns} />
            ) : (
              <p style={{ textAlign: "center", marginTop: "20px" }}>{t("ES_VENDOR_NO_WORKORDERS")}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VendorInbox;
