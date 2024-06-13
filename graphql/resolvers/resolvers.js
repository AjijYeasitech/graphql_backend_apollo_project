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
import { SignUpUser, signInUser } from "../../services/auth.service.js";
import { searchUsers } from "../../services/user.service.js";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const resolvers = {
  User: {
    conversations(user) {
      return user.getConversations();
    },

    async messages(user) {
      return user.getMessages();
    },
  },
  Message: {
    async user(message) {
      return message.getUser();
    },
    async conversation(message) {
      return message.getConversation();
    },
  },
  Conversation: {
    user(conversation) {
      // console.log("conversation", conversation);
      return conversation.getUser();
    },

    message(conversation) {
      return conversation.getMessages();
    },
    async receiver(conversation, args, context, info) {
      const receiverId = conversation.receiverId; // Assuming a getter
      if (!receiverId) {
        return null;
      }
      const receiverUserData = await context.userLoader.load(receiverId);
      return receiverUserData[0];
    },
  },

  Subscription: {
    // hello: {
    //   // Example using an async generator
    //   subscribe: async function* () {
    //     for await (const word of ["Hello", "Bonjour", "Ciao"]) {
    //       yield { hello: word };
    //     }
    //   },
    // },
    userCreated: {
      // More on pubsub below
      subscribe: () => pubsub.asyncIterator(["USER_CREATED"]),
    },
  },

  Query: {
    async searchUser(root, { searchParam }, contextValue) {
      // console.log("searchParam", searchParam);
      const userId = contextValue?.userAuthentication?.userId;
      // console.log("userID", userId);
      const searchData = await searchUsers(searchParam, userId);

      return searchData;
    },

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
      return databaseModel.Message.findAll({
        include: { model: databaseModel.User },
      })
        .then((messages) => {
          return messages;
        })
        .catch((error) => error);
    },
    oneMessage(root, { id }) {
      return databaseModel.Message.findOne({
        where: { id: id },
      })
        .then((user) => {
          return user;
        })
        .catch((error) => error);
    },
    manyMessage(root, { id }) {
      return databaseModel.User.findOne({
        where: { id: id },
      })
        .then((message) => {
          return message;
        })
        .catch((error) => error);
    },
    // message
    async getMessage(root, args, contextValue, info) {
      try {
        if (!args.conversationId) return "Please provide conversationId";
        const getMsg = await getConversationMessages(args.conversationId);
        return getMsg[0];
      } catch (error) {
        return error.message;
      }
    },

    /// conversation
    async getUserConversation(root, args, contextValue, info) {
      const userId = contextValue?.userAuthentication.userId; // from token
      console.log("userId", userId);

      try {
        const getConversationData = await getUserConversations(userId);

        return getConversationData[0];
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
  },

  Mutation: {
    async createUser(root, args, contextValue, info) {
      try {
        // if (!contextValue?.userAuthentication?.userId) {
        //   throw new Error(" Your are Unauthorized");
        // }
        console.log("ajij");
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
        pubsub.publish("USER_CREATED", { userCreated: "user created" });

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
        const senderId = contextValue.userAuthentication.userId; // this is from token

        const { conversationId } = args.input;
        const newMessageData = await createdMessage({
          ...args.input,
          senderId,
        });
        if (!newMessageData)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "message is not create",
          };
        console.log("newMessage", newMessageData);
        const populateMessageData = await populateMessage(
          newMessageData.dataValues.id
        );
        console.log("populateMessageData", populateMessageData);
        if (!populateMessageData)
          return {
            code: 400,
            status: false,
            ack: 0,
            msg: "Conversation is not create",
          };
        console.log("populateMessageData", populateMessageData);
        console.log("newMessageData", newMessageData.id);

        await updateLatestMessage(conversationId, newMessageData.id);
        return {
          code: 200,
          status: true,
          ack: 1,
          msg: "Successfully send msg",
          message: newMessageData,
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
        const senderId = contextValue.userAuthentication.userId;

        const { isGroup, receiverId } = args.input;
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
          // console.log("existedConversation", existedConversation);

          if (existedConversation.length !== 0) {
            return {
              __typename: "CreateConversationResponses",
              code: 200,
              status: true,
              ack: 1,
              msg: "Conversation already exist",
              data: existedConversation[0],
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

            return {
              __typename: "CreateConversationResponses",
              code: 200,
              status: true,
              ack: 1,
              msg: "successfully populate and create",
              data: populatedConversations,
            };
          }
        } else {
          // const conversationData = await databaseModel.Conversation.create(input);
          // it is a group chat
          // check if group chat exists
          const existedGroupConversation = await doesConversationExist(isGroup);

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
      { id, name, picture, latestMessageId, isGroup, isAdmin, isActive }
    ) {
      try {
        let content = {};
        if (name) {
          content.name = name;
        }
        if (latestMessageId) {
          content.latestMessageId = latestMessageId;
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

    // user sign in
    async userSignUp(root, args, contextValue, info) {
      try {
        const createUser = await SignUpUser(args.input);
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

    // Login section //
    async userSignIn(root, args, contextValue, info) {
      try {
        const userSign = await signInUser(args.email, args.password);
        return userSign;
      } catch (error) {
        return error;
      }
    },
  },
};

export default resolvers;
