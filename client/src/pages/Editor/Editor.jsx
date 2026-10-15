import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getLanguageFromFileName,
} from "../../utils/fileLanguage";

import {
  useAuth,
} from "../../context/AuthContext";

import api from "../../services/api";
import socket from "../../services/socket";

import {
  runCode,
} from "../../services/executionApi";

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

import {
  clearRecoverySnapshot,
} from "../../services/recoveryStorage";

import CodeEditor
  from "../../components/CodeEditor/CodeEditor";

import OutputConsole
  from "../../components/OutputConsole/OutputConsole";

import FileExplorer
  from "../../components/FileExplorer/FileExplorer";

import FileTabs
  from "../../components/FileTabs/FileTabs";

import UserList
  from "../../components/UserList/UserList";

import VersionHistory
  from "../../components/VersionHistory/VersionHistory";

import PeerStatus
  from "../../components/PeerStatus/PeerStatus";

import EncryptionStatus
  from "../../components/EncryptionStatus/EncryptionStatus";

import SecurityStatus
  from "../../components/SecurityStatus/SecurityStatus";

import ConnectionStatus
  from "../../components/ConnectionStatus/ConnectionStatus";

import RecoveryStatus
  from "../../components/RecoveryStatus/RecoveryStatus";

import AIPanel
  from "../../components/AIPanel/AIPanel";

import usePeerSync
  from "../../hooks/usePeerSync";

import useEncryptedSync
  from "../../hooks/useEncryptedSync";

import useReconnectSync
  from "../../hooks/useReconnectSync";

import useProjectRecovery
  from "../../hooks/useProjectRecovery";

import "./Editor.css";



import { getExecutionPlan } from "../../lib/execution/executionManager.js";
const initialFiles = {
  "main.js": {
    language: "javascript",
    content: `function hello() {
  console.log("Hello from SyncCode!");
}

hello();`,
  },

  "index.html": {
    language: "html",
    content: `<!DOCTYPE html>
<html>
  <head>
    <title>SyncCode</title>
  </head>

  <body>
    <h1>Hello SyncCode</h1>
  </body>
</html>`,
  },

  "style.css": {
    language: "css",
    content: `body {
  margin: 0;
  font-family: sans-serif;
}

h1 {
  color: white;
}`,
  },
};

