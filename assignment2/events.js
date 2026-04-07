const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (message) => {
  console.log("Time received:", message);
});

setInterval(() => emitter.emit("time", new Date().toLocaleTimeString()), 5000);

module.exports = { emitter };
