const Project =
  require("../models/Project");


const normalizeRoomId = (
  roomId
) => {

  return roomId
    ?.toUpperCase()
    .trim();
};


const getProject = async (
  roomId
) => {

  const normalizedRoomId =
    normalizeRoomId(roomId);


  if (!normalizedRoomId) {
    return null;
  }


  return await Project.findOne({
    roomId: normalizedRoomId
  });
};


const saveFiles = async (
  roomId,
  files
) => {

  const normalizedRoomId =
    normalizeRoomId(roomId);


  if (
    !normalizedRoomId ||
    !Array.isArray(files)
  ) {
    return null;
  }


  return await Project.findOneAndUpdate(

    {
      roomId:
        normalizedRoomId
    },

    {
      roomId:
        normalizedRoomId,

      files
    },

    {
      new: true,

      upsert: true,

      runValidators: true
    }
  );
};


const saveFile = async (
  roomId,
  file
) => {

  const project =
    await getProject(roomId);
project.revision += 1;
await project.save();

  if (!project) {

    return await saveFiles(
      roomId,
      [file]
    );
  }


  const existingIndex =
    project.files.findIndex(
      (item) =>
        item.name === file.name
    );


  if (existingIndex === -1) {

    project.files.push({
      name: file.name,

      language:
        file.language ||
        "plaintext",

      content:
        file.content || ""
    });

  } else {

    project.files[
      existingIndex
    ] = {
      name: file.name,

      language:
        file.language ||
        "plaintext",

      content:
        file.content || ""
    };
  }


  await project.save();

  return project;
};


const deleteFile = async (
  roomId,
  fileName
) => {

  const project =
    await getProject(roomId);


  if (!project) {
    return null;
  }


  project.files =
    project.files.filter(
      (file) =>
        file.name !== fileName
    );


  await project.save();

  return project;
};


const renameFile = async (
  roomId,
  oldFileName,
  newFile
) => {

  const project =
    await getProject(roomId);


  if (!project) {
    return null;
  }


  const fileIndex =
    project.files.findIndex(
      (file) =>
        file.name === oldFileName
    );


  if (fileIndex === -1) {
    return null;
  }


  project.files[
    fileIndex
  ] = {

    name:
      newFile.name,

    language:
      newFile.language ||
      "plaintext",

    content:
      newFile.content || ""
  };


  await project.save();

  return project;
};


const updateFileContent = async (
  roomId,
  fileName,
  code
) => {

  const project =
    await getProject(roomId);


  if (!project) {
    return null;
  }


  const file =
    project.files.find(
      (item) =>
        item.name === fileName
    );


  if (!file) {
    return null;
  }


  file.content =
    code || "";


  await project.save();

  return project;
};


module.exports = {
  getProject,
  saveFiles,
  saveFile,
  deleteFile,
  renameFile,
  updateFileContent
};