import React, { useState, useMemo, useEffect } from "react";
import { TextInput, Table, AddIcon } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const DueVerification = ({ applicationData }) => {
  const { t } = useTranslation();
  const [kno, setKno] = useState("");
  const [remarks, setRemarks] = useState("");
  const [tableData, setTableData] = useState([]);

  const handleRemarkChange = React.useCallback(
    (index, value) => {
      setTableData((prevData) => {
        const newData = [...prevData];
        newData[index] = { ...newData[index], remarks: value };
        if (applicationData) {
          applicationData.dueVerification = newData;
        }
        return newData;
      });
    },
    [applicationData]
  );

  const isPendingApproval = applicationData?.applicationStatus === "PENDING_FOR_FIELD_INSPECTION";

  const isActivation = [
    "PENDING_FOR_BILLING_CLERK_REVIEW",
    "PENDING_FOR_ASO_APPROVAL",
    "PENDING_FOR_ZRO_APPROVAL",
    "PENDING_FOR_AE_APPROVAL",
    "PENDING_FOR_FINAL_PAYMENT",
    "PENDING_FOR_CONNECTION_ACTIVATION"
  ].includes(applicationData?.applicationStatus);

  const columns = useMemo(() => {
    const baseColumns = [
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
    ];

    if (isPendingApproval || isActivation) {
      baseColumns.push({
        Header: t("Remarks"),
        accessor: "remarks",
        Cell: ({ row, value }) =>
          isActivation ? (
            value || "-"
          ) : (
            <TextInput
              style={{
                marginBottom: "0px",
                minWidth: "150px",
              }}
              value={value || ""}
              onChange={(e) => handleRemarkChange(row.index, e.target.value)}
            />
          ),
      });
    }

    return baseColumns;
  }, [t, handleRemarkChange, isPendingApproval, isActivation]);

  useEffect(() => {
    if (applicationData?.dueVerification && Array.isArray(applicationData.dueVerification)) {
      setTableData(applicationData.dueVerification);
    }
  }, [applicationData]);

  const handleAdd = () => {
    if (kno) {
      const mockData = {
        kno: kno,
        fullName: "John Doe",
        fullAddress: "123 Main St, New Delhi, Delhi 110001",
        dueAmount: "1500",
        totalAmount: "1500",
        remarks: remarks,
      };
      const newTableData = [...tableData, mockData];
      setTableData(newTableData);
      if (applicationData) {
        applicationData.dueVerification = newTableData;
      }
      setKno("");
      setRemarks("");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>{t("Due Verification")}</h2>
      {!isActivation && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
              {t("K No.(Existing KNo of same property)")} <span style={{ color: "red" }}>*</span>
            </span>
            <TextInput type="number" value={kno} onChange={(e) => setKno(e.target.value)} style={{ width: "100%", marginBottom: "0" }} />
          </div>
          <div style={{ flex: 1, paddingBottom: "2px" }}>
            <button
              type="button"
              onClick={handleAdd}
              style={{
                background: "linear-gradient(135deg, #1f5fa8, #0b2e5b)",
                padding: "8px 24px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <AddIcon />
            </button>
          </div>
        </div>
      )}
      {tableData.length > 0 && (
        <div style={{ marginTop: "15px", overflowX: "auto" }}>
          <Table
            className="customTable table-fixed-first-column table-border-style"
            t={t}
            totalRecords={tableData.length}
            disableSort={false}
            autoSort={true}
            manualPagination={true}
            isPaginationRequired={true}
            data={tableData}
            columns={columns}
          />
        </div>
      )}
    </div>
  );
};

export default DueVerification;
