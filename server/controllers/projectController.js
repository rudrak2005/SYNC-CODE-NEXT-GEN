const Project =
  require("../models/Project");


const getProject = async (
  req,
  res
) => {

  try {

    const roomId =
      req.params.roomId.toUpperCase();


    let project =
      await Project.findOne({
        roomId
      });


    /*
     * Create project if
     * it doesn't exist.
     */

    if (!project) {

      project =
        await Project.create({
          roomId,
          files: []
        });
    }


    res.status(200).json({
      success: true,
      project
    });

  } catch (error) {

    console.error(
      "Get project error:",
      error
    );


    res.status(500).json({
      success: false,
      message:
        "Failed to load project"
    });
  }
};


const saveProject = async (
  req,
  res
) => {

  try {

    const roomId =
      req.params.roomId.toUpperCase();


    const {
      files
    } = req.body;


    if (!Array.isArray(files)) {

      return res.status(400).json({
        success: false,
        message:
          "Files must be an array"
      });
    }


    const project =
      await Project.findOneAndUpdate(

        { roomId },

        {
          roomId,
          files
        },

        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );


    res.status(200).json({
      success: true,
      project
    });

  } catch (error) {

    console.error(
      "Save project error:",
      error
    );


    res.status(500).json({
      success: false,
      message:
        "Failed to save project"
    });
  }
};

const updateProjectFile = async (
  roomId,
  fileName,
  updates
) => {

  const Project =
    require("../models/Project");

  const normalizedRoomId =
    roomId.toUpperCase();


  const project =
    await Project.findOne({
      roomId: normalizedRoomId
    });


  if (!project) {
    return null;
  }


  const fileIndex =
    project.files.findIndex(
      (file) =>
        file.name === fileName
    );


  if (fileIndex === -1) {
    return null;
  }


  project.files[fileIndex] = {
    ...project.files[fileIndex].toObject(),

    ...updates
  };


  await project.save();

  return project;
};


module.exports.updateProjectFile =
  updateProjectFile;


module.exports = {
  getProject,
  saveProject
};