import mongoose from "mongoose";
import orderModel, { ORDER_STATUSES } from "../models/orderModel.js";
import userModel from '../models/userModel.js'
import foodModel from "../models/foodModel.js";
import { stripe, CURRENCY, DELIVERY_FEE, toStripeAmount } from "../config/stripe.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ADDRESS_FIELDS = ["firstName","lastName","email","street","city","state","zipcode","country","phone"];
const MAX_QTY = 50;

// Ne garde que les champs d'adresse attendus, en chaînes de longueur bornée
const cleanAddress = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const address = {};
    for (const field of ADDRESS_FIELDS) {
        const value = raw[field];
        if (typeof value !== "string" || !value.trim() || value.length > 200) return null;
        address[field] = value.trim();
    }
    return address;
}

// placing user order for frontend
// Le client n'envoie que des identifiants de plats et des quantités :
// les noms et les prix sont toujours relus en base.
const placeOrder = async (req,res) =>{
    try {
        const cart = req.body.items;
        const address = cleanAddress(req.body.address);
        if (!Array.isArray(cart) || cart.length === 0 || cart.length > 100 || !address) {
            return res.status(400).json({success:false,message:"Invalid order"})
        }

        const requested = new Map();
        for (const entry of cart) {
            const id = String(entry?._id ?? "");
            const qty = Number(entry?.quantity);
            if (!mongoose.isValidObjectId(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
                return res.status(400).json({success:false,message:"Invalid order"})
            }
            requested.set(id, (requested.get(id) || 0) + qty);
        }

        // mongoose.trusted : opérateur écrit par nous, pas neutralisé par sanitizeFilter (ids déjà validés)
        const foods = await foodModel.find({ _id: mongoose.trusted({ $in: [...requested.keys()] }) });
        if (foods.length !== requested.size) {
            return res.status(400).json({success:false,message:"Some items are no longer available"})
        }

        const items = foods.map((food) => ({
            foodId: food._id,
            name: food.name,
            price: food.price,
            quantity: requested.get(String(food._id))
        }));
        const amount = items.reduce((sum, i) => sum + i.price * i.quantity, 0) + DELIVERY_FEE;

        const newOrder = await orderModel.create({
            userId: req.user.id,
            items,
            amount,
            address
        });

        const line_items = items.map((item)=>({
            price_data:{
                currency:CURRENCY,
                product_data:{ name:item.name },
                unit_amount:toStripeAmount(item.price)
            },
            quantity:item.quantity
        }))

        line_items.push({
            price_data:{
                currency:CURRENCY,
                product_data:{ name:"Delivery Charges" },
                unit_amount:toStripeAmount(DELIVERY_FEE)
            },
            quantity:1
        })

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode:'payment',
            client_reference_id:String(newOrder._id),
            metadata:{ orderId:String(newOrder._id), userId:String(req.user.id) },
            success_url:`${FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
        })

        newOrder.stripeSessionId = session.id;
        await newOrder.save();

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.error("placeOrder:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// Webhook Stripe : seule source de vérité pour le paiement.
// Monté dans server.js avec express.raw() AVANT express.json().
const stripeWebhook = async (req,res) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Stripe webhook signature error:", error.message);
        return res.status(400).send("Invalid signature");
    }

    try {
        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
            const session = event.data.object;
            if (session.payment_status === "paid") {
                const { orderId, userId } = session.metadata || {};
                // Le filtre payment:false rend le traitement idempotent (événement rejoué = aucun effet)
                const order = await orderModel.findOneAndUpdate(
                    { _id: orderId, userId, stripeSessionId: session.id, payment: false },
                    { payment: true, paidAt: new Date() },
                    { returnDocument: "after" }
                );
                if (order) {
                    await userModel.findByIdAndUpdate(userId, { cartData: {} });
                }
            }
        } else if (event.type === "checkout.session.expired") {
            const session = event.data.object;
            await orderModel.deleteOne({ _id: session.metadata?.orderId, stripeSessionId: session.id, payment: false });
        }
        res.json({ received: true });
    } catch (error) {
        console.error("Stripe webhook handling error:", error.message);
        res.status(500).json({ received: false });
    }
}

// Paiement annulé par le client : on supprime SA commande, seulement si elle n'est pas payée
const cancelOrder = async (req,res) => {
    try {
        const { orderId } = req.body;
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({success:false,message:"Invalid order"})
        }
        await orderModel.deleteOne({ _id: orderId, userId: req.user.id, payment: false });
        res.json({success:true,message:"Order cancelled"})
    } catch (error) {
        console.error("cancelOrder:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.user.id}).sort({date:-1});
        res.json({success:true,data:orders})
    } catch (error) {
        console.error("userOrders:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// Listing orders for admin panel (commandes payées uniquement)
const listOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({payment:true}).sort({date:-1});
        res.json({success:true,data:orders})
    } catch (error) {
        console.error("listOrders:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// api for updating order status for admin panel
const updateOrderStatus = async (req,res) => {
    try {
        const { orderId, status } = req.body;
        if (!mongoose.isValidObjectId(orderId) || !ORDER_STATUSES.includes(status)) {
            return res.status(400).json({success:false,message:"Invalid status"})
        }
        await orderModel.findByIdAndUpdate(orderId,{status});
        res.json({success:true,message:"Status Updated"})
    }catch (error) {
        console.error("updateOrderStatus:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}


export {placeOrder,stripeWebhook,cancelOrder,userOrders,listOrders,updateOrderStatus}
