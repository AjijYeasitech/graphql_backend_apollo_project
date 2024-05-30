import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import helmet from "helmet";
import typeDefs from "./graphql/schema/schema.js";
import resolvers from "./graphql/resolvers/resolvers.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import databaseModel from "./models/index.js";
import { GraphQLError } from "graphql";
import DataLoader from "dataloader";
import { userToken } from "./services/auth.service.js";

const userLoader = new DataLoader(async (receiverId) => {
  const receiverData = await databaseModel.User.findOne({
    where: { id: receiverId },
  });
  return [[receiverData]]; // dataLoader return array of value thats why send receiver data like that.
});
// const userToken1 = await userToken(req, res);
// context
const context = {
  userLoader,

  // ... other context data
};

const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  typeDefs,
  resolvers,

  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
// Ensure we wait for our server to start
await server.start();

app.use(
  cors(),
  express.json(),
  cookieParser(),
  // helmet(),
  // fileUpload({
  //   useTempFiles: true,
  // }),

  expressMiddleware(server, {
    context: async ({ req }) => {
      const tokens = req?.headers?.authorization;
      const userId = await userToken(tokens);
      return {
        ...context,
        ...userId,
      };
    },
  })
);

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`🚀 Server ready at http://localhost:4000`);
