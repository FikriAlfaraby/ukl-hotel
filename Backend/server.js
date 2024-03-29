const express = require(`express`);

const app = express();
const PORT = 8000;

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require(`cors`);
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3003"],
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const userRoute = require(`./routes/user_routes`);
const tipeRoute = require(`./routes/tipe_kamar_routes`);
const roomRoute = require(`./routes/kamar_routes`);
const pemesananRoute = require(`./routes/pemesanan_routes`);
app.use(`/tipe`, tipeRoute);
app.use(`/user`, userRoute);
app.use(`/kamar`, roomRoute);
app.use(`/pemesanan`, pemesananRoute);
app.use(express.static(__dirname));
app.use(express.static("foto_tipe_kamar"));
app.use(express.static("foto_user"));
app.listen(PORT, () => {
  console.log(`Server of Hotels Library runs on port
${PORT}`);
});
