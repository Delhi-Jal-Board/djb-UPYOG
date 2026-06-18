import React from "react";
import { Link } from "react-router-dom";

const GetCell = (value) => <span className="cell-text">{value}</span>;
const getCreatedTime = (row) => row?.searchData?.auditDetails?.createdTime || row?.workflowData?.auditDetails?.createdTime;
const getFormattedCreatedAt = (row) => {
  const createdTime = getCreatedTime(row);
  if (!createdTime) return "";
  return `${Digit.DateUtils.ConvertEpochToDate(createdTime)} ${Digit.DateUtils.ConvertEpochToTimeInHours(createdTime)}`;
};

const getDeliveryDateTime = (row) => {
  const driverTripReport = row?.searchData?.driverTripReport;
  if (Array.isArray(driverTripReport) && driverTripReport.length > 0) {
    const lastModifiedTime = driverTripReport[0]?.auditDetails?.lastModifiedTime;
    if (lastModifiedTime) {
      return `${Digit.DateUtils.ConvertEpochToDate(lastModifiedTime)} ${Digit.DateUtils.ConvertEpochToTimeInHours(lastModifiedTime)}`;
    }
  }
  return "-";
};

const GetSlaCell = (value) => {
  if (isNaN(value)) return <span className="sla-cell-success">0</span>;
  return value < 0 ? <span className="sla-cell-error">{value}</span> : <span className="sla-cell-success">{value}</span>;
};

const GetMobCell = (value) => <span className="sla-cell">{value}</span>;

const getLocalityTranslation = (localityCode, tenantId, t) => {
  if (!localityCode) return "";
  const tenant = tenantId || Digit.ULBService.getCurrentTenantId() || "djb";
  const prefix = tenant.replace(".", "_").toUpperCase();
  return t(`${prefix}_REVENUE_${localityCode}`);
};

const getVendorNameFromSearchData = (searchData) => searchData?.vendor?.name || searchData?.vendorName || "-";

const getVehicleNameFromSearchData = (searchData) => {
  const mappedVehicle =
    searchData?.vehicle ||
    searchData?.vendor?.vehicles?.find((vehicle) => vehicle?.id === searchData?.vehicleId);

  return mappedVehicle?.registrationNumber || mappedVehicle?.name || mappedVehicle?.type || searchData?.vehicleName || searchData?.vehicleRegistrationNo || "-";
};

const getDriverNameFromSearchData = (searchData) => {
  const mappedDriver =
    searchData?.driver ||
    searchData?.vendor?.drivers?.find(
      (driver) => driver?.id === searchData?.driverId || driver?.ownerId === searchData?.driverId || driver?.owner?.uuid === searchData?.driverId
    );

  return mappedDriver?.name || mappedDriver?.owner?.name || searchData?.driverName || "-";
};

