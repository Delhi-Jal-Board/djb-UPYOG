import React, { useEffect, useRef, useState } from "react";
import { useGlobalFilter, usePagination, useRowSelect, useSortBy, useTable } from "react-table";
import {
  ArrowBack,
  ArrowForward,
  ArrowToFirst,
  ArrowToLast,
  ChevronDown,
  IconClose,
  IconDownload,
  IconSearch,
  IconSortAsc,
  IconSortDesc,
  IconSortNeutral,
  LayoutGrid,
} from "./svgindex";

const noop = () => {};

const getSearchableText = (obj) => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") return String(obj).toLowerCase();
  return Object.values(obj).map(getSearchableText).join(" ");
};

const VALID_TEXT_ALIGN = new Set(["left", "right", "center", "start", "end", "justify"]);
const DEFAULT_TEXT_ALIGN = "left";
const DEFAULT_ROW_HEIGHT = 52;

const normalizeTextAlign = (value, fallback = DEFAULT_TEXT_ALIGN) => {
  if (!value || typeof value !== "string") return fallback;
  const align = value.toLowerCase();
  return VALID_TEXT_ALIGN.has(align) ? align : fallback;
};

const getColumnAlign = (column, fallback = DEFAULT_TEXT_ALIGN) =>
  normalizeTextAlign(column?.align || column?.textAlign || column?.meta?.align || column?.meta?.textAlign, fallback);

const getFlexJustifyFromAlign = (align = DEFAULT_TEXT_ALIGN) => {
  if (align === "right" || align === "end") return "flex-end";
  if (align === "center") return "center";
  return "flex-start";
};

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const T = {
  accent: "#5282e6",
  accentDark: "#5282e6",
  accentLight: "#eff6ff",
  accentMid: "#bfdbfe",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  surfaceHover: "#f0f4ff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  warn: "#f59e0b",
  warnLight: "#fffbeb",
  warnBorder: "#fde68a",
  warnDark: "#b45309",
  fontBody: "'DM Sans', 'Segoe UI', ui-sans-serif, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
};

const flattenColumnsForExport = (columnDefs = []) =>
  (Array.isArray(columnDefs) ? columnDefs : []).reduce((acc, column) => {
    if (!column) return acc;
    if (Array.isArray(column.columns) && column.columns.length > 0) {
      return [...acc, ...flattenColumnsForExport(column.columns)];
    }
    if (column.disableExport || column?.meta?.disableExport) return acc;
    acc.push(column);
    return acc;
  }, []);

const getValueFromPath = (source, path) => {
  if (!source || !path || typeof path !== "string") return undefined;
  return path.split(".").reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), source);
};

const toExportableString = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toExportableString).join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const escapeCsvCell = (value) => `"${toExportableString(value).replace(/"/g, '""')}"`;

const extractTextFromNode = (node) => {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).filter(Boolean).join(" ").trim();
  if (React.isValidElement(node)) return extractTextFromNode(node.props?.children);
  return "";
};

const resolveColumnHeader = (column, index) => {
  if (column?.exportHeader !== undefined) return column.exportHeader;
  if (typeof column?.Header === "string") return column.Header;
  if (typeof column?.Header === "function") {
    try {
      const headerNode = column.Header({});
      const text = extractTextFromNode(headerNode);
      if (text) return text;
    } catch (error) {
      // fallback to id/accessor
    }
  }
  if (React.isValidElement(column?.Header)) {
    const text = extractTextFromNode(column.Header);
    if (text) return text;
  }
  if (typeof column?.id === "string") return column.id;
  if (typeof column?.accessor === "string") return column.accessor;
  return `Column ${index + 1}`;
};

