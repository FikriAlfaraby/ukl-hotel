const { request, response } = require("express");
const express = require("express");
const app = express();

const tipeModel = require(`../models/index`).tipe_kamar;
const Op = require(`sequelize`).Op;

const path = require(`path`);
const fs = require(`fs`);

const upload = require(`./upload_foto_tipe`).single(`foto`);

const bodyParser = require("body-parser");
const { where } = require("sequelize");
// const upload2 = require("./upload-data-member");
// const uploada = require("./upload-data-member");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//mendaptkan semua data dalam tabel
exports.getAllType = async (request, response) => {
  let tipe = await tipeModel.findAll();
  return response.json({
    success: true,
    data: tipe,
    message: `All room have been loaded`,
  });
};

//mendaptkan salah satu data dalam tabel (where clause)
exports.findType = async (request, response) => {
  let id_tipe_kamar = request.params.id;

  let tipe = await tipeModel.findOne({
    where: {
      [Op.and]: [{ id: { [Op.substring]: id_tipe_kamar } }],
    },
  });
  return response.json({
    success: true,
    data: tipe,
    message: `Room have been loaded`,
  });
};

//menambah data
exports.addType = (request, response) => {
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
      "/foto_tipe_kamar/" +
      request.file.filename;

    let newTipe = {
      nama_tipe_kamar: request.body.nama_tipe_kamar,
      foto: finalImageURL,
      harga: request.body.harga,
      deskripsi: request.body.deskripsi,
    };

    let isTipe = await tipeModel.findOne({
      where: {
        nama_tipe_kamar: newTipe.nama_tipe_kamar,
      },
    });

    if (isTipe) {
      return response.json({
        success: false,
        data: [],
        message: "Tipe Kamar already exists",
      });
    }

    tipeModel
      .create(newTipe)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New Tipe Kamae has been inserted`,
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
exports.updateType = (request, response) => {
  upload(request, response, async (error) => {
    const id = request.params.id;

    if (error) {
      return response.json({ message: error });
    }

    let newType = {
      nama_tipe_kamar: request.body.nama_tipe_kamar,
      harga: request.body.harga,
      deskripsi: request.body.deskripsi,
    };

    if (request.file) {
      const selectedTipe = await tipeModel.findOne({
        where: { id: id },
      });

      let oldFotoTipe = selectedTipe.foto;

      if (oldFotoTipe == null) {
        oldFotoTipe = "";
      }

      const patchFoto = path.join(__dirname, `../foto_tipe`, oldFotoTipe);

      if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
      }
      const finalImageURL =
        request.protocol +
        "://" +
        request.get("host") +
        "/foto_user/" +
        request.file.filename;
      newType.foto = finalImageURL;
    }

    tipeModel
      .update(newType, { where: { id: id } })
      .then((result) => {
        return response.json({
          success: true,
          data: newType,
          message: `New Type Room has been Updated`,
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
exports.deleteType = (request, response) => {
  let idType = request.params.id;

  tipeModel
    .destroy({ where: { id: idType } })
    .then((result) => {
      return response.json({
        success: true,
        message: `data room type has ben delete`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};
