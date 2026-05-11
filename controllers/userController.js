const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

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
  //   const result = await pool.query("SELECT * FROM users WHERE email = $1", [
  //  value.email,
  // ]);

  // if(result.rows.length>0){
  //   return res
  //     .status(StatusCodes.BAD_REQUEST)
  //     .json({ error: `User already exist` });
  // }
    
   let newUser = null;
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
     newUser = await prisma.user.create({
    data: { name:value.name, email:value.email, hashedPassword:value.hashedPassword },
    select: { name: true, email: true, id: true} // specify the column values to return
  });

  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `The email was already registered` });
    }else return next(err);
  }

  global.user_id =newUser.id;
  const { email, name } = newUser;
  return res.status(StatusCodes.CREATED).json({email,name});
}

async function logon(req, res) {
  if (!req.body?.email || !req.body?.password){
 return res.status(StatusCodes.BAD_REQUEST).json({
    message: "Email and password required",
  });
  }
const email=req.body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: {email}});
  // const result = await pool.query("SELECT * FROM users WHERE email = $1", [
  //   req.body.email.trim().toLowerCase(),
  // ]);

if(!user){
  return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });}
  
      
  const isPasswordCorrect = await comparePassword(
    req.body.password,
  user.hashedPassword,
  );

  if (isPasswordCorrect) {
    global.user_id = user.id;
    const { email, name} = user;
    res.status(StatusCodes.OK).json({email,name});
  } else return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });}


function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
