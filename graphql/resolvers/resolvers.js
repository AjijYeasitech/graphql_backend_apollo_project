import databaseModel from "../../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import {
  createdMessage,
  populateMessage,
  getConversationMessages,
} from "../../services/message.service.js";
import {
  getUserConversations,
  createConversation,
  doesConversationExist,
  updateLatestMessage,
  populatedConversation,
} from "../../services/conversation.service.js";

const resolvers = {
  User: {
    conversations(user) {
      return user.getConversations();
    },
    messages(user) {
      return user.getMessages();
    },
  },
  Message: {
    user(message) {
      return message.getUser();
    },
  },
  Conversation: {
    user(conversation) {
      return conversation.getUser;
    },
    message(conversation) {
      return conversation.getMessages();
    },
  },
  Query: {
    oneUser(root, { id }, context) {
      return databaseModel.User.findOne({
        where: { id: id },
      })
        .then((user) => {
          return user;
        })
        .catch((error) => error);
    },
    allUser(root, args, contextValue) {
      return databaseModel.User.findAll()
        .then((user) => {
          return user;
        })
        .catch((error) => error);
    },
    allMessage(root, args) {
      return databaseModel.Message.findAll()
        .then((messages) => {
          return messages;
        })
        .catch((error) => error);
    },
    oneMessage(root, { id }) {
      return databaseModel.Message.findOne({
        where: { id: id },
      })
        .then((message) => {
          return message;
        })
        .catch((error) => error);
    },
    manyMessage(root, { id }) {
      return databaseModel.User.findOne({
        where: { id: id },
        include: [{ model: Message }],
      })
        .then((message) => {
          return message;
        })
        .catch((error) => error);
    },
  },
  Mutation: {
    async createUser(root, args, contextValue, info) {
      try {
        // if (!contextValue?.userAuthentication?.userId) {
        //   throw new Error(" Your are Unauthorized");
        // }

        if (args.input.password !== args.input.confirmPassword) {
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Oops... password mismatch",
          };
        }
        const hashPassword = bcrypt.hash(args.input.password, 10);
        args.input.password = await hashPassword;
        const createUser = await databaseModel.User.create(args.input);
        return {
          code: 201,
          status: true,
          ack: 1,
          msg: "successfully create",
          data: createUser,
        };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
        };
      }
    },
    // Message //
    async createMessage(root, args, contextValue, info) {
      try {
        // add validation pending
        const { input } = args;
        const messageData = await databaseModel.Message.create(input);
        return {
          code: 201,
          status: true,
          ack: 1,
          msg: "successfully create",
          data: messageData,
        };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
          data: null,
        };
      }
    },

    async sendMessage(root, args, contextValue, info) {
      // validation pending
      try {
        const newMessageData = await createdMessage(args.input);
        if (!newMessageData)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "message is not create",
          };
        const populateMessageData = await populateMessage(
          newMessageData.dataValues.id
        );
        if (!populateMessageData)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Conversation is not create",
          };
        console.log("id...", args.input.Id);
        await updateLatestMessage(args.input.Id, newMessageData);
        return {
          code: 200,
          status: true,
          ack: 1,
          msg: "Successfully send msg",
          message: populateMessageData,
          conversation: "right now send nothing",
        };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
        };
      }
    },

    async updateMessage(root, { id, message, files }) {
      try {
        let content = {};
        if (message) {
          content.message = message;
        }
        if (files) {
          content.files = files;
        }

        const checkMessage = await databaseModel.Message.findByPk(id);
        if (!checkMessage)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Message not found",
            data: null,
          };

        const messageUpdate = await databaseModel.Message.update(content, {
          where: { id: id },
        });

        if (messageUpdate[0] == 1)
          return {
            code: 200,
            status: true,
            ack: 1,
            msg: "successfully updated",
            data: messageUpdate,
          };

        return {
          code: 400,
          status: false,
          ack: 0,
          msg: "Data not updated",
        };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
          data: null,
        };
      }
    },
    async deleteMessage(root, { id }, contextValue, info) {
      // validation pending
      try {
        const checkMessage = await databaseModel.Message.findByPk(id);
        if (!checkMessage)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Message not found",
          };

        const deleteMessage = await databaseModel.Message.destroy({
          where: { id: id },
        });
        console.log("deleteMessage", deleteMessage);
        if (deleteMessage)
          return {
            code: 200,
            status: true,
            ack: 1,
            msg: "Delete successfully",
          };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
        };
      }
    },

    // Conversation //
    async createOpenConversation(root, args, contextValue, info) {
      try {
        // add validation pending
        const { isGroup, senderId, receiverId } = args.input;
        if (isGroup === false) {
          if (!receiverId) {
            return {
              code: 400,
              status: false,
              ack: 0,
              msg: "Please provide receiverId",
            };
          }

          const existedConversation = await doesConversationExist(
            senderId,
            receiverId,
            false
          );
          console.log("existedConversation", existedConversation);
          if (existedConversation.length !== 0) {
            return {
              code: 200,
              status: true,
              ack: 1,
              msg: "Conversation already exist",
              data: existedConversation,
            };
          } else {
            const conversationData = {
              name: "conversation name",
              picture: "conversation picture",
              isGroup: false,
              senderId,
              receiverId,
            };

            const newConversation = await createConversation(conversationData);
            console.log("newConversation", newConversation);
            if (!newConversation)
              return {
                code: 400,
                status: false,
                ack: 0,
                msg: "Conversation not created",
              };
            const populatedConversations = await populatedConversation(
              newConversation.id
            );
            console.log("populatedConversation", populatedConversations);
            return {
              code: 200,
              status: true,
              ack: 1,
              msg: "successfully populate",
              data: populatedConversations,
            };
          }
        } else {
          // const conversationData = await databaseModel.Conversation.create(input);
          // it is a group chat
          // check if group chat exists
          const existedGroupConversation = await doesConversationExist(isGroup);
          console.log("existedGroupConversation", existedGroupConversation);
          return {
            code: 200,
            status: true,
            ack: 1,
            msg: "successfully existedGroupConversation",
            data: existedGroupConversation,
          };
        }
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
          data: null,
        };
      }
    },

    async updateConversation(
      root,
      { id, name, picture, isGroup, isAdmin, isActive }
    ) {
      try {
        let content = {};
        if (name) {
          content.name = name;
        }
        if (isGroup) {
          content.isGroup = isGroup;
        }
        if (isAdmin) {
          content.isAdmin = isAdmin;
        }
        if (isActive) {
          content.isActive = isActive;
        }

        if (picture) {
          content.picture = picture;
        }

        const checkConversation = await databaseModel.Conversation.findByPk(id);

        if (!checkConversation)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Data not found",
          };

        const conversationUpdate = await databaseModel.Conversation.update(
          content,
          {
            where: { id: id },
          }
        );

        if (conversationUpdate[0] == 1)
          return {
            code: 200,
            status: true,
            ack: 1,
            msg: "successfully updated",
          };

        return {
          code: 400,
          status: false,
          ack: 0,
          msg: "Data not updated",
        };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
          data: null,
        };
      }
    },
    async deleteConversation(root, { id }, contextValue, info) {
      // validation pending
      try {
        const checkConversation = await databaseModel.Conversation.findByPk(id);
        if (!checkConversation)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Data not found",
            data: null,
          };

        const deleteConversation = await databaseModel.Conversation.destroy({
          where: { id: id },
        });
        if (deleteConversation)
          return {
            code: 200,
            status: true,
            ack: 1,
            msg: "Delete successfully",
          };
      } catch (error) {
        return {
          code: 500,
          status: false,
          ack: 0,
          msg: error.message,
          data: null,
        };
      }
    },
    // Login section //
    async userLogin(root, args, contextValue, info) {
      try {
        const checkUser = await databaseModel.User.findOne({
          where: { email: args.email },
        });

        if (!checkUser) throw new Error("User not found");
        if (bcrypt.compareSync(args.password, checkUser?.password)) {
          const token = jwt.sign(
            { userId: checkUser.dataValues.id },
            process.env.SECRET_KEY,
            {
              algorithm: process.env.JWT_ALGORITHM,
              expiresIn: process.env.EXPIRES_IN,
            }
          ); // expires in 30 days
          checkUser.token = token;

          console.log("contextValue", contextValue);
          return checkUser;
        } else {
          throw new Error("Invalid username or password");
        }
      } catch (error) {
        return error;
      }
    },
  },
};

export default resolvers;
