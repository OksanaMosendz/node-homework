const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[1].model);
console.log("Total Memory:", os.totalmem());

// Path module
const joinedPath = path.join(__dirname, "sample-files/folder", "file.txt");
console.log("Joined path:", joinedPath);

// fs.promises API

const creatAndReadFile = async () => {
  try {
    const demoPath = path.join(sampleFilesDir, "demo.txt");
    await fs.promises.writeFile(demoPath, "Hello from fs.promises!");
    const data = await fs.promises.readFile(demoPath, "utf8");
    console.log("fs.promises read:", data);
  } catch (err) {
    console.log("fs.promises error:", err);
  }
};

creatAndReadFile();

// Streams for large files- log first 40 chars of each chunk

const largeFilePath = path.join(sampleFilesDir, "largefile.txt");

const writeFile = function () {
  const writeStream = fs.createWriteStream(largeFilePath);
  for (let i = 1; i < 101; i++) {
    writeStream.write(` This is ${i} line of this large file\n`);
  }
  writeStream.end();

  writeStream.on("error", (err) => {
    console.error("Error writing file:", err);
  });
};

const readFile = function () {
  const readStream = fs.createReadStream(largeFilePath, {
    encoding: "utf8",
    highWaterMark: 1024,
  });

  readStream.on("data", (chunk) => {
    console.log("Read chunk:", chunk.slice(0, 10));
  });

  readStream.on("end", () => {
    console.log("Finished reading large file with streams.");
  });

  readStream.on("error", (err) => {
    console.error("Error reading file:", err);
  });
};

writeFile();
readFile();
