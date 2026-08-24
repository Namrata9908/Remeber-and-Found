const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Item = require("../models/Item");

const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id.toString(),
            name: user.name,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email
});

const register = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            passwordHash
        });

        // Migration support:
        // Items created before login/register existed do not have userId.
        // The first registered account becomes the owner of those legacy items.
        const legacyCount = await Item.countDocuments({
            userId: { $exists: false }
        });

        if (legacyCount > 0) {
            await Item.updateMany(
                { userId: { $exists: false } },
                { $set: { userId: user._id } }
            );
            console.log(`Assigned ${legacyCount} legacy item(s) to ${email}.`);
        }

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            data: {
                token,
                user: publicUser(user)
            }
        });
    } catch (error) {
        console.error("Register error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create account."
        });
    }
};

const login = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = createToken(user);

        return res.json({
            success: true,
            message: "Login successful.",
            data: {
                token,
                user: publicUser(user)
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
};

const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "_id name email createdAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account no longer exists."
            });
        }

        return res.json({
            success: true,
            data: {
                user: publicUser(user)
            }
        });
    } catch (error) {
        console.error("Me error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load your account."
        });
    }
};

module.exports = {
    register,
    login,
    me
};
