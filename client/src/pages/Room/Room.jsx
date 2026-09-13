import {
  useState
} from "react";

import {
  useParams,
  Link,
  useNavigate
} from "react-router-dom";

import "./Room.css";


function Room() {
  const {
    roomId
  } = useParams();

  const navigate =
    useNavigate();

  const [copied, setCopied] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);


  /*
   * =========================================
   * COPY ROOM ID
   * =========================================
   */

  const handleCopyRoomId = async () => {
    try {

      await navigator.clipboard.writeText(
        roomId || ""
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);

    } catch (error) {

      console.error(
        "Failed to copy room ID:",
        error
      );

    }
  };


  /*
   * =========================================
   * SHARE ROOM
   * =========================================
   */

  const handleShare = async () => {

    const shareData = {
      title: "Join my SyncCode room",
      text: `Join my SyncCode NextGen collaboration room: ${roomId}`,
      url:
        `${window.location.origin}/room/${roomId}`
    };

    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );

        return;
      }

      await navigator.clipboard.writeText(
        shareData.url
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);

    } catch (error) {

      console.log(
        "Share cancelled or unavailable."
      );

    }
  };


  /*
   * =========================================
   * OPEN EDITOR
   * =========================================
   */

  const openEditor = () => {

    navigate(
      `/room/${roomId}/editor`
    );

  };


  /*
   * =========================================
   * LEAVE ROOM
   * =========================================
   */

  const leaveRoom = () => {

    navigate(
      "/dashboard",
      {
        replace: true
      }
    );

  };


  return (
    <div className="room-page">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="room-grid" />

      <div className="room-glow room-glow-one" />
      <div className="room-glow room-glow-two" />


      <div className="room-layout">

        {/* ===================================
            TOP NAVBAR
        =================================== */}

        <header className="room-header">

          <div className="room-header-left">

            <Link
              to="/dashboard"
              className="room-back"
            >
              <span>←</span>
              Dashboard
            </Link>

            <div className="room-header-divider" />

            <div className="room-brand">

              <div className="room-brand-icon">
                SC
              </div>

              <div>
                <strong>
                  SyncCode
                </strong>

                <span>
                  NextGen
                </span>
              </div>

            </div>

          </div>


          <div className="room-header-right">

            <div className="room-live-status">

              <span />

              Online

            </div>


            <button
              type="button"
              className="room-header-menu"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
            >
              ⋮
            </button>


            {menuOpen && (

              <div className="room-header-dropdown">

                <button
                  type="button"
                  onClick={handleShare}
                >
                  Share Room
                </button>

                <button
                  type="button"
                  onClick={leaveRoom}
                >
                  Leave Room
                </button>

              </div>

            )}

          </div>

        </header>


        {/* ===================================
            MAIN
        =================================== */}

        <main className="room-main">


          {/* =================================
              HERO
          ================================= */}

          <section className="room-hero">

            <div className="room-hero-content">

              <div className="room-badge">
                <span />
                COLLABORATION ROOM
              </div>

              <h1>
                Your workspace
                <br />
                is <span>ready.</span>
              </h1>

              <p>
                Invite your teammates and
                start coding together in real
                time.
              </p>


              <div className="room-actions">

                <button
                  type="button"
                  className="room-primary-button"
                  onClick={openEditor}
                >
                  <span>
                    ▶
                  </span>

                  Open Code Editor
                </button>

                <button
                  type="button"
                  className="room-secondary-button"
                  onClick={handleShare}
                >
                  <span>
                    ↗
                  </span>

                  Share Room
                </button>

              </div>

            </div>


            {/* ===============================
                ROOM PREVIEW
            =============================== */}

            <div className="room-preview">

              <div className="room-preview-header">

                <div className="room-window-dots">

                  <span />
                  <span />
                  <span />

                </div>

                <span>
                  Collaborative Workspace
                </span>

              </div>


              <div className="room-preview-body">

                <div className="preview-sidebar">

                  <div className="preview-sidebar-title">
                    FILES
                  </div>

                  <div className="preview-file active">
                    <span>JS</span>
                    main.js
                  </div>

                  <div className="preview-file">
                    <span>HT</span>
                    index.html
                  </div>

                  <div className="preview-file">
                    <span>CS</span>
                    style.css
                  </div>

                </div>


                <div className="preview-editor">

                  <div className="preview-tabs">
                    <span className="active">
                      main.js
                    </span>
                  </div>

                  <div className="preview-code">

                    <div>
                      <span>01</span>
                      <b>function</b>{" "}
                      hello() {"{"}
                    </div>

                    <div>
                      <span>02</span>
                      {"  "}console.log(
                      <i>"Hello SyncCode!"</i>
                      );
                    </div>

                    <div>
                      <span>03</span>
                      {"}"}
                    </div>

                    <div>
                      <span>04</span>
                    </div>

                    <div>
                      <span>05</span>
                      hello();
                    </div>

                  </div>

                  <div className="preview-terminal">

                    <div>
                      TERMINAL
                    </div>

                    <p>
                      $ Running...
                    </p>

                    <strong>
                      Hello SyncCode!
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =================================
              ROOM ID CARD
          ================================= */}

          <section className="room-info-grid">


            <div className="room-id-card">

              <div className="room-card-label">
                ROOM ID
              </div>

              <div className="room-id-row">

                <div className="room-id-value">
                  {roomId}
                </div>

                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="room-copy-button"
                >
                  {copied
                    ? "Copied ✓"
                    : "Copy"}
                </button>

              </div>

              <p>
                Share this ID with teammates
                who need access to this room.
              </p>

            </div>


            <div className="room-status-card">

              <div className="room-card-label">
                ROOM STATUS
              </div>

              <div className="room-status-main">

                <div className="room-status-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Ready to collaborate
                  </strong>

                  <span>
                    Your room is active
                  </span>

                </div>

              </div>

            </div>


          </section>


          {/* =================================
              MEMBERS + FEATURES
          ================================= */}

          <section className="room-bottom-grid">


            {/* MEMBERS */}

            <div className="room-members-card">

              <div className="room-section-header">

                <div>

                  <h2>
                    Room Members
                  </h2>

                  <p>
                    People currently in this workspace
                  </p>

                </div>

                <span className="member-count">
                  1 online
                </span>

              </div>


              <div className="room-member-list">

                <div className="room-member">

                  <div className="room-member-avatar">
                    Y
                    <span />
                  </div>

                  <div className="room-member-info">

                    <strong>
                      You
                    </strong>

                    <span>
                      Room Owner
                    </span>

                  </div>

                  <div className="room-member-role">
                    Owner
                  </div>

                </div>

                <div className="room-member-empty">

                  <div>
                    +
                  </div>

                  <span>
                    Waiting for teammates...
                  </span>

                </div>

              </div>

            </div>


            {/* FEATURES */}

            <div className="room-features-card">

              <div className="room-section-header">

                <div>

                  <h2>
                    Workspace Features
                  </h2>

                  <p>
                    Everything ready for your team
                  </p>

                </div>

              </div>


              <div className="room-feature-grid">

                <div className="room-feature">

                  <div className="room-feature-icon purple">
                    ◈
                  </div>

                  <strong>
                    Live Editing
                  </strong>

                  <span>
                    Real-time code sync
                  </span>

                </div>


                <div className="room-feature">

                  <div className="room-feature-icon cyan">
                    ⚡
                  </div>

                  <strong>
                    Code Execution
                  </strong>

                  <span>
                    Run supported languages
                  </span>

                </div>


                <div className="room-feature">

                  <div className="room-feature-icon green">
                    ✓
                  </div>

                  <strong>
                    Versioning
                  </strong>

                  <span>
                    Save and restore changes
                  </span>

                </div>


                <div className="room-feature">

                  <div className="room-feature-icon orange">
                    ✦
                  </div>

                  <strong>
                    AI Assistance
                  </strong>

                  <span>
                    Intelligent code help
                  </span>

                </div>

              </div>

            </div>

          </section>


          {/* =================================
              BOTTOM CTA
          ================================= */}

          <section className="room-bottom-cta">

            <div>

              <span>
                READY TO BUILD?
              </span>

              <h2>
                Open the editor and
                start collaborating.
              </h2>

            </div>

            <button
              type="button"
              onClick={openEditor}
            >
              Launch Editor →
            </button>

          </section>


        </main>

      </div>

    </div>
  );
}

export default Room;