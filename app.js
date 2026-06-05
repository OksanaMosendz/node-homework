const express = require("express");
const errorHandler = require("./middleware/error-handler");
const notFoundErrorHandler=require('./middleware/not-found.js');
const userRoutes = require("./routes/userRoutes.js");
const taskRoutes= require("./routes/taskRoutes.js");
const analyticsRoutes= require("./routes/analyticsRoutes.js");
const prisma = require("./db/prisma");
const app = express();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

app.use(express.json({ limit: "1kb" }));
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(xss());


app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

app.use(helmet());


app.use((req,res,next)=>{
   console.log(req.method, req.path, req.query)
   next()
})

app.use("/api/users", userRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/analytics", analyticsRoutes)

app.use(notFoundErrorHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
    // If you have DB connections, close them here
        await prisma.$disconnect();
    console.log("Prisma disconnected")
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));  // ctrl+c
process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown(1);
});    

module.exports = { app, server} ;