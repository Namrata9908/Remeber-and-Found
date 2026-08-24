const Item = require("../models/Item");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const removeUploadedFile = (file) => {
    if (!file?.path) return;
    fs.unlink(file.path, () => {});
};

const deleteImageFile = (imagePath) => {
    try {
        if (!imagePath || !imagePath.startsWith("/uploads/")) return;

        const filePath = path.join(
            __dirname,
            "../../",
            imagePath.replace(/^\//, "")
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error("Image delete error:", error.message);
    }
};

const isValidId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const createItem = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const category = String(req.body.category || "").trim();
        const location = String(req.body.location || "").trim();
        const description = String(req.body.description || "").trim();

        if (!name || !category || !location) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Name, category and location are required."
            });
        }

        const item = await Item.create({
            userId: req.user.id,
            name,
            category,
            location,
            description,
            image: req.file
                ? `/uploads/${req.file.filename}`
                : ""
        });

        return res.status(201).json({
            success: true,
            message: "Item added successfully.",
            data: item
        });
    } catch (error) {
        removeUploadedFile(req.file);

        console.error("Create item error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create item."
        });
    }
};

const getSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [totalItems, categoryResult, locationResult] =
            await Promise.all([
                Item.countDocuments({ userId }),

                Item.aggregate([
                    { $match: { userId } },
                    {
                        $group: {
                            _id: {
                                $toLower: {
                                    $trim: { input: "$category" }
                                }
                            }
                        }
                    },
                    { $count: "count" }
                ]),

                Item.aggregate([
                    { $match: { userId } },
                    {
                        $group: {
                            _id: {
                                $toLower: {
                                    $trim: { input: "$location" }
                                }
                            }
                        }
                    },
                    { $count: "count" }
                ])
            ]);

        return res.json({
            success: true,
            data: {
                totalItems,
                totalCategories: categoryResult[0]?.count || 0,
                totalLocations: locationResult[0]?.count || 0
            }
        });
    } catch (error) {
        console.error("Summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard summary."
        });
    }
};

const getItems = async (req, res) => {
    try {
        const filter = {
            userId: req.user.id
        };

        const search = String(req.query.search || "").trim();

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

            filter.$or = [
                { name: regex },
                { category: regex },
                { location: regex },
                { description: regex }
            ];
        }

        const items = await Item.find(filter)
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error("Get items error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch items."
        });
    }
};

const getItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const item = await Item.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        return res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error("Get item error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch item."
        });
    }
};

const updateItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const item = await Item.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!item) {
            removeUploadedFile(req.file);

            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        const name = String(req.body.name || "").trim();
        const category = String(req.body.category || "").trim();
        const location = String(req.body.location || "").trim();
        const description = String(req.body.description || "").trim();

        if (!name || !category || !location) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Name, category and location are required."
            });
        }

        const oldImage = item.image;

        item.name = name;
        item.category = category;
        item.location = location;
        item.description = description;

        if (req.file) {
            item.image = `/uploads/${req.file.filename}`;
        }

        await item.save();

        if (req.file && oldImage) {
            deleteImageFile(oldImage);
        }

        return res.json({
            success: true,
            message: "Item updated successfully.",
            data: item
        });
    } catch (error) {
        removeUploadedFile(req.file);

        console.error("Update item error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update item."
        });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const item = await Item.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        await Item.deleteOne({
            _id: id,
            userId: req.user.id
        });

        if (item.image) {
            deleteImageFile(item.image);
        }

        return res.json({
            success: true,
            message: "Item deleted successfully.",
            data: item
        });
    } catch (error) {
        console.error("Delete item error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete item."
        });
    }
};

module.exports = {
    createItem,
    getSummary,
    getItems,
    getItem,
    updateItem,
    deleteItem
};
