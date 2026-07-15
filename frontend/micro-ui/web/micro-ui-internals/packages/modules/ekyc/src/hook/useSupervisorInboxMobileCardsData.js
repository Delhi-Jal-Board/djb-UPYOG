import { RadioButtons, SearchField } from "@djb25/digit-ui-react-components";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const useSupervisorInboxMobileCardsData = ({ table }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";

  const handleReview = (id) => {
    history.push(`/digit-ui/${userType}/ekyc/assign/surveyor-details/${id}`);
  };

  const dataForMobileInboxCards = table?.map((item) => {
    const id = item.id;
    const status = item.status || "DEFAULT";

    return {
      [t("SURVEYOR_NAME")]: (
        <span className="link" onClick={() => handleReview(id)}>
          {item.surveyorName || item.name || "NA"}
        </span>
      ),
      [t("MOBILE_NUMBER")]: item.mobileNo || item.owner?.mobileNumber || "NA",
      [t("STATUS")]: <span className={`ekyc-status-tag ${status}`}>{t(status)}</span>,
      [t("SERVICE_TYPE")]: item.serviceType || "NA",
    };
  });

  const MobileSortFormValues = () => {
    const sortOrderOptions = [
      {
        code: "DESC",
        i18nKey: "ES_INBOX_DATE_LATEST_FIRST",
      },
      {
        code: "ASC",
        i18nKey: "ES_INBOX_DATE_LATEST_LAST",
      },
    ];
    const { control: controlSortForm } = useFormContext();
    return (
      <SearchField>
        <Controller
          name="sortOrder"
          control={controlSortForm}
          render={({ onChange, value }) => (
            <RadioButtons
              onSelect={(e) => {
                onChange(e.code);
              }}
              selectedOption={sortOrderOptions.filter((option) => option.code === value)[0]}
              optionsKey="i18nKey"
              name="sortOrder"
              options={sortOrderOptions}
            />
          )}
        />
      </SearchField>
    );
  };

  return {
    data: dataForMobileInboxCards,
    isTwoDynamicPrefix: true,
    getRedirectionLink: () => {},
    handleClickEnabled: false,
    serviceRequestIdKey: "id",
    MobileSortFormValues,
  };
};

export default useSupervisorInboxMobileCardsData;
