import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ArrearTable from "./arrear-table";

const styles = {
  buttonStyle: { display: "flex", justifyContent: "flex-end", color: "#a82227", marginTop: "10px", marginBottom: "10px", cursor: "pointer", fontWeight: "bold" },
  headerStyle: {
    marginTop: "10px",
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "24px",
    color: " rgba(11, 12, 12, var(--text-opacity))",
  },
};

const thStyle = { textAlign: "left", borderBottom: "#D6D5D4 1px solid", padding: "16px 12px", whiteSpace: "break-spaces", fontSize: "14px", fontWeight: "bold" };
const tdStyle = { textAlign: "left", borderBottom: "#D6D5D4 1px solid", padding: "8px 10px", wordBreak: "keep-all", fontSize: "14px" };

const ArrearSummary = ({ bill = {}, businessService }) => {
  const { t } = useTranslation();
  const [showArrear, setShowArrear] = useState(false);

  const isWNS = businessService === "WS" || businessService === "SW";
  const yearWiseBills = bill?.billDetails?.sort((a, b) => b.fromPeriod - a.fromPeriod);
  
  const getBillingPeriod = (_bill) => {
    const { fromPeriod, toPeriod } = _bill;
    let from = new Date(fromPeriod).toLocaleDateString();
    let to = new Date(toPeriod).toLocaleDateString();
    return from + "-" + to;
  };

  const renderArrearDetailsForWNS = () => {
    return (
      <div style={{ maxWidth: "100%", overflowX: "auto", backgroundColor: "#EEEEEE", marginTop: "10px" }}>
        <table className="table-fixed-column-common-pay" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>{t("CS_BILL_NO")}</th>
              <th style={{ ...thStyle }}>{t("CS_PAYMENT_BILLING_PERIOD")}</th>
              <th style={{ ...thStyle }}>{t("CS_BILL_DUEDATE")}</th>
              {yearWiseBills
                ?.filter((e, ind) => ind > 0)?.[0]
                ?.billAccountDetails?.sort((a, b) => a.order - b.order)
                ?.map((head, index) => (
                  <th style={{ ...thStyle }} key={index}>
                    {t(head.taxHeadCode)}
                  </th>
                ))}
              <th style={thStyle}>{t("TOTAL_TAX")}</th>
            </tr>
          </thead>
          <tbody>
            {yearWiseBills
              ?.filter((e, ind) => ind > 0)
              ?.map((year_bill, index) => {
                const sorted_tax_heads = year_bill?.billAccountDetails?.sort((a, b) => a.order - b.order);
                return (
                  <tr key={index}>
                    <td style={tdStyle}>{year_bill?.billNumber}</td>
                    <td style={tdStyle}>{getBillingPeriod(year_bill)}</td>
                    <td style={tdStyle}>{year_bill?.expiryDate && new Date(year_bill?.expiryDate).toLocaleDateString()}</td>
                    {sorted_tax_heads?.map((e, i) => (
                      <td style={tdStyle} key={i}>
                        {e.amount}
                      </td>
                    ))}
                    <td style={tdStyle}>{year_bill.amount}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  const formatTaxHeaders = (billDetail = {}) => {
    let formattedFees = {};
    const { billAccountDetails = [] } = billDetail;
    billAccountDetails.map((taxHead) => {
      formattedFees[taxHead.taxHeadCode] = { value: taxHead.amount, order: taxHead.order };
    });
    formattedFees["CS_BILL_NO"] = { value: billDetail?.billNumber || "NA", order: -2 };
    formattedFees["CS_BILL_DUEDATE"] = {
      value: (billDetail?.expiryDate && new Date(billDetail?.expiryDate).toLocaleDateString()) || "NA",
      order: -1,
    };
    formattedFees["TL_COMMON_TOTAL_AMT"] = { value: billDetail.amount, order: 10 };
    return formattedFees;
  };

  const getFinancialYears = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (toDate.getYear() - fromDate.getYear() != 0) {
      return `FY${fromDate.getYear() + 1900}-${toDate.getYear() - 100}`;
    }
    return `${fromDate.toLocaleDateString()}-${toDate.toLocaleDateString()}`;
  };

  let fees = {};
  let sortedBillDetails = bill?.billDetails?.sort((a, b) => b.fromPeriod - a.fromPeriod) || [];
  sortedBillDetails = [...sortedBillDetails];
  const arrears = sortedBillDetails?.reduce((total, current, index) => (index === 0 ? total : total + current.amount), 0) || 0;
  let arrearsAmount = `₹ ${arrears?.toFixed?.(0) || Number(0).toFixed(0)}`;

  sortedBillDetails.shift();
  sortedBillDetails.map((bill) => {
    let fee = formatTaxHeaders(bill);
    fees[getFinancialYears(bill.fromPeriod, bill.toPeriod)] = fee;
  });

  let head = {};
  fees
    ? Object.keys(fees).map((key, ind) => {
        let value = [];
        Object.keys(fees[key]).map((key1) => {
          head[key1] = (fees[key] && fees[key][key1] && fees[key][key1].order) || 0;
        });
      })
    : "NA";
  let keys = [];

  keys = Object.keys(head);
  keys.sort((x, y) => head[x] - head[y]);

  if (isWNS) {
    if (!yearWiseBills || yearWiseBills.length <= 1) {
      return <span></span>;
    }
    return (
      <React.Fragment>
        {showArrear && renderArrearDetailsForWNS()}
        <div style={styles.buttonStyle}>
          <div
            onClick={() => {
              setShowArrear(!showArrear);
            }}
          >
            {showArrear ? t("ES_COMMON_HIDE_DETAILS") : t("ES_COMMON_VIEW_DETAILS")}
          </div>
        </div>
      </React.Fragment>
    );
  }

  if (arrears == 0 || arrears < 0) {
    return <span></span>;
  }
  return (
    <React.Fragment>
      <div style={styles.headerStyle}>{t("CS_ARREARS_DETAILS")}</div>
      {showArrear && <ArrearTable headers={[...keys]} values={fees} arrears={arrearsAmount}></ArrearTable>}
      {!showArrear && (
        <div style={styles.buttonStyle}>
          <button
            type="button"
            onClick={() => {
              setShowArrear(true);
            }}
          >
            {t("CS_SHOW_CARD")}
          </button>
        </div>
      )}
      {showArrear && (
        <div style={styles.buttonStyle}>
          <button
            type="button"
            onClick={() => {
              setShowArrear(false);
            }}
          >
            {t("CS_HIDE_CARD")}
          </button>
        </div>
      )}
    </React.Fragment>
  );
};

export default ArrearSummary;
