import { Loader, Table } from "@djb25/digit-ui-react-components";
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
                  state: {},
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

  return (
    <React.Fragment>
      <WSInfoLabel t={t} />
      <div>
        {sortedApplications?.length > 0 ? (
          isMobile ? (
            sortedApplications.map((application, index) => (
              <div key={index}>
                <WSApplication application={application} />
              </div>
            ))
          ) : (
            <Table
              t={t}
              data={sortedApplications.slice(pageOffset, pageOffset + pageSize)}
              totalRecords={sortedApplications.length}
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

