import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, SearchIconSvg, DatePicker, CardLabel } from "@djb25/digit-ui-react-components";

export const useCashPaymentDetails = (props, t) => {
  const config = [
    {
      head: t("NOC_PAYMENT_RCPT_DETAILS"),
      headId: "paymentInfo",
      body: [
        {
          withoutLabel: true,
          type: "custom",
          colSpan: "span 2",
          populators: {
            name: "ManualRecieptDetails",
            customProps: {},
            defaultValue: { manualReceiptNumber: "", manualReceiptDate: "" },
            component: (props, customProps) => <CashDetailsComponent {...customProps} onChange={props.onChange} value={props.value} />,
          },
        },
      ],
    },
  ];

  return { cashConfig: config };
};

const CashDetailsComponent = ({ ...props }) => {
  const { t } = useTranslation();
  const [manualReceiptDate, setManualReceiptDate] = useState(props?.value?.manualReceiptDate);
  const [manualReceiptNumber, setManualReceiptNumber] = useState(props?.value?.manualReceiptNumber);

  useEffect(() => {
    if (props.onChange) {
      let errorObj = {};
      if (!manualReceiptDate) errorObj.manualReceiptDate = "ES_COMMON_MANUAL_RECEIPT_DATE";
      if (!manualReceiptNumber) errorObj.manualReceiptNumber = "ES_COMMON_MANUAL_RECEIPT_NO";

      props.onChange({ manualReceiptNumber, manualReceiptDate, errorObj });
    }
  }, [manualReceiptDate, manualReceiptNumber]);

  return (
    <React.Fragment>
      <div className="formcomposer-section-grid">
        <div>
          <CardLabel>{t("NOC_PAYMENT_RCPT_NO_LABEL")}</CardLabel>
          <TextInput value={manualReceiptNumber} onChange={(e) => setManualReceiptNumber(e.target.value)} />
        </div>
        <div>
          <CardLabel>{t("NOC_PAYMENT_RECEIPT_ISSUE_DATE_LABEL")}</CardLabel>
          <DatePicker
            date={manualReceiptDate}
            onChange={(d) => {
              setManualReceiptDate(d);
            }}
          />
        </div>
      </div>
    </React.Fragment>
  );
};
