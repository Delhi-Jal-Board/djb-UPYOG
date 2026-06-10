import React from "react";
import { useTranslation } from "react-i18next";

const convertToEmbedLink = (url) => {
  if (!url) return "";
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) {
      const id = parts[1].split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
  }
  if (url.includes("v=")) {
    const parts = url.split("v=");
    if (parts[1]) {
      const id = parts[1].split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
  }
  if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return url;
};

const LatestVideos = ({ videos = [], playlistUrl }) => {
  const { t } = useTranslation();
  return (
    <section className="videos-section">
      <h2 className="videos-title">{t("Latest Videos")}</h2>

      <div className="videos-wrapper">
        {videos.map((video, index) => (
          <div className="video-card" key={index}>
            <iframe
              src={convertToEmbedLink(video.url)}
              title={t(video.title)}
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>

      {playlistUrl && (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="playlist-btn"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
            alt="YouTube"
            className="yt-icon"
          />
          {t("View Full Playlist")}
        </a>
      )}
    </section>
  );
};

export default LatestVideos;
