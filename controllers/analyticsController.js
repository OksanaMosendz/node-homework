const prisma = require("../db/prisma");

async function statistic (req,res){

 const userId = parseInt(req.params.id);
if (isNaN(userId)) {
  return res.status(400).json({ error: "Invalid user ID" });
}

  const user = await prisma.user.findUnique({
    where: { id: userId },
   select:{ id: true}})
 
    if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const taskStats = await prisma.task.groupBy({
  by: ['isCompleted'],
  where: { userId },
  _count: {
    id: true
  }
});

const recentTasks = await prisma.task.findMany({
  where: { userId },
  select: {
    id: true,
    title: true,
    isCompleted: true,
    priority: true,
    createdAt: true,
    userId: true,
    User: {
      select: { name: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});

const oneWeekAgo = new Date();
oneWeekAgo.setDate(-7);
oneWeekAgo.toLocaleDateString('sv-SE');

const weeklyProgress = await prisma.task.groupBy({
  by: ['createdAt'],
  where: {
    userId,
    createdAt: { gte: oneWeekAgo }
  },
  _count: { id: true }
});

return res.status(200).json({ taskStats, recentTasks, weeklyProgress});

}

module.exports={statistic};