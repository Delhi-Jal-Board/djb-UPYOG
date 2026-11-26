import React, { useEffect, useState } from "react";
import { Loader, Dropdown, LabelFieldPair, CardLabel } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";

const SelectChannel = ({ t, config, onSelect, formData = {}, userType, isInline }) => {
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

  if (!channelMenu) {
    return <Loader />;
  }

  const dropdown = (
    <Dropdown
      option={channelMenu}
      optionKey="i18nKey"
      id="channel"
      selected={channel}
      select={selectChannel}
      t={t}
      disable={editScreen}
    />
  );

  if (!isInline && config?.label) {
    return (
      <LabelFieldPair>
        <CardLabel className="card-label-smaller">
          {t(config.label)}
          {config.isMandatory ? <span className="check-page-link-button"> * </span> : null}
        </CardLabel>
        <div className="field">{dropdown}</div>
      </LabelFieldPair>
    );
  }

  return dropdown;
};

export default SelectChannel;
