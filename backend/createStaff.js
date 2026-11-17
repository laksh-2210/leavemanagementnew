
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function createStaff() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = process.env.STAFF_EMAIL.toLowerCase();
        const password = process.env.STAFF_PASSWORD;

        if (!email || !password) {
            throw new Error("Staff credentials missing in environment variables");
        }

        const existingStaff = await User.findOne({ email });

        if (existingStaff) {
            console.log("Staff account already exists!");
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const staff = new User({
                name: "Staff",
                email,
                password: hashedPassword,
                role: "staff"
            });

            await staff.save();

            console.log("Staff account created successfully!");
        }

    } catch (error) {
        console.log("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

createStaff();
