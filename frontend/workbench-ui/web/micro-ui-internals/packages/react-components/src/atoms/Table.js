import React, { useEffect, useRef, useState ,forwardRef} from "react";
import { useGlobalFilter, usePagination, useRowSelect, useSortBy, useTable } from "react-table";
import { 
  ArrowBack, ArrowForward, ArrowToFirst, ArrowToLast, SortDown, SortUp, DoubleTickIcon,
  IconSearch, IconClose, IconDownload, IconSortDesc, IconSortAsc, IconSortNeutral, 
  LayoutGrid, ChevronDown, FastBackward, Backward, ForwardIcon, FastForward
} from "./svgindex";
import CheckBox from "./CheckBox";
import ActionBar from "./ActionBar";
import SubmitBar from "./SubmitBar";
import Toast from "./Toast";

const noop = () => {};

const IndeterminateCheckbox = forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = useRef()
    const resolvedRef = ref || defaultRef

    useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate
    }, [resolvedRef, indeterminate])

    return (
      <React.Fragment>
        <CheckBox
          inputRef={resolvedRef}
          {...rest}       
        />
      </React.Fragment>
    )
  }
)
const getNoColumnBorder=(noColumnBorder)=>noColumnBorder?({
  cellspacing:"0" ,cellpadding:"0"
}):null;

const getSearchableText = (obj) => {
  if (!obj) return "";
  return Object.values(obj)
    .map(value => (typeof value === "object" && value !== null ? getSearchableText(value) : String(value || "")))
    .join(" ")
    .toLowerCase();
};

const flattenColumnsForExport = (columns) => {
  return (columns || []).reduce((acc, col) => {
    if (col.columns) {
      return [...acc, ...flattenColumnsForExport(col.columns)];
    }
    return [...acc, col];
  }, []);
};

const getColumnAlign = (column) => column?.align || "left";

const getFlexJustifyFromAlign = (align) => {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
};

const normalizeTextAlign = (cellAlign, colAlign) => cellAlign || colAlign || "left";

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

/* ─── Export Button ─────────────────────────────────────────────────────────── */
const ExportButton = ({ onClick, disabled, label, type, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 12px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      cursor: disabled ? "not-allowed" : "pointer",
      color: "#1e3a8a",
      fontWeight: "600",
      fontSize: "13px",
      opacity: disabled ? 0.7 : 1,
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      transition: "all 0.2s",
      height: "36px"
    }}
  >
    <div style={{
      background: type === "excel" ? "#dcfce7" : "#fee2e2",
      padding: "5px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {type === "excel" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#166534"/>
          <path d="M9.5 11L14.5 17M14.5 11L9.5 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#b91c1c"/>
          <path d="M10.5 15v-4h1.5a1.5 1.5 0 1 1 0 3h-1.5M10.5 15v1.5M14 11h-1.5v5.5h1.5a2.5 2.5 0 0 0 0-5.5zM17 11h-2.5v5.5M17 13.5h-2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
    <span style={{ paddingTop: "1px" }}>{label}</span>
  </button>
);

/* ─── Main Table ────────────────────────────────────────────────────────────── */
const Table = ({
  className = "table",
  tableClass = "",
  t,
  data = [],
  columns = [],
  getCellProps,
  getColumnProps,
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
  onSort = () => { },
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
  showPDFExport = false,
  pdfExportButtonLabel,
  onPdfExport,
  isLoading,
   isReportTable = false,
  showCheckBox = false,
  actionLabel = 'CS_COMMON_DOWNLOAD',
  tableSelectionHandler = () => {},
  onClickRow= ()=>{},
  rowClassName = "",
  noColumnBorder=false
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
      disableGlobalFilter: onSearch === false ? true : false,
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
    useRowSelect,
    hooks => {
      if(showCheckBox) {
        hooks.visibleColumns.push(columns => [
          {
            id: 'selection',
            Header: ({ getToggleAllPageRowsSelectedProps }) => (
              <div>
                <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
              </div>
            ),
            Cell: ({ row }) => (
              <div>
                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
              </div>
            ),
          },
          ...columns,
        ])
      }
    }
  );
  let isTotalColSpanRendered = false;
  const [toast, setToast] = useState({show : false, label : "", error : false});

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
          <div className="total-records">
            <span className="records">{totalRecords !== undefined ? totalRecords : (rows?.length || 0)}</span>
            <span className="title">{t ? t("CS_TOTAL_RECORDS") : "Total Records"}</span>
          </div>
        </div>

        {/* Right: internal search box + tableTopComponent */}
        <div className="search-box-wrapper" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {showPDFExport && (
            <ExportButton
              type="pdf"
              onClick={onPdfExport}
              label={pdfExportButtonLabel || "Download PDF"}
              title="Download PDF"
            />
          )}
          {isCsvExportEnabled && (
            <ExportButton
              type="excel"
              onClick={handleCsvExport}
              disabled={isCsvExporting}
              label={isCsvExporting ? "Exporting..." : csvExportButtonLabel || "Download Excel"}
              title={isCsvExporting ? "Export in progress" : "Download Excel"}
            />
          )}
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
                <td colSpan={tableColumns.length + (showAutoSerialNo ? 1 : 0)} className="table-state-cell rel">
                  <Loader />
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
                  <tr {...row.getRowProps()} onClick={() => onClickRow(row)} className={rowClassName}>
                    {showAutoSerialNo && (
                      <td>
                        <span>{pageIndex * pageSize + i + 1}</span>
                      </td>
                    )}
                    {row.cells.map((cell) => {
                      const additionalCellProps = getCellProps ? getCellProps(cell) : {};
                      const cellStyleFromProps = additionalCellProps?.style || {};
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
                      
                      const columnProps = typeof getColumnProps === "function" ? getColumnProps(cell.column) : {};
                      
                      return (
                        <td 
                          {...cell.getCellProps([
                            {
                              className: cell.column.customStyle,
                              style: { display: cell.column.disable ? "none" : "", ...cell.column.customStyle, ...cellStyleFromProps, textAlign },
                            },
                            columnProps,
                            additionalCellProps,
                          ])}
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