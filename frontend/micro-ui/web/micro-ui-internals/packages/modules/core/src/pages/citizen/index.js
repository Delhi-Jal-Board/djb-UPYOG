import {
  BackButton,
  CitizenHomeCard,
  CitizenInfoLabel,
  PrivateRoute,
  AdvertisementModuleCard,
  CollectionIcon,
  AppContainer,
} from "@djb25/digit-ui-react-components";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, Switch, useRouteMatch, useHistory } from "react-router-dom";
import ErrorBoundary from "../../components/ErrorBoundaries";
import { AppHome, processLinkData } from "../../components/Home";
import TopBarSideBar from "../../components/TopBarSideBar";
import StaticCitizenSideBar from "../../components/TopBarSideBar/SideBar/StaticCitizenSideBar";
import CitizenHome from "./Home";
import LanguageSelection from "./Home/LanguageSelection";
import LocationSelection from "./Home/LocationSelection";
import Login from "./Login";
import Register from "./Login/Register";
import UserProfile from "./Home/UserProfile";
import ErrorComponent from "../../components/ErrorComponent";
import FAQsSection from "./FAQs/FAQs";
import HowItWorks from "./HowItWorks/howItWorks";
import StaticDynamicCard from "./StaticDynamicComponent/StaticDynamicCard";
import AcknowledgementCF from "../../components/AcknowledgementCF";
import CitizenFeedback from "../../components/CitizenFeedback";
import Search from "./SearchApp";
import QRCode from "./QRCode";
import VSearchCertificate from "./CMSearchCertificate";
import AssetsQRCode from "./AssetsQRCode";
import ChallanQRCode from "./ChallanQRCode";
// import EDCRScrutiny from "./Home/EdcrScrutiny";
// import { newConfig as newConfigEDCR } from "../../config/edcrConfig";
import CreateAnonymousEDCR from "./Home/EDCR";
import EDCRAcknowledgement from "./Home/EDCR/EDCRAcknowledgement";
import { APPLICATION_PATH } from "./Home/EDCR/utils";
import LogoutDialog from "../../components/Dialog/LogoutDialog";
const sidebarHiddenFor = [
  "digit-ui/citizen/register",
  "digit-ui/citizen/register/name",
  "/digit-ui/citizen/select-language",
  "/digit-ui/citizen/select-location",
  "/digit-ui/citizen/login",
  "/digit-ui/citizen/register/otp",
  "/digit-ui/citizen/verificationsearch-home", // route for verificationsearch component
];
const getTenants = (codes, tenants) => {
  return tenants.filter((tenant) => codes.map((item) => item.code).includes(tenant.code));
};

