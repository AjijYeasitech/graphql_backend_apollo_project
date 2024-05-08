import db from "../../models/index.js";
const databaseModel = db;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const resolvers = {
  User: {
    async posts(user) {
      return user.getPosts();
    },
  },
  Post: {
    async user(post) {
      return post.getUser();
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
    allUser(root) {
      return databaseModel.User.findAll()
        .then((user) => {
          return user;
        })
        .catch((error) => error);
    },
    allPosts(root, args) {
      return databaseModel.Post.findAll()
        .then((posts) => {
          return posts;
        })
        .catch((error) => error);
    },
    onePost(root, { id }) {
      return databaseModel.Post.findOne({
        where: { id: id },
      })
        .then((post) => {
          return post;
        })
        .catch((error) => error);
    },
    manyPost(root, { id }) {
      return databaseModel.User.findOne({
        where: { id: id },
        include: [{ model: Post }],
      })
        .then((post) => {
          return post;
        })
        .catch((error) => error);
    },
  },
  Mutation: {
    createUser(root, args, contextValue, info) {
      if (args.password !== args.confirmPassword) {
        throw new Error();
      }
      return bcrypt
        .hash(args.password, 10)
        .then((pass) => {
          return databaseModel.User.create(args);
        })
        .then((created) => created)
        .catch((error) => error);
    },
    createPost(root, { userId, title, subtitle, description }) {
      return databaseModel.Post.create({
        userId: userId,
        title: title,
        subtitle: subtitle,
        description: description,
      })
        .then((post) => post)
        .catch((error) => error);
    },
    updatePost(root, { id, title, subtitle, description }) {
      let content = {};
      if (title) {
        content.title = title;
      }
      if (subtitle) {
        content.subtitle = subtitle;
      }
      if (description) {
        content.description = description;
      }
      console.log(JSON.stringify(content));
      return databaseModel.Post.findOne({ where: { id: id } })
        .then((found) => {
          return found
            .update(content)
            .then((updated) => updated)
            .catch((error) => error);
        })
        .catch((error) => error);
    },
    deletePost(root, { id }) {
      return databaseModel.Post.findOne({
        where: { id: id },
      })
        .then((post) => {
          return post
            .destroy()
            .then(() => post)
            .catch((error) => error);
        })
        .catch((error) => error);
    },
    async userLogin(root, args, contextValue, info) {
      try {
        const checkUser = await databaseModel.User.findOne({
          where: { email: args.email },
        });
        if (!checkUser) throw new Error("User not found");
        const token = jwt.sign(
          { id: checkUser.dataValues.id },
          process.env.SECRET_KEY,
          {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.EXPIRES_IN,
          }
        ); // expires in 30 days
        console.log("check", token);
        return { checkUser, token };
      } catch (error) {
        return error;
      }
    },
  },
};

export default resolvers;
