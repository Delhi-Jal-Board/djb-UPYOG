import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, Card, Loader, InboxLinks } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import StatusCards from "./StatusCards";

const DesktopInbox = ({ tableConfig, filterComponent, ...props }) => {
  const {
    data,
    isLoading,
    onSort,
    onNextPage,
    onPrevPage,
    currentPage,
    pageSizeLimit,
    onPageSizeChange,
    parentRoute,
    searchParams,
    sortParams,
    totalRecords,
    countData,
  } = props;
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const FilterComponent = Digit.ComponentRegistryService?.getComponent(filterComponent);

  // State for Review Modal
  const [selectedKno, setSelectedKno] = useState("");
  const { data: reviewData, getReview } = Digit.Hooks.ekyc.useEkycAPI("review", tenantId);
  const handleReview = (kno) => {
    setSelectedKno(kno);
    getReview({ kno });
  };

  React.useEffect(() => {
    if (reviewData) {
      history.push("/digit-ui/employee/ekyc/review", { kNumber: selectedKno, aadhaarData: reviewData?.aadhaarData, reviewData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewData]);

  const columns = useMemo(
    () => [
      {
        Header: t("EKYC_APPLICATION_NO"),
        accessor: "applicationNumber",
        Cell: ({ row }) => {
          const kno = row.original?.kno || row.original?.applicationNumber || "NA";
          return (
            <span
              className="ekyc-application-link"
              style={{ color: "#add8f7", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => handleReview(kno)}
            >
              {kno}
            </span>
          );
        },
      },
      {
        Header: t("EKYC_CITIZEN_NAME"),
        accessor: "citizenName",
        Cell: ({ row }) => <span>{row.original?.citizenName || "NA"}</span>,
      },
      // {
      //   Header: t("EKYC_MOBILE_NO"),
      //   accessor: "mobileNumber",
      //   Cell: ({ row }) => <span>{row.original?.mobileNumber || "NA"}</span>,
      // },
      {
        Header: t("EKYC_STATUS"),
        accessor: "actionStatus",
        Cell: ({ row }) => {
          const status = row.original?.status || "DEFAULT";
          return <span className={`ekyc-status-tag ${status}`}>{t(`${status}`)}</span>;
        },
      },
      {
        Header: t("EKYC_EKYC_STATUS"),
        accessor: "ekycStatus",
        Cell: ({ row }) => {
          const ekycStatus = (row.original?.ekycStatus || row.original?.ekycstatus || "NA").toUpperCase();
          return <span className={`ekyc-status-tag ${ekycStatus}`}>{t(`${ekycStatus}`)}</span>
        }
      },
      {
        Header: t("EKYC_ACTION"),
        accessor: "status",
        Cell: ({ row }) => {
          const kno = row.original?.kno || row.original?.applicationNumber || "NA";
          return (
            <span
              className="ekyc-application-link"
              style={{ color: "#add8f7", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => handleReview(kno)}
            >
              {t("EKYC_REVIEW")}
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, parentRoute]
  );

  const tableData = useMemo(() => {
    return data?.items || (Array.isArray(data) ? data : []);
  }, [data]);

  return (
    <div className="app-container">
      <div className="inbox-container">
        {isLoading && <Loader />}
        <div className="side-panel-item">
          {/* Sidebar Title Card */}

          <InboxLinks headerText={props.moduleCode} />

          {FilterComponent && (
            <FilterComponent
              defaultSearchParams={props.defaultSearchParams}
              onFilterChange={props.onSearch}
              searchParams={searchParams}
              type="desktop"
              moduleCode="EKYC"
            />
          )}
        </div>

        <div className="employee-form-content" style={{ flex: 1 }}>
          {/* Header Section (retaining for context/actions) */}
          {/* <div className="ekyc-header-container module-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Header className="title" style={{ margin: 0 }}>{t("EKYC_INBOX_HEADER")}</Header>
                    <Link to={`${parentRoute}/create-kyc`}>
                        <SubmitBar label={t("EKYC_CREATE_KYC")} style={{ borderRadius: "8px" }} />
                    </Link>
                </div> */}

          {/* Metrics Section (The Card) */}
          <Card className="ekyc-metrics-card">
            <StatusCards countData={countData} />
          </Card>

          {/* Table Section */}
          <div className="result" style={{ flex: 1 }}>
            <Card className="ekyc-table-card" style={{ padding: 0 }}>
              <Table
                t={t}
                data={tableData}
                columns={columns}
                isLoading={isLoading}
                onSort={onSort}
                sortParams={sortParams}
                totalRecords={totalRecords}
                onNextPage={onNextPage}
                onPrevPage={onPrevPage}
                currentPage={currentPage}
                pageSizeLimit={pageSizeLimit}
                onPageSizeChange={onPageSizeChange}
                getCellProps={(cellInfo) => {
                  return {
                    className: "ekyc-table-cell",
                  };
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopInbox;
