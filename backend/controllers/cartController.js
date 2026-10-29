import mongoose from "mongoose"
import userModel from "../models/userModel.js"

const MAX_QTY = 50;

// itemId doit être un identifiant MongoDB valide : bloque les clés arbitraires (__proto__, $set...)
const readItemId = (req, res) => {
    const itemId = req.body?.itemId;
    if (typeof itemId !== "string" || !mongoose.isValidObjectId(itemId)) {
        res.status(400).json({success:false,message:"Invalid item"});
        return null;
    }
    return itemId;
}

// add items to user cart
const addToCart = async (req,res) => {
    try {
        const itemId = readItemId(req, res);
        if (!itemId) return;
        const userData = await userModel.findById(req.user.id);
        if (!userData) return res.status(404).json({success:false,message:"User not found"});
        const cartData = { ...userData.cartData };
        cartData[itemId] = Math.min((cartData[itemId] || 0) + 1, MAX_QTY);
        await userModel.findByIdAndUpdate(req.user.id,{cartData});
        res.json({success:true,message:"Added To Cart"});
    } catch (error) {
        console.error("addToCart:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}


//remove items from user cart
const removeFromCart = async (req,res) => {
    try {
        const itemId = readItemId(req, res);
        if (!itemId) return;
        const userData = await userModel.findById(req.user.id);
        if (!userData) return res.status(404).json({success:false,message:"User not found"});
        const cartData = { ...userData.cartData };
        if (cartData[itemId] > 0) {
            cartData[itemId] -= 1;
        }
        await userModel.findByIdAndUpdate(req.user.id,{cartData});
        res.json({success:true,message:"Removed From Cart"})
    } catch (error) {
        console.error("removeFromCart:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// fetch user cart data
const getCart = async (req,res) => {
    try {
        const userData = await userModel.findById(req.user.id);
        if (!userData) return res.status(404).json({success:false,message:"User not found"});
        res.json({success:true,cartData:userData.cartData})
    } catch (error) {
        console.error("getCart:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

export {addToCart,removeFromCart,getCart}
