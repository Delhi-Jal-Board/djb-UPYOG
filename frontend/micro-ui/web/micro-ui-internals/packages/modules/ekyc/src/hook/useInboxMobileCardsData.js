import { RadioButtons, SearchField } from "@djb25/digit-ui-react-components";
import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const useInboxMobileCardsData = ({ table, tenantId }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [selectedKno, setSelectedKno] = useState("");
  const { data: reviewData, getReview } = Digit.Hooks.ekyc.useEkycAPI("review", tenantId);
  const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";

  React.useEffect(() => {
    if (reviewData) {
      history.push(`/digit-ui/${userType}/ekyc/review/${selectedKno}`, { aadhaarData: reviewData?.aadhaarData, reviewData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewData]);

  const handleReview = (kno) => {
    setSelectedKno(kno);
    getReview({ kno });
  };

  const dataForMobileInboxCards = table?.map((item) => {
    const kno = item.kno || item.applicationNumber || "NA";
    const status = (item.status || "DEFAULT").toUpperCase();
    const ekycStatus = (item.ekycStatus || item.ekycstatus || "NA").toUpperCase();

    return {
      [t("EKYC_APPLICATION_NO")]: (
        <span className="link" onClick={() => handleReview(kno)}>
          {kno}
        </span>
      ),
      [t("EKYC_CITIZEN_NAME")]: item.citizenName || "NA",
      [t("EKYC_STATUS")]: <span className={`ekyc-status-tag ${status}`}>{t(`${status}`)}</span>,
      [t("SUBMITTED_AT")]: item.submittedAt ? Digit.DateUtils.ConvertEpochToDate(item.submittedAt) : "-",
      [t("ASSIGNED_AT")]: item.assignedAt ? Digit.DateUtils.ConvertEpochToDate(item.assignedAt) : "-",
      [t("EKYC_EKYC_STATUS")]: <span className={`ekyc-status-tag ${ekycStatus}`}>{t(`${ekycStatus}`)}</span>,
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
    serviceRequestIdKey: "applicationNo",
    MobileSortFormValues,
  };
};

export default useInboxMobileCardsData;
