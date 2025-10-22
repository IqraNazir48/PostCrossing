import mongoose from "mongoose";

// ============================
// Receiver Address Snapshot
// ============================
const addressSnapshotSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true, trim: true },
    line: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
    country: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 80 }
  },
  { _id: false }
);

// ============================
// Tracking Subdocument
// ============================
const trackingSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true, default: Date.now },
    event: { type: String, required: true, enum: ["assigned", "sent", "received"] },
    by: { type: String, required: true, enum: ["system", "sender", "receiver"] }
  },
  { _id: false }
);

// ============================
// Postcard Schema
// ============================
const postcardSchema = new mongoose.Schema(
  {
    pc_id: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Z]{2}-\d+$/,
      minlength: 4,
      maxlength: 40
    },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender_country: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    receiver_country: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    receiver_address_snapshot: { type: addressSnapshotSchema, required: true },
    message: { type: String, maxlength: 1000, default: "" },
    status: { type: String, enum: ["requested", "sent", "received"], default: "requested" },
    createdAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    receivedAt: { type: Date },
    tracking: [trackingSchema]
  },
  {
    timestamps: true
  }
);

const Postcard = mongoose.model("Postcard", postcardSchema);
export default Postcard;
