import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">

      {/* Background */}
      <div className="home-grid" />
      <div className="home-glow home-glow-one" />
      <div className="home-glow home-glow-two" />

      {/* Navigation */}
      <header className="home-navbar">

        <Link to="/" className="home-brand">
          <span className="home-brand-mark">SC</span>

          <span className="home-brand-text">
            SyncCode
            <span>NextGen</span>
          </span>
        </Link>

        <nav className="home-nav">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#technology">Technology</a>
        </nav>

        <div className="home-nav-actions">
          <Link
            to="/login"
            className="home-login-btn"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="home-start-btn"
          >
            Get Started
          </Link>
        </div>

      </header>

      {/* Hero */}
      <main>

        <section className="home-hero">

          <div className="home-hero-badge">
            <span className="status-dot" />
            Real-Time Collaborative Development
          </div>

          <h1>
            Code together.
            <br />
            <span>Build together.</span>
          </h1>

          <p className="home-hero-description">
            SyncCode NextGen is a research-oriented
            collaborative development environment where
            teams can code, execute and build together
            in real time.
          </p>

          <div className="home-hero-actions">

            <Link
              to="/register"
              className="hero-primary-btn"
            >
              Start Coding
              <span>→</span>
            </Link>

            <Link
              to="/login"
              className="hero-secondary-btn"
            >
              Open Workspace
            </Link>

          </div>

          <div className="home-hero-note">
            No setup-heavy workflow. Open a room and start coding.
          </div>

        </section>

        {/* Product Preview */}
        <section className="home-preview">

          <div className="preview-window">

            <div className="preview-topbar">

              <div className="preview-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="preview-title">
                SyncCode Workspace
              </div>

              <div className="preview-status">
                <span />
                3 users online
              </div>

            </div>

            <div className="preview-body">

              <aside className="preview-sidebar">

                <div className="preview-sidebar-title">
                  EXPLORER
                </div>

                {/* <div className="preview-file active">
                  JS
                  <span>main.js</span>
                </div> */}

                <div className="preview-file">
                  HT
                  <span>index.html</span>
                </div>

                <div className="preview-file">
                  CS
                  <span>style.css</span>
                </div>

              </aside>

              <div className="preview-editor">

                <div className="preview-tabs">
                  <div className="preview-tab active">
                    main.js
                  </div>
                  <div className="preview-tab">
                    index.html
                  </div>
                </div>

                <div className="preview-code">

                  <div>
                    <span className="line-number">1</span>
                    <span className="keyword">
                      function
                    </span>{" "}
                    <span className="function-name">
                      hello
                    </span>() {"{"}
                  </div>

                  <div>
                    <span className="line-number">2</span>
                    {"  "}console.log(
                    <span className="string">
                      "Hello SyncCode!"
                    </span>
                    );
                  </div>

                  <div>
                    <span className="line-number">3</span>
                    {"}"}
                  </div>

                  <div className="code-gap" />

                  <div>
                    <span className="line-number">5</span>
                    hello();
                  </div>

                </div>

                <div className="preview-terminal">

                  <div className="terminal-label">
                    TERMINAL
                  </div>

                  <div className="terminal-output">
                    Hello SyncCode!
                  </div>

                </div>

              </div>

              <aside className="preview-users">

                <div className="preview-users-title">
                  COLLABORATORS
                </div>

                <div className="preview-user">
                  <span className="user-avatar purple">
                    R
                  </span>
                  <span>Rudra</span>
                </div>

                <div className="preview-user">
                  <span className="user-avatar cyan">
                    A
                  </span>
                  <span>Alex</span>
                </div>

                <div className="preview-user">
                  <span className="user-avatar green">
                    S
                  </span>
                  <span>Sam</span>
                </div>

              </aside>

            </div>

          </div>

        </section>

        {/* Features */}
        <section
          id="features"
          className="home-section"
        >

          <div className="section-heading">

            <span>CAPABILITIES</span>

            <h2>
              Everything your
              <br />
              team needs to build.
            </h2>

          </div>

          <div className="feature-grid">

            <article className="feature-card">
              <div className="feature-icon">01</div>

              <h3>
                Real-Time Collaboration
              </h3>

              <p>
                Multiple developers can work inside
                the same coding workspace and see
                changes in real time.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">02</div>

              <h3>
                Browser Execution
              </h3>

              <p>
                Experiment with browser-native
                execution using Web Workers,
                JavaScript and Python runtimes.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">03</div>

              <h3>
                AI Co-Engineering
              </h3>

              <p>
                Explain code, review changes,
                detect bugs, generate tests and
                create AI-assisted workflows.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">04</div>

              <h3>
                Version & Recovery
              </h3>

              <p>
                Track project versions, recover
                state and continue development
                after connection problems.
              </p>
            </article>

          </div>

        </section>

        {/* Workflow */}
        <section
          id="workflow"
          className="home-section workflow-section"
        >

          <div className="section-heading center">

            <span>WORKFLOW</span>

            <h2>
              From idea to code
              <br />
              in a few steps.
            </h2>

          </div>

          <div className="workflow-grid">

            <div className="workflow-step">
              <div>01</div>
              <h3>Create Workspace</h3>
              <p>
                Create a project and open a
                collaborative coding room.
              </p>
            </div>

            <div className="workflow-line" />

            <div className="workflow-step">
              <div>02</div>
              <h3>Invite Your Team</h3>
              <p>
                Share the room and start working
                together in real time.
              </p>
            </div>

            <div className="workflow-line" />

            <div className="workflow-step">
              <div>03</div>
              <h3>Build & Execute</h3>
              <p>
                Write code, use AI assistance and
                run supported programs.
              </p>
            </div>

          </div>

        </section>

        {/* Technology */}
        <section
          id="technology"
          className="home-section technology-section"
        >

          <div className="technology-copy">

            <span>RESEARCH PLATFORM</span>

            <h2>
              Built for modern
              <br />
              collaborative development.
            </h2>

            <p>
              SyncCode NextGen explores local-first
              collaboration, browser-native execution,
              AI-assisted development and privacy-oriented
              architecture.
            </p>

          </div>

          <div className="technology-stack">

            <span>React</span>
            <span>Monaco</span>
            <span>Socket.IO</span>
            <span>MongoDB</span>
            <span>WebRTC</span>
            <span>WebCrypto</span>
            <span>Web Workers</span>
            <span>Pyodide</span>
            <span>AI</span>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="home-footer">

        <div className="home-brand">
          <span className="home-brand-mark">SC</span>

          <span className="home-brand-text">
            SyncCode
            <span>NextGen</span>
          </span>
        </div>

        <p>
          Collaborative coding, reimagined.
        </p>

        <span>
          © 2026 SyncCode NextGen
        </span>

      </footer>

    </div>
  );
}

export default Home;