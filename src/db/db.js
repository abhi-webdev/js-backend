import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
// import dotenv from "dotenv"
// dotenv.config()

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
        // await mongoose.connect(process.env.MONGODB_URI)
        // console.log("connected");
        
    } catch (error) {
        console.log("DB Connection error ", error);
        process.exit(1)
    }
}

export default connectDB;