const resolveColumnValue = (column, row, rowIndex) => {
  if (typeof column?.exportAccessor === "function") return column.exportAccessor(row, rowIndex);
  if (typeof column?.accessor === "function") return column.accessor(row, rowIndex);
  if (typeof column?.accessor === "string") return getValueFromPath(row, column.accessor);
  if (typeof column?.id === "string") return getValueFromPath(row, column.id);
  if (typeof column?.mobileCell === "function") {
    const mobileNode = column.mobileCell(row, rowIndex);
    const text = extractTextFromNode(mobileNode);
    if (text) return text;
  }
  if (typeof column?.Cell === "function") {
    try {
      const cellNode = column.Cell({
        row: { original: row },
        cell: { row: { original: row } },
        value: undefined,
      });
      const text = extractTextFromNode(cellNode);
      if (text) return text;
    } catch (error) {
      // ignore cell renderer errors during CSV serialization
    }
  }
  return "";
};

const buildCsvContent = ({ columnDefs = [], rows = [] }) => {
  const exportColumns = flattenColumnsForExport(columnDefs);
  if (exportColumns.length === 0) return "";

  const headerRow = exportColumns.map((column, index) => escapeCsvCell(resolveColumnHeader(column, index))).join(",");
  const bodyRows = (Array.isArray(rows) ? rows : []).map((row, rowIndex) =>
    exportColumns.map((column) => escapeCsvCell(resolveColumnValue(column, row, rowIndex))).join(",")
  );

  return [headerRow, ...bodyRows].join("\n");
};

const normalizeCsvFileName = (fileName = "table-data") => {
  const safeName = String(fileName || "table-data")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_");
  if (!safeName) return "table-data.csv";
  return safeName.toLowerCase().endsWith(".csv") ? safeName : `${safeName}.csv`;
};

const downloadCsv = (content, fileName) => {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.setAttribute("href", url);
  anchor.setAttribute("download", fileName);
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const normalizeExportRows = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

/* ─── Pagination Button ─────────────────────────────────────────────────────── */
const PagBtn = ({ onClick, disabled, title, children, active = false }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 5,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.fontMono,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 0,
    opacity: disabled ? 0.35 : 1,
    transition: "all 0.15s",
  };
  if (active) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{ ...base, background: T.accent, border: `1.5px solid ${T.accent}`, color: "#fff", boxShadow: "0 2px 6px rgba(37,99,235,0.30)" }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base,
        background: hovered && !disabled ? T.accentLight : T.surface,
        border: `1.5px solid ${hovered && !disabled ? T.accentMid : T.borderStrong}`,
        color: hovered && !disabled ? T.accent : T.textSecondary,
      }}
    >
      {children}
    </button>
  );
};

