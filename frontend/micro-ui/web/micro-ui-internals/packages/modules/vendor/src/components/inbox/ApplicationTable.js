import React from "react";
import { Table, Card } from "@djb25/digit-ui-react-components";

const ApplicationTable = ({
  className = "table",
  t,
  currentPage,
  columns,
  data,
  getCellProps,
  disableSort,
  onSort,
  onNextPage,
  onPrevPage,
  onPageSizeChange,
  pageSizeLimit,
  sortParams,
  totalRecords,
  isPaginationRequired,
  showCSVExport,
  csvExportFileName,
  csvExportData,
  getCSVExportData,
  csvExportColumns,
  csvExportButtonLabel,
  ...rest
}) => {
  return (
    <Card>
      <Table
        className={className}
        t={t}
        data={data}
        currentPage={currentPage}
        columns={columns}
        getCellProps={getCellProps}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        pageSizeLimit={pageSizeLimit}
        disableSort={disableSort}
        onPageSizeChange={onPageSizeChange}
        onSort={onSort}
        sortParams={sortParams}
        totalRecords={totalRecords}
        isPaginationRequired={isPaginationRequired}
        showCSVExport={showCSVExport}
        csvExportFileName={csvExportFileName}
        csvExportData={csvExportData}
        getCSVExportData={getCSVExportData}
        csvExportColumns={csvExportColumns}
        csvExportButtonLabel={csvExportButtonLabel}
        {...rest}
      />
    </Card>
  );
};

export default ApplicationTable;
