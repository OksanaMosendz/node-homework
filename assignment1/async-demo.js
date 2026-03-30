const fs = require("fs");
const path = require("path");

const samplePath = path.join(__dirname, "sample-files", "sample.txt");

// Write a sample file for demonstration

const createSampleFile = async () => {
  try {
    await fs.promises.writeFile(samplePath, "Hello, async world!");
  } catch (err) {
    console.log("Create sample error:", err);
  }
};

createSampleFile();

// 1. Callback style
fs.readFile(samplePath, "utf8", (err, data) => {
  if (err) {
    console.log("Callback read error:", err.message);
  } else {
    console.log("Callback read:", data);
  }
});

// Callback hell example (test and leave it in comments):
// fs.readFile( path.resolve('sample-files', 'sample1.txt'),'utf8', (err, data1)=>{
// if(err){
//   console.log('file read error:', err.message)
// }
//   console.log('Callback read:', data1)
// })

// fs.readFile( path.resolve('sample-files', 'sample2.txt'),'utf8', (err, data2)=>{
// if(err){
//   console.log('file read error:', err.message)
// }
//   console.log('Callback read:', data2)
// })

// fs.readFile( path.resolve('sample-files', 'sample3.txt'),'utf8', (err, data3)=>{
// if(err){
//   console.log('file read error:', err.message)
// }
//   console.log('Callback read:', data3)
// })

// 2. Promise style
const readFile1 = async (path) => {
  try {
    const data = await new Promise((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        return err ? reject(err) : resolve(data);
      });
    });
    console.log("Promise read:", data);
  } catch (err) {
    console.log("Promise read error:", err.message);
  }
};

readFile1(samplePath);

// 3. Async/Await style

const readFile2 = async (path) => {
  try {
    const data = await fs.promises.readFile(path, "utf8");
    console.log("Async/Await read:", data);
  } catch (err) {
    console.log("Async/Await read error:", err.message);
  }
};
readFile2(samplePath);
