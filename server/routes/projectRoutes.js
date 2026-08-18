const express =
  require("express");

const {
  getProject,
  saveProject
} =
  require("../controllers/projectController");


const router =
  express.Router();


router.get(
  "/:roomId",
  getProject
);


router.put(
  "/:roomId",
  saveProject
);


module.exports =
  router;