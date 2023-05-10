const shortid = require("shortid");
const pemesananModel = require(`../models/index`).pemesanan;
const detailsOfPemesananModel = require(`../models/index`).detail_pemesanan;
const userModel = require(`../models/index`).user;

const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Jakarta");

const Op = require(`sequelize`).Op;
// const date = require(`date-and-time`);
const Sequelize = require("sequelize");
const sequelize = new Sequelize("hotel_ukk", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

//tambah data
exports.addPemesanan = async (request, response) => {
  const {
    nama_user,
    nomor_kamar,
    jumlah_kamar,
    nama_pemesanan,
    check_in,
    check_out,
    nama_tamu,
  } = request.body;

  let userId = await userModel.findOne({
    where: {
      [Op.and]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  if (userId === null) {
    return response.json({
      success: false,
      message: `User yang anda inputkan tidak ada`,
    });
  }

  let nomor_kamar_arr = nomor_kamar.split("-");

  let kamar_arr = [];

  console.log(nomor_kamar_arr);

  if (nomor_kamar_arr.length != jumlah_kamar) {
    return response.json({
      success: false,
      message: `Jumlah kamar harus sesuai dengan nomor kamar yang diinputkan`,
    });
  }

  for (let i = 0; i < nomor_kamar_arr.length; i++) {
    const kamar = await sequelize.query(
      `SELECT kamars.id,kamars.nomor_kamar,tipe_kamars.nama_tipe_kamar, tipe_kamars.harga FROM kamars JOIN tipe_kamars ON tipe_kamars.id = kamars.id_tipe_kamar where kamars.nomor_kamar = ${nomor_kamar_arr[i]} ORDER BY kamars.id ASC `
    );

    if (kamar[0][0] === null || kamar[0][0] === undefined) {
      return response.json({
        success: false,
        message: `nomor kamar ${nomor_kamar_arr[i]} yang anda inputkan tidak ada`,
      });
    }
    console.log(kamar[(0)[0]]);

    let roomCheck = await sequelize.query(
      `SELECT * FROM detail_pemesanans WHERE id_kamar = ${kamar[0][0].id} AND tgl_akses >= "${check_in}" AND tgl_akses <= "${check_out}" ;`
    );

    if (roomCheck[0].length > 0) {
      return response.json({
        success: false,
        message: `nomor kamar ${nomor_kamar_arr[i]} sudah dibooking`,
      });
    }

    kamar_arr.push(kamar[0][0]);
  }

  let newData = {
    nomor_pemesanan: request.body.nomor_pemesanan,
    nama_pemesanan: nama_pemesanan,
    email_pemesanan: userId.email,
    tgl_pemesanan: moment().format("YYYY-MM-DD HH:mm:ss"),
    tgl_check_in: check_in,
    tgl_check_out: check_out,
    nama_tamu: nama_tamu,
    jumlah_kamar: jumlah_kamar,
    status_pemesanan: "baru",
    id_user: userId.id,
  };

  pemesananModel
    .create(newData)
    .then((result) => {
      let pemesananID = result.id;
      let tgl1 = new Date(check_in);
      let tgl2 = new Date(check_out);

      if (tgl2 <= tgl1) {
        return response.json({
          success: false,
          message: "Tanggal check-out harus lebih besar dari Tanggal check-in",
        });
      }

      let checkIn = moment(tgl1).format("YYYY-MM-DD");
      let checkOut = moment(tgl2).format("YYYY-MM-DD");

      // check if the dates are valid
      if (
        !moment(checkIn, "YYYY-MM-DD").isValid() ||
        !moment(checkOut, "YYYY-MM-DD").isValid()
      ) {
        return response.status(400).send({ message: "Invalid date format" });
      }

      let numOfRooms = jumlah_kamar; // ambil nilai jumlahKamar
      let numOfDays = moment(checkOut).diff(moment(checkIn), "days"); // hitung selisih hari

      let newDetails = []; // buat array kosong untuk menampung detail pemesanan baru
      for (let i = 0; i < numOfRooms; i++) {
        // looping sebanyak jumlah kamar
        let nomor_kamar = kamar_arr[i].id;
        let harga = kamar_arr[i].harga;

        for (let j = 0; j < numOfDays; j++) {
          // looping sebanyak selisih hari
          let date = moment(checkIn).add(j, "days").format("YYYY-MM-DD"); // hitung tanggal akses
          let newDetail = {
            id_pemesanan: pemesananID,
            id_kamar: nomor_kamar, // tambahkan nomor kamar
            tgl_akses: date,
            harga: harga,
          };
          newDetails.push(newDetail); // tambahkan detail baru ke array
        }
      }

      detailsOfPemesananModel
        .bulkCreate(newDetails) // simpan semua detail baru ke database
        .then(() => {
          return response.json({
            success: true,
            message: `New transactions have been inserted`,
          });
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

//update data
exports.updatePemesanan = async (request, response) => {
  const id_pemesanan = request.params.id;
  const {
    nama_user,
    nomor_kamar,
    jumlah_kamar,
    nama_pemesanan,
    check_in,
    check_out,
    nama_tamu,
    status,
  } = request.body;

  let userId = await userModel.findOne({
    where: {
      [Op.and]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  if (userId === null) {
    return response.json({
      success: false,
      message: `User yang anda inputkan tidak ada`,
    });
  }

  let nomor_kamar_arr = nomor_kamar.split("-");

  let kamar_arr = [];

  if (nomor_kamar_arr.length != jumlah_kamar) {
    return response.json({
      success: false,
      message: `Jumlah kamar harus sesuai dengan nomor kamar yang diinputkan`,
    });
  }

  for (let i = 0; i < nomor_kamar_arr.length; i++) {
    const kamar = await sequelize.query(
      `SELECT kamars.id,kamars.nomor_kamar,tipe_kamars.nama_tipe_kamar, tipe_kamars.harga FROM kamars JOIN tipe_kamars ON tipe_kamars.id = kamars.id_tipe_kamar where kamars.nomor_kamar = ${nomor_kamar_arr[i]} ORDER BY kamars.id ASC `
    );

    if (kamar[0][0] === null) {
      return response.json({
        success: false,
        message: `nomor kamar ${nomor_kamar_arr[i]} yang anda inputkan tidak ada`,
      });
    }

    let roomCheck = await sequelize.query(
      `SELECT * FROM detail_pemesanans WHERE id_kamar = ${kamar[0][0].id} AND tgl_akses >= "${check_in}" AND tgl_akses <= "${check_out}" ;`
    );

    if (roomCheck[0].length > 0) {
      return response.json({
        success: false,
        message: `nomor kamar ${nomor_kamar_arr[i]} sudah dibooking`,
      });
    }

    kamar_arr.push(kamar[0][0]);
  }

  let newData = {
    nama_pemesanan: nama_pemesanan,
    email_pemesanan: userId.email,
    tgl_check_in: check_in,
    tgl_check_out: check_out,
    nama_tamu: nama_tamu,
    jumlah_kamar: jumlah_kamar,
    status_pemesanan: status,
    id_user: userId.id,
  };

  pemesananModel
    .update(newData, { where: { id: id_pemesanan } })
    .then(async (result) => {
      let tgl1 = new Date(check_in);
      let tgl2 = new Date(check_out);

      if (tgl2 <= tgl1) {
        return response.json({
          success: false,
          message: "Tanggal check-out harus lebih besar dari tanggal check-in",
        });
      }

      let selisih = tgl2.getTime() - tgl1.getTime();
      // menghapus detail pemesanan lama dari database
      await detailsOfPemesananModel.destroy({
        where: { id_pemesanan: id_pemesanan },
      });

      let numOfRooms = jumlah_kamar;
      let numOfDays = moment(check_out).diff(moment(check_in), "days");

      let newDetails = [];
      for (let i = 0; i < numOfRooms; i++) {
        let nomor_kamar = kamar_arr[i].id;
        let harga = kamar_arr[i].harga;

        for (let j = 0; j < numOfDays; j++) {
          let date = moment(check_in).add(j, "days").format("YYYY-MM-DD");
          let newDetail = {
            id_pemesanan: id_pemesanan,
            id_kamar: nomor_kamar,
            tgl_akses: date,
            harga: harga,
          };
          newDetails.push(newDetail);
        }
      }

      // menyimpan detail pemesanan baru ke database
      await detailsOfPemesananModel.bulkCreate(newDetails);

      return response.json({
        success: true,
        message: `Pemesanan dengan id ${id_pemesanan} berhasil diupdate`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

//delete data
exports.deletePemesanan = async (request, response) => {
  let pemesananID = request.params.id;

  detailsOfPemesananModel
    .destroy({
      where: { id_pemesanan: pemesananID },
    })
    .then((result) => {
      pemesananModel
        .destroy({ where: { id: pemesananID } })
        .then((result) => {
          return response.json({
            success: true,
            message: `Transaction has been deleted`,
          });
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

//mendapatkan semua data
exports.getAllPemesanan = async (request, response) => {
  try {
    const result = await sequelize.query(
      `SELECT p.id AS pemesanan_id, p.tgl_check_in, p.tgl_check_out, p.nomor_pemesanan, dp.harga, p.nama_pemesanan, dp.id_kamar, k.nomor_kamar, tk.nama_tipe_kamar, u.nama_user FROM pemesanans AS p JOIN detail_pemesanans AS dp ON dp.id_pemesanan = p.id JOIN kamars AS k ON k.id = dp.id_kamar JOIN tipe_kamars AS tk ON tk.id = k.id_tipe_kamar JOIN users AS u ON u.id = p.id_user GROUP BY dp.id;`
    );
    const total = await sequelize.query(
      `SELECT SUM(dp.harga) AS total_harga FROM detail_pemesanans AS dp
  INNER JOIN pemesanans AS p ON dp.id_pemesanan = p.id`
    );

    response.json({
      success: true,
      data: result[0],
      meta: total[0],
      message: `All Transactions have been loaded`,
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: `Failed to load Transactions: ${error.message}`,
    });
  }
};
//mendapatkan salah satu data
exports.findByIdUser = async (request, response) => {
  try {
    let id_user = request.query.id_user;

    const result = await sequelize.query(
      `SELECT p.id AS pemesanan_id, p.nomor_pemesanan, dp.harga, p.nama_pemesanan, dp.id_kamar, k.nomor_kamar, tk.nama_tipe_kamar, u.nama_user, dp.harga AS total_harga FROM pemesanans AS p JOIN detail_pemesanans AS dp ON dp.id_pemesanan = p.id JOIN kamars AS k ON k.id = dp.id_kamar JOIN tipe_kamars AS tk ON tk.id = k.id_tipe_kamar JOIN users AS u ON u.id = p.id_user WHERE p.id_user = ${id_user} GROUP BY dp.id;`
    );

    const total =
      await sequelize.query(`SELECT SUM(dp.harga) AS total_harga FROM detail_pemesanans AS dp
    INNER JOIN pemesanans AS p ON dp.id_pemesanan = p.id INNER JOIN users AS u ON u.id = p.id_user WHERE p.id_user = ${id_user}
    `);

    return response.json({
      success: true,
      data: result[0],
      meta: total[0],
      message: `Transaction have been loaded`,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

exports.findById = async (request, response) => {
  try {
    let id = request.params.id;

    const result = await sequelize.query(
      `SELECT p.id AS pemesanan_id, p.nomor_pemesanan, dp.harga, p.nama_pemesanan, dp.id_kamar, k.nomor_kamar, tk.nama_tipe_kamar, u.nama_user, dp.harga AS total_harga FROM pemesanans AS p JOIN detail_pemesanans AS dp ON dp.id_pemesanan = p.id JOIN kamars AS k ON k.id = dp.id_kamar JOIN tipe_kamars AS tk ON tk.id = k.id_tipe_kamar JOIN users AS u ON u.id = p.id_user WHERE dp.id_pemesanan = ${id} GROUP BY dp.id;`
    );

    const total =
      await sequelize.query(`SELECT SUM(dp.harga) AS total_harga FROM detail_pemesanans AS dp
    INNER JOIN pemesanans AS p ON dp.id_pemesanan = p.id INNER JOIN users AS u ON u.id = p.id_user WHERE dp.id_pemesanan = ${id}
    `);

    return response.json({
      success: true,
      data: result[0],
      meta: total[0],
      message: `Transaction have been loaded`,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
