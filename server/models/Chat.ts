import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            //   required: true, // Optional for now if we don't have strict auth user everywhere yet
        },
        orgId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: "New Chat",
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ['user', 'assistant'],
                    required: true
                },
                content: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;
