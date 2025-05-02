const express = require("express");
const cors = require("cors");
const db = require("./db/firebase"); 
const path = require("path");
const serviceAccount = require(path.join(__dirname, "./db/serviceAccountKey.json"));
const userRoute = require("./routes/userRoute");
const entityRoute = require("./routes/entityRoute");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Usa as rotas de entidade e user
app.use("/entity", entityRoute);
app.use("/users", userRoute);
app.use("/auth", userRoute);

const PORT = 4005;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
