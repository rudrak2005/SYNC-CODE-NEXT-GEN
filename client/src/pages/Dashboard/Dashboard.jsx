function Dashboard() {
  return (
    <div className="dashboard">
      <header>
        <h1>SyncCode Next-Gen</h1>

        <p>
          Collaborative Development Workspace
        </p>
      </header>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Projects</h2>
          <p>Manage your coding projects.</p>
        </div>

        <div className="dashboard-card">
          <h2>Create Project</h2>
          <p>Start a new collaborative workspace.</p>
        </div>

        <div className="dashboard-card">
          <h2>Join Room</h2>
          <p>Join an existing collaboration room.</p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;