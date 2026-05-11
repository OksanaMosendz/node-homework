const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool.js");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }

  const newTask = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id],
  );

  // const {user_id, ...sanitizedTask} = newTask.rows[0];
  res.status(StatusCodes.CREATED).json(newTask.rows[0]);
}

async function deleteTask (req, res){
  const taskToFind = parseInt(req.params?.id);
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  const deletedTask = await pool.query(
    "DELETE FROM tasks WHERE user_id = $1 AND id=$2 RETURNING id, title",
    [global.user_id, taskToFind],
  );
  // const taskIndex = global.tasks.findIndex(
  //   (task) => task.id === taskToFind && task.userId === global.user_id.email,
  // );

  if (deletedTask.rows.length===0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  
  return res.json(deletedTask.rows[0]);
};

async function index(req, res) {
  const userTasks = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id],
  );

  if (userTasks.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }
   

  return res.status(StatusCodes.OK).json(userTasks.rows);
}

async function show(req, res){
  const taskToFind = parseInt(req.params?.id);

  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  const task = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1 AND id=$2",
    [global.user_id, taskToFind],
  );

  if (task.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
   

  return res.status(StatusCodes.OK).json(task.rows[0]);
};

async function update(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: `${error.message}` });
  }

  const taskToFind = parseInt(req.params?.id);

  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  let keys = Object.keys(value);
  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(value), taskToFind, global.user_id],
  );

  // const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);

  if (updatedTask.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }

  // global.tasks[taskIndex]=Object.assign(global.tasks[taskIndex], value);

  return res.status(StatusCodes.OK).json(updatedTask.rows[0]);
}

module.exports = { update, deleteTask, show, index, create };
