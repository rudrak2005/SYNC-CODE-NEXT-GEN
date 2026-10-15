import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import { getLanguageFromFileName } from "../../utils/fileLanguage";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import socket from "../../services/socket";
import { runCode } from "../../services/executionApi";
import {
  fetchVersions,
  createSnapshot,
  restoreSnapshot,
} from "../../services/versionApi";
import {
  saveEncryptedProject,
  loadEncryptedProject,
  hasEncryptedProject,
} from "../../services/encryptedProjectStorage";
import { clearRecoverySnapshot } from "../../services/recoveryStorage";

import CodeEditor from "../../components/CodeEditor/CodeEditor";
import FileExplorer from "../../components/FileExplorer/FileExplorer";
import FileTabs from "../../components/FileTabs/FileTabs";
import UserList from "../../components/UserList/UserList";
import VersionHistory from "../../components/VersionHistory/VersionHistory";
import PeerStatus from "../../components/PeerStatus/PeerStatus";
import EncryptionStatus from "../../components/EncryptionStatus/EncryptionStatus";
import SecurityStatus from "../../components/SecurityStatus/SecurityStatus";
import ConnectionStatus from "../../components/ConnectionStatus/ConnectionStatus";
import RecoveryStatus from "../../components/RecoveryStatus/RecoveryStatus";
import AIPanel from "../../components/AIPanel/AIPanel";
import AIReviewPanel from "../../components/AIReviewPanel/AIReviewPanel";
import AIBugDetector from "../../components/AIBugDetector/AIBugDetector";
import AITestGenerator from "../../components/AITestGenerator/AITestGenerator";
import AIAgentPlanner from "../../components/AIAgentPlanner/AIAgentPlanner";
import AIAgentWorkflow from "../../components/AIAgentWorkflow/AIAgentWorkflow";
import AIDiffViewer from "../../components/AIDiffViewer/AIDiffViewer";

import usePeerSync from "../../hooks/usePeerSync";
import useEncryptedSync from "../../hooks/useEncryptedSync";
import useReconnectSync from "../../hooks/useReconnectSync";
import useProjectRecovery from "../../hooks/useProjectRecovery";

import "./Editor.css";

