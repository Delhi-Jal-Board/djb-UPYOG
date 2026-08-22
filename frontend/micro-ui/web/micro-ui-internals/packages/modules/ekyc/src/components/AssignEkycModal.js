import React, { useMemo, useState, useEffect } from "react";
import { Modal, Close, Table, Toast } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
const AssignEkycModal = ({ surveyor, isReassign, closeModal, refetchDashboard, tenantId: propsTenantId }) => {
  const { t } = useTranslation();
  const tenantId = propsTenantId || Digit.ULBService.getCurrentTenantId();
  const [selectedKnos, setSelectedKnos] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
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

  // const { data: zroLocationsData, isLoading: isZroLoading } = Digit.Hooks.ws.useWSConfigMDMS.ZROLocation(tenantId);
  // const mappedZROLocation = useMemo(() => {
  //   return (zroLocationsData || []).map((item) => ({
  //     code: item.code,
  //     name: item.name,
  //   }));
  // }, [zroLocationsData]);

  const { data: egovLocationData } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  const boundaryData = useMemo(() => {
    const tenantBoundary = egovLocationData?.["egov-location"]?.TenantBoundary || [];
    const revenueData = tenantBoundary.find((item) => item?.hierarchyType?.code === "REVENUE");
    const boundary = revenueData?.boundary || [];
    return Array.isArray(boundary) ? boundary : [boundary];
  }, [egovLocationData]);

  // const { assemblyOptions, wardOptions } = useMemo(() => {
  //   const assemblies = new Map();
  //   const wards = new Map();

  //   const boundaries = Array.isArray(boundaryData) ? boundaryData : boundaryData ? [boundaryData] : [];

  //   const traverse = (node) => {
  //     if (!node) return;
  //     if (node.label === "Ward" || node.label === "WARD" || node.label === "Block" || node.label === "BLOCK") {
  //       const code = node.code || node.localname || node.name;
  //       const name = node.name || node.localname || code;
  //       if (code) wards.set(code, { code, name: name });
  //     }
  //     if (node.label === "Assembly Constituency" || node.label === "ASSEMBLY_CONSTITUENCY") {
  //       const code = node.code || node.localname || node.name;
  //       const name = node.name || node.localname || code;
  //       if (code) assemblies.set(code, { code, name: name });
  //     }
  //     if (node.children && node.children.length > 0) {
  //       node.children.forEach(traverse);
  //     }
  //   };

  //   boundaries.forEach(traverse);

  //   return {
  //     assemblyOptions: Array.from(assemblies.values()).sort((a, b) => a.name.localeCompare(b.name)),
  //     wardOptions: Array.from(wards.values()).sort((a, b) => a.name.localeCompare(b.name)),
  //   };
  // }, [boundaryData]);

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

  const { data: filterOptionsData } = Digit.Hooks.ekyc.useEkycApplicationList(
    {
      unassignedOnly: !isReassign,
      fetchFilterOptions: true,
    },
    {
      tenantId: tenantId,
      offset: 0,
      limit: 1000,
    },
    {
      staleTime: Infinity,
    }
  );

  const pincodeOptions = useMemo(() => {
    if (!filterOptionsData) return fetchedPincodes || [];
    const pins = filterOptionsData.pincodeOptions || [];
    return Array.isArray(pins) ? pins.filter(Boolean).map(String).sort() : [];
  }, [filterOptionsData, fetchedPincodes]);

  const mrkeyOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    const keys = filterOptionsData.mrkeyOptions || [];
    return Array.isArray(keys) ? keys.filter(Boolean).map(String).sort() : [];
  }, [filterOptionsData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedFilters, filters.kno]);

  const { data: applicationData, isFetching: isLoading, refetch: refetchApplicationList } = Digit.Hooks.ekyc.useEkycApplicationList(
    {
      unassignedOnly: !isReassign,
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
      tenantId: tenantId,
      offset: 0,
      limit: 5000,
    },
    {
      keepPreviousData: true,
    }
  );

  const handleAssignmentError = (errMsg) => {
    const isAlreadyAssigned =
      errMsg.toLowerCase().includes("already assigned") ||
      errMsg.toLowerCase().includes("already assign") ||
      errMsg.toLowerCase().includes("active assignment") ||
      errMsg.toLowerCase().includes("mrkey") ||
      errMsg.toLowerCase().includes("mr key") ||
      errMsg.toLowerCase().includes("kno") ||
      errMsg.toLowerCase().includes("already exists");

    if (isAlreadyAssigned) {
      setToastData({
        error: true,
        label: t("EKYC_KNO_ALREADY_ASSIGNED_WITH_ANOTHER_SURVEYOR") || "kno is already assign with another surveyor",
      });
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
        if (refetchDashboard) {
          await refetchDashboard();
        }
        if (refetchApplicationList) {
          await refetchApplicationList();
        }
        closeModal();
      }, 1000);
    },

    onError: (error, variables) => {
      const errMsg = error?.data?.message || error?.response?.data?.message || "";
      handleAssignmentError(errMsg, variables);
    },
  });

  const reassignMutation = Digit.Hooks.ekyc.useEkycAssignmentReassign({
    onSuccess: (response, variables) => {
      if (response?.error) {
        const errMsg = response?.data?.message || "";
        handleAssignmentError(errMsg, variables);
        return;
      }

      if (response?.skipped && response.skipped.length > 0) {
        const reason = response.skipped[0]?.reason || "";
        handleAssignmentError(reason, variables);
        return;
      }

      setToastData({
        error: false,
        label: t("EKYC_REASSIGNMENT_SUCCESSFUL") || "Reassignment successful",
      });

      setShowToast(true);

      setTimeout(async () => {
        if (refetchDashboard) {
          await refetchDashboard();
        }
        if (refetchApplicationList) {
          await refetchApplicationList();
        }
        closeModal();
      }, 1000);
    },
    onError: (error, variables) => {
      const errMsg = error?.data?.message || error?.response?.data?.message || "";
      handleAssignmentError(errMsg, variables);
    },
  });

  const activeMutation = isReassign ? reassignMutation : assignmentMutation;

  const allData = useMemo(() => applicationData?.consumerList || [], [applicationData]);
  const totalRecords = allData.length;
  const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize) || 1, [totalRecords, pageSize]);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return allData.slice(start, start + pageSize);
  }, [allData, currentPage, pageSize]);

  const handleAssign = () => {
    const payload = {
      tenantId: tenantId,
      assignmentType: "KNO",
      assignmentValue: selectedKnos,
    };

    if (isReassign) {
      payload.newSurveyorId = surveyor?.owner?.uuid;
    } else {
      payload.surveyorId = surveyor?.owner?.uuid;
    }

    activeMutation.mutate(payload);
  };

  const handleSelect = (kno) => {
    setSelectedKnos((prev) => (prev.includes(kno) ? prev.filter((item) => item !== kno) : [...prev, kno]));
  };

  const handleSelectAll = (e) => {
    e?.stopPropagation();
    const allMatchingKnos = allData.map((item) => item.kno).filter(Boolean);
    if (allMatchingKnos.length === 0) return;

    const isAllSelected = allMatchingKnos.length > 0 && allMatchingKnos.every((kno) => selectedKnos.includes(kno));

    setSelectedKnos(isAllSelected ? [] : allMatchingKnos);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(0);
  };

  const columns = useMemo(
    () => [
      {
        Header: () => {
          const allMatchingKnos = allData.map((item) => item.kno).filter(Boolean);
          const isAllChecked = allMatchingKnos.length > 0 && allMatchingKnos.every((kno) => selectedKnos.includes(kno));
          return (
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectAll(e);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
        id: "selection",
        Cell: ({ row }) => {
          const kno = row.original.kno;

          return (
            <input
              type="checkbox"
              checked={selectedKnos.includes(kno)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelect(kno);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
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
    [selectedKnos, paginatedData, allData]
  );

  return (
    <Modal
      headerBarMain={isReassign ? `Reassign KNOs to ${surveyor?.name}` : `Assign KNOs to ${surveyor?.name}`}
      headerBarEnd={<Close onClick={closeModal} />}
      actionCancelLabel="Cancel"
      actionCancelOnSubmit={closeModal}
      actionSaveLabel={isReassign ? t("EKYC_REASSIGN_KNOS") || "Reassign KNOs" : t("EKYC_ASSIGN_KNOS") || "Assign KNOs"}
      actionSaveOnSubmit={handleAssign}
      isDisabled={!selectedKnos?.length}
    >
      <div className="assign-knos-modal">
        {/* Filters */}
        <div className="filters-grid">
          <input className="form-control" placeholder="KNO" value={filters.kno} onChange={(e) => handleFilterChange("kno", e.target.value)} />

          <select className="form-control disabled" value={filters.pincode} onChange={(e) => handleFilterChange("pincode", e.target.value)} disabled>
            <option value="">Select Pincode</option>
            {pincodeOptions.map((pin) => (
              <option key={pin} value={pin}>
                {pin}
              </option>
            ))}
          </select>

          {/* <select
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
          </select> */}

          {/* <select className="form-control" value={filters.ward} onChange={(e) => handleFilterChange("ward", e.target.value)}>
            <option value="">Select Ward</option>
            {wardOptions
              .filter((ward) => {
                const stripped = ward.name.replace(/[0-9]/g, "").replace(/^[-\s]+|[-\s]+$/g, "");
                return stripped.trim().length > 0;
              })
              .map((ward) => {
                const displayName = ward.name.replace(/[0-9]/g, "").replace(/^[-\s]+|[-\s]+$/g, "");
                return (
                  <option key={ward.code} value={ward.name}>
                    {displayName}
                  </option>
                );
              })}
          </select> */}
          {/* 
          <select className="form-control" value={filters.assembly} onChange={(e) => handleFilterChange("assembly", e.target.value)}>
            <option value="">Select Assembly</option>
            {assemblyOptions.map((assembly) => (
              <option key={assembly.code} value={assembly.name}>
                {assembly.name}
              </option>
            ))}
          </select> */}

          <select className="form-control" value={filters.mrkey} onChange={(e) => handleFilterChange("mrkey", e.target.value)}>
            <option value="">Select MR Key</option>
            {mrkeyOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>

          {selectedKnos.length > 0 && (
            <button className="clear-selected-btn" type="button" onClick={() => setSelectedKnos([])}>
              {t("EKYC_CLEAR_SELECTION") || "Clear Selected"}
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
          isTableScrollable={true}
          data={paginatedData}
          columns={columns}
          isLoading={isLoading}
          totalRecords={applicationData?.totalCount || 0}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          manualPagination={true}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < totalPages - 1) {
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
            setCurrentPage(Math.max(totalPages - 1, 0));
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
