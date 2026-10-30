import express from "express"
import { requireAuth, requireAdmin } from "../middleware/auth.js"
import { placeOrder, cancelOrder, userOrders, listOrders, updateOrderStatus } from "../controllers/orderController.js"
import { paymentLimiter } from "../middleware/rateLimit.js"


const orderRouter = express.Router();

// La validation du paiement se fait uniquement par le webhook Stripe (voir server.js)
orderRouter.post("/place",requireAuth,paymentLimiter,placeOrder);
orderRouter.post("/cancel",requireAuth,cancelOrder);
orderRouter.post("/userorders",requireAuth,userOrders)
orderRouter.get("/list",requireAuth,requireAdmin,listOrders)
orderRouter.post("/status",requireAuth,requireAdmin,updateOrderStatus)

export default orderRouter;
