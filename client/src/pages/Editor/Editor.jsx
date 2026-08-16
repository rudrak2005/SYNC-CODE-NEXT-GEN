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
   * FILE CREATE
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

    setFiles((previousFiles) => ({
      ...previousFiles,

      [name]: {
        language,
        content: ""
      }
    }));

    setActiveFile(name);
  };


  /*
   * FILE DELETE
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


    if (activeFile === fileName) {

      const remainingFiles =
        Object.keys(updatedFiles);

      setActiveFile(
        remainingFiles[0] || ""
      );
    }
  };


  /*
   * FILE RENAME
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

    const updatedFiles = {
      ...files
    };

    delete updatedFiles[oldFileName];

    updatedFiles[newName] = {
      ...oldFile,

      language:
        getLanguageFromFileName(
          newName
        )
    };

    setFiles(updatedFiles);


    if (activeFile === oldFileName) {
      setActiveFile(newName);
    }
  };


  /*
   * FILE LIST
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
   * SOCKET CONNECTION
   */
  useEffect(() => {

    if (!user || !roomId) {
      return;
    }


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


    const handleUsers = ({
      users
    }) => {

      setOnlineUsers(users);
    };


    socket.connect();


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


    socket.on(
      "code:update",
      handleCodeUpdate
    );


    socket.on(
      "room:users",
      handleUsers
    );


    return () => {

      socket.off(
        "code:update",
        handleCodeUpdate
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
   * LOCAL CODE CHANGE
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


    socket.emit(
      "code:change",
      {
        roomId,
        fileName: activeFile,
        code: newCode
      }
    );
  };


  /*
   * SAVE
   */
  const handleSave = () => {

    if (!currentFile) {
      return;
    }

    localStorage.setItem(
      `synccode-${roomId}-${activeFile}`,
      currentFile.content
    );

    console.log(
      "Saved:",
      activeFile
    );
  };


  /*
   * RENDER
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
          onFileSelect={setActiveFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
        />


        <section className="editor-main">

          <FileTabs
            files={fileList}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
          />


          <div className="editor-container">

            {currentFile ? (

              <CodeEditor
                value={currentFile.content}
                language={currentFile.language}
                onChange={handleCodeChange}
                socket={socket}
                user={user}
                fileName={activeFile}
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