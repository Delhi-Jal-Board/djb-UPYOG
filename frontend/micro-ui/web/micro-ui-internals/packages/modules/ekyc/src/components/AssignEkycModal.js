import React, { useMemo, useState, useEffect } from "react";
import { Modal, Close, Table, Toast } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
const AssignEkycModal = ({ surveyor, closeModal, refetchDashboard }) => {
  const { t } = useTranslation();
  const [selectedKnos, setSelectedKnos] = useState([]);
  const [isBulkSelection, setIsBulkSelection] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({
    error: false,
    label: "",
  });
  const [filters, setFilters] = useState({
    kno: "", // search value
    pincode: "",
    zoneCode: "",
    zoneName: "",
    ward: "",
    assembly: "",
    mrkey: "",
    ekycStatus: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const { data: zroLocationsData, isLoading: isZroLoading } = Digit.Hooks.ws.useWSConfigMDMS.ZROLocation("dl.djb");
  const mappedZROLocation = useMemo(() => {
    return (zroLocationsData || []).map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [zroLocationsData]);

  const { data: egovLocationData } = Digit.Hooks.useCommonMDMS("dl.djb", "egov-location", ["TenantBoundary"]);

  const boundaryData = useMemo(() => {
    const tenantBoundary = egovLocationData?.["egov-location"]?.TenantBoundary || [];
    const revenueData = tenantBoundary.find((item) => item?.hierarchyType?.code === "REVENUE");
    const boundary = revenueData?.boundary || [];
    return Array.isArray(boundary) ? boundary : [boundary];
  }, [egovLocationData]);

  const { assemblyOptions, wardOptions } = useMemo(() => {
    const assemblies = new Map();
    const wards = new Map();

    const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

    const traverse = (node) => {
      if (!node) return;
      if (node.label === "Ward" || node.label === "WARD" || node.label === "Block" || node.label === "BLOCK") {
        const code = node.code || node.localname || node.name;
        const name = node.name || node.localname || code;
        if (code) wards.set(code, { code, name: name });
      }
      if (node.label === "Assembly Constituency" || node.label === "ASSEMBLY_CONSTITUENCY") {
        const code = node.code || node.localname || node.name;
        const name = node.name || node.localname || code;
        if (code) assemblies.set(code, { code, name: name });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    boundaries.forEach(traverse);

    return {
      assemblyOptions: Array.from(assemblies.values()).sort((a, b) => a.name.localeCompare(b.name)),
      wardOptions: Array.from(wards.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [boundaryData]);

  const structuredLocalityData = useMemo(() => {
    let localities = [];
    const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

    const extractLocalities = (node) => {
      if (!node) return;

      if (node.label === "Locality" || node.label === "LOCALITY") {
        localities.push({
          ...node,
          name: node.localname || node.name || node.code,
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => extractLocalities(child));
      }
    };

    boundaries.forEach((rootNode) => extractLocalities(rootNode));

    return localities;
  }, [boundaryData]);

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

    return Array.from(pinSet).sort();
  }, [structuredLocalityData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedFilters, filters.kno]);

  const { data: applicationData, isFetching: isLoading } = Digit.Hooks.ekyc.useEkycApplicationList(
    {
      unassignedOnly: true,
      /*
      ...(debouncedFilters.kno && {
        kno: debouncedFilters.kno,
      }),
      */
      ...(filters.kno && {
        kno: filters.kno,
      }),

      ...(debouncedFilters.ekycStatus && {
        ekycStatus: debouncedFilters.ekycStatus,
      }),

      ...(debouncedFilters.zoneName && {
        zoneName: debouncedFilters.zoneName,
      }),

      ...(debouncedFilters.assembly && {
        assembly: debouncedFilters.assembly,
      }),

      ...(debouncedFilters.ward && {
        ward: debouncedFilters.ward,
      }),

      ...(debouncedFilters.mrkey && {
        mrkey: debouncedFilters.mrkey,
      }),

      ...(debouncedFilters.pincode && {
        pincode: debouncedFilters.pincode,
      }),
    },
    {
      tenantId: "dl.djb",
      offset: currentPage * pageSize,
      limit: pageSize,
    },
    {
      keepPreviousData: true,
    }
  );

  const handleAssignmentError = (errMsg, variables) => {
    const isAlreadyAssigned =
      errMsg.toLowerCase().includes("already assigned") ||
      errMsg.toLowerCase().includes("already assign") ||
      errMsg.toLowerCase().includes("active assignment") ||
      errMsg.toLowerCase().includes("mrkey") ||
      errMsg.toLowerCase().includes("mr key") ||
      errMsg.toLowerCase().includes("kno") ||
      errMsg.toLowerCase().includes("already exists");

    if (isAlreadyAssigned) {
      const isMrKeyType = variables?.assignmentType === "MRKEY";

      if (isMrKeyType) {
        setToastData({
          error: true,
          label: t("EKYC_MR_KEY_ALREADY_ASSIGNED_WITH_ANOTHER_SURVEYOR") || "mr key is already assign with another surveyor",
        });
      } else {
        setToastData({
          error: true,
          label: t("EKYC_KNO_ALREADY_ASSIGNED_WITH_ANOTHER_SURVEYOR") || "kno is already assign with another surveyor",
        });
      }
    } else {
      setToastData({
        error: true,
        label: t(errMsg) || errMsg || t("EKYC_SOMETHING_WENT_WRONG") || "Something went wrong",
      });
    }
    setShowToast(true);
  };

  const assignmentMutation = Digit.Hooks.ekyc.useEkycAssignmentCreate({
    onSuccess: (response, variables) => {
      if (response?.error) {
        const errMsg = response?.data?.message || "";
        handleAssignmentError(errMsg, variables);
        return;
      }

      // Check for skipped assignments (e.g. 200 OK but skipped)
      if (response?.skipped && response.skipped.length > 0) {
        const reason = response.skipped[0]?.reason || "";
        handleAssignmentError(reason, variables);
        return;
      }

      setToastData({
        error: false,
        label: t("EKYC_ASSIGNMENT_SUCCESSFUL") || "Assignment successful",
      });

      setShowToast(true);

      // optional delay so user can see the success toast
      setTimeout(async () => {
        await refetchDashboard();
        closeModal();
      }, 1000);
    },

    onError: (error, variables) => {
      const errMsg = error?.data?.message || error?.response?.data?.message || "";
      handleAssignmentError(errMsg, variables);
    },
  });

  const tableData = applicationData?.consumerList || [];

  const getAssignmentPayload = () => {
    if (isBulkSelection) {
      const filterMappings = [
        { key: "ekycStatus", type: "EKYCSTATUS" },
        { key: "zoneName", type: "ZONENAME" },
        { key: "assembly", type: "ASSEMBLY" },
        { key: "ward", type: "WARD" },
        { key: "mrkey", type: "MRKEY" },
        { key: "pincode", type: "PINCODE" },
      ];

      const appliedFilter = filterMappings.find(({ key }) => debouncedFilters[key]);

      if (appliedFilter) {
        return {
          assignmentType: appliedFilter.type,
          assignmentValue: debouncedFilters[appliedFilter.key],
        };
      }
    }

    return {
      assignmentType: "KNO",
      assignmentValue: selectedKnos,
    };
  };

  const handleAssign = () => {
    const { assignmentType, assignmentValue } = getAssignmentPayload();

    assignmentMutation.mutate({
      tenantId: "dl.djb",
      surveyorId: surveyor?.owner?.uuid,
      assignmentType,
      assignmentValue,
    });
  };

  const handleSelectAll = () => {
    setIsBulkSelection(true);

    const pageKnos = tableData.map((item) => item.kno);

    const allSelected = pageKnos.length > 0 && pageKnos.every((kno) => selectedKnos.includes(kno));

    setSelectedKnos((prev) => (allSelected ? prev.filter((kno) => !pageKnos.includes(kno)) : [...new Set([...prev, ...pageKnos])]));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = useMemo(
    () => [
      {
        Header: () => (
          <input
            type="checkbox"
            checked={tableData.length > 0 && tableData.every((item) => selectedKnos.includes(item.kno))}
            onChange={handleSelectAll}
          />
        ),
        id: "selection",
        Cell: ({ row }) => {
          const kno = row.original.kno;

          return <input type="checkbox" checked={selectedKnos.includes(kno)} onChange={() => handleSelect(kno)} />;
        },
      },
      {
        Header: "KNO",
        accessor: "kno",
      },
      {
        Header: "Consumer Name",
        accessor: (row) => `${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim(),
        id: "consumerName",
      },
      {
        Header: "Zone",
        accessor: "zoneName",
      },
      {
        Header: "Pincode",
        accessor: "pincode",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span className={`status-badge ${value === "ACTIVE" ? "verified" : value === "PENDING" ? "pending" : "assigned"}`}>{value}</span>
        ),
      },
      {
        Header: "eKYC Status",
        accessor: "ekycStatus",
        Cell: ({ value }) => {
          const status = (value || "NA").toUpperCase();
          return value ? <span className={`ekyc-status-tag ${status}`}>{t(status)}</span> : "-";
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKnos, tableData]
  );

  const handleSelect = (kno) => {
    setSelectedKnos((prev) => (prev.includes(kno) ? prev.filter((item) => item !== kno) : [...prev, kno]));
  };

  return (
    <Modal
      headerBarMain={`Assign KNOs to ${surveyor?.name}`}
      headerBarEnd={<Close onClick={closeModal} />}
      actionCancelLabel="Cancel"
      actionCancelOnSubmit={closeModal}
      actionSaveLabel={`Assign ${selectedKnos.length} KNOs`}
      actionSaveOnSubmit={handleAssign}
      isDisabled={!selectedKnos?.length}
    >
      <div className="assign-knos-modal">
        {/* Filters */}
        <div className="filters-grid">
          <input className="form-control" placeholder="KNO" value={filters.kno} onChange={(e) => handleFilterChange("kno", e.target.value)} />

          <select className="form-control" value={filters.pincode} onChange={(e) => handleFilterChange("pincode", e.target.value)}>
            <option value="">Select Pincode</option>
            {fetchedPincodes.map((pin) => (
              <option key={pin} value={pin}>
                {pin}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={filters.zoneName}
            onChange={(e) => {
              const val = e.target.value;
              setFilters((prev) => ({
                ...prev,
                zoneCode: val,
                zoneName: val,
              }));
            }}
            disabled={isZroLoading}
          >
            <option value="">{isZroLoading ? "Loading ZRO Locations..." : "Select ZRO Location"}</option>
            {mappedZROLocation.map((loc) => (
              <option key={loc.code} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>

          <select className="form-control" value={filters.ward} onChange={(e) => handleFilterChange("ward", e.target.value)}>
            <option value="">Select Ward</option>
            {wardOptions.map((ward) => (
              <option key={ward.code} value={ward.name}>
                {ward.name}
              </option>
            ))}
          </select>

          <select className="form-control" value={filters.assembly} onChange={(e) => handleFilterChange("assembly", e.target.value)}>
            <option value="">Select Assembly</option>
            {assemblyOptions.map((assembly) => (
              <option key={assembly.code} value={assembly.name}>
                {assembly.name}
              </option>
            ))}
          </select>

          <input className="form-control" placeholder="MR Key" value={filters.mrkey} onChange={(e) => handleFilterChange("mrkey", e.target.value)} />

          {selectedKnos.length > 0 && (
            <button className="clear-selected-btn" type="button" onClick={() => setSelectedKnos([])}>
              {t("EKYC_CLEAR_SELECTION") || `Clear Selected (${selectedKnos.length})`}
            </button>
          )}

          {/* <select className="form-control" value={filters.ekycStatus} onChange={(e) => handleFilterChange("ekycStatus", e.target.value)}>
            <option value="">All eKYC Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select> */}
        </div>

        {/* Table */}
        <Table
          tableTitle="eKYC Applications"
          tableClass="ekycTable"
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          totalRecords={applicationData?.totalCount || 0}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          manualPagination={true}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < (applicationData?.totalPages || 1) - 1) {
              setCurrentPage((prev) => prev + 1);
            }
          }}
          onPrevPage={() => {
            if (currentPage > 0) {
              setCurrentPage((prev) => prev - 1);
            }
          }}
          onFirstPage={() => {
            setCurrentPage(0);
          }}
          onLastPage={() => {
            setCurrentPage(Math.max((applicationData?.totalPages || 1) - 1, 0));
          }}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </div>
      {showToast && <Toast error={toastData.error} label={toastData.label} onClose={() => setShowToast(false)} />}
    </Modal>
  );
};

export default AssignEkycModal;
