const express = require("express");
// var body = require("body-parser");

const app = express();

app.use(express.json());

var bodyParser = require("body-parser");
app.use(bodyParser.json());
// // penggunaan body-parser untuk ekstrak data request dari body
app.use(bodyParser.urlencoded({ extended: true }));

const roomController = require("../controller/kamar_controller");
// const upload = require('../controller/upload-cover');
const auth = require(`../auth/auth`);

app.get("/", auth.authVerify, roomController.getAllRoom);
app.post("/getAvailable", roomController.availableRoom);
app.post("/getAvailableByTipe", roomController.availableRoomByTipe);
app.get("/:id", auth.authVerify, roomController.findRoom);
app.post("/", auth.authVerify, roomController.addRoom);
app.delete("/:id", auth.authVerify, roomController.deleteRoom);
app.put("/:id", auth.authVerify, roomController.updateRoom);

module.exports = app;
