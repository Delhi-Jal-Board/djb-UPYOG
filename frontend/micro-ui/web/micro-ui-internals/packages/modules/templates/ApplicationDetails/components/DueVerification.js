import React, { useState, useMemo } from "react";
import { TextInput, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const DueVerification = () => {
  const { t } = useTranslation();
  const [kno, setKno] = useState("");
  const [tableData, setTableData] = useState([]);

  const columns = useMemo(
    () => [
      {
        Header: t("K No."),
        accessor: "kno",
      },
      {
        Header: t("Full Name"),
        accessor: "fullName",
      },
      {
        Header: t("Full Address"),
        accessor: "fullAddress",
      },
      {
        Header: t("Due Amount"),
        accessor: "dueAmount",
      },
      {
        Header: t("Total Amount"),
        accessor: "totalAmount",
      },
    ],
    [t]
  );

  const handleAdd = () => {
    if (kno) {
      const mockData = {
        kno: kno,
        fullName: "John Doe",
        fullAddress: "123 Main St, New Delhi, Delhi 110001",
        dueAmount: "1500",
        totalAmount: "1500"
      };
      setTableData([...tableData, mockData]);
      setKno("");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#4f6cfc", marginBottom: "16px" }}>{t("Due Verification")}</h2>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginBottom: "20px" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
            {t("K No.(Existing KNo of same property)")} <span style={{ color: "red" }}>*</span>
          </span>
          <TextInput type="number" value={kno} onChange={(e) => setKno(e.target.value)} style={{ width: "100%", marginBottom: "0" }} />
        </div>
        <div style={{ flex: 1, paddingBottom: "2px" }}>
          <button type="button" onClick={handleAdd} style={{ backgroundColor: "#4f6cfc", color: "white", padding: "8px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
            {t("Add")}
          </button>
        </div>
      </div>
      {tableData.length > 0 && (
        <div style={{ marginTop: "30px", overflowX: "auto" }}>
          <Table
            className="customTable table-fixed-first-column table-border-style"
            t={t}
            disableSort={false}
            autoSort={true}
            manualPagination={false}
            isPaginationRequired={false}
            data={tableData}
            columns={columns}
            getCellProps={(cellInfo) => {
              return {
                style: {
                  padding: "12px",
                },
              };
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DueVerification;
