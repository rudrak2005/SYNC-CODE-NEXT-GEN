const express = require("express");

const {
  history,
  snapshot,
  restore
} = require("../controllers/versionController");

const router = express.Router();

router.get("/:roomId", history);

router.post("/:roomId/snapshot", snapshot);

router.post("/:roomId/restore", restore);

module.exports = router;