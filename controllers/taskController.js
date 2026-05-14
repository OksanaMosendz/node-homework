const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }
const{title, isCompleted}=value;
      const newTask = await prisma.task.create({
      data: { title, isCompleted, userId: global.user_id },
      select: { title: true, isCompleted: true , id:true}
    });

  res.status(StatusCodes.CREATED).json(newTask);
}

async function deleteTask (req, res, next){
  const idToFind = parseInt(req.params?.id);
  if (!idToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

let deletedTask=null;
try {
   deletedTask = await prisma.task.delete({
      where: {
      id: idToFind,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true, }
  });
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err);
  }
}
  return res.json(deletedTask);
};

async function index(req, res) {

  const userTasks = await prisma.task.findMany({
  where: {
    userId: global.user_id, 
  },
  select: { title: true, isCompleted: true, id: true, }
});

  if (userTasks.length===0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }
   

  return res.status(StatusCodes.OK).json(userTasks);
}

async function show(req, res, next){
  const idToFind = parseInt(req.params?.id);

  if (!idToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
let task=null;

try{
   task = await prisma.task.findUnique({ where: {id: idToFind, userId: global.user_id, }, select: {
    id: true, title: true, isCompleted: true,
   }});
  } catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err);
  }
}

  return res.status(StatusCodes.OK).json(task);
};

async function update(req, res, next) {
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }

  const idToFind = parseInt(req.params?.id);

  if (!idToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

let updatedTask=null;
try {
   updatedTask = await prisma.task.update({
    data: value,
    where: {
      id: idToFind,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true }
  });
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err);
  }
}

  return res.status(StatusCodes.OK).json(updatedTask);
}

module.exports = { update, deleteTask, show, index, create };
