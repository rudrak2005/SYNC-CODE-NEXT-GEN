import {
  useEffect,
  useMemo,
  useState
} from "react";

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


  const fileList = useMemo(() => {

    return Object.keys(files).map(
      (name) => ({
        name,

        icon:
          name.endsWith(".js")
            ? "JS"
            : name.endsWith(".html")
            ? "HT"
            : "CS"
      })
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


    socket.emit("room:join", {
      roomId,

      user: {
        id: user.id,
        name: user.name
      }
    });


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

    const newCode = value || "";


    setFiles((previousFiles) => ({
      ...previousFiles,

      [activeFile]: {
        ...previousFiles[activeFile],
        content: newCode
      }

    }));


    socket.emit("code:change", {

      roomId,

      fileName: activeFile,

      code: newCode

    });

  };


  /*
   * SAVE
   */
  const handleSave = () => {

    localStorage.setItem(
      `synccode-${roomId}-${activeFile}`,
      currentFile.content
    );

    console.log(
      "Saved:",
      activeFile
    );

  };


  return (

    <div className="editor-page">

      <header className="editor-header">

        <Link
          to={`/room/${roomId}`}
          className="editor-back"
        >
          ← Room
        </Link>


        <div className="editor-room-info">

          <strong>
            SyncCode
          </strong>

          <span>
            {roomId}
          </span>

        </div>


        <div className="online-users">

          ● {onlineUsers.length} Online

        </div>


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
        />


        <section className="editor-main">


          <FileTabs
            files={fileList}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
          />


          <div className="editor-container">

            <CodeEditor
              value={currentFile.content}
              language={currentFile.language}
              onChange={handleCodeChange}
            />

          </div>


        </section>


        <UserList
          users={onlineUsers}
        />


      </div>

    </div>

  );

}


export default Editor;