const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });

  it("2. an email is specified",()=>{
const { error } = userSchema.validate(
      { name: "Bob", password: "!1Password" },
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });

  
  it("3. doesn't accept invalid email",()=>{
const { error } = userSchema.validate(
      { name: "Bob", email: "bobsamplecom", password: "!1Password" },
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });

  it("4. password is required",()=>{
const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com"},
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });

  it("5. name is required",()=>{
const { error } = userSchema.validate(
      {  email: "bob@sample.com", password: "!1Password" },
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });

    it("6. should accept valid name",()=>{
const { error } = userSchema.validate(
      { name: "Bo", email: "bob@sample.com", password: "!1Password" },
      { abortEarly: false },
    );
       expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });

  
    it("7. error comes back falsy, when validation is performed on a valid user object", ()=>{
const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "!1Password" },
      { abortEarly: false },
    );
       expect(error).toBeFalsy();
  });


  })
