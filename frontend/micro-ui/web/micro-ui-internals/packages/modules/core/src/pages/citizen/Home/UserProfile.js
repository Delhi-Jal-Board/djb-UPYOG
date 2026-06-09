import {
  Label,
  Dropdown,
  LabelFieldPair,
  MobileNumber,
  TextInput,
  Toast,
  CardLabelError,
  BackButton,
  Loader,
  DatePicker,
  Card,
  StatusTable,
  Row,
  EditIcon,
  LinkButton,
  ModuleHeader,
  ArrowLeft,
  HomeIcon,
  EditPencilIcon,
  Table,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import UploadDrawer from "./ImageUpload/UploadDrawer";
// import { format } from "date-fns";
import Address from "./AddressDetails";

const defaultImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO4AAADUCAMAAACs0e/bAAAAM1BMVEXK0eL" +
  "/" +
  "/" +
  "/" +
  "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";

const UserProfile = ({ stateCode, userType, cityDetails }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const stateId = Digit.ULBService.getStateId();
  const tenant = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info || {};
  const [userDetails, setUserDetails] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]); // Separate state for addresses
  const [name, setName] = useState(userInfo?.name ? userInfo.name : "");
  const dateOfBirth = userDetails?.dob;
  // const formattedDob = dateOfBirth && !isNaN(new Date(dateOfBirth).getTime()) ? format(new Date(dateOfBirth), "MM/dd/yyyy") : "";
  //const dateOfBirth1= (dateOfBirth!==undefined) ?dateOfBirth.split("-").reverse().join("-") : ""
  const [dob, setDob] = useState(dateOfBirth);
  const [email, setEmail] = useState(userInfo?.emailId ? userInfo.emailId : "");
  const [gender, setGender] = useState(userDetails?.gender);
  const [city, setCity] = useState(userInfo?.permanentCity ? userInfo.permanentCity : cityDetails?.name || "");
  const [mobileNumber, setMobileNo] = useState(userInfo?.mobileNumber ? userInfo.mobileNumber : "");
  const [altMobileNumber, setAltMobileNo] = useState(userInfo?.altContactNumber ? userInfo.altContactNumber : "");
  const [profilePic, setProfilePic] = useState(userDetails?.photo ? userDetails?.photo : "");
  const [profileImg, setProfileImg] = useState("");
  const [openUploadSlide, setOpenUploadSide] = useState(false);
  const [changepassword, setChangepassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [errors, setErrors] = React.useState({});
  const isMobile = window.Digit.Utils.browser.isMobile();
  const [activeTab, setActiveTab] = useState("profile");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setisEdit] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [designationName, setDesignationName] = React.useState(Digit.SessionStorage.get("Employee.designation"));
  const [departmentName, setDepartmentName] = React.useState(Digit.SessionStorage.get("Employee.department"));

  /*
   * Fetches the user's address details using the `Digit.UserService.userSearchNewV2` API.
   * - Retrieves the user's UUID from `userInfo`.
   * - Calls the API with the tenant ID and UUID to fetch user data.
   * - Updates the `userAddresses` state with the fetched address list if available.
   */
  const getUserInfo = async (isMounted) => {
    const uuid = userInfo?.uuid;
    if (uuid) {
      try {
        const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
        const userList = usersResponse && (usersResponse.user || usersResponse.userList || usersResponse.users) ? (usersResponse.user || usersResponse.userList || usersResponse.users) : [];

        if (userList && userList.length && isMounted.current) {
          const fetchedUser = userList[0];
          setUserDetails(fetchedUser);
          if (fetchedUser.addresses && fetchedUser.addresses.length > 0) {
            setUserAddresses(fetchedUser.addresses);
          }
        } else if (isMounted.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    } else {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    getUserInfo({ current: true });
  };

  // Window resize listener with cleanup
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Fetch user info on mount with cleanup tracking
  useEffect(() => {
    const isMounted = { current: true };

    setLoading(true);
    getUserInfo(isMounted);

    return () => {
      isMounted.current = false;
      setLoading(false);
    };
  }, []);

  // Update derived states when userDetails changes
  useEffect(() => {
    if (userDetails) {
      setGender({
        i18nKey: undefined,
        code: userDetails.gender,
        value: userDetails.gender,
      });

      const thumbs = userDetails?.photo?.split(",");
      setProfileImg(thumbs?.at(0));

      if (userDetails.dob) {
        setDob(userDetails.dob);
      }

      // 🔄 Sync form fields with fetched user details
      if (userDetails.name) setName(userDetails.name);
      if (userDetails.emailId) setEmail(userDetails.emailId);
      if (userDetails.mobileNumber) setMobileNo(userDetails.mobileNumber);
      if (userDetails.altContactNumber) setAltMobileNo(userDetails.altContactNumber);
      if (userDetails.permanentCity) setCity(userDetails.permanentCity);

      setLoading(false);
    }
  }, [userDetails]);

  // Session storage polling with proper cleanup and dependencies
  useEffect(() => {
    const interval = setInterval(() => {
      const storedDesignation = Digit.SessionStorage.get("Employee.designation");
      const storedDepartment = Digit.SessionStorage.get("Employee.department");

      if (storedDesignation && storedDesignation !== designationName) {
        setDesignationName(storedDesignation);
      }

      if (storedDepartment && storedDepartment !== departmentName) {
        setDepartmentName(storedDepartment);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [designationName, departmentName]);

  let validation = {};
  const editScreen = false; // To-do: Deubug and make me dynamic or remove if not needed
  const onClickAddPic = () => setOpenUploadSide(!openUploadSlide);
  const TogleforPassword = () => setChangepassword(!changepassword);
  const setGenderName = (value) => setGender(value);

  const setUserDOB = (value) => {
    setDob(value);
  };
  const closeFileUploadDrawer = () => setOpenUploadSide(false);

  const setUserName = (value) => {
    setName(value);

    if (!new RegExp(/^[a-zA-Z ]+$/i).test(value) || value.length === 0 || value.length > 50) {
      setErrors({ ...errors, userName: { type: "pattern", message: t("CORE_COMMON_PROFILE_NAME_INVALID") } });
    } else {
      setErrors({ ...errors, userName: null });
    }
  };

  //const setUserEmailAddress = (value) => {
  // setEmail(value);
  //const emailPattern=/^[a-zA-Z0-9._%+-]+@[a-z.-]+\.(com|org|in)$/
  //if(value.length && !emailPattern.test(value)){
  //setErrors({...errors, emailAddress: {type: "pattern", message: t("CORE_COMMON_PROFILE_EMAIL_INVALID")}})
  //}else{
  //setEmail(value);
  //setErrors({ ...errors, emailAddress: null });
  //}
  //};
  const setUserEmailAddress = (value) => {
    setEmail(value);
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;

    if (value.length && !emailPattern.test(value)) {
      setErrors({
        ...errors,
        emailAddress: {
          type: "pattern",
          message: t("CORE_COMMON_PROFILE_EMAIL_INVALID"),
        },
      });
    } else {
      setEmail(value);
      setErrors({ ...errors, emailAddress: null });
    }
  };
  const SetActiveTab = (tab) => {
    setActiveTab(tab);
  };

  const setUserMobileNumber = (value) => {
    setMobileNo(value);

    if (userType === "employee" && !new RegExp(/^[6-9]{1}[0-9]{9}$/).test(value)) {
      setErrors({ ...errors, mobileNumber: { type: "pattern", message: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") } });
    } else {
      setErrors({ ...errors, mobileNumber: null });
    }
  };

  const setUserAltMobileNumber = (value) => {
    setAltMobileNo(value);

    if (!new RegExp(/^[6-9]{1}[0-9]{9}$/).test(value)) {
      setErrors({ ...errors, altMobileNumber: { type: "pattern", message: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") } });
    } else {
      setErrors({ ...errors, altMobileNumber: null });
    }
  };

  const setUserCurrentPassword = (value) => {
    setCurrentPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, currentPassword: { type: "pattern", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") } });
    } else {
      setErrors({ ...errors, currentPassword: null });
    }
  };

  const setUserNewPassword = (value) => {
    setNewPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, newPassword: { type: "pattern", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") } });
    } else {
      setErrors({ ...errors, newPassword: null });
    }
  };

  const setUserConfirmPassword = (value) => {
    setConfirmPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, confirmPassword: { type: "pattern", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") } });
    } else {
      setErrors({ ...errors, confirmPassword: null });
    }
  };

  const removeProfilePic = () => {
    setProfilePic(null);
    setProfileImg(null);
  };

  const showToast = (type, message, duration = 5000) => {
    setToast({ key: type, action: message });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const requestData = {
        ...userInfo,
        name,
        dob: dob && dob.includes("-") ? dob.split("-").reverse().join("/") : dob,
        gender: gender?.value,
        emailId: email,
        altContactNumber: altMobileNumber,
        photo: profilePic,
        correspondenceAddress: city,
        active: true,
      };

      if (!new RegExp(/^([a-zA-Z ])*$/).test(name) || name === "" || name.length > 50 || name.length < 1) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_NAME_INVALID") });
      }

      if (userType === "employee" && !new RegExp(/^[6-9]{1}[0-9]{9}$/).test(mobileNumber)) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") });
      }

      if (userType === "citizen" && !new RegExp(/^[6-9]{1}[0-9]{9}$/).test(altMobileNumber)) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") });
      }

      //if (email.length && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      //throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_EMAIL_INVALID") });
      //}
      if (email.length && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/.test(email)) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_EMAIL_INVALID") });
      }

      if (currentPassword.length || newPassword.length || confirmPassword.length) {
        if (newPassword !== confirmPassword) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_MISMATCH") });
        }

        if (!(currentPassword.length && newPassword.length && confirmPassword.length)) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") });
        }

        if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(newPassword) && !new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(confirmPassword)) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") });
        }
      }
      requestData["locale"] = Digit.StoreData.getCurrentLanguage();
      const { responseInfo, user } = await Digit.UserService.updateUser(requestData, stateCode);

      if (responseInfo && responseInfo.status === "200") {
        const user = Digit.UserService.getUser();

        if (user) {
          Digit.UserService.setUser({
            ...user,
            info: {
              ...user.info,
              name,
              //DOB,
              mobileNumber,
              altContactNumber: altMobileNumber,
              emailId: email,
              permanentCity: city,
              photo: profileImg,
              correspondenceAddress: city,
            },
          });
        }
      }

      if (currentPassword.length && newPassword.length && confirmPassword.length) {
        const requestData = {
          existingPassword: currentPassword,
          newPassword: newPassword,
          tenantId: tenant,
          type: "EMPLOYEE",
          username: userInfo?.userName,
          confirmPassword: confirmPassword,
        };

        if (newPassword === confirmPassword) {
          try {
            const res = await Digit.UserService.changePassword(requestData, tenant);

            const { responseInfo: changePasswordResponseInfo } = res;
            if (changePasswordResponseInfo?.status && changePasswordResponseInfo.status === "200") {
              showToast("success", t("CORE_COMMON_PROFILE_UPDATE_SUCCESS_WITH_PASSWORD"), 5000);
            } else {
              throw "";
            }
          } catch (error) {
            throw JSON.stringify({
              type: "error",
              message: error.Errors?.at(0)?.description ? error.Errors.at(0).description : t("CORE_COMMON_PROFILE_UPDATE_ERROR_WITH_PASSWORD"),
            });
          }
        } else {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_ERROR_PASSWORD_NOT_MATCH") });
        }
      } else if (responseInfo?.status && responseInfo.status === "200") {
        showToast("success", t("CORE_COMMON_PROFILE_UPDATE_SUCCESS"), 5000);
      }
    } catch (error) {
      const errorObj = JSON.parse(error);
      showToast(errorObj.type, t(errorObj.message), 5000);
    }

    setLoading(false);
  };

  let menu = [];
  const { data: Menu } = Digit.Hooks.pt.useGenderMDMS(stateId, "common-masters", "GenderType");
  Menu &&
    Menu.map((genderDetails) => {
      menu.push({ i18nKey: `PT_COMMON_GENDER_${genderDetails.code}`, code: `${genderDetails.code}`, value: `${genderDetails.code}` });
    });

  const setFileStoreId = async (fileStoreId) => {
    setProfilePic(fileStoreId);

    const thumbnails = fileStoreId ? await getThumbnails([fileStoreId], stateId) : null;

    setProfileImg(thumbnails?.thumbs[0]);

    closeFileUploadDrawer();
  };

  const getThumbnails = async (ids, tenantId) => {
    const res = await Digit.UploadServices.Filefetch(ids, tenantId);
    if (res.data.fileStoreIds && res.data.fileStoreIds.length !== 0) {
      return {
        thumbs: res.data.fileStoreIds.map((o) => o.url.split(",")[3]),
        images: res.data.fileStoreIds.map((o) => Digit.Utils.getFileUrl(o.url)),
      };
    } else {
      return null;
    }
  };

  const ActionButton = ({ onClick }) => {
    return <LinkButton label={<EditIcon style={{ float: "right" }} />} className="check-page-link-button" onClick={onClick} />;
  };

  const columns = React.useMemo(
    () => [
      {
        Header: t("ADDRESS_TYPE"),
        accessor: "addressType",
        Cell: ({ row }) => {
          const address = row.original;
          return (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: address.addressType === "CORRESPONDENCE" ? "#E3F2FD" : "#E8F5E9",
                color: address.addressType === "CORRESPONDENCE" ? "#1976D2" : "#2E7D32",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {t(`${address.addressType}`)}
            </span>
          );
        },
      },
      {
        Header: t("ADDRESS_DETAILS"),
        accessor: (row) => `${row.houseNumber || ""} ${row.locality || ""}`,
        Cell: ({ row }) => {
          const address = row.original;
          return (
            <div>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>{address.houseNumber || t("CS_NA")}</div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>{address.locality || ""}</div>
            </div>
          );
        },
      },
      {
        Header: t("CITY"),
        accessor: "city",
      },
      {
        Header: t("PINCODE"),
        accessor: "pinCode",
      },
      {
        Header: t("ACTIONS"),
        Cell: ({ row }) => {
          const address = row.original;
          return (
            <ActionButton
              onClick={() => {
                setSelectedAddress(address);
                setShowModal(true);
                setisEdit(true);
              }}
            />
          );
        },
      },
    ],
    [t]
  );

  if (loading) return <Loader />;

  if (userType === "citizen") {
    return (
      <div className="ground-container employee-app-container form-container" style={{ width: "100%", margin: "0 auto" }}>
        <ModuleHeader
          leftContent={
            <React.Fragment>
              <ArrowLeft className="icon" />
              Back
            </React.Fragment>
          }
          onLeftClick={() => history.goBack()}
          breadcrumbs={[
            { icon: HomeIcon, path: "/digit-ui/citizen" },
            { label: t("Edit profile"), path: "/digit-ui/citizen/user/profile" },
          ]}
        />

        <div
          className="collapsible-card-tabs"
          style={{ maxWidth: "480px", margin: "0 auto 24px", background: "#e9f0f5", padding: "4px", borderRadius: "999px" }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            className={`collapsible-card-tab-button ${activeTab === "profile" ? "active" : ""}`}
            style={{
              flex: "1",
              padding: "10px 32px",
              borderRadius: "999px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "profile" ? "#2177BD" : "transparent",
              color: activeTab === "profile" ? "white" : "#4b5563",
              boxShadow: activeTab === "profile" ? "0 2px 10px rgba(33, 119, 189, 0.3)" : "none",
            }}
          >
            {t("PROFILE")}
          </button>
          <button
            onClick={() => setActiveTab("address")}
            className={`collapsible-card-tab-button ${activeTab === "address" ? "active" : ""}`}
            style={{
              flex: "1",
              padding: "10px 32px",
              borderRadius: "999px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "address" ? "#2177BD" : "transparent",
              color: activeTab === "address" ? "white" : "#4b5563",
              boxShadow: activeTab === "address" ? "0 2px 10px rgba(33, 119, 189, 0.3)" : "none",
            }}
          >
            {t("ADDRESS")}
          </button>
        </div>

        <div className="employee-form-content">
          <div
            className={`user-profile-wrapper no-scrollbar employee-form-content-with-action-bar employee ${
              activeTab === "address" ? "address-tab" : "default-tab"
            }`}
            style={{ maxWidth: "unset" }}
          >
            {activeTab !== "address" ? (
              <section className="profile-card no-scrollbar employee" style={{ maxWidth: "unset" }}>
                <div className="profile-image-wrapper employee">
                  <span className="profile-image-background"></span>
                  <div className="profile-circle-wrapper">
                    <img className="profile-image" src={profileImg || defaultImage} alt="profileImg" />
                    <button className="profile-camera-btn" onClick={onClickAddPic}>
                      <EditPencilIcon color="#fff" />
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="user-form no-scrollbar" style={{ width: "100%", margin: "0 auto", height: "fit-content" }}>
              <section
                className={`profile-content employee ${activeTab === "address" ? "address-tab" : "default-tab"}`}
                style={{ maxWidth: "unset", height: activeTab === "address" ? "fit-content" : "100%" }}
              >
                <div className="formcomposer-grid-container-form">
                  <div className="formcomposer-section-grid">
                    {activeTab === "profile" ? (
                      <Fragment>
                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_NAME")}`}*</Label>
                          <div style={{ width: "100%" }}>
                            <TextInput
                              t={t}
                              type={"text"}
                              name="name"
                              value={name}
                              onChange={(e) => setUserName(e.target.value)}
                              disable={editScreen}
                            />
                          </div>
                        </LabelFieldPair>

                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_GENDER")}`}</Label>
                          <Dropdown
                            style={{ width: "100%" }}
                            selected={gender?.length === 1 ? gender[0] : gender}
                            disable={gender?.length === 1 || editScreen}
                            option={menu}
                            select={setGenderName}
                            value={gender}
                            optionKey="code"
                            t={t}
                            name="gender"
                          />
                        </LabelFieldPair>

                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_DOB")}*`}</Label>
                          <div style={{ width: "100%" }}>
                            <DatePicker date={dob || dateOfBirth} onChange={setUserDOB} disable={true} />
                          </div>
                        </LabelFieldPair>

                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_MOBILE_NUMBER")}*`}</Label>
                          <div style={{ width: "100%" }}>
                            <MobileNumber value={mobileNumber} disable={true} />
                          </div>
                        </LabelFieldPair>

                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_ALT_MOBILE_NUMBER")}`}</Label>
                          <div style={{ width: "100%" }}>
                            <MobileNumber
                              value={altMobileNumber}
                              name="altMobileNumber"
                              onChange={(value) => setAltMobileNo(value)}
                              disable={editScreen}
                            />
                          </div>
                        </LabelFieldPair>

                        <LabelFieldPair style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <Label style={{ marginBottom: "8px" }}>{`${t("CORE_COMMON_PROFILE_EMAIL")}`}</Label>
                          <div style={{ width: "100%" }}>
                            <TextInput
                              t={t}
                              type={"email"}
                              name="email"
                              value={email}
                              onChange={(e) => setUserEmailAddress(e.target.value)}
                              disable={editScreen}
                            />
                          </div>
                        </LabelFieldPair>
                      </Fragment>
                    ) : activeTab === "address" ? (
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                          <button
                            onClick={() => {
                              setSelectedAddress(null);
                              setisEdit(false);
                              setShowModal(true);
                            }}
                            className="profile-save-btn desktop"
                            style={{
                              backgroundColor: "#2177BD",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 48px",
                              color: "#FFFFFF",
                              cursor: "pointer",
                              fontWeight: "600",
                              transition: "all 0.3s ease",
                              boxShadow: "0 2px 10px rgba(33, 119, 189, 0.3)",
                            }}
                          >
                            {t("ADD_NEW_ADDRESS")}
                          </button>
                        </div>
                        {showModal && <Address isEdit={isEdit} address={selectedAddress} actionCancelOnSubmit={handleModalClose} />}
                        {userAddresses.length > 0 ? (
                          <div>
                            <Table t={t} data={userAddresses} columns={columns} disableSort={true} autoWidth={true} className="user-address-table" />
                          </div>
                        ) : (
                          <div
                            style={{
                              background: "#fff",
                              borderRadius: "16px",
                              padding: "48px",
                              textAlign: "center",
                              border: "1px dashed #d1d5db",
                            }}
                          >
                            <p style={{ color: "#6b7280", fontSize: "16px" }}>{t("CS_NO_ADDRESS_AVAILABLE")}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                {activeTab === "profile" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                    <button
                      className="profile-save-btn desktop"
                      onClick={updateProfile}
                      style={{
                        backgroundColor: "#2177BD",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 48px",
                        color: "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      {t("CORE_COMMON_SAVE")}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {toast && (
          <Toast
            error={toast.key === "error"}
            label={t(toast.key === "success" ? `CORE_COMMON_PROFILE_UPDATE_SUCCESS` : toast.action)}
            onClose={() => setToast(null)}
            style={{ maxWidth: "670px" }}
          />
        )}

        {openUploadSlide === true && (
          <UploadDrawer
            setProfilePic={setFileStoreId}
            closeDrawer={closeFileUploadDrawer}
            userType={userType}
            removeProfilePic={removeProfilePic}
            showToast={showToast}
          />
        )}
      </div>
    );
  }

  // ELSE: Employee View (Reverted to Legacy)
  return (
    <React.Fragment>
      <ModuleHeader
        leftContent={
          <React.Fragment>
            <ArrowLeft className="icon" />
            Back
          </React.Fragment>
        }
        onLeftClick={() => history.goBack()}
        breadcrumbs={[
          { icon: HomeIcon, path: "/digit-ui/employee/" },
          { label: t("ES_COMMON_PAGE_1"), path: "/digit-ui/employee/user/profile" },
        ]}
      />
      <div className="user-profile-wrapper no-scrollbar employee-form-content-with-action-bar employee default-tab">
        <section className="profile-card no-scrollbar employee">
          <div className="profile-image-wrapper employee">
            <span className="profile-image-background"></span>
            <div className="profile-circle-wrapper">
              <img className="profile-image" src={profileImg || defaultImage} alt="profileImg" />
              <button className="profile-camera-btn" onClick={onClickAddPic}>
                <EditPencilIcon color="#fff" />
              </button>
            </div>
          </div>
        </section>
        <div className="user-form no-scrollbar">
          <section className="profile-content employee default-tab">
            <div className="formcomposer-grid-container-form">
              <div className="formcomposer-section-grid">
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("HR_EMP_ID_LABEL")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput t={t} type={"text"} isMandatory={false} name="code" value={userInfo?.userName} disable />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("HR_DESG_LABEL")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput t={t} type={"text"} name="desg" value={t(`COMMON_MASTERS_DESIGNATION_${designationName}`)} disable />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("HR_DEPT_LABEL")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput t={t} type={"text"} name="dept" value={t(`COMMON_MASTERS_DEPARTMENT_${departmentName}`)} disable />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("CORE_COMMON_PROFILE_NAME")}*
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput t={t} type={"text"} name="name" value={name} onChange={(e) => setUserName(e.target.value)} disable={editScreen} />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("CORE_COMMON_PROFILE_GENDER")}
                  </Label>
                  <Dropdown
                    style={{ width: "100%" }}
                    selected={gender?.length === 1 ? gender[0] : gender}
                    disable={gender?.length === 1 || editScreen}
                    option={menu}
                    select={setGenderName}
                    value={gender}
                    optionKey="code"
                    t={t}
                    name="gender"
                  />
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("CORE_COMMON_PROFILE_CITY")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput t={t} type={"text"} name="city" value={t(city)} disable />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={{}}>
                    {t("CORE_COMMON_PROFILE_MOBILE_NUMBER")}*
                  </Label>
                  <div style={{ width: "100%" }}>
                    <MobileNumber value={mobileNumber} name="mobileNumber" disable={true} />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("CORE_COMMON_PROFILE_EMAIL")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <TextInput
                      t={t}
                      type={"email"}
                      name="email"
                      value={email}
                      onChange={(e) => setUserEmailAddress(e.target.value)}
                      disable={editScreen}
                    />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <Label className="profile-label-margin" style={editScreen ? { color: "#B1B4B6" } : {}}>
                    {t("CORE_COMMON_PROFILE_DOB")}
                  </Label>
                  <div style={{ width: "100%" }}>
                    <DatePicker date={dob || dateOfBirth} disable={true} />
                  </div>
                </LabelFieldPair>
              </div>
              <div className="grid-title">
                <button className="generic-button grid-title" style={{ cursor: "pointer", position: "relative" }} onClick={TogleforPassword}>
                  {t("CORE_COMMON_CHANGE_PASSWORD")}
                </button>
              </div>
              {changepassword && (
                <div className="formcomposer-section-grid">
                  <LabelFieldPair>
                    <Label className="profile-label-margin">{t("CORE_COMMON_PROFILE_CURRENT_PASSWORD")}</Label>
                    <div style={{ width: "100%" }}>
                      <TextInput t={t} type={"password"} onChange={(e) => setUserCurrentPassword(e.target.value)} disable={editScreen} />
                    </div>
                  </LabelFieldPair>
                  <LabelFieldPair>
                    <Label className="profile-label-margin">{t("CORE_COMMON_PROFILE_NEW_PASSWORD")}</Label>
                    <div style={{ width: "100%" }}>
                      <TextInput t={t} type={"password"} onChange={(e) => setUserNewPassword(e.target.value)} disable={editScreen} />
                    </div>
                  </LabelFieldPair>
                  <LabelFieldPair>
                    <Label className="profile-label-margin">{t("CORE_COMMON_PROFILE_CONFIRM_PASSWORD")}</Label>
                    <div style={{ width: "100%" }}>
                      <TextInput t={t} type={"password"} onChange={(e) => setUserConfirmPassword(e.target.value)} disable={editScreen} />
                    </div>
                  </LabelFieldPair>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div
        style={{
          height: "52px",
          backgroundColor: "#FFFFFF",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          position: "fixed",
          bottom: 0,
          width: "100%",
          left: 0,
          zIndex: 12,
        }}
      >
        <button
          className="generic-button"
          onClick={updateProfile}
          style={{
            backgroundColor: "#2177BD",
            width: windowWidth < 768 ? "100%" : "248px",
            height: "40px",
            marginRight: windowWidth < 768 ? "16px" : "31px",
            color: "white",
            cursor: "pointer",
          }}
        >
          {t("CORE_COMMON_SAVE")}
        </button>
      </div>

      {toast && (
        <Toast
          error={toast.key === "error"}
          label={t(toast.key === "success" ? `CORE_COMMON_PROFILE_UPDATE_SUCCESS` : toast.action)}
          onClose={() => setToast(null)}
          style={{ maxWidth: "670px" }}
        />
      )}

      {openUploadSlide === true && (
        <UploadDrawer
          setProfilePic={setFileStoreId}
          closeDrawer={closeFileUploadDrawer}
          userType={userType}
          removeProfilePic={removeProfilePic}
          showToast={showToast}
        />
      )}
    </React.Fragment>
  );
};

export default UserProfile;
