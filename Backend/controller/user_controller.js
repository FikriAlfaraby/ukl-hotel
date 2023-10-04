const { request, response } = require("express");
const express = require("express");
const app = express();

const md5 = require("md5");

const userModel = require(`../models/index`).user;
const Op = require(`sequelize`).Op;
const { serialize } = require("cookie");

const path = require(`path`);
const fs = require(`fs`);

const upload = require(`./upload_foto_user`).single(`foto`);

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const jsonwebtoken = require("jsonwebtoken");
const SECRET_KEY = "secretcode";

exports.login = async (request, response) => {
  try {
    const params = {
      email: request.body.email,
      password: md5(request.body.password),
    };

    const findUser = await userModel.findOne({ where: params });
    if (findUser == null) {
      return response.status(404).json({
        success: false,
        message: "email or password doesn't match",
      });
    }
    //generate jwt token
    let tokenPayLoad = {
      id_user: findUser.id,
      role: findUser.role,
      nama_user: findUser.nama_user,
    };
    tokenPayLoad = JSON.stringify(tokenPayLoad);

    let token = await jsonwebtoken.sign(tokenPayLoad, SECRET_KEY);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 1, // 7 hari
    });

    response.setHeader("Set-Cookie", cookie);

    return response.status(200).json({
      message: "Success login",
      data: {
        token: token,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal error",
      err: error,
    });
  }
};

exports.loginCustomer = async (request, response) => {
  try {
    const params = {
      email: request.body.email,
      password: md5(request.body.password),
      role: "customer",
    };

    const findUser = await userModel.findOne({ where: params });
    if (findUser == null) {
      return response.status(404).json({
        success: false,
        message: "email or password doesn't match",
      });
    }
    //generate jwt token
    let tokenPayLoad = {
      id_user: findUser.id,
      role: findUser.role,
      nama_user: findUser.nama_user,
    };
    tokenPayLoad = JSON.stringify(tokenPayLoad);

    let token = await jsonwebtoken.sign(tokenPayLoad, SECRET_KEY);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 1, // 7 hari
    });

    response.setHeader("Set-Cookie", cookie);

    return response.status(200).json({
      message: "Success login",
      data: {
        token: token,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal error",
      err: error,
    });
  }
};

exports.logout = async (request, response) => {
  try {
    const cookie = serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: -1, // mengatur masa berlaku cookie menjadi 0 akan menghapus cookie
    });
    response.setHeader("Set-Cookie", cookie);

    return response.status(200).json({
      message: "Success logout",
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal error",
      err: error,
    });
  }
};

exports.getUserLogin = async (request, response) => {
  const data = request.userData;

  if (data == null) {
    return response.json({
      success: false,
      message: "Invalid Token",
      data: {},
    });
  }
  try {
    return response.json({
      success: true,
      message: "Succes get Data User Login",
      data: data,
    }); // decoded akan berisi informasi yang ada pada payload token
  } catch (error) {
    return response.json({
      success: false,
      message: "Invalid Token",
      data: {},
    });
  }
};

//mendaptkan semua data dalam tabel
exports.getAllUser = async (request, response) => {
  let users = await userModel.findAll();

  return response.json({
    success: true,
    data: users,
    message: `All User have been loaded`,
  });
};

//mendaptkan salah satu data dalam tabel (where clause)
exports.findUser = async (request, response) => {
  const id = request.params.id;

  const user = await userModel.findOne({
    where: { id: id },
  });
  return response.json({
    success: true,
    data: user,
    message: `User have been loaded`,
  });
};

//menambah data
exports.addUser = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.json({ message: error });
    }

    if (!request.file) {
      return response.json({ message: `Nothing to upload` });
    }
    const finalImageURL =
      request.protocol +
      "://" +
      request.get("host") +
      "/foto_user/" +
      request.file.filename;

    let newUser = {
      nama_user: request.body.nama_user,
      foto: finalImageURL,
      email: request.body.email,
      password: md5(request.body.password),
      role: request.body.role,
    };

    let isUser = await userModel.findOne({
      where: {
        [Op.or]: [{ nama_user: newUser.nama_user }, { email: newUser.email }],
      },
    });

    if (isUser) {
      return response.json({
        success: false,
        data: [],
        message: "user already exists",
      });
    }

    userModel
      .create(newUser)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New User has been inserted`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  });
};

//mengupdate salah satu data
exports.updateUser = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.json({ message: error });
    }

    let idUser = request.params.id;
    let dataUser = {
      nama_user: request.body.nama_user,
      email: request.body.email,
      password: md5(request.body.password),
      role: request.body.role,
    };

    let isUser = await userModel.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nama_user: dataUser.nama_user },
              { email: dataUser.email },
            ],
          },
          {
            id: {
              [Op.not]: idUser,
            },
          },
        ],
      },
    });

    if (isUser) {
      return response.json({
        success: false,
        data: [],
        message: "user already exists",
      });
    }

    if (request.file) {
      const selectedUser = await userModel.findOne({
        where: { id: idUser },
      });

      let oldFotoUser = selectedUser.foto;

      if (oldFotoUser == null) {
        oldFotoUser = "";
      }

      const patchFoto = path.join(__dirname, `../foto_user`, oldFotoUser);

      if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
      }
      const finalImageURL =
        request.protocol +
        "://" +
        request.get("host") +
        "/foto_user/" +
        request.file.filename;
      dataUser.foto = finalImageURL;
    }

    userModel
      .update(dataUser, { where: { id: idUser } })
      .then((result) => {
        return response.json({
          success: true,
          message: `Data user has been update`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  });
};

//mengahapus salah satu data
exports.deleteUser = async (request, response) => {
  let idUser = request.params.id;

  const user = await userModel.findOne({ wher: { id: idUser } });

  const oldFotoUser = user.foto;

  const patchFoto = path.join(__dirname, `../foto_user`, oldFotoUser);

  if (fs.existsSync(patchFoto)) {
    fs.unlink(patchFoto, (error) => console.log(error));
  }

  userModel
    .destroy({ where: { id: idUser } })

    .then((result) => {
      return response.json({
        success: true,
        message: `data user has ben delete where id_user :` + idUser,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};
