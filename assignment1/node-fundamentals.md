# Node.js Fundamentals

## What is Node.js?
Node is a version of JS runtime environment for executing js code outside the browser. Node is often used for building APIs.

## How does Node.js differ from running JavaScript in the browser?
JS can't  access the local file system or open the server side socket , when running in the browser. Node can't access DOM, window and document.  Also Node.js and browser based  Js have some differences in syntax.

## What is the V8 engine, and how does Node use it?
The V8 engine is Google's JS engine that converts JS code into fast machine code  for execution in Node.js.

## What are some key use cases for Node.js?
-building web servers and APIs
-command line tools
-real-time applications
-file system operations

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
CJS uses require() and module.exports
ESM uses import and export

**CommonJS (default in Node.js):**

```main.js
function showMessage(){
console.log('Hello Node')
}
module.exports={showMessage}

``for import``

const {showMessage} = require('./main.js');
```

**ES Modules (supported in modern Node.js):**
```main.js

export function showMessage(){
console.log('Hello Node')
}

``for import``
import {showMessage} from './main.js';
``` 