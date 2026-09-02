const {
  getProjectByRoomId
} = require("./projectService");

/*
 * Compare client revision with server revision.
 */

const validateRevision = async (
  roomId,
  clientRevision
) => {

  const project =
    await getProjectByRoomId(roomId);

  if (!project) {
    return {
      valid: true,
      serverRevision: 0,
      project: null
    };
  }

  return {
    valid:
      project.revision === clientRevision,

    serverRevision:
      project.revision,

    project
  };
};

/*
 * Prepare conflict response.
 */

const buildConflictResponse = (
  project
) => {

  return {
    roomId: project.roomId,

    revision:
      project.revision,

    files: project.files
  };
};

module.exports = {
  validateRevision,
  buildConflictResponse
};