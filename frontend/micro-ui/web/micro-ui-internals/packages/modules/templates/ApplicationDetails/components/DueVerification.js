import React, { useState, useMemo, useEffect } from "react";
import { TextInput, Table, AddIcon, Toast, Dropdown, SearchIconSvg } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const DueVerification = ({ applicationData }) => {
  const { t } = useTranslation();
  const [kno, setKno] = useState("");
  const [remarks, setRemarks] = useState("");
  const [tableData, setTableData] = useState([]);
  const [isManualSearch, setIsManualSearch] = useState(false);

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

  const handleRemoveRow = React.useCallback(
    (index) => {
      setTableData((prevData) => {
        const newData = [...prevData];
        newData.splice(index, 1);
        if (applicationData) {
          applicationData.dueVerification = newData;
        }
        return newData;
      });
    },
    [applicationData]
  );

  const isPendingApproval = ["PENDING_FOR_FIELD_INSPECTION", "PENDING_FOR_ZRO_APPROVAL"].includes(applicationData?.applicationStatus);

  const isActivation = [
    "PENDING_FOR_BILLING_CLERK_REVIEW",
    "PENDING_FOR_ASO_APPROVAL",
    "PENDING_FOR_AE_APPROVAL",
    "PENDING_FOR_FINAL_PAYMENT",
    "PENDING_FOR_CONNECTION_ACTIVATION",
    "CONNECTION_ACTIVATED",
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

      if (!isActivation) {
        baseColumns.push({
          Header: t("Action"),
          accessor: "action",
          Cell: ({ row }) => (
            <div
              style={{ color: "red", cursor: "pointer", fontWeight: "bold", textAlign: "center", fontSize: "16px" }}
              onClick={() => handleRemoveRow(row.index)}
              title={t("CS_REMOVE_ROW") || "Remove Row"}
            >
              &#10006;
            </div>
          ),
        });
      }
    }

    return baseColumns;
  }, [t, handleRemarkChange, handleRemoveRow, isPendingApproval, isActivation]);

  useEffect(() => {
    if (applicationData?.dueVerification && Array.isArray(applicationData.dueVerification)) {
      setTableData(applicationData.dueVerification);
    }
  }, [applicationData]);

  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId() || "dl.djb";
  const { mutateAsync: checkDueVerification } = window?.Digit?.Hooks?.ws?.useDueVerification(tenantId);

  const [showToast, setShowToast] = useState(null);
  const [zroDropdownOptions, setZroDropdownOptions] = useState(null);
  const [selectedZroOption, setSelectedZroOption] = useState(null);

  const isZROApproval = applicationData?.applicationStatus === "PENDING_FOR_ZRO_APPROVAL";

  useEffect(() => {
    let isMounted = true;
    const fetchDueVerification = async () => {
      if (isZROApproval && applicationData?.applicationNo) {
        try {
          const response = await checkDueVerification({ DueVerification: { applicationNo: applicationData.applicationNo } });
          if (!isMounted) return;
          const dueVerifications = Array.isArray(response) ? response : (response?.DueVerifications || response?.dueVerifications || response?.dueVerification || []);
          if (dueVerifications && dueVerifications.length > 0) {
            const options = dueVerifications.map(item => ({
              code: item.kno,
              name: item.kno,
              ...item
            }));
            setZroDropdownOptions(options);
          } else {
             setZroDropdownOptions([]);
          }
        } catch (error) {
          console.error("Error auto-fetching due verification:", error);
        }
      }
    };
    fetchDueVerification();
    return () => { isMounted = false; };
  }, [isZROApproval, applicationData?.applicationNo]);

  const handleAdd = async () => {
    if (kno) {
      if (tableData.some((item) => item.kno === kno)) {
        setShowToast({ isError: true, message: t("CS_DUPLICATE_KNO") || "K No. already exists in the table." });
        return;
      }

      try {
        const response = await checkDueVerification({ DueVerification: { kno: kno } });

        // Check if the response is actually an error object returned by Request
        if (response?.response?.data?.Errors && response?.response?.data?.Errors?.length > 0) {
          setShowToast({ isError: true, message: response.response.data.Errors[0].message || t("CS_SOMETHING_WENT_WRONG") });
          return;
        }

        const dueVerifications = Array.isArray(response) ? response : (response?.DueVerifications || response?.dueVerifications || response?.dueVerification || []);

        if (dueVerifications && dueVerifications.length > 0) {
          const newEntries = dueVerifications.map((dueVerificationData) => ({
            kno: dueVerificationData.kno || kno,
            fullName: dueVerificationData.fullName || "NA",
            fullAddress: dueVerificationData.fullAddress || "NA",
            dueAmount: dueVerificationData.dueAmount || "0",
            totalAmount: dueVerificationData.totalAmount || "0",
            remarks: dueVerificationData.remarks || remarks,
          }));
          
          const newTableData = [...tableData, ...newEntries];
          setTableData(newTableData);
          if (applicationData) {
            applicationData.dueVerification = newTableData;
          }
          setKno("");
          setRemarks("");
          if (selectedZroOption) {
            setSelectedZroOption(null);
          }
        } else {
          setShowToast({ isError: true, message: response?.Errors?.[0]?.message || t("CS_NO_DATA_FOUND") || "No data found for this K No." });
        }
      } catch (error) {
        console.error("Error fetching due verification data:", error);
        setShowToast({ isError: true, message: error?.response?.data?.Errors?.[0]?.message || error?.message || t("CS_SOMETHING_WENT_WRONG") || "Something went wrong." });
      }
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {!isActivation && (
        <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>{t("Due Verification")}</h2>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
                {t("K No.(Existing KNo of same property)")} <span style={{ color: "red" }}>*</span>
              </span>
              {isZROApproval && zroDropdownOptions && zroDropdownOptions.length > 0 && !isManualSearch ? (
                <Dropdown
                  option={zroDropdownOptions}
                  select={(val) => {
                    setSelectedZroOption(val);
                    setKno(val.code);
                  }}
                  selected={selectedZroOption}
                  optionKey="name"
                  t={t}
                  placeholder={t("WS_SELECT_KNO_PLACEHOLDER") || "Select K No."}
                />
              ) : (
                <TextInput type="text" value={kno} onChange={(e) => setKno(e.target.value)} style={{ width: "100%", marginTop: "10px", marginBottom: "0px" }} />
              )}
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
                  color:"white"
                }}
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Toggle Button Row */}
          {isZROApproval && zroDropdownOptions && zroDropdownOptions.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {!isManualSearch ? (
                <button
                  type="button"
                  onClick={() => { setIsManualSearch(true); setKno(""); setSelectedZroOption(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f47738",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0"
                  }}
                >
                  {t("Search K No. manually")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsManualSearch(false); setKno(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f47738",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0"
                  }}
                >
                  {t("Select from dropdown")}
                </button>
              )}
            </div>
          )}
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
      {showToast && (
        <Toast
          error={showToast.isError}
          label={showToast.message}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </div>
  );
};

export default DueVerification;
