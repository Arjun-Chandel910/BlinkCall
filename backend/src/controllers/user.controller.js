import dotenv from "dotenv";
dotenv.config();

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
      return res.status(302).json({ message: "User already exists." }); // 302 = FOUND
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email },
      process.env.JWT_SECRET_KEY
    );

    return res.status(201).json({ token, message: "User Created!" }); // 201 = CREATED
  } catch (e) {
    res.status(500).json({ message: "Something went wrong: " + e });
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
      return res.status(404).json({ message: "User does not exist." });
    }

    const isPassCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPassCorrect) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: existingUser._id, email },
      process.env.JWT_SECRET_KEY
    );

    res.status(200).json({ token, message: "User Logged in!" });
  } catch (e) {
    res.status(500).json({ message: "Something went wrong: " + e });
  }
};
