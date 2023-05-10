const { request, response } = require("express");
const express = require("express");
const app = express();
// const sequelize = require("sequelize")

const roomModel = require(`../models/index`).kamar;
const tipeModel = require(`../models/index`).tipe_kamar;
const pemesananModel = require(`../models/index`).pemesanan;
const detailsOfPemesananModel = require(`../models/index`).detail_pemesanan;
const Op = require(`sequelize`).Op;
const moment = require("moment");

const Sequelize = require("sequelize");
const sequelize = new Sequelize("hotel_ukk", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

const bodyParser = require("body-parser");
// const upload2 = require("./upload-data-member");
// const uploada = require("./upload-data-member");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//mendaptkan semua data dalam tabel
exports.getAllRoom = async (request, response) => {
  const result = await sequelize.query(
    "SELECT kamars.id,kamars.nomor_kamar,tipe_kamars.nama_tipe_kamar, tipe_kamars.harga FROM kamars JOIN tipe_kamars ON tipe_kamars.id = kamars.id_tipe_kamar ORDER BY kamars.id ASC"
  );

  return response.json({
    success: true,
    data: result[0],
    message: `Room have been loaded`,
  });
};

//mendaptkan salah satu data dalam tabel (where clause)
exports.findRoom = async (request, response) => {
  let id = request.params.id;

  const result = await sequelize.query(
    `SELECT kamars.id,kamars.nomor_kamar,tipe_kamars.nama_tipe_kamar, tipe_kamars.harga FROM kamars JOIN tipe_kamars ON tipe_kamars.id = kamars.id_tipe_kamar where kamars.id = ${id} ORDER BY kamars.id ASC `
  );
  return response.json({
    success: true,
    data: result[0][0],
    message: `Room have been loaded`,
  });
};

//menambah data
exports.addRoom = async (request, response) => {
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let nomor_kamar = request.body.nomor_kamar;
  let tipeId = await tipeModel.findOne({
    where: {
      [Op.and]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });
  let nomorKamar = await roomModel.findOne({
    where: {
      [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor_kamar } }],
    },
    attributes: ["nomor_kamar"],
  });

  if (tipeId === null) {
    return response.json({
      success: false,
      message: `Tipe kamar yang anda inputkan tidak ada`,
    });
  } else if (nomorKamar != null) {
    return response.json({
      success: false,
      message: `Nomor Kamar sudah ada`,
    });
  } else {
    let newRoom = {
      nomor_kamar: request.body.nomor_kamar,
      id_tipe_kamar: tipeId.id,
    };
    roomModel
      .create(newRoom)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New Room has been inserted`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  }
};

//mengupdate salah satu data
exports.updateRoom = async (request, response) => {
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let tipeId = await tipeModel.findOne({
    where: {
      [Op.and]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });
  console.log(nama_tipe_kamar);

  if (tipeId === null) {
    return response.json({
      success: false,
      message: `Tipe kamar yang anda inputkan tidak ada`,
    });
  } else {
    let newRoom = {
      nomor_kamar: request.body.nomor_kamar,
      id_tipe_kamar: tipeId.id,
    };

    let idRoom = request.params.id;
    roomModel
      .update(newRoom, { where: { id: idRoom } })
      .then((result) => {
        return response.json({
          success: true,
          message: `Data room has been update`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  }
};

//mengahapus salah satu data
exports.deleteRoom = (request, response) => {
  let idRoom = request.params.id;

  roomModel
    .destroy({ where: { id: idRoom } })
    .then((result) => {
      return response.json({
        success: true,
        message: `room data has ben deleted`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.availableRoom = async (req, response) => {
  const check_in = req.body.check_in;
  const check_out = req.body.check_out;

  if (check_in == 0 || check_out == 0) {
    return response.json({
      success: false,
      message: "Masukan tanggal Check In atau CheckOut",
    });
  }

  let tgl1 = new Date(check_in);
  let tgl2 = new Date(check_out);

  if (tgl2 < tgl1) {
    return response.json({
      success: false,
      message: "Tanggal CheckIn atau CheckOut tidak valid",
    });
  }

  // ambil tanggal check-in dari request body
  const availableRooms =
    await sequelize.query(`SELECT kamar.id, kamar.nomor_kamar, tipe.nama_tipe_kamar, tipe.harga, tipe.deskripsi, tipe.foto
FROM kamars AS kamar JOIN tipe_kamars as tipe ON kamar.id_tipe_kamar = tipe.id
WHERE kamar.id NOT IN (
  SELECT id_kamar FROM detail_pemesanans WHERE tgl_akses >= "${check_in}" AND tgl_akses <= "${check_out}"
)`);

  if (availableRooms[0].length == 0) {
    return response.json({
      success: false,
      message: "Tidak Ada Kamar yang tersedia",
    });
  }

  return response.json({
    message: `Kamar Available For ${check_in} - ${check_out}`,
    succes: true,
    data: availableRooms[0],
  });
};
