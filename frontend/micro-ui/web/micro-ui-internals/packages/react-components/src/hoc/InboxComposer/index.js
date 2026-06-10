import React, { useCallback, useEffect, useReducer } from "react";
import InboxLinks from "../../atoms/InboxLinks";
import Table from "../../atoms/Table";
import { SearchForm } from "../../molecules/SearchForm";
import { FilterForm } from "../../molecules/FilterForm";
import SubmitBar from "../../atoms/SubmitBar";
import { useTranslation } from "react-i18next";
import Card from "../../atoms/Card";
import { Loader } from "../../atoms/Loader";
import { useForm } from "react-hook-form";
import SearchAction from "../../molecules/SearchAction";
import FilterAction from "../../molecules/FilterAction";
import SortAction from "../../molecules/SortAction";
import DetailsCard from "../../molecules/DetailsCard";
import PopUp from "../../atoms/PopUp";
import MobileComponentDirectory from "./MobileComponentDirectory";
import SummaryCards from "./SummaryCards";

const InboxComposer = ({
  isInboxLoading,
  PropsForInboxLinks,
  SearchFormFields,
  searchFormDefaultValues,
  onSearchFormSubmit,
  onSearchFormReset,
  FilterFormFields,
  filterFormDefaultValues,
  propsForInboxTable,
  propsForInboxMobileCards,
  onFilterFormSubmit,
  onFilterFormReset,
  // resetSearchFormDefaultValues,
  // resetFilterFormDefaultValues,
  onMobileSortOrderData,
  sortFormDefaultValues,
  onSortFormReset,
  formState: inboxFormState,
  cards,
  searchParams,
  isCardLoading,
}) => {
  const { t } = useTranslation();

  function activateModal(state, action) {
    switch (action.type) {
      case "set":
        return action.payload;
      case "remove":
        return false;
      default:
        break;
    }
  }

  const [currentlyActiveMobileModal, setActiveMobileModal] = useReducer(activateModal, false);

  const closeMobilePopupModal = () => {
    setActiveMobileModal({ type: "remove" });
  };

  const {
    register: registerSearchFormField,
    control: controlSearchForm,
    handleSubmit: handleSearchFormSubmit,
    setValue: setSearchFormValue,
    reset: resetSearchForm,
    formState: searchFormState,
    clearErrors: clearSearchFormErrors,
  } = useForm({
    defaultValues: { ...searchFormDefaultValues },
  });

  const {
    register: registerFilterFormField,
    control: controlFilterForm,
    handleSubmit: handleFilterFormSubmit,
    setValue: setFilterFormValue,
    getValues: getFilterFormValue,
    reset: resetFilterForm,
  } = useForm({
    defaultValues: { ...filterFormDefaultValues },
  });

  const onResetFilterForm = () => {
    onFilterFormReset(setFilterFormValue);
  };

  const onResetSearchForm = () => {
    onSearchFormReset(setSearchFormValue);
    clearSearchFormErrors();
    closeMobilePopupModal();
  };

  useEffect(() => {
    if (resetFilterForm && resetSearchForm && inboxFormState) {
      resetFilterForm(inboxFormState?.filterForm);
      resetSearchForm(inboxFormState?.searchForm);
    }
  }, [inboxFormState, resetSearchForm, resetFilterForm]);

  const isMobile = window.Digit.Utils.browser.isMobile();

  const CurrentMobileModalComponent = useCallback(
    ({ ...props }) => {
      if (!isMobile || !currentlyActiveMobileModal) return null;
      return MobileComponentDirectory[currentlyActiveMobileModal]({ ...props });
    },
    [currentlyActiveMobileModal, isMobile]
  );

  if (isMobile) {
    const propsForCurrentMobileModalComponent = {
      SearchFormFields,
      FilterFormFields,
      registerSearchFormField,
      searchFormState,
      handleSearchFormSubmit,
      onResetSearchForm,
      registerFilterFormField,
      onResetFilterForm,
      controlFilterForm,
      handleFilterFormSubmit,
      setFilterFormValue,
      getFilterFormValue,
      closeMobilePopupModal,
      onSearchFormSubmit,
      onFilterFormSubmit,
      onMobileSortOrderData,
      sortFormDefaultValues,
      onSortFormReset,
      MobileSortFormValues: propsForInboxMobileCards?.MobileSortFormValues,
      t,
    };

    const getSearchActionText = () => {
      if (window.location.href.includes("/obps")) {
        return t("ES_INBOX_COMMON_SEARCH");
      } else {
        return t("ES_COMMON_SEARCH");
      }
    };

    return (
      <div className="InboxComposerWrapper">
        {/* TODO fix design for card */}
        {/* <InboxLinks {...PropsForInboxLinks} /> */}
        <div className="searchBox">
          <SearchAction
            text={getSearchActionText()}
            handleActionClick={() => setActiveMobileModal({ type: "set", payload: "SearchFormComponent" })}
          />
          <FilterAction
            text={t("ES_COMMON_FILTER")}
            handleActionClick={() => setActiveMobileModal({ type: "set", payload: "FilterFormComponent" })}
          />
          <SortAction text={t("COMMON_TABLE_SORT")} handleActionClick={() => setActiveMobileModal({ type: "set", payload: "SortFormComponent" })} />
        </div>
        {currentlyActiveMobileModal ? (
          <PopUp>
            <CurrentMobileModalComponent {...propsForCurrentMobileModalComponent} />
          </PopUp>
        ) : null}
        {/* {isInboxLoading ? <Loader /> : <DetailsCard {...propsForInboxMobileCards} />} */}
        {isInboxLoading ? (
          <Loader />
        ) : (
          <div>
            {propsForInboxMobileCards?.data?.length < 1 ? (
              <Card className="margin-unset text-align-center">
                {propsForInboxTable?.noResultsMessage ? t(propsForInboxTable?.noResultsMessage) : t("CS_MYAPPLICATIONS_NO_APPLICATION")}
              </Card>
            ) : (
              <DetailsCard {...propsForInboxMobileCards} />
            )}
          </div>
        )}
      </div>
    );
  }

  const isEnabledCommonModules = window.location.href.includes("/obps/") || window.location.href.includes("/noc/");

  const isEnabledWSCommonModules =
    window.location.href.includes("/ws/water/inbox") ||
    window.location.href.includes("/ws/sewerage/inbox") ||
    window.location.href.includes("/ws/water/bill-amendment/inbox") ||
    window.location.href.includes("/ws/sewerage/bill-amendment/inbox");

  if (isEnabledCommonModules) {
    return (
      <div className="inbox-container">
        <div className="filters-container">
          <InboxLinks {...PropsForInboxLinks} />
          <div>
            <FilterForm onSubmit={onFilterFormSubmit} handleSubmit={handleFilterFormSubmit} id="filter-form" onResetFilterForm={onResetFilterForm}>
              <FilterFormFields
                registerRef={registerFilterFormField}
                {...{ controlFilterForm, handleFilterFormSubmit, setFilterFormValue, getFilterFormValue }}
              />
            </FilterForm>
          </div>
        </div>
        <div style={propsForInboxTable?.tableStyle ? { flex: 1, ...propsForInboxTable?.tableStyle } : { flex: 1 }}>
          {Array.isArray(cards) && cards.length && (
            <SummaryCards
              cards={cards}
              searchParams={searchParams}
              t={t}
              isLoading={isCardLoading}
              onCardClick={(card) => {
                /* your filter handler */
              }}
            />
          )}
          <SearchForm onSubmit={onSearchFormSubmit} handleSubmit={handleSearchFormSubmit} id="search-form" className="search-complaint-container">
            <div className="formcomposer-section-grid">
              <SearchFormFields
                registerRef={registerSearchFormField}
                searchFormState={searchFormState}
                {...{ controlSearchForm }}
                searchFieldComponents={
                  <div style={window.location.href.includes("/citizen/obps") ? { display: "flex" } : {}}>
                    <SubmitBar label={t("ES_COMMON_SEARCH")} submit form="search-form" className="submit-bar-search" />
                    <p onClick={onResetSearchForm} className="clear-search" style={{ paddingTop: "9px", color: " #a82227" }}>
                      {t(`ES_COMMON_CLEAR_SEARCH`)}
                    </p>
                  </div>
                }
              />
            </div>
          </SearchForm>
          <div className="result" style={{ marginLeft: "24px", flex: 1 }}>
            {isInboxLoading ? (
              <Loader />
            ) : (
              <div>
                {propsForInboxTable?.data?.length < 1 ? (
                  <Card className="margin-unset text-align-center">
                    {propsForInboxTable.noResultsMessage ? t(propsForInboxTable.noResultsMessage) : t("CS_MYAPPLICATIONS_NO_APPLICATION")}
                  </Card>
                ) : (
                  <Table t={t} {...propsForInboxTable} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isEnabledWSCommonModules) {
    return (
      <div className="inbox-container">
        <div className="side-panel-item">
          <InboxLinks {...PropsForInboxLinks} />
          <FilterForm onSubmit={onFilterFormSubmit} handleSubmit={handleFilterFormSubmit} id="filter-form" onResetFilterForm={onResetFilterForm}>
            <FilterFormFields
              registerRef={registerFilterFormField}
              {...{ controlFilterForm, handleFilterFormSubmit, setFilterFormValue, getFilterFormValue }}
            />
          </FilterForm>
        </div>
        <div className="employee-form-content">
          {Array.isArray(cards) && cards.length && (
            <SummaryCards
              cards={cards}
              searchParams={searchParams}
              t={t}
              onCardClick={(card) => {
                /* your filter handler */
              }}
            />
          )}
          <SearchForm onSubmit={onSearchFormSubmit} handleSubmit={handleSearchFormSubmit} id="search-form" className="search-complaint-container">
            <div className="formcomposer-section-grid">
              <SearchFormFields registerRef={registerSearchFormField} searchFormState={searchFormState} {...{ controlSearchForm }} />
            </div>
            <div className="formcomposer-section-button">
              <div className="generic-button clear-search">
                <p onClick={onResetSearchForm}>{t(`ES_COMMON_CLEAR_SEARCH`)}</p>
              </div>
              <SubmitBar className="generic-button" label={t("ES_COMMON_SEARCH")} submit form="search-form" />
            </div>
          </SearchForm>

          {isInboxLoading ? (
            <Loader />
          ) : (
            <div className="result">
              <div style={{ background: "#fff", height: "inherit", borderRadius: "12px" }}>
                {propsForInboxTable?.data?.length < 1 ? (
                  <Card className="margin-unset text-align-center inboxLinks">
                    {propsForInboxTable.noResultsMessage ? t(propsForInboxTable.noResultsMessage) : t("CS_MYAPPLICATIONS_NO_APPLICATION")}
                  </Card>
                ) : (
                  <Table t={t} {...propsForInboxTable} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-container">
      <div className="side-panel-item">
        <InboxLinks {...PropsForInboxLinks} />

        <FilterForm onSubmit={onFilterFormSubmit} handleSubmit={handleFilterFormSubmit} id="filter-form" onResetFilterForm={onResetFilterForm}>
          <FilterFormFields
            registerRef={registerFilterFormField}
            {...{ controlFilterForm, handleFilterFormSubmit, setFilterFormValue, getFilterFormValue }}
          />
          {/* <SubmitBar label={t("ES_COMMON_SEARCH")} submit form="filter-form"/> */}
        </FilterForm>
      </div>
      <div className="employee-form-content">
        {Array.isArray(cards) && cards.length && (
          <SummaryCards
            cards={cards}
            searchParams={searchParams}
            t={t}
            onCardClick={(card) => {
              /* your filter handler */
            }}
          />
        )}
        <SearchForm onSubmit={onSearchFormSubmit} handleSubmit={handleSearchFormSubmit} id="search-form" className="search-complaint-container">
          <div className="formcomposer-section-grid">
            <SearchFormFields registerRef={registerSearchFormField} searchFormState={searchFormState} {...{ controlSearchForm }} />
          </div>
          <div className="formcomposer-section-button">
            <div className="generic-button clear-search">
              <p onClick={onResetSearchForm}>{t(`ES_COMMON_CLEAR_SEARCH`)}</p>
            </div>
            <SubmitBar className="generic-button" label={t("ES_COMMON_SEARCH")} submit form="search-form" />
          </div>
        </SearchForm>
        {isInboxLoading ? (
          <Loader />
        ) : propsForInboxTable?.data?.length < 1 ? (
          <Card className="margin-unset text-align-center">
            {propsForInboxTable.noResultsMessage ? t(propsForInboxTable.noResultsMessage) : t("CS_MYAPPLICATIONS_NO_APPLICATION")}
          </Card>
        ) : (
          <Table t={t} {...propsForInboxTable} />
        )}
      </div>
    </div>
  );
};

export default InboxComposer;
