import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  recipient: { type: String, required: true, trim: true },
  line:      { type: String, required: true, trim: true },
  locality:  { type: String, required: true, trim: true },
  postcode:  { type: String, required: true, trim: true },
  country:   { type: String, required: true, minlength: 2, maxlength: 80, uppercase: true }
}, { _id: false });
 
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 32,
    match: /^[a-z0-9_.]{3,32}$/,
    lowercase: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  country: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 2,
    uppercase: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  joinedAt: {
    type: Date,
    default: () => new Date()
  },
  sent_count: {
    type: Number,
    default: 0,
    min: 0
  },
  received_count: {
    type: Number,
    default: 0,
    min: 0
  },
  receive_slots: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;
