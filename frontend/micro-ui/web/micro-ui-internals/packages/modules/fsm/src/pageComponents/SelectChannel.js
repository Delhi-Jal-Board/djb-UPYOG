import React, { useEffect, useState } from "react";
import { Loader } from "@djb25/digit-ui-react-components";
import { Dropdown } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";

const SelectChannel = ({ t, config, onSelect, formData = {}, userType }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const { pathname: url } = useLocation();
  const editScreen = url.includes("/modify-application/");

  const { data: channelMenu } = Digit.Hooks.fsm.useMDMS(tenantId, "FSM", "EmployeeApplicationChannel");
  const [channel, setChannel] = useState(formData?.channel);

  useEffect(() => {
    if (channelMenu && channelMenu.length > 0) {
      const selectedOption = channelMenu.find(
        (item) => item.code === (formData?.channel?.code || formData?.channel || channel?.code)
      );
      const defaultOption = selectedOption || channelMenu.find((item) => item.code === "COUNTER") || channelMenu[0];
      if (!channel && defaultOption) {
        setChannel(defaultOption);
        onSelect(config.key, defaultOption);
      }
    }
  }, [channelMenu, formData?.channel]);

  function selectChannel(value) {
    setChannel(value);
    onSelect(config.key, value);
  }

  return channelMenu ? (
    <Dropdown
      option={channelMenu}
      optionKey="i18nKey"
      id="channel"
      selected={channel}
      select={selectChannel}
      t={t}
      disable={editScreen}
      autoFocus={!editScreen}
    />
  ) : (
    <Loader />
  );
};

export default SelectChannel;
