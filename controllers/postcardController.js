import Postcard from "../models/postcardModel.js";
import Counter from "../models/counterModel.js";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";

//------------------------------------------------------------------------------------------------
//-------------------------------------requesting postcard------------------------------------------

// --------------------------------------------------
// @desc    Request to send a postcard
// @route   POST /api/postcards/request
// @access  Public (later: authenticated)
// --------------------------------------------------
export const requestPostcard = async (req, res) => {
    try {
        const { sender_id, message } = req.body;

        // Step 1: Verify sender exists
        const sender = await User.findById(sender_id);
        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Step 2: Select a random receiver (not the sender)
        const receiver = await User.aggregate([
            { $match: { _id: { $ne: sender._id } } },
            { $sample: { size: 1 } }
        ]);

        if (!receiver.length) {
            return res.status(400).json({ message: "No eligible receiver found" });
        }

        const chosenReceiver = receiver[0];

        // Step 3: Generate postcard ID using counter
        const seq = await Counter.getNextSequence(sender.country);
        const pc_id = `${sender.country.toUpperCase()}-${seq}`;

        // Step 4: Build receiver snapshot (copy of their address)
        const receiverSnapshot = {
            recipient: chosenReceiver.address.recipient,
            line: chosenReceiver.address.line,
            locality: chosenReceiver.address.locality,
            postcode: chosenReceiver.address.postcode,
            country: chosenReceiver.address.country
        };

        // Step 5: Create postcard document
        const postcard = await Postcard.create({
            pc_id,
            sender_id: sender._id,
            receiver_id: chosenReceiver._id,
            sender_country: sender.country,
            receiver_country: chosenReceiver.country,
            receiver_address_snapshot: receiverSnapshot,
            message: message || "",
            status: "requested",
            tracking: [{ event: "assigned", by: "system" }]
        });
        await Transaction.create({
            type: "request",
            postcard_id: postcard._id,
            pc_id: postcard.pc_id,
            sender_id: postcard.sender_id,
            receiver_id: postcard.receiver_id,
            actor_id: postcard.sender_id,
            message: "Sender requested to send a new postcard."
        });


        // Step 6: Respond with new postcard details
        res.status(201).json({
            message: "Postcard successfully created",
            postcard: {
                pc_id: postcard.pc_id,
                sender: sender.username,
                receiver: chosenReceiver.username,
                receiver_address: receiverSnapshot,
                status: postcard.status
            }
        });
    } catch (err) {
        console.error("Error requesting postcard:", err);
        res.status(500).json({ message: "Server error while requesting postcard" });
    }
};

//------------------------------------------------------------------------------------------------
//-----------------------------------Sending postcard------------------------------------------

