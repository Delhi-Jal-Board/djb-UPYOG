import React, { useMemo, useState } from "react";
import { Modal, Close } from "@djb25/digit-ui-react-components";

const AssignEkycModal = ({ surveyor, closeModal }) => {
  const [selectedKnos, setSelectedKnos] = useState([]);

  const [filters, setFilters] = useState({
    pincode: "",
    locality: "",
    status: "",
    route: "",
    search: "",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const knoList = [
    {
      kno: "1029384756",
      consumerName: "Rahul Sharma",
      locality: "Rohini",
      pincode: "110085",
      status: "PENDING",
      route: "R1",
    },
    {
      kno: "9283746555",
      consumerName: "Amit Kumar",
      locality: "Pitampura",
      pincode: "110034",
      status: "VERIFIED",
      route: "R2",
    },
    {
      kno: "8473625147",
      consumerName: "Neha Verma",
      locality: "Dwarka",
      pincode: "110075",
      status: "PENDING",
      route: "R3",
    },
    {
      kno: "5647382910",
      consumerName: "Sanjay Singh",
      locality: "Janakpuri",
      pincode: "110058",
      status: "ASSIGNED",
      route: "R1",
    },
    {
      kno: "9182736450",
      consumerName: "Priya Mehta",
      locality: "Laxmi Nagar",
      pincode: "110092",
      status: "PENDING",
      route: "R4",
    },
    {
      kno: "7463829105",
      consumerName: "Vikas Gupta",
      locality: "Karol Bagh",
      pincode: "110005",
      status: "VERIFIED",
      route: "R2",
    },
    {
      kno: "1122334455",
      consumerName: "Anjali Kapoor",
      locality: "Saket",
      pincode: "110017",
      status: "PENDING",
      route: "R5",
    },
    {
      kno: "6677889900",
      consumerName: "Rohit Yadav",
      locality: "Uttam Nagar",
      pincode: "110059",
      status: "ASSIGNED",
      route: "R3",
    },
    {
      kno: "8899776655",
      consumerName: "Deepak Chauhan",
      locality: "Burari",
      pincode: "110084",
      status: "PENDING",
      route: "R6",
    },
    {
      kno: "5544332211",
      consumerName: "Sneha Arora",
      locality: "Shahdara",
      pincode: "110032",
      status: "VERIFIED",
      route: "R4",
    },
    {
      kno: "3344556677",
      consumerName: "Karan Malhotra",
      locality: "Mayur Vihar",
      pincode: "110091",
      status: "PENDING",
      route: "R7",
    },
    {
      kno: "9988776654",
      consumerName: "Pooja Bansal",
      locality: "Patel Nagar",
      pincode: "110008",
      status: "ASSIGNED",
      route: "R5",
    },
    {
      kno: "7766554433",
      consumerName: "Harsh Jain",
      locality: "Punjabi Bagh",
      pincode: "110026",
      status: "PENDING",
      route: "R8",
    },
    {
      kno: "2233445566",
      consumerName: "Nitin Sharma",
      locality: "Rajouri Garden",
      pincode: "110027",
      status: "VERIFIED",
      route: "R1",
    },
    {
      kno: "4433221100",
      consumerName: "Megha Sethi",
      locality: "Ashok Vihar",
      pincode: "110052",
      status: "PENDING",
      route: "R9",
    },
    {
      kno: "1010101010",
      consumerName: "Aditya Rana",
      locality: "Model Town",
      pincode: "110009",
      status: "ASSIGNED",
      route: "R10",
    },
    {
      kno: "2020202020",
      consumerName: "Simran Kaur",
      locality: "Tilak Nagar",
      pincode: "110018",
      status: "PENDING",
      route: "R11",
    },
    {
      kno: "3030303030",
      consumerName: "Mohit Saini",
      locality: "Narela",
      pincode: "110040",
      status: "VERIFIED",
      route: "R6",
    },
    {
      kno: "4040404040",
      consumerName: "Ritika Sharma",
      locality: "Bawana",
      pincode: "110039",
      status: "PENDING",
      route: "R7",
    },
    {
      kno: "5050505050",
      consumerName: "Yash Aggarwal",
      locality: "Okhla",
      pincode: "110020",
      status: "ASSIGNED",
      route: "R8",
    },
  ];

  const filteredKnos = useMemo(() => {
    return knoList.filter((item) => {
      const matchesPincode = filters.pincode ? item.pincode.includes(filters.pincode) : true;

      const matchesLocality = filters.locality ? item.locality.toLowerCase().includes(filters.locality.toLowerCase()) : true;

      const matchesStatus = filters.status ? item.status === filters.status : true;

      const matchesRoute = filters.route ? item.route.toLowerCase().includes(filters.route.toLowerCase()) : true;

      const matchesSearch = filters.search
        ? item.kno.includes(filters.search) || item.consumerName.toLowerCase().includes(filters.search.toLowerCase())
        : true;

      return matchesPincode && matchesLocality && matchesStatus && matchesRoute && matchesSearch;
    });
  }, [filters, knoList]);

  const handleSelect = (kno) => {
    setSelectedKnos((prev) => (prev.includes(kno) ? prev.filter((item) => item !== kno) : [...prev, kno]));
  };

  const handleSelectAll = () => {
    const visibleKnos = filteredKnos.map((item) => item.kno);

    const allSelected = visibleKnos.every((kno) => selectedKnos.includes(kno));

    if (allSelected) {
      setSelectedKnos((prev) => prev.filter((kno) => !visibleKnos.includes(kno)));
    } else {
      setSelectedKnos((prev) => [...new Set([...prev, ...visibleKnos])]);
    }
  };

  const handleAssign = () => {
    const payload = {
      surveyorId: surveyor?.uuid,
      knos: selectedKnos,
      filters,
    };

    console.log(payload);

    closeModal();
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
          <div>Total Records: {filteredKnos.length}</div>
          <div>Selected KNOs: {selectedKnos.length}</div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {/* Header */}
          <div className="table-header">
            <div>
              <input
                type="checkbox"
                checked={filteredKnos.length > 0 && filteredKnos.every((item) => selectedKnos.includes(item.kno))}
                onChange={handleSelectAll}
              />
            </div>

            <div>KNO</div>
            <div>Consumer Name</div>
            <div>Locality</div>
            <div>Pincode</div>
            <div>Status</div>
            <div>Route</div>
          </div>

          {/* Rows */}
          <div className="table-body">
            {filteredKnos.length > 0 ? (
              filteredKnos.map((item, index) => (
                <div key={item.kno} className={`table-row ${index % 2 === 0 ? "even" : "odd"}`}>
                  <div>
                    <input type="checkbox" checked={selectedKnos.includes(item.kno)} onChange={() => handleSelect(item.kno)} />
                  </div>

                  <div className="kno-value">{item.kno}</div>

                  <div>{item.consumerName}</div>
                  <div>{item.locality}</div>
                  <div>{item.pincode}</div>

                  <div>
                    <span className={`status-badge ${item.status === "PENDING" ? "pending" : item.status === "VERIFIED" ? "verified" : "assigned"}`}>
                      {item.status}
                    </span>
                  </div>

                  <div>{item.route}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No KNO records found</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignEkycModal;
