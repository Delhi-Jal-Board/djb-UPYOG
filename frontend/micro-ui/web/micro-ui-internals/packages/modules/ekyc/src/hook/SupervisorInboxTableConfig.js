import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tableColumnConfig } from "../../../vendor/src/config/tableConfig";

const SupervisorInboxTableConfig = ({
  onPageSizeChange,
  formState,
  totalCount,
  table,
  dispatch,
  onSortingByData,
  inboxStyles = {},
  tableStyle = {},
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";

  const handleReview = (id) => {
    history.push(`/digit-ui/${userType}/ekyc/assign/surveyor-details/${id}`);
  };

  const limit = formState?.tableForm?.limit || 10;
  const offset = formState?.tableForm?.offset || 0;

  return {
    disableSort: false,
    autoSort: false,
    manualPagination: true,

    currentPage: Math.floor(offset / limit),

    onPageSizeChange,

    onNextPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(offset) + Number(limit),
        },
      }),

    onPrevPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(offset) - Number(limit),
        },
      }),

    onLastPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Math.ceil(totalCount / limit) * limit - Number(limit),
        },
      }),

    onFirstPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: 0 },
      }),

    totalRecords: totalCount,
    onSort: onSortingByData,

    data: table,
    columns: tableColumnConfig(t, handleReview),

    inboxStyles: { ...inboxStyles },
    tableStyle: { ...tableStyle },
  };
};

export default SupervisorInboxTableConfig;
