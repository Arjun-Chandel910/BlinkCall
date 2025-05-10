import { status } from "http-status";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
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
