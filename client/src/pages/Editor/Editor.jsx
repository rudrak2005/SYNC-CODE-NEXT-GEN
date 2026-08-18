import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getLanguageFromFileName
} from "../../utils/fileLanguage";

import {
  Link,
  useParams
} from "react-router-dom";

import CodeEditor
  from "../../components/CodeEditor/CodeEditor";

import FileExplorer
  from "../../components/FileExplorer/FileExplorer";

import FileTabs
  from "../../components/FileTabs/FileTabs";

import UserList
  from "../../components/UserList/UserList";

import socket
  from "../../services/socket";

import { useAuth }
  from "../../context/AuthContext";
  import api
  from "../../services/api";


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


function Editor() {

  const { roomId } = useParams();

  const { user } = useAuth();


  const [files, setFiles] =
    useState(initialFiles);

  const [activeFile, setActiveFile] =
    useState("main.js");

  const [onlineUsers, setOnlineUsers] =
    useState([]);


  const currentFile =
    files[activeFile];


  /*
   * ========================================
   * FILE CREATE
   * ========================================
   */

  const handleCreateFile = (fileName) => {

    const name =
      fileName.trim();

    if (!name) {
      return;
    }


    if (files[name]) {

      window.alert(
        "A file with this name already exists."
      );

      return;
    }


    const language =
      getLanguageFromFileName(name);


    const newFile = {
      name,
      language,
      content: ""
    };


    setFiles((previousFiles) => ({
      ...previousFiles,

      [name]: {
        language,
        content: ""
      }
    }));


    setActiveFile(name);


    /*
     * Send file creation
     * to other users
     */

    socket.emit(
      "file:create",
      {
        roomId,
        file: newFile
      }
    );
  };


  /*
   * ========================================
   * FILE DELETE
   * ========================================
   */

  const handleDeleteFile = (fileName) => {

    const fileNames =
      Object.keys(files);


    if (fileNames.length <= 1) {

      window.alert(
        "At least one file must remain."
      );

      return;
    }


    const updatedFiles = {
      ...files
    };


    delete updatedFiles[fileName];


    setFiles(updatedFiles);


    /*
     * If deleted file was active,
     * select another file.
     */

    if (activeFile === fileName) {

      const remainingFiles =
        Object.keys(updatedFiles);

      setActiveFile(
        remainingFiles[0] || ""
      );
    }


    /*
     * Send delete event
     */

    socket.emit(
      "file:delete",
      {
        roomId,
        fileName
      }
    );
  };


  /*
   * ========================================
   * FILE RENAME
   * ========================================
   */

  const handleRenameFile = (
    oldFileName,
    newFileName
  ) => {

    const newName =
      newFileName.trim();


    if (!newName) {
      return;
    }


    if (oldFileName === newName) {
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


    if (!oldFile) {
      return;
    }


    const newFile = {
      name: newName,

      language:
        getLanguageFromFileName(
          newName
        ),

      content:
        oldFile.content || ""
    };


    const updatedFiles = {
      ...files
    };


    delete updatedFiles[oldFileName];


    updatedFiles[newName] = {
      language: newFile.language,
      content: newFile.content
    };


    setFiles(updatedFiles);


    /*
     * Keep renamed file active
     */

    if (activeFile === oldFileName) {
      setActiveFile(newName);
    }


    /*
     * Send rename event
     */

    socket.emit(
      "file:rename",
      {
        roomId,

        oldFileName,

        newFile
      }
    );
  };


  /*
   * ========================================
   * FILE LIST
   * ========================================
   */

  const fileList = useMemo(() => {

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
   * SOCKET CONNECTION
   * ========================================
   */

  useEffect(() => {

    if (!user || !roomId) {
      return;
    }
const loadProject = async () => {

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
      !Array.isArray(project.files) ||
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

        if (!file?.name) {
          return;
        }


        loadedFiles[file.name] = {

          language:
            file.language ||
            "plaintext",

          content:
            file.content || ""
        };
      }
    );


    if (
      Object.keys(loadedFiles).length > 0
    ) {

      setFiles(loadedFiles);


      /*
       * Select first saved file
       */

      const firstFile =
        Object.keys(
          loadedFiles
        )[0];


      setActiveFile(
        firstFile
      );


      console.log(
        "✅ Project loaded:",
        Object.keys(loadedFiles)
      );
    }

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
};
    /*
     * ----------------------------------------
     * CODE UPDATE
     * ----------------------------------------
     */

    const handleCodeUpdate = ({
      fileName,
      code
    }) => {

      setFiles((previousFiles) => {

        if (!previousFiles[fileName]) {
          return previousFiles;
        }


        return {
          ...previousFiles,

          [fileName]: {
            ...previousFiles[fileName],

            content: code
          }
        };
      });
    };


    /*
     * ----------------------------------------
     * FILE CREATED
     * ----------------------------------------
     */

    const handleFileCreated = ({
      file
    }) => {

      if (!file?.name) {
        return;
      }


      setFiles((previousFiles) => {

        /*
         * Don't create duplicate
         */

        if (previousFiles[file.name]) {
          return previousFiles;
        }


        return {
          ...previousFiles,

          [file.name]: {
            language:
              file.language ||
              "plaintext",

            content:
              file.content || ""
          }
        };
      });
    };


    /*
     * ----------------------------------------
     * FILE DELETED
     * ----------------------------------------
     */

    const handleFileDeleted = ({
      fileName
    }) => {

      if (!fileName) {
        return;
      }


      setFiles((previousFiles) => {

        if (!previousFiles[fileName]) {
          return previousFiles;
        }


        const updatedFiles = {
          ...previousFiles
        };


        delete updatedFiles[fileName];


        return updatedFiles;
      });


      /*
       * If remote user deleted our
       * currently active file
       */

      setActiveFile((currentActiveFile) => {

        if (
          currentActiveFile !== fileName
        ) {

          return currentActiveFile;
        }


        return "main.js";
      });
    };


    /*
     * ----------------------------------------
     * FILE RENAMED
     * ----------------------------------------
     */

    const handleFileRenamed = ({
      oldFileName,
      newFile
    }) => {

      if (
        !oldFileName ||
        !newFile?.name
      ) {
        return;
      }


      setFiles((previousFiles) => {

        if (!previousFiles[oldFileName]) {
          return previousFiles;
        }


        const updatedFiles = {
          ...previousFiles
        };


        const oldFile =
          updatedFiles[oldFileName];


        delete updatedFiles[oldFileName];


        updatedFiles[newFile.name] = {
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
      });


      /*
       * Keep active file name in sync
       */

      setActiveFile((currentActiveFile) => {

        if (
          currentActiveFile ===
          oldFileName
        ) {

          return newFile.name;
        }


        return currentActiveFile;
      });
    };


    /*
     * ----------------------------------------
     * ONLINE USERS
     * ----------------------------------------
     */

    const handleUsers = ({
      users
    }) => {

      setOnlineUsers(users);
    };


    /*
     * ----------------------------------------
     * CONNECT
     * ----------------------------------------
     */
loadProject();
    socket.connect();


    /*
     * Join room
     */

    socket.emit(
      "room:join",
      {
        roomId,

        user: {
          id: user.id,
          name: user.name
        }
      }
    );


    /*
     * ----------------------------------------
     * LISTENERS
     * ----------------------------------------
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


    /*
     * ----------------------------------------
     * CLEANUP
     * ----------------------------------------
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


      socket.emit(
        "room:leave"
      );


      socket.disconnect();
    };

  }, [roomId, user]);


  /*
   * ========================================
   * LOCAL CODE CHANGE
   * ========================================
   */

  const handleCodeChange = (value) => {

    const newCode =
      value || "";


    setFiles((previousFiles) => ({

      ...previousFiles,

      [activeFile]: {

        ...previousFiles[activeFile],

        content: newCode
      }

    }));


    /*
     * Send code to other users
     */

    socket.emit(
      "code:change",
      {
        roomId,

        fileName: activeFile,

        code: newCode
      }
    );
  };

const saveProjectToServer = async () => {

  try {

    const projectFiles =
      Object.entries(files).map(
        ([name, file]) => ({
          name,
          language:
            file.language ||
            "plaintext",
          content:
            file.content || ""
        })
      );


    const response =
      await api.put(
        `/projects/${roomId}`,
        {
          files: projectFiles
        }
      );


    if (response.data.success) {

      console.log(
        "Project saved successfully"
      );
    }

  } catch (error) {

    console.error(
      "Project save failed:",
      error
    );
  }
};


  /*
   * ========================================
   * SAVE
   * ========================================
   */
const handleSave = async () => {

  try {

    if (!roomId) {
      return;
    }


    const projectFiles =
      Object.entries(files).map(
        ([name, file]) => ({
          name,

          language:
            file.language ||
            "plaintext",

          content:
            file.content || ""
        })
      );


    console.log(
      "Saving project:",
      projectFiles
    );


    const response =
      await api.put(
        `/projects/${roomId}`,
        {
          files: projectFiles
        }
      );


    if (response.data?.success) {

      console.log(
        "✅ Project saved to MongoDB"
      );

      window.alert(
        "Project saved successfully!"
      );

    } else {

      console.error(
        "Project save failed:",
        response.data
      );
    }


  } catch (error) {

    console.error(
      "❌ Project save error:",
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
};

  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (

    <div className="editor-page">

      <header className="editor-header">

        <Link
          to={`/room/${roomId}`}
          className="editor-back"
        >
          ← {onlineUsers.length} Online
        </Link>


        <button
          className="save-button"
          onClick={handleSave}
        >
          Save
        </button>

      </header>


      <div className="editor-layout">


        <FileExplorer
          files={fileList}

          activeFile={activeFile}

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


        <section className="editor-main">


          <FileTabs
            files={fileList}

            activeFile={activeFile}

            onFileSelect={
              setActiveFile
            }
          />


          <div className="editor-container">

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

                socket={socket}

                user={user}

                fileName={
                  activeFile
                }
              />

            ) : (

              <div className="empty-files">
                No file selected
              </div>

            )}

          </div>

        </section>


        <UserList
          users={onlineUsers}

          currentUser={user}
        />

      </div>

    </div>
  );
}


export default Editor;