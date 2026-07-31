// import { Card, CardHeader, CardSubHeader, CardText, Loader, SubmitBar } from "@djb25/digit-ui-react-components";
// import React, { useEffect } from "react";
// import { cardBodyStyle, stringReplaceAll } from "../utils";
// //import { map } from "lodash-es";

// const ServiceDoc = ({ t, config, onSelect, userType, formData }) => {
//   const tenantId = Digit.ULBService.getCurrentTenantId();
//   const stateId = Digit.ULBService.getStateId();
//   sessionStorage.removeItem("docReqScreenByBack");

//   const docType = config?.isMutation ? ["MutationDocuments"] : "Documents";

//   const { isLoading, data: Documentsob = {} } = Digit.Hooks.asset.useAssetDocumentsMDMS(stateId, "ASSET", docType);
//   let docs = Documentsob?.ASSET?.Documents;

//   //vendor info
//   //const {isLoading, data: Documentsob = {} } = Digit.Hooks.vendor.useVendorDocumentsMDMS(stateId, "VENDOR", docType);
//   //let docs = Documentsob?.VENDOR?.Documents;
//   function onSave() {}

//   function goNext() {
//     onSelect();
//   }

//   return (
//     <React.Fragment>
//       <Card>
//         <div>
//           <CardSubHeader>{t("AST_REQ_SCREEN_LABEL")}</CardSubHeader>

//           <CardText style={{ color: "red" }}>{t("AST_DOCUMENT_ACCEPTED_PDF_JPG_PNG")}</CardText>

//           <div>
//             {isLoading && <Loader />}
//             {Array.isArray(docs)
//               ? config?.isMutation
//                 ? docs.map(({ code, dropdownData }, index) => (
//                     <div key={index}>
//                       <CardSubHeader>
//                         {index + 1}. {t(code)}
//                       </CardSubHeader>
//                       <CardText className={"primaryColor"}>{dropdownData.map((dropdownData) => t(dropdownData?.code)).join(", ")}</CardText>
//                     </div>
//                   ))
//                 : docs.map(({ code, dropdownData }, index) => (
//                     <div key={index}>
//                       <CardSubHeader>
//                         {index + 1}. {t(stringReplaceAll(code, ".", "_"))}
//                       </CardSubHeader>
//                       {dropdownData.map((dropdownData, dropdownIndex) => (
//                         <CardText className={"primaryColor"}>
//                           {`${dropdownIndex + 1}`}. {t(stringReplaceAll(dropdownData?.code, ".", "_"))}
//                         </CardText>
//                       ))}
//                     </div>
//                   ))
//               : null}
//           </div>
//         </div>
//         <span>
//           <SubmitBar label={t("COMMON_NEXT")} onSubmit={onSelect} />
//         </span>
//       </Card>
//     </React.Fragment>
//   );
// };

// export default ServiceDoc;

import React from "react";
import { ActionBar, Card, Loader, SubmitBar } from "@djb25/digit-ui-react-components";
import { stringReplaceAll } from "../utils";

const ServiceDoc = ({ t, config, onSelect }) => {
  // const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();

  const docType = config?.isMutation ? ["MutationDocuments"] : "Documents";

  const { isLoading, data: Documentsob = {} } = Digit.Hooks.asset.useAssetDocumentsMDMS(stateId, "ASSET", docType);

  let docs = Documentsob?.ASSET?.Documents;

  const onSubmit = () => {
    onSelect(config.key, {});
  };

  return (
    <div className="employee-form-content">
      {isLoading && <Loader />}

      {Array.isArray(docs) &&
        docs.map(({ code, dropdownData }, index) => (
          <Card key={index}>
            {/* Header */}
            <div>
              <h3 style={{ margin: 0 }}>
                {index + 1}. {t(stringReplaceAll(code, ".", "_"))}
              </h3>
            </div>

            {/* List */}
            {dropdownData.map((dropdownData, dropdownIndex) => (
              <div
                key={dropdownIndex}
                style={{
                  paddingLeft: "10px",
                  marginBottom: "6px",
                  fontSize: "14px",
                }}
              >
                {dropdownIndex + 1}. {t(stringReplaceAll(dropdownData?.code, ".", "_"))}
              </div>
            ))}
          </Card>
        ))}
      <ActionBar>
        <SubmitBar label={t("COMMON_NEXT")} onSubmit={onSubmit} />
      </ActionBar>
    </div>
  );
};

export default ServiceDoc;
