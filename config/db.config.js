import dotenv from "dotenv";
dotenv.config();

export default {
  HOST: process.env.DBHOST,
  USER: process.env.DBUSER,
  PASSWORD: process.env.DBPASSWORD,
  DB: process.env.DB,
  dialect: "mysql",
  PORT: process.env.DBPORT,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