export const TableConfig = (t) => ({
  WT: {
    inboxColumns: (props) => [
      {
        Header: t("WT_BOOKING_NO"),
        id: "bookingNo",
        accessor: (row) => row?.searchData?.["bookingNo"] || "",
        Cell: ({ row }) => {
          return (
            <div>
              <span className="link">
                <Link to={`${props.detailRoute || `${props.parentRoute}/booking-details`}/${row?.original?.searchData?.["bookingNo"]}`}>
                  {row.original?.searchData?.["bookingNo"]}
                </Link>
              </span>
            </div>
          );
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.["bookingNo"]),
      },

      {
        Header: window.location.href.includes("fixed-point") ? t("WT_FIXED_POINT_NAME") : t("WT_APPLICANT_NAME"),
        id: "applicantName",
        accessor: (row) => row?.searchData?.applicantDetail?.["name"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["name"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["name"]),
      },
      {
        Header: t("WT_MOBILE_NUMBER"),
        id: "mobileNumber",
        accessor: (row) => row?.searchData?.applicantDetail?.["mobileNumber"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["mobileNumber"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["mobileNumber"]),
      },
      {
        Header: t("LOCALITY"),
        id: "localityCode",
        accessor: (row) => row?.searchData?.["localityCode"] || "",
        Cell: ({ row }) => {
          return GetCell(getLocalityTranslation(row.original?.searchData?.["localityCode"], row.original?.searchData?.tenantId, t));
        },
        mobileCell: (original) => GetMobCell(getLocalityTranslation(original?.searchData?.["localityCode"], original?.searchData?.tenantId, t)),
      },
      {
        Header: t("Filling Point"),
        id: "fillingPoint",
        accessor: (row) => row?.searchData?.fillingPointMetadata?.name || row?.searchData?.fillingPointName || "-",
        Cell: ({ row }) => {
          const val = row.original?.searchData?.fillingPointMetadata?.name || row.original?.searchData?.fillingPointName || "-";
          return GetCell(val);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.fillingPointMetadata?.name || original?.searchData?.fillingPointName || "-"),
      },
      {
        Header: t("CREATED_AT"),
        id: "createdTime",
        accessor: (row) => getFormattedCreatedAt(row),
        Cell: ({ row }) => {
          return GetCell(getFormattedCreatedAt(row?.original));
        },
        mobileCell: (original) => GetMobCell(getFormattedCreatedAt(original)),
      },
      {
        Header: t("WT_STATUS"),
        id: "applicationStatus",
        accessor: (row) => row?.workflowData?.state?.["applicationStatus"] || "",
        Cell: ({ row }) => {
          const wf = row.original?.workflowData;
          return GetCell(t(`${row?.original?.workflowData?.state?.["applicationStatus"]}`));
        },
        mobileCell: (original) => GetMobCell(t(`ES_WT_COMMON_STATUS_${original?.workflowData?.state?.["applicationStatus"]}`)),
      },
      ...(window.location.href.includes("fixed-point")
        ? [
          {
            Header: t("WT_DELIVERY_DATE_TIME"),
            id: "deliveryDateTime",
            accessor: (row) => getDeliveryDateTime(row),
            Cell: ({ row }) => GetCell(getDeliveryDateTime(row?.original)),
            mobileCell: (original) => GetMobCell(getDeliveryDateTime(original)),
          },
          {
            Header: t("WT_VENDOR_NAME"),
            id: "vendorName",
            accessor: (row) => getVendorNameFromSearchData(row?.searchData),
            Cell: ({ row }) => GetCell(getVendorNameFromSearchData(row?.original?.searchData)),
            mobileCell: (original) => GetMobCell(getVendorNameFromSearchData(original?.searchData)),
          },
          {
            Header: t("WT_VEHICLE_NO"),
            id: "vehicleNumber",
            accessor: (row) => getVehicleNameFromSearchData(row?.searchData),
            Cell: ({ row }) => GetCell(getVehicleNameFromSearchData(row?.original?.searchData)),
            mobileCell: (original) => GetMobCell(getVehicleNameFromSearchData(original?.searchData)),
          },
          {
            Header: t("WT_DRIVER_NAME"),
            id: "driverName",
            accessor: (row) => getDriverNameFromSearchData(row?.searchData),
            Cell: ({ row }) => GetCell(getDriverNameFromSearchData(row?.original?.searchData)),
            mobileCell: (original) => GetMobCell(getDriverNameFromSearchData(original?.searchData)),
          },
        ]
        : []),
    ],
    serviceRequestIdKey: (original) => original?.[t("WT_INBOX_UNIQUE_BOOKING_NO")]?.props?.children,
  },

  MT: {
    inboxColumns: (props) => [
      {
        Header: t("MT_BOOKING_NO"),
        id: "bookingNo",
        accessor: (row) => row?.searchData?.["bookingNo"] || "",
        Cell: ({ row }) => {
          return (
            <div>
              <span className="link">
                <Link to={`${props.parentRoute}/booking-details/` + `${row?.original?.searchData?.["bookingNo"]}`}>
                  {row.original?.searchData?.["bookingNo"]}
                </Link>
              </span>
            </div>
          );
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.["bookingNo"]),
      },

      {
        Header: t("MT_APPLICANT_NAME"),
        id: "applicantName",
        accessor: (row) => row?.searchData?.applicantDetail?.["name"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["name"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["name"]),
      },
      {
        Header: t("MT_MOBILE_NUMBER"),
        id: "mobileNumber",
        accessor: (row) => row?.searchData?.applicantDetail?.["mobileNumber"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["mobileNumber"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["mobileNumber"]),
      },
      {
        Header: t("LOCALITY"),
        id: "localityCode",
        accessor: (row) => row?.searchData?.["localityCode"] || "",
        Cell: ({ row }) => {
          return GetCell(getLocalityTranslation(row.original?.searchData?.["localityCode"], row.original?.searchData?.tenantId, t));
        },
        mobileCell: (original) => GetMobCell(getLocalityTranslation(original?.searchData?.["localityCode"], original?.searchData?.tenantId, t)),
      },
      {
        Header: t("MT_STATUS"),
        id: "applicationStatus",
        accessor: (row) => row?.workflowData?.state?.["applicationStatus"] || "",
        Cell: ({ row }) => {
          const wf = row.original?.workflowData;
          return GetCell(t(`${row?.original?.workflowData?.state?.["applicationStatus"]}`));
        },
        mobileCell: (original) => GetMobCell(t(`ES_WT_COMMON_STATUS_${original?.workflowData?.state?.["applicationStatus"]}`)),
      },
    ],
    serviceRequestIdKey: (original) => original?.[t("WT_INBOX_UNIQUE_BOOKING_NO")]?.props?.children,
  },
  TP: {
    inboxColumns: (props) => [
      {
        Header: t("MT_BOOKING_NO"),
        id: "bookingNo",
        accessor: (row) => row?.searchData?.["bookingNo"] || "",
        Cell: ({ row }) => {
          return (
            <div>
              <span className="link">
                <Link to={`${props.parentRoute}/booking-details/` + `${row?.original?.searchData?.["bookingNo"]}`}>
                  {row.original?.searchData?.["bookingNo"]}
                </Link>
              </span>
            </div>
          );
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.["bookingNo"]),
      },

      {
        Header: t("MT_APPLICANT_NAME"),
        id: "applicantName",
        accessor: (row) => row?.searchData?.applicantDetail?.["name"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["name"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["name"]),
      },
      {
        Header: t("MT_MOBILE_NUMBER"),
        id: "mobileNumber",
        accessor: (row) => row?.searchData?.applicantDetail?.["mobileNumber"] || "",
        Cell: (row) => {
          return GetCell(`${row?.cell?.row?.original?.searchData?.applicantDetail?.["mobileNumber"]}`);
        },
        mobileCell: (original) => GetMobCell(original?.searchData?.applicantDetail?.["mobileNumber"]),
      },
      {
        Header: t("LOCALITY"),
        id: "localityCode",
        accessor: (row) => row?.searchData?.["localityCode"] || "",
        Cell: ({ row }) => {
          return GetCell(getLocalityTranslation(row.original?.searchData?.["localityCode"], row.original?.searchData?.tenantId, t));
        },
        mobileCell: (original) => GetMobCell(getLocalityTranslation(original?.searchData?.["localityCode"], original?.searchData?.tenantId, t)),
      },
      {
        Header: t("MT_STATUS"),
        id: "applicationStatus",
        accessor: (row) => row?.workflowData?.state?.["applicationStatus"] || "",
        Cell: ({ row }) => {
          const wf = row.original?.workflowData;
          return GetCell(t(`${row?.original?.workflowData?.state?.["applicationStatus"]}`));
        },
        mobileCell: (original) => GetMobCell(t(`ES_WT_COMMON_STATUS_${original?.workflowData?.state?.["applicationStatus"]}`)),
      },
    ],
    serviceRequestIdKey: (original) => original?.[t("WT_INBOX_UNIQUE_BOOKING_NO")]?.props?.children,
  },
});