const Home = ({
  stateInfo,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  handleUserDropdownSelection,
  logoUrl,
  DSO,
  stateCode,
  modules,
  appTenants,
  sourceUrl,
  pathname,
  initData,
}) => {
  const [showDialog, setShowDialog] = React.useState(false);

  const handleLogout = () => {
    setShowDialog(true);
  };

  const handleOnSubmit = async () => {
    try {
      const kc = window.keycloak;
      sessionStorage.clear();
      localStorage.clear();
      if (kc) {
        await kc.logout({
          idTokenHint: kc.idToken,
        });
      }
    } catch (e) {
      console.error("Logout failed", e);
      window.location.replace("/digit-ui/citizen/login");
    }
    setShowDialog(false);
  };

  const handleOnCancel = () => {
    setShowDialog(false);
  };

  const { isLoading: islinkDataLoading, data: linkData, isFetched: isLinkDataFetched } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "ACCESSCONTROL-ACTIONS-TEST",
    [
      {
        name: "actions-test",
        filter: "[?(@.url == 'digit-ui-card')]",
      },
    ],
    {
      select: (data) => {
        const formattedData = data?.["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"]
          ?.filter((el) => el.enabled === true)
          .reduce((a, b) => {
            a[b.parentModule] = a[b.parentModule]?.length > 0 ? [b, ...a[b.parentModule]] : [b];
            return a;
          }, {});
        return formattedData;
      },
    }
  );

  const isMobile = window.Digit.Utils.browser.isMobile();
  const classname = Digit.Hooks.useRouteSubscription(pathname);
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  sourceUrl = "https://s3.ap-south-1.amazonaws.com/egov-qa-assets";
  const history = useHistory();
  useEffect(() => {
    const userType = userDetails?.info?.type?.toUpperCase();
    if (userType === "EMPLOYEE") {
      history.push("/digit-ui/employee");
    }
  }, [userDetails, history]);

  // Fetches the state ID using the ULBService and retrieves the form configuration for EDCR from MDMS.
  // If EdcrConfig is available in the fetched data, it is used; otherwise, it falls back to newConfigEDCR.
  // const stateId = Digit.ULBService.getStateId();
  // let { data: newConfig } = Digit.Hooks.obps.SearchMdmsTypes.getFormConfig(stateId, []);
  // newConfig = newConfig?.EdcrConfig ? newConfig?.EdcrConfig : newConfigEDCR;

  const hideSidebar = sidebarHiddenFor.some((e) => window.location.href.includes(e));

  // Patch modules to include modules from linkData that might be missing from initData.modules
  const allModules = [...modules];
  if (linkData) {
    Object.keys(linkData).forEach((key) => {
      if (!allModules.find((m) => m.code.toUpperCase() === key.toUpperCase())) {
        allModules.push({ code: key.toUpperCase(), tenants: [] });
      }
    });
  }

  const appRoutes = allModules.map(({ code, tenants }, index) => {
    const Module = Digit.ComponentRegistryService.getComponent(`${code}Module`);
    return Module ? (
      <Route key={index} path={`${path}/${code.toLowerCase()}`}>
        <Module stateCode={stateCode} moduleCode={code} userType="citizen" tenants={getTenants(tenants, appTenants)} />
      </Route>
    ) : null;
  });
  // Fetches advertisement details (e.g., image, title, location, pole number, price)
  // from the MDMS and formats them for display on the homepage.
  const { data: advertisement } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Advertisement", [{ name: "Unipole_12_8" }], {
    select: (data) => {
      const formattedData = data?.["Advertisement"]?.["Unipole_12_8"].map((details) => {
        return {
          imageSrc: `${details.imageSrc}`,
          light: `${details.light}`,
          title: `${details.title}`,
          location: `${details.location}`,
          poleNo: `${details.poleNo}`,
          price: `${details.price}`,
          adtype: `${details.adtype}`,
          faceArea: `${details.faceArea}`,
        };
      });
      return formattedData;
    },
  });
  const Advertisement = advertisement || [];

  const BillsLinks = ({ matchPath }) => {
    const links = [
      {
        link: `${matchPath}/billSearch`,
        i18nKey: t("ABG_SEARCH_BILL_COMMON_HEADER") || "Search Bill",
      },
      {
        link: `${matchPath}/group-bill`,
        i18nKey: t("ACTION_TEST_GROUP_BILLS") || "Group Bills",
      },
      {
        link: `${matchPath}/cancel-bill`,
        i18nKey: t("ACTION_TEST_CANCEL_BILL") || "Cancel Bill",
      },
      {
        link: `${matchPath}/download-bill-pdf`,
        i18nKey: t("ACTION_TEST_DOWNLOAD_BILL_PDF") || "Download Bill PDF",
      },
    ];
    return (
      <CitizenHomeCard
        header={t("ACTION_TEST_BILLGENIE") || "Bills Accounting"}
        links={links}
        Icon={() => <CollectionIcon className="fill-path-primary-main" />}
      />
    );
  };

  const ModuleLevelLinkHomePages = allModules.map(({ code, bannerImage }, index) => {
    let Links =
      Digit.ComponentRegistryService.getComponent(`${code}Links`) ||
      Digit.ComponentRegistryService.getComponent(`${code.charAt(0).toUpperCase() + code.slice(1).toLowerCase()}Links`) ||
      (code.toUpperCase() === "BILLS" ? BillsLinks : () => <React.Fragment />);
    let mdmsDataObj = isLinkDataFetched ? processLinkData(linkData, code, t) : undefined;

    //if (mdmsDataObj?.header === "ACTION_TEST_WS") {
    mdmsDataObj?.links &&
      mdmsDataObj?.links.sort((a, b) => {
        return a.orderNumber - b.orderNumber;
      });
    // }

    return (
      <React.Fragment key={index}>
        <Route key={index} path={`${path}/${code.toLowerCase()}-home`}>
          <div className="moduleLinkHomePage">
            <div style={{ position: "relative" }}>
              <img src={stateInfo?.bannerUrl} alt="noimagefound" />
              <BackButton className="moduleLinkHomePageBackButton" />
              <div className="moduleTitle">
                {isMobile ? <h4>{t("MODULE_" + code.toUpperCase())}</h4> : <h1>{t("MODULE_" + code.toUpperCase())}</h1>}
              </div>
            </div>
            <div className="moduleLinkHomePageModuleLinks">
              {mdmsDataObj?.links?.filter((ele) => ele?.link)?.length > 0 ? (
                <CitizenHomeCard
                  header={t(mdmsDataObj?.header)}
                  links={mdmsDataObj?.links?.filter((ele) => ele?.link)?.sort((x, y) => x?.orderNumber - y?.orderNumber)}
                  Icon={() => <span />}
                  Info={
                    code === "OBPS"
                      ? () => (
                          <CitizenInfoLabel
                            style={{ margin: "0px", padding: "10px" }}
                            info={t("CS_FILE_APPLICATION_INFO_LABEL")}
                            text={t(`BPA_CITIZEN_HOME_STAKEHOLDER_INCLUDES_INFO_LABEL`)}
                          />
                        )
                      : null
                  }
                  isInfo={code === "OBPS" ? true : false}
                />
              ) : (
                <Links key={index} matchPath={`/digit-ui/citizen/${code.toLowerCase()}`} userType={"citizen"} />
              )}
            </div>
            {code?.toUpperCase() === "ADS" && (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
                {Advertisement.map((ad, index) => (
                  <AdvertisementModuleCard
                    key={index}
                    imageSrc={ad.imageSrc}
                    poleNo={ad.poleNo}
                    light={ad.light}
                    title={ad.title}
                    location={ad.location}
                    price={ad.price}
                    path={`${path}/${code.toLowerCase()}/`}
                    adType={ad.adtype}
                    faceArea={ad.faceArea}
                  />
                ))}
              </div>
            )}
            <StaticDynamicCard moduleCode={code?.toUpperCase()} />
          </div>
        </Route>
        <Route key={"faq" + index} path={`${path}/${code.toLowerCase()}-faq`}>
          <FAQsSection module={code?.toUpperCase()} />
        </Route>
        <Route key={"hiw" + index} path={`${path}/${code.toLowerCase()}-how-it-works`}>
          <HowItWorks module={code?.toUpperCase()} />
        </Route>
      </React.Fragment>
    );
  });

  return (
    <div className={classname}>
      <TopBarSideBar
        t={t}
        stateInfo={stateInfo}
        userDetails={userDetails}
        CITIZEN={CITIZEN}
        cityDetails={cityDetails}
        mobileView={mobileView}
        handleUserDropdownSelection={handleUserDropdownSelection}
        logoUrl={logoUrl}
        showSidebar={mobileView}
        linkData={linkData}
        islinkDataLoading={islinkDataLoading}
      />

      <div className={`main ${hideSidebar ? "fullWidth" : "center-container"} citizen-home-container`}>
        <div className="employee-app-wrapper">
          <div style={{ display: "flex", width: "100vw", height: "100%" }}>
            {hideSidebar ? null : (
              <div className="collapsible-sidebar-container">
                <StaticCitizenSideBar linkData={linkData} islinkDataLoading={islinkDataLoading} logout={handleLogout} />
              </div>
            )}
            <Switch>
              <Route exact path={path}>
                <CitizenHome />
              </Route>

              <PrivateRoute path={`${path}/feedback`} component={CitizenFeedback} />
              <PrivateRoute path={`${path}/feedback-acknowledgement`} component={AcknowledgementCF} />

              <Route exact path={`${path}/select-language`}>
                <LanguageSelection />
              </Route>

              <Route exact path={`${path}/select-location`}>
                <LocationSelection />
              </Route>
              <Route path={`${path}/error`}>
                <ErrorComponent
                  initData={initData}
                  goToHome={() => {
                    history.push("/digit-ui/citizen");
                  }}
                />
              </Route>
              <Route path={`${path}/all-services`}>
                <AppHome
                  userType="citizen"
                  modules={modules}
                  getCitizenMenu={linkData}
                  fetchedCitizen={isLinkDataFetched}
                  isLoading={islinkDataLoading}
                />
              </Route>

              <Route path={`${path}/login`}>
                <Login stateCode={stateCode} />
              </Route>

              <Route path={`${path}/register`}>
                <Register stateCode={stateCode} />
              </Route>

              <PrivateRoute path={`${path}/user/profile`}>
                <UserProfile stateCode={stateCode} userType={"citizen"} cityDetails={cityDetails} />
              </PrivateRoute>

              <Route path={`${path}/Audit`}>
                <Search />
              </Route>
              <Route path={`${path}/payment/verification`}>
                <QRCode></QRCode>
              </Route>
              <Route path={`${path}/assets/services`}>
                <AssetsQRCode />
              </Route>
              <Route path={`${path}/verificationsearch-home`}>
                <VSearchCertificate />
              </Route>
              <Route path={`${path}/challan/details`}>
                <ChallanQRCode />
              </Route>
              <Route path={`${APPLICATION_PATH}/citizen/core/edcr/scrutiny`}>
                {/* <EDCRScrutiny config={newConfigEDCR} isSubmitBtnDisable={false}/> */}
                <CreateAnonymousEDCR />
              </Route>
              <Route path={`${APPLICATION_PATH}/citizen/core/edcr/scrutiny/acknowledgement`}>
                <EDCRAcknowledgement />
              </Route>

              <ErrorBoundary
                initData={initData}
                goToHome={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    const path = "/digit-ui/citizen";
                    window.location.href = path;
                  }
                }}
              >
                <div className="app-wrapper emtb-page-push">
                  <AppContainer>
                    {ModuleLevelLinkHomePages}
                    {appRoutes}
                  </AppContainer>
                </div>
              </ErrorBoundary>
            </Switch>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: "30px",
            position: "fixed",
            bottom: 0,
            backgroundColor: "#FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "100000",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", color: "black", opacity: "0.5" }}>
            <span
              className="upyog-copyright-footer"
              style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "14px", fontWeight: "600" }}
              onClick={() => {
                window.open("https://delhijalboard.delhi.gov.in/", "_blank").focus();
              }}
            >
              Copyright © 2026 Delhi Jal Board
            </span>
            <span className="upyog-copyright-footer" style={{ margin: "0 10px", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "14px" }}>
              |
            </span>
            <span
              className="upyog-copyright-footer"
              style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "14px", fontWeight: "600" }}
              onClick={() => {
                window.open("https://nitcon.org/", "_blank").focus();
              }}
            >
              Designed & Developed By NITCON Ltd
            </span>
          </div>
        </div>
      </div>

      {showDialog && <LogoutDialog onSelect={handleOnSubmit} onCancel={handleOnCancel} onDismiss={handleOnCancel} />}
    </div>
  );
};

export default Home;
