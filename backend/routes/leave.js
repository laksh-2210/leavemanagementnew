
const express = require("express");
const router = express.Router();

const Leave = require("../models/Leave");
const jwt = require("jsonwebtoken");

// AUTHENTICATION MIDDLEWARE
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    try {
        const decoded = jwt.verify(
            token.split(" ")[1],
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

// STUDENT APPLY LEAVE
router.post("/apply", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Students only"
            });
        }

        const { reason, fromDate, toDate } = req.body;

        if (!reason || !fromDate || !toDate) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({
                message: "To date cannot be before From date"
            });
        }

        const leave = new Leave({
            studentName: req.user.name,
            studentEmail: req.user.email,
            reason,
            fromDate,
            toDate
        });

        await leave.save();

        res.status(201).json({
            message: "Leave applied successfully",
            leave
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// STUDENT VIEW OWN LEAVES
router.get("/my-leaves", verifyToken, async (req, res) => {
    try {
        const leaves = await Leave.find({
            studentEmail: req.user.email
        }).sort({ createdAt: -1 });

        res.json(leaves);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// STAFF VIEW ALL LEAVES
router.get("/all", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "staff") {
            return res.status(403).json({
                message: "Staff access only"
            });
        }

        const leaves = await Leave.find().sort({
            createdAt: -1
        });

        res.json(leaves);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// STAFF APPROVE OR REJECT
router.put("/update/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "staff") {
            return res.status(403).json({
                message: "Staff access only"
            });
        }

        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!leave) {
            return res.status(404).json({
                message: "Leave not found"
            });
        }

        res.json({
            message: "Leave status updated",
            leave
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
