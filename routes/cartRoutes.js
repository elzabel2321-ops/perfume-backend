const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addToCart,
    getCart,
    removeFromCart
} = require("../controllers/cartController");


// TEST ROUTE
router.get("/test", (req, res) => {
    res.json({
        message: "Cart route working"
    });
});


// Add Cart
router.post(
    "/",
    protect,
    addToCart
);


// Get Cart
router.get(
    "/",
    protect,
    getCart
);


// Remove
router.delete(
    "/:productId",
    protect,
    removeFromCart
);


module.exports = router;