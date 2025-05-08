import { Schema } from "mongoose";

const userSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  meeting_code: {
    type: String,
    required: true,
  },

  Date: {
    type: Date,
    default: Date.now(),
  },
});
export const Meeting = mongoose.model("Meeting", userSchema);
