import createHttpError from "http-errors";
import validator from "validator";
import databaseModel from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// env variables
const { DEFAULT_PICTURE, DEFAULT_STATUS } = process.env;

// authentication
export const userToken = async (bearerToken) => {
  const bearer = bearerToken?.split(" ");
  let token;
  if (bearer) {
    token = bearer[1];
  }

  try {
    const userDecoded = jwt.verify(token, process.env.SECRET_KEY);
    const userAuthentication = {
      userId: userDecoded?.userId,
    };
    return { userAuthentication };
  } catch (error) {
    return { userAuthentication: null };
  }
};

// Register
export const SignUpUser = async (userData) => {
  let { name, email, picture, status, password, confirmPassword } = userData;
  // check if field are empty
  if (!name || !email || !password) {
    throw createHttpError.BadRequest("Please fill all field");
  }

  // check name length
  if (
    !validator.isLength(name, {
      min: 2,
      max: 16,
    })
  ) {
    throw createHttpError.BadRequest(
      "Please Provide your name is between 2 and 16 characters."
    );
  }

  // check status length
  if (status && status > 64) {
    throw createHttpError.BadRequest(
      "Please make sure your status is less than 64 character"
    );
  }
  // check isf email is valid
  if (!validator.isEmail(email)) {
    throw createHttpError.BadRequest(
      "Please make sure to provide a valid email address."
    );
  }
  if (password !== confirmPassword) {
    throw createHttpError[409]("Oops... password mismatch");
  }

  const hashPassword = bcrypt.hash(password, 10);
  password = await hashPassword;

  // check is user already exist
  const checkDb = await databaseModel.User.findOne({ where: { email: email } });
  if (checkDb) {
    throw createHttpError.Conflict(
      "Please try again with a different email address, this email already exist."
    );
  }

  const user = await databaseModel.User.create({
    name,
    email,
    picture: picture || DEFAULT_PICTURE,
    status: status || DEFAULT_STATUS,
    password,
  });

  return user;
};

// Login
export const signInUser = async (email, password) => {
  const user = await databaseModel.User.findOne({
    where: {
      email: email.toLowerCase(),
    },
  });

  // check user exist
  if (!user) {
    throw createHttpError.NotFound("Invalid credentials");
  }

  // compare password
  let passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) throw createHttpError.NotFound("Invalid credentials");
  const token = jwt.sign(
    { userId: user.dataValues.id },
    process.env.SECRET_KEY,
    {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.EXPIRES_IN,
    }
  ); // expires in 30 days
  user.token = token;

  return user;
};
