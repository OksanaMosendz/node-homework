const express = require("express");
const router = express.Router();
const {userStatistic, allUsersStatistic} = require("../controllers/analyticsController");


router.route("/users/:id").get(userStatistic);
router.route("/users").get(allUsersStatistic);



module.exports = router;


