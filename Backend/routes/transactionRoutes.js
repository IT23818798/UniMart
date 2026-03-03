const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

const transactionController = require("../controllers/transactionController");

// CREATE transaction
router.post("/", async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET all transactions
router.get("/", async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/:id", transactionController.getTransactionById);
router.put("/:id", transactionController.updateTransaction);  // UPDATE
router.delete("/:id", transactionController.deleteTransaction);//delete

module.exports = router;
