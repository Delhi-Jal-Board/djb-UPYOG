import { CardLabel, LabelFieldPair, TextInput, CheckBox, Dropdown, DatePicker, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSDjbEmployee = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { control, watch, setValue, formState: localFormState } = useForm({
    defaultValues: formData?.djbEmployee || {
      isDjbEmployee: false,
      employeeId: "",
      dor: "",
      designation: "",
    },
  });

  const formValue = watch();
  const isDjbEmployee = watch("isDjbEmployee");

  useEffect(() => {
    const isDifferent = !_.isEqual(formData?.djbEmployee, formValue);
    if (isDifferent) {
      const timer = setTimeout(() => {
        onSelect(config?.key, { ...formValue });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [formValue]);

  return (
    <React.Fragment>
      <CollapsibleCardPage title={t("WS_DJB_EMPLOYEE")} defaultOpen={true}>
        <div style={{ marginBottom: "24px" }}>
          <Controller
            control={control}
            name="isDjbEmployee"
            render={(props) => <CheckBox label={t("WS_DJB_EMPLOYEE")} checked={props.value} onChange={(e) => props.onChange(e.target.checked)} />}
          />
        </div>

        {isDjbEmployee && (
          <div className="formcomposer-section-grid">
            <div>
              <LabelFieldPair>
                <CardLabel>{t("WS_EMPLOYEE_ID") + " *"}</CardLabel>
                <Controller
                  control={control}
                  name="employeeId"
                  rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                  render={(props) => <TextInput value={props.value} onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} />}
                />
              </LabelFieldPair>
            </div>

            <div>
              <LabelFieldPair>
                <CardLabel>{t("WS_DATE_OF_RETIREMENT") + " *"}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name="dor"
                    rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                    render={(props) => <DatePicker date={props.value} onChange={(date) => props.onChange(date)} />}
                  />
                </div>
              </LabelFieldPair>
            </div>

            <div>
              <LabelFieldPair>
                <CardLabel>{t("WS_EMPLOYEE_DESIGNATION") + " *"}</CardLabel>
                <div className="field">
                  <Controller
                    control={control}
                    name="designation"
                    rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                    render={(props) => <TextInput value={props.value} onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} />}
                  />
                </div>
              </LabelFieldPair>
            </div>
          </div>
        )}
      </CollapsibleCardPage>
    </React.Fragment>
  );
};

export default WSDjbEmployee;
