import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create geospatial index for location-based queries
    await mongoose.connection.db
      .collection("users")
      .createIndex({ coords: "2dsphere" });
    console.log("Geospatial index created for user coordinates");

    await createChatIndexes();
    console.log("Chat database indexes created successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

const createChatIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;

    // Chat collection indexes
    await db.collection("chats").createIndex({ participants: 1 });
    await db.collection("chats").createIndex({ lastMessageAt: -1 });
    await db.collection("chats").createIndex({ chatType: 1 });

    // Message collection indexes
    await db.collection("messages").createIndex({ chatId: 1, createdAt: -1 });
    await db.collection("messages").createIndex({ sender: 1 });
    await db.collection("messages").createIndex({ messageType: 1 });
    await db.collection("messages").createIndex({ "readBy.user": 1 });

    // Notification subscription indexes
    await db
      .collection("notificationsubscriptions")
      .createIndex({ userId: 1, endpoint: 1 }, { unique: true });

    console.log("All chat indexes created successfully");
  } catch (error) {
    console.error("Error creating chat indexes:", error);
  }
};

export default connectDB;
