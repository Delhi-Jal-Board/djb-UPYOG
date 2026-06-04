import React, { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import SuggestedRow from "./SuggestedRow";
import heroConfig from "./configs/HeroConfig";

const Hero = ({ logoUrl, stateInfo }) => {
  const {
    bannerImage,
    bannerAlt,
    showSearchBar,
    showSuggestedRow,
    logoImage,
  } = heroConfig;

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const displayLogo = logoImage;
  const orgName = "Delhi Jal Board";

  return (
    <React.Fragment>
      <section className="upyog-hero-wrapper">
        <div className={`upyog-hero-container upyog-hero-split ${animate ? "hero-animate" : ""}`}>

          <div className="upyog-hero-left">
            {displayLogo && (
              <img
                src={displayLogo}
                alt={`${orgName} Logo`}
                className="upyog-hero-logo"
              />
            )}

            <p className="upyog-hero-welcome-text">Welcome to</p>
            <h1 className="upyog-hero-title">{orgName}</h1>
          </div>

          <div className="upyog-hero-right">
            <img
              src={bannerImage}
              alt={bannerAlt}
              className="upyog-hero-main-img"
            />
          </div>

        </div>
      </section>

      {showSearchBar && <SearchBar />}
      {showSuggestedRow && <SuggestedRow />}
    </React.Fragment>
  );
};

export default Hero;
