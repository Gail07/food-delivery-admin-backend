// Donne le rôle admin à un compte existant.
// Usage : node scripts/createAdmin.js email@exemple.com
// (le compte doit d'abord avoir été créé via l'inscription du site)
import 'dotenv/config'
import dns from "dns";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";

// Même contournement DNS que server.js : certains réseaux bloquent les requêtes SRV de mongodb+srv://
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
    console.error("Usage: node scripts/createAdmin.js <email>");
    process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const user = await userModel.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after" });
console.log(user ? `${user.email} est maintenant admin.` : `Aucun compte avec l'email ${email}.`);
await mongoose.disconnect();
