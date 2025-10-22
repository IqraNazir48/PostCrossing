import User from "../models/userModel.js";
//---------------------------------------------------------------------------------
//creatign a new user
export const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      country,
      address
    } = req.body;

    // Basic validation: check required fields
    if (!username || !email || !country || !address) {
      return res.status(400).json({ message: "username, email, country and address are required." });
    }

    // Additional address field checks
    const requiredAddressFields = ["recipient", "line", "locality", "postcode", "country"];
    for (const f of requiredAddressFields) {
      if (!address[f]) {
        return res.status(400).json({ message: `address.${f} is required.` });
      }
    }

    // Create the user
    const user = new User({
      username,
      email,
      country,
      address,
      //other things liek slots will be set to default
    });

    await user.save();

    // Return created user (omit sensitive fields if any)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        country: user.country,
        address: user.address,
        joinedAt: user.joinedAt,
        sent_count: user.sent_count,
        received_count: user.received_count,
        receive_slots: user.receive_slots
      }
    });
  } catch (err) {
    // Handle duplicate key error (unique index on username or email)
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(409).json({ message: `Duplicate value for: ${dupKey}` });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
//-----------------------------------------------------------------------------------
//----------------------getting all users--------------------------------------------
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ joinedAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to get users", error: error.message });
  }
};

//-----------------------------------------------------------------------------------
//---------------------------Getting user by id-----------------------------------------
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { __v: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error while fetching user" });
  }
};
//-----------------------------------------------------------------------------------
//----------------------------Update user----------------------------------
export const updateUser = async (req, res) => {
  try {
    const updates = (({ username, email, country, address }) => 
      ({ username, email, country, address }))(req.body);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true, fields: "-__v" }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: `Duplicate value for: ${Object.keys(error.keyPattern).join(", ")}` });
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};


//-----------------------------------------------------------------------------------
//----------------------------delete user------------------------------------------
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------
