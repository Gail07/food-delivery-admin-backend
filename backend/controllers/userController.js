import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'

const INVALID_LOGIN = "Invalid email or password";

const createToken = (user) => {
    return jwt.sign(
        { id: String(user._id), role: user.role || "user" },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    )
}

const readCredentials = (body) => {
    const { email, password } = body || {};
    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) {
        return null;
    }
    return { email: email.trim().toLowerCase(), password };
}

// Vérifie email + mot de passe ; même réponse que l'email existe ou non
const checkLogin = async (req) => {
    const credentials = readCredentials(req.body);
    if (!credentials) return null;
    const user = await userModel.findOne({ email: credentials.email }).select("+password");
    if (!user) return null;
    const isMatch = await bcrypt.compare(credentials.password, user.password);
    return isMatch ? user : null;
}

//login user
const loginUser = async (req,res) => {
    try {
        const user = await checkLogin(req);
        if (!user) {
            return res.status(401).json({success:false,message:INVALID_LOGIN})
        }
        res.json({success:true,token:createToken(user)})
    } catch (error) {
        console.error("loginUser:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

// login réservé au panneau admin
const loginAdmin = async (req,res) => {
    try {
        const user = await checkLogin(req);
        if (!user || user.role !== "admin") {
            return res.status(401).json({success:false,message:INVALID_LOGIN})
        }
        res.json({success:true,token:createToken(user)})
    } catch (error) {
        console.error("loginAdmin:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

//register user
const registerUser = async (req,res) => {
    try {
        const credentials = readCredentials(req.body);
        const name = req.body?.name;
        if (!credentials || typeof name !== "string" || !name.trim() || name.length > 100) {
            return res.status(400).json({success:false,message:"Invalid input"})
        }
        const { email, password } = credentials;

        // validating email format & strong password
        if (!validator.isEmail(email)){
            return res.status(400).json({success:false,message:"Please enter a valid email"})
        }

        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({success:false,message:"Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"})
        }

        // checking is user already exists
        const exists = await userModel.exists({email})
        if (exists) {
            return res.status(409).json({success:false,message:"User already exists"})
        }

        // hashing user password
        const hashedPassword = await bcrypt.hash(password, 12);

        // champs choisis un par un : impossible de s'attribuer un rôle
        const user = await userModel.create({
            name:name.trim(),
            email,
            password:hashedPassword
        })

        res.status(201).json({success:true,token:createToken(user)})
    } catch (error){
        console.error("registerUser:", error.message);
        res.status(500).json({success:false,message:"Error"})
    }
}

export {loginUser,loginAdmin,registerUser}
