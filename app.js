const express = require("express");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
app.use(express.json());
const pathFix = path.join(__dirname, "userData.db");
let db = null;
const initializeDB = async () => {
  try {
    db = await open({
      filename: pathFix,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("This server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDB();

app.post("/register", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUser = `
    SELECT*
    FROM
    user
    WHERE 
    username='${username}';`;
  const dBUser = await db.get(selectUser);
  if (dBUser === undefined) {
    //create user
    let CreateUser = `
        INSERT INTO
        user(username,name,password,gender,location)
        VALUES
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //user already exists
      const User = await db.run(CreateUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login user
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUser = `
    SELECT*
    FROM
    user
    WHERE 
    username='${username}';`;
  const dBUser = await db.get(selectUser);
  if (dBUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const Matched = await bcrypt.compare(password, dBUser.password);
    if (Matched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUser = `
    SELECT*
    FROM
    user
    WHERE 
    username='${username}';`;
  const dBUser = await db.get(selectUser);
  if (dBUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const hPassword = await bcrypt.compare(oldPassword, dBUser.password);

    if (hPassword === true) {
      const lenPass = newPassword.length;
      if (lenPass < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hasWord = await bcrypt.hash(newPassword, 10);
        const getWord = `
            Update user
            SET
            password='${hasWord}'
            where 
            username='${username}';`;
        await db.run(getWord);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
