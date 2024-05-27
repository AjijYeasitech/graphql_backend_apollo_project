import databaseModel from "../models/index.js";
import { Sequelize, Op } from "sequelize";

export const findUser = async (userId) => {
  const user = await databaseModel.User.findByPk(userId);
  return user;
};

export const searchUsers = async (searchParam, userId) => {
  const users = await databaseModel.User.findAll({
    where: {
      id: {
        [Sequelize.Op.not]: userId, // Exclude the user with the specified ID
      },
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } },
        { email: { [Op.like]: `%${searchParam}%` } },
      ],
    },
  });

  //   const users = await UserModel.find({
  //     $or: [
  //       { name: { $regex: keyword, $options: "i" } },
  //       { email: { $regex: keyword, $options: "i" } },
  //     ],
  //   }).find({
  //     _id: { $ne: userId },
  //   });
  //    console.log("user",users);
  return users;
};
