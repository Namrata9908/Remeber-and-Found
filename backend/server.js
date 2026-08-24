const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const itemRoutes = require("./src/routes/itemRoutes");
const healthRoutes = require("./src/routes/healthRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const uploadDirectory = path.join(__dirname, "uploads");

// Create uploads directory if it does not exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Check JWT secret
if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing in backend/.env");
    process.exit(1);
}

// ===============================
// CORS CONFIGURATION
// ===============================

const allowedOrigins = [
    "https://remeber-and-found-1.onrender.com",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin
            // (Postman, server-to-server requests, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`CORS policy blocked this origin: ${origin}`)
            );
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(uploadDirectory));

// ===============================
// ROUTES
// ===============================

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Lost & Found API is running.",
        endpoints: {
            auth: "/api/auth",
            items: "/api/items",
            health: "/api/health"
        }
    });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((error, req, res, next) => {
    console.error("SERVER ERROR:", error);

    if (error instanceof multer.MulterError) {
        const message =
            error.code === "LIMIT_FILE_SIZE"
                ? "Image size should be less than 5 MB."
                : error.message;

        return res.status(400).json({
            success: false,
            message
        });
    }

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Internal server error."
        });
    }

    return next();
});

// ===============================
// START SERVER
// ===============================

const startServer = async () => {
    if (!MONGODB_URI) {
        console.error("MONGODB_URI is missing in backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();