const express = require("express");

const {
    createItem,
    getSummary,
    getItems,
    getItem,
    updateItem,
    deleteItem
} = require("../controllers/itemController");

const requireAuth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", getSummary);
router.get("/", getItems);
router.get("/:id", getItem);

router.post("/", upload.single("image"), createItem);
router.put("/:id", upload.single("image"), updateItem);
router.delete("/:id", deleteItem);

module.exports = router;
