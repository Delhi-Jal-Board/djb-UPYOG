import React, { useEffect, useRef, useState } from "react";
import { Header, ResponseComposer, Loader, Modal, Card, KeyNote, SubmitBar, CitizenInfoLabel, Table } from "@djb25/digit-ui-react-components";
import PropTypes from "prop-types";
import { useHistory, Link, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import WaterConnectionDetailsModal from "../../../components/WaterConnectionDetailsModal";
const TYPE_REGISTER = { type: "register" };
const TYPE_LOGIN = { type: "login" };
const DEFAULT_USER = "digit-user";
const DEFAULT_REDIRECT_URL = "/digit-ui/citizen";

const PropertySearchResults = ({
  template,
  header,
  actionButtonLabel,
  isMutation,
  onSelect,
  config,
  clearParams = () => { },
  stateCode,
  redirectToUrl,
  searchQuery,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef();
  const { mobileNumber, propertyIds, oldPropertyIds, locality, city, tenantId: tId, doorNo, name, PToffset } = Digit.Hooks.useQueryParams();
  const filters = {};
  const [modalData, setShowModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterConnectionModalData, setWaterConnectionModalData] = useState(null);

  const PrivacyInfoLabel = Digit.ComponentRegistryService.getComponent("WSInfoLabel");

  let OfsetForSearch = PToffset;
  let t1;
  let off;
  if (!isNaN(parseInt(OfsetForSearch))) {
    off = OfsetForSearch;
    t1 = parseInt(OfsetForSearch) + 5;
  } else {
    t1 = 5;
  }
  let filter1 = !isNaN(parseInt(OfsetForSearch))
    ? { sortOrder: "ASC", sortBy: "createdTime", offset: off }
    : { sortOrder: "ASC", sortBy: "createdTime", offset: "0" };

  const closeModal = () => {
    setShowModal(false);
  };
  Digit.Hooks.useClickOutside(modalRef, closeModal, modalData);

  const sbm = searchQuery?.mobileNumber || searchQuery?.mobileNo;
  const spi = searchQuery?.propertyIds || searchQuery?.propertyId;
  const sop = searchQuery?.oldPropertyIds || searchQuery?.oldPropertyId;

  const sanitizeParam = (param) => (param && param !== "undefined" ? param : null);

  const finalMobileNumber = sanitizeParam(mobileNumber) || sanitizeParam(sbm);
  if (finalMobileNumber) filters.mobileNumber = finalMobileNumber;

  const finalPropertyIds = sanitizeParam(propertyIds) || sanitizeParam(spi);
  if (finalPropertyIds) filters.propertyIds = finalPropertyIds;

  const finalOldPropertyIds = sanitizeParam(oldPropertyIds) || sanitizeParam(sop);
  if (finalOldPropertyIds) filters.oldPropertyIds = finalOldPropertyIds;

  const finalLocality = sanitizeParam(locality) || sanitizeParam(searchQuery?.locality);
  if (finalLocality) filters.locality = finalLocality;

  const finalDoorNo = sanitizeParam(doorNo) || sanitizeParam(searchQuery?.doorNo);
  if (finalDoorNo) filters.doorNo = finalDoorNo;

  const finalName = sanitizeParam(name) || sanitizeParam(searchQuery?.name);
  if (finalName) filters.name = finalName;

  filters.limit = filter1.limit;
  filters.sortOrder = filter1.sortOrder;
  filters.sortBy = filter1.sortBy;
  filters.offset = filter1.offset;

  if (!filters.status) {
    filters.status = "ACTIVE,INWORKFLOW";
  }

  const [owners, setOwners, clearOwners] = Digit.Hooks.useSessionStorage("PT_MUTATE_MULTIPLE_OWNERS", null);
  // const [params, setParams, ] = Digit.Hooks.useSessionStorage("PT_MUTATE_PROPERTY");
  const [lastPath, setLastPath, clearLastPath] = Digit.Hooks.useSessionStorage("PT_MUTATE_MULTIPLE_OWNERS_LAST_PATH", null);

  const { path, url } = useRouteMatch();
  const searchParams = Digit.Hooks.useQueryParams();
  useEffect(() => {
    setOwners([]);
    clearParams();
    setLastPath("");
  }, []);

  // const auth = !!isMutation;    /*  to enable open search set false  */
  const auth = false;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const scity = city || tId || searchQuery?.city || tenantId;
  const searchArgs = scity ? { tenantId: scity, filters, auth } : { filters, auth };
  const result = Digit.Hooks.pt.usePropertySearch(searchArgs, { privacy: Digit.Utils.getPrivacyObject() });
  const properties = result?.data?.Properties || result?.data?.properties || (Array.isArray(result?.data) ? result?.data : []);
  const consumerCode = properties
    ?.map?.((a) => a.propertyId || a.id)
    .filter((id) => id)
    .join(",");

  if (result.isSuccess && (!properties || properties.length === 0)) {
    console.warn("Property Search: No properties found in result.data", result.data);
  }

  const fetchBillParams = mobileNumber ? { mobileNumber, consumerCode } : { consumerCode };

  const paymentDetails = Digit.Hooks.useFetchBillsForBuissnessService(
    { businessService: "PT", ...fetchBillParams, tenantId: scity },
    {
      enabled: !!(consumerCode && scity),
      retry: false,
    }
  );

  const history = useHistory();

  const proceedToPay = (data) => {
    history.push(`/digit-ui/citizen/payment/my-bills/PT/${data.property_id}`, { tenantId });
  };

  if (paymentDetails.isLoading || result.isLoading) {
    return <Loader />;
  }

  if (result.error || (result.isSuccess && (!properties || properties.length === 0))) {
    return (
      <div style={{ height: "150px" }}>
        <Card style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>{t("CS_PT_NO_PROPERTIES_FOUND")}</Card>
      </div>
    );
  }

  const onSubmit = (data) => {
    if (isMutation) {
      let property = result?.data?.Properties?.filter?.((e) => e.propertyId === data.property_id)[0];
      if (Number(data.total_due) > 0) {
        setShowModal(data);
      } else onSelect(config.key, { data, property });
    } else history.push(`/digit-ui/citizen/payment/my-bills/PT/${data.property_id}`, { tenantId });
  };

  const payment = {};

  paymentDetails?.data?.Bill?.forEach((element) => {
    if (element?.consumerCode) {
      payment[element?.consumerCode] = {
        total_due: element?.totalAmount,
        bil_due__date: new Date(element?.billDate).toDateString(),
      };
    }
  });

  const searchResults = (properties || [])?.map((property) => {
    let addr = property?.address || {};
    return {
      property_id: property?.propertyId,
      owner_name: (property?.owners || []).sort(
        (a, b) => (a?.additionalDetails?.ownerSequence || 0) - (b?.additionalDetails?.ownerSequence || 0)
      )?.[0]?.name,
      property_address: [
        addr.doorNo || "",
        addr.buildingName || "",
        addr.street || "",
        t(`TENANTS_MOHALLA_${addr.locality?.code}`) !== `TENANTS_MOHALLA_${addr.locality?.code}`
          ? t(`TENANTS_MOHALLA_${addr.locality?.code}`)
          : addr.locality?.name || "",
      ]
        .filter((a) => a)
        .join(", "),

      zroLocation: property?.address?.zroLocation || property?.address?.zone || "NA",
      total_due: payment[property?.propertyId]?.total_due || 0,
      bil_due__date: payment[property?.propertyId]?.bil_due__date || t("N/A"),
      status: t(property.status),
      owner_mobile: (property?.owners || [])[0]?.mobileNumber,
      address: property?.address,
      owners: property.owners,
      propertyDetails: property,
      waterConnectionDetails: property?.waterConnectionDetails || property?.additionalDetails?.waterConnectionDetails,
      privacy: {
        property_address: {
          uuid: property?.owners?.[0]?.uuid,
          fieldName: ["doorNo", "street", "landmark"],
          model: "Property",
          showValue: true,
          loadData: {
            serviceName: "/property-services/property/_search",
            requestBody: {},
            requestParam: { tenantId: property?.tenantId, propertyIds: property?.propertyId },
            jsonPath: "Properties[0].address.street",
            isArray: false,
            d: (res) => {
              let resultString =
                (_.get(res, "Properties[0].address.doorNo") ? `${_.get(res, "Properties[0].address.doorNo")}, ` : "") +
                (_.get(res, "Properties[0].address.street") ? `${_.get(res, "Properties[0].address.street")}, ` : "") +
                (_.get(res, "Properties[0].address.landmark") ? `${_.get(res, "Properties[0].address.landmark")}` : "");
              return resultString;
            },
          },
        },
      },
    };
  })?.sort((a, b) => {
    if (a.property_id && b.property_id) {
      return a.property_id.localeCompare(b.property_id);
    }
    return 0;
  });
  const getUserType = () => Digit.UserService.getType();

  const getFromLocation = (state, searchParams) => {
    return state?.from || searchParams?.from || DEFAULT_REDIRECT_URL;
  };

  const sendOtpToUser = async (record) => {
    sessionStorage.setItem("Digit_OBPS_PT", JSON.stringify(record));
    sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(record));
    if (onSelect) {
      onSelect("cptId", { id: record.property_id });
    } else {
      const data = {
        mobileNumber: record?.owner_mobile,
        tenantId: stateCode,
        userType: getUserType(),
      };
      const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });

      if (!err) {
        // Redirect to props redirect url if exists else to link success page
        let redirectUrl = "/digit-ui/citizen/commonPt/property/link-success/" + record.property_id;
        if (redirectToUrl) {
          redirectUrl = redirectToUrl + "?propertyId=" + record.property_id + "&tenantId=" + tenantId;
        }

        history.replace(`/digit-ui/citizen/commonPt/property/citizen-otp`, {
          from: getFromLocation(location.state, searchParams),
          mobileNumber: record.owner_mobile,
          redirectBackTo: redirectUrl,
        });
        return;
      } else {
        history.push(`/digit-ui/citizen/`, { from: getFromLocation(location.state, searchParams), data: data });
      }
    }
  };

  const handleContinueWithNewApplication = (item) => {
    const prop = item?.propertyDetails || item;
    const waterDetails =
      item?.waterConnectionDetails ||
      prop?.waterConnectionDetails ||
      prop?.additionalDetails?.waterConnectionDetails;

    if (waterDetails && waterDetails.canApply === false) {
      setWaterConnectionModalData(waterDetails);
      setShowWaterModal(true);
      return;
    }

    const propId = item?.property_id || prop?.propertyId || prop?.id;
    const mobileNo = item?.owner_mobile || prop?.owners?.[0]?.mobileNumber;
    const targetUrl = `/digit-ui/citizen/ws/info?hasProperty=YES&propertyId=${propId || ""}`;
    history.push(targetUrl, {
      property: prop,
      propertyId: propId,
      mobileNumber: mobileNo,
      hasProperty: "YES",
      fromPropertyCreate: true,
    });
  };

  const sendOtp = async (data) => {
    try {
      const res = await Digit.UserService.sendOtp(data, stateCode);
      return [res, null];
    } catch (err) {
      return [null, err];
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <div>
        {header && (
          <Header style={{ marginLeft: "8px" }}>
            {t(header)} ({searchResults?.length})
          </Header>
        )}
        {PrivacyInfoLabel && <PrivacyInfoLabel t={t} />}
        {window.Digit.Utils.browser.isMobile() ? (
          <ResponseComposer data={searchResults} template={template} actionButtonLabel={actionButtonLabel} onSubmit={sendOtpToUser} />
        ) : (
          <Table
            t={t}
            data={searchResults}
            totalCount={searchResults?.length}
            totalRecords={searchResults?.length}
            manualPagination={false}
            disableSort={true}
            columns={[
              {
                Header: t("PT_PROPERTY_PTUID"),
                disableSortBy: true,
                accessor: "property_id",
                Cell: ({ row }) => {
                  return (
                    <div>
                      <span>{row.original.property_id}</span>
                    </div>
                  );
                },
              },
              {
                Header: t("PT_OWNER_NAME"),
                disableSortBy: true,
                accessor: "owner_name",
              },
              {
                Header: t("PT_PROPERTY_ADDRESS_SUB_HEADER"),
                disableSortBy: true,
                accessor: "property_address",
              },
              {
                Header: t("zroLocation"),
                disableSortBy: true,
                accessor: "zroLocation",
              },
              {
                Header: t("ACTION") && t("ACTION") !== "ACTION" ? t("ACTION") : "ACTION",
                disableSortBy: true,
                Cell: ({ row }) => {
                  const viewLabel =
                    t("CS_COMMON_VIEW") && t("CS_COMMON_VIEW") !== "CS_COMMON_VIEW"
                      ? t("CS_COMMON_VIEW")
                      : (t("VIEW") && t("VIEW") !== "VIEW" ? t("VIEW") : "View");
                  const continueLabel =
                    t("WS_CONTINUE_WITH_NEW_APPLICATION") && t("WS_CONTINUE_WITH_NEW_APPLICATION") !== "WS_CONTINUE_WITH_NEW_APPLICATION"
                      ? t("WS_CONTINUE_WITH_NEW_APPLICATION")
                      : "Continue with New Application";

                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "4px 0" }}>
                      <button
                        type="button"
                        onClick={() => {
                          history.push({
                            pathname: `/digit-ui/citizen/commonpt/view-property`,
                            search: `?propertyId=${row.original.property_id}&tenantId=${tenantId}`,
                            state: {
                              fromSearch: true,
                              property: row.original.propertyDetails,
                              waterConnectionDetails:
                                row.original.waterConnectionDetails ||
                                row.original.propertyDetails?.waterConnectionDetails ||
                                row.original.propertyDetails?.additionalDetails?.waterConnectionDetails,
                            },
                          });
                        }}
                        style={{
                          padding: "6px 14px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#ffffff",
                          backgroundColor: "#1a67a3",
                          border: "1px solid #1a67a3",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          lineHeight: "1.4",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        }}
                      >
                        {viewLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContinueWithNewApplication(row.original)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#ffffff",
                          backgroundColor: "#1a67a3",
                          border: "1px solid #1a67a3",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          lineHeight: "1.4",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        }}
                      >
                        {continueLabel}
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />
        )}
      </div>
      {modalData ? (
        <Modal hideSubmit={true} isDisabled={false} popupStyles={{ width: "319px", height: "250px", margin: "auto" }} formId="modal-action">
          <div ref={modalRef}>
            <KeyNote
              keyValue={t("PT_AMOUNT_DUE")}
              note={`₹ ${modalData?.total_due?.toLocaleString("en-IN")}`}
              noteStyle={{ fontSize: "24px", fontWeight: "bold" }}
            />
            <p>
              {t("PT_YOU_HAVE") +
                " " +
                "₹" +
                " " +
                modalData?.total_due.toLocaleString("en-IN") +
                " " +
                t("PT_PENDING_AMOUNT") +
                " " +
                t("PT_INORDER_TO_TRANSFER")}
            </p>
            <SubmitBar
              submit={false}
              onSubmit={() => proceedToPay(modalData)}
              style={{ marginTop: "14px", width: "100%" }}
              label={t("PT_PROCEED_PAYMENT")}
            />
          </div>
        </Modal>
      ) : null}
      <WaterConnectionDetailsModal
        isOpen={showWaterModal}
        onClose={() => setShowWaterModal(false)}
        details={waterConnectionModalData}
        t={t}
      />
      {searchResults?.length === 0 && <p style={{ marginLeft: "16px", marginTop: "16px" }}>{t("PT_NO_PROP_FOUND_MSG")}</p>}
      {searchResults?.length !== 0 &&
        (searchResults?.length == 5 || searchResults?.length == 50) &&
        (locality || (searchQuery && searchQuery.locality)) && (
          <div>
            <p style={{ marginLeft: "16px", marginTop: "16px" }}>
              {t("PT_LOAD_MORE_MSG")}{" "}
              <span className="link">
                {
                  <Link
                    to={`/digit-ui/citizen/pt/property/search-results?mobileNumber=${mobileNumber || searchQuery.mobileNumber ? mobileNumber || searchQuery?.mobileNumber : ""
                      }&propertyIds=${propertyIds || searchQuery?.propertyIds ? propertyIds || searchQuery?.propertyIds : ""}&oldPropertyIds=${oldPropertyIds || searchQuery?.oldPropertyIds ? oldPropertyIds || searchQuery?.oldPropertyIds : ""
                      }&doorNo=${doorNo || searchQuery?.doorNo ? doorNo || searchQuery?.doorNo : ""}&name=${name || searchQuery?.name ? name || searchQuery?.name : ""
                      }&city=${city ? city : ""}&locality=${locality || searchQuery?.locality ? locality || searchQuery?.locality : ""}&PToffset=${t1}`}
                  >
                    {t("PT_COMMON_CLICK_HERE")}
                  </Link>
                }
              </span>
            </p>
          </div>
        )}
    </div>
  );
};

PropertySearchResults.propTypes = {
  template: PropTypes.any,
  header: PropTypes.string,
  actionButtonLabel: PropTypes.string,
};

PropertySearchResults.defaultProps = {
  template: [],
  header: null,
  actionButtonLabel: null,
};

export default PropertySearchResults;
