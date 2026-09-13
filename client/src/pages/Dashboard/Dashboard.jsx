import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Dashboard.css";


function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
    logout
  } = useAuth();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);


  /*
   * =========================================
   * LOAD PROJECTS
   * =========================================
   */

  useEffect(() => {

    const loadProjects = async () => {

      try {

        setLoading(true);

        const response =
          await api.get("/projects");

        const data =
          response.data?.projects ||
          response.data ||
          [];

        setProjects(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Failed to load projects:",
          error
        );

        setProjects([]);

      } finally {

        setLoading(false);

      }
    };

    loadProjects();

  }, []);


  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const filteredProjects =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return projects;
      }

      return projects.filter(
        (project) =>
          String(
            project.name || ""
          )
            .toLowerCase()
            .includes(query)
      );

    }, [
      projects,
      search
    ]);


  /*
   * =========================================
   * USER NAME
   * =========================================
   */

  const userName =
    user?.name ||
    user?.username ||
    "Developer";


  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();


  /*
   * =========================================
   * OPEN PROJECT
   * =========================================
   */

  const openProject = (project) => {

    const id =
      project?._id ||
      project?.id;

    if (!id) {
      return;
    }

    navigate(
      `/room/${id}/editor`
    );
  };


  /*
   * =========================================
   * LOGOUT
   * =========================================
   */

  const handleLogout = () => {

    logout();

    navigate(
      "/login",
      {
        replace: true
      }
    );
  };


  /*
   * =========================================
   * FORMAT DATE
   * =========================================
   */

  const formatDate = (date) => {

    if (!date) {
      return "Recently";
    }

    const value =
      new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "Recently";
    }

    const diff =
      Date.now() -
      value.getTime();

    const minutes =
      Math.floor(
        diff / 60000
      );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 7) {
      return `${days}d ago`;
    }

    return value.toLocaleDateString();

  };


  return (
    <div className="dashboard-page">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="dashboard-grid" />

      <div className="dashboard-glow dashboard-glow-one" />
      <div className="dashboard-glow dashboard-glow-two" />


      <div className="dashboard-layout">

        {/* ===================================
            SIDEBAR
        =================================== */}

        <aside className="dashboard-sidebar">

          <Link
            to="/dashboard"
            className="dashboard-logo"
          >

            <div className="dashboard-logo-icon">
              SC
            </div>

            <div className="dashboard-logo-text">
              <strong>
                SyncCode
              </strong>

              <span>
                NextGen
              </span>
            </div>

          </Link>


          <div className="sidebar-section">

            <div className="sidebar-label">
              WORKSPACE
            </div>

            <Link
              to="/dashboard"
              className="sidebar-item active"
            >
              <span className="sidebar-icon">
                ◈
              </span>

              Dashboard
            </Link>

            <Link
              to="/create-project"
              className="sidebar-item"
            >
              <span className="sidebar-icon">
                +
              </span>

              Create Project
            </Link>

            <Link
              to="/join-room"
              className="sidebar-item"
            >
              <span className="sidebar-icon">
                ⇥
              </span>

              Join Room
            </Link>

          </div>


          <div className="sidebar-section">

            <div className="sidebar-label">
              DEVELOPMENT
            </div>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                window.alert(
                  "AI Assistant is coming soon."
                );
              }}
            >
              <span className="sidebar-icon">
                ✦
              </span>

              AI Assistant

              <span className="sidebar-badge">
                AI
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                window.alert(
                  "Activity center is coming soon."
                );
              }}
            >
              <span className="sidebar-icon">
                ◷
              </span>

              Activity
            </button>

          </div>


          <div className="sidebar-spacer" />


          <div className="sidebar-bottom">

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                window.alert(
                  "Settings is coming soon."
                );
              }}
            >
              <span className="sidebar-icon">
                ⚙
              </span>

              Settings
            </button>


            <button
              type="button"
              className="sidebar-user"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
            >

              <div className="sidebar-avatar">
                {userInitial}
              </div>

              <div className="sidebar-user-info">

                <strong>
                  {userName}
                </strong>

                <span>
                  Developer
                </span>

              </div>

              <span className="sidebar-user-arrow">
                ⋮
              </span>

            </button>


            {menuOpen && (
              <div className="sidebar-user-menu">

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </aside>


        {/* ===================================
            MAIN AREA
        =================================== */}

        <main className="dashboard-main">


          {/* =================================
              TOPBAR
          ================================= */}

          <header className="dashboard-topbar">

            <div className="dashboard-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <kbd>
                /
              </kbd>

            </div>


            <div className="dashboard-top-actions">

              <button
                type="button"
                className="top-icon-button"
                onClick={() =>
                  window.alert(
                    "No new notifications."
                  )
                }
              >
                ♢
              </button>


              <div className="top-status">

                <span className="top-status-dot" />

                All systems operational

              </div>


              <button
                type="button"
                className="top-profile"
                onClick={() =>
                  setMenuOpen(
                    (value) => !value
                  )
                }
              >

                <div className="top-avatar">
                  {userInitial}
                </div>

                <span>
                  {userName}
                </span>

                <span>
                  ▾
                </span>

              </button>

            </div>

          </header>


          {/* =================================
              CONTENT
          ================================= */}

          <section className="dashboard-content">


            {/* ===============================
                HERO
            =============================== */}

            <div className="dashboard-hero">

              <div>

                <div className="hero-eyebrow">
                  DEVELOPER WORKSPACE
                </div>

                <h1>
                  Good to see you,
                  <span>
                    {" "}
                    {userName}
                  </span>{" "}
                  👋
                </h1>

                <p>
                  Build, collaborate and ship
                  your next idea from one
                  powerful workspace.
                </p>

              </div>


              <div className="hero-actions">

                <Link
                  to="/create-project"
                  className="primary-action"
                >
                  <span>+</span>
                  New Project
                </Link>

                <Link
                  to="/join-room"
                  className="secondary-action"
                >
                  Join Room
                </Link>

              </div>

            </div>


            {/* ===============================
                QUICK ACTIONS
            =============================== */}

            <div className="quick-grid">

              <Link
                to="/create-project"
                className="quick-card quick-card-primary"
              >

                <div className="quick-icon">
                  +
                </div>

                <div>
                  <strong>
                    Create Project
                  </strong>

                  <span>
                    Start from scratch
                  </span>
                </div>

                <b>
                  →
                </b>

              </Link>


              <Link
                to="/join-room"
                className="quick-card"
              >

                <div className="quick-icon cyan">
                  ⇥
                </div>

                <div>
                  <strong>
                    Join Room
                  </strong>

                  <span>
                    Collaborate with your team
                  </span>
                </div>

                <b>
                  →
                </b>

              </Link>


              <button
                type="button"
                className="quick-card"
                onClick={() => {
                  window.alert(
                    "Open a project to start coding."
                  );
                }}
              >

                <div className="quick-icon green">
                  ▶
                </div>

                <div>
                  <strong>
                    Continue Coding
                  </strong>

                  <span>
                    Resume your latest workspace
                  </span>
                </div>

                <b>
                  →
                </b>

              </button>

            </div>


            {/* ===============================
                STATS
            =============================== */}

            <div className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon purple">
                  ◈
                </div>

                <div>
                  <span>
                    Projects
                  </span>

                  <strong>
                    {projects.length}
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon cyan">
                  ◎
                </div>

                <div>
                  <span>
                    Active Rooms
                  </span>

                  <strong>
                    —
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon green">
                  ◉
                </div>

                <div>
                  <span>
                    Collaborators
                  </span>

                  <strong>
                    —
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon orange">
                  ✦
                </div>

                <div>
                  <span>
                    AI Sessions
                  </span>

                  <strong>
                    —
                  </strong>
                </div>

              </div>

            </div>


            {/* ===============================
                PROJECT AREA
            =============================== */}

            <div className="dashboard-section-heading">

              <div>

                <h2>
                  Recent Projects
                </h2>

                <p>
                  Pick up where you left off.
                </p>

              </div>

              <button
                type="button"
                className="view-all"
                onClick={() => {
                  setSearch("");
                }}
              >
                View all →
              </button>

            </div>


            <div className="projects-panel">

              {loading ? (

                <div className="projects-loading">

                  <div className="dashboard-spinner" />

                  <p>
                    Loading your projects...
                  </p>

                </div>

              ) : filteredProjects.length === 0 ? (

                <div className="empty-projects">

                  <div className="empty-project-icon">
                    ◇
                  </div>

                  <h3>
                    No projects yet
                  </h3>

                  <p>
                    Create your first project
                    and start coding.
                  </p>

                  <Link
                    to="/create-project"
                    className="empty-project-button"
                  >
                    Create your first project
                  </Link>

                </div>

              ) : (

                <div className="project-list">

                  {filteredProjects
                    .slice(0, 8)
                    .map(
                      (project) => {

                        const id =
                          project?._id ||
                          project?.id;

                        const name =
                          project?.name ||
                          "Untitled Project";

                        const language =
                          project?.language ||
                          "Code";

                        return (
                          <button
                            type="button"
                            className="project-row"
                            key={id || name}
                            onClick={() =>
                              openProject(
                                project
                              )
                            }
                          >

                            <div className="project-main">

                              <div className="project-icon">
                                {"</>"}
                              </div>

                              <div>

                                <strong>
                                  {name}
                                </strong>

                                <span>
                                  {language}
                                </span>

                              </div>

                            </div>


                            <div className="project-updated">
                              {formatDate(
                                project?.updatedAt ||
                                project?.createdAt
                              )}
                            </div>


                            <span className="project-arrow">
                              →
                            </span>

                          </button>
                        );

                      }
                    )}

                </div>

              )}

            </div>


            {/* ===============================
                BOTTOM GRID
            =============================== */}

            <div className="dashboard-bottom-grid">


              {/* AI CARD */}

              <div className="ai-card">

                <div className="ai-card-glow" />

                <div className="ai-card-header">

                  <div className="ai-symbol">
                    ✦
                  </div>

                  <span>
                    AI CO-ENGINEERING
                  </span>

                </div>

                <h3>
                  Build smarter with
                  <span>
                    {" "}SyncCode AI
                  </span>
                </h3>

                <p>
                  Explain code, detect bugs,
                  generate tests and plan your
                  next implementation step.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    window.alert(
                      "AI Assistant is available inside the development workflow."
                    );
                  }}
                >
                  Open AI Assistant →
                </button>

              </div>


              {/* WORKSPACE STATUS */}

              <div className="workspace-card">

                <div className="workspace-heading">

                  <div>
                    <h3>
                      Workspace
                    </h3>

                    <p>
                      System status
                    </p>
                  </div>

                  <span className="online-pill">
                    ● Online
                  </span>

                </div>


                <div className="workspace-list">

                  <div>
                    <span>
                      API
                    </span>

                    <strong>
                      Connected
                    </strong>
                  </div>

                  <div>
                    <span>
                      Database
                    </span>

                    <strong>
                      Connected
                    </strong>
                  </div>

                  <div>
                    <span>
                      Collaboration
                    </span>

                    <strong>
                      Ready
                    </strong>
                  </div>

                  <div>
                    <span>
                      Browser Runtime
                    </span>

                    <strong>
                      Ready
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;