function Editor() {
  const { roomId } = useParams();

  const { user } = useAuth();

  /* ========================================
     CORE STATE
  ======================================== */

  const [files, setFiles] =
    useState(initialFiles);

  const [activeFile, setActiveFile] =
    useState("main.js");

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const [versions, setVersions] =
    useState([]);

  const [projectRevision, setProjectRevision] =
    useState(0);

  /* ========================================
     TERMINAL
  ======================================== */

  const [output, setOutput] =
    useState("");

  const [input, setInput] =
    useState("");

  const [running, setRunning] =
    useState(false);

  /* ========================================
     LOCAL ENCRYPTION
  ======================================== */

  const [
    localEncryptionEnabled,
    setLocalEncryptionEnabled,
  ] = useState(false);

  const [
    encryptionPassword,
    setEncryptionPassword,
  ] = useState("");

  /* ========================================
     ROOM E2EE
  ======================================== */

  const [roomSecret, setRoomSecret] =
    useState("");

  /* ========================================
     UI STATE
  ======================================== */

  const [aiOpen, setAiOpen] =
    useState(true);

  const [versionOpen, setVersionOpen] =
    useState(false);

  const [outputOpen, setOutputOpen] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    encryptedBackupAvailable,
    setEncryptedBackupAvailable,
  ] = useState(false);

  /* ========================================
     EDITOR UI / THEME
  ======================================== */

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("syncCodeTheme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [mobilePanel, setMobilePanel] = useState("editor");
  const [explorerWidth, setExplorerWidth] = useState(224);
  const [aiWidth, setAiWidth] = useState(315);
  const [outputHeight, setOutputHeight] = useState(218);
  const workspaceRef = useRef(null);
  const dragRef = useRef({ type: null, startX: 0, startY: 0, startValue: 0 });

  const startResize = useCallback((event, type, value) => {
    if (window.matchMedia("(max-width: 700px)").matches) return;
    event.preventDefault();
    dragRef.current = {
      type,
      startX: event.clientX,
      startY: event.clientY,
      startValue: value,
    };
    document.body.classList.add("synccode-resizing");
  }, []);

  useEffect(() => {
    const move = (event) => {
      const drag = dragRef.current;
      if (!drag.type) return;
      if (drag.type === "explorer") {
        setExplorerWidth(Math.max(170, Math.min(390, drag.startValue + event.clientX - drag.startX)));
      } else if (drag.type === "ai") {
        setAiWidth(Math.max(250, Math.min(470, drag.startValue - (event.clientX - drag.startX))));
      } else if (drag.type === "output") {
        const rect = workspaceRef.current?.getBoundingClientRect();
        if (rect) setOutputHeight(Math.max(130, Math.min(rect.height * 0.65, rect.bottom - event.clientY)));
      }
    };
    const stop = () => {
      dragRef.current.type = null;
      document.body.classList.remove("synccode-resizing");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      document.body.classList.remove("synccode-resizing");
    };
  }, []);

  const [activeAiTool, setActiveAiTool] = useState("assistant");

  /* ========================================
     CURRENT FILE
  ======================================== */

  const currentFile =
    files[activeFile] || null;

  /* ========================================
     RECONNECT
  ======================================== */

  const {
    connectionStatus,
    queuedChanges,
    sendOrQueue,
  } = useReconnectSync(
    socket,
    roomId,
    user
  );

  /* ========================================
     WEBRTC
  ======================================== */

  const {
    peerStatuses,
    peerMessages,
    sendPeerCode,
  } = usePeerSync(
    socket,
    roomId,
    user
  );

  /* ========================================
     E2EE
  ======================================== */

  const {
    encryptionEnabled,
    enableEncryption,
    disableEncryption,
    sendEncryptedCode,
    encryptedPeerUpdates,
  } = useEncryptedSync(
    socket,
    roomId,
    user,
    roomSecret
  );

  /* ========================================
     FILE LIST
  ======================================== */

  const fileList =
    useMemo(() => {
      return Object.keys(files).map(
        (name) => {
          let icon = "TXT";

          if (
            name.endsWith(".js") ||
            name.endsWith(".jsx")
          ) {
            icon = "JS";
          } else if (
            name.endsWith(".html")
          ) {
            icon = "HT";
          } else if (
            name.endsWith(".css")
          ) {
            icon = "CS";
          } else if (
            name.endsWith(".py")
          ) {
            icon = "PY";
          } else if (
            name.endsWith(".json")
          ) {
            icon = "JSON";
          } else if (
            name.endsWith(".cpp")
          ) {
            icon = "C++";
          } else if (
            name.endsWith(".c")
          ) {
            icon = "C";
          } else if (
            name.endsWith(".md")
          ) {
            icon = "MD";
          }

          return {
            name,
            icon,
          };
        }
      );
    }, [files]);

  /* ========================================
     LOAD VERSIONS
  ======================================== */

  const loadVersions =
    useCallback(async () => {
      if (!roomId) return;

      try {
        const data =
          await fetchVersions(roomId);

        setVersions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Version load failed:",
          error
        );
      }
    }, [roomId]);

  /* ========================================
     LOAD PROJECT
  ======================================== */

  const loadProject =
    useCallback(async () => {
      if (!roomId) return;

      try {
        const response =
          await api.get(
            `/projects/${roomId}`
          );

        const project =
          response.data?.project;

        if (
          !project ||
          !Array.isArray(
            project.files
          ) ||
          project.files.length === 0
        ) {
          return;
        }

        const loadedFiles = {};

        project.files.forEach(
          (file) => {
            if (!file?.name) return;

            loadedFiles[file.name] = {
              language:
                file.language ||
                getLanguageFromFileName(
                  file.name
                ) ||
                "plaintext",

              content:
                file.content || "",
            };
          }
        );

        if (
          Object.keys(
            loadedFiles
          ).length === 0
        ) {
          return;
        }

        setFiles(loadedFiles);

        const revision =
          Number(
            project.revision
          );

        if (
          Number.isFinite(revision)
        ) {
          setProjectRevision(
            revision
          );
        }

        const firstFile =
          Object.keys(
            loadedFiles
          )[0];

        setActiveFile(firstFile);
      } catch (error) {
        console.error(
          "Project load error:",
          error
        );
      }
    }, [roomId]);

  /* ========================================
     FILE CREATE
  ======================================== */

  const handleCreateFile =
    useCallback(
      (fileName) => {
        const name =
          fileName.trim();

        if (!name) return;

        if (files[name]) {
          window.alert(
            "A file with this name already exists."
          );

          return;
        }

        const language =
          getLanguageFromFileName(
            name
          );

        setFiles(
          (previous) => ({
            ...previous,

            [name]: {
              language,
              content: "",
            },
          })
        );

        setActiveFile(name);

        sendOrQueue(
          "file:create",
          {
            roomId,

            file: {
              name,
              language,
              content: "",
            },
          }
        );
      },
      [
        files,
        roomId,
        sendOrQueue,
      ]
    );

  /* ========================================
     FILE DELETE
  ======================================== */

  const handleDeleteFile =
    useCallback(
      (fileName) => {
        setFiles(
          (previous) => {
            const names =
              Object.keys(previous);

            if (names.length <= 1) {
              window.alert(
                "At least one file must remain."
              );

              return previous;
            }

            if (!previous[fileName]) {
              return previous;
            }

            const updated = {
              ...previous,
            };

            delete updated[fileName];

            setActiveFile(
              (current) => {
                if (
                  current !== fileName
                ) {
                  return current;
                }

                return (
                  Object.keys(updated)[0] ||
                  ""
                );
              }
            );

            return updated;
          }
        );

        sendOrQueue(
          "file:delete",
          {
            roomId,
            fileName,
          }
        );
      },
      [
        roomId,
        sendOrQueue,
      ]
    );

  /* ========================================
     FILE RENAME
  ======================================== */

  const handleRenameFile =
    useCallback(
      (
        oldFileName,
        newFileName
      ) => {
        const newName =
          newFileName.trim();

        if (
          !newName ||
          oldFileName === newName
        ) {
          return;
        }

        if (files[newName]) {
          window.alert(
            "A file with this name already exists."
          );

          return;
        }

        const oldFile =
          files[oldFileName];

        if (!oldFile) return;

        const language =
          getLanguageFromFileName(
            newName
          );

        setFiles(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              oldFileName
            ];

            updated[newName] = {
              language,
              content:
                oldFile.content || "",
            };

            return updated;
          }
        );

        setActiveFile(
          (current) =>
            current === oldFileName
              ? newName
              : current
        );

        sendOrQueue(
          "file:rename",
          {
            roomId,
            oldFileName,

            newFile: {
              name: newName,
              language,
              content:
                oldFile.content || "",
            },
          }
        );
      },
      [
        files,
        roomId,
        sendOrQueue,
      ]
    );

  /* ========================================
     REMOTE CODE
  ======================================== */

  const handleCodeUpdate =
    useCallback(
      ({
        fileName,
        code,
        revision,
      }) => {
        if (!fileName) return;

        setFiles(
          (previous) => {
            if (
              !previous[fileName]
            ) {
              return previous;
            }

            return {
              ...previous,

              [fileName]: {
                ...previous[fileName],
                content:
                  code ?? "",
              },
            };
          }
        );

        if (
          revision !== undefined
        ) {
          setProjectRevision(
            revision
          );
        }
      },
      []
    );

  /* ========================================
     REMOTE FILE CREATE
  ======================================== */

  const handleFileCreated =
    useCallback(
      ({
        file,
        revision,
      }) => {
        if (!file?.name) return;

        setFiles(
          (previous) => {
            if (
              previous[file.name]
            ) {
              return previous;
            }

            return {
              ...previous,

              [file.name]: {
                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content || "",
              },
            };
          }
        );

        if (
          revision !== undefined
        ) {
          setProjectRevision(
            revision
          );
        }
      },
      []
    );

  /* ========================================
     REMOTE FILE DELETE
  ======================================== */

  const handleFileDeleted =
    useCallback(
      ({
        fileName,
        revision,
      }) => {
        if (!fileName) return;

        setFiles(
          (previous) => {
            if (
              !previous[fileName]
            ) {
              return previous;
            }

            const updated = {
              ...previous,
            };

            delete updated[fileName];

            setActiveFile(
              (current) => {
                if (
                  current !== fileName
                ) {
                  return current;
                }

                return (
                  Object.keys(
                    updated
                  )[0] || ""
                );
              }
            );

            return updated;
          }
        );

        if (
          revision !== undefined
        ) {
          setProjectRevision(
            revision
          );
        }
      },
      []
    );

  /* ========================================
     REMOTE FILE RENAME
  ======================================== */

  const handleFileRenamed =
    useCallback(
      ({
        oldFileName,
        newFile,
        revision,
      }) => {
        if (
          !oldFileName ||
          !newFile?.name
        ) {
          return;
        }

        setFiles(
          (previous) => {
            if (
              !previous[
                oldFileName
              ]
            ) {
              return previous;
            }

            const updated = {
              ...previous,
            };

            const oldFile =
              updated[oldFileName];

            delete updated[
              oldFileName
            ];

            updated[
              newFile.name
            ] = {
              language:
                newFile.language ||
                oldFile.language ||
                "plaintext",

              content:
                newFile.content ??
                oldFile.content ??
                "",
            };

            return updated;
          }
        );

        setActiveFile(
          (current) =>
            current === oldFileName
              ? newFile.name
              : current
        );

        if (
          revision !== undefined
        ) {
          setProjectRevision(
            revision
          );
        }
      },
      []
    );

  /* ========================================
     USERS
  ======================================== */

  const handleUsers =
    useCallback(
      ({ users }) => {
        setOnlineUsers(
          Array.isArray(users)
            ? users
            : []
        );
      },
      []
    );

  /* ========================================
     TERMINAL
  ======================================== */

  const handleTerminalOutput =
    useCallback(
      ({ output: remoteOutput }) => {
        setOutput(
          remoteOutput ?? ""
        );
      },
      []
    );

  /* ========================================
     SOCKET SETUP
  ======================================== */

  useEffect(() => {
    if (!roomId) return;

    const handleConnect = () => {
      socket.emit(
        "room:join",
        {
          roomId,
          user: {
            id: user?.id,
            name:
              user?.name ||
              user?.username ||
              "User",
          },
        }
      );
    };

    socket.on(
      "connect",
      handleConnect
    );

  socket.on(
  "code:update",
  handleCodeUpdate
);

    socket.on(
      "file:created",
      handleFileCreated
    );

    socket.on(
      "file:deleted",
      handleFileDeleted
    );

    socket.on(
      "file:renamed",
      handleFileRenamed
    );

    socket.on(
      "users:list",
      handleUsers
    );

    socket.on(
      "terminal:output",
      handleTerminalOutput
    );

    loadProject();
    loadVersions();

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
  "code:update",
  handleCodeUpdate
);

      socket.off(
        "file:created",
        handleFileCreated
      );

      socket.off(
        "file:deleted",
        handleFileDeleted
      );

      socket.off(
        "file:renamed",
        handleFileRenamed
      );

      socket.off(
        "users:list",
        handleUsers
      );

      socket.off(
        "terminal:output",
        handleTerminalOutput
      );
    };
  }, [
    roomId,
    user?.id,
    loadProject,
    loadVersions,
    handleCodeUpdate,
    handleFileCreated,
    handleFileDeleted,
    handleFileRenamed,
    handleUsers,
    handleTerminalOutput,
  ]);

  /* ========================================
     RECOVERY
  ======================================== */

  const handleProjectRecovered =
    useCallback(
      (snapshot) => {
        if (!snapshot) return;

        const recoveryFiles =
          Array.isArray(snapshot.files)
            ? snapshot.files
            : snapshot.project?.files;

        if (
          Array.isArray(
            recoveryFiles
          )
        ) {
          const recovered = {};

          recoveryFiles.forEach(
            (file) => {
              if (!file?.name) {
                return;
              }

              recovered[file.name] = {
                language:
                  file.language ||
                  getLanguageFromFileName(
                    file.name
                  ) ||
                  "plaintext",

                content:
                  file.content || "",
              };
            }
          );

          if (
            Object.keys(
              recovered
            ).length
          ) {
            setFiles(recovered);

            setActiveFile(
              snapshot.activeFile ||
              Object.keys(
                recovered
              )[0]
            );
          }
        }

        if (
          typeof snapshot.projectRevision ===
            "number"
        ) {
          setProjectRevision(
            snapshot.projectRevision
          );
        }
      },
      []
    );

  const {
    recoveryStatus,
    hasUnsavedRecovery,
    saveRecovery,
    recoverLocalSnapshot,
    recoverFromServer,
    discardLocalRecovery,
  } =
    useProjectRecovery({
      roomId,
      files,
      activeFile,
      projectRevision,
      socket,
      onProjectRecovered:
        handleProjectRecovered,
    });

  /* ========================================
     CODE CHANGE
  ======================================== */

  const handleCodeChange =
    useCallback(
      (content) => {
        if (!activeFile) return;

        setFiles(
          (previous) => {
            if (
              !previous[activeFile]
            ) {
              return previous;
            }

            return {
              ...previous,

              [activeFile]: {
                ...previous[
                  activeFile
                ],

                content:
                  content ?? "",
              },
            };
          }
        );

        const payload = {
          roomId,

          fileName: activeFile,

          code: content ?? "",

          revision:
            projectRevision,

          clientTimestamp:
            Date.now(),
        };

        if (
          encryptionEnabled
        ) {
          sendEncryptedCode(
            activeFile,
            content ?? ""
          );

          return;
        }

        sendOrQueue(
          "code:change",
          payload
        );

        sendPeerCode(
          activeFile,
          content ?? ""
        );

        saveRecovery?.();
      },
      [
        activeFile,
        roomId,
        projectRevision,
        encryptionEnabled,
        sendEncryptedCode,
        sendOrQueue,
        sendPeerCode,
        saveRecovery,
      ]
    );

  /* ========================================
     PEER MESSAGE HANDLER
  ======================================== */

  useEffect(() => {
    if (
      !Array.isArray(
        peerMessages
      )
    ) {
      return;
    }

    const latest =
      peerMessages[
        peerMessages.length - 1
      ];

    if (
      latest?.fileName &&
      typeof latest.code ===
        "string"
    ) {
      handleCodeUpdate({
        fileName:
          latest.fileName,

        code:
          latest.code,
      });
    }
  }, [
    peerMessages,
    handleCodeUpdate,
  ]);

  /* ========================================
     ENCRYPTED PEER UPDATES
  ======================================== */

  useEffect(() => {
    if (
      !Array.isArray(
        encryptedPeerUpdates
      )
    ) {
      return;
    }

    const latest =
      encryptedPeerUpdates[
        encryptedPeerUpdates.length - 1
      ];

    if (!latest) return;

    if (
      latest.fileName &&
      typeof latest.content ===
        "string"
    ) {
      handleCodeUpdate({
        fileName:
          latest.fileName,

        code:
          latest.content,
      });
    }
  }, [
    encryptedPeerUpdates,
    handleCodeUpdate,
  ]);

  /* ========================================
     SAVE PROJECT
  ======================================== */

  const handleSaveProject =
    useCallback(async () => {
      if (
        !roomId ||
        saving
      ) {
        return;
      }

      setSaving(true);

      try {
        await api.put(
          `/projects/${roomId}`,
          {
            files: Object.keys(
              files
            ).map(
              (name) => ({
                name,

                language:
                  files[name]
                    .language ||
                  getLanguageFromFileName(
                    name
                  ),

                content:
                  files[name]
                    .content || "",
              })
            ),

            revision:
              projectRevision,
          }
        );

        clearRecoverySnapshot(
          roomId
        );

        await loadVersions();

        window.alert(
          "Project saved successfully."
        );
      } catch (error) {
        console.error(
          "Project save failed:",
          error
        );

        window.alert(
          "Project save failed."
        );
      } finally {
        setSaving(false);
      }
    }, [
      roomId,
      saving,
      files,
      projectRevision,
      loadVersions,
    ]);

  /* ========================================
     RUN CODE
  ======================================== */
