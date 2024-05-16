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
    context: async ({ req, res }) => {
      const token = req.headers.authorization;
      // if (!token) throw new Error("Token is not present");
      try {
        const userDecoded = jwt.verify(token, process.env.SECRET_KEY);
        const userAuthentication = {
          userId: userDecoded?.userId,
        };
        return { userAuthentication };
      } catch (error) {
        return { userAuthentication: null };
      }
    },
  })
);

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`🚀 Server ready at http://localhost:4000/`);
