const express = require("express");
const router = express.Router();
const { register, logon, logoff, show} = require("../controllers/userController");

router.route("/register").post(register);
router.route("/logon").post(logon);
router.route("/:id").get(show);
router.route("/logoff").post(logoff);


module.exports = router;


