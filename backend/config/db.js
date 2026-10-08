import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://kaaone70_db_user:R4Z43ZqcJA9LDu2v@cluster0.umbaeke.mongodb.net/food-delivery"
        );

        console.log("DB Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};