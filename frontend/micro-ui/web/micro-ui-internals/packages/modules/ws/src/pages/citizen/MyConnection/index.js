import { Header, Loader, Table } from "@djb25/digit-ui-react-components";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WSConnection from "./WSConnection";
import WSInfoLabel from "../../../pageComponents/WSInfoLabel";
import { getAddress } from "../../../utils/index";

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
      // {
      //   Header: t("WS_MYCONNECTION_ADDRESS"),
      //   disableSortBy: true,
      //   Cell: ({ row }) => {
      //     return GetCell(getAddress(row.original?.property?.address, t));
      //   },
      // },
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

  if (isLoading || PTisLoading || isSWLoading) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      {/* <Header>{`${t("WS_MYCONNECTIONS_HEADER")} ${connectionList ? `(${connectionList.length})` : ""}`}</Header> */}
      <WSInfoLabel t={t} />
      <div>
        {connectionList?.length > 0 ? (
          isMobile ? (
            connectionList.map((application, index) => (
              <div key={index}>
                <WSConnection application={application} />
              </div>
            ))
          ) : (
            <Table
              t={t}
              data={connectionList.slice(pageOffset, pageOffset + pageSize)}
              totalRecords={connectionList.length}
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
