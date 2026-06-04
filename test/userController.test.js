require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");
const EventEmitter = require("node:events");

// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;

describe("testing logon, register, and logoff", () => {

  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    saveData = saveRes._getJSONData();
    expect(saveRes.statusCode).toBe(201); // success!
  });

   it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });

   it("35. A string in the cookie array starts with `jwt=`", async () => {
   const setCookieArray = saveRes.get("Set-Cookie")
   expect(setCookieArray[0].startsWith(`jwt=`)).toBe(true);
   });

    it("36. That string contains `HttpOnly;`", async () => {
   const setCookieArray = saveRes.get("Set-Cookie")
   expect(setCookieArray[0]).toContain( "HttpOnly;");
   });

    it("37.  The returned data from the register has the expected name.", async () => {
    expect(saveData.user.name).toBe("Bob");
  });

it("38.  The returned data contains a csrfToken.", async () => {
      expect(saveData.csrfToken).toBeDefined();});


  it("39. You can now logoff", async () => {
  const req = httpMocks.createRequest({
   method: "POST",
  });
  saveRes = MockResponseWithCookies();
  await waitForRouteHandlerCompletion(logoff, req, saveRes);
  expect(saveRes.statusCode).toBe(200);
});

  it("40. The logoff clears the cookie.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  });

     it("41. A logon attempt with a bad password returns a 401.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Password" },
    });
    saveRes = MockResponseWithCookies();
  try{  await waitForRouteHandlerCompletion(logon, req, saveRes);}
  catch (e){
    expect(saveRes.statusCode).toBe(401); }
  });


  it("42. You can't register with an email address that is already registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
   
    try{
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);}
    catch(e) {
   expect(e.name).toBe("BadRequest");
    }
 
 
  });

   









  
   
})


