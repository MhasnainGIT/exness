const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const { list, readOne, readAll } = require("./notification.controller");

router.use(authenticate);
router.get("/", list);
router.patch("/:id/read", readOne);
router.patch("/read-all", readAll);

module.exports = { notificationRoutes: router };
