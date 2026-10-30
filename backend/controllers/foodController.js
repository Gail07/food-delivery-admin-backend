import mongoose from 'mongoose';
import foodModel from '../models/foodModel.js';
import fs from 'fs';
import path from 'path';
import { uploadDirectory } from '../config/uploadDirectory.js';

export const CATEGORIES = ["Salad","Rolls","Deserts","Sandwich","Cake","Pure Veg","Pasta","Noodles"];

const removeUploadedFile = (filename) => {
    if (!filename) return;
    // path.basename empêche toute sortie du dossier uploads
    fs.unlink(path.join(uploadDirectory, path.basename(filename)), () => {});
}

// add food item
const addFood = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "A PNG, JPEG or WebP image (max 2 MB) is required" })
    }

    const { name, description, category } = req.body;
    const price = Number(req.body.price);
    if (typeof name !== "string" || !name.trim() || name.length > 100
        || typeof description !== "string" || !description.trim() || description.length > 1000
        || !CATEGORIES.includes(category)
        || !Number.isFinite(price) || price <= 0 || price > 10000) {
        removeUploadedFile(req.file.filename);
        return res.status(400).json({ success: false, message: "Invalid food data" })
    }

    try {
        await foodModel.create({
            name: name.trim(),
            description: description.trim(),
            category,
            price,
            image: req.file.filename
        });
        res.status(201).json({ success: true, message: "Food Added" })
    } catch (error) {
        removeUploadedFile(req.file.filename);
        console.error("addFood:", error.message)
        res.status(500).json({ success: false, message: "error" })
    }
}

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods })
    } catch (error) {
        console.error("listFood:", error.message)
        res.status(500).json({ success: false, message: "error" })
    }
}

// remove food item
const removeFood = async (req, res) => {
    try {
        const { id } = req.body;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid id" });
        }
        const food = await foodModel.findByIdAndDelete(id);
        if (!food) {
            return res.status(404).json({ success: false, message: "Food not found" });
        }
        removeUploadedFile(food.image);
        res.json({ success: true, message: "Food Removed" });
    } catch (error) {
        console.error("removeFood:", error.message);
        res.status(500).json({ success: false, message: "error" });
    }
};

export { addFood, listFood, removeFood };
