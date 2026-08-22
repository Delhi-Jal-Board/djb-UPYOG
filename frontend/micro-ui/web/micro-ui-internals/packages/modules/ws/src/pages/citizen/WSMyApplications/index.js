import { Loader, SearchForm, Table, SearchField, Dropdown, TextInput, DatePicker, SubmitBar } from "@djb25/digit-ui-react-components";
import { useForm, Controller } from "react-hook-form";
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WSApplication from "./ws-application";
import { propertyCardBodyStyle, stringReplaceAll, getAddress } from "../../../utils";
import WSInfoLabel from "../../../pageComponents/WSInfoLabel";

export const WSMyApplications = () => {
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
    ? { tenantId: tenantId, mobileNumber: userMobileNumber }
    : { tenantId: tenantId, mobileNumber: userMobileNumber };

  const { isLoading, isError, error, data } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1 }, { filters: filter1 });

  const { isLoading: isSWLoading, isError: isSWError, error: SWerror, data: SWdata } = Digit.Hooks.ws.useMyApplicationSearch({ filters: filter1, BusinessService: "SW" }, { filters: filter1 });
  let applicationNoWS = data && data?.WaterConnection?.map((ob) => ob.applicationNo).join(",") || "";
  let applicaionNoSW = SWdata && SWdata?.SewerageConnections?.map((ob) => ob.applicationNo).join(",") || ""
  let applicationNos = applicationNoWS.concat(applicaionNoSW);
  let workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: tenantId,
    id: applicationNos,
    moduleCode: "WS,SW",
    config: {
      enabled: !!applicationNos
    }
  });
  let propertyWS = (data && data?.WaterConnection?.map((ob) => ob?.propertyId).join(",")) || "";
  let propertySW = (SWdata && SWdata?.SewerageConnections?.map((ob) => ob?.propertyId).join(",")) || "";
  let propertyNos = propertyWS.concat(propertySW);
  const { isLoading: PTisLoading, isError: PTisError, error: PTerror, data: PTdata } = Digit.Hooks.pt.usePropertySearch(
    { tenantId: tenantId, filters: { mobileNumber: userMobileNumber } },
    { filters: { mobileNumber: userMobileNumber }, enabled: userMobileNumber ? true : false }
  );

  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState(null);
  const isMobile = window.Digit.Utils.browser.isMobile();

  const GetCell = (value) => <span className="cell-text">{value}</span>;

  const columns = useMemo(() => {
    return [
      {
        Header: t("WS_MYCONNECTIONS_APPLICATION_NO"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return (
            <span className="link">
              <Link to={`/digit-ui/citizen/ws/connection/application/${encodeURI(row.original?.applicationNo)}`}>
                {row.original?.applicationNo || "NA"}
              </Link>
            </span>
          );
        },
      },
      {
        Header: t("WS_SERVICE_NAME"),
        disableSortBy: true,
        Cell: ({ row }) => GetCell(t(`WS_APPLICATION_TYPE_${row.original?.applicationType}`)),
      },
      {
        Header: t("WS_CONSUMER_NAME"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const names = row.original?.connectionHolders?.map((owner) => owner.name).join(",") ||
            row.original?.property?.owners?.sort((a, b) => a?.additionalDetails?.ownerSequence - b?.additionalDetails?.ownerSequence).map((owner) => owner.name).join(",") ||
            t("CS_NA");
          return GetCell(names);
        },
      },
      {
        Header: t("WS_PROPERTY_ID"),
        disableSortBy: true,
        Cell: ({ row }) => GetCell(row.original?.propertyId || t("CS_NA")),
      },
      {
        Header: t("WS_STATUS"),
        disableSortBy: true,
        Cell: ({ row }) => GetCell(t(`CS_${row.original?.applicationStatus}`) || t("CS_NA")),
      },
      {
        Header: t("WS_SLA"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const slaDays = Math.round(row.original?.sla / (24 * 60 * 60 * 1000));
          return GetCell(slaDays ? `${slaDays} Days` : t("CS_NA"));
        },
      },
      {
        Header: t("WS_VIEW_DETAILS"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const application = row.original;
          return (
            <span className="link">
              <Link to={`/digit-ui/citizen/ws/connection/application/${encodeURI(application?.applicationNo)}`}>
                {t("WS_VIEW_DETAILS_LABEL")}
              </Link>
            </span>
          );
        },
      },
      {
        Header: t("MAKE_PAYMENT"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const application = row.original;
          const businessService = application?.applicationNo?.includes("SW") ? (application?.applicationNo?.includes("DC") ? "SW" : "SW.ONE_TIME_FEE") : (application?.applicationNo?.includes("DC") ? "WS" : "WS.ONE_TIME_FEE");

          return application?.applicationStatus === "PENDING_FOR_PAYMENT" ? (
            <span className="link">
              <Link
                to={{
                  pathname: `/digit-ui/citizen/payment/my-bills/${businessService}/${application?.applicationNo?.includes("DC") ? (stringReplaceAll(application?.connectionNo, "/", "+") || stringReplaceAll(application?.connectionNo, "/", "+")) : (stringReplaceAll(application?.applicationNo, "/", "+") || stringReplaceAll(application?.applicationNo, "/", "+"))}?workflow=WNS&tenantId=${application?.tenantId}&ConsumerName=${application?.connectionHolders?.map((owner) => owner.name).join(",") || application?.connectionHolders?.map((owner) => owner.name).join(",") || application?.property?.owners?.map((owner) => owner.name).join(",")}&isDisoconnectFlow=${application?.applicationNo?.includes("DC") ? true : false}`,
                  state: { fromMyApplications: true },
                }}
              >
                {t("MAKE_PAYMENT")}
              </Link>
            </span>
          ) : null;
        },
      }
    ];
  }, [t]);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      applicationNo: "",
      fromDate: "",
      toDate: "",
      status: "",
    },
  });

  const onSubmitForm = (data) => {
    setSearchParams(data);
    setPageOffset(0);
  };

  if (isLoading || isSWLoading || PTisLoading) {
    return <Loader />;
  }
  let { WaterConnection: WSapplicationsList = [] } = data || {};
  let { SewerageConnections: SWapplicationsList = [] } = SWdata || {};
  WSapplicationsList = WSapplicationsList?.map((ob) => { return ({ ...ob, "sla": workflowDetails?.data?.processInstances?.filter((pi) => pi.businessId == ob.applicationNo)[0]?.businesssServiceSla }) }) || [];
  SWapplicationsList = SWapplicationsList?.map((ob) => { return ({ ...ob, "sla": workflowDetails?.data?.processInstances?.filter((pi) => pi.businessId == ob.applicationNo)[0]?.businesssServiceSla }) }) || [];
  WSapplicationsList = WSapplicationsList?.filter((ob) => ob?.applicationType !== "MODIFY_WATER_CONNECTION") || [];
  SWapplicationsList = SWapplicationsList?.filter((ob) => ob?.applicationType !== "MODIFY_SEWERAGE_CONNECTION") || [];
  let applicationsList = (WSapplicationsList || []).concat(SWapplicationsList || []);
  applicationsList =
    applicationsList &&
    applicationsList.map((ob) => {
      return { ...ob, property: PTdata?.Properties?.filter((pt) => pt?.propertyId === ob?.propertyId)[0] };
    });

  const sortedApplications = applicationsList?.length > 0
    ? applicationsList.sort((a, b) => b.auditDetails?.lastModifiedTime - a.auditDetails?.lastModifiedTime)
    : [];

  let filteredApplications = sortedApplications;
  if (searchParams) {
    if (searchParams.applicationNo) {
      filteredApplications = filteredApplications.filter((app) =>
        app.applicationNo?.toLowerCase().includes(searchParams.applicationNo.toLowerCase())
      );
    }
    if (searchParams.status && searchParams.status.code) {
      filteredApplications = filteredApplications.filter((app) =>
        app.applicationStatus === searchParams.status.code
      );
    }
  }

  const statusCounts = sortedApplications.reduce((acc, app) => {
    const status = app.applicationStatus || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const action = Object.keys(statusCounts).map(status => ({
    i18nKey: status === "UNKNOWN" ? "UNKNOWN" : `CS_${status}`,
    code: status
  }));

  const today = new Date();
  const fromDateFormatted = "";
  const setShowToast = () => { };
  const previousPage = () => setPageOffset(0);



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
          const statusCounts = sortedApplications.reduce((acc, app) => {
            const status = app.applicationStatus || "UNKNOWN";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          const waterCount = sortedApplications.filter((app) => app?.applicationNo?.includes("WS")).length;
          const sewerageCount = sortedApplications.filter((app) => app?.applicationNo?.includes("SW")).length;

          const cards = [
            { label: "TOTAL_APPLICATIONS", count: sortedApplications?.length || 0, color: "#0B2559" },
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
          <label>{t("WS_STATUS")}</label>
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
          <label>{t("WS_MYCONNECTIONS_APPLICATION_NO")}</label>
          <TextInput name="applicationNo" inputRef={register({})} />
        </SearchField>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "24px" }}>
          <p
            style={{ cursor: "pointer", color: "#0B4B66", fontWeight: "600", margin: 0 }}
            onClick={() => {
              reset({
                applicationNo: "",
                status: "",
                fromDate: fromDateFormatted,
                toDate: today,
                offset: 0,
                limit: 10,
                sortBy: "commencementDate",
                sortOrder: "DESC",
              });
              setSearchParams(null);
              setShowToast(null);
              previousPage();
            }}
          >
            {t(`ES_COMMON_CLEAR_ALL`)}
          </p>
          <SubmitBar label={t("ES_COMMON_SEARCH")} submit style={{ margin: 0 }} />
        </div>
      </SearchForm>

      <div>
        {filteredApplications?.length > 0 ? (
          isMobile ? (
            filteredApplications.map((application, index) => (
              <div key={index}>
                <WSApplication application={application} />
              </div>
            ))
          ) : (
            <Table
              t={t}
              data={filteredApplications.slice(pageOffset, pageOffset + pageSize)}
              totalRecords={filteredApplications.length}
              columns={columns}
              onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
              currentPage={Math.floor(pageOffset / pageSize)}
              onNextPage={() => setPageOffset(pageOffset + pageSize)}
              onPrevPage={() => setPageOffset(pageOffset - pageSize)}
              pageSizeLimit={pageSize}
              disableSort={true}
            />
          )
        ) : (
          <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("WS_NO_APPLICATION_FOUND_MSG")}</p>
        )}
      </div>
    </React.Fragment>
  );
};

