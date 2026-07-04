import React, { useState } from "react";
import { ArrowDown, EditPencilIcon, LogoutIcon } from "@djb25/digit-ui-react-components";

const TextToImg = (props) => (
  <span className="user-img-txt" onClick={props.toggleMenu} title={props.name}>
    {props?.name?.[0]?.toUpperCase()}
  </span>
);

const CustomUserDropdown = ({
  userOptions = [],
  roleOptions = [],
  selectedRole,
  handleRoleChange,
  profilePic,
  userName,
  designation,
  userCode,
  t,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (option) => {
    if (option.func) {
      option.func();
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* User Avatar Pill */}
      <div className="user-profile-pill" onClick={toggleDropdown}>
        {!profilePic ? (
          <div className="user-profile-avatar">{userName?.[0]?.toUpperCase() || "E"}</div>
        ) : (
          <img className="user-profile-img" src={profilePic} alt={userName} />
        )}
        <div className="user-profile-info">
          <div className="user-profile-name">{userName}</div>
          <div className="user-profile-details">
            {designation ? `${designation} · ` : ""}
            {userCode}
          </div>
        </div>
        <ArrowDown className="chevron-icon" style={{ width: "14px", height: "14px" }} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <div
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />

          {/* Main Dropdown Content */}
          <div
            className="user-profile-dropdown"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              backgroundColor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: "8px",
              minWidth: "220px",
              zIndex: 999,
              overflow: "hidden",
            }}
          >
            {/* Edit Profile */}
            <div
              onClick={() => handleOptionClick(userOptions[0])}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                borderBottom: "1px solid #e0e0e0",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <EditPencilIcon className="icon" style={{ width: "16px", height: "16px" }} />
              <span>{userOptions[0]?.name}</span>
            </div>

            {/* Logout */}
            <div
              onClick={() => handleOptionClick(userOptions[1])}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <LogoutIcon className="icon" style={{ width: "16px", height: "16px" }} />
              <span>{userOptions[1]?.name}</span>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default CustomUserDropdown;
