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

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }

  let newUser = null;
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;
  const { name, email, hashedPassword } = value;

  try {
    newUser = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { id: true, name: true, email: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `The email was already registered` });
    } else return next(err);
  }

  global.user_id = newUser.id;
  return res.status(StatusCodes.CREATED).json({name: newUser.name, email: newUser.email});
}

async function logon(req, res) {
  if (!req.body?.email || !req.body?.password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Email and password required",
    });
  }
  const validEmail = req.body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: validEmail },
    select: { id: true, name: true, email: true, hashedPassword: true },
  });

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  const isPasswordCorrect = await comparePassword(
    req.body.password,
    user.hashedPassword,
  );
  const { email, name } = user;
  if (isPasswordCorrect) {
    global.user_id = user.id;
    res.status(StatusCodes.OK).json({ email, name });
  } else
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
}

function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
