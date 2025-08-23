import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string)
    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Create geospatial index for location-based queries
    await mongoose.connection.db.collection("users").createIndex({ coords: "2dsphere" })
    console.log("Geospatial index created for user coordinates")
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

export default connectDB
