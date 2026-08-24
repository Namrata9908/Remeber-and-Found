const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

itemSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Item", itemSchema);
