import React from "react";
import { Link, useHistory } from "react-router-dom";
import LinkButton from "./LinkButton";
import { ChevronForwardOutline } from "./svgindex";

export default function BreadcrumbHeader({ leftContent, breadcrumbs = [], onLeftClick, wrapperClass = "", containerClass = "" }) {
  const history = useHistory();
  const visibleCrumbs = breadcrumbs?.filter((crumb) => crumb?.show);

  const rightContent = visibleCrumbs?.find((ele) => ele?.rightContent)?.rightContent;

  return (
    <div className={`module-header ${wrapperClass}`}>
      <div className={`header-bottom-section ${containerClass}`}>
        {/* Left Section */}
        {leftContent && (
          <div className="left-section" onClick={onLeftClick} style={{ cursor: onLeftClick ? "pointer" : "default" }}>
            {leftContent}
          </div>
        )}

        {/* Right Section Wrapper */}
        <div className="right-section-wrapper">
          {/* Breadcrumbs */}
          <ol className="right-section">
            {visibleCrumbs?.map((crumb, ci) => {
              const isLastItem = ci === visibleCrumbs.length - 1;
              const Icon = crumb.icon;

              // 🔙 Back type breadcrumb
              if (crumb?.isBack && crumb?.content) {
                const parts = crumb.content.split("/").map((p) => p.trim());

                return parts.map((part, index) => (
                  <React.Fragment key={`${ci}-${index}`}>
                    <li className="bread-crumb-item">
                      {Icon && crumb.path && (
                        <Link to={crumb.path} style={{ display: "inline-flex" }}>
                          <Icon className="icon home-icon" />
                        </Link>
                      )}

                      <span style={{ cursor: "pointer" }} onClick={() => window.history.back()}>
                        {part}
                      </span>
                    </li>

                    {index !== parts.length - 1 && (
                      <li className="bread-crumb-separator">
                        <span className="iconn">
                          <ChevronForwardOutline />
                        </span>
                      </li>
                    )}
                  </React.Fragment>
                ));
              }

              // 🟢 Normal breadcrumb
              return (
                <React.Fragment key={ci}>
                  <li className="bread-crumb-item">
                    {/* Icon Link */}
                    {Icon && crumb.path ? (
                      <Link to={crumb.path} style={{ display: "inline-flex" }}>
                        <Icon className="icon home-icon" />
                      </Link>
                    ) : Icon ? (
                      <Icon className="icon home-icon" />
                    ) : null}

                    {/* Text */}
                    {crumb.content &&
                      (isLastItem || !crumb?.path || crumb?.isclickable === false ? (
                        <span>{crumb.content}</span>
                      ) : crumb?.isredirected ? (
                        <span
                          onClick={() =>
                            history.push(crumb?.path?.pathname, {
                              ...crumb?.path?.state,
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <LinkButton label={crumb.content} />
                        </span>
                      ) : (
                        <Link to={crumb.path}>{crumb.content}</Link>
                      ))}
                  </li>

                  {!isLastItem && (
                    <li className="bread-crumb-separator">
                      <span className="iconn">
                        <ChevronForwardOutline />
                      </span>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>

          {/* ✅ Extra Right Content */}
          {rightContent && <div className="extra-right-content">{rightContent}</div>}
        </div>
      </div>
    </div>
  );
}
