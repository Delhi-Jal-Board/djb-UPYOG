import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import VendorInbox from "../VendorInbox";
import { Toast } from "@djb25/digit-ui-react-components";

import { useLocation } from "react-router-dom";

const SearchVendor = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser();
  const roles = Digit.UserService.getUser()?.info?.roles?.map((r) => r.code) || [];

  const location = useLocation();
  const initialPage =
    roles.includes("EKYC_VENDOR") || roles.includes("WT_VENDOR")
      ? "VENDOR"
      : roles.includes("EKYC_SUPERVISOR")
      ? "SURVEYOR"
      : roles.includes("EKYC_SURVEYOR")
      ? "SURVEYOR"
      : "";

  const { selectedTabs } = Digit.Hooks.useQueryParams();
  const [tab, setTab] = useState(selectedTabs || initialPage);
  const [searchParams, setSearchParams] = useState({});
  const [sortParams, setSortParams] = useState([{ id: "createdTime", desc: true }]);
  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [vehicleIds, setVehicleIds] = useState("");
  const [driverIds, setDriverIds] = useState("");
  const [tableData, setTableData] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const { consumeToast } = Digit.Hooks.useToast();

  useEffect(() => {
    const message = consumeToast();

    if (message) {
      setShowToast(message);
    }
  }, []);

  const isCitizen = userInfo?.info?.type === "CITIZEN";
  const loggedInVendorId = userInfo?.info?.uuid;

  const { data: allVendors } = Digit.Hooks.fsm.useDsoSearch(tenantId, { status: "ACTIVE" }, { staleTime: Infinity });
  const { data: allFillingPoints } = Digit.Hooks.wt.useFillPointSearch({ tenantId, filters: { limit: 1000 } }, { staleTime: Infinity });

  let paginationParms = { limit: pageSize, offset: pageOffset, sortBy: sortParams?.[0]?.id, sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC" };

  const { data: dsoData, isLoading, refetch } =
    tab === "VEHICLE"
      ? Digit.Hooks.fsm.useVehiclesSearch({
          //
          tenantId,
          filters: {
            ...paginationParms,
            registrationNumber: searchParams?.registrationNumber,
            status: "ACTIVE,DISABLED",
            vendorId: isCitizen ? loggedInVendorId : searchParams?.vendor?.id,
            fillingPointId: searchParams?.fillingPoint?.id,
          },
          config: { enabled: false },
        })
      : tab === "DRIVER"
      ? Digit.Hooks.fsm.useDriverSearch({
          tenantId,
          filters: {
            ...paginationParms,
            name: searchParams?.name,
            status: "ACTIVE,DISABLED",
            vendorId: isCitizen ? loggedInVendorId : searchParams?.vendor?.id,
          },
          config: { enabled: false },
        })
      : tab === "SUPERVISOR"
      ? Digit.Hooks.fsm.useSupervisorSearch(
          tenantId,
          {
            ...paginationParms,
            status: "ACTIVE,DISABLED",
            name: searchParams?.name,
          },
          { enabled: false }
        )
      : tab === "SURVEYOR"
      ? Digit.Hooks.fsm.useSurveyorSearch(
          tenantId,
          {
            ...paginationParms,
            status: "ACTIVE,DISABLED",
            // vendorId: isCitizen ? loggedInVendorId : searchParams?.vendor?.id,
            name: searchParams?.name,
          },
          { enabled: false }
        )
      : Digit.Hooks.fsm.useVendorSearch({
          tenantId,
          filters: {
            ...paginationParms,
            name: searchParams?.name,
            status: "ACTIVE,DISABLED",
          },
          config: { enabled: false },
        });

  Digit.Hooks.fsm.useVendorSearch({
    tenantId,
    filters: {
      ...paginationParms,
      name: searchParams?.name,
      status: "ACTIVE,DISABLED",
    },
    config: { enabled: false },
  });

  const { data: vendorData, isLoading: isVendorLoading, refetch: refetchVendor } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    {
      vehicleIds: vehicleIds,
      driverIds: driverIds,
      status: "ACTIVE",
    },
    { enabled: false }
  );

  const inboxTotalCount = dsoData?.totalCount || 50;

  useEffect(() => {
    refetch();
    refetchVendor();
    if (location.state?.showSuccessToast) {
      setShowToast(location.state?.message);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [searchParams, sortParams, pageOffset, pageSize]);

  useEffect(() => {
    if (dsoData?.vehicle && tab === "VEHICLE") {
      const vehicleIds = dsoData.vehicle
        .map((data) => data.id)
        .filter(Boolean)
        .join(",");
      setVehicleIds(vehicleIds);
      setTableData(dsoData.vehicle);
    }
    if (dsoData?.driver && tab === "DRIVER") {
      const driverIds = dsoData.driver
        .map((data) => data.id)
        .filter(Boolean)
        .join(",");
      setDriverIds(driverIds);
      setTableData(dsoData?.driver);
    }
    if (dsoData?.vendor && tab === "VENDOR") {
      const tableData = dsoData.vendor.map((dso) => ({
        mobileNumber: dso.owner?.mobileNumber,
        name: dso.name,
        id: dso.id,
        auditDetails: dso.auditDetails,
        drivers: dso.drivers,
        activeDrivers: dso.drivers?.filter((driver) => driver.status === "ACTIVE"),
        allVehicles: dso.vehicles,
        dsoDetails: dso,
        vendorAdditionalDetails: dso.vendorAdditionalDetails,
        fillingPoint: dso.fillingPoint,
        vehicles: dso.vehicles
          ?.filter((vehicle) => vehicle.status === "ACTIVE")
          ?.map((vehicle) => ({
            id: vehicle.id,
            registrationNumber: vehicle?.registrationNumber,
            type: vehicle.type,
            i18nKey: `FSM_VEHICLE_TYPE_${vehicle.type}`,
            capacity: vehicle.tankCapacity,
            suctionType: vehicle.suctionType,
            model: vehicle.model,
          })),
      }));
      setTableData(tableData);
    }
    if (tab === "SUPERVISOR") {
      setTableData(dsoData?.supervisors || dsoData?.supervisor || []);
    }
    if (tab === "SURVEYOR") {
      setTableData(dsoData?.surveyors || dsoData?.surveyor || []);
    }
  }, [dsoData, tab]);

  useEffect(() => {
    if (vehicleIds !== "" || driverIds !== "") refetchVendor();
  }, [vehicleIds, driverIds]);

  useEffect(() => {
    let mounted = true;
    if (vendorData && mounted) {
      if (tab === "VEHICLE") {
        const vehicles = dsoData?.vehicle?.map((data) => {
          let vendor = vendorData.find((ele) => ele.dsoDetails?.vehicles?.find((vehicle) => vehicle.id === data.id));
          if (vendor) {
            let updatedData = { ...data, vendor: vendor.dsoDetails };
            const vehicleInVendor = vendor.dsoDetails?.vehicles?.find((vehicle) => vehicle.id === data.id);
            if (vehicleInVendor) {
              updatedData.driverData = vehicleInVendor.driverData || vehicleInVendor.driver || updatedData.driverData;
            }
            return updatedData;
          }
          return data;
        });
        setTableData(vehicles);
        setVehicleIds("");
      }
      if (tab === "DRIVER") {
        const drivers = dsoData?.driver?.map((data) => {
          let vendor = vendorData.find((ele) => ele.dsoDetails?.drivers?.find((driver) => driver.id === data.id));
          if (vendor) {
            return { ...data, vendor: vendor.dsoDetails };
          }
          return data;
        });
        setTableData(drivers);
        setDriverIds("");
      }
    }
    return () => {
      mounted = false;
    };
  }, [vendorData, dsoData]);

  //functions to handle search, pagination, sorting and filter
  const onSearch = (params = {}) => {
    setSearchParams({ ...params });
  };

  const fetchNextPage = () => {
    setPageOffset((prevState) => prevState + pageSize);
  };

  const fetchPrevPage = () => {
    setPageOffset((prevState) => prevState - pageSize);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
  };

  const handleFilterChange = () => {};

  const searchFields =
    tab === "VEHICLE"
      ? [
          {
            label: t("ES_VENDOR_SEARCH_VENDOR_NAME"),
            name: "vendor",
            type: "dropdown",
            options: allVendors?.map((data) => ({
              ...data.dsoDetails,
              displayName: `${data.dsoDetails.name} (${data.dsoDetails.mobileNumber || data.dsoDetails.owner?.mobileNumber || "N/A"})`,
            })),
            optionsKey: "displayName",
          },
          {
            label: t("ES_FSM_REGISTRY_SEARCH_FILLING_POINT"),
            name: "fillingPoint",
            type: "dropdown",
            options: allFillingPoints?.fillingPoints?.map((fp) => ({ ...fp, name: fp?.name || fp?.fillingPointName || fp?.fillingStationId })),
            optionsKey: "name",
          },
          {
            label: t("ES_VEHICLE_SEARCH_VEHICLE_NUMBER"),
            name: "registrationNumber",
            pattern: "[A-Z]{2}[- ]?[0-9]{2}[- ]?[A-Z]{1,2}[- ]?[0-9]{4}",
            title: t("ES_FSM_VEHICLE_FORMAT_TIP"),
          },
        ]
      : tab === "DRIVER"
      ? [
          {
            label: t("ES_VENDOR_SEARCH_VENDOR_NAME"),
            name: "vendor",
            type: "dropdown",
            options: allVendors?.map((data) => ({
              ...data.dsoDetails,
              displayName: `${data.dsoDetails.name} (${data.dsoDetails.mobileNumber || data.dsoDetails.owner?.mobileNumber || "N/A"})`,
            })),
            optionsKey: "displayName",
          },
          {
            label: t("ES_DRIVER_SEARCH_DRIVER_NAME"),
            name: "name",
          },
        ]
      : tab === "SUPERVISOR" || tab === "SURVEYOR"
      ? [
          {
            label: t("ES_VENDOR_SEARCH_VENDOR_NAME"),
            name: "vendor",
            type: "dropdown",
            options: allVendors?.map((data) => ({
              ...data.dsoDetails,
              displayName: `${data.dsoDetails.name} (${data.dsoDetails.mobileNumber || data.dsoDetails.owner?.mobileNumber || "N/A"})`,
            })),
            optionsKey: "displayName",
          },
          {
            label: tab === "SUPERVISOR" ? t("ES_SUPERVISOR_SEARCH_NAME") : t("ES_SURVEYOR_SEARCH_NAME"),
            name: "name",
          },
        ]
      : [
          {
            label: t("ES_VENDOR_SEARCH_VENDOR_NAME"),
            name: "name",
          },
        ];

  // const searchFields = [
  //   {
  //     label: t("VENDOR_SEARCH_VENDOR_NAME"),
  //     name: "name",
  //   },
  // ];

  const handleSort = useCallback((args) => {
    if (args?.length === 0) return;
    setSortParams(args);
  }, []);

  const onTabChange = (tab) => {
    setTab(tab);
  };

  const refetchData = () => {
    refetch();
  };

  const refetchVendorData = () => {
    refetchVendor();
  };

  const closeToast = () => {
    setShowToast(null);
  };

  return (
    <React.Fragment>
      {/* <Header>{t("VENDOR_SEARCH")}</Header> */}
      <div className="employee-form-content">
        <VendorInbox
          data={{ table: tableData }}
          isLoading={isLoading || isVendorLoading}
          onSort={handleSort}
          disableSort={false}
          sortParams={sortParams}
          userRole={"FSM_ADMIN"}
          onFilterChange={handleFilterChange}
          searchFields={searchFields}
          onSearch={onSearch}
          onNextPage={fetchNextPage}
          onPrevPage={fetchPrevPage}
          currentPage={Math.floor(pageOffset / pageSize)}
          pageSizeLimit={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalRecords={inboxTotalCount || 0}
          onTabChange={onTabChange}
          selectedTab={tab}
          refetchData={refetchData}
          refetchVendor={refetchVendorData}
        />
        {showToast && <Toast error={showToast.key === "error"} label={t(showToast.action)} onClose={closeToast} duration={5000} />}
      </div>
    </React.Fragment>
  );
};

export default SearchVendor;
