const express = require("express");
const router = express.Router();
const {searchTasks, getUserAnalytics, getUsersWithStats} = require("../controllers/analyticsController");


router.route("/users/:id").get(getUserAnalytics);
router.route("/users").get(getUsersWithStats);
router.route("/tasks/search").get(searchTasks)


module.exports = router;


