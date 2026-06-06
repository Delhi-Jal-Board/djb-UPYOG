import React, { useMemo, useState } from "react";
import { Modal, Close, Table } from "@djb25/digit-ui-react-components";

const AssignEkycModal = ({ surveyor, closeModal }) => {
  const [selectedKnos, setSelectedKnos] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState({
    pincode: "",
    locality: "",
    status: "",
    route: "",
    search: "",
  });

  const { data: applicationData, isLoading } = Digit.Hooks.ekyc.useEkycApplicationList(
    {
      tenantId: "dl.djb",
      offset: currentPage * pageSize,
      limit: pageSize,
      ...(filters.pincode && { pincode: filters.pincode }),
    },
    {
      keepPreviousData: true,
    }
  );

  const tableData = applicationData?.consumerList || [];

  const handleAssign = () => {
    const payload = {
      surveyorId: surveyor?.uuid,
      knos: selectedKnos,
      filters,
    };

    console.log(payload);

    closeModal();
  };

  const handleSelectAll = () => {
    const pageKnos = tableData.map((item) => item.kno);

    const allSelected = pageKnos.every((kno) => selectedKnos.includes(kno));

    if (allSelected) {
      setSelectedKnos((prev) => prev.filter((kno) => !pageKnos.includes(kno)));
    } else {
      setSelectedKnos((prev) => [...new Set([...prev, ...pageKnos])]);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: (
          <input
            type="checkbox"
            checked={tableData.length > 0 && tableData.every((item) => selectedKnos.includes(item.kno))}
            onChange={handleSelectAll}
          />
        ),
        id: "selection",
        Cell: ({ row }) => (
          <input type="checkbox" checked={selectedKnos.includes(row.original.kno)} onChange={() => handleSelect(row.original.kno)} />
        ),
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
    []
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
          <input
            className="form-control"
            placeholder="Search by KNO / Consumer"
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
          />

          <input
            className="form-control"
            placeholder="Pincode"
            value={filters.pincode}
            onChange={(e) =>
              setFilters({
                ...filters,
                pincode: e.target.value,
              })
            }
          />

          <input
            className="form-control"
            placeholder="Locality"
            value={filters.locality}
            onChange={(e) =>
              setFilters({
                ...filters,
                locality: e.target.value,
              })
            }
          />

          <input
            className="form-control"
            placeholder="Route"
            value={filters.route}
            onChange={(e) =>
              setFilters({
                ...filters,
                route: e.target.value,
              })
            }
          />

          <select
            className="form-control"
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
          </select>
        </div>

        {/* Summary */}
        <div className="summary-bar">
          <div>Total Records: {applicationData?.totalCount || 0}</div>
          <div>Selected KNOs: {selectedKnos.length}</div>
          <div>
            Page {currentPage + 1} of {applicationData?.totalPages || 1}
          </div>
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
