import dotenv from "dotenv";
dotenv.config();

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const httpStatus = require("http-status");

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

//register
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    const thisUser = await User.findOne({ email });

    const token = jwt.sign(
      { id: thisUser._id, email },
      process.env.JWT_SECRET_KEY
    );

    return res
      .status(httpStatus.CREATED)
      .json({ token, message: "User Created!" });
  } catch (e) {
    res.json({ message: "Something went wrong: " + e });
  }
};

//login
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide details" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User does not exist." });
    }

    const isPassCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isPassCorrect) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: existingUser._id, email },
      process.env.JWT_SECRET_KEY
    );

    res.status(httpStatus.OK).json({ token, message: "User Logged in!" });
  } catch (e) {
    res.json({ message: "Something went wrong: " + e });
  }
};
