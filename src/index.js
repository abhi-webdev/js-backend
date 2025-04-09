import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from "./db/db.js";


dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on ${process.env.PORT || 8000}`);
        
    })
})
.catch((err) => {
    console.log("Mongo db connection failed");
    
})
















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