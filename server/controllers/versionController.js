const {
  createVersion,
  getVersions,
  restoreVersion
} = require("../services/versionService");

exports.history = async (req, res) => {

  const versions =
    await getVersions(req.params.roomId);

  res.json(versions);
};

exports.snapshot = async (req, res) => {

  const version =
    await createVersion(
      req.params.roomId,
      req.body.author
    );

  res.json(version);
};

exports.restore = async (req, res) => {

  const project =
    await restoreVersion(
      req.params.roomId,
      req.body.revision
    );

  res.json(project);
};