import React, { useState } from "react";
import { Card, Menu, AddIcon, TextInput, Dropdown, Label, SubmitBar, Toast, ToggleSwitch } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, Link, useLocation } from "react-router-dom";
import LocalityModal from "./LocalityModal";
import ApplicationTable from "./inbox/ApplicationTable";
import PointAddressMap from "./PointAddressMap";

const SearchFillingPointAddress = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "FILLING_POINT";
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [status, setStatus] = useState(null);
  const [fixedPointStatus, setFixedPointStatus] = useState(null);
  const [appliedFixedPointStatus, setAppliedFixedPointStatus] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [selectedFillingPoint, setSelectedFillingPoint] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLocalityModal, setShowLocalityModal] = useState(false);
  const [selectedLocalityRow, setSelectedLocalityRow] = useState(null);
  const [modalMode, setModalMode] = useState("ADD"); // ADD, UPDATE, VIEW
  const [pageSize, setPageSize] = useState(50);
  const [pageOffset, setPageOffset] = useState(0);
  const [fillingPointStatusOverrides, setFillingPointStatusOverrides] = useState({});
  const [updatingFillingPointIds, setUpdatingFillingPointIds] = useState({});

  const tenantId = Digit.ULBService.getCurrentTenantId();

  const closeToast = () => {
    setToast(null);
  };

  // ✅ Hooks for Search
  const { isLoading: isFixedLoading, data: fixedPointData, refetch: refetchFixed } = Digit.Hooks.wt.useFixedPointSearchAPI(
    {
      tenantId,
      filters: { ...searchParams, offset: pageOffset, limit: pageSize },
    },
    { enabled: selectedTab === "FIXED_POINT" }
  );

  const { isLoading: isFillingLoading, data: fillingPointData, refetch: refetchFilling } = Digit.Hooks.wt.useFillPointSearch(
    {
      tenantId,
      filters: { ...searchParams, offset: pageOffset, limit: pageSize },
    },
    { enabled: selectedTab === "FILLING_POINT" }
  );

  // ✅ Hook to fetch all filling points for mapping dropdown
  const { isLoading: isAllFillingPointsLoading, data: allFillingPointsData } = Digit.Hooks.wt.useFillPointSearch(
    {
      tenantId,
      filters: { limit: 1000 },
    },
    { enabled: true }
  );

  const allFillingPoints = allFillingPointsData?.fillingPoints || [];

  // ✅ Hook to fetch all fixed points for mapping dropdown
  const { isLoading: isAllFixedPointsLoading, data: allFixedPointsData } = Digit.Hooks.wt.useFixedPointSearchAPI(
    {
      tenantId,
      filters: { limit: 1000 },
    },
    { enabled: true }
  );

  const allFixedPoints = allFixedPointsData?.waterTankerBookingDetail || [];

  // ✅ Hook for Mapping
  const { mutate: mapFixedFilling } = Digit.Hooks.wt.useVendorFillingMapping(tenantId);
  const { mutate: updateFillingPoint } = Digit.Hooks.wt.useUpdateFillPoint(tenantId);

  const isLoading = selectedTab === "FIXED_POINT" ? isFixedLoading : isFillingLoading;
  const tableData = React.useMemo(() => {
    let data = (selectedTab === "FIXED_POINT" ? fixedPointData?.waterTankerBookingDetail : fillingPointData?.fillingPoints) || [];

    if (selectedTab === "FIXED_POINT" && appliedFixedPointStatus?.code) {
      data = data.filter((item) => {
        const isMapped =
          item.fillingPointId ||
          item.fillingpointmetadata?.fillingPointId ||
          item.fillingPtName ||
          item.filling_pt_name ||
          (item.fillingPoint && typeof item.fillingPoint === "object" ? item.fillingPoint?.id : item.fillingPoint) ||
          item.fillingPointDetail?.id ||
          item.fillingPointDetail?.bookingId;

        if (appliedFixedPointStatus.code === "MAPPED") return !!isMapped;
        if (appliedFixedPointStatus.code === "UNMAPPED") return !isMapped;
        return true;
      });
    }
    return data;
  }, [fixedPointData, fillingPointData, selectedTab, appliedFixedPointStatus]);

  // ✅ Dynamic config
  const searchConfig = {
    FIXED_POINT: {
      label: "WT_FIXING_POINT_APPLICANT_DETAILS",
      placeholder: "WT_ENTER_FIXED_POINT_NAME",
    },
    FILLING_POINT: {
      label: "WT_FILLING_POINT_NAME",
      placeholder: "WT_ENTER_FILLING_POINT_NAME",
    },
    VIEW_ON_MAP: {
      label: "WT_VIEW_ON_MAP",
      placeholder: "",
    },
  };

  const statusOptions = [
    { i18nKey: "WT_FILLING_POINT_DESIGNATION_AE", code: "DESIGNATION_AE" },
    { i18nKey: "WT_FILLING_POINT_DESIGNATION_JE", code: "DESIGNATION_JE" },
    { i18nKey: "WT_FILLING_POINT_DESIGNATION_EE", code: "DESIGNATION_EE" },
  ];

  const FixedPointStatus = [
    { i18nKey: "WT_FIXED_POINT_MAPPED", code: "MAPPED" },
    { i18nKey: "WT_FIXED_POINT_UNMAPPED", code: "UNMAPPED" },
  ];

  const { label, placeholder } = searchConfig[selectedTab];

  // ✅ Handlers
  const clearSearch = () => {
    setSearchValue("");
    setMobileNumber("");
    setStatus(null);
    setFixedPointStatus(null);
    setAppliedFixedPointStatus(null);
    setSelectedFillingPoint(null);
    setSearchParams({});
  };

  const onTabChange = (tab) => {
    setSelectedTab(tab);
    clearSearch();
    setPageOffset(0);
    // Re-trigger search with empty filters for the new tab
    setSearchParams({});
  };

  const onAddClick = () => {
    setShowAddMenu((prev) => !prev);
  };

  const onActionSelect = (option) => {
    if (option === "FILLING_POINT") {
      history.push(`/digit-ui/employee/wt/add-filling-point-address`);
    } else if (option === "FIXED_POINT") {
      history.push(`/digit-ui/employee/wt/add-fix-point-address`);
    }
    setShowAddMenu(false);
  };

  const onSearch = () => {
    const filters = {
      ...(selectedTab === "FILLING_POINT" ? { fillingPointName: searchValue } : { name: searchValue }),
      mobileNumber: mobileNumber,
      status: selectedTab === "FILLING_POINT" ? status?.code : null,
      fillingPointId:
        selectedFillingPoint?.id || selectedFillingPoint?.bookingId || selectedFillingPoint?.fillingPointId || selectedFillingPoint?.uuid,
    };
    setAppliedFixedPointStatus(fixedPointStatus);
    setSearchParams(filters);
    setPageOffset(0);
  };

  const onFillingPointSelect = (row, value) => {
    const payload = {
      fixedFillingPointMapping: {
        fixed_pt_name: row.original.applicantDetail?.applicantId,
        filling_pt_name: value.id || value.bookingId || value.fillingPointId || value.uuid || value.fillingpointmetadata?.fillingPointId,
      },
    };

    mapFixedFilling(payload, {
      onSuccess: () => {
        setToast({ label: t("WT_FIXED_FILLING_MAPPING_SUCCESS") });
        setTimeout(closeToast, 5000);
        refetchFixed();
      },
      onError: (err) => {
        setToast({
          label: err?.response?.data?.Errors?.[0]?.message || t("WT_FIXED_FILLING_MAPPING_FAIL"),
          error: true,
        });
        setTimeout(closeToast, 5000);
      },
    });
  };

  const getFillingPointRowId = (row) => row?.id || row?.bookingId || row?.fillingPointId || row?.uuid;

  const getFillingPointStatus = (row) => {
    const rowId = getFillingPointRowId(row);
    if (rowId && Object.prototype.hasOwnProperty.call(fillingPointStatusOverrides, rowId)) {
      return fillingPointStatusOverrides[rowId];
    }
    return row?.status === true || row?.status === "true" || row?.status === "ACTIVE";
  };

  const buildFillingPointStatusPayload = (row, status) => ({
    RequestInfo: {
      userInfo: {
        uuid: Digit.UserService.getUser()?.info?.uuid || "user-123",
      },
    },
    fillingPoints: [
      {
        id: row?.id,
        bookingId: row?.bookingId,
        fillingPointId: row?.fillingPointId,
        tenantId: row?.tenantId || tenantId,
        fillingPointName: row?.fillingPointName,
        emergencyName: row?.emergencyName,
        eeName: row?.eeName,
        eeEmail: row?.eeEmail,
        eeMobile: row?.eeMobile,
        aeName: row?.aeName,
        aeEmail: row?.aeEmail,
        aeMobile: row?.aeMobile,
        jeName: row?.jeName,
        jeEmail: row?.jeEmail,
        jeMobile: row?.jeMobile,
        fillingPointLocalityCodes: row?.fillingPointLocalityCodes,
        status,
        address: row?.address
          ? {
              addressId: row.address.addressId,
              applicantId: row.address.applicantId,
              doorNo: row.address.doorNo,
              houseNo: row.address.houseNo,
              streetName: row.address.streetName,
              addressLine1: row.address.addressLine1,
              addressLine2: row.address.addressLine2,
              landmark: row.address.landmark,
              city: row.address.city,
              cityCode: row.address.cityCode,
              locality: row.address.locality,
              localityCode: row.address.localityCode,
              pincode: row.address.pincode,
              latitude: row.address.latitude,
              longitude: row.address.longitude,
              ward: row.address.ward,
              zone: row.address.zone,
              constituency: row.address.constituency,
              type: row.address.type || "FILLING-POINT",
              addressType: row.address.addressType,
            }
          : undefined,
      },
    ],
  });

  const onFillingPointStatusToggle = (row) => {
    const fillingPoint = row.original;
    const rowId = getFillingPointRowId(fillingPoint);
    const nextStatus = !getFillingPointStatus(fillingPoint);

    if (!rowId || updatingFillingPointIds[rowId]) return;

    setFillingPointStatusOverrides((prev) => ({ ...prev, [rowId]: nextStatus }));
    setUpdatingFillingPointIds((prev) => ({ ...prev, [rowId]: true }));

    updateFillingPoint(buildFillingPointStatusPayload(fillingPoint, nextStatus), {
      onSuccess: () => {
        setToast({ label: t(nextStatus ? "WT_FILLING_POINT_ENABLED_SUCCESS" : "WT_FILLING_POINT_DISABLED_SUCCESS", nextStatus ? "Filling point enabled successfully" : "Filling point disabled successfully") });
        setTimeout(closeToast, 5000);
        refetchFilling();
      },
      onError: (err) => {
        setFillingPointStatusOverrides((prev) => ({ ...prev, [rowId]: !nextStatus }));
        setToast({
          label: err?.response?.data?.Errors?.[0]?.message || t("WT_FILLING_POINT_STATUS_UPDATE_ERROR", "Unable to update filling point status"),
          error: true,
        });
        setTimeout(closeToast, 5000);
      },
      onSettled: () => {
        setUpdatingFillingPointIds((prev) => ({ ...prev, [rowId]: false }));
      },
    });
  };

  const handleLocalityAdd = (row, mode = "ADD") => {
    setSelectedLocalityRow(row.original);
    setModalMode(mode);
    setShowLocalityModal(true);
  };

  // ✅ Hooks for Locality Linking
  const { mutate: linkLocality } = Digit.Hooks.wt.useLinkFillingPointLocality(tenantId);
  const { mutate: updateLocality } = Digit.Hooks.wt.useUpdateFillingPointLocality(tenantId);

  const onLocalityModalSubmit = (data) => {
    const payload = {
      FillingPointLocality: data.locality
        .filter((loc) => loc.code)
        .map((loc) => ({
          fillingPointId: selectedLocalityRow.bookingId || selectedLocalityRow.id,
          localityCode: loc.code,
        })),
    };

    const mutation = modalMode === "UPDATE" ? updateLocality : linkLocality;

    mutation(payload, {
      onSuccess: () => {
        setToast({ label: t(modalMode === "UPDATE" ? "WT_LOCALITY_UPDATE_SUCCESS" : "WT_LOCALITY_LINKING_SUCCESS") });
        setShowLocalityModal(false);
        setTimeout(closeToast, 5000);
        if (selectedTab === "FIXED_POINT") refetchFixed();
        else refetchFilling();
      },
      onError: (err) => {
        setToast({
          label: err?.response?.data?.Errors?.[0]?.message || t("WT_LOCALITY_LINKING_FAIL"),
          error: true,
        });
        setTimeout(closeToast, 5000);
      },
    });
  };

  const getLocalityTranslation = (localityCode, tenantId, t) => {
  if (!localityCode) return "";
  const tenant = tenantId || Digit.ULBService.getCurrentTenantId() || "djb";
  const prefix = tenant.replace(".", "_").toUpperCase();
  return t(`${prefix}_REVENUE_${localityCode}`);
  
};
  const columns = React.useMemo(() => {
    if (selectedTab === "FIXED_POINT") {
      return [
        {
          Header: t("WT_FIXED_POINT_CODE"),
          accessor: (row) => row?.applicantDetail?.fixedPointId || "NA",
          id: "fixedPointId",
        },
        {
          Header: t("WT_FIXING_POINT_APPLICANT_DETAILS"),
          accessor: (row) => row?.applicantDetail?.name || "NA",
          id: "applicantName",
          Cell: ({ row }) => (
            <span className="link">
              <Link to={`/digit-ui/employee/wt/add-fix-point-address?id=${row.original.applicantDetail?.applicantId}`}>
                {row.original.applicantDetail?.name || "NA"}
              </Link>
            </span>
          ),
        },
        {
          Header: t("WT_MOBILE_NUMBER"),
          accessor: (row) => row?.applicantDetail?.mobileNumber || "NA",
          id: "mobileNumber",
        },
        {
          Header: t("WT_LOCALITY"),
          accessor: (row) => getLocalityTranslation(row?.address?.locality, tenantId, t) || "NA",
          id: "locality",
        },
        {
          Header: t("WT_LATITUDE"),
          accessor: (row) => row?.address?.latitude || "NA",
          id: "latitude",
        },
        {
          Header: t("WT_LONGITUDE"),
          accessor: (row) => row?.address?.longitude || "NA",
          id: "longitude",
        },

        {
          Header: t("WT_FILLING_POINT"),
          accessor: (row) =>
            row?.fillingPointId ||
            row?.fillingpointmetadata?.fillingPointId ||
            row?.fillingPtName ||
            row?.filling_pt_name ||
            row?.fillingPoint ||
            "NA",
          id: "fillingPoint",
          minWidth: 250,
          Cell: ({ row }) => {
            const rowFpId = String(
              row.original.fillingPointId ||
                row.original.fillingpointmetadata?.fillingPointId ||
                row.original.fillingPtName ||
                row.original.filling_pt_name ||
                (row.original.fillingPoint && typeof row.original.fillingPoint === "object"
                  ? row.original.fillingPoint?.id
                  : row.original.fillingPoint) ||
                row.original.fillingPointDetail?.id ||
                row.original.fillingPointDetail?.bookingId ||
                ""
            );

            const selectedOption = allFillingPoints?.find((fp) => {
              const fpId = String(fp.id || fp.bookingId || fp.fillingPointId || fp.uuid || fp.fillingpointmetadata?.fillingPointId);
              return fpId === rowFpId && rowFpId !== "undefined" && rowFpId !== "null" && rowFpId !== "";
            });

            return (
              <Dropdown
                className="fsm-registry-dropdown"
                selected={selectedOption}
                option={allFillingPoints}
                select={(value) => onFillingPointSelect(row, value)}
                style={{ textAlign: "left", width: "100%", minWidth: "250px" }}
                optionKey="fillingPointName"
                t={t}
              />
            );
          },
        },
      ];
    } else {
      return [
        {
          Header: t("WT_FILLING_POINT_CODE"),
          accessor: (row) => row?.fillingPointId || "NA",
          id: "fillingPointId",
        },
        {
          Header: t("WT_FILLING_POINT_NAME"),
          accessor: (row) => row?.fillingPointName || "NA",
          id: "fillingPointName",
          Cell: ({ row }) => (
            <span className="link">
              <Link to={`/digit-ui/employee/wt/add-filling-point-address?id=${row.original.id}`}>{row.original.fillingPointName || "NA"}</Link>
            </span>
          ),
        },
        {
          Header: t("WT_AE_NAME"),
          accessor: (row) => row?.aeName || "NA",
          id: "aeName",
        },
        {
          Header: t("WT_JE_NAME"),
          accessor: (row) => row?.jeName || "NA",
          id: "jeName",
        },
        {
          Header: t("WT_EE_NAME"),
          accessor: (row) => row?.eeName || "NA",
          id: "eeName",
        },
        {
          Header: t("WT_LOCALITY"),
          // accessor: (row) => row?.address?.locality || "NA",
          Cell: ({ row }) => {
            const codes =
              row.original?.fillingPointLocalityCodes?.length > 0
                ? row.original.fillingPointLocalityCodes
                : row.original?.address?.locality
                ? [row.original.address.locality]
                : [];
            const translated = codes.length > 0
              ? codes.map((code) => getLocalityTranslation(code, tenantId, t)).join(", ")
              : "NA";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{translated}</span>
              </div>
            );
          },
        },
        {
          Header: t("WT_ADD_LOCALITY"),
          Cell: ({ row }) => {
            const hasLocality =
              row.original?.fillingPointLocalityCodes?.length > 0 || (row.original?.address?.locality && row.original?.address?.locality !== "NA");
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!hasLocality ? (
                  <button
                    onClick={() => handleLocalityAdd(row, "ADD")}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#f4f4f4",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "4px 8px",
                    }}
                  >
                    <AddIcon styles={{ width: "16px", height: "16px" }} fill="#1D4E7F" />
                    {t("CS_COMMON_ADD")}
                  </button>
                ) : (
                  <React.Fragment>
                    <button
                      onClick={() => handleLocalityAdd(row, "VIEW")}
                      style={{
                        cursor: "pointer",
                        background: "#fff",
                        border: "1px solid #1D4E7F",
                        color: "#1D4E7F",
                        borderRadius: "4px",
                        padding: "4px 12px",
                      }}
                    >
                      {t("CS_COMMON_VIEW")}
                    </button>
                    <button
                      onClick={() => handleLocalityAdd(row, "UPDATE")}
                      style={{
                        cursor: "pointer",
                        background: "#1D4E7F",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 12px",
                      }}
                    >
                      {t("CS_COMMON_UPDATE")}
                    </button>
                  </React.Fragment>
                )}
              </div>
            );
          },
        },
        {
          Header: t("WT_ENABLE_DISABLE", "Enable/Disable"),
          id: "status",
          disableSortBy: true,
          Cell: ({ row }) => {
            const rowId = getFillingPointRowId(row.original);
            const isUpdating = rowId && updatingFillingPointIds[rowId];
            return (
              <ToggleSwitch
                style={{
                  display: "flex",
                  justifyContent: "left",
                  opacity: isUpdating ? 0.6 : 1,
                  pointerEvents: isUpdating ? "none" : "auto",
                }}
                value={getFillingPointStatus(row.original)}
                onChange={() => onFillingPointStatusToggle(row)}
                name={`filling-point-status-${rowId || row.id}`}
              />
            );
          },
        },
      ];
    }
  }, [allFillingPoints, fillingPointStatusOverrides, selectedTab, t, updatingFillingPointIds]);

  const isMobile = window.Digit.Utils.browser.isMobile();

  const fetchNextPage = () => {
    setPageOffset((prevState) => prevState + pageSize);
  };

  const fetchPrevPage = () => {
    setPageOffset((prevState) => prevState - pageSize);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
  };

  const totalCount = Number(
    selectedTab === "FIXED_POINT"
      ? fixedPointData?.Count ?? fixedPointData?.count ?? fixedPointData?.totalCount ?? 0
      : fillingPointData?.Count ?? fillingPointData?.count ?? fillingPointData?.totalCount ?? 0
  );

  const applyFixedPointMappedFilter = React.useCallback(
    (rows = []) => {
      if (selectedTab !== "FIXED_POINT" || !appliedFixedPointStatus?.code) return rows;

      return rows.filter((item) => {
        const isMapped =
          item.fillingPointId ||
          item.fillingpointmetadata?.fillingPointId ||
          item.fillingPtName ||
          item.filling_pt_name ||
          (item.fillingPoint && typeof item.fillingPoint === "object" ? item.fillingPoint?.id : item.fillingPoint) ||
          item.fillingPointDetail?.id ||
          item.fillingPointDetail?.bookingId;

        if (appliedFixedPointStatus.code === "MAPPED") return !!isMapped;
        if (appliedFixedPointStatus.code === "UNMAPPED") return !isMapped;
        return true;
      });
    },
    [appliedFixedPointStatus, selectedTab]
  );

  const getCSVExportData = React.useCallback(async () => {
    const batchSize = 200;
    let offset = 0;
    let totalCount = Number.POSITIVE_INFINITY;
    const rows = [];

    while (offset < totalCount) {
      const response =
        selectedTab === "FIXED_POINT"
          ? await Digit.WTService.SearchFixedPoint({
              tenantId,
              filters: { ...searchParams, offset, limit: batchSize },
            })
          : await Digit.WTService.SearchFillPoint({
              tenantId,
              filters: { ...searchParams, offset, limit: batchSize },
            });

      const pageRows = selectedTab === "FIXED_POINT" ? response?.waterTankerBookingDetail || [] : response?.fillingPoints || [];

      rows.push(...pageRows);

      const resolvedTotal = Number(response?.Count ?? response?.count ?? response?.totalCount);
      totalCount = Number.isFinite(resolvedTotal) && resolvedTotal >= 0 ? resolvedTotal : rows.length;

      if (!pageRows.length) {
        break;
      }
      offset += pageRows.length;
    }

    return applyFixedPointMappedFilter(rows);
  }, [applyFixedPointMappedFilter, searchParams, selectedTab, tenantId]);

  const csvExportColumns = React.useMemo(() => {
    if (selectedTab === "FIXED_POINT") {
      return [
        {
          Header: t("WT_FIXED_POINT_CODE"),
          exportAccessor: (row) => row?.applicantDetail?.fixedPointId || "NA",
        },
        {
          Header: t("WT_APPLICANT_NAME"),
          exportAccessor: (row) => row?.applicantDetail?.name || "NA",
        },
        {
          Header: t("WT_MOBILE_NUMBER"),
          exportAccessor: (row) => row?.applicantDetail?.mobileNumber || "NA",
        },
        {
          Header: t("WT_LOCALITY"),
          exportAccessor: (row) => getLocalityTranslation(row?.address?.locality, tenantId, t) || "NA",
        },
        {
          Header: t("WT_LATITUDE"),
          exportAccessor: (row) => row?.address?.latitude || "NA",
        },
        {
          Header: t("WT_LONGITUDE"),
          exportAccessor: (row) => row?.address?.longitude || "NA",
        },
        {
          Header: t("WT_FILLING_POINT"),
          exportAccessor: (row) => {
            const rowFpId = String(
              row?.fillingPointId ||
                row?.fillingpointmetadata?.fillingPointId ||
                row?.fillingPtName ||
                row?.filling_pt_name ||
                (row?.fillingPoint && typeof row.fillingPoint === "object" ? row.fillingPoint?.id : row?.fillingPoint) ||
                row?.fillingPointDetail?.id ||
                row?.fillingPointDetail?.bookingId ||
                ""
            );

            const found = allFillingPoints?.find((fp) => {
              const fpId = String(fp.id || fp.bookingId || fp.fillingPointId || fp.uuid || fp.fillingpointmetadata?.fillingPointId);
              return fpId === rowFpId && rowFpId !== "undefined" && rowFpId !== "null" && rowFpId !== "";
            });

            const name =
              found?.fillingPointName ||
              row?.fillingPointName ||
              row?.fillingPoint?.fillingPointName ||
              row?.fillingpointmetadata?.fillingPointName ||
              row?.fillingPtName ||
              row?.filling_pt_name;

            return name && name !== "undefined" && name !== "null" ? name : rowFpId && rowFpId !== "undefined" && rowFpId !== "null" ? rowFpId : "NA";
          },
        },
      ];
    }

    return [
      {
        Header: t("WT_FILLING_POINT_CODE"),
        exportAccessor: (row) => row?.fillingPointId || "NA",
      },
      {
        Header: t("WT_FILLING_POINT_NAME"),
        exportAccessor: (row) => row?.fillingPointName || "NA",
      },
      {
        Header: t("WT_AE_NAME"),
        exportAccessor: (row) => row?.aeName || "NA",
      },
      {
        Header: t("WT_AE_MOBILE"),
        exportAccessor: (row) => row?.aeMobile || "NA",
      },
      {
        Header: t("WT_AE_EMAIL"),
        exportAccessor: (row) => row?.aeEmail || "NA",
      },
      {
        Header: t("WT_JE_NAME"),
        exportAccessor: (row) => row?.jeName || "NA",
      },
      {
        Header: t("WT_JE_MOBILE"),
        exportAccessor: (row) => row?.jeMobile || "NA",
      },
      {
        Header: t("WT_JE_EMAIL"),
        exportAccessor: (row) => row?.jeEmail || "NA",
      },
      {
        Header: t("WT_EE_NAME"),
        exportAccessor: (row) => row?.eeName || "NA",
      },
      {
        Header: t("WT_EE_MOBILE"),
        exportAccessor: (row) => row?.eeMobile || "NA",
      },
      {
        Header: t("WT_EE_EMAIL"),
        exportAccessor: (row) => row?.eeEmail || "NA",
      },
      {
        Header: t("WT_LOCALITY"),
        exportAccessor: (row) => {
          const codes =
            row?.fillingPointLocalityCodes?.length > 0
              ? row.fillingPointLocalityCodes
              : row?.address?.locality
              ? [row.address.locality]
              : [];
          return codes.length > 0
            ? codes.map((code) => getLocalityTranslation(code, tenantId, t)).join(", ")
            : "NA";
        },
      },
    ];
  }, [selectedTab, t]);

  return (
    <React.Fragment>
      <Card>
        {/* 🔹 Tabs + Add */}
        <div className="search-tabs-container" style={{ flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "0" }}>
          <div>
            <button
              className={selectedTab === "FILLING_POINT" ? "search-tab-head-selected" : "search-tab-head"}
              onClick={() => onTabChange("FILLING_POINT")}
              style={{ width: isMobile ? "50%" : "auto" }}
            >
              {t("WT_FILLING_POINT")}
            </button>
            <button
              className={selectedTab === "FIXED_POINT" ? "search-tab-head-selected" : "search-tab-head"}
              onClick={() => onTabChange("FIXED_POINT")}
              style={{ width: isMobile ? "50%" : "auto" }}
            >
              {t("WT_FIXED_POINT")}
            </button>

            

            <button
              className={selectedTab === "VIEW_ON_MAP" ? "search-tab-head-selected" : "search-tab-head"}
              onClick={() => onTabChange("VIEW_ON_MAP")}
              style={{ width: isMobile ? "50%" : "auto" }}
            >
              {t("WT_VIEW_ON_MAP")}
            </button>
          </div>

          <div className="action-bar-wrap-registry" style={{ alignSelf: isMobile ? "flex-end" : "auto" }}>
            <div className="search-add" onClick={onAddClick}>
              {t("ES_VENDOR_REGISTRY_INBOX_HEADER_ADD")}
              <div className="search-add-icon">
                <AddIcon />
              </div>
            </div>

            {showAddMenu && (
              <Menu localeKeyPrefix={"ES_FSM_ACTION_CREATE"} options={["FIXED_POINT", "FILLING_POINT"]} t={t} onSelect={onActionSelect} />
            )}
          </div>
        </div>

        {/* 🔥 Search Section (same card) */}
        {selectedTab !== "VIEW_ON_MAP" && (
          <div className="finance-mainlayout">
            <div className="finance-mainlayout-col1">
              <Label>{t(label)}</Label>
              <TextInput value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={t(placeholder)} />
            </div>

            <div className="finance-mainlayout-col1">
              <Label>{t("WT_MOBILE_NUMBER")}</Label>
              <TextInput
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={t("WT_ENTER_MOBILE_NUMBER")}
                validation={{
                  pattern: /^[6-9]\d{9}$/,
                }}
              />
            </div>

            {selectedTab === "FIXED_POINT" && (
              <div className="finance-mainlayout-col1">
                <Label>{t("WT_FIXED_POINT_STATUS")}</Label>
                <Dropdown option={FixedPointStatus} optionKey="i18nKey" selected={fixedPointStatus} select={setFixedPointStatus} t={t} />
              </div>
            )}

            {selectedTab === "FIXED_POINT" && (
              <div className="finance-mainlayout-col1">
                <Label>{t("WT_FILLING_POINT")}</Label>
                <Dropdown
                  option={allFillingPoints}
                  optionKey="fillingPointName"
                  selected={selectedFillingPoint}
                  select={setSelectedFillingPoint}
                  t={t}
                  placeholder={t("ES_COMMON_STATUS")}
                />
              </div>
            )}

            {selectedTab === "FILLING_POINT" && (
              <div className="finance-mainlayout-col1">
                <Label>{t("WT_FILLING_POINT_DESIGNATION")}</Label>
                <Dropdown option={statusOptions} optionKey="i18nKey" selected={status} select={setStatus} t={t} placeholder={t("ES_COMMON_STATUS")} />
              </div>
            )}

            <div className="finance-mainlayout-col1">
              <Label>&nbsp;</Label>
              <span className="generic-button clear-search" onClick={clearSearch} style={{ alignSelf: "center" }}>
                {t("ES_COMMON_CLEAR_SEARCH")}
              </span>
            </div>
            <div className="finance-mainlayout-col1">
              <Label>&nbsp;</Label>
              <SubmitBar label={t("ES_COMMON_SEARCH")} onSubmit={onSearch} />
            </div>
          </div>
        )}
      </Card>

      {/* 🔹 Table or Map */}
      {selectedTab === "VIEW_ON_MAP" ? (
        <Card>
          <PointAddressMap
            fillingPoints={allFillingPoints}
            fixedPoints={allFixedPoints}
            isLoading={isAllFillingPointsLoading || isAllFixedPointsLoading}
            t={t}
          />
        </Card>
      ) : (
        <Card>
          <ApplicationTable
            key={allFillingPoints?.length > 0 ? "loaded" : "loading"}
            data={tableData}
            columns={columns}
            pageSize={pageSize}
            getCellProps={() => ({
              style: {
                padding: "20px 18px",
                fontSize: "16px",
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              },
            })}
            styles={{ width: "1200px", minWidth: "1200px", tableLayout: "fixed" }}
            inboxStyles={{ overflowX: "auto" }}
            t={t}
            isLoading={isLoading || isAllFillingPointsLoading}
            onPageSizeChange={handlePageSizeChange}
            currentPage={Math.floor(pageOffset / pageSize)}
            onNextPage={fetchNextPage}
            onPrevPage={fetchPrevPage}
            pageSizeLimit={pageSize}
            totalRecords={totalCount}
            isPaginationRequired={true}
            showPagination={true}
            showPageSizeOptions={true}
            isSearchRequired={false}
            isDownloadRequired={true}
            isFilterRequired={true}
            isSortRequired={true}
            showCSVExport={true}
            getCSVExportData={getCSVExportData}
            csvExportColumns={csvExportColumns}
            csvExportFileName={`wt-${selectedTab === "FIXED_POINT" ? "fixed-point" : "filling-point"}-search`}
          />
        </Card>
      )}
      {toast && <Toast error={toast.error} label={toast.label} onClose={closeToast} />}
      {showLocalityModal && (
        <LocalityModal
          t={t}
          closeModal={() => setShowLocalityModal(false)}
          onSubmit={onLocalityModalSubmit}
          initialValues={selectedLocalityRow}
          tenantId={tenantId}
          modalMode={modalMode}
        />
      )}
    </React.Fragment>
  );
};

export default SearchFillingPointAddress;
