import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Link,
  useParams
} from "react-router-dom";

import {
  getLanguageFromFileName
} from "../../utils/fileLanguage";

import {
  useAuth
} from "../../context/AuthContext";

import api
  from "../../services/api";

import socket
  from "../../services/socket";

import {
  runCode
} from "../../services/executionApi";

import {
  fetchVersions,
  createSnapshot,
  restoreSnapshot
} from "../../services/versionApi";
import {
  saveEncryptedProject,
  loadEncryptedProject,
  hasEncryptedProject
} from "../../services/encryptedProjectStorage";
import {
  clearRecoverySnapshot
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

import usePeerSync
  from "../../hooks/usePeerSync";

import useEncryptedSync
  from "../../hooks/useEncryptedSync";

import useReconnectSync
  from "../../hooks/useReconnectSync";

import useProjectRecovery
  from "../../hooks/useProjectRecovery";

import "../../components/PeerStatus/PeerStatus.css";
import "../../components/EncryptionStatus/EncryptionStatus.css";
import "../../components/SecurityStatus/SecurityStatus.css";
import "../../components/ConnectionStatus/ConnectionStatus.css";
import "../../components/RecoveryStatus/RecoveryStatus.css";

import {
  recordSyncLatency,
  recordCodeChange,
} from "../../services/performanceMonitor";

/*
 * ========================================
 * INITIAL FILES
 * ========================================
 */

const initialFiles = {

  "main.js": {
    language: "javascript",

    content: `function hello() {
  console.log("Hello from SyncCode!");
}

hello();`
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
</html>`
  },


  "style.css": {
    language: "css",

    content: `body {
  margin: 0;
  font-family: sans-serif;
}

h1 {
  color: white;
}`
  }

};


/*
 * ========================================
 * EDITOR
 * ========================================
 */

function Editor() {

  const {
    roomId
  } = useParams();


  const {
    user
  } = useAuth();


  /*
   * ========================================
   * CORE STATE
   * ========================================
   */

  const [
    files,
    setFiles
  ] = useState(
    initialFiles
  );


  const [
    activeFile,
    setActiveFile
  ] = useState(
    "main.js"
  );


  const [
    onlineUsers,
    setOnlineUsers
  ] = useState([]);


  const [
    versions,
    setVersions
  ] = useState([]);


  const [
    projectRevision,
    setProjectRevision
  ] = useState(0);


  /*
   * ========================================
   * TERMINAL
   * ========================================
   */

  const [
    output,
    setOutput
  ] = useState("");


  const [
    input,
    setInput
  ] = useState("");


  const [
    running,
    setRunning
  ] = useState(false);


  /*
   * ========================================
   * LOCAL ENCRYPTION
   * ========================================
   */

  const [
    localEncryptionEnabled,
    setLocalEncryptionEnabled
  ] = useState(false);


  const [
    encryptionPassword,
    setEncryptionPassword
  ] = useState("");


  /*
   * ========================================
   * ROOM E2EE
   * ========================================
   */

  const [
    roomSecret,
    setRoomSecret
  ] = useState("");


  /*
   * ========================================
   * CURRENT FILE
   * ========================================
   */

  const currentFile =
    files[activeFile];


  /*
   * ========================================
   * RECONNECT
   * ========================================
   */

  const {
    connectionStatus,
    queuedChanges,
    sendOrQueue
  } = useReconnectSync(
    socket,
    roomId,
    user
  );


  /*
   * ========================================
   * WEBRTC
   * ========================================
   */

  const {
    peerStatuses,
    peerMessages,
    sendPeerCode
  } = usePeerSync(
    socket,
    roomId,
    user
  );


  /*
   * ========================================
   * E2EE
   * ========================================
   */

  const {
    encryptionEnabled,
    enableEncryption,
    disableEncryption,
    sendEncryptedCode,
    encryptedPeerUpdates
  } = useEncryptedSync(
    socket,
    roomId,
    user,
    roomSecret
  );


  /*
   * ========================================
   * FILE LIST
   * ========================================
   */

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
            icon
          };
        }
      );

    }, [files]);


  /*
   * ========================================
   * VERSION HISTORY
   * ========================================
   */

  const loadVersions =
    useCallback(
      async () => {

        if (!roomId) {
          return;
        }


        try {

          const data =
            await fetchVersions(
              roomId
            );


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

      },
      [roomId]
    );


  /*
   * ========================================
   * LOAD PROJECT
   * ========================================
   */

  const loadProject =
    useCallback(
      async () => {

        if (!roomId) {
          return;
        }


        try {

          console.log(
            "Loading project:",
            roomId
          );


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

            console.log(
              "No saved project found."
            );

            return;
          }


          const loadedFiles = {};


          project.files.forEach(
            (file) => {

              if (
                !file?.name
              ) {

                return;
              }


              loadedFiles[
                file.name
              ] = {

                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  ""
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


          setFiles(
            loadedFiles
          );


          const revision =
            Number(
              project.revision
            );


          if (
            Number.isFinite(
              revision
            )
          ) {

            setProjectRevision(
              revision
            );
          }


          const firstFile =
            Object.keys(
              loadedFiles
            )[0];


          setActiveFile(
            firstFile
          );


          console.log(
            "✅ Project loaded:",
            Object.keys(
              loadedFiles
            )
          );

        } catch (error) {

          console.error(
            "❌ Project load error:",
            error
          );


          console.error(
            "Server response:",
            error.response?.data
          );

        }

      },
      [roomId]
    );


  /*
   * ========================================
   * CREATE FILE
   * ========================================
   */

  const handleCreateFile =
    useCallback(
      (fileName) => {

        const name =
          fileName.trim();


        if (!name) {
          return;
        }


        if (
          files[name]
        ) {

          window.alert(
            "A file with this name already exists."
          );

          return;
        }


        const language =
          getLanguageFromFileName(
            name
          );


        const newFile = {

          name,

          language,

          content: ""
        };


        setFiles(
          (previousFiles) => ({
            ...previousFiles,

            [name]: {
              language,
              content: ""
            }
          })
        );


        setActiveFile(
          name
        );


        sendOrQueue(
          "file:create",
          {
            roomId,
            file: newFile
          }
        );

      },
      [
        files,
        roomId,
        sendOrQueue
      ]
    );


  /*
   * ========================================
   * DELETE FILE
   * ========================================
   */

  const handleDeleteFile =
    useCallback(
      (fileName) => {

        setFiles(
          (previousFiles) => {

            const fileNames =
              Object.keys(
                previousFiles
              );


            if (
              fileNames.length <= 1
            ) {

              window.alert(
                "At least one file must remain."
              );


              return previousFiles;
            }


            if (
              !previousFiles[
                fileName
              ]
            ) {

              return previousFiles;
            }


            const updatedFiles = {
              ...previousFiles
            };


            delete updatedFiles[
              fileName
            ];


            /*
             * Change active file inside
             * the same state operation.
             */

            setActiveFile(
              (currentActiveFile) => {

                if (
                  currentActiveFile !==
                  fileName
                ) {

                  return currentActiveFile;
                }


                const remaining =
                  Object.keys(
                    updatedFiles
                  );


                return (
                  remaining[0] ||
                  ""
                );
              }
            );


            return updatedFiles;
          }
        );


        sendOrQueue(
          "file:delete",
          {
            roomId,
            fileName
          }
        );

      },
      [
        roomId,
        sendOrQueue
      ]
    );


  /*
   * ========================================
   * RENAME FILE
   * ========================================
   */

  const handleRenameFile =
    useCallback(
      (
        oldFileName,
        newFileName
      ) => {

        const newName =
          newFileName.trim();


        if (!newName) {
          return;
        }


        if (
          oldFileName === newName
        ) {

          return;
        }


        if (
          files[newName]
        ) {

          window.alert(
            "A file with this name already exists."
          );

          return;
        }


        const oldFile =
          files[
            oldFileName
          ];


        if (!oldFile) {
          return;
        }


        const newFile = {

          name:
            newName,

          language:
            getLanguageFromFileName(
              newName
            ),

          content:
            oldFile.content ||
            ""
        };


        setFiles(
          (previousFiles) => {

            const updatedFiles = {
              ...previousFiles
            };


            delete updatedFiles[
              oldFileName
            ];


            updatedFiles[
              newName
            ] = {

              language:
                newFile.language,

              content:
                newFile.content
            };


            return updatedFiles;
          }
        );


        setActiveFile(
          (currentActiveFile) => {

            if (
              currentActiveFile ===
              oldFileName
            ) {

              return newName;
            }


            return currentActiveFile;
          }
        );


        sendOrQueue(
          "file:rename",
          {
            roomId,
            oldFileName,
            newFile
          }
        );

      },
      [
        files,
        roomId,
        sendOrQueue
      ]
    );


  /*
   * ========================================
   * SOCKET: CODE UPDATE
   * ========================================
   */

  const handleCodeUpdate =
    useCallback(
      ({
        fileName,
        code,
        revision
      }) => {

        if (!fileName) {
          return;
        }


        setFiles(
          (previousFiles) => {

            if (
              !previousFiles[
                fileName
              ]
            ) {

              return previousFiles;
            }


            return {

              ...previousFiles,

              [fileName]: {

                ...previousFiles[
                  fileName
                ],

                content:
                  code ?? ""
              }
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


  /*
   * ========================================
   * SOCKET: FILE CREATED
   * ========================================
   */

  const handleFileCreated =
    useCallback(
      ({
        file,
        revision
      }) => {

        if (
          !file?.name
        ) {

          return;
        }


        setFiles(
          (previousFiles) => {

            if (
              previousFiles[
                file.name
              ]
            ) {

              return previousFiles;
            }


            return {

              ...previousFiles,

              [file.name]: {

                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  ""
              }
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


  /*
   * ========================================
   * SOCKET: FILE DELETED
   * ========================================
   */

  const handleFileDeleted =
    useCallback(
      ({
        fileName,
        revision
      }) => {

        if (!fileName) {
          return;
        }


        setFiles(
          (previousFiles) => {

            if (
              !previousFiles[
                fileName
              ]
            ) {

              return previousFiles;
            }


            const updatedFiles = {
              ...previousFiles
            };


            delete updatedFiles[
              fileName
            ];


            /*
             * Select another file if
             * deleted file was active.
             */

            setActiveFile(
              (currentActiveFile) => {

                if (
                  currentActiveFile !==
                  fileName
                ) {

                  return currentActiveFile;
                }


                const remaining =
                  Object.keys(
                    updatedFiles
                  );


                return (
                  remaining[0] ||
                  ""
                );
              }
            );


            return updatedFiles;
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


  /*
   * ========================================
   * SOCKET: FILE RENAMED
   * ========================================
   */

  const handleFileRenamed =
    useCallback(
      ({
        oldFileName,
        newFile,
        revision
      }) => {

        if (
          !oldFileName ||
          !newFile?.name
        ) {

          return;
        }


        setFiles(
          (previousFiles) => {

            if (
              !previousFiles[
                oldFileName
              ]
            ) {

              return previousFiles;
            }


            const updatedFiles = {
              ...previousFiles
            };


            const oldFile =
              updatedFiles[
                oldFileName
              ];


            delete updatedFiles[
              oldFileName
            ];


            updatedFiles[
              newFile.name
            ] = {

              language:
                newFile.language ||
                oldFile.language ||
                "plaintext",

              content:
                newFile.content ??
                oldFile.content ??
                ""
            };


            return updatedFiles;
          }
        );


        setActiveFile(
          (currentActiveFile) => {

            if (
              currentActiveFile ===
              oldFileName
            ) {

              return newFile.name;
            }


            return currentActiveFile;
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


  /*
   * ========================================
   * USER LIST
   * ========================================
   */

  const handleUsers =
    useCallback(
      ({
        users
      }) => {

        setOnlineUsers(
          Array.isArray(users)
            ? users
            : []
        );

      },
      []
    );


  /*
   * ========================================
   * TERMINAL OUTPUT
   * ========================================
   */

  const handleTerminalOutput =
    useCallback(
      ({
        output: remoteOutput
      }) => {

        setOutput(
          remoteOutput ??
          ""
        );

      },
      []
    );


  /*
   * ========================================
   * PROJECT RESTORE EVENT
   * ========================================
   */

  const handleProjectRestored =
    useCallback(
      ({
        files: restoredFiles,
        revision
      }) => {

        if (
          !restoredFiles ||
          typeof restoredFiles !==
            "object"
        ) {

          return;
        }


        setFiles(
          restoredFiles
        );


        const names =
          Object.keys(
            restoredFiles
          );


        setActiveFile(
          names[0] ||
          ""
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


  /*
   * ========================================
   * REVISION UPDATE
   * ========================================
   */

  const handleRevisionUpdate =
    useCallback(
      ({
        revision
      }) => {

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


  /*
   * ========================================
   * SOCKET CONNECTION
   * ========================================
   *
   * IMPORTANT:
   *
   * This effect must not re-run on every
   * file edit.
   */

  useEffect(() => {

    if (
      !user ||
      !roomId
    ) {

      return;
    }


    /*
     * Load initial data.
     */

    loadProject();
    loadVersions();


    /*
     * Register listeners.
     */

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
      "room:users",
      handleUsers
    );


    socket.on(
      "terminal:update",
      handleTerminalOutput
    );


    socket.on(
      "project:restored",
      handleProjectRestored
    );


    socket.on(
      "revision:update",
      handleRevisionUpdate
    );


    /*
     * Connect only when necessary.
     */

    if (
      !socket.connected
    ) {

      socket.connect();
    }


    /*
     * Join room once for this
     * editor lifecycle.
     */

    socket.emit(
      "room:join",
      {
        roomId,

        user: {
          id:
            user.id,

          name:
            user.name
        }
      }
    );


    /*
     * Cleanup.
     */

    return () => {

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
        "room:users",
        handleUsers
      );


      socket.off(
        "terminal:update",
        handleTerminalOutput
      );


      socket.off(
        "project:restored",
        handleProjectRestored
      );


      socket.off(
        "revision:update",
        handleRevisionUpdate
      );


      /*
       * Do NOT call socket.disconnect().
       *
       * useReconnectSync owns the
       * reconnection lifecycle.
       *
       * Do NOT call room:leave here either,
       * because reconnect should preserve
       * the same socket lifecycle.
       */

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
    handleProjectRestored,
    handleRevisionUpdate
  ]);


  /*
   * ========================================
   * PROJECT RECOVERY
   * ========================================
   */

  const {
    recoveryStatus,
    hasUnsavedRecovery,
    saveRecovery,
    recoverLocalSnapshot,
    recoverFromServer,
    discardLocalRecovery
  } = useProjectRecovery({
    roomId,

    user,

    files,

    activeFile,

    projectRevision,

    setFiles,

    setActiveFile,

    socket
  });


  /*
   * ========================================
   * WEBRTC PEER MESSAGES
   * ========================================
   */

  useEffect(() => {

    const latest =
      peerMessages[
        peerMessages.length - 1
      ];


    if (!latest) {
      return;
    }


    const message =
      latest.message;


    if (
      message?.type !==
      "code"
    ) {

      return;
    }


    if (
      message.roomId !==
      roomId
    ) {

      return;
    }


    if (
      !message.fileName
    ) {

      return;
    }


    setFiles(
      (previousFiles) => {

        if (
          !previousFiles[
            message.fileName
          ]
        ) {

          return previousFiles;
        }


        return {

          ...previousFiles,

          [message.fileName]: {

            ...previousFiles[
              message.fileName
            ],

            content:
              message.code ??
              ""
          }
        };
      }
    );

  }, [
    peerMessages,
    roomId
  ]);


  /*
   * ========================================
   * E2EE PEER MESSAGES
   * ========================================
   */

  useEffect(() => {

    const latest =
      encryptedPeerUpdates[
        encryptedPeerUpdates.length - 1
      ];


    if (!latest) {
      return;
    }


    if (
      latest.roomId !==
      roomId
    ) {

      return;
    }


    if (
      !latest.fileName
    ) {

      return;
    }


    setFiles(
      (previousFiles) => {

        if (
          !previousFiles[
            latest.fileName
          ]
        ) {

          return previousFiles;
        }


        return {

          ...previousFiles,

          [latest.fileName]: {

            ...previousFiles[
              latest.fileName
            ],

            content:
              latest.code ??
              ""
          }
        };
      }
    );

  }, [
    encryptedPeerUpdates,
    roomId
  ]);


  /*
   * ========================================
   * LOCAL CODE CHANGE
   * ========================================
   */

  const handleCodeChange =
    useCallback(
      (value) => {

        const newCode =
          value || "";


        /*
         * Local update first.
         */

        setFiles(
          (previousFiles) => {

            if (
              !previousFiles[
                activeFile
              ]
            ) {

              return previousFiles;
            }


            return {

              ...previousFiles,

              [activeFile]: {

                ...previousFiles[
                  activeFile
                ],

                content:
                  newCode
              }
            };
          }
        );


        /*
         * E2EE MODE
         */

        if (
          encryptionEnabled &&
          roomSecret
        ) {

          sendEncryptedCode(
            activeFile,
            newCode
          );

          return;
        }


        /*
         * NORMAL SOCKET MODE
         */

        sendOrQueue(
          "code:change",
          {
            roomId,

            fileName:
              activeFile,

            code:
              newCode
          }
        );


        /*
         * WebRTC experimental
         * peer path.
         */

        sendPeerCode(
          activeFile,
          newCode
        );

      },
      [
        activeFile,
        encryptionEnabled,
        roomSecret,
        roomId,
        sendEncryptedCode,
        sendOrQueue,
        sendPeerCode
      ]
    );


  /*
   * ========================================
   * SAVE PROJECT
   * ========================================
   */

  const handleSave =
    useCallback(
      async () => {

        if (
          !roomId
        ) {

          return;
        }


        try {

          const projectFiles =
            Object.entries(
              files
            ).map(
              ([name, file]) => ({

                name,

                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  ""
              })
            );


          const response =
            await api.put(
              `/projects/${roomId}`,
              {
                files:
                  projectFiles
              }
            );


          if (
            !response.data?.success
          ) {

            window.alert(
              "Project save failed."
            );

            return;
          }


          const savedRevision =
            response.data?.project
              ?.revision;


          if (
            savedRevision !==
            undefined
          ) {

            setProjectRevision(
              savedRevision
            );
          }


          /*
           * Create version snapshot.
           */

          try {

            await createSnapshot(
              roomId,
              {
                id:
                  user?.id,

                name:
                  user?.name ||
                  "Anonymous"
              }
            );

          } catch (
            snapshotError
          ) {

            console.error(
              "Snapshot creation failed:",
              snapshotError
            );
          }


          await loadVersions();


          /*
           * Clear old recovery snapshot
           * after successful server save.
           */

          clearRecoverySnapshot(
            roomId
          );


          window.alert(
            "Project saved successfully!"
          );

        } catch (error) {

          console.error(
            "Save failed:",
            error
          );


          console.error(
            "Server response:",
            error.response?.data
          );


          window.alert(
            "Failed to save project."
          );
        }

      },
      [
        roomId,
        files,
        user,
        loadVersions
      ]
    );


  /*
   * ========================================
   * RUN CODE
   * ========================================
   */

  const handleRunCode =
    useCallback(
      async () => {

        if (
          !currentFile
        ) {

          return;
        }


        try {

          setRunning(
            true
          );


          setOutput(
            "⏳ Running..."
          );


          const result =
            await runCode(
              currentFile.language,

              currentFile.content,

              input
            );


          setOutput(
            result
          );


          /*
           * Broadcast terminal output.
           */

          if (
            socket.connected
          ) {

            socket.emit(
              "terminal:output",
              {
                roomId,

                output:
                  result
              }
            );
          }

        } catch (error) {

          console.error(
            "Code execution failed:",
            error
          );


          const message =
            error.response?.data
              ?.message ||
            error.message ||
            "Execution Failed";


          setOutput(
            `❌ ${message}`
          );

        } finally {

          setRunning(
            false
          );
        }

      },
      [
        currentFile,
        input,
        roomId
      ]
    );


  /*
   * ========================================
   * ENABLE ROOM SECURE SYNC
   * ========================================
   */

  const handleEnableSecureSync =
    useCallback(
      () => {

        const secret =
          window.prompt(
            "Enter shared room secret (minimum 6 characters):"
          );


        if (!secret) {
          return;
        }


        if (
          secret.length < 6
        ) {

          window.alert(
            "Secret must contain at least 6 characters."
          );

          return;
        }


        setRoomSecret(
          secret
        );


        enableEncryption(
          secret
        );


        window.alert(
          "🔐 Secure Sync enabled."
        );

      },
      [
        enableEncryption
      ]
    );


  /*
   * ========================================
   * DISABLE ROOM SECURE SYNC
   * ========================================
   */

  const handleDisableSecureSync =
    useCallback(
      () => {

        disableEncryption();

        setRoomSecret("");


        window.alert(
          "🔓 Normal Sync enabled."
        );

      },
      [
        disableEncryption
      ]
    );


  /*
   * ========================================
   * ENABLE LOCAL ENCRYPTION
   * ========================================
   */

  const handleEnableEncryption =
    useCallback(
      () => {

        const password =
          window.prompt(
            "Create local encryption password:"
          );


        if (!password) {
          return;
        }


        if (
          password.length < 6
        ) {

          window.alert(
            "Password must be at least 6 characters."
          );

          return;
        }


        setEncryptionPassword(
          password
        );


        setLocalEncryptionEnabled(
          true
        );


        window.alert(
          "🔐 Local encryption enabled."
        );

      },
      []
    );


  /*
   * ========================================
   * ENCRYPTED BACKUP
   * ========================================
   */

  const handleEncryptedBackup =
    useCallback(
      async () => {

        if (
          !localEncryptionEnabled
        ) {

          window.alert(
            "Enable local encryption first."
          );

          return;
        }


        if (
          !encryptionPassword
        ) {

          window.alert(
            "Encryption password is missing."
          );

          return;
        }


        try {

          await saveEncryptedProject(
            roomId,

            files,

            encryptionPassword
          );


          window.alert(
            "🔐 Encrypted local backup saved."
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

      },
      [
        localEncryptionEnabled,
        encryptionPassword,
        roomId,
        files
      ]
    );


  /*
   * ========================================
   * ENCRYPTED RESTORE
   * ========================================
   */

  const handleEncryptedRestore =
    useCallback(
      async () => {

        if (
          !hasEncryptedProject(
            roomId
          )
        ) {

          window.alert(
            "No encrypted backup found."
          );

          return;
        }


        const password =
          window.prompt(
            "Enter encryption password:"
          );


        if (!password) {
          return;
        }


        try {

          const decrypted =
            await loadEncryptedProject(
              roomId,
              password
            );


          if (
            !decrypted?.files
          ) {

            throw new Error(
              "Invalid encrypted project."
            );
          }


          setFiles(
            decrypted.files
          );


          const names =
            Object.keys(
              decrypted.files
            );


          setActiveFile(
            names[0] ||
            ""
          );


          setEncryptionPassword(
            password
          );


          setLocalEncryptionEnabled(
            true
          );


          window.alert(
            "✅ Encrypted project restored."
          );

        } catch (error) {

          console.error(
            "Encrypted restore failed:",
            error
          );


          window.alert(
            "❌ Wrong password or corrupted backup."
          );
        }

      },
      [roomId]
    );


  /*
   * ========================================
   * RESTORE VERSION
   * ========================================
   */

  const handleRestore =
    useCallback(
      async (
        revision
      ) => {

        try {

          const project =
            await restoreSnapshot(
              roomId,
              revision
            );


          if (
            !project?.files ||
            !Array.isArray(
              project.files
            )
          ) {

            throw new Error(
              "Invalid restored project."
            );
          }


          const restoredFiles = {};


          project.files.forEach(
            (file) => {

              if (
                !file?.name
              ) {

                return;
              }


              restoredFiles[
                file.name
              ] = {

                language:
                  file.language ||
                  "plaintext",

                content:
                  file.content ||
                  ""
              };

            }
          );


          setFiles(
            restoredFiles
          );


          const names =
            Object.keys(
              restoredFiles
            );


          setActiveFile(
            names[0] ||
            ""
          );


          if (
            project.revision !==
            undefined
          ) {

            setProjectRevision(
              project.revision
            );
          }


          await loadVersions();


          /*
           * Send restore event to
           * collaborators.
           */

          if (
            socket.connected
          ) {

            socket.emit(
              "project:restore",
              {
                roomId,

                files:
                  restoredFiles,

                revision:
                  project.revision
              }
            );
          }


          /*
           * Remove stale recovery snapshot.
           */

          clearRecoverySnapshot(
            roomId
          );


          window.alert(
            `Version #${revision} restored successfully.`
          );

        } catch (error) {

          console.error(
            "Restore failed:",
            error
          );


          window.alert(
            "Failed to restore version."
          );
        }

      },
      [
        roomId,
        loadVersions
      ]
    );


  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (

    <div className="editor-page">

      {/* ====================================
          HEADER
          ==================================== */}

      <header className="editor-header">

        <Link
          to={`/room/${roomId}`}
          className="editor-back"
        >
          ← {onlineUsers.length} Online
        </Link>


        <div className="editor-actions">

          <ConnectionStatus
            status={
              connectionStatus
            }

            queuedChanges={
              queuedChanges
            }
          />


          <PeerStatus
            peerStatuses={
              peerStatuses
            }
          />


          <EncryptionStatus
            enabled={
              encryptionEnabled
            }
          />


          <SecurityStatus
            encrypted={
              localEncryptionEnabled
            }
          />


          <RecoveryStatus
            status={
              recoveryStatus
            }

            hasUnsavedRecovery={
              hasUnsavedRecovery
            }

            onRecover={
              recoverLocalSnapshot
            }

            onDiscard={
              discardLocalRecovery
            }
          />


          {encryptionEnabled ? (

            <button
              className="save-button"
              onClick={
                handleDisableSecureSync
              }
            >
              🔓 Disable
            </button>

          ) : (

            <button
              className="save-button"
              onClick={
                handleEnableSecureSync
              }
            >
              🔐 Secure
            </button>

          )}


          <button
            className="save-button"
            onClick={
              handleEnableEncryption
            }
          >
            🔐 Local
          </button>


          <button
            className="save-button"
            onClick={
              handleEncryptedBackup
            }

            disabled={
              !localEncryptionEnabled
            }
          >
            Backup
          </button>


          <button
            className="save-button"
            onClick={
              handleEncryptedRestore
            }
          >
            Restore
          </button>


          <button
            className="save-button"
            onClick={
              handleSave
            }
          >
            Save
          </button>


          <button
            className="run-button"
            onClick={
              handleRunCode
            }

            disabled={
              running
            }
          >
            {running
              ? "Running..."
              : "▶ Run"}
          </button>

        </div>

      </header>


      {/* ====================================
          MAIN LAYOUT
          ==================================== */}

      <div className="editor-layout">

        {/* ==================================
            FILE EXPLORER
            ================================== */}

        <FileExplorer
          files={
            fileList
          }

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


        {/* ==================================
            MAIN EDITOR
            ================================== */}

        <section
          className="editor-main"
        >

          <FileTabs
            files={
              fileList
            }

            activeFile={
              activeFile
            }

            onFileSelect={
              setActiveFile
            }
          />


          <div
            className="editor-container"
          >

            {currentFile ? (

              <CodeEditor
                value={
                  currentFile.content
                }

                language={
                  currentFile.language
                }

                onChange={
                  handleCodeChange
                }

                socket={
                  socket
                }

                user={
                  user
                }

                fileName={
                  activeFile
                }
              />

            ) : (

              <div
                className="empty-files"
              >
                No file selected
              </div>

            )}

          </div>


          <OutputConsole
            output={
              output
            }

            input={
              input
            }

            setInput={
              setInput
            }
          />

        </section>


        {/* ==================================
            VERSION HISTORY
            ================================== */}

        <VersionHistory
          versions={
            versions
          }

          onRestore={
            handleRestore
          }
        />


        {/* ==================================
            USERS
            ================================== */}

        <UserList
          users={
            onlineUsers
          }

          currentUser={
            user
          }
        />

      </div>

    </div>
  );
}


export default Editor;