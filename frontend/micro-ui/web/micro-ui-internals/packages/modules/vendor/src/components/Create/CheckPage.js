import {
  Card,
  CardHeader,
  CardSubHeader,
  CheckBox,
  LinkButton,
  Row,
  StatusTable,
  SubmitBar,
  VerticalTimeline,
} from "@djb25/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
//import { VendorData } from "../../../utils"
import { checkForNA } from "../../utils";

const ActionButton = ({ jumpTo }) => {
  const { t } = useTranslation();
  const history = useHistory();
  function routeTo() {
    history.push(jumpTo);
  }

  return <LinkButton label={t("CS_COMMON_CHANGE")} className="check-page-link-button" onClick={routeTo} />;
};

const CheckPage = ({ onSubmit, value = {} }) => {
  const { t } = useTranslation();

  const { vendordet, documents } = value;
  const [agree, setAgree] = useState(false);
  const setdeclarationhandler = () => {
    setAgree(!agree);
  };

  const openFilePDF = (fileId) => {
    if (!fileId) {
      console.error("fileId is null or undefined!");
      return;
    }

    Digit.UploadServices.Filefetch([fileId], Digit.ULBService.getStateId()).then((res) => {
      const concatenatedUrls = res?.data?.fileStoreIds?.[0]?.url;

      if (concatenatedUrls) {
        const urlArray = concatenatedUrls.split(",");
        const fileUrl = urlArray[0];

        if (fileUrl) {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        console.error("URL missing in response. Full res:", res);
      }
    });
  };

  return (
    <React.Fragment>
      {window.location.href.includes("/employee") ? (
        <VerticalTimeline
          config={[
            { timeLine: [{ actions: t("VENDOR_ADDITIONAL_DETAILS"), currentStep: 1 }] },
            { timeLine: [{ actions: t("VENDOR_DOCUMENT_DETAILS"), currentStep: 2 }] },
            { timeLine: [{ actions: t("VENDOR_SUMMARY"), currentStep: 3 }] },
          ]}
          currentActiveIndex={2}
          showFinalStep={false}
        />
      ) : null}
      <div style={{ flex: "1", overflowY: "auto", marginBottom: "20px" }}>
        <Card>
          <CardHeader>{t("VENDOR_CHECK_DETAILS")}</CardHeader>
          <div>
            <br />

            <CardSubHeader>{t("VENDOR_ADDITIONAL_DETAILS")}</CardSubHeader>

            <StatusTable>
              <React.Fragment>
                <Row
                  label={t("VENDOR_ID")}
                  text={`${t(checkForNA(vendordet?.VendorId))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("VENDOR_BANK_IFSC_CODE")}
                  text={`${t(checkForNA(vendordet?.IFSC))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("VENDOR_BANK_NAME")}
                  text={`${t(checkForNA(vendordet?.Bank))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("VENDOR_BANK_BRANCH")}
                  text={`${t(checkForNA(vendordet?.BankbranchName))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("VENDOR_MICR_NO")}
                  text={`${t(checkForNA(vendordet?.micrNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("BANK_ACCONT_NO")}
                  text={`${t(checkForNA(vendordet?.AccountNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                {/* <Row
                label={t("PHONE_NO")}
                text={`${t(checkForNA(vendordet?.AccountNo))}`}
                actionButton={<ActionButton jumpTo={`/digit-ui/employee/vendor/registry/additionaldetails/modify-details`} />}
              />

              <Row
                label={t("CONTACT_PERSON")}
                text={`${t(checkForNA(vendordet?.AccountNo))}`}
                actionButton={<ActionButton jumpTo={`/digit-ui/employee/vendor/registry/additionaldetails/modify-details`} />}
              />

              <Row
                label={t("COMPANY_NAME")}
                text={`${t(checkForNA(vendordet?.AccountNo))}`}
                actionButton={<ActionButton jumpTo={`/digit-ui/employee/vendor/registry/additionaldetails/modify-details`} />}
              /> */}

                <Row
                  label={t("PAN_NO")}
                  text={`${t(checkForNA(vendordet?.PanNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("GST_NO")}
                  text={`${t(checkForNA(vendordet?.GstNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("GST_REGISTERED_STATE/UT")}
                  text={`${t(checkForNA(vendordet?.GstState))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                <Row
                  label={t("REGISTRATION_NO")}
                  text={`${t(checkForNA(vendordet?.RegistrationNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                <Row
                  label={t("EPF_NO")}
                  text={`${t(checkForNA(vendordet?.EpfNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                <Row
                  label={t("ESI_NO")}
                  text={`${t(checkForNA(vendordet?.EsiNo))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                <Row
                  label={t("VENDOR_TYPE")}
                  text={`${t(checkForNA(vendordet?.VendorType?.code))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                <Row
                  label={t("VENDOR_CATEGORY")}
                  text={`${t(checkForNA(vendordet?.VendorCategory?.code))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />

                <Row
                  label={t("VENDOR_STATUS")}
                  text={`${t(checkForNA(vendordet?.Status?.code))}`}
                  actionButton={
                    <ActionButton
                      jumpTo={`/digit-ui/${
                        window.location.pathname.includes("/citizen") ? "citizen" : "employee"
                      }/vendor/registry/additionaldetails/modify-details`}
                    />
                  }
                />
                {/* {formJson.map((row, index) => (
                <Row
                  key={index}
                  label={t(row.code)}
                  text={`${extractValue(row.name)}`}
                  actionButton={<ActionButton jumpTo={`/digit-ui/${window.location.pathname.includes("/citizen") ? "citizen" : "employee"}/vendor/registry/additionaldetails/modify-details`} />}
                />
              ))} */}
              </React.Fragment>
            </StatusTable>

            <br />
            <CardSubHeader>{t("VENDOR_DOCUMENTS_DETAILS")}</CardSubHeader>

            <StatusTable>
              <StatusTable>
                <Row
                  label={t("VENDOR_DOCUMENTS")}
                  text={
                    documents?.documents?.length > 0
                      ? documents.documents.map((doc, index) => (
                          <div key={index}>
                            <span
                              style={{
                                color: "#5a6ee1",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={() => openFilePDF(doc?.filestoreId)} // ← fix here
                            >
                              {t(doc.documentType)}
                            </span>
                          </div>
                        ))
                      : t("CS_NA")
                  }
                />
              </StatusTable>
            </StatusTable>

            <br />

            <CheckBox
              label={t("AST_FINAL_DECLARATION_MESSAGE")}
              onChange={setdeclarationhandler}
              styles={{ height: "auto" }}
              checked={agree}
              //disabled={!agree}
            />
          </div>
          <br />
          <div className="formcomposer-section-button">
            <SubmitBar label={t("COMMON_BUTTON_SUBMIT")} onSubmit={onSubmit} disabled={!agree} />
          </div>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default CheckPage;