const initialFiles = {
  "main.js": {
    language: "javascript",
    content: `function hello() {\n  console.log("Hello from SyncCode!");\n}\n\nhello();`,
  },
  "index.html": {
    language: "html",
    content: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>SyncCode</title>\n  </head>\n  <body>\n    <h1>Hello SyncCode</h1>\n  </body>\n</html>`,
  },
  "style.css": {
    language: "css",
    content: `body {\n  margin: 0;\n  font-family: sans-serif;\n}\n\nh1 {\n  color: white;\n}`,
  },
};

function getLanguageFromExtension(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    java: "java",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
  };
  return languageMap[extension] || getLanguageFromFileName(fileName) || "plaintext";
}

function mapFilesToObject(files = []) {
  const mapped = {};
  files.forEach((file) => {
    if (!file?.name) return;
    mapped[file.name] = {
      language: file.language || getLanguageFromExtension(file.name),
      content: file.content || "",
    };
  });
  return mapped;
}

function Editor() {
  const { roomId } = useParams();
  const { user } = useAuth();

  const [files, setFiles] = useState(initialFiles);
  const filesRef = useRef(initialFiles);
  const [activeFile, setActiveFile] = useState("main.js");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [versions, setVersions] = useState([]);
  const [projectRevision, setProjectRevision] = useState(0);

  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const [localEncryptionEnabled, setLocalEncryptionEnabled] = useState(false);
  const [roomSecret, setRoomSecret] = useState("");
  const [encryptedBackupAvailable, setEncryptedBackupAvailable] = useState(false);

  const [aiOpen, setAiOpen] = useState(true);
  const [versionOpen, setVersionOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(true);
  const [terminalView, setTerminalView] = useState("terminal");
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("syncCodeTheme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [mobilePanel, setMobilePanel] = useState("editor");

  const currentFile = files[activeFile] || null;

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const {
    connectionStatus,
    queuedChanges,
    sendOrQueue,
  } = useReconnectSync(socket, roomId, user);

  const {
    peerStatuses,
    peerMessages,
    sendPeerCode,
  } = usePeerSync(socket, roomId, user);

  const {
    encryptionEnabled,
    enableEncryption,
    disableEncryption,
    sendEncryptedCode,
    encryptedPeerUpdates,
  } = useEncryptedSync(socket, roomId, user, roomSecret);

  const fileList = useMemo(
    () =>
      Object.keys(files).map((name) => {
        const extension = name.split(".").pop()?.toLowerCase();
        const icons = {
          js: "JS", jsx: "JS", ts: "TS", tsx: "TS", html: "HT", css: "CS",
          scss: "SC", py: "PY", json: "{}", cpp: "C++", c: "C", java: "JV", md: "MD",
        };
        return { name, icon: icons[extension] || "TXT", modified: false };
      }),
    [files]
  );

  const loadVersions = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await fetchVersions(roomId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Version load failed:", error);
    }
  }, [roomId]);

  const loadProject = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await api.get(`/projects/${roomId}`);
      const project = response.data?.project;
      if (!project || !Array.isArray(project.files) || project.files.length === 0) return;

      const loadedFiles = mapFilesToObject(project.files);
      if (Object.keys(loadedFiles).length === 0) return;
      setFiles(loadedFiles);
      const revision = Number(project.revision);
      if (Number.isFinite(revision)) setProjectRevision(revision);
      setActiveFile(Object.keys(loadedFiles)[0]);
    } catch (error) {
      console.error("Project load error:", error);
    }
  }, [roomId]);

  const handleCreateFile = useCallback((fileName) => {
    const name = String(fileName || "").trim();
    if (!name) return;
    if (files[name]) {
      window.alert("A file with this name already exists.");
      return;
    }
    const language = getLanguageFromExtension(name);
    setFiles((previous) => ({ ...previous, [name]: { language, content: "" } }));
    setActiveFile(name);
    sendOrQueue("file:create", { roomId, file: { name, language, content: "" } });
  }, [files, roomId, sendOrQueue]);

  const handleDeleteFile = useCallback((fileName) => {
    const existingNames = Object.keys(files);
    if (existingNames.length <= 1) {
      window.alert("At least one file must remain.");
      return;
    }
    if (!files[fileName]) return;

    setFiles((previous) => {
      const updated = { ...previous };
      delete updated[fileName];
      return updated;
    });
    setActiveFile((current) => current === fileName ? (existingNames.filter((name) => name !== fileName)[0] || "") : current);
    sendOrQueue("file:delete", { roomId, fileName });
  }, [files, roomId, sendOrQueue]);

  const handleRenameFile = useCallback((oldFileName, newFileName) => {
    const newName = String(newFileName || "").trim();
    if (!newName || oldFileName === newName) return;
    if (files[newName]) {
      window.alert("A file with this name already exists.");
      return;
    }
    const oldFile = files[oldFileName];
    if (!oldFile) return;
    const language = getLanguageFromExtension(newName);

    setFiles((previous) => {
      const updated = { ...previous };
      delete updated[oldFileName];
      updated[newName] = { language, content: oldFile.content || "" };
      return updated;
    });
    setActiveFile((current) => current === oldFileName ? newName : current);
    sendOrQueue("file:rename", {
      roomId,
      oldFileName,
      newFile: { name: newName, language, content: oldFile.content || "" },
    });
  }, [files, roomId, sendOrQueue]);

  const handleCodeUpdate = useCallback(({ fileName, code, revision }) => {
    if (!fileName) return;
    setFiles((previous) => {
      if (!previous[fileName]) return previous;
      return { ...previous, [fileName]: { ...previous[fileName], content: code ?? "" } };
    });
    if (revision !== undefined) setProjectRevision(revision);
  }, []);

  const handleFileCreated = useCallback(({ file, revision }) => {
    if (!file?.name) return;
    setFiles((previous) => {
      if (previous[file.name]) return previous;
      return { ...previous, [file.name]: { language: file.language || getLanguageFromExtension(file.name), content: file.content || "" } };
    });
    if (revision !== undefined) setProjectRevision(revision);
  }, []);

  const handleFileDeleted = useCallback(({ fileName, revision }) => {
    if (!fileName) return;
    const currentFiles = filesRef.current;
    const nextActiveFile = Object.keys(currentFiles).find((name) => name !== fileName) || "";
    setFiles((previous) => {
      if (!previous[fileName]) return previous;
      const updated = { ...previous };
      delete updated[fileName];
      filesRef.current = updated;
      return updated;
    });
    setActiveFile((current) => current === fileName ? nextActiveFile : current);
    if (revision !== undefined) setProjectRevision(revision);
  }, []);

  const handleFileRenamed = useCallback(({ oldFileName, newFile, revision }) => {
    if (!oldFileName || !newFile?.name) return;
    setFiles((previous) => {
      if (!previous[oldFileName]) return previous;
      const updated = { ...previous };
      const oldFile = updated[oldFileName];
      delete updated[oldFileName];
      updated[newFile.name] = {
        language: newFile.language || oldFile.language || getLanguageFromExtension(newFile.name),
        content: newFile.content ?? oldFile.content ?? "",
      };
      return updated;
    });
    setActiveFile((current) => current === oldFileName ? newFile.name : current);
    if (revision !== undefined) setProjectRevision(revision);
  }, []);

  const handleUsers = useCallback((payload) => {
    const users = Array.isArray(payload) ? payload : payload?.users;
    setOnlineUsers(Array.isArray(users) ? users : []);
  }, []);

  const handleTerminalOutput = useCallback((payload) => {
    const remoteOutput = typeof payload === "string" ? payload : payload?.output;
    setOutput(remoteOutput ?? "");
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;

    const handleConnect = () => {
      socket.emit("room:join", {
        roomId,
        user: { id: user?.id, name: user?.name || user?.username || "User" },
      });
    };

    socket.on("connect", handleConnect);
    socket.on("code:update", handleCodeUpdate);
    socket.on("file:created", handleFileCreated);
    socket.on("file:deleted", handleFileDeleted);
    socket.on("file:renamed", handleFileRenamed);
    socket.on("users:list", handleUsers);
    socket.on("terminal:output", handleTerminalOutput);

    loadProject();
    loadVersions();
    if (!socket.connected) socket.connect();
    else handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("code:update", handleCodeUpdate);
      socket.off("file:created", handleFileCreated);
      socket.off("file:deleted", handleFileDeleted);
      socket.off("file:renamed", handleFileRenamed);
      socket.off("users:list", handleUsers);
      socket.off("terminal:output", handleTerminalOutput);
    };
  }, [roomId, user?.id, user?.name, user?.username, loadProject, loadVersions, handleCodeUpdate, handleFileCreated, handleFileDeleted, handleFileRenamed, handleUsers, handleTerminalOutput]);

  const handleProjectRecovered = useCallback((snapshot) => {
    if (!snapshot) return;
    const recoveryFiles = Array.isArray(snapshot.files) ? snapshot.files : snapshot.project?.files;
    if (Array.isArray(recoveryFiles)) {
      const recovered = mapFilesToObject(recoveryFiles);
      if (Object.keys(recovered).length) {
        setFiles(recovered);
        setActiveFile(snapshot.activeFile || Object.keys(recovered)[0]);
      }
    }
    if (typeof snapshot.projectRevision === "number") setProjectRevision(snapshot.projectRevision);
  }, []);

  const {
    recoveryStatus,
    hasUnsavedRecovery,
    saveRecovery,
    recoverLocalSnapshot,
    discardLocalRecovery,
  } = useProjectRecovery({
    roomId,
    files,
    activeFile,
    projectRevision,
    socket,
    onProjectRecovered: handleProjectRecovered,
  });

  const handleCodeChange = useCallback((content) => {
    if (!activeFile) return;
    const nextContent = content ?? "";
    setFiles((previous) => {
      if (!previous[activeFile]) return previous;
      return { ...previous, [activeFile]: { ...previous[activeFile], content: nextContent } };
    });

    if (encryptionEnabled) {
      sendEncryptedCode(activeFile, nextContent);
    } else {
      sendOrQueue("code:change", {
        roomId,
        fileName: activeFile,
        code: nextContent,
        revision: projectRevision,
        clientTimestamp: Date.now(),
      });
      sendPeerCode(activeFile, nextContent);
    }
    saveRecovery?.();
  }, [activeFile, roomId, projectRevision, encryptionEnabled, sendEncryptedCode, sendOrQueue, sendPeerCode, saveRecovery]);

  useEffect(() => {
    if (!Array.isArray(peerMessages) || peerMessages.length === 0) return;
    const latest = peerMessages[peerMessages.length - 1];
    if (latest?.fileName && typeof latest.code === "string") {
      handleCodeUpdate({ fileName: latest.fileName, code: latest.code });
    }
  }, [peerMessages, handleCodeUpdate]);

  useEffect(() => {
    if (!Array.isArray(encryptedPeerUpdates) || encryptedPeerUpdates.length === 0) return;
    const latest = encryptedPeerUpdates[encryptedPeerUpdates.length - 1];
    if (latest?.fileName && typeof latest.content === "string") {
      handleCodeUpdate({ fileName: latest.fileName, code: latest.content });
    }
  }, [encryptedPeerUpdates, handleCodeUpdate]);

  const handleSaveProject = useCallback(async () => {
    if (!roomId || saving) return;
    setSaving(true);
    try {
      await api.put(`/projects/${roomId}`, {
        files: Object.keys(files).map((name) => ({
          name,
          language: files[name].language || getLanguageFromExtension(name),
          content: files[name].content || "",
        })),
        revision: projectRevision,
      });
      clearRecoverySnapshot(roomId);
      await loadVersions();
      setOutput("Project saved successfully.");
    } catch (error) {
      console.error("Project save failed:", error);
      setOutput(error?.response?.data?.message || "Project save failed.");
    } finally {
      setSaving(false);
    }
  }, [roomId, saving, files, projectRevision, loadVersions]);

  const handleRunCode = useCallback(async () => {
    if (running || !currentFile) return;
    setRunning(true);
    setOutput("Running current file…");
    try {
      const language = getLanguageFromExtension(activeFile);
      const result = await runCode({
        language,
        code: currentFile.content || "",
        input: input || "",
      });
      const finalOutput = result?.output ?? result?.data?.output ?? result?.stdout ?? result?.data?.stdout ?? result?.message ?? "";
      setOutput(String(finalOutput));
      if (socket.connected) socket.emit("terminal:output", { roomId, output: String(finalOutput) });
    } catch (error) {
      console.error("Code execution failed:", error);
      console.error("Backend response:", error?.response?.data);
      setOutput(error?.response?.data?.message || error?.message || "Code execution failed.");
    } finally {
      setRunning(false);
    }
  }, [running, currentFile, activeFile, input, roomId]);

  const handleEncryptedBackup = useCallback(async () => {
    if (!roomId) return;
    const password = window.prompt("Enter password for encrypted backup:");
    if (!password) return;
    try {
      await saveEncryptedProject(roomId, { files, activeFile, projectRevision }, password);
      setEncryptedBackupAvailable(true);
      setOutput("Encrypted backup created successfully.");
    } catch (error) {
      console.error("Encrypted backup failed:", error);
      setOutput("Encrypted backup failed.");
    }
  }, [roomId, files, activeFile, projectRevision]);

  const handleEncryptedRestore = useCallback(async () => {
    if (!roomId) return;
    const password = window.prompt("Enter backup password:");
    if (!password) return;
    try {
      const data = await loadEncryptedProject(roomId, password);
      if (!data) {
        setOutput("No encrypted backup found.");
        return;
      }
      if (Array.isArray(data.files)) {
        const restored = mapFilesToObject(data.files);
        setFiles(restored);
        setActiveFile(data.activeFile || Object.keys(restored)[0] || "");
      }
      if (typeof data.projectRevision === "number") setProjectRevision(data.projectRevision);
      setOutput("Encrypted backup restored.");
    } catch (error) {
      console.error("Encrypted restore failed:", error);
      setOutput("Invalid password or corrupted backup.");
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    try {
      setEncryptedBackupAvailable(hasEncryptedProject(roomId));
    } catch {
      setEncryptedBackupAvailable(false);
    }
  }, [roomId]);

  const handleToggleEncryption = useCallback(() => {
    if (encryptionEnabled) {
      disableEncryption();
      setRoomSecret("");
      return;
    }
    const secret = window.prompt("Enter room encryption secret:");
    if (!secret) return;
    setRoomSecret(secret);
    enableEncryption(secret);
  }, [encryptionEnabled, enableEncryption, disableEncryption]);

  const handleToggleLocalEncryption = useCallback(() => {
    if (localEncryptionEnabled) {
      setLocalEncryptionEnabled(false);
      return;
    }
    const password = window.prompt("Set local encryption password:");
    if (!password) return;
    setLocalEncryptionEnabled(true);
  }, [localEncryptionEnabled]);

  const handleCreateSnapshot = useCallback(async () => {
    if (!roomId) return;
    try {
      await createSnapshot(roomId, Object.keys(files).map((name) => ({
        name,
        language: files[name].language || getLanguageFromExtension(name),
        content: files[name].content || "",
      })));
      await loadVersions();
      setVersionOpen(true);
    } catch (error) {
      console.error("Snapshot creation failed:", error);
      setOutput(error?.response?.data?.message || "Snapshot creation failed.");
    }
  }, [roomId, files, loadVersions]);

  const handleRestoreVersion = useCallback(async (revision) => {
    if (!roomId || revision === undefined) return;
    try {
      const selectedVersion = versions.find((version) => Number(version.revision) === Number(revision));
      if (!selectedVersion) throw new Error("Selected version was not found.");
      const versionId = selectedVersion._id || selectedVersion.id;
      if (!versionId) throw new Error("Version ID is missing.");

      const restored = await restoreSnapshot(roomId, versionId);
      const restoredFiles = restored?.files || restored?.project?.files;
      if (!Array.isArray(restoredFiles)) throw new Error("Restored project files were not returned.");
      const mapped = mapFilesToObject(restoredFiles);
      if (!Object.keys(mapped).length) throw new Error("Restored version contains no files.");

      setFiles(mapped);
      setActiveFile(Object.keys(mapped)[0] || "");
      setProjectRevision(typeof restored?.revision === "number" ? restored.revision : Number(revision));
      clearRecoverySnapshot(roomId);
      if (socket.connected) socket.emit("project:restore", { roomId, files: restoredFiles, revision: restored?.revision ?? revision });
      await loadVersions();
      setVersionOpen(false);
      setOutput(`Restored revision #${revision}.`);
    } catch (error) {
      console.error("Version restore failed:", error);
      setOutput(error?.response?.data?.message || error?.message || "Version restore failed.");
    }
  }, [roomId, versions, loadVersions]);

  useEffect(() => {
    try {
      localStorage.setItem("syncCodeTheme", themeMode);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, [themeMode]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        handleSaveProject();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handleRunCode();
      }
      if (event.key === "Escape") {
        setVersionOpen(false);
        setMobilePanel("editor");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleSaveProject, handleRunCode]);

  const toggleTheme = () => setThemeMode((current) => current === "dark" ? "light" : "dark");

  return (
    <div className={`synccode-editor-page theme-${themeMode}`} data-theme={themeMode}>
      {/* Global header */}
      <header className="synccode-topbar">
        <Link to="/dashboard" className="synccode-brand-link" aria-label="SyncCode dashboard">
          <span className="brand-mark">&lt;/&gt;</span>
          <span className="brand-copy">
            <span className="brand-name">SyncCode</span>
            <span className="brand-version">NEXTGEN</span>
          </span>
        </Link>

        <div className="topbar-context">
          <span className="context-icon">⌘</span>
          <div className="context-copy">
            <span className="context-eyebrow">COLLABORATIVE WORKSPACE</span>
            <span className="context-main">{activeFile || "No file selected"}</span>
          </div>
          <span className="context-divider" />
          <span className="room-pill"><span className="room-live-dot" />Room {roomId || "—"}</span>
        </div>

        <div className="topbar-actions">
          <div className="connection-pill">
            <ConnectionStatus status={connectionStatus} />
            <span className="queued-indicator" title={`${queuedChanges || 0} queued changes`}>{queuedChanges > 0 ? `${queuedChanges} queued` : "Live sync"}</span>
          </div>
          <PeerStatus peerStatuses={peerStatuses} />
          <span className="toolbar-divider" />
          <button type="button" className={`toolbar-btn icon-tool ${encryptionEnabled ? "is-active" : ""}`} onClick={handleToggleEncryption} title="Toggle room encryption" aria-label="Toggle room encryption">⌑<span className="toolbar-label">Secure</span></button>
          <button type="button" className={`toolbar-btn icon-tool ${localEncryptionEnabled ? "is-active" : ""}`} onClick={handleToggleLocalEncryption} title="Toggle local encryption" aria-label="Toggle local encryption">◈<span className="toolbar-label">Local</span></button>
          <button type="button" className="toolbar-btn icon-tool" onClick={handleEncryptedBackup} title="Create encrypted backup" aria-label="Create encrypted backup">⇧<span className="toolbar-label">Backup</span></button>
          <button type="button" className="toolbar-btn icon-tool" onClick={handleEncryptedRestore} disabled={!encryptedBackupAvailable} title="Restore encrypted backup" aria-label="Restore encrypted backup">↻<span className="toolbar-label">Restore</span></button>
          <button type="button" className="toolbar-btn icon-tool theme-toggle" onClick={toggleTheme} title={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`} aria-label="Toggle editor theme">{themeMode === "dark" ? "☼" : "☾"}<span className="toolbar-label">{themeMode === "dark" ? "Light" : "Dark"}</span></button>
          <button type="button" className="toolbar-btn save-btn" onClick={handleSaveProject} disabled={saving} title="Save project (Ctrl+S)">{saving ? "Saving…" : "Save"}<span className="shortcut-hint">Ctrl S</span></button>
          <button type="button" className="toolbar-btn run-btn" onClick={handleRunCode} disabled={running || !currentFile} title="Run current file (Ctrl+Enter)"><span className="run-symbol">▶</span>{running ? "Running…" : "Run"}<span className="shortcut-hint">Ctrl ↵</span></button>
        </div>
      </header>

      {/* Compact menu bar */}
      <nav className="editor-menubar" aria-label="Editor menu">
        <div className="editor-menu-left">
          <button type="button" onClick={handleSaveProject}>File</button>
          <button type="button" onClick={() => setMobilePanel("files")}>Explorer</button>
          <button type="button" onClick={() => { setAiOpen((value) => !value); setMobilePanel((current) => current === "ai" ? "editor" : "ai"); }}>AI Assistant</button>
          <button type="button" onClick={() => setOutputOpen((value) => !value)}>Terminal</button>
          <button type="button" onClick={toggleTheme}>{themeMode === "dark" ? "Light Theme" : "Dark Theme"}</button>
        </div>
        <div className="editor-menu-right">
          <span>{Object.keys(files).length} files</span>
          <span>Revision {projectRevision}</span>
        </div>
      </nav>

      {/* Workspace controls */}
      <div className="synccode-subbar">
        <div className="subbar-breadcrumbs">
          <span className="breadcrumb-muted">Workspace</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current">{activeFile || "Select a file"}</span>
          <span className="subbar-status-dot" />
          <span className="subbar-status-text">{saving ? "Saving project" : "All systems ready"}</span>
        </div>
        <div className="subbar-actions">
          <button type="button" className={`subbar-btn ${aiOpen ? "subbar-btn-active" : ""}`} onClick={() => { setAiOpen((value) => !value); setMobilePanel((current) => current === "ai" ? "editor" : "ai"); }}>✦ <span>AI Assist</span></button>
          <button type="button" className={`subbar-btn ${versionOpen ? "subbar-btn-active" : ""}`} onClick={() => setVersionOpen((value) => !value)}>◷ <span>Versions</span><span className="subbar-count">{versions.length}</span></button>
          <button type="button" className="subbar-btn" onClick={handleCreateSnapshot}>＋ <span>Snapshot</span></button>
          <div className="subbar-recovery"><RecoveryStatus status={recoveryStatus} hasRecovery={hasUnsavedRecovery} onRecover={recoverLocalSnapshot} onDiscard={discardLocalRecovery} /></div>
        </div>
      </div>

      {/* File tab row */}
      <div className="synccode-tabsbar">
        <div className="tabsbar-main"><FileTabs files={fileList} activeFile={activeFile} onFileSelect={setActiveFile} onFileClose={handleDeleteFile} /></div>
        <div className="tabsbar-meta"><span>{Object.keys(files).length} files</span><span className="tabsbar-revision">REV {projectRevision}</span></div>
      </div>

      {/* Three-column IDE workspace */}
      <main className={`synccode-workspace ${aiOpen ? "ai-visible" : ""} mobile-${mobilePanel}`}>
        <aside className={`synccode-sidebar ${mobilePanel === "files" ? "mobile-panel-visible" : ""}`}>
          <div className="sidebar-region-heading"><span className="region-heading-main"><span className="region-heading-chevron">⌄</span> EXPLORER</span><span className="region-heading-count">{fileList.length}</span></div>
          <div className="sidebar-content">
            <FileExplorer files={fileList} activeFile={activeFile} onFileSelect={setActiveFile} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onRenameFile={handleRenameFile} />
          </div>
          <div className="sidebar-users">
            <div className="sidebar-region-heading collaborator-heading"><span className="region-heading-main"><span className="region-heading-chevron">⌄</span> COLLABORATORS</span><span className="region-heading-count online-count">{onlineUsers.length}</span></div>
            <div className="collaborator-list"><UserList users={onlineUsers} /></div>
          </div>
          <div className="sidebar-footnote"><span className="sidebar-footnote-dot" />Workspace synced <span className="sidebar-footnote-version">v1.0</span></div>
        </aside>

        <section className={`synccode-editor-center ${mobilePanel === "editor" || mobilePanel === "terminal" ? "mobile-panel-visible" : ""}`}>
          <div className="editor-pane-toolbar">
            <div className="editor-file-context">
              <span className={`editor-language-icon lang-${(currentFile?.language || "txt").toLowerCase()}`}>{(currentFile?.language || "TXT").slice(0, 2).toUpperCase()}</span>
              <div className="editor-file-context-copy"><span className="editor-active-filename">{activeFile || "No file selected"}</span><span className="editor-active-language">{currentFile?.language || "plaintext"}</span></div>
            </div>
            <div className="editor-pane-actions">
              <span className="editor-character-count">{currentFile?.content?.length || 0} chars</span>
              <span className="editor-pane-separator" />
              <button type="button" className="pane-icon-button" onClick={handleSaveProject} title="Save project">▣</button>
              <button type="button" className="pane-icon-button" onClick={() => setOutputOpen((value) => !value)} title={outputOpen ? "Hide terminal" : "Show terminal"}>⌁</button>
            </div>
          </div>

          <div className="synccode-monaco-wrapper">
            {currentFile ? (
              <CodeEditor
                value={currentFile.content || ""}
                language={currentFile.language || getLanguageFromExtension(activeFile)}
                onChange={handleCodeChange}
                themeMode={themeMode}
                fileName={activeFile}
                socket={socket}
                user={user}
              />
            ) : (
              <div className="empty-editor"><div className="empty-editor-icon">&lt;/&gt;</div><h3>No file selected</h3><p>Select a file from Explorer or create a new file to start coding.</p><button type="button" onClick={() => setMobilePanel("files")}>Open Explorer</button></div>
            )}
          </div>

          <div className={`execution-actionbar ${running ? "execution-running" : ""}`}>
            <div className="execution-action-left"><span className={`execution-ready-dot ${running ? "is-running" : ""}`} /><span>{running ? "Execution in progress" : "Ready to run"}</span></div>
            <div className="execution-action-right"><span className="execution-shortcut">Ctrl + Enter</span><button type="button" className="action-run-button" onClick={handleRunCode} disabled={running || !currentFile}><span>▶</span>{running ? "Running…" : "Run Code"}</button><button type="button" className="action-save-button" onClick={handleSaveProject} disabled={saving}>{saving ? "Saving…" : "Save Project"}</button></div>
          </div>

          {outputOpen ? (
            <section className="synccode-output" aria-label="Terminal and output">
              <div className="terminal-tabs-bar">
                <div className="terminal-tabs-left"><button type="button" className={`terminal-tab ${terminalView === "terminal" ? "terminal-tab-active" : ""}`} onClick={() => { setTerminalView("terminal"); setMobilePanel("terminal"); }}>TERMINAL</button><button type="button" className={`terminal-tab ${terminalView === "output" ? "terminal-tab-active" : ""}`} onClick={() => setTerminalView("output")}>OUTPUT</button><button type="button" className="terminal-tab terminal-ai-tab" onClick={() => setAiOpen(true)}>AI FEEDBACK</button></div>
                <div className="terminal-tabs-right"><span className={`terminal-live-dot ${running ? "is-running" : ""}`} /><span>{running ? "Running process" : "Ready"}</span><button type="button" className="terminal-hide-button" onClick={() => setOutputOpen(false)} title="Hide terminal">×</button></div>
              </div>
              <div className={`terminal-workbench ${terminalView === "output" ? "is-output-view" : ""}`}>
                <div className="terminal-input-pane"><div className="terminal-pane-label">PROGRAM INPUT</div><textarea className="terminal-program-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Enter input passed to your program…" spellCheck={false} /></div>
                <div className="terminal-output-pane"><div className="terminal-pane-label"><span>OUTPUT</span><button type="button" onClick={() => setOutput("")}>Clear</button></div><pre className="terminal-result-output">{output || "Run your code to see output here."}</pre></div>
              </div>
              <div className="terminal-footer-bar"><span><span className="footer-terminal-dot" /> SyncCode Runtime</span><span>UTF-8</span><span className="terminal-shortcut">Ctrl + Enter to run</span></div>
            </section>
          ) : (
            <button type="button" className="show-output-btn" onClick={() => setOutputOpen(true)}>↑ Show Terminal / Output</button>
          )}
        </section>

        {aiOpen && (
          <aside className={`synccode-ai-sidebar ${mobilePanel === "ai" ? "mobile-panel-visible" : ""}`}>
            <div className="right-panel-header"><div className="ai-heading-group"><div className="ai-heading-icon">✦</div><div><span className="right-panel-title">AI ASSISTANT</span><span className="right-panel-subtitle">Code intelligence workspace</span></div></div><button type="button" className="panel-close-btn" onClick={() => { setAiOpen(false); setMobilePanel("editor"); }} title="Close AI panel" aria-label="Close AI panel">×</button></div>
            <div className="ai-panel-toolbar"><span className="ai-context-label">CURRENT FILE</span><span className="ai-context-file">{activeFile || "No file selected"}</span></div>
            <div className="right-panel-content">
              <div className="ai-tool-block"><AIPanel code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AIReviewPanel code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AIBugDetector code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AITestGenerator code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AIAgentPlanner code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AIAgentWorkflow code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} /></div>
              <div className="ai-tool-block"><AIDiffViewer code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromExtension(activeFile)} onApply={handleCodeChange} /></div>
              <div className="security-status-stack"><EncryptionStatus enabled={encryptionEnabled} /><SecurityStatus /></div>
            </div>
          </aside>
        )}

        {versionOpen && (
          <div className="version-overlay-layer">
            <button type="button" className="version-overlay-backdrop" onClick={() => setVersionOpen(false)} aria-label="Close version history overlay" />
            <VersionHistory versions={versions} onRestore={handleRestoreVersion} onClose={() => setVersionOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default Editor;
