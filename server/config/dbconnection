const mongoose = require("mongoose");

const connectDB = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connexted")
    } catch (error) {
        console.error("DB Connection Error:", error);
        process.exit(1);
    }
};
module.exports = connectDB;