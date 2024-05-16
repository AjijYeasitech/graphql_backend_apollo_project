import databaseModel from "../models/index.js";

export const createdMessage = async (data) => {
  const newMessage = await databaseModel.Message.create(data);
  if (!newMessage)
    return {
      code: 400,
      status: false,
      ack: 0,
      msg: "Oops... somethings went wrong",
    };
  return newMessage;
};

export const populateMessage = async (id) => {
  const msgs = await databaseModel.Message.findByPk(id);
  if (!msgs)
    return {
      code: 400,
      status: false,
      ack: 0,
      msg: "Oops... somethings went wrong",
    };
  return msgs;
};

export const getConversationMessages = async (conversationId) => {
  const messages = await databaseModel.Message.findAll({
    where: conversationId,
  });

  return messages;
};
