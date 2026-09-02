const express = require("express");
const { runCode } = require("../controllers/executionController");

const router = express.Router();

// POST /api/execute
router.post("/", runCode);

module.exports = router;