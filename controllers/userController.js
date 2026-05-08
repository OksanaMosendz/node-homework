const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const pool = require('../db/pg-pool');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  if (!req.body) req.body = {};
  
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  
  if (error){
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
   value.email,
  ]);

  if(result.rows.length>0){
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `User already exist` });
  }
    
   let newUser = 0;
  value.hashed_password = await hashPassword(value.password);

  try {
    newUser = await pool.query(
      `INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password],
    );
  } catch (e) {
    if (e.code === "23505") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `${e.message}` });
    }
    return next(e);
  }

  global.user_id =newUser.rows[0].id;
  const { email, name } = newUser.rows[0];
  return res.status(StatusCodes.CREATED).json({email,name});
}

async function logon(req, res) {
  if (!req.body?.email || !req.body?.password){
 return res.status(StatusCodes.BAD_REQUEST).json({
    message: "Email and password required",
  });
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    req.body.email.trim().toLowerCase(),
  ]);

if(result.rows.length===0){
  return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });}
  
      
  const isPasswordCorrect = await comparePassword(
    req.body.password,
    result.rows[0].hashed_password,
  );

  if (isPasswordCorrect) {
    global.user_id = result.rows[0].id;
    const { email, name} = result.rows[0];
    res.status(StatusCodes.OK).json({email,name});
  } else return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });}


function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
