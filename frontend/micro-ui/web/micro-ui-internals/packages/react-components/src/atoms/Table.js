import React, { useEffect, useRef, useState } from "react";
import { useGlobalFilter, usePagination, useRowSelect, useSortBy, useTable } from "react-table";
import {
  ForwardIcon,
  FastBackward,
  Backward,
  ArrowToLast,
  ChevronDown,
  IconClose,
  IconDownload,
  IconSearch,
  IconSortAsc,
  IconSortDesc,
  IconSortNeutral,
  LayoutGrid,
  FastForward,
} from "./svgindex";

const getSearchableText = (obj) => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") return String(obj).toLowerCase();
  return Object.values(obj).map(getSearchableText).join(" ");
};

const VALID_TEXT_ALIGN = new Set(["left", "right", "center", "start", "end", "justify"]);
const DEFAULT_TEXT_ALIGN = "left";

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
const PagBtn = ({ onClick, disabled, title, children, active = false, isLoading }) => {
  return (
    <button onClick={onClick} disabled={disabled || isLoading} title={title} className={`page-btn ${active ? "active" : ""}`}>
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
  onSort = () => {},
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
    state: { pageIndex = 0, pageSize = 20, sortBy, globalFilter },
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
                    background: isSorted ? "#eff6ff" : "#f8fafc",
                    textAlign,
                  };

                  return (
                    <th {...headerProps} title={column.canSort ? "Click to sort" : ""} className="th" style={mergedStyle}>
                      <div className="col-head-wrapper" style={{ justifyContent: getFlexJustifyFromAlign(textAlign) }}>
                        <span className={`col-head ${isSorted ? "accentDark" : "textSecondary"}`}>{column.render("Header")}</span>
                        {column.canSort && (
                          <span style={{ lineHeight: 0, color: isSorted ? "#5282e6" : "rgb(7, 8, 9)" }}>
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
                <td colSpan={tableColumns.length + (showAutoSerialNo ? 1 : 0)} className="table-state-cell">
                  <div className="table-loading">
                    <div className="table-loader" />
                    <p className="table-loading-text">{t ? t("CS_LOADING") : "Loading records..."}</p>
                  </div>
                </td>
              </tr>
            ) : page.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length + (showAutoSerialNo ? 1 : 0)} className="table-state-cell table-state-cell-empty">
                  <div className="table-empty">
                    <LayoutGrid />
                    <p className="table-empty-text">{t ? t("CS_NO_DATA") : "No records found"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {showAutoSerialNo && (
                      <td>
                        <span>{pageIndex * pageSize + i + 1}</span>
                      </td>
                    )}
                    {row.cells.map((cell) => {
                      const cellProps = getCellProps ? getCellProps(cell) : {};
                      const cellStyleFromProps = cellProps?.style || {};
                      const textAlign = normalizeTextAlign(cellStyleFromProps.textAlign, getColumnAlign(cell.column));
                      const renderedCell = cell.attachment_link ? (
                        <a
                          href={cell.attachment_link}
                          style={{ color: "#5282e6", textDecoration: "none", fontWeight: 500, borderBottom: `1px solid #bfdbfe` }}
                        >
                          {cell.render("Cell")}
                        </a>
                      ) : (
                        cell.render("Cell")
                      );
                      return (
                        <td {...cell.getCellProps([cellProps])} style={{ ...cellStyleFromProps, textAlign }}>
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
        <div className="table-pagination">
          <span className="page-size-label">{t ? t("CS_COMMON_ROWS_PER_PAGE") : "Rows per page"}:</span>

          <div className="page-size-wrapper">
            <select
              className="page-size-select"
              value={pageSize}
              onChange={manualPagination ? onPageSizeChange : (e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50].map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>

            <span className="page-size-icon">
              <ChevronDown />
            </span>
          </div>

          <div className="pagination-actions">
            {/* First page */}
            {!manualPagination && pageIndex !== 0 && (
              <PagBtn isLoading={isLoading} title="First page" onClick={() => gotoPage(0)}>
                <FastBackward />
              </PagBtn>
            )}
            {canPreviousPage && manualPagination && onFirstPage && (
              <PagBtn isLoading={isLoading} title="First page" onClick={() => onFirstPage()}>
                <FastBackward />
              </PagBtn>
            )}

            {/* Previous */}
            {canPreviousPage && (
              <PagBtn isLoading={isLoading} title="Previous page" onClick={() => (manualPagination ? onPrevPage() : previousPage())}>
                <Backward />
              </PagBtn>
            )}

            <span className="range-info">
              <strong>{Number.isNaN(pageIndex * pageSize + 1) ? 0 : pageIndex * pageSize + 1}</strong>-
              <strong>{Number.isNaN(rangeEnd) ? 0 : rangeEnd}</strong>
              {totalLabel}
            </span>

            {/* Next */}
            {canNextPage && (
              <PagBtn isLoading={isLoading} title="Next page" onClick={() => (manualPagination ? onNextPage() : nextPage())}>
                <ForwardIcon />
              </PagBtn>
            )}

            {/* Last page */}
            {!manualPagination && pageIndex !== pageCount - 1 && (
              <PagBtn isLoading={isLoading} title="Last page" onClick={() => gotoPage(pageCount - 1)}>
                <ArrowToLast />
              </PagBtn>
            )}
            {rows.length === pageSizeLimit && canNextPage && manualPagination && onLastPage && (
              <PagBtn isLoading={isLoading} title="Last page" onClick={() => onLastPage()}>
                <FastForward />
              </PagBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
