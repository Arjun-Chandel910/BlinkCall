import dotenv from "dotenv";
dotenv.config();
import { status } from "http-status";
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
      return res.status(status.FOUND).json({ message: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res.status(status.CREATED).json({ message: "User Created!" });
  } catch (e) {
    res.json({ message: "Something went wrong" + e });
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
        .status(status.NOT_FOUND)
        .json({ message: "User does not exist." });
    }

    const isPassCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isPassCorrect) {
      return res
        .status(status.UNAUTHORIZED)
        .json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: existingUser._id, email },
      process.env.JWT_SECRET_KEY
    );
    res.status(status.OK).json({ token, message: "User Logged in!" });
  } catch (e) {
    res.json({ message: "Something went wrong" + e });
  }
};