const handleRunCode = useCallback(async () => {
  if (running || !currentFile) {
    return;
  }

  setRunning(true);
  setOutput("");

  try {
    const fileName =
      activeFile || "";

    const extension =
      fileName
        .split(".")
        .pop()
        ?.toLowerCase();

    let language = "javascript";

    if (
      extension === "js" ||
      extension === "jsx"
    ) {
      language = "javascript";
    } else if (extension === "py") {
      language = "python";
    } else if (extension === "cpp") {
      language = "cpp";
    } else if (extension === "c") {
      language = "c";
    } else if (extension === "java") {
      language = "java";
    }

    console.log(
      "Running file:",
      fileName
    );

    console.log(
      "Detected language:",
      language
    );

    console.log(
      "Code:",
      currentFile.content
    );

    const result = await runCode({
      language,

      code:
        currentFile.content || "",

      input:
        input || "",
    });

    console.log(
      "Run result:",
      result
    );

    const finalOutput =
      result?.output ??
      result?.data?.output ??
      result?.stdout ??
      result?.data?.stdout ??
      result?.message ??
      "";

    setOutput(
      String(finalOutput)
    );

    if (socket.connected) {
      socket.emit(
        "terminal:output",
        {
          roomId,

          output:
            String(finalOutput),
        }
      );
    }
  } catch (error) {
    console.error(
      "Code execution failed:",
      error
    );

    console.error(
      "Backend response:",
      error?.response?.data
    );

    setOutput(
      error?.response?.data?.message ||
      error?.message ||
      "Code execution failed."
    );
  } finally {
    setRunning(false);
  }
}, [
  running,
  currentFile,
  activeFile,
  input,
  roomId,
]);
  /* ========================================
     LOCAL ENCRYPTED BACKUP
  ======================================== */

  const handleEncryptedBackup =
    useCallback(async () => {
      if (!roomId) return;

      const password =
        window.prompt(
          "Enter password for encrypted backup:"
        );

      if (!password) return;

      try {
        await saveEncryptedProject(
          roomId,
          {
            files,
            activeFile,
            projectRevision,
          },
          password
        );

        setEncryptedBackupAvailable(
          true
        );

        window.alert(
          "Encrypted backup created successfully."
        );
      } catch (error) {
        console.error(
          "Encrypted backup failed:",
          error
        );

        window.alert(
          "Encrypted backup failed."
        );
      }
    }, [
      roomId,
      files,
      activeFile,
      projectRevision,
    ]);

  /* ========================================
     LOCAL ENCRYPTED RESTORE
  ======================================== */

  const handleEncryptedRestore =
    useCallback(async () => {
      if (!roomId) return;

      const password =
        window.prompt(
          "Enter backup password:"
        );

      if (!password) return;

      try {
        const data =
          await loadEncryptedProject(
            roomId,
            password
          );

        if (!data) {
          window.alert(
            "No encrypted backup found."
          );

          return;
        }

        if (
          Array.isArray(
            data.files
          )
        ) {
          const restored = {};

          data.files.forEach(
            (file) => {
              if (!file?.name) {
                return;
              }

              restored[
                file.name
              ] = {
                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  "",
              };
            }
          );

          setFiles(restored);

          setActiveFile(
            data.activeFile ||
            Object.keys(
              restored
            )[0] ||
            ""
          );
        }

        if (
          typeof data.projectRevision ===
            "number"
        ) {
          setProjectRevision(
            data.projectRevision
          );
        }

        window.alert(
          "Encrypted backup restored."
        );
      } catch (error) {
        console.error(
          "Encrypted restore failed:",
          error
        );

        window.alert(
          "Invalid password or corrupted backup."
        );
      }
    }, [roomId]);

  /* ========================================
     CHECK ENCRYPTED BACKUP
  ======================================== */

  useEffect(() => {
    if (!roomId) return;

    try {
      setEncryptedBackupAvailable(
        hasEncryptedProject(
          roomId
        )
      );
    } catch {
      setEncryptedBackupAvailable(
        false
      );
    }
  }, [roomId]);

  /* ========================================
     TOGGLE ROOM ENCRYPTION
  ======================================== */

  const handleToggleEncryption =
    useCallback(() => {
      if (
        encryptionEnabled
      ) {
        disableEncryption();

        return;
      }

      const secret =
        window.prompt(
          "Enter room encryption secret:"
        );

      if (!secret) return;

      setRoomSecret(secret);

      enableEncryption(
        secret
      );
    }, [
      encryptionEnabled,
      enableEncryption,
      disableEncryption,
    ]);

  /* ========================================
     TOGGLE LOCAL ENCRYPTION
  ======================================== */

  const handleToggleLocalEncryption =
    useCallback(() => {
      if (
        localEncryptionEnabled
      ) {
        setLocalEncryptionEnabled(
          false
        );

        return;
      }

      const password =
        window.prompt(
          "Set local encryption password:"
        );

      if (!password) return;

      setEncryptionPassword(
        password
      );

      setLocalEncryptionEnabled(
        true
      );
    }, [
      localEncryptionEnabled,
    ]);

  /* ========================================
     CREATE VERSION SNAPSHOT
  ======================================== */

  const handleCreateSnapshot =
    useCallback(async () => {
      if (!roomId) return;

      try {
        await createSnapshot(
          roomId,
          Object.keys(files).map(
            (name) => ({
              name,

              language:
                files[name]
                  .language ||
                "plaintext",

              content:
                files[name]
                  .content || "",
            })
          )
        );

        await loadVersions();

        window.alert(
          "Version snapshot created."
        );
      } catch (error) {
        console.error(
          "Snapshot creation failed:",
          error
        );

        window.alert(
          "Snapshot creation failed."
        );
      }
    }, [
      roomId,
      files,
      loadVersions,
    ]);

  /* ========================================
     RESTORE VERSION
  ======================================== */

  const handleRestoreVersion =
  useCallback(
    async (revision) => {
      if (!roomId || revision === undefined) {
        return;
      }

      try {
        /* =================================
           FIND VERSION OBJECT
        ================================= */

        const selectedVersion =
          versions.find(
            (version) =>
              Number(version.revision) ===
              Number(revision)
          );

        if (!selectedVersion) {
          window.alert(
            "Selected version was not found."
          );

          return;
        }

        /* =================================
           VERSION ID
        ================================= */

        const versionId =
          selectedVersion._id ||
          selectedVersion.id;

        if (!versionId) {
          window.alert(
            "Version ID is missing."
          );

          return;
        }

        console.log(
          "Restoring version:",
          revision,
          versionId
        );

        /* =================================
           RESTORE SNAPSHOT
        ================================= */

        const restored =
          await restoreSnapshot(
            roomId,
            versionId
          );

        console.log(
          "Restore response:",
          restored
        );

        /* =================================
           GET FILES
        ================================= */

        const restoredFiles =
          restored?.files ||
          restored?.project?.files;

        if (
          !Array.isArray(
            restoredFiles
          )
        ) {
          throw new Error(
            "Restored project files were not returned."
          );
        }

        /* =================================
           MAP FILES
        ================================= */

        const mapped = {};

        restoredFiles.forEach(
          (file) => {
            if (!file?.name) {
              return;
            }

            mapped[file.name] = {
              language:
                file.language ||
                getLanguageFromFileName(
                  file.name
                ) ||
                "plaintext",

              content:
                file.content || "",
            };
          }
        );

        if (
          Object.keys(mapped).length === 0
        ) {
          throw new Error(
            "Restored version contains no files."
          );
        }

        /* =================================
           UPDATE EDITOR
        ================================= */

        setFiles(mapped);

        setActiveFile(
          Object.keys(mapped)[0] || ""
        );

        /* =================================
           UPDATE REVISION
        ================================= */

        if (
          typeof restored?.revision ===
          "number"
        ) {
          setProjectRevision(
            restored.revision
          );
        } else {
          setProjectRevision(
            Number(revision)
          );
        }

        /* =================================
           CLEAR RECOVERY
        ================================= */

        clearRecoverySnapshot(
          roomId
        );

        /* =================================
           BROADCAST RESTORE
        ================================= */

        if (socket.connected) {
          socket.emit(
            "project:restore",
            {
              roomId,
              files: restoredFiles,
              revision:
                restored?.revision ??
                revision,
            }
          );
        }

        /* =================================
           RELOAD VERSIONS
        ================================= */

        await loadVersions();

        /* =================================
           CLOSE VERSION PANEL
        ================================= */

        setVersionOpen(false);

      } catch (error) {
        console.error(
          "Version restore failed:",
          error
        );

        console.error(
          "Restore server response:",
          error?.response?.data
        );

        window.alert(
          error?.response?.data?.message ||
          error?.message ||
          "Version restore failed."
        );
      }
    },
    [
      roomId,
      versions,
      loadVersions,
    ]
  );
        

  /* ========================================
     THEME / KEYBOARD SHORTCUTS
  ======================================== */

  useEffect(() => {
    try {
      localStorage.setItem("syncCodeTheme", themeMode);
    } catch {
      // Ignore storage failures in restricted browser contexts.
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
        setMobilePanel("editor");
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleSaveProject, handleRunCode]);

  const toggleTheme = () => {
    setThemeMode((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  return (
    <div
      className={`synccode-editor-page theme-${themeMode}`}
      data-theme={themeMode}
    >
      {/* Top navigation: only global room/session controls */}
      <header className="synccode-topbar">
        <Link to="/dashboard" className="synccode-brand-link" title="Back to dashboard">
          <span className="brand-mark">&lt;/&gt;</span>
          <span className="brand-copy">
            <strong className="brand-name">SyncCode</strong>
            <span className="brand-version">NEXTGEN</span>
          </span>
        </Link>

        <div className="topbar-room" title={`Room ${roomId || "not assigned"}`}>
          <span className="topbar-room-indicator" />
          <span className="topbar-room-label">ROOM</span>
          <code>{roomId || "—"}</code>
          <span className="topbar-room-divider">/</span>
          <span className="topbar-current-file">{activeFile || "No file selected"}</span>
        </div>

        <div className="topbar-right">
          <div className="topbar-connection" title="Connection status">
            <ConnectionStatus status={connectionStatus} />
            <PeerStatus peerStatuses={peerStatuses} />
          </div>

          <div className="topbar-separator" />

          <button
            type="button"
            className={`topbar-icon-button ${encryptionEnabled ? "is-active" : ""}`}
            onClick={handleToggleEncryption}
            title={encryptionEnabled ? "Disable room encryption" : "Enable room encryption"}
            aria-label="Toggle room encryption"
          >
            <span aria-hidden="true">⌑</span>
            <span className="topbar-button-label">Secure</span>
          </button>

          <button
            type="button"
            className={`topbar-icon-button ${localEncryptionEnabled ? "is-active" : ""}`}
            onClick={handleToggleLocalEncryption}
            title={localEncryptionEnabled ? "Disable local encryption indicator" : "Set local encryption password"}
            aria-label="Toggle local encryption"
          >
            <span aria-hidden="true">◈</span>
            <span className="topbar-button-label">Local</span>
          </button>

          <button
            type="button"
            className="topbar-icon-button"
            onClick={handleEncryptedBackup}
            title="Create encrypted backup"
            aria-label="Create encrypted backup"
          >
            <span aria-hidden="true">⇧</span>
            <span className="topbar-button-label">Backup</span>
          </button>

          <button
            type="button"
            className="topbar-icon-button"
            onClick={handleEncryptedRestore}
            disabled={!encryptedBackupAvailable}
            title="Restore encrypted backup"
            aria-label="Restore encrypted backup"
          >
            <span aria-hidden="true">↻</span>
            <span className="topbar-button-label">Restore</span>
          </button>

          <button
            type="button"
            className="topbar-icon-button theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`}
            aria-label="Toggle editor theme"
          >
            <span aria-hidden="true">{themeMode === "dark" ? "☼" : "☾"}</span>
            <span className="topbar-button-label">{themeMode === "dark" ? "Light" : "Dark"}</span>
          </button>

          <div className="topbar-user" title={user?.name || user?.username || "Developer"}>
            <span className="topbar-avatar">
              {(user?.name || user?.username || "D").trim().charAt(0).toUpperCase()}
            </span>
            <span className="topbar-user-copy">
              <strong>{user?.name || user?.username || "Developer"}</strong>
              <small>Collaborator</small>
            </span>
          </div>
        </div>
      </header>

      {/* Workspace navigation */}
      <nav className="editor-subnav" aria-label="Editor workspace navigation">
        <div className="editor-breadcrumbs">
          <span>Workspace</span>
          <span className="breadcrumb-slash">/</span>
          <strong>{roomId || "Untitled room"}</strong>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-active-file">{activeFile || "No file"}</span>
        </div>

        <div className="editor-subnav-actions">
          <button
            type="button"
            className={`subnav-button ${aiOpen ? "selected" : ""}`}
            onClick={() => setAiOpen((value) => !value)}
            title="Toggle AI tools"
          >
            <span aria-hidden="true">✦</span> AI Tools
          </button>
          <button
            type="button"
            className={`subnav-button ${versionOpen ? "selected" : ""}`}
            onClick={() => setVersionOpen((value) => !value)}
            title="Open version history"
          >
            <span aria-hidden="true">◷</span> Versions
            <span className="subnav-count">{versions.length}</span>
          </button>
          <button
            type="button"
            className="subnav-button"
            onClick={handleCreateSnapshot}
            title="Create a version snapshot"
          >
            <span aria-hidden="true">＋</span> Snapshot
          </button>
          <div className="subnav-recovery">
            <RecoveryStatus
              status={recoveryStatus}
              hasRecovery={hasUnsavedRecovery}
              onRecover={recoverLocalSnapshot}
              onDiscard={discardLocalRecovery}
            />
          </div>
          <div className="mobile-view-actions" aria-label="Switch workspace panel">
            <button type="button" className={mobilePanel === "explorer" ? "mobile-nav-selected" : ""} onClick={() => setMobilePanel("explorer")}>Files</button>
            <button type="button" className={mobilePanel === "editor" ? "mobile-nav-selected" : ""} onClick={() => setMobilePanel("editor")}>Code</button>
            <button type="button" className={mobilePanel === "ai" ? "mobile-nav-selected" : ""} onClick={() => { setMobilePanel("ai"); setAiOpen(true); }}>AI</button>
          </div>
        </div>
      </nav>

      {/* File tabs */}
      <div className="synccode-tabsbar">
        <FileTabs
          files={fileList}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
        />
        <div className="tabsbar-meta">
          <span>{Object.keys(files).length} files</span>
          <span className="tabsbar-meta-divider" />
          <span>REV {projectRevision}</span>
        </div>
      </div>

      {/* Main three-column IDE workspace */}
      <main
        ref={workspaceRef}
        style={{ gridTemplateColumns: aiOpen
          ? `${explorerWidth}px 5px minmax(360px, 1fr) 5px ${aiWidth}px`
          : `${explorerWidth}px 5px minmax(360px, 1fr)` }}
        className={`synccode-workspace ${aiOpen ? "ai-visible" : ""} ${mobilePanel === "explorer" ? "mobile-explorer" : ""} ${mobilePanel === "editor" ? "mobile-editor" : ""} ${mobilePanel === "ai" ? "mobile-ai" : ""}`}
      >
        {/* Left: files and collaborators */}
        <aside className={`synccode-sidebar ${mobilePanel === "explorer" ? "mobile-panel-visible" : ""}`}>
          <div className="workspace-panel-heading">
            <div>
              <span className="panel-eyebrow">PROJECT</span>
              <h2>Explorer</h2>
            </div>
            <span className="panel-count">{Object.keys(files).length}</span>
          </div>

          <div className="sidebar-content">
            <FileExplorer
              files={fileList}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
            />
          </div>

          <div className="sidebar-users">
            <UserList users={onlineUsers} />
          </div>

          <div className="sidebar-bottom-status">
            <span className="status-dot" />
            <span>Workspace connected</span>
            {Array.isArray(queuedChanges) && queuedChanges.length > 0 && (
              <span className="queued-changes">{queuedChanges.length} queued</span>
            )}
          </div>
        </aside>

        <div className="synccode-resize-handle vertical" role="separator" aria-label="Resize file explorer" aria-orientation="vertical" onPointerDown={(event) => startResize(event, "explorer", explorerWidth)} />

        {/* Center: live code, run controls, output */}
        <section className={`synccode-editor-center ${mobilePanel === "editor" ? "mobile-panel-visible" : ""}`}>
          <div className="center-editor-heading">
            <div className="center-editor-file">
              <span className={`language-glyph glyph-${(currentFile?.language || "text").toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                {(currentFile?.language || "TXT").toUpperCase().slice(0, 3)}
              </span>
              <div className="center-editor-file-text">
                <strong>{activeFile || "Untitled"}</strong>
                <span>{currentFile?.language || "plaintext"} · {currentFile?.content?.length || 0} characters</span>
              </div>
            </div>
            <div className="center-editor-heading-right">
              <span className="live-sync-badge"><span className="status-dot" /> Live sync</span>
              <span className="revision-badge">Rev {projectRevision}</span>
            </div>
          </div>

          <div className="live-editor-area">
            {currentFile ? (
              <CodeEditor
                value={currentFile.content || ""}
                language={currentFile.language || getLanguageFromFileName(activeFile) || "plaintext"}
                onChange={handleCodeChange}
                themeMode={themeMode}
                fileName={activeFile}
                socket={socket}
                user={user}
              />
            ) : (
              <div className="empty-editor">
                <div className="empty-editor-icon">&lt;/&gt;</div>
                <h3>No file selected</h3>
                <p>Select a file from Explorer or create a new file to start coding.</p>
              </div>
            )}
          </div>

          <div className="editor-actionbar">
            <div className="editor-actionbar-left">
              <button
                type="button"
                className="editor-run-button"
                onClick={handleRunCode}
                disabled={running || !currentFile}
              >
                <span className="run-triangle">▶</span>
                {running ? "Running…" : "Run Code"}
              </button>
              <button
                type="button"
                className="editor-save-button"
                onClick={handleSaveProject}
                disabled={saving}
              >
                <span aria-hidden="true">▣</span>
                {saving ? "Saving…" : "Save Project"}
              </button>
              <button
                type="button"
                className="editor-clear-button"
                onClick={() => setOutput("")}
                title="Clear the output panel"
              >
                Clear output
              </button>
            </div>
            <div className="editor-actionbar-right">
              <span className="shortcut-pill"><kbd>Ctrl</kbd> <kbd>Enter</kbd> Run</span>
              <span className="shortcut-pill"><kbd>Ctrl</kbd> <kbd>S</kbd> Save</span>
            </div>
          </div>

          {outputOpen ? (
            <>
            <div className="synccode-resize-handle horizontal" role="separator" aria-label="Resize output panel" aria-orientation="horizontal" onPointerDown={(event) => startResize(event, "output", outputHeight)} />
            <section className="synccode-output" style={{ flexBasis: `${outputHeight}px`, height: `${outputHeight}px` }} aria-label="Code output and terminal">
              <div className="output-panel-heading">
                <div className="output-panel-title">
                  <span className="terminal-symbol">›_</span>
                  <strong>Output</strong>
                  <span className={`output-state ${running ? "running" : ""}`}>
                    <span className="status-dot" /> {running ? "Running process" : "Ready"}
                  </span>
                </div>
                <div className="output-panel-actions">
                  <button type="button" onClick={() => setOutput("")}>Clear</button>
                  <button type="button" onClick={() => setOutputOpen(false)} aria-label="Hide output panel">Hide <span aria-hidden="true">⌄</span></button>
                </div>
              </div>
              <div className="terminal-console-body">
                <OutputConsole output={output} input={input} setInput={setInput} />
              </div>
              <div className="terminal-footer-bar">
                <span>SyncCode Runtime</span>
                <span>{running ? "Executing current file" : "Ready for execution"}</span>
                <span className="terminal-shortcut">UTF-8 · LF</span>
              </div>
            </section>
            </>
          ) : (
            <button type="button" className="show-output-btn" onClick={() => setOutputOpen(true)}>
              ↑ Show Output
            </button>
          )}
        </section>

        {/* Right: AI and supporting developer features */}
        {aiOpen && (
          <div className="synccode-resize-handle vertical" role="separator" aria-label="Resize AI panel" aria-orientation="vertical" onPointerDown={(event) => startResize(event, "ai", aiWidth)} />
        )}
        {aiOpen && (
          <aside className={`synccode-ai-sidebar ${mobilePanel === "ai" ? "mobile-panel-visible" : ""}`}>
            <div className="ai-panel-heading">
              <div className="ai-heading-mark">✦</div>
              <div className="ai-heading-copy">
                <h2>AI Workbench</h2>
                <span>Context-aware developer tools</span>
              </div>
              <button type="button" className="panel-close-btn" onClick={() => setAiOpen(false)} aria-label="Close AI Workbench" title="Close AI Workbench">×</button>
            </div>

            <div className="ai-tool-tabs" role="tablist" aria-label="AI features">
              {[
                ["assistant", "Ask AI"],
                ["review", "Review"],
                ["bugs", "Bugs"],
                ["tests", "Tests"],
                ["planner", "Plan"],
                ["workflow", "Flow"],
                ["diff", "Diff"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeAiTool === key}
                  className={activeAiTool === key ? "active" : ""}
                  onClick={() => setActiveAiTool(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="right-panel-content">
              {activeAiTool === "assistant" && (
                <AIPanel code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "review" && (
                <AIReviewPanel code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "bugs" && (
                <AIBugDetector code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "tests" && (
                <AITestGenerator code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "planner" && (
                <AIAgentPlanner code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "workflow" && (
                <AIAgentWorkflow code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} />
              )}
              {activeAiTool === "diff" && (
                <AIDiffViewer code={currentFile?.content || ""} language={currentFile?.language || getLanguageFromFileName(activeFile) || "plaintext"} onApply={(newCode) => handleCodeChange(newCode)} />
              )}

              <div className="ai-security-statuses">
                <EncryptionStatus enabled={encryptionEnabled} />
                <SecurityStatus />
              </div>
            </div>
            <div className="ai-panel-footer">
              <span className="status-dot" />
              <span>Review AI changes before applying</span>
            </div>
          </aside>
        )}
      </main>

      {/* Bottom status bar */}
      <footer className="synccode-statusbar">
        <div className="statusbar-left">
          <span><span className="status-dot" /> {connectionStatus || "Connected"}</span>
          <span>Room: {roomId || "—"}</span>
          <span>{activeFile || "No file"}</span>
        </div>
        <div className="statusbar-right">
          <span>{currentFile?.language || "plaintext"}</span>
          <span>Rev {projectRevision}</span>
          <span>{Array.isArray(queuedChanges) ? queuedChanges.length : (Number(queuedChanges) || 0)} queued</span>
        </div>
      </footer>

      {/* Version history overlays the workspace; it never resizes the editor or terminal. */}
      {versionOpen && (
        <div className="version-history-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setVersionOpen(false);
        }}>
          <VersionHistory
            versions={versions}
            onRestore={handleRestoreVersion}
            onClose={() => setVersionOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default Editor;
