// import { Dropdown, Hamburger, TopBar as TopBarComponent } from "@djb25/digit-ui-react-components";
// import React from "react";
// import { useHistory, useLocation } from "react-router-dom";
// import ChangeCity from "../ChangeCity";
// import ChangeLanguage from "../ChangeLanguage";

// const TextToImg = (props) => (
//   <span className="user-img-txt" onClick={props.toggleMenu} title={props.name}>
//     {props?.name?.[0]?.toUpperCase()}
//   </span>
// );
// const TopBar = ({
//   t,
//   stateInfo,
//   toggleSidebar,
//   isSidebarOpen,
//   handleLogout,
//   userDetails,
//   CITIZEN,
//   cityDetails,
//   mobileView,
//   userOptions,
//   handleUserDropdownSelection,
//   logoUrl,
//   showLanguageChange = true,
// }) => {
//   const [profilePic, setProfilePic] = React.useState(null);

//   React.useEffect(async () => {
//     const tenant = Digit.ULBService.getCurrentTenantId();
//     const uuid = userDetails?.info?.uuid;
//     if (uuid) {
//       const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
//       if (usersResponse && usersResponse.user && usersResponse.user.length) {
//         const userDetails = usersResponse.user[0];
//         const thumbs = userDetails?.photo?.split(",");
//         setProfilePic(thumbs?.at(0));
//       }
//     }
//   }, [profilePic !== null, userDetails?.info?.uuid]);

//   const CitizenHomePageTenantId = Digit.ULBService.getCitizenCurrentTenant(true);

//   let history = useHistory();
//   const { pathname } = useLocation();

//   const conditionsToDisableNotificationCountTrigger = () => {
//     if (Digit.UserService?.getUser()?.info?.type === "EMPLOYEE") return false;
//     if (Digit.UserService?.getUser()?.info?.type === "CITIZEN") {
//       if (!CitizenHomePageTenantId) return false;
//       else return true;
//     }
//     return false;
//   };

//   const { data: { unreadCount: unreadNotificationCount } = {}, isSuccess: notificationCountLoaded } = Digit.Hooks.useNotificationCount({
//     tenantId: CitizenHomePageTenantId,
//     config: {
//       enabled: conditionsToDisableNotificationCountTrigger(),
//     },
//   });

//   const updateSidebar = () => {
//     if (!Digit.clikOusideFired) {
//       toggleSidebar(true);
//     } else {
//       Digit.clikOusideFired = false;
//     }
//   };

//   function onNotificationIconClick() {
//     history.push(`/${window?.contextPath}/citizen/engagement/notifications`);
//   }

//   const urlsToDisableNotificationIcon = (pathname) =>
//     !!Digit.UserService?.getUser()?.access_token
//       ? false
//       : [`/${window?.contextPath}/citizen/select-language`, `/${window?.contextPath}/citizen/select-location`].includes(pathname);

//   if (CITIZEN) {
//     return (
//       <div>
//         <TopBarComponent
//           img={stateInfo?.logoUrlWhite}
//           isMobile={true}
//           toggleSidebar={updateSidebar}
//           logoUrl={stateInfo?.logoUrlWhite}
//           onLogout={handleLogout}
//           userDetails={userDetails}
//           notificationCount={unreadNotificationCount < 99 ? unreadNotificationCount : 99}
//           notificationCountLoaded={notificationCountLoaded}
//           cityOfCitizenShownBesideLogo={t(CitizenHomePageTenantId)}
//           onNotificationIconClick={onNotificationIconClick}
//           hideNotificationIconOnSomeUrlsWhenNotLoggedIn={urlsToDisableNotificationIcon(pathname)}
//           changeLanguage={!mobileView ? <ChangeLanguage dropdown={true} /> : null}
//         />
//       </div>
//     );
//   }
//   const loggedin = userDetails?.access_token ? true : false;
//   return (
//     <div className="topbar">
//       {mobileView ? <Hamburger handleClick={toggleSidebar} color="#9E9E9E" /> : null}
//       <img className="city" src={loggedin ? cityDetails?.logoId : stateInfo?.statelogo} />
//       <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
//         {loggedin &&
//           (cityDetails?.city?.ulbGrade ? (
//             <p className="ulb" style={mobileView ? { fontSize: "14px", display: "inline-block" } : {}}>
//               {t(cityDetails?.i18nKey).toUpperCase()}{" "}
//               {t(`ULBGRADE_${cityDetails?.city?.ulbGrade.toUpperCase().replace(" ", "_").replace(".", "_")}`).toUpperCase()}
//             </p>
//           ) : (
//             <img className="state" src={logoUrl} />
//           ))}
//         {!loggedin && (
//           <p className="ulb" style={mobileView ? { fontSize: "14px", display: "inline-block" } : {}}>
//             {t(`MYCITY_${stateInfo?.code?.toUpperCase()}_LABEL`)} {t(`MYCITY_STATECODE_LABEL`)}
//           </p>
//         )}
//         {!mobileView && (
//           <div className={mobileView ? "right" : "flex-right right w-80 column-gap-15"} style={!loggedin ? { width: "80%" } : {}}>
//             <div className="left">
//               {!window.location.href.includes("employee/user/login") && !window.location.href.includes("employee/user/language-selection") && (
//                 <ChangeCity dropdown={true} t={t} />
//               )}
//             </div>
//             <div className="left">{showLanguageChange && <ChangeLanguage dropdown={true} />}</div>
//             {userDetails?.access_token && (
//               <div className="left">
//                 <Dropdown
//                   option={userOptions}
//                   optionKey={"name"}
//                   select={handleUserDropdownSelection}
//                   showArrow={true}
//                   freeze={true}
//                   style={mobileView ? { right: 0 } : {}}
//                   optionCardStyles={{ overflow: "revert",display:"table" }}
//                   topbarOptionsClassName={"topbarOptionsClassName"}
//                   customSelector={
//                     profilePic == null ? (
//                       <TextToImg name={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Employee"} />
//                     ) : (
//                       <img src={profilePic} style={{ height: "48px", width: "48px", borderRadius: "50%" }} />
//                     )
//                   }
//                 />
//               </div>
//             )}
//             <img className="state" src={logoUrl} />
//           </div>
//         )}
//       </span>
//     </div>
//   );
// };

