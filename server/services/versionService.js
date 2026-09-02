const Version = require("../models/Version");
const Project = require("../models/Project");

const createVersion = async (
  roomId,
  author
) => {

  const project =
    await Project.findOne({ roomId });

  if (!project) return null;

  return await Version.create({
    roomId,

    revision: project.revision,

    author,

    files: project.files
  });
};

const getVersions = async (roomId) => {

  return await Version.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(50);
};

const restoreVersion = async (
  roomId,
  revision
) => {

  const version =
    await Version.findOne({
      roomId,
      revision
    });

  if (!version) return null;

  const project =
    await Project.findOne({ roomId });

  project.files = version.files;

  project.revision += 1;

  await project.save();

  return project;
};

module.exports = {
  createVersion,
  getVersions,
  restoreVersion
};