const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");


exports.createTransaction = async (req, res) => {
    try {
        console.log(req.body);
        
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        res.status(500).json(err);
    }
};

// GET transaction by ID

exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        // ID format eka check karanawa
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json(transaction);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Transaction ID" });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json(updatedTransaction);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE transaction
exports.deleteTransaction = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Transaction ID" });
        }

        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!deletedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({ message: "Transaction deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};