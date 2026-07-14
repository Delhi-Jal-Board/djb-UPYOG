import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BreadcrumbHeader from "./BreadcrumbHeader";
import { ArrowLeftWhite } from "./svgindex";

/**
 * DynamicBreadCrumb component that automatically generates breadcrumb links
 * based on the current URL path, using the styled BreadcrumbHeader.
 */
const DynamicBreadCrumb = ({ customConfig = {}, defaultPath = "" }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();

  // Extract path segments
  let pathname = location.pathname;
  if (defaultPath && pathname.startsWith(defaultPath)) {
    pathname = pathname.replace(defaultPath, "");
  }

  const pathSegments = pathname.split("/").filter((segment) => segment);

  const crumbs = [];
  let currentPath = "";

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const formattedSegment = segment.toUpperCase().replace(/-/g, "_");
    const customCrumb = customConfig[segment];

    crumbs.push({
      path: customCrumb?.path || currentPath,
      content: customCrumb?.content !== undefined ? (customCrumb.content ? t(customCrumb.content) : "") : t(formattedSegment),
      show: customCrumb?.show !== undefined ? customCrumb.show : true,
      isBack: customCrumb?.isBack || false,
      icon: customCrumb?.icon
    });
  });

  const leftContent = (
    <React.Fragment>
      <ArrowLeftWhite width="16" height="16" />
      <span style={{ marginLeft: "8px", fontWeight: "bold" }}>{t("cs_common_back")}</span>
    </React.Fragment>
  );

  return (
    <BreadcrumbHeader
      leftContent={leftContent}
      onLeftClick={() => history.goBack()}
      breadcrumbs={crumbs}
    />
  );
};

export default DynamicBreadCrumb;
