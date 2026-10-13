import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Header,
  Card,
  CardLabel,
  TextInput,
  SubmitBar,
  Table,
  Loader,
  CardText,
  Toast,
} from "@djb25/digit-ui-react-components";

const SearchBillAmendment = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      amendmentId: "",
      consumerCode: "",
    },
  });

  const convertEpochToDate = (epoch) => {
    if (!epoch) return "NA";
    const d = new Date(epoch);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onSubmit = async (formData) => {
    const amendmentId = formData?.amendmentId?.trim();
    const consumerCode = formData?.consumerCode?.trim();

    if (!amendmentId && !consumerCode) {
      setShowToast({ error: true, label: t("WS_FILL_ATLEAST_ONE_FIELD", "Please fill at least one field to search") });
      setTimeout(() => setShowToast(null), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const params = { businessService: "WS" };
      if (amendmentId) params.amendmentId = amendmentId;
      if (consumerCode) params.consumerCode = consumerCode;

      const res = await Digit.PaymentService.searchAmendment(tenantId, params);
      setSearchResult(res?.Amendments || []);
    } catch (err) {
      console.error("Error searching bill amendment:", err);
      setSearchResult([]);
      setShowToast({ error: true, label: err?.response?.data?.Errors?.[0]?.message || t("CS_WATER_SEARCH_FAILED", "Search failed") });
      setTimeout(() => setShowToast(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    reset({
      amendmentId: "",
      consumerCode: "",
    });
    setSearchResult(null);
  };

  const columns = useMemo(
    () => [
      {
        Header: t("WS_ACK_COMMON_APP_NO_LABEL", "Application No"),
        accessor: "amendmentId",
        Cell: ({ row }) => (
          <span className="link">
            <Link to={`/digit-ui/employee/ws/generate-note-bill-amendment?applicationNumber=${row.original.amendmentId}`}>
              {row.original.amendmentId}
            </Link>
          </span>
        ),
      },
      {
        Header: t("WS_MYCONNECTIONS_CONSUMER_NO", "Consumer No"),
        accessor: "consumerCode",
        Cell: ({ row }) => (
          <span className="link">
            <Link to={`/digit-ui/employee/ws/connection-details?applicationNumber=${row.original.consumerCode}&tenantId=${tenantId}&service=WATER`}>
              {row.original.consumerCode}
            </Link>
          </span>
        ),
      },
      {
        Header: t("WS_AMENDMENT_REASON", "Amendment Reason"),
        accessor: (row) => t(row?.amendmentReason || "NA"),
      },
      {
        Header: t("WS_COMMON_TABLE_COL_APPLICATION_STATUS", "Status"),
        accessor: (row) => t(row?.status || "NA"),
      },
      {
        Header: t("WS_COMMON_TABLE_COL_APPLICATION_DATE", "Application Date"),
        accessor: (row) => convertEpochToDate(row?.auditDetails?.createdTime),
      },
      {
        Header: t("WS_COMMON_TABLE_COL_ACTION", "Action"),
        Cell: ({ row }) => (
          <span className="link">
            <Link to={`/digit-ui/employee/ws/generate-note-bill-amendment?applicationNumber=${row.original.amendmentId}`}>
              {t("ES_COMMON_VIEW", "View")}
            </Link>
          </span>
        ),
      },
    ],
    [t, tenantId]
  );

  return (
    <div className="employee-wrapper" style={{ padding: "16px" }}>
      <Header styles={{ fontSize: "32px", marginBottom: "16px" }}>
        {t("WS_SEARCH_BILL_AMENDMENT_APPLICATION", "Search Bill Amendment Application")}
      </Header>

      <Card style={{ padding: "24px", marginBottom: "24px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <CardLabel style={{ fontWeight: "600", marginBottom: "8px" }}>
                {t("WS_ACK_COMMON_APP_NO_LABEL", "Application No")}
              </CardLabel>
              <TextInput
                name="amendmentId"
                inputRef={register()}
                placeholder={t("WS_SEARCH_APP_NO_PLACEHOLDER", "Enter Bill Amendment Application No")}
              />
            </div>
            <div>
              <CardLabel style={{ fontWeight: "600", marginBottom: "8px" }}>
                {t("WS_MYCONNECTIONS_CONSUMER_NO", "Consumer No")}
              </CardLabel>
              <TextInput
                name="consumerCode"
                inputRef={register()}
                placeholder={t("WS_SEARCH_CONSUMER_NO_PLACEHOLDER", "Enter Consumer / Connection No")}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <SubmitBar label={t("ES_COMMON_SEARCH", "Search")} submit={true} />
            <button
              type="button"
              className="clear-search generic-button"
              onClick={onReset}
              style={{
                background: "transparent",
                border: "none",
                color: "#a82227",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              {t("ES_COMMON_CLEAR_SEARCH", "Clear Search")}
            </button>
          </div>
        </form>
      </Card>

      {isLoading && <Loader />}

      {!isLoading && searchResult && (
        <Card style={{ padding: "16px" }}>
          {searchResult.length > 0 ? (
            <Table
              t={t}
              data={searchResult}
              columns={columns}
              getCellProps={() => ({
                style: {
                  minWidth: "140px",
                  padding: "16px 14px",
                  fontSize: "14px",
                },
              })}
            />
          ) : (
            <CardText style={{ textAlign: "center", padding: "24px" }}>
              {t("ES_COMMON_NO_DATA", "No applications found")}
            </CardText>
          )}
        </Card>
      )}

      {showToast && (
        <Toast
          error={showToast.error}
          label={showToast.label}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default SearchBillAmendment;

