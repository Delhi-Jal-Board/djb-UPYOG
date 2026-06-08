import React, { useMemo, useState, useEffect } from "react";
import { Modal, Close, Table } from "@djb25/digit-ui-react-components";

const AssignEkycModal = ({ surveyor, closeModal }) => {
  const [selectedKnos, setSelectedKnos] = useState([]);
  const [assignmentType, setAssignmentType] = useState("KNO");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    kno: "", // search value
    ekycStatus: "",
    zoneName: "",
    assembly: "",
    ward: "",
    mrkey: "",
    pincode: "",
  });

  const getAssignmentValue = () => {
    switch (assignmentType) {
      case "MRKEY":
        return filters.mrkey;

      case "ASSEMBLY":
        return filters.assembly;

      case "WARD":
        return filters.ward;

      case "KNO":
      default:
        return selectedKnos.join(",");
    }
  };

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedFilters]);

  const { data: applicationData, isLoading } = Digit.Hooks.ekyc.useEkycApplicationList(
    {
      ...(debouncedFilters.kno && {
        kno: debouncedFilters.kno,
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

  const assignmentMutation = Digit.Hooks.ekyc.useEkycAssignmentCreate({
    onSuccess: (response) => {
      console.log("Assignment successful", response);
      closeModal();
    },
    onError: (error) => {
      console.error("Assignment failed", error);
      // show toast here
    },
  });

  const tableData = applicationData?.consumerList || [];

  const handleAssign = () => {
    assignmentMutation.mutate({
      tenantId: "dl.djb",
      surveyorId: surveyor?.uuid,
      assignmentType: "KNO",
      assignmentValue: getAssignmentValue(),
    });
  };

  const handleSelectAll = () => {
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
        Cell: ({ value }) => value || "-",
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
    >
      <div className="assign-knos-modal">
        {/* Filters */}
        <div className="filters-grid">
          <input className="form-control" placeholder="KNO" value={filters.kno} onChange={(e) => handleFilterChange("kno", e.target.value)} />

          <input
            className="form-control"
            placeholder="Pincode"
            value={filters.pincode}
            onChange={(e) => handleFilterChange("pincode", e.target.value)}
          />

          <input
            className="form-control"
            placeholder="Zone"
            value={filters.zoneName}
            onChange={(e) => handleFilterChange("zoneName", e.target.value)}
          />

          <input className="form-control" placeholder="Ward" value={filters.ward} onChange={(e) => handleFilterChange("ward", e.target.value)} />

          <input
            className="form-control"
            placeholder="Assembly"
            value={filters.assembly}
            onChange={(e) => handleFilterChange("assembly", e.target.value)}
          />

          <input className="form-control" placeholder="MR Key" value={filters.mrkey} onChange={(e) => handleFilterChange("mrkey", e.target.value)} />

          <select className="form-control" value={filters.ekycStatus} onChange={(e) => handleFilterChange("ekycStatus", e.target.value)}>
            <option value="">All eKYC Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select className="form-control" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
            <option value="KNO">KNO</option>
            <option value="MRKEY">MR Key</option>
            <option value="WARD">Ward</option>
            <option value="ASSEMBLY">Assembly</option>
          </select>
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
    </Modal>
  );
};

export default AssignEkycModal;
