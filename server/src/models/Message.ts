import mongoose, { Schema } from "mongoose"
import type { IMessage } from "../types"

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "file", "audio"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaMetadata: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number,
    },
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
MessageSchema.index({ chatId: 1, createdAt: -1 })
MessageSchema.index({ sender: 1 })

export default mongoose.model<IMessage>("Message", MessageSchema)
