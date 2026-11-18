import React, { useState, useEffect } from "react";
import { SubmitBar, Toast, Loader, CardLabel, TextInput, MobileNumber, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";
import AddFixFillAddress from "./AddFixFillAddress";
import { fixedPointPayload } from "../utils";
import VerticalTimeline from "./VerticalTimeline";

const AddFixPointAddress = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("id");

  const [formData, setFormData] = useState({});
  const [showToast, setShowToast] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();

  // ✅ Memoize filters and config to prevent excessive re-fetching/re-renders
  const searchFilters = React.useMemo(() => ({ tenantId, filters: { id: editId } }), [tenantId, editId]);
  const searchConfig = React.useMemo(() => ({ enabled: !!editId }), [editId]);

  // ✅ Fetch data if editing
  const { isLoading: isEditLoading, data: editData } = Digit.Hooks.wt.useFixedPointSearchAPI(searchFilters, searchConfig);

  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    if (editId && editData?.waterTankerBookingDetail && !isDataFetched) {
      const data =
        editData.waterTankerBookingDetail.find(
          (item) =>
            item?.applicantDetail?.applicantId === editId ||
            item?.id === editId ||
            item?.bookingId === editId ||
            item?.applicantDetail?.fixedPointId === editId
        ) || editData.waterTankerBookingDetail[0];

      if (data) {
        setFormData({
          owner: {
            name: data.applicantDetail?.name || data?.name || "",
            mobileNumber: data.applicantDetail?.mobileNumber || "",
            alternateNumber: data.applicantDetail?.alternateNumber || "",
            emailId: data.applicantDetail?.emailId || "",
            applicantId: data.applicantDetail?.applicantId || data?.id || "",
          },
          address: {
            ...(data.address || {}),
            addressId: data.address?.addressId,
            applicantId: data.address?.applicantId,
            block: data.address?.ward || data.address?.block,
            assembly: data.address?.constituency || data.address?.assembly,
          },
          bookingId: data.bookingId || data?.id,
          bookingNo: data.bookingNo,
          auditDetails: data.auditDetails,
        });
        setIsDataFetched(true);
      }
    }
  }, [editData, editId, isDataFetched]);

  const addressConfig = React.useMemo(() => ({ key: "address" }), []);

  const handleSelect = React.useCallback((key, data) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...data,
      },
    }));
  }, []);

  const { mutate: createFixedPoint } = Digit.Hooks.wt.useCreateFixedPoint(tenantId);
  const { mutate: updateFixedPoint } = Digit.Hooks.wt.useUpdateFixedPoint(tenantId);

  const handleSubmit = (e) => {
    const payload = fixedPointPayload({
      ...formData,
      tenantId,
    });

    const mutation = editId ? updateFixedPoint : createFixedPoint;
    mutation(payload, {
      onSuccess: () => {
        setShowToast({ label: editId ? t("WT_FILLING_POINT_UPDATED_SUCCESS") : t("WT_FILLING_POINT_CREATED_SUCCESS") });
        queryClient.invalidateQueries("wtFixedPointSearchList");
        setTimeout(() => {
          setShowToast(null);
          history.push("/digit-ui/employee/wt/search-filling-fix-point?tab=FIXED_POINT");
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
    !formData?.owner?.name ||
    !formData?.owner?.mobileNumber ||
    !formData?.address?.addressLine1 ||
    !formData?.address?.city ||
    !formData?.address?.locality ||
    !formData?.address?.latitude ||
    !formData?.address?.longitude ||
    !formData?.address?.pincode;

  if (isEditLoading) return <Loader />;

  return (
    <div className="employee-form-section-wrapper">
      <VerticalTimeline config={[{ timeLine: [{ actions: editId ? "Update Fixed Point" : "Add Fixed Point", currentStep: 1 }] }]} showFinalStep={false} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <CollapsibleCardPage title={t("Fixed Point Details")} defaultOpen={true}>
          <div className="formcomposer-section-grid">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <CardLabel>
                {`${t("WT_FIXING_POINT_APPLICANT_DETAILS")}`} <span className="astericColor">*</span>
              </CardLabel>
              <TextInput
                t={t}
                type={"text"}
                // isMandatory={true}
                name="name"
                value={formData?.owner?.name}
                style={{ width: "100%" }}
                onChange={(e) => handleSelect("owner", { name: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <CardLabel>
                {`${t("COMMON_MOBILE_NUMBER")}`} <span className="astericColor">*</span>
              </CardLabel>
              <MobileNumber
                value={formData?.owner?.mobileNumber}
                name="mobileNumber"
                onChange={(value) => handleSelect("owner", { mobileNumber: value })}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <CardLabel>
                {`${t("COMMON_EMAIL_ID")}`}
              </CardLabel>
              <TextInput
                t={t}
                type={"email"}
                // isMandatory={true}
                name="emailId"
                value={formData?.owner?.emailId}
                style={{ width: "100%" }}
                onChange={(e) => handleSelect("owner", { emailId: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <CardLabel>{`${t("COMMON_ALT_MOBILE_NUMBER")}`}</CardLabel>
              <MobileNumber
                value={formData?.owner?.alternateNumber}
                name="alternateNumber"
                onChange={(value) => handleSelect("owner", { alternateNumber: value })}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </CollapsibleCardPage>
        <div>
          <AddFixFillAddress t={t} config={addressConfig} onSelect={handleSelect} formData={formData} isEdit={!!editId} />
        </div>
        <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end" }}>
          <SubmitBar label={editId ? t("ES_COMMON_UPDATE") : t("ES_COMMON_SAVE")} onSubmit={handleSubmit} disabled={isFormDisabled} />
        </div>
      </div>
      {showToast && <Toast error={showToast.isError} label={showToast.label} onClose={() => setShowToast(null)} />}
    </div>
  );
};

export default AddFixPointAddress;
