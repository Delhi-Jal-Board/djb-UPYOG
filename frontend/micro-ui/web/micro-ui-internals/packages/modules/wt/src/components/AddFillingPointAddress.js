import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SubmitBar, Toast, Loader } from "@djb25/digit-ui-react-components";
import { fillingPointPayload } from "../utils";
import { useLocation, useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";
import AddFillingPointMetaData from "./AddFillingPointMetaData";
import AddFixFillAddress from "./AddFixFillAddress";
import VerticalTimeline from "./VerticalTimeline";

const AddFillingPointAddress = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("id");

  const [formData, setFormData] = useState({});
  const [showToast, setShowToast] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const addressConfig = { key: "address" };

  // ✅ Fetch data if editing
  const { isLoading: isEditLoading, data: editData } = Digit.Hooks.wt.useFillPointSearch(
    { tenantId, filters: { id: editId } },
    { enabled: !!editId }
  );

  const handleSelect = (key, data) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...data,
      },
    }));
  };

  useEffect(() => {
    if (editId && editData?.fillingPoints) {
      // Find the specific record that matches the ID from the URL
      const data = editData.fillingPoints.find((item) => item.id === editId);

      if (data) {
        setFormData({
          id: data.id,
          tenantId: data.tenantId,
          status: data.status,
          owner: {
            fillingPointName: data.fillingPointName,
            emergencyName: data.emergencyName,
            aeName: data.aeName,
            aeMobile: data.aeMobile,
            aeEmail: data.aeEmail,
            jeName: data.jeName,
            jeMobile: data.jeMobile,
            jeEmail: data.jeEmail,
            eeName: data.eeName,
            eeMobile: data.eeMobile,
            eeEmail: data.eeEmail,
          },
          address: {
            ...data.address,
          },
        });
      }
    }
  }, [editData, editId]);

  const onSelect = (key, data) => {
    setFormData((prev) => ({ ...prev, [key]: data }));
  };

  const { mutate: createFillingPoint } = Digit.Hooks.wt.useCreateFillPoint(tenantId);
  const { mutate: updateFillingPoint } = Digit.Hooks.wt.useUpdateFillPoint(tenantId);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const payload = fillingPointPayload({
      ...formData,
      tenantId,
    });

    const mutation = editId ? updateFillingPoint : createFillingPoint;

    mutation(payload, {
      onSuccess: () => {
        setShowToast({ label: editId ? t("WT_FILLING_POINT_UPDATED_SUCCESS") : t("WT_FILLING_POINT_CREATED_SUCCESS") });
        queryClient.invalidateQueries("wtFillPointSearchList");
        setTimeout(() => {
          setShowToast(null);
          history.push(`/digit-ui/employee/wt/search-filling-fix-point?tab=FILLING_POINT`);
        }, 3000);
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.error?.message || 
                           error?.response?.data?.Errors?.[0]?.message || 
                           error?.response?.data?.responseInfo?.resMsgId || 
                           (editId ? t("WT_FILLING_POINT_UPDATED_ERROR") : t("WT_FILLING_POINT_CREATED_ERROR"));
        setShowToast({
          label: errorMessage,
          isError: true,
        });
        setTimeout(() => setShowToast(null), 5000);
      },
    });
  };

  const isMobile = window.Digit.Utils.browser.isMobile();

  const isFormDisabled =
    !formData?.owner?.aeName ||
    !formData?.owner?.aeMobile ||
    !formData?.owner?.jeName ||
    !formData?.owner?.jeMobile ||
    !formData?.owner?.eeName ||
    !formData?.owner?.eeMobile ||
    !formData?.address?.addressLine1 ||
    !formData?.address?.city ||
    !formData?.address?.locality ||
    !formData?.address?.latitude ||
    !formData?.address?.longitude ||
    !formData?.address?.pincode;

  if (isEditLoading) return <Loader />;

  return (
    <div className="employee-form-section-wrapper">
      <VerticalTimeline config={[{ timeLine: [{ actions: editId ? "Update Filling Point" : "Add Filling Point", currentStep: 1 }] }]} showFinalStep={false} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <AddFillingPointMetaData
          t={t}
          config={{ key: "owner" }}
          onSelect={onSelect}
          formData={formData}
          visibleFields={[
            "fillingPointName",
            "emergencyName",
            "aeName",
            "aeMobile",
            "aeEmail",
            "jeName",
            "jeMobile",
            "jeEmail",
            "eeName",
            "eeMobile",
            "eeEmail",
          ]}
        />

        <AddFixFillAddress t={t} config={addressConfig} onSelect={handleSelect} formData={formData} isEdit={!!editId} />
        <div style={{ display: "flex", marginBottom: "24px", justifyContent: isMobile ? "center" : "flex-end" }}>
          <SubmitBar label={editId ? t("ES_COMMON_UPDATE") : t("ES_COMMON_SAVE")} onSubmit={handleSubmit} disabled={isFormDisabled} />
        </div>
      </div>

      {showToast && <Toast error={showToast.isError} label={showToast.label} onClose={() => setShowToast(null)} />}
    </div>
  );
};

export default AddFillingPointAddress;
