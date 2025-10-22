import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["request", "send", "receive"],
      required: true
    },
    postcard_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Postcard",
      required: true
    },
    pc_id: {
      type: String,
      required: true
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
