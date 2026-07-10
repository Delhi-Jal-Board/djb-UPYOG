import { Header, Loader, Table, SearchForm, SearchField, TextInput, Dropdown, SubmitBar } from "@djb25/digit-ui-react-components";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WSConnection from "./WSConnection";
import WSInfoLabel from "../../../pageComponents/WSInfoLabel";
import { getAddress } from "../../../utils/index";
import { useForm, Controller } from "react-hook-form";

const MyConnections = ({ view }) => {
  const { t } = useTranslation();
  const user = Digit.UserService.getUser();
  const tenantId = "dl.djb";
  let filter = window.location.href.split("/").pop();
  let t1;
  let off;
  if (!isNaN(parseInt(filter))) {
    off = filter;
    t1 = parseInt(filter) + 50;
  } else {
    t1 = 4;
  }

  const userMobileNumber = user?.info?.userName?.match(/^[0-9]{10}$/) ? user?.info?.userName : user?.info?.mobileNumber;

  let filter1 = !isNaN(parseInt(filter))
    ? { tenantId: tenantId, mobileNumber: userMobileNumber, searchType: "CONNECTION" }
    : { tenantId: tenantId, mobileNumber: userMobileNumber, searchType: "CONNECTION" };

  const { isLoading, isError, error, data } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1 }, { filters: filter1 });

  const { isLoading: isSWLoading, isError: isSWError, error: SWerror, data: SWdata } = Digit.Hooks.ws.useMyApplicationSearch(
    { filters: filter1, BusinessService: "SW" },
    { filters: filter1 }
  );
  let connectionList = (data?.WaterConnection || []).concat(SWdata?.SewerageConnections || []);
  let applicationNoWS = (data && data?.WaterConnection?.map((ob) => ob?.propertyId).join(",")) || "";
  let applicaionNoSW = (SWdata && SWdata?.SewerageConnections?.map((ob) => ob?.propertyId).join(",")) || "";
  let applicationNos = applicationNoWS.concat(applicaionNoSW);
  const { isLoading: PTisLoading, isError: PTisError, error: PTerror, data: PTdata } = Digit.Hooks.pt.usePropertySearch(
    { tenantId: tenantId, filters: { mobileNumber: userMobileNumber } },
    { filters: { mobileNumber: userMobileNumber }, enabled: userMobileNumber ? true : false }
  );
  connectionList =
    connectionList &&
    connectionList.map((ob) => {
      return { ...ob, property: PTdata?.Properties?.filter((pt) => pt?.propertyId === ob?.propertyId)[0] };
    });

  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState(null);
  const isMobile = window.Digit.Utils.browser.isMobile();

  const GetCell = (value) => <span className="cell-text">{value}</span>;

  const columns = useMemo(() => {
    return [
      {
        Header: t("WS_MYCONNECTIONS_CONSUMER_NO"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return (
            <span className="link">
              <Link to={{ pathname: `/digit-ui/citizen/ws/connection/details/${encodeURI(row.original?.applicationNo)}`, state: { ...row.original } }}>
                {row.original?.connectionNo || "NA"}
              </Link>
            </span>
          );
        },
      },
      {
        Header: t("WS_MYCONNECTIONS_APPLICATION_NO"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return (
            <span>
              {row.original?.applicationNo || "NA"}
            </span>
          );
        },
      },
      {
        Header: t("WS_SERVICE_NAME_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => GetCell(t(`WS_APPLICATION_TYPE_${row.original?.applicationType}`)),
      },
      {
        Header: t("WS_CONSUMER_NAME"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const names = row.original?.connectionHolders?.map((owner) => owner.name).join(",") ||
            row.original?.property?.owners?.sort((a, b) => a?.additionalDetails?.ownerSequence - b?.additionalDetails?.ownerSequence)?.map((owner) => owner.name).join(",") ||
            t("CS_NA");
          return GetCell(names);
        },
      },
      {
        Header: t("WS_MYCONNECTIONS_STATUS"),
        disableSortBy: true,
        Cell: ({ row }) => GetCell(t(row.original?.status) || t("CS_NA")),
      },
      {
        Header: t("WS_VIEW_DETAILS"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const application = row.original;
          return (
            <span className="link">
              <Link to={{ pathname: `/digit-ui/citizen/ws/connection/details/${encodeURI(application?.applicationNo)}`, state: { ...application } }}>
                {t("WS_VIEW_DETAILS_LABEL")}
              </Link>
            </span>
          );
        },
      }
    ];
  }, [t]);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      connectionNo: "",
      status: "",
    },
  });

  const onSubmitForm = (data) => {
    setSearchParams(data);
    setPageOffset(0);
  };

  if (isLoading || PTisLoading || isSWLoading) {
    return <Loader />;
  }

  const sortedConnections = connectionList?.length > 0
    ? connectionList.sort((a, b) => b.auditDetails?.lastModifiedTime - a.auditDetails?.lastModifiedTime)
    : [];

  let filteredConnections = sortedConnections;
  if (searchParams) {
    if (searchParams.connectionNo) {
      filteredConnections = filteredConnections.filter((app) =>
        app.connectionNo?.toLowerCase().includes(searchParams.connectionNo.toLowerCase())
      );
    }
    if (searchParams.status && searchParams.status.code) {
      filteredConnections = filteredConnections.filter((app) =>
        app.status === searchParams.status.code
      );
    }
  }

  const statusCounts = sortedConnections.reduce((acc, app) => {
    const status = app.status || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const action = Object.keys(statusCounts).map(status => ({
    i18nKey: status === "UNKNOWN" ? "UNKNOWN" : `CS_${status}`,
    code: status
  }));

  return (
    <React.Fragment>
      <WSInfoLabel t={t} />
      
      <div
        className="summary-cards-container"
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {(() => {
          const waterCount = sortedConnections.filter((app) => app?.applicationNo?.includes("WS")).length;
          const sewerageCount = sortedConnections.filter((app) => app?.applicationNo?.includes("SW")).length;

          const cards = [
            { label: "TOTAL_CONNECTIONS", count: sortedConnections?.length || 0, color: "#0B2559" },
            { label: "WATER", count: waterCount, color: "#3B82F6" },
            { label: "SEWERAGE", count: sewerageCount, color: "#F59E0B" },
            ...Object.entries(statusCounts).map(([status, count], idx) => {
              const colors = ["#10B981", "#A855F7", "#EF4444", "#64748B", "#F97316", "#06B6D4"];
              return {
                label: status === "UNKNOWN" ? "UNKNOWN" : `CS_${status}`,
                count: count,
                color: colors[idx % colors.length],
              };
            }),
          ];

          return cards.map((card, idx) => (
            <div
              key={idx}
              className="summary-card"
              style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                padding: "12px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                flex: "1 1 110px",
                maxWidth: "200px",
                minWidth: "100px",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748B",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={t(card.label)}
              >
                {t(card.label)}
              </div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: card.color, marginTop: "8px" }}>
                {String(card.count).padStart(2, "0")}
              </div>
            </div>
          ));
        })()}
      </div>

      <SearchForm t={t} onSubmit={onSubmitForm} handleSubmit={handleSubmit} className="formcomposer-section-grid">
        <SearchField>
          <label>{t("WS_MYCONNECTIONS_STATUS")}</label>
          <Controller
            control={control}
            name="status"
            render={(props) => (
              <Dropdown
                selected={props.value}
                select={props.onChange}
                onBlur={props.onBlur}
                option={action}
                optionKey="i18nKey"
                t={t}
                disable={false}
              />
            )}
          />
        </SearchField>
        <SearchField>
          <label>{t("WS_MYCONNECTIONS_CONSUMER_NO")}</label>
          <TextInput name="connectionNo" inputRef={register({})} />
        </SearchField>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "24px" }}>
          <p
            style={{ cursor: "pointer", color: "#0B4B66", fontWeight: "600", margin: 0 }}
            onClick={() => {
              reset({
                connectionNo: "",
                status: "",
              });
              setSearchParams(null);
              setPageOffset(0);
            }}
          >
            {t(`ES_COMMON_CLEAR_ALL`)}
          </p>
          <SubmitBar label={t("ES_COMMON_SEARCH")} submit style={{ margin: 0 }} />
        </div>
      </SearchForm>

      <div>
        {filteredConnections?.length > 0 ? (
          isMobile ? (
            filteredConnections.map((application, index) => (
              <div key={index}>
                <WSConnection application={application} />
              </div>
            ))
          ) : (
            <Table
              t={t}
              data={filteredConnections.slice(pageOffset, pageOffset + pageSize)}
              totalRecords={filteredConnections.length}
              columns={columns}
              getCellProps={(cellInfo) => {
                return {
                  style: {
                    padding: "20px 18px",
                    fontSize: "16px",
                  },
                };
              }}
              onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
              currentPage={Math.floor(pageOffset / pageSize)}
              onNextPage={() => setPageOffset(pageOffset + pageSize)}
              onPrevPage={() => setPageOffset(pageOffset - pageSize)}
              pageSizeLimit={pageSize}
              disableSort={true}
            />
          )
        ) : (
          <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("PT_NO_APPLICATION_FOUND_MSG")}</p>
        )}
      </div>
    </React.Fragment>
  );
};
export default MyConnections;
