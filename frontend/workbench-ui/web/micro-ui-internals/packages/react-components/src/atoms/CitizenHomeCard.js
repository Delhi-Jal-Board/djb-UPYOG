import React from "react";
import { Link } from "react-router-dom";

const CitizenHomeCard = ({ header, subTitle = "Citizen Services", links = [], Icon, Info, isInfo = false, styles }) => {
  const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  );
  return (
    <div className="CitizenHomeCard" style={styles || {}}>
      <div className="cardGlow"></div>

      <div className="header">
        <div className="titleWrapper">
          <p className="subTitle">{subTitle}</p>

          <h2>{header}</h2>
        </div>

        <div className="iconWrapper">
          {Icon ? <Icon /> : <DashboardIcon />}
        </div>
      </div>

      <div className="links">
        {links.map((e, i) => (
          <div key={i} className="linksWrapper">
            {e?.parentModule?.toUpperCase() === "BIRTH" ||
            e?.parentModule?.toUpperCase() === "DEATH" ||
            e?.parentModule?.toUpperCase() === "FIRENOC" ? (
              <a href={e.link}>
                <span className="linkText">{e.i18nKey}</span>

                <span className="arrow">→</span>
              </a>
            ) : (
              <Link to={{ pathname: e.link, state: e.state }}>
                <span className="linkText">{e.i18nKey}</span>

                <span className="arrow">→</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {isInfo ? (
        <div className="bottomInfo">
          <div>
            <p className="quickText">Quick Access</p>

            <p className="quickSubText">All citizen modules available</p>
          </div>

          <div className="statusDot"></div>

          <Info />
        </div>
      ) : null}
    </div>
  );
};

export default CitizenHomeCard;
