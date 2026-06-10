import React from "react";
import HeaderBar from "./HeaderBar";
import TopInfoBar from "./TopInfoBar";
import Hero from "./Hero";
import QuickServices from "./QuickServices";
import Services from "./Services";
// import Leadership from "./Leadership";
import NewsEvents from "./NewsEvents";
import { newsData } from "./NewsData";
import StatsSection from "./Stats";
import LatestVideos from "./LatestVideos";
import Footer from "./footer";

const videosList = [
  { url: "https://www.youtube.com/watch?v=YpNdAfXqcY8", title: "Video 1" },
  { url: "https://youtu.be/z4fr97M_Kjg?si=15B8W0e2Qb-BIsgt", title: "Video 2" },
  { url: "https://youtu.be/XPKqDMOTUAc?si=CB9U10G4uxsXEvRd", title: "Video 3" },
];
const LandingPage = (props) => {
  return (
    <div className="upyog-landing">
      
      <HeaderBar {...props} />
      <TopInfoBar {...props} />
      <Hero {...props} />
      <QuickServices {...props} />
      <Services />
      {/* <Leadership /> */}
      <NewsEvents news={newsData} {...props} />
      <StatsSection {...props} />
      <LatestVideos videos={videosList}  playlistUrl={"https://www.youtube.com/@DelhiJalBoardOfficial"} {...props} />
      <Footer {...props} />
    </div>
  );
};

export default LandingPage;