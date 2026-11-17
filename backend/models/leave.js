
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({

    studentName: {
        type: String,
        required: true
    },

    studentEmail: {
        type: String,
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    fromDate: {
        type: Date,
        required: true
    },

    toDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
