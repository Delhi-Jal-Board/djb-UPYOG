import React, { useState, useEffect } from "react";
import { useQueryClient } from "react-query";
import { useTranslation } from "react-i18next";
import { Card, Dropdown, SubmitBar, Toast, CardLabel, Label } from "@djb25/digit-ui-react-components";
import AddTripModal from "../../components/AddTripModal";
import ApplicationTable from "../../components/inbox/ApplicationTable";

const convertTo12Hour = (time24) => {
  if (!time24) return time24;
  if (time24.includes("AM") || time24.includes("PM")) return time24;
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const strHours = h < 10 ? `0${h}` : h;
  return `${strHours}:${m} ${ampm}`;
};

const convertTo24Hour = (time12) => {
  if (!time12) return time12;
  const match = time12.match(/^(\d{2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return time12;
  let [_, hours, minutes, ampm] = match;
  hours = parseInt(hours, 10);
  if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
  const strHours = hours < 10 ? `0${hours}` : hours;
  return `${strHours}:${minutes}`;
};

const FixedPointScheduleManagement = ({ ...props }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedDay, setSelectedDay] = useState("all");
  const [fixedPoint, setFixedPoint] = useState({ label: "All Fixed Points", value: "all" });
  const [day, setDay] = useState({ label: "All Days", value: "all" });
  const [status, setStatus] = useState({ label: "All Status", value: "all" });
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({ limit: 10, offset: 0 });

  const { isLoading, data: scheduleData, refetch } = Digit.Hooks.wt.useFixedPointScheduleSearch(tenantId, filters);

  useEffect(() => {
    refetch && refetch();
  }, []);

  const { data: fixedPointData, isLoading: isFpLoading } = Digit.Hooks.wt.useFixedPointSearchAPI({ tenantId, filters: { offset: 0, limit: 100 } });

  // Fetch all filtered records for export (up to 1000)
  const allFilters = React.useMemo(() => ({ ...filters, limit: 1000, offset: 0 }), [filters]);
  const { data: allSchedulesData } = Digit.Hooks.wt.useFixedPointScheduleSearch(tenantId, allFilters);

  const fixedPoints = React.useMemo(() => {
    const fromFpApi = fixedPointData?.fixedPointTimeTableDetails || fixedPointData?.waterTankerBookingDetail || fixedPointData?.fixedPoints || [];
    const fromScheduleApi = allSchedulesData?.fixedPointTimeTableDetails || [];

    // Merge both sources
    const combinedData = [...fromFpApi, ...fromScheduleApi];

    const points = combinedData
      .map((fp) => ({
        label: fp.fixedPointCode || fp.applicantDetail?.fixedPointId || fp.name || fp.applicantDetail?.name || fp.bookingId,
        value: fp.fixedPointCode || fp.applicantDetail?.fixedPointId || fp.bookingId,
      }))
      .filter((p) => p.label && p.value);

    // Remove duplicates
    const uniquePoints = points.filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);

    return [
      { label: t("WT_ALL_FIXED_POINTS") !== "WT_ALL_FIXED_POINTS" ? t("WT_ALL_FIXED_POINTS") : "All Fixed Points", value: "all" },
      ...uniquePoints,
    ];
  }, [fixedPointData, allSchedulesData, t]);

  const { mutate: createSchedule } = Digit.Hooks.wt.useCreateFixedPointSchedule(tenantId);
  const { mutate: updateSchedule } = Digit.Hooks.wt.useUpdateFixedPointSchedule(tenantId);

  const closeToast = () => {
    setToast(null);
  };

  // const handleDelete = (index) => {
  //   const updatedData = data.filter((_, i) => i !== index);
  //   setData(updatedData);
  // };

  const handleDownload = (type) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    const filename = `FixedPointSchedule_${type.value}_${formattedDate}`;
    const allData = allSchedulesData?.fixedPointTimeTableDetails || [];

    // Format data for Excel: Array of Arrays starting with Headers
    const excelData = [
      [
        t("WT_SCHEDULE_ID"),
        t("WT_FIXED_POINT"),
        t("WT_DAY"),
        t("WT_FREQ"),
        t("WT_ARR_TO_FPL"),
        t("WT_DEP_FROM_FPL"),
        t("WT_ARR_AT_FIXED_POINT"),
        t("WT_DEP_AT_FIXED_POINT"),
        t("WT_RETURN_TO_FPL"),
        t("WT_VOLUME"),
        t("WT_VEHICLE"),
        t("WT_ACTIVE"),
      ],
      ...allData.map((item) => [
        item.systemAssignedScheduleId,
        item.fixedPointCode,
        t(item.day),
        item.tripNo,
        item.arrivalTimeToFpl,
        item.departureTimeFromFpl,
        item.arrivalTimeDeliveryPoint,
        item.departureTimeDeliveryPoint,
        item.timeOfArrivingBackFplAfterDelivery,
        item.volumeWaterTobeDelivery,
        item.vehicleId,
        item.isEnable ? "Y" : "N",
      ]),
    ];

    if (window.Digit && window.Digit.Download && window.Digit.Download.Excel) {
      window.Digit.Download.Excel(excelData, filename);
    } else {
      // Fallback to CSV with formatted excelData
      const csvRows = excelData.map((row) =>
        row
          .map((cell) => {
            const escaped = ("" + (cell === null || cell === undefined ? "" : cell)).replace(/"/g, '\\"');
            return `"${escaped}"`;
          })
          .join(",")
      );
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const mapScheduleRows = React.useCallback(
    (rows = []) =>
      rows.map((item) => ({
        scheduleId: item.systemAssignedScheduleId,
        fixedPointName: item.fixedPointName,
        fixedPoint: item.fixedPointCode || item.fixedPointId,
        fixedPointId: item.fixedPointId || item.id || null,
        day: item.day,
        freq: item.tripNo,
        arrToFpl: item.arrivalTimeToFpl,
        depFromFpl: item.departureTimeFromFpl,
        arrAtFixedPoint: item.arrivalTimeDeliveryPoint,
        depAtFixedPoint: item.departureTimeDeliveryPoint,
        returnToFpl: item.timeOfArrivingBackFplAfterDelivery,
        volume: item.volumeWaterTobeDelivery,
        vehicle: item.vehicleId,
        active: item.isEnable ? "Y" : "N",
        totalCount: item.totalCount,
        fillingPointId: item.fillingPointId,
      })),
    []
  );

  const dayOrder = React.useMemo(() => ({
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
  }), []);

  const data = React.useMemo(() => {
    const rows = mapScheduleRows(scheduleData?.fixedPointTimeTableDetails || []);
    return rows.sort((a, b) => {
      // Sort by fixedPointCode first
      const fixedPointCompare = (a.fixedPoint || "").localeCompare(b.fixedPoint || "");
      if (fixedPointCompare !== 0) return fixedPointCompare;
      // Then sort by chronological day of week
      const dayA = dayOrder[a.day?.toUpperCase()] || 8;
      const dayB = dayOrder[b.day?.toUpperCase()] || 8;
      return dayA - dayB;
    });
  }, [scheduleData, mapScheduleRows, dayOrder]);

  const fetchNextPage = () => {
    const newOffset = pageOffset + pageSize;
    setPageOffset(newOffset);
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const fetchPrevPage = () => {
    const newOffset = Math.max(0, pageOffset - pageSize);
    setPageOffset(newOffset);
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = Number(e.target.value);
    setPageSize(newPageSize);
    setPageOffset(0);
    setFilters((prev) => ({ ...prev, limit: newPageSize, offset: 0 }));
  };

  const handleSearch = (customFilters = null, offset = null) => {
    const searchFilters = customFilters || {
      fixedPointCode: fixedPoint?.value === "all" ? "" : fixedPoint?.value,
      day: day?.value === "all" ? "" : day?.value?.toUpperCase(),
      status: status?.value === "all" ? "" : status?.value,
    };
    const newOffset = offset !== null ? offset : 0;
    if (offset === null) setPageOffset(0);
    setFilters((prev) => ({ ...searchFilters, limit: prev.limit, offset: newOffset }));
  };

  const columns = React.useMemo(
    () => [
      { Header: t("WT_FIXED_POINT_CODE"), accessor: "fixedPoint" },
      { Header: t("WT_FIXED_POINT_NAME"), accessor: "fixedPointName" },
      { Header: t("WT_DAY"), accessor: "day" },
      // { Header: t("WT_FREQ"), accessor: "freq" },
      { Header: t("WT_ARR_TO_FPL"), accessor: "arrToFpl" },
      { Header: t("WT_DEP_FROM_FPL"), accessor: "depFromFpl" },
      { Header: t("WT_ARR_AT_FIXED_POINT"), accessor: "arrAtFixedPoint" },
      { Header: t("WT_DEP_AT_FIXED_POINT"), accessor: "depAtFixedPoint" },
      { Header: t("WT_RETURN_TO_FPL"), accessor: "returnToFpl" },
      { Header: t("WT_VOLUME"), accessor: "volume" },
      {
        Header: t("WT_ACTIVE"),
        accessor: "active",
        Cell: ({ value }) => (
          <span
            style={{
              background: value === "Y" ? "#E6F4EA" : "#FCE8E6",
              padding: "2px 8px",
              borderRadius: "10px",
              color: value === "Y" ? "#1E8E3E" : "#D93025",
            }}
          >
            {value}
          </span>
        ),
      },
      {
        Header: t("WT_ACTION"),
        Cell: ({ row }) => (
          <div style={{ display: "flex", gap: "5px" }}>
            <button
              onClick={() => {
                setEditingRowIndex(row.index);
                setShowModal(true);
              }}
              style={{ color: "#1D4E7F", border: "1px solid #1D4E7F", background: "none", padding: "2px 8px", cursor: "pointer" }}
            >
              {t("WT_EDIT")}
            </button>
            {/* <button
              onClick={() => handleDelete(row.index)}
              style={{ color: "#fff", border: "none", background: "#D93025", padding: "2px 8px", cursor: "pointer" }}
            >
              {t("WT_DELETE")}
            </button> */}
          </div>
        ),
      },
    ],
    [t]
  );

  const getCSVExportData = React.useCallback(async () => {
    const baseFilters = { ...(filters || {}) };
    delete baseFilters.limit;
    delete baseFilters.offset;
    const batchSize = 200;
    let offset = 0;
    let totalCount = Number.POSITIVE_INFINITY;
    const allRows = [];

    while (offset < totalCount) {
      const response = await Digit.WTService.SearchFixedPointSchedule({
        tenantId,
        filters: { ...baseFilters, limit: batchSize, offset },
      });
      const pageRows = response?.fixedPointTimeTableDetails || [];
      allRows.push(...pageRows);

      const resolvedTotal = Number(response?.count ?? response?.totalCount ?? response?.Count);
      totalCount = Number.isFinite(resolvedTotal) && resolvedTotal >= 0 ? resolvedTotal : allRows.length;

      if (!pageRows.length || pageRows.length < batchSize) {
        break;
      }
      offset += pageRows.length;
    }

    return mapScheduleRows(allRows);
  }, [filters, mapScheduleRows, tenantId]);

  const csvExportColumns = React.useMemo(
    () => [
      { Header: t("WT_SCHEDULE_ID"), accessor: "scheduleId" },
      { Header: t("WT_FIXED_POINT"), accessor: "fixedPoint" },
      { Header: t("WT_DAY"), accessor: "day" },
      { Header: t("WT_FREQ"), accessor: "freq" },
      { Header: t("WT_ARR_TO_FPL"), accessor: "arrToFpl" },
      { Header: t("WT_DEP_FROM_FPL"), accessor: "depFromFpl" },
      { Header: t("WT_ARR_AT_FIXED_POINT"), accessor: "arrAtFixedPoint" },
      { Header: t("WT_DEP_AT_FIXED_POINT"), accessor: "depAtFixedPoint" },
      { Header: t("WT_RETURN_TO_FPL"), accessor: "returnToFpl" },
      { Header: t("WT_VOLUME"), accessor: "volume" },
      { Header: t("WT_ACTIVE"), accessor: "active" },
    ],
    [t]
  );

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const clearSearch = () => {
    setSelectedDay("all");
    setDay({ label: "All Days", value: "all" });
    setFixedPoint({ label: "All Fixed Points", value: "all" });
    setStatus({ label: "All Status", value: "all" });
    setPageOffset(0);
    setFilters({ limit: pageSize, offset: 0 });
  };

  return (
    <div className="fixed-point-schedule-management">
      <Card style={{ padding: "20px" }}>
        <div className="finance-mainlayout" style={{ marginBottom: "20px" }}>
          <div className="finance-mainlayout-col1">
            <CardLabel>{t("WT_EXPORT")}</CardLabel>
            <Dropdown
              option={[
                { label: t("WT_EXCEL_WEEKWISE"), value: "Weekwise" },
                { label: t("WT_EXCEL_MONTHWISE"), value: "Monthwise" },
                { label: t("WT_EXCEL_YEARWISE"), value: "Yearwise" },
              ]}
              optionKey="label"
              placeholder={t("WT_EXPORT")}
              t={t}
              select={handleDownload}
            />
          </div>
          <div className="finance-mainlayout-col1">
            <CardLabel>{t("WT_FIXED_POINT")}</CardLabel>
            <Dropdown
              option={fixedPoints}
              optionKey="label"
              selected={fixedPoint}
              t={t}
              select={(val) => {
                setFixedPoint(val);
              }}
              placeholder={t("WT_ALL_FIXED_POINTS")}
            />
          </div>
          <div className="finance-mainlayout-col1">
            <CardLabel>{t("WT_DAY")}</CardLabel>
            <Dropdown
              option={[
                { label: "All Days", value: "all" },
                { label: t("MONDAY"), value: "MONDAY" },
                { label: t("TUESDAY"), value: "TUESDAY" },
                { label: t("WEDNESDAY"), value: "WEDNESDAY" },
                { label: t("THURSDAY"), value: "THURSDAY" },
                { label: t("FRIDAY"), value: "FRIDAY" },
                { label: t("SATURDAY"), value: "SATURDAY" },
                { label: t("SUNDAY"), value: "SUNDAY" },
              ]}
              optionKey="label"
              selected={day}
              t={t}
              select={(val) => {
                setDay(val);
                setSelectedDay(val.value);
                handleSearch({
                  fixedPointCode: fixedPoint?.value === "all" ? "" : fixedPoint?.value,
                  day: val?.value === "all" ? "" : val?.value?.toUpperCase(),
                  status: status?.value === "all" ? "" : status?.value,
                });
              }}
              placeholder="All Days"
            />
          </div>
          <div className="finance-mainlayout-col1">
            <CardLabel>{t("WT_STATUS")}</CardLabel>
            <Dropdown
              option={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ]}
              optionKey="label"
              selected={status}
              t={t}
              select={(val) => {
                setStatus(val);
                handleSearch({
                  fixedPointCode: fixedPoint?.value === "all" ? "" : fixedPoint?.value,
                  day: day?.value === "all" ? "" : day?.value?.toUpperCase(),
                  status: val?.value === "all" ? "" : val?.value,
                });
              }}
              placeholder="All Status"
            />
          </div>
          <div className="finance-mainlayout-col1">
            <Label>&nbsp;</Label>
            <span className="generic-button clear-search" onClick={clearSearch} style={{ alignSelf: "center" }}>
              {t("ES_COMMON_CLEAR_SEARCH")}
            </span>
          </div>
          <div className="finance-mainlayout-col1">
            <Label>&nbsp;</Label>
            <SubmitBar label={t("ES_COMMON_SEARCH")} onSubmit={() => handleSearch()} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "5px", marginBottom: "20px", flexWrap: "wrap" }}>
          {days.map((dayItem) => (
            <button
              key={dayItem}
              onClick={() => {
                setSelectedDay(dayItem);
                const dayOption = { label: dayItem, value: dayItem };
                setDay(dayOption);
                handleSearch({
                  fixedPointCode: fixedPoint?.value === "all" ? "" : fixedPoint?.value,
                  day: dayItem.toUpperCase(),
                  status: status?.value === "all" ? "" : status?.value,
                });
              }}
              style={{
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: selectedDay === dayItem ? "#1D4E7F" : "#fff",
                color: selectedDay === dayItem ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              {t(dayItem.toUpperCase())}
            </button>
          ))}
        </div>
        <span>
          <button
            onClick={() => {
              setEditingRowIndex(null);
              setShowModal(true);
            }}
            style={{
              background: "#1E8E3E",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "10px",
            }}
          >
            <span>+</span> {t("WT_ADD_TRIP")}
          </button>
        </span>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <ApplicationTable
            t={t}
            data={data}
            columns={columns}
            getCellProps={(cellInfo) => ({})}
            styles={{ minWidth: "1200px" }}
            inboxStyles={{ overflowX: "auto" }}
            isLoading={isLoading}
            onPageSizeChange={handlePageSizeChange}
            currentPage={Math.floor(pageOffset / pageSize)}
            onNextPage={fetchNextPage}
            onPrevPage={fetchPrevPage}
            pageSizeLimit={pageSize}
            onSort={props.onSort}
            disableSort={true}
            sortParams={props.sortParams}
            totalRecords={scheduleData?.count || scheduleData?.totalCount || data?.[0]?.totalCount}
            showCSVExport={true}
            getCSVExportData={getCSVExportData}
            csvExportColumns={csvExportColumns}
            csvExportFileName="wt-fixed-point-schedule"
          />
        </div>

      </Card>
      {showModal && (
        <AddTripModal
          t={t}
          closeModal={() => {
            setShowModal(false);
            setEditingRowIndex(null);
          }}
          initialValues={
            editingRowIndex !== null
              ? {
                scheduleId: data[editingRowIndex].scheduleId,
                fixedPointCode: data[editingRowIndex].fixedPoint,
                fixedPointId: data[editingRowIndex].fixedPointId,
                fillingPointCode: data[editingRowIndex].fillingPointId,
                day: [{ label: t(data[editingRowIndex].day), value: data[editingRowIndex].day }],

                frequencyNo: data[editingRowIndex].freq,
                arrivalTimeFpl: convertTo24Hour(data[editingRowIndex].arrToFpl),
                departureTimeFpl: convertTo24Hour(data[editingRowIndex].depFromFpl),
                arrivalFixedPoint: convertTo24Hour(data[editingRowIndex].arrAtFixedPoint),
                departureFixedPoint: convertTo24Hour(data[editingRowIndex].depAtFixedPoint),
                returnFpl: convertTo24Hour(data[editingRowIndex].returnToFpl),
                volume: data[editingRowIndex].volume,
                vehicleId: data[editingRowIndex].vehicle,
                active: {
                  label: data[editingRowIndex].active === "Y" ? t("YES") : t("NO"),
                  value: data[editingRowIndex].active === "Y" ? "Yes" : "No",
                },
              }
              : null
          }
          onSubmit={(formData) => {
            // 1. Process Days Array
            const formDataDay = formData?.day;
            let daysArr = [];
            if (Array.isArray(formDataDay)) {
              daysArr = formDataDay
                .map((d) => (typeof d === "string" ? d : d?.value || d))
                .filter((d) => d && d !== "WT_SELECT_ALL");
            } else if (formDataDay) {
              const val = formDataDay?.value || formDataDay;
              if (val && val !== "WT_SELECT_ALL") daysArr = [val];
            }

            // 2. Get reference to existing data if editing
            const existingData = editingRowIndex !== null ? data[editingRowIndex] : {};

            const isFormActive = formData.active?.value === "Yes" || formData.active === "Yes" || formData.active === true;
            const isExistingActive = existingData?.active === "Y";
            const finalActiveStatus = formData.active !== undefined ? isFormActive : (editingRowIndex !== null ? isExistingActive : true);

            // 3. Construct the exact fixedPointDetails object structure
            const fixedPointDetails = {
              // Use formData (from modal) OR fallback to existing row data
              system_assigned_schedule_id: formData.scheduleId || existingData.scheduleId || null,
              fixed_point_code: formData.fixedPointId || formData.fixedPointCode || "",
              fillingPointId: formData.fillingPointCode || formData.fillingPointId || null,
              day: daysArr.map((d) => d.toUpperCase()),
              trip_no: Number(formData.frequencyNo) || 1,
              arrival_time_to_fpl: convertTo12Hour(formData.arrivalTimeFpl),
              departure_time_from_fpl: convertTo12Hour(formData.departureTimeFpl),
              arrival_time_delivery_point: convertTo12Hour(formData.arrivalFixedPoint),
              departure_time_delivery_point: convertTo12Hour(formData.departureFixedPoint),
              time_of_arriving_back_fpl_after_delivery: convertTo12Hour(formData.returnFpl),
              volume_water_tobe_delivery: formData.volume,
              active: finalActiveStatus,
              is_enable: finalActiveStatus,
              remarks: formData.remarks || "",
              vehicle_id: formData.vehicleId || existingData.vehicle || null,
              // Safely include audit_details if they exist in the original raw data
              audit_details: scheduleData?.fixedPointTimeTableDetails?.[editingRowIndex]?.auditDetails || null
            };

            if (!fixedPointDetails.system_assigned_schedule_id) delete fixedPointDetails.system_assigned_schedule_id;
            if (!fixedPointDetails.vehicle_id) delete fixedPointDetails.vehicle_id;
            if (!fixedPointDetails.audit_details) delete fixedPointDetails.audit_details;

            // 4. Prepare Payload Wrapper
            const payload = editingRowIndex !== null
              ? { fixedPointDetailsList: [fixedPointDetails] }
              : { fixedPointDetails };

            // 5. API Call logic
            const mutationOptions = {
              onError: (error) => {
                const errMsg = error?.response?.data?.error?.message || error?.response?.data?.Errors?.[0]?.message || error?.message || "Operation Failed";
                setToast({ key: "error", label: errMsg });
                setTimeout(closeToast, 5000);
              },
              onSuccess: (response) => {
                if (response?.error || response?.data?.error) {
                  const errMsg = response?.error?.message || response?.data?.error?.message || "Operation Failed";
                  setToast({ key: "error", label: errMsg });
                  setTimeout(closeToast, 5000);
                } else {
                  setToast({ label: editingRowIndex !== null ? t("WT_SCHEDULE_UPDATE_SUCCESS") : t("WT_SCHEDULE_CREATE_SUCCESS") });
                  setShowModal(false);
                  setEditingRowIndex(null);
                  queryClient.invalidateQueries(["FIXED_POINT_SCHEDULE_SEARCH", tenantId]);
                }
              },
            };

            if (editingRowIndex !== null) {
              updateSchedule(payload, mutationOptions);
            } else {
              createSchedule(payload, mutationOptions);
            }
          }}
        />
      )}
      {toast && (
        <div style={{ position: "fixed", zIndex: 300000 }}>
          <Toast error={toast.key === "error"} label={toast.label} onClose={closeToast} />
        </div>
      )}
    </div>
  );
};

export default FixedPointScheduleManagement;
