const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");

const  {
  ValidationError,
  NotFoundError,
  UnauthorizedError} =require('../errors.js');



router.get("/dogs", (req, res) => {
	res.json(dogs);
});


router.post("/adopt", (req, res) => {
    const { name, email, dogName } = req.body;
    if (!name || !email || !dogName) {
    throw new ValidationError('Missing required fields');
    }
    const dog=dogs.find((dog)=>dog.name.toLowerCase()===dogName.toLowerCase());
    console.log(dog)
    if(!dog||dog.status!=="available"){
        throw new NotFoundError("not found or not available");
    }

    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
    });
});

router.get("/error", (req, res) => {
	return   res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
});

module.exports = router;
