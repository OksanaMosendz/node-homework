const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  
  return {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };
};

const setJwtCookie = (req, res, user) => {
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); 
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); 
  return payload.csrfToken;
};

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

  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });
  }
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
    const result = await prisma.$transaction(async (tx) => {
      newUser = await tx.user.create({
        data: { name, email, hashedPassword },
        select: { id: true, name: true, email: true },
      });

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks};
    });
  return res.status(StatusCodes.CREATED).json({
      user: result.user,
      csrfToken: setJwtCookie(req,res,result.user),
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `The email was already registered` });
    } else return next(err);
  }
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

     res.status(StatusCodes.OK).json({ email, name, csrfToken: setJwtCookie(req,res,user)});
  } else
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
}

async function show(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID" });
  }

  if (userId !== req.user.id) {
    return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied" });}

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  }

  res.status(StatusCodes.OK).json(user);
}

function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff, show };
