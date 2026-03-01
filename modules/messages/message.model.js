import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listings",
        },

        message: {
            type: String,
            required: true,
        },

        read: {
            type: Boolean,
            default: false,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        deletedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
)

messageSchema.index({ senderId: 1, receiverid: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;