// --------------------------------------------------
// @desc    Mark postcard as sent (sender confirms mailing)
// @route   PATCH /api/postcards/send/:pc_id
// @access  Public (later: sender only)
// --------------------------------------------------
export const sendPostcard = async (req, res) => {
    try {
        const { pc_id } = req.params;

        // Step 1: Find postcard by its ID
        const postcard = await Postcard.findOne({ pc_id });
        if (!postcard) {
            return res.status(404).json({ message: "Postcard not found" });
        }

        // Step 2: Check if already sent or received
        if (postcard.status !== "requested") {
            return res.status(400).json({ message: `Cannot send postcard. Current status: ${postcard.status}` });
        }

        // Step 3: Update postcard status and tracking
        postcard.status = "sent";
        postcard.sentAt = Date.now();
        postcard.tracking.push({ event: "sent", by: "sender" });

        await postcard.save();
        await Transaction.create({
            type: "send",
            postcard_id: postcard._id,
            pc_id: postcard.pc_id,
            sender_id: postcard.sender_id,
            receiver_id: postcard.receiver_id,
            actor_id: postcard.sender_id,
            message: "Sender marked postcard as sent."
        });


        // Step 4: (Optional) Update sender's sent_count
        await User.findByIdAndUpdate(
            postcard.sender_id,
            { $inc: { sent_count: 1 } },
            { new: true }
        );

        // Step 5: Respond with updated postcard info
        res.status(200).json({
            message: "Postcard marked as sent successfully",
            postcard: {
                pc_id: postcard.pc_id,
                sender_country: postcard.sender_country,
                receiver_country: postcard.receiver_country,
                status: postcard.status,
                sentAt: postcard.sentAt
            }
        });
    } catch (err) {
        console.error("Error marking postcard as sent:", err);
        res.status(500).json({ message: "Server error while marking postcard as sent" });
    }
};
//---------------------------------------------------------------------------------------
//------------------------------registering and receiving------------------------------------------------
// --------------------------------------------------
// @desc    Mark postcard as received (receiver registers it)
// @route   PATCH /api/postcards/receive/:pc_id
// @access  Public (later: receiver only)
// --------------------------------------------------
export const receivePostcard = async (req, res) => {
  try {
    const { pc_id } = req.params;

    // Step 1: Find postcard by its ID
    const postcard = await Postcard.findOne({ pc_id });
    if (!postcard) {
      return res.status(404).json({ message: "Postcard not found" });
    }

    // Step 2: Check if already received
    if (postcard.status === "received") {
      return res.status(400).json({ message: "This postcard has already been registered as received." });
    }

    // Step 3: Update postcard status and timestamps
    postcard.status = "received";
    postcard.receivedAt = Date.now();
    postcard.tracking.push({ event: "received", by: "receiver" });
    await postcard.save();

    // Step 4: Log transaction
    await Transaction.create({
      type: "receive",
      postcard_id: postcard._id,
      pc_id: postcard.pc_id,
      sender_id: postcard.sender_id,
      receiver_id: postcard.receiver_id,
      actor_id: postcard.receiver_id,
      message: "Receiver registered postcard as received."
    });

    // Step 5a: Update receiver stats (they got a postcard)
    const receiver = await User.findById(postcard.receiver_id);
    if (receiver) {
      // Decrease receiver's receive_slots, but not below 0
      const newSlots = Math.max(0, (receiver.receive_slots || 0) - 1);
      receiver.receive_slots = newSlots;
      receiver.received_count = (receiver.received_count || 0) + 1;
      await receiver.save();
    }

    // Step 5b: Update sender stats (they successfully sent one)
    await User.findByIdAndUpdate(
      postcard.sender_id,
      { $inc: { receive_slots: 1 } },
      { new: true }
    );

    // Step 6: Respond with confirmation
    res.status(200).json({
      message: "Postcard marked as received successfully",
      postcard: {
        pc_id: postcard.pc_id,
        sender_country: postcard.sender_country,
        receiver_country: postcard.receiver_country,
        status: postcard.status,
        receivedAt: postcard.receivedAt
      }
    });
  } catch (err) {
    console.error("Error marking postcard as received:", err);
    res.status(500).json({ message: "Server error while marking postcard as received" });
  }
};

//------------------------------------------------------------------------------------------------
//----------------------------get all postcards-----------------------------------------
// --------------------------------------------------
// --------------------------------------------------
// @desc    Get all postcards with optional filters
// @route   GET /api/postcards
// @access  Public (later: authenticated)
// --------------------------------------------------
export const getAllPostcards = async (req, res) => {
    try {
        const { status, sender, receiver, country } = req.query;
        const filter = {};

        // Filter by status (requested, sent, received)
        if (status) filter.status = status;

        // Filter by sender username
        if (sender) {
            const senderUser = await User.findOne({ username: sender });
            if (senderUser) filter.sender_id = senderUser._id;
            else return res.status(404).json({ message: "Sender not found" });
        }

        // Filter by receiver username
        if (receiver) {
            const receiverUser = await User.findOne({ username: receiver });
            if (receiverUser) filter.receiver_id = receiverUser._id;
            else return res.status(404).json({ message: "Receiver not found" });
        }

        // Filter by country (either sender or receiver country)
        if (country) {
            filter.$or = [
                { sender_country: country.toUpperCase() },
                { receiver_country: country.toUpperCase() }
            ];
        }

        // Fetch matching postcards
        const postcards = await Postcard.find(filter)
            .populate("sender_id", "username country")
            .populate("receiver_id", "username country")
            .sort({ createdAt: -1 });

        res.status(200).json({
            total: postcards.length,
            appliedFilters: filter,
            postcards
        });
    } catch (err) {
        console.error("Error filtering postcards:", err);
        res.status(500).json({ message: "Server error while filtering postcards" });
    }
};

//------------------------------------------------------------------------------------------------
//------------------------------getpostcard by id--------------------------------------
// --------------------------------------------------
// @desc    Get single postcard by its ID
// @route   GET /api/postcards/:pc_id
// @access  Public
// --------------------------------------------------
export const getPostcardById = async (req, res) => {
    try {
        const { pc_id } = req.params;
        const postcard = await Postcard.findOne({ pc_id })
            .populate("sender_id", "username country email")
            .populate("receiver_id", "username country email");

        if (!postcard) {
            return res.status(404).json({ message: "Postcard not found" });
        }

        res.status(200).json(postcard);
    } catch (err) {
        console.error("Error fetching postcard:", err);
        res.status(500).json({ message: "Server error while fetching postcard" });
    }
};

//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

