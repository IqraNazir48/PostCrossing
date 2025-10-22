import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: /^postcard_[A-Z]{2}$/, // e.g. postcard_US
    uppercase: true
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
});

// --------------------------------------------------
// Static method to get next sequence for a country
// --------------------------------------------------
counterSchema.statics.getNextSequence = async function (countryCode) {
  const counterId = `postcard_${countryCode.toUpperCase()}`;
  const counter = await this.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // create if not exist
  );
  return counter.seq;
};

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
