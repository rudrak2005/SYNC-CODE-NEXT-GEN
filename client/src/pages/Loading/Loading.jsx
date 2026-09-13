import "./Loading.css";

function Loading() {
  return (
    <div className="synccode-loading">

      <div className="loading-grid" />

      <div className="loading-glow loading-glow-one" />
      <div className="loading-glow loading-glow-two" />

      <div className="loading-content">

        <div className="loading-logo">
          <span>SC</span>
        </div>

        <div className="loading-title">
          SyncCode
          <span> NextGen</span>
        </div>

        <div className="loading-tagline">
          Real-Time Collaborative Development
        </div>

        <div className="loading-status">
          <span className="loading-status-dot" />
          Initializing workspace
        </div>

        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>

        <div className="loading-meta">
          <span>COLLABORATE</span>
          <span>BUILD</span>
          <span>SHIP</span>
        </div>

      </div>

      <div className="loading-version">
        SyncCode NextGen • v1.0
      </div>

    </div>
  );
}

export default Loading;