import React, { useState } from "react";
import { DateRange, Modal, CloseSvg } from "@djb25/digit-ui-react-components";

const EkycFilterModal = ({ t, onApply, onClose,customDate, setCustomDate,ekycStatus, setEkycStatus }) => {
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const ekycStatusOptions = [
    { label: "All", value: "ALL" },
    { label: "Submitted", value: "SUBMITTED" },
    // { label: "Approved", value: "APPROVED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    // { label: "Rejected", value: "REJECTED" },
    { label: "Revisit", value: "REVISIT" },
  ];

  return (
    <div className={`ekyc-report-filter ${isDatePickerOpen ? "ekyc-report-filter--date-open" : ""}`}>
      <Modal
        headerBarMain="eKYC Filters"
        headerBarEnd={
          <button type="button" onClick={onClose} aria-label="Close" className="ekyc-filter-modal-close">
            <CloseSvg height="24" width="24" />
          </button>
        }
        actionSaveLabel={t("DOWNLOAD_REPORT")}
        actionSaveOnSubmit={onApply}
        actionCancelLabel="Cancel"
        actionCancelOnSubmit={onClose}
        width="fitContent"
      >
        <div className="ekyc-filter-modal">
          {/* eKYC Status */}
          <section className="ekyc-filter-modal-section">
            <div className="ekyc-filter-modal-section-header">
              <span className="ekyc-filter-modal-label">eKYC Status</span>

              <span className="ekyc-filter-modal-hint">Select one</span>
            </div>

            <div className="ekyc-filter-modal-options">
              {ekycStatusOptions.map((option) => {
                const selected = ekycStatus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEkycStatus(option.value)}
                    className={selected ? "ekyc-filter-modal-option ekyc-filter-modal-option-selected" : "ekyc-filter-modal-option"}
                    aria-pressed={selected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Divider */}
          <div className="ekyc-filter-modal-divider" />

          {/* Date Range */}
          <section className="ekyc-filter-modal-section">
            <div className="ekyc-filter-modal-label">Date Range</div>

            <DateRange
              values={customDate}
              t={t}
              hideLabel
              onFilterChange={(data) => {
                setCustomDate(data.range);
              }}
              onOpenChange={setIsDatePickerOpen}
            />
          </section>
        </div>
      </Modal>
    </div>
  );
};

export default EkycFilterModal;
