const express = require("express");
var body = require("body-parser");

const app = express();

app.use(express.json());

const userController = require("../controller/user_controller");

const auth = require(`../auth/auth`);

app.post("/login", userController.login);
app.get("/getAll", auth.authVerify, userController.getAllUser);
app.get("/", auth.authVerify, userController.getUserLogin);
app.get("/:id", auth.authVerify, userController.findUser);
app.post("/register", userController.addUser);

app.delete("/:id", auth.authVerify, userController.deleteUser);
app.post("/logout", userController.logout);
app.put("/:id", auth.authVerify, userController.updateUser);

module.exports = app;
