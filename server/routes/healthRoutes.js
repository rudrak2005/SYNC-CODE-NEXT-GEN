const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    service: "SyncCode API",
    version: "V1"
  });
});

module.exports = router;