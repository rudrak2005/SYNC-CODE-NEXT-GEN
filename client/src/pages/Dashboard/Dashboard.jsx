import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import ProjectCard from "../../components/ProjectCard/ProjectCard";
import Button from "../../components/Button/Button";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="app-layout">

      <Navbar />

      <div className="workspace">

        <Sidebar />

        <main className="dashboard">

          <section className="dashboard-header">

            <div>
              <h1>Welcome back, Rudraksh</h1>

              <p>
                Build, collaborate and develop together.
              </p>
            </div>

            <div className="dashboard-actions">
              <Link to="/create-project">
                <Button>
                  + Create Project
                </Button>
              </Link>

<Link to="/create-project">
  <Button>
    + Create Room
  </Button>
</Link>
              <Link to="/join-room">
                <button className="secondary-btn">
                  Join Room
                </button>
              </Link>
            </div>

          </section>

          <section className="projects-section">

            <div className="section-header">
              <h2>Your Projects</h2>

              <span>3 Projects</span>
            </div>

            <div className="projects-grid">

              <ProjectCard
                name="SyncCode"
                language="React"
                members="4"
              />

              <ProjectCard
                name="DSA Practice"
                language="C++"
                members="2"
              />

              <ProjectCard
                name="AI Workspace"
                language="Python"
                members="3"
              />

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;