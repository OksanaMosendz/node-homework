const express = require("express");
const router = express.Router();
const {statistic} = require("../controllers/analyticsController");


router.route("/users/:id").get(statistic);


module.exports = router;


