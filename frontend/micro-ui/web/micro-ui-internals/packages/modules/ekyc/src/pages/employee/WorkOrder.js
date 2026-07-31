import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Label, DatePicker, SubmitBar, Toast, Dropdown, UploadFile, CollapsibleCardPage, VerticalTimeline } from "@djb25/digit-ui-react-components";

const WorkOrder = () => {
    const tenantId = Digit.ULBService.getCurrentTenantId();
    const { t } = useTranslation();
    const history = useHistory();

    const [showToast, setShowToast] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [validFrom, setValidFrom] = useState("");
    const [validTo, setValidTo] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const { data: vendorOptions, isLoading: isVendorLoading } = Digit.Hooks.fsm.useVendorSearch({
        tenantId,
        filters: { status: "ACTIVE" },
        config: {
            select: (data) => data?.vendor || [],
        },
    });

    const { mutate: createWorkOrder } = Digit.Hooks.wt.useVendorWorkOrderCreate(tenantId);

    useEffect(() => {
        (async () => {
            setError(null);
            if (file) {
                if (file.size >= 10000000) {
                    setError(t("EKYC_MAXIMUM_UPLOAD_SIZE_EXCEEDED") || "File size exceeds 10MB");
                } else {
                    try {
                        const response = await Digit.UploadServices.Filestorage("EKYC", file, Digit.ULBService.getStateId());
                        if (response?.data?.files?.length > 0) {
                            setUploadedFile(response?.data?.files[0]?.fileStoreId);
                        } else {
                            setError(t("EKYC_FILE_UPLOAD_ERROR"));
                        }
                    } catch (err) {
                        setError(t("EKYC_FILE_UPLOAD_ERROR"));
                    }
                }
            }
        })();
    }, [file]);

    const handleSubmit = () => {
        const payload = {
            vendorWorkOrder: {
                tenantId,
                name: vendor?.name,
                mobileNumber: vendor?.owner?.mobileNumber,
                emailId: vendor?.owner?.emailId,
                vendorId: vendor?.code || vendor?.id,
                validFrom: new Date(validFrom).getTime(),
                validTo: new Date(validTo).getTime(),
                serviceType: "EKYC",
                fileStoreId: uploadedFile,
            },
        };

        createWorkOrder(payload, {
            onSuccess: (result) => {
                setShowToast({ isError: false, label: t("EKYC_WORK_ORDER_SAVE_SUCCESS") });
                setTimeout(() => {
                    history.push("/digit-ui/employee/module/details");
                }, 3000);
            },
            onError: (err) => {
                setShowToast({ isError: true, label: err?.response?.data?.Errors?.[0]?.message || t("EKYC_WORK_ORDER_SAVE_ERROR") });
            },
        });
    };

    function selectfile(e) {
        setUploadedFile(null);
        setFile(e.target.files[0]);
    }

    const isFormDisabled = !vendor || !validFrom || !validTo || !uploadedFile;
    const isMobile = window.Digit.Utils.browser.isMobile();

    return (
        <div className="employee-form-section-wrapper">
            <VerticalTimeline config={[{ timeLine: [{ actions: t("EKYC_WORK_ORDER_ASSIGN"), currentStep: 1 }] }]} showFinalStep={false} />

            <div style={{ flex: 1 }}>
                <CollapsibleCardPage title={t("EKYC_UPLOAD_WORK_ORDER")} defaultOpen={true}>
                    <div className="formcomposer-section-grid">
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <Label>
                                {`${t("EKYC_VENDOR_NAME")}`} <span className="check-page-link-button">*</span>
                            </Label>
                            <Dropdown t={t} option={vendorOptions} optionKey="name" select={setVendor} selected={vendor} placeholder={t("EKYC_SELECT_VENDOR")} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <Label>
                                {`${t("COMMON_VALID_FROM_DATE")}`} <span className="check-page-link-button">*</span>
                            </Label>
                            <DatePicker date={validFrom} onChange={(date) => setValidFrom(date)} style={{ width: "100%" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <Label>
                                {`${t("COMMON_VALID_TO_DATE")}`} <span className="check-page-link-button">*</span>
                            </Label>
                            <DatePicker date={validTo} min={validFrom} onChange={(date) => setValidTo(date)} style={{ width: "100%" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <Label>{`${t("EKYC_UPLOAD_DOCUMENT")}`} <span className="check-page-link-button">*</span></Label>
                            <UploadFile
                                id={"ekyc-doc"}
                                extraStyleName={"propertyCreate"}
                                accept="image/*, .pdf, .png, .jpeg, .jpg"
                                onUpload={selectfile}
                                onDelete={() => setUploadedFile(null)}
                                message={uploadedFile ? `1 ${t(`EKYC_ACTION_FILEUPLOADED`)}` : t(`EKYC_ACTION_NO_FILEUPLOADED`)}
                                error={error}
                            />
                        </div>
                    </div>
                </CollapsibleCardPage>

                <div style={{ display: "flex", marginTop: "24px", justifyContent: isMobile ? "center" : "flex-end" }}>
                    <SubmitBar label={t("ES_COMMON_SAVE")} onSubmit={isFormDisabled ? null : handleSubmit} disabled={isFormDisabled} />
                </div>
            </div>

            {showToast && <Toast error={showToast.isError} label={showToast.label} onClose={() => setShowToast(null)} />}
        </div>
    );
};

export default WorkOrder;
