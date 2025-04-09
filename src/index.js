
import dotenv from "dotenv"
import connectDB from "./db/db.js";


dotenv.config({
    path: './env'
})

connectDB()
















/*
(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("mongoDB connected");
        
    } catch (error) {
        console.log("error",error);
        
    }
})()
    */