import Skeleton from "./Skeleton";

const HomeSkeleton = () => (
  <div className="container section">
    <div className="glass hero-banner">
      <div className="hero-text">
        <Skeleton width="120px" height="14px" />
        <Skeleton width="80%" height="32px" />
        <Skeleton width="60%" height="16px" />
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
          <Skeleton width="140px" height="40px" />
          <Skeleton width="140px" height="40px" />
        </div>
      </div>
      <div className="hero-stats">
        <Skeleton width="100%" height="80px" />
        <Skeleton width="100%" height="80px" />
        <Skeleton width="100%" height="80px" />
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.7rem", marginTop: "1rem" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} width="100%" height="120px" />)}
    </div>
    <Skeleton width="200px" height="24px" style={{ marginTop: "1.5rem" }} />
    <div className="grid" style={{ marginTop: "0.8rem" }}>
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height="320px" />)}
    </div>
  </div>
);

export default HomeSkeleton;
