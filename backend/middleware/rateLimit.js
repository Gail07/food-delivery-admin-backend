import rateLimit from "express-rate-limit";

const tooMany = { success: false, message: "Too many attempts, please try again later" };

// Connexion / inscription : 10 tentatives par IP toutes les 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooMany
});

// Création de sessions de paiement : 20 par IP toutes les 15 minutes
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooMany
});
