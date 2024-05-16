import databaseModel from "../models/index.js";

export const doesConversationExist = async (senderId, receiverId, isGroup) => {
  if (isGroup === false) {
    let convos = databaseModel.Conversation.findAll({
      where: {
        isGroup: false,
        senderId: senderId,
        receiverId: receiverId,
      },
    });

    // return korte hbe all conversation user data

    return convos;
  } else {
    // it's a group chat
    let convo = databaseModel.Conversation.findAll({
      where: { isGroup: true },
    });

    // return korte hbe user admin and latestMessage

    return convo;
  }
};

// create conversation
export const createConversation = async (data) => {
  const newConvo = await databaseModel.Conversation.create(data);

  return newConvo;
};

export const populatedConversation = async (id) => {
  const populateConve = await databaseModel.Conversation.findByPk(id);

  return populateConve;
};

// getUserConversations
export const getUserConversations = async (user_id) => {
  // console.log("user_id",user_id);
  const conversations = await databaseModel.Conversation.findAll({
    where: { senderId: user_id },
  });
  // return korte hbe all user data ,
  return conversations;
};

export const updateLatestMessage = async (conversationId, msg) => {
  const updatedConversation = await databaseModel.Conversation.update(
    { ...msg },
    { where: { id: conversationId } }
  );
  // checking pending
  return updatedConversation;
};
