import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardText,
  CardLabel,
  TextInput,
  SubmitBar,
  Toast,
  Loader,
  CheckBox,
  CardSectionHeader,
  ActionBar,
  StatusTable,
  Row,
  LabelFieldPair,
} from "@djb25/digit-ui-react-components";

const RoleManagement = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [mobileNumber, setMobileNumber] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({
    EKYC_VENDOR: false,
    EKYC_SUPERVISOR: false,
    EKYC_SURVEYOR: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const handleSearch = async () => {
    if (!mobileNumber || mobileNumber.length !== 10 || !mobileNumber.match(/^[6789][0-9]{9}$/)) {
      setShowToast({ key: "error", label: t("ERR_INVALID_MOBILE_NUMBER", "Please enter a valid 10-digit mobile number starting with 6-9") });
      return;
    }
    setIsLoading(true);
    setSearchedUser(null);
    try {
      const res = await Digit.UserService.userSearch(tenantId, { mobileNumber }, {});
      if (res && res.user && res.user.length > 0) {
        const user = res.user[0];
        setSearchedUser(user);
        const roleCodes = user.roles.map((r) => r.code);
        setSelectedRoles({
          EKYC_VENDOR: roleCodes.includes("EKYC_VENDOR"),
          EKYC_SUPERVISOR: roleCodes.includes("EKYC_SUPERVISOR"),
          EKYC_SURVEYOR: roleCodes.includes("EKYC_SURVEYOR"),
        });
        setShowToast({ key: "success", label: t("ES_ROLE_USER_FOUND_SUCCESS", "User found successfully") });
      } else {
        setShowToast({ key: "error", label: t("ES_ROLE_USER_NOT_FOUND", "User not found with this mobile number") });
      }
    } catch (err) {
      setShowToast({ key: "error", label: err?.message || t("ES_ROLE_SEARCH_FAILED", "Failed to search user") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role, checked) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [role]: checked,
    }));
  };

  const handleSave = async () => {
    if (!searchedUser) return;
    setIsLoading(true);
    try {
      // Filter out existing EKYC/Vendor roles to replace them cleanly
      const baseRoles = searchedUser.roles.filter(
        (r) => r.code !== "EKYC_VENDOR" && r.code !== "EKYC_SUPERVISOR" && r.code !== "EKYC_SURVEYOR"
      );
      const updatedRoles = [...baseRoles];
      const stateCode = tenantId.split(".")[0];

      if (selectedRoles.EKYC_VENDOR) {
        updatedRoles.push({ code: "EKYC_VENDOR", name: "Ekyc Vendor", tenantId: stateCode });
      }
      if (selectedRoles.EKYC_SUPERVISOR) {
        updatedRoles.push({ code: "EKYC_SUPERVISOR", name: "Ekyc Supervisor", tenantId: stateCode });
      }
      if (selectedRoles.EKYC_SURVEYOR) {
        updatedRoles.push({ code: "EKYC_SURVEYOR", name: "Ekyc Surveyor", tenantId: stateCode });
      }

      // If the user has any of these roles, we should also ensure they have the CITIZEN role
      const hasAnyEkycRole = selectedRoles.EKYC_VENDOR || selectedRoles.EKYC_SUPERVISOR || selectedRoles.EKYC_SURVEYOR;
      if (hasAnyEkycRole && !updatedRoles.some((r) => r.code === "CITIZEN")) {
        updatedRoles.push({ code: "CITIZEN", name: "Citizen", tenantId: stateCode });
      }

      const updatedUser = {
        ...searchedUser,
        roles: updatedRoles,
      };

      await Digit.UserService.updateUserById(updatedUser);
      setSearchedUser(updatedUser);
      setShowToast({ key: "success", label: t("ES_ROLE_UPDATE_SUCCESS", "Roles updated successfully") });
    } catch (err) {
      setShowToast({ key: "error", label: err?.message || t("ES_ROLE_UPDATE_FAILED", "Failed to update user roles") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="employee-form-content">
      <Card>
        <CardHeader>{t("ES_ROLE_MANAGEMENT_TITLE", "Manage eKYC Roles")}</CardHeader>
        <CardText style={{ marginBottom: "24px" }}>
          {t("ES_ROLE_MANAGEMENT_SUBTITLE", "Search user by mobile number to manage their eKYC roles (Vendor, Supervisor, Surveyor).")}
        </CardText>

        <LabelFieldPair>
          <CardLabel>{t("ES_ROLE_SEARCH_MOBILE_LABEL", "Mobile Number")}</CardLabel>
          <div className="field">
            <TextInput
              type="text"
              name="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9876543210"
              maxlength={10}
            />
          </div>
        </LabelFieldPair>

        <SubmitBar
          label={t("ES_COMMON_SEARCH", "Search")}
          onSubmit={handleSearch}
          disabled={isLoading || mobileNumber.length !== 10}
          style={{ marginTop: "16px", marginBottom: "24px" }}
        />

        {isLoading && <Loader />}

        {searchedUser && (
          <div style={{ marginTop: "24px" }}>
            <CardSectionHeader style={{ marginBottom: "16px" }}>
              {t("ES_ROLE_USER_DETAILS_HEADER", "User Details")}
            </CardSectionHeader>
            <StatusTable>
              <Row label={t("ES_ROLE_USER_NAME", "User Name")} text={searchedUser.name} />
              <Row label={t("ES_ROLE_MOBILE_NUMBER", "Mobile Number")} text={searchedUser.mobileNumber} />
              <Row label={t("ES_ROLE_EMAIL_ID", "Email ID")} text={searchedUser.emailId || t("CS_NA", "N/A")} />
              <Row label={t("ES_ROLE_USER_UUID", "User UUID")} text={searchedUser.uuid} />
            </StatusTable>

            <CardSectionHeader style={{ marginTop: "24px", marginBottom: "16px" }}>
              {t("ES_ROLE_MANAGE_ROLES_HEADER", "Assign eKYC Roles")}
            </CardSectionHeader>

            <div className="employee-checkbox-container" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <CheckBox
                label={t("ROLE_EKYC_VENDOR", "eKYC Vendor")}
                checked={selectedRoles.EKYC_VENDOR}
                onChange={(e) => handleRoleChange("EKYC_VENDOR", e.target.checked)}
              />
              <CheckBox
                label={t("ROLE_EKYC_SUPERVISOR", "eKYC Supervisor")}
                checked={selectedRoles.EKYC_SUPERVISOR}
                onChange={(e) => handleRoleChange("EKYC_SUPERVISOR", e.target.checked)}
              />
              <CheckBox
                label={t("ROLE_EKYC_SURVEYOR", "eKYC Surveyor")}
                checked={selectedRoles.EKYC_SURVEYOR}
                onChange={(e) => handleRoleChange("EKYC_SURVEYOR", e.target.checked)}
              />
            </div>

            <ActionBar>
              <SubmitBar
                label={t("ES_COMMON_SAVE", "Save Changes")}
                onSubmit={handleSave}
                disabled={isLoading}
              />
            </ActionBar>
          </div>
        )}

        {showToast && (
          <Toast
            error={showToast.key === "error"}
            label={showToast.label}
            onClose={() => setShowToast(null)}
            duration={5000}
          />
        )}
      </Card>
    </div>
  );
};

export default RoleManagement;
