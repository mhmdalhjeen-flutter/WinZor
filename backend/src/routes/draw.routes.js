const express = require("express");
const router = express.Router();
const drawController = require("../controllers/draw.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/open", drawController.getOpenDraws);
router.post("/join", drawController.joinDraw);
router.post("/vote", drawController.voteLocation); // مسار التصويت الجديد
router.get("/my-draws", drawController.getMyDraws);

module.exports = router;
