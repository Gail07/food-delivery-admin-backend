import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Neutralise les opérateurs MongoDB ($ne, $gt...) glissés dans les filtres de requête.
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export { connectDB };
