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

  return users;
};
