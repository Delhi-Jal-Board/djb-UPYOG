import { CardLabel, LabelFieldPair, TextInput, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";

const WSActivationCommentsDetails = ({ t, config, userType, formData, onSelect }) => {
  const [comments, setComments] = useState({
    comments: formData?.comments?.comments || "",
  });

  useEffect(() => {
    if (onSelect && config?.key) {
      onSelect(config.key, { ...formData?.[config?.key], ...comments });
    }
  }, [comments]);

  return (
    <React.Fragment>
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WF_COMMON_COMMENTS") || "Comments"}
          isMandatory={false}
          infoText={t("WF_COMMON_COMMENTS_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            key={config.key}
            value={comments.comments}
            onChange={(ev) => {
              setComments({ ...comments, comments: ev.target.value });
            }}
          ></TextInput>
        </div>
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default WSActivationCommentsDetails;
