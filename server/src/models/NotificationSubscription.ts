import mongoose, { Schema } from "mongoose"
import type { INotificationSubscription } from "../types"

const NotificationSubscriptionSchema = new Schema<INotificationSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate subscriptions
NotificationSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

export default mongoose.model<INotificationSubscription>("NotificationSubscription", NotificationSubscriptionSchema)
