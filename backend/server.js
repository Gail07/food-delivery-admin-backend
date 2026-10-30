import 'dotenv/config'
import express from "express"
import cors from "cors"
import helmet from "helmet"
import multer from "multer"
import { connectDB } from "./config/db.js"
import { uploadDirectory } from "./config/uploadDirectory.js"
import dns from "dns";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { stripeWebhook } from "./controllers/orderController.js";

dns.setServers(["8.8.8.8"]);

// Refuse de démarrer sans les secrets indispensables (ou avec un JWT_SECRET trop court)
const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters long");
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

// Origines autorisées : FRONTEND_URL, ADMIN_URL et éventuellement CORS_ORIGINS (liste séparée par des virgules)
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    ...(process.env.CORS_ORIGINS || "").split(","),
    ...(isProduction ? [] : ["http://localhost:5173", "http://localhost:5174"])
].map((o) => o?.trim()).filter(Boolean);

// app config
const app = express()
const port = process.env.PORT || 4000

app.disable("x-powered-by")
// Render place l'API derrière un proxy : nécessaire pour que la limitation par IP voie la vraie IP
app.set("trust proxy", 1)

// middleware
app.use(helmet({
    // les images du menu sont affichées par le front et l'admin, hébergés sur d'autres domaines
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "token"]
}))

// Le webhook Stripe a besoin du corps brut pour vérifier la signature : déclaré AVANT express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook)

app.use(express.json({ limit: "100kb" }))

// db connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static(uploadDirectory, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff")
}))
app.use('/api/user',userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)

app.get("/",(req,res)=>{
    res.send("API Working")
})

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Not found" })
})

// Gestionnaire d'erreurs : jamais de pile d'appels renvoyée au client
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: "Invalid upload" })
    }
    if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
        return res.status(400).json({ success: false, message: "Invalid request body" })
    }
    console.error("Unhandled error:", err.message)
    res.status(500).json({ success: false, message: "Error" })
})

app.listen(port,()=>{
    console.log(`Server Started on port ${port}`)
})
