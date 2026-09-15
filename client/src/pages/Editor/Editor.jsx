import {
  useCallback,
  useEffect,
  useMemo,
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

import AIReviewPanel
  from "../../components/AIReviewPanel/AIReviewPanel";

import AIBugDetector
  from "../../components/AIBugDetector/AIBugDetector";
import AITestGenerator
  from "../../components/AITestGenerator/AITestGenerator";

import AIAgentPlanner
  from "../../components/AIAgentPlanner/AIAgentPlanner";
import AIAgentWorkflow
  from "../../components/AIAgentWorkflow/AIAgentWorkflow";
import AIDiffViewer
  from "../../components/AIDiffViewer/AIDiffViewer";

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
    useState(true);

  const [outputOpen, setOutputOpen] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    encryptedBackupAvailable,
    setEncryptedBackupAvailable,
  ] = useState(false);

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
      async (version) => {
        if (!version) return;

        try {
          const restored =
            await restoreSnapshot(
              roomId,
              version._id ||
                version.id
            );

          const restoredFiles =
            restored?.files ||
            restored?.project
              ?.files;

          if (
            !Array.isArray(
              restoredFiles
            )
          ) {
            return;
          }

          const mapped = {};

          restoredFiles.forEach(
            (file) => {
              if (!file?.name) {
                return;
              }

              mapped[file.name] = {
                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  "",
              };
            }
          );

          setFiles(mapped);

          setActiveFile(
            Object.keys(
              mapped
            )[0] || ""
          );

          if (
            typeof restored?.revision ===
              "number"
          ) {
            setProjectRevision(
              restored.revision
            );
          }

          clearRecoverySnapshot(
            roomId
          );

          if (
            socket.connected
          ) {
            socket.emit(
              "project:restore",
              {
                roomId,
                files:
                  restoredFiles,
              }
            );
          }

          await loadVersions();
        } catch (error) {
          console.error(
            "Version restore failed:",
            error
          );

          window.alert(
            "Version restore failed."
          );
        }
      },
      [
        roomId,
        loadVersions,
      ]
    );

  return (
    <div className="synccode-editor-page">

      {/* ====================================
          TOP NAVBAR
      ==================================== */}

      <header className="synccode-topbar">

        <div className="synccode-brand">
          <Link
            to="/dashboard"
            className="synccode-brand-link"
          >
            <span className="brand-mark">
              {"</>"}
            </span>

            <span className="brand-name">
              SyncCode
            </span>

            <span className="brand-version">
              NextGen
            </span>
          </Link>
        </div>

        <div className="synccode-room-info">

          <span className="room-label">
            ROOM
          </span>

          <span className="room-id">
            {roomId || "—"}
          </span>

          <span className="room-divider">
            /
          </span>

          <span className="active-file-name">
            {activeFile || "No file"}
          </span>

        </div>

        <div className="synccode-toolbar">

          <div className="toolbar-status">

            <ConnectionStatus
              status={
                connectionStatus
              }
            />

            <PeerStatus
              peerStatuses={
                peerStatuses
              }
            />

          </div>

          <div className="toolbar-divider" />

          <button
            type="button"
            className={
              "toolbar-btn " +
              (
                encryptionEnabled
                  ? "toolbar-btn-active"
                  : ""
              )
            }
            onClick={
              handleToggleEncryption
            }
            title="Room encryption"
          >
            <span>🔐</span>
            <span>Secure</span>
          </button>

          <button
            type="button"
            className={
              "toolbar-btn " +
              (
                localEncryptionEnabled
                  ? "toolbar-btn-active"
                  : ""
              )
            }
            onClick={
              handleToggleLocalEncryption
            }
            title="Local encryption"
          >
            <span>◈</span>
            <span>Local</span>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={
              handleEncryptedBackup
            }
            title="Create encrypted backup"
          >
            <span>⬆</span>
            <span>Backup</span>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={
              handleEncryptedRestore
            }
            disabled={
              !encryptedBackupAvailable
            }
            title="Restore encrypted backup"
          >
            <span>↻</span>
            <span>Restore</span>
          </button>

          <button
            type="button"
            className="toolbar-btn toolbar-save-btn"
            onClick={
              handleSaveProject
            }
            disabled={saving}
            title="Save project"
          >
            <span>💾</span>
            <span>
              {saving
                ? "Saving..."
                : "Save"}
            </span>
          </button>

          <button
            type="button"
            className="toolbar-btn toolbar-run-btn"
            onClick={
              handleRunCode
            }
            disabled={
              running ||
              !currentFile
            }
            title="Run current file"
          >
            <span>▶</span>
            <span>
              {running
                ? "Running..."
                : "Run"}
            </span>
          </button>

        </div>
      </header>

      {/* ====================================
          SECONDARY NAVBAR
      ==================================== */}

      <div className="synccode-subbar">

        <div className="subbar-left">

          <span className="subbar-title">
            Workspace
          </span>

          <span className="subbar-separator">
            /
          </span>

          <span className="subbar-file">
            {activeFile}
          </span>

        </div>

        <div className="subbar-actions">

          <button
            type="button"
            className={
              "subbar-btn " +
              (
                aiOpen
                  ? "subbar-btn-active"
                  : ""
              )
            }
            onClick={() =>
              setAiOpen(
                (value) => !value
              )
            }
          >
            ✦ AI
          </button>

          <button
            type="button"
            className={
              "subbar-btn " +
              (
                versionOpen
                  ? "subbar-btn-active"
                  : ""
              )
            }
            onClick={() =>
              setVersionOpen(
                (value) => !value
              )
            }
          >
            ◷ Versions
          </button>

          <button
            type="button"
            className="subbar-btn"
            onClick={
              handleCreateSnapshot
            }
          >
            + Snapshot
          </button>

          <RecoveryStatus
            status={
              recoveryStatus
            }
            hasRecovery={
              hasUnsavedRecovery
            }
            onRecover={
              recoverLocalSnapshot
            }
            onDiscard={
              discardLocalRecovery
            }
          />

        </div>

      </div>

      {/* ====================================
          FILE TABS
      ==================================== */}

      <div className="synccode-tabsbar">

        <FileTabs
          files={fileList}
          activeFile={activeFile}
          onFileSelect={
            setActiveFile
          }
          onFileClose={
            handleDeleteFile
          }
        />

        <div className="tabsbar-meta">

          <span>
            {Object.keys(files).length}
            {" "}
            files
          </span>

          <span>
            Rev {projectRevision}
          </span>

        </div>

      </div>

      {/* ====================================
          MAIN WORKSPACE
      ==================================== */}

      <main
        className={
          "synccode-workspace " +
          (
            aiOpen
              ? "ai-visible "
              : ""
          ) +
          (
            versionOpen
              ? "versions-visible"
              : ""
          )
        }
      >

        {/* LEFT SIDEBAR */}

        <aside className="synccode-sidebar">

          <div className="sidebar-header">
            <span>EXPLORER</span>

            <span className="sidebar-count">
              {Object.keys(files).length}
            </span>
          </div>

          <div className="sidebar-content">

            <FileExplorer
              files={fileList}
              activeFile={
                activeFile
              }
              onFileSelect={
                setActiveFile
              }
              onCreateFile={
                handleCreateFile
              }
              onDeleteFile={
                handleDeleteFile
              }
              onRenameFile={
                handleRenameFile
              }
            />

          </div>

          <div className="sidebar-users">

            <div className="sidebar-header">
              <span>COLLABORATORS</span>

              <span className="sidebar-count">
                {onlineUsers.length}
              </span>
            </div>

            <UserList
              users={
                onlineUsers
              }
            />

          </div>

        </aside>

        {/* CENTER EDITOR */}

        <section className="synccode-editor-center">

          <div className="editor-titlebar">

            <div className="editor-file-info">

              {/* <span className="editor-file-icon">
                {currentFile?.language
                  ?.toUpperCase() ||
                  "TXT"}
              </span> */}

              <span>
                {activeFile}
              </span>

            </div>

            <div className="editor-meta">

              <span>
                {currentFile?.language ||
                  "plaintext"}
              </span>

              <span>
                {currentFile
                  ?.content?.length || 0}
                {" "}
                chars
              </span>

            </div>

          </div>

          <div className="synccode-monaco-wrapper">

            {currentFile ? (

<CodeEditor
  value={currentFile.content || ""}
  language={
    currentFile.language ||
    getLanguageFromFileName(activeFile) ||
    "plaintext"
  }
  onChange={handleCodeChange}
  fileName={activeFile}
  socket={socket}
  user={user}
/>
        
            ) : (
              <div className="empty-editor">
                <div className="empty-editor-icon">
                  {"</>"}
                </div>

                <h3>
                  No file selected
                </h3>

                <p>
                  Select a file from the
                  explorer to start editing.
                </p>
              </div>
            )}

          </div>

          {/* OUTPUT */}

          {outputOpen && (
            <div className="synccode-output">

              <div className="output-header">

                <div className="output-title">
                  <span>
                    TERMINAL
                  </span>

                  <span className="output-status">
                    {running
                      ? "Running..."
                      : "Ready"}
                  </span>
                </div>

                <div className="output-actions">

                  <button
                    type="button"
                    onClick={() =>
                      setOutput("")
                    }
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOutputOpen(
                        false
                      )
                    }
                  >
                    Hide
                  </button>

                </div>

              </div>

              <OutputConsole
                output={output}
                input={input}
                setInput={setInput}
              />

            </div>
          )}

          {!outputOpen && (
            <button
              type="button"
              className="show-output-btn"
              onClick={() =>
                setOutputOpen(
                  true
                )
              }
            >
              ↑ Show Terminal
            </button>
          )}

        </section>

        {/* RIGHT AI PANEL */}

        {aiOpen && (
          <aside className="synccode-ai-sidebar">

            <div className="right-panel-header">

              <div>
                <span className="right-panel-title">
                  AI ASSISTANT
                </span>

                <span className="right-panel-subtitle">
                  Code intelligence
                </span>
              </div>

              <button
                type="button"
                className="panel-close-btn"
                onClick={() =>
                  setAiOpen(false)
                }
                title="Close AI"
              >
                ×
              </button>

            </div>

            <div className="right-panel-content">

              <AIPanel
                code={
                  currentFile?.content ||
                  ""
                }
                language={
                  currentFile?.language ||
                  getLanguageFromFileName(
                    activeFile
                  ) ||
                  "plaintext"
                }
              />
              <AIReviewPanel
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
/>
<AIBugDetector
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
/>
<AITestGenerator
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
/>
<AIAgentPlanner
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
/>
<AIAgentWorkflow
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
/>
<AIDiffViewer
  code={
    currentFile?.content || ""
  }
  language={
    currentFile?.language ||
    getLanguageFromFileName(
      activeFile
    ) ||
    "plaintext"
  }
  onApply={(newCode) => {
    handleCodeChange(newCode);
  }}
/>

              <EncryptionStatus
                enabled={
                  encryptionEnabled
                }
              />

              <SecurityStatus />

            </div>

          </aside>
        )}

      </main>

      {/* ====================================
          VERSION DRAWER
      ==================================== */}

      {versionOpen && (
        <section className="version-drawer">

          <div className="version-drawer-header">

            <div>
              <span>
                VERSION HISTORY
              </span>

              <span className="version-count">
                {versions.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setVersionOpen(
                  false
                )
              }
            >
              ×
            </button>

          </div>

          <div className="version-drawer-content">

            <VersionHistory
              versions={versions}
              onRestore={
                handleRestoreVersion
              }
            />

          </div>

        </section>
      )}

    </div>
  );
}

export default Editor;