// export default TopBar;

import React from "react";
import { Hamburger, Calender } from "@djb25/digit-ui-react-components";
// import { useHistory, useLocation } from "react-router-dom";
import ChangeCity from "../ChangeCity";
import ChangeLanguage from "../ChangeLanguage";
import CustomUserDropdown from "./CustomUserDropdown";

const TopBar = ({
  t,
  stateInfo,
  toggleSidebar,
  isSidebarOpen,
  handleLogout,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  userOptions,
  roleOptions = [],
  selectedRole = null,
  handleRoleChange,
  handleUserDropdownSelection,
  logoUrl,
  showLanguageChange = true,
  setSideBarScrollTop,
}) => {
  const getFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return month >= 4 ? `FY ${year}-${(year + 1).toString().slice(-2)}` : `FY ${year - 1}-${year.toString().slice(-2)}`;
  };

  const [profilePic, setProfilePic] = React.useState(null);
  const [zoneName, setZoneName] = React.useState(Digit.SessionStorage.get("Employee.zone"));
  const [designationName, setDesignationName] = React.useState(Digit.SessionStorage.get("Employee.designation"));

  React.useEffect(() => {
    const interval = setInterval(() => {
      const storedZone = Digit.SessionStorage.get("Employee.zone");
      if (storedZone && storedZone !== zoneName) {
        setZoneName(storedZone);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const storedDesignation = Digit.SessionStorage.get("Employee.designation");
      if (storedDesignation && storedDesignation !== designationName) {
        setDesignationName(storedDesignation);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const tenant = Digit.ULBService.getCurrentTenantId();
        const uuid = userDetails?.info?.uuid;

        if (uuid) {
          const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});

          if (isMounted && usersResponse?.user?.length) {
            const user = usersResponse.user[0];
            const thumbs = user?.photo?.split(",");
            setProfilePic(thumbs?.at(0));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();

    return () => {
      isMounted = false; // 🚀 prevents state update after unmount
    };
  }, [userDetails?.info?.uuid]);

  // const CitizenHomePageTenantId = Digit.ULBService.getCitizenCurrentTenant(true);

  // let history = useHistory();
  // const { pathname } = useLocation();

  // const conditionsToDisableNotificationCountTrigger = () => {
  //   if (Digit.UserService?.getUser()?.info?.type === "EMPLOYEE") return false;
  //   if (Digit.UserService?.getUser()?.info?.type === "CITIZEN") {
  //     if (!CitizenHomePageTenantId) return false;
  //     else return true;
  //   }
  //   return false;
  // };

  // const { data: { unreadCount: unreadNotificationCount } = {}, isSuccess: notificationCountLoaded } = Digit.Hooks.useNotificationCount({
  //   tenantId: CitizenHomePageTenantId,
  //   config: {
  //     enabled: conditionsToDisableNotificationCountTrigger(),
  //   },
  // });

  const updateSidebar = () => {
    if (!Digit.clikOusideFired) {
      toggleSidebar(true);
      setSideBarScrollTop(true);
    } else {
      Digit.clikOusideFired = false;
    }
  };

  // function onNotificationIconClick() {
  //   history.push("/digit-ui/citizen/engagement/notifications");
  // }

  // const urlsToDisableNotificationIcon = (pathname) =>
  //   !!window.keycloak?.token ? false : ["/digit-ui/citizen/select-language", "/digit-ui/citizen/select-location"].includes(pathname);

  const kc = window.keycloak;
  const loggedIn = kc?.authenticated || false;
  if (CITIZEN) {
    return (
      <div className="topbar" style={CITIZEN ? { left: "0px", width: "100%", backgroundColor: "#FFFFFF" } : { backgroundColor: "#FFFFFF" }}>
        {mobileView ? <Hamburger handleClick={updateSidebar} color="#9E9E9E" /> : null}
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div className="brand flex-center flex-gap-3" style={{ cursor: "pointer" }} onClick={() => (window.location.href = "/digit-ui/citizen")}>
            <div
              className="brand-mark"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "10px",
                background: "#065297",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(12, 35, 64, 0.35)",
                overflow: "hidden",
              }}
            >
              <img src="https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/djb_logo.png" alt="DJB Logo" />
            </div>
            <div className="btx">
              <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: "29px", fontWeight: "700", color: "#003366" }}>Delhi Jal Board</h1>
              <p style={{ fontSize: "10.5px", fontWeight: "500", color: "#0070B4" }}>Integrated Enterprise Management System</p>
            </div>
          </div>

          {!mobileView && (
            <div className="topbar-right-section">
              <div className="topbar-item-wrapper hide-on-mobile">
                <Calender width="20" height="20" />
                <span>{getFinancialYear()}</span>
              </div>
              <div className="left">{showLanguageChange && <ChangeLanguage dropdown={true} />}</div>
              <div className="vertical-divider"></div>

              {loggedIn && (
                <div className="left flex-center flex-gap-3">
                  <CustomUserDropdown
                    userOptions={userOptions}
                    roleOptions={[]}
                    selectedRole={null}
                    handleRoleChange={() => { }}
                    profilePic={profilePic}
                    userName={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Citizen"}
                    userCode={userDetails?.info?.userName}
                    t={t}
                  />
                </div>
              )}

              <img
                className="state"
                src="https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/SBM_IMG.png"
                alt="SBM Img"
              />
            </div>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="topbar" style={{ backgroundColor: "#FFFFFF" }}>
      {mobileView ? <Hamburger handleClick={toggleSidebar} color="#9E9E9E" /> : null}
      <span className="topbar-content" style={{ display: "flex", alignItems: "center" }}>
        {!mobileView && (
          <div id="module-sidebar-portal-target" style={{ marginLeft: "-37px", marginRight: "25px", display: "flex", alignItems: "center" }}></div>
        )}
        <div
          className="brand"
          style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
          onClick={() => (window.location.href = "/digit-ui/employee")}
        >
          <div
            className="brand-mark"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "10px",
              background: "#065297",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(12, 35, 64, 0.35)",
              overflow: "hidden",
            }}
          >
            <img src="https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/djb_logo.png" alt="DJB Logo" />
          </div>
          <div className="btx">
            <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: "29px", fontWeight: "700", color: "#003366" }}>Delhi Jal Board</h1>
            <p style={{ fontSize: "10.5px", fontWeight: "500", color: "#0070B4" }}>Integrated Enterprise Management System</p>
          </div>
        </div>

        {!loggedIn && (
          <p className="ulb" style={mobileView ? { fontSize: "14px", display: "inline-block" } : {}}>
            {t(`MYCITY_${stateInfo?.code?.toUpperCase()}_LABEL`)} {t(`MYCITY_STATECODE_LABEL`)}
          </p>
        )}
        {!mobileView && (
          <div className={mobileView ? "right" : "topbar-right-section"} style={!loggedIn ? { width: "80%" } : {}}>
            <div className="left hide-on-mobile">
              {!window.location.href.includes("employee/user/login") && !window.location.href.includes("employee/user/language-selection") && (
                <ChangeCity dropdown={true} t={t} />
              )}
            </div>
            <div className="topbar-item-wrapper hide-on-mobile">
              <Calender width="20" height="20" />
              <span>{getFinancialYear()}</span>
            </div>
            <div className="vertical-divider hide-on-mobile"></div>
            <div className="left">{showLanguageChange && <ChangeLanguage dropdown={true} />}</div>
            <div className="vertical-divider"></div>

            {kc?.authenticated && (
              <div className="left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <EmployeeDesignationWrapper
                  userDetails={userDetails}
                  userOptions={userOptions}
                  roleOptions={roleOptions}
                  selectedRole={selectedRole}
                  handleRoleChange={handleRoleChange}
                  profilePic={profilePic}
                  t={t}
                />
              </div>
            )}
            <img
              className="spect-icon"
              src="https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/SBM_IMG.png"
              alt="Swatch Bharat Icon"
            />
          </div>
        )}
      </span>
    </div>
  );
};

const EmployeeDesignationWrapper = ({ userDetails, ...props }) => {
  const { t, compact } = props;
  const { data } = Digit.Hooks.hrms.useHRMSSearch({ codes: userDetails?.info?.userName }, Digit.ULBService.getCurrentTenantId(), null, null, {
    enabled: !!userDetails?.info?.userName && userDetails?.info?.type === "EMPLOYEE",
  });

  const designation = data?.Employees?.[0]?.assignments?.find((a) => a.isCurrentAssignment)?.designation;
  const designationName = designation ? t("COMMON_MASTERS_DESIGNATION_" + designation) : "";

  return (
    <CustomUserDropdown
      {...props}
      userName={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Employee"}
      designation={designationName}
      userCode={userDetails?.info?.userName}
      compact={compact}
    />
  );
};

export default TopBar;
