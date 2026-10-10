import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { LuCalendarIcon } from "../atoms/svgindex";
import { DateRangePicker, createStaticRanges } from "react-date-range";
import {
  format,
  addMonths,
  addHours,
  startOfToday,
  endOfToday,
  endOfYesterday,
  addMinutes,
  addSeconds,
  subYears,
  startOfYesterday,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";

function isEndDateFocused(focusNumber) {
  return focusNumber === 1;
}

function isStartDateFocused(focusNumber) {
  return focusNumber === 0;
}

const DateRange = ({ values, onFilterChange, t, hideLabel = false, onOpenChange, emptyInitialDate = false, }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusedRange, setFocusedRange] = useState([0, 0]);

  const today = new Date();

  const [selectionRange, setSelectionRange] = useState({
    ...values,
    startDate: emptyInitialDate ? "" : values?.startDate || today,
    endDate: emptyInitialDate ? "" : values?.endDate || today,
  });

  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef(null);

  /**
   * Notify parent whenever the DateRange modal opens/closes.
   */
  useEffect(() => {
    onOpenChange?.(isModalOpen);
  }, [isModalOpen, onOpenChange]);

  /**
   * Close DateRange when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Notify parent when date selection is completed.
   */
  useEffect(() => {
    if (!isModalOpen && selectionRange?.startDate instanceof Date && selectionRange?.endDate instanceof Date) {
      const startDate = selectionRange.startDate;
      const endDate = selectionRange.endDate;

      const duration = getDuration(startDate, endDate);

      const title = `${format(startDate, "MMM d, yy")} - ${format(endDate, "MMM d, yy")}`;

      onFilterChange({
        range: {
          startDate,
          endDate,
          duration,
          title,
        },
        requestDate: {
          startDate,
          endDate,
          duration,
          title,
        },
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionRange, isModalOpen]);

  const staticRanges = useMemo(() => {
    return createStaticRanges([
      {
        label: t("DSS_TODAY"),
        range: () => ({
          startDate: startOfToday(new Date()),
          endDate: endOfToday(new Date()),
        }),
      },
      {
        label: t("DSS_YESTERDAY"),
        range: () => ({
          startDate: startOfYesterday(new Date()),
          endDate: endOfYesterday(new Date()),
        }),
      },
      {
        label: t("DSS_THIS_WEEK"),
        range: () => ({
          startDate: startOfWeek(new Date()),
          endDate: endOfWeek(new Date()),
        }),
      },
      {
        label: t("DSS_THIS_MONTH"),
        range: () => ({
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
        }),
      },
      {
        label: t("DSS_THIS_QUARTER"),
        range: () => ({
          startDate: startOfQuarter(new Date()),
          endDate: endOfQuarter(new Date()),
        }),
      },
      {
        label: t("DSS_PREVIOUS_YEAR"),
        range: () => ({
          startDate: subYears(addMonths(startOfYear(new Date()), 3), 1),
          endDate: subYears(addMonths(endOfYear(new Date()), 3), 1),
        }),
      },
      {
        label: t("DSS_THIS_YEAR"),
        range: () => ({
          startDate: addMonths(startOfYear(new Date()), 3),
          endDate: addMonths(endOfYear(new Date()), 3),
        }),
      },
    ]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDuration = (startDate, endDate) => {
    const noOfDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24);

    if (noOfDays > 91) {
      return "month";
    }

    if (noOfDays < 90 && noOfDays >= 14) {
      return "week";
    }

    if (noOfDays <= 14) {
      return "day";
    }

    return undefined;
  };

  const handleSelect = (ranges) => {
    const { range1: selection } = ranges;
    const { startDate, endDate, title, duration } = selection;

    if (isStartDateFocused(focusedRange[1])) {
      setSelectionRange(selection);
    }

    if (isEndDateFocused(focusedRange[1])) {
      setSelectionRange({
        title,
        duration,
        startDate,
        endDate: addSeconds(addMinutes(addHours(endDate, 23), 59), 59),
      });

      setIsModalOpen(false);
    }
  };

  return (
    <Fragment>
      {!hideLabel && <div className="filter-label">{t(`ES_DSS_DATE_RANGE`)}</div>}

      <div className="employee-select-wrap" ref={wrapperRef}>
        <div
          className="select"
          onClick={() => {
            setIsModalOpen((prevState) => !prevState);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <input className="employee-select-wrap--elipses" type="text" value={values?.title ? values.title : ""} readOnly />

          <LuCalendarIcon hoverColor="#a1a1aa" color="#d1d1d1" className="cursorPointer" isHovered={isHovered} />
        </div>

        {isModalOpen && (
          <div
            className="options-card"
            style={{
              overflow: "visible",
              width: "unset",
              maxWidth: "unset",
            }}
          >
            <DateRangePicker
              placeholder="Select Date Filter"
              className="pickerShadow"
              focusedRange={focusedRange}
              ranges={[selectionRange]}
              rangeColors={["#9E9E9E"]}
              onChange={handleSelect}
              onRangeFocusChange={setFocusedRange}
              retainEndDateOnFirstSelection={true}
              showSelectionPreview={true}
              staticRanges={staticRanges}
              inputRanges={[]}
            />
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default DateRange;
