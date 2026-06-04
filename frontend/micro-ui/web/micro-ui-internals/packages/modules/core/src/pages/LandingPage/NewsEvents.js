import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@djb25/digit-ui-react-components";

const NewsEvents = ({ news = [] }) => {
  const { t } = useTranslation();

  if (!news || news.length === 0) {
    return (
      <section className="news-events-container">
        <h2 className="news-title">{t("News and Events")}</h2>
        <p>{t("No news available.")}</p>
      </section>
    );
  }

  const [featured, setFeatured] = useState(news[news.length - 1]);
  const others = news;   // include ALL news in slider
  const visibleCount = 4;
  const [current, setCurrent] = useState(0);

  const getVisibleCards = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const index = (current + i) % others.length;
      result.push(others[index]);
    }
    return result;
  };

  const visibleCards = getVisibleCards();

  const updateFeatured = () => {
    setFeatured(visibleCards[0]);
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % others.length);
    setTimeout(updateFeatured, 0);
  };

  const prev = () => {
    setCurrent((prev) => (prev === 0 ? others.length - 1 : prev - 1));
    setTimeout(updateFeatured, 0);
  };

  return (
    <section className="news-events-container">

      <h2 className="news-title">{t("News and Events")}</h2>

      {/* === FEATURED BOX === */}
      <Card className="featured-news">

        <div className="featured-left">
          <img src={featured.image} alt="" className="featured-img" />
          <span className="latest-tag">{t("Latest")}</span>
        </div>

        <div className="featured-right">
          <h3 className="featured-heading">{t(featured.title)}</h3>
          <p className="featured-date">{t(featured.date)}</p>

          {featured.description && (
            <p className="featured-desc">{t(featured.description)}</p>
          )}

          <a className="read-more" href="#">{t("Read More")} →</a>
        </div>
      </Card>

      {/* === SCROLL SLIDER BAR === */}
      <div className="news-slider-section">

        <button className="slide-btn left" onClick={prev}>‹</button>

        <div className="slider">
          {visibleCards.map((item, idx) => (
            <Card
              key={idx}
              className={`news-card ${featured.title === item.title ? "highlight-card" : ""
                }`}
              onClick={() => setFeatured(item)}
            >
              <img src={item.image} alt="" className="news-card-img" />
              <h4 className="news-card-title">{t(item.title)}</h4>
              <p className="news-card-date">{t(item.date)}</p>
            </Card>
          ))}
        </div>

        <button className="slide-btn right" onClick={next}>›</button>
      </div>

      <div className="news-footer">
        <button className="view-all-btn">{t("View All News and Events")}</button>
      </div>

    </section>
  );
};

export default NewsEvents;
