import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
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

// context
const context = {
  userLoader,
  // ... other context data
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = http.createServer(app);

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions",
});

// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
// Ensure we wait for our server to start
await server.start();

app.use(
  cors(),
  express.json(),
  cookieParser(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      // console.log("tokens", req);
      const tokens = req?.headers?.authorization;
      console.log("tokens", tokens);
      const userId = await userToken(tokens);
      console.log("userIds", userId);
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