/* ─── Main Table ────────────────────────────────────────────────────────────── */
const Table = ({
  className = "table",
  tableClass = "",
  t,
  data = [],
  columns = [],
  getCellProps,
  currentPage = 0,
  pageSizeLimit = 10,
  disableSort = true,
  autoSort = true,
  initSortId = "",
  onSearch = false,
  manualPagination = true,
  totalRecords,
  onNextPage,
  onPrevPage,
  globalSearch,
  onSort = noop,
  onPageSizeChange,
  onLastPage,
  onFirstPage,
  isPaginationRequired = true,
  sortParams = [],
  showAutoSerialNo = false,
  customTableWrapperClassName = "",
  styles = {},
  tableTopComponent,
  tableRef,
  isReportTable = false,
  inboxStyles,
  tableTitle,
  showCSVExport = false,
  csvExportFileName = "",
  csvExportData,
  getCSVExportData,
  csvExportColumns,
  csvExportButtonLabel,
  isLoading,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [internalSearch, setInternalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isCsvExporting, setIsCsvExporting] = useState(false);
  const tableData = Array.isArray(data) ? data : [];
  const tableColumns = Array.isArray(columns) ? columns : [];

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows, // all rows (after filtering/sorting, before pagination)
    prepareRow,
    page, // current page rows
    canPreviousPage,
    canNextPage,
    // pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex = 0, pageSize = 10, sortBy, globalFilter },
  } = useTable(
    {
      columns: tableColumns,
      data: tableData,
      initialState: {
        pageIndex: currentPage,
        pageSize: pageSizeLimit,
        sortBy: autoSort ? [{ id: initSortId, desc: false }] : sortParams,
      },
      // ── Keep ALL originalpageIndex pagination logic exactly as it was ──────────────
      pageCount: totalRecords > 0 ? Math.ceil(totalRecords / pageSizeLimit) : -1,
      manualPagination: manualPagination,
      disableMultiSort: false,
      disableSortBy: disableSort,
      manualSortBy: autoSort ? false : true,
      autoResetPage: false,
      autoResetSortBy: false,
      disableSortRemove: true,
      disableGlobalFilter: false,
      globalFilter:
        globalSearch ||
        ((rows, columnIds, filterValue) => {
          if (!filterValue) return rows;
          const lowerVal = String(filterValue).toLowerCase();
          return rows.filter((row) => {
            const rowText = getSearchableText(row.original);
            return rowText.includes(lowerVal);
          });
        }),
      useControlledState: (state) => {
        return {
          ...state,
          pageIndex: manualPagination ? currentPage : state.pageIndex,
        };
      },
      // ─────────────────────────────────────────────────────────────────────
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  // Keep original onSort behaviour
  useEffect(() => {
    onSort(sortBy);
  }, [onSort, sortBy]);

  // Integrated Search box
  useEffect(() => {
    const value = onSearch !== false && typeof onSearch === "string" ? onSearch : internalSearch || undefined;

    if (globalFilter !== value) {
      setGlobalFilter(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSearch, internalSearch, globalFilter]);

  const tref = useRef();

  // ── Pagination display values — original logic, untouched ────────────────
  // const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = manualPagination
    ? (currentPage + 1) * pageSizeLimit > totalRecords
      ? totalRecords
      : (currentPage + 1) * pageSizeLimit
    : pageIndex * pageSize + page?.length;
  const totalLabel = totalRecords ? `of ${manualPagination ? totalRecords : rows.length}` : "";

  const isCsvExportEnabled = showCSVExport || typeof getCSVExportData === "function" || Array.isArray(csvExportData);

  const handleCsvExport = async () => {
    if (isCsvExporting) return;
    setIsCsvExporting(true);

    try {
      const isManualExportWithoutDataSource = manualPagination && typeof getCSVExportData !== "function" && !Array.isArray(csvExportData);
      if (isManualExportWithoutDataSource) {
        console.warn("Table CSV export skipped: provide csvExportData or getCSVExportData for manual pagination.");
        return;
      }

      const exportSource =
        typeof getCSVExportData === "function"
          ? await getCSVExportData({
              currentPage,
              pageIndex,
              pageSize,
              pageSizeLimit,
              manualPagination,
              sortBy,
              globalFilter,
              totalRecords,
            })
          : csvExportData ?? (manualPagination ? [] : tableData);

      const exportRows = normalizeExportRows(exportSource);
      const csvContent = buildCsvContent({
        columnDefs: csvExportColumns || tableColumns,
        rows: exportRows,
      });

      if (!csvContent) {
        console.warn("Table CSV export skipped: no exportable columns were found.");
        return;
      }

      const resolvedFileName = normalizeCsvFileName(csvExportFileName || tableTitle || "table-data");
      downloadCsv(csvContent, resolvedFileName);
    } catch (error) {
      console.error("Table CSV export failed:", error);
    } finally {
      setIsCsvExporting(false);
    }
  };

  return (
    <div className="basetable no-scrollbar">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="table-topbar">
        {/* Left: title + total badge */}
        <div className="topbar-badge">
          {tableTitle && <h3 className="title">{tableTitle}</h3>}
          {totalRecords !== undefined && (
            <div className="total-records">
              <span className="records">{totalRecords}</span>
              <span className="title">{t ? t("CS_TOTAL_RECORDS") : "Total Records"}</span>
            </div>
          )}
        </div>

        {/* Right: internal search box + tableTopComponent */}
        <div className="search-box-wrapper">
          <div className="table-search-box">
            <span className={`icon ${searchFocused ? "accent" : "textMuted"}`}>
              <IconSearch />
            </span>
            <input
              className={`search-input ${searchFocused ? "shadow" : ""}`}
              placeholder={t ? t("CS_COMMON_SEARCH") : "Search table…"}
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {internalSearch && (
              <button onClick={() => setInternalSearch("")} className="close-button">
                <IconClose />
              </button>
            )}
          </div>
          {isCsvExportEnabled && (
            <button
              className={`export-button ${isCsvExporting ? "exporting" : "normal"}`}
              onClick={handleCsvExport}
              disabled={isCsvExporting}
              title={isCsvExporting ? "Export in progress" : "Download CSV"}
            >
              <span className="download-icon">
                <IconDownload />
              </span>
              <span>{isCsvExporting ? "Exporting..." : csvExportButtonLabel || "Download CSV"}</span>
            </button>
          )}
          {tableTopComponent || null}
        </div>
      </div>

      {/* ── Table Scroll Wrapper ─────────────────────────────────────────── */}
      <div
        ref={tref}
        className={`table-content-wrapper ${customTableWrapperClassName}`}
        style={{
          ...(tref.current && tref.current.offsetWidth < tref.current.scrollWidth ? inboxStyles : {}),
        }}
      >
        <table
          className={`table-content ${className}${tableClass ? " " + tableClass : ""}`}
          {...getTableProps()}
          style={{ ...styles }}
          ref={tableRef}
        >
          {/* ── Head ────────────────────────────────────────────────────── */}
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} className="tr">
                {showAutoSerialNo && <th className="th-s-no">{typeof showAutoSerialNo === "string" ? t(showAutoSerialNo) : t("TB_SNO")}</th>}

                {headerGroup.headers.map((column) => {
                  const isSorted = column.isSorted;
                  const headerProps = column.getHeaderProps(column.getSortByToggleProps());
                  const textAlign = getColumnAlign(column);
                  const mergedStyle = {
                    ...(headerProps.style || {}),
                    cursor: column.canSort ? "pointer" : "default",
                    background: isSorted ? T.accentLight : T.surfaceAlt,
                    textAlign,
                  };

                  return (
                    <th {...headerProps} title={column.canSort ? "Click to sort" : ""} className="th" style={mergedStyle}>
                      <div className="col-head-wrapper" style={{ justifyContent: getFlexJustifyFromAlign(textAlign) }}>
                        <span className={`col-head ${isSorted ? "accentDark" : "textSecondary"}`}>{column.render("Header")}</span>
                        {column.canSort && (
                          <span style={{ lineHeight: 0, color: isSorted ? T.accent : "rgb(7, 8, 9)" }}>
                            {isSorted ? column.isSortedDesc ? <IconSortDesc /> : <IconSortAsc /> : <IconSortNeutral />}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <tbody {...getTableBodyProps()}>
            {isLoading ? (
              <tr>
                <td colSpan={tableColumns.length + (showAutoSerialNo ? 1 : 0)} style={{ padding: "80px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        border: `3px solid ${T.borderStrong}`,
                        borderTop: `3px solid ${T.accent}`,
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textSecondary, letterSpacing: "0.02em" }}>
                      {t ? t("CS_LOADING") : "Loading records..."}
                    </p>
                  </div>
                  <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  `}</style>
                </td>
              </tr>
            ) : page.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length + (showAutoSerialNo ? 1 : 0)} style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <LayoutGrid />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: T.textMuted }}>{t ? t("CS_NO_DATA") : "No records found"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              page.map((row, i) => {
                prepareRow(row);
                const isHovered = hoveredRow === i;
                return (
                  <tr
                    {...row.getRowProps()}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isHovered ? T.surfaceHover : i % 2 === 0 ? T.surface : T.surfaceAlt,
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.12s",
                      height: DEFAULT_ROW_HEIGHT,
                    }}
                  >
                    {showAutoSerialNo && (
                      <td style={{ padding: "12px 8px", textAlign: "center", verticalAlign: "middle" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 22,
                            height: 22,
                            background: T.border,
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.textMuted,
                            fontFamily: T.fontMono,
                          }}
                        >
                          {pageIndex * pageSize + i + 1}
                        </span>
                      </td>
                    )}
                    {row.cells.map((cell) => {
                      const cellProps = getCellProps ? getCellProps(cell) : {};
                      const cellStyleFromProps = cellProps?.style || {};
                      const textAlign = normalizeTextAlign(cellStyleFromProps.textAlign, getColumnAlign(cell.column));
                      const renderedCell = cell.attachment_link ? (
                        <a
                          href={cell.attachment_link}
                          style={{ color: T.accent, textDecoration: "none", fontWeight: 500, borderBottom: `1px solid ${T.accentMid}` }}
                        >
                          {cell.render("Cell")}
                        </a>
                      ) : (
                        cell.render("Cell")
                      );
                      return (
                        <td
                          {...cell.getCellProps([cellProps])}
                          style={{
                            padding: "12px 14px",
                            verticalAlign: "middle",
                            fontSize: 13.5,
                            color: T.textPrimary,
                            lineHeight: 1.45,
                            whiteSpace: "nowrap",
                            ...cellStyleFromProps,
                            textAlign,
                          }}
                        >
                          {renderedCell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination — original logic, modernised UI ───────────────────── */}
      {isPaginationRequired && (
        <div style={{ borderTop: `1px solid ${T.border}`, borderRadius: "0 0 12px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              padding: "12px 16px",
              background: T.surfaceAlt,
              flexWrap: "wrap",
              fontFamily: T.fontBody,
              color: T.textSecondary,
            }}
          >
            {/* Rows per page */}
            <span style={{ fontSize: 12, color: T.textMuted, whiteSpace: "nowrap" }}>{t ? t("CS_COMMON_ROWS_PER_PAGE") : "Rows per page"} :</span>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                value={pageSize}
                onChange={manualPagination ? onPageSizeChange : (e) => setPageSize(Number(e.target.value))}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: T.surface,
                  border: `1.5px solid ${T.borderStrong}`,
                  borderRadius: 5,
                  padding: "5px 26px 5px 9px",
                  fontSize: 12.5,
                  fontFamily: T.fontBody,
                  fontWeight: 600,
                  color: T.textPrimary,
                  cursor: "pointer",
                  outline: "none",
                  marginRight: 8,
                }}
              >
                {[10, 20, 30, 40, 50].map((ps) => (
                  <option key={ps} value={ps}>
                    {ps}
                  </option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 15, pointerEvents: "none", lineHeight: 0, color: T.textMuted }}>
                <ChevronDown />
              </span>
            </div>

            {/* Record range — original display logic */}
            <span style={{ fontSize: 12.5 }}>
              <strong style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.textPrimary, fontSize: 12 }}>
                {Number.isNaN(pageIndex * pageSize + 1) ? 0 : pageIndex * pageSize + 1}
              </strong>
              {"–"}
              <strong style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.textPrimary, fontSize: 12 }}>
                {Number.isNaN(rangeEnd) ? 0 : rangeEnd}
              </strong>{" "}
              {totalLabel}
            </span>

            {/* ── Navigation — original conditions, modernised buttons ─────── */}
            {/* First page */}
            {!manualPagination && pageIndex !== 0 && (
              <PagBtn title="First page" onClick={() => gotoPage(0)}>
                <ArrowToFirst />
              </PagBtn>
            )}
            {canPreviousPage && manualPagination && onFirstPage && (
              <PagBtn title="First page" onClick={() => onFirstPage()}>
                <ArrowToFirst />
              </PagBtn>
            )}

            {/* Previous */}
            {canPreviousPage && (
              <PagBtn title="Previous page" onClick={() => (manualPagination ? onPrevPage() : previousPage())}>
                <ArrowBack />
              </PagBtn>
            )}

            {/* Next */}
            {canNextPage && (
              <PagBtn title="Next page" onClick={() => (manualPagination ? onNextPage() : nextPage())}>
                <ArrowForward />
              </PagBtn>
            )}

            {/* Last page */}
            {!manualPagination && pageIndex !== pageCount - 1 && (
              <PagBtn title="Last page" onClick={() => gotoPage(pageCount - 1)}>
                <ArrowToLast />
              </PagBtn>
            )}
            {rows.length === pageSizeLimit && canNextPage && manualPagination && onLastPage && (
              <PagBtn title="Last page" onClick={() => onLastPage()}>
                <ArrowToLast />
              </PagBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
