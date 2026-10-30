import jwt from "jsonwebtoken"

// Vérifie le jeton JWT envoyé dans l'en-tête "token" et expose l'utilisateur dans req.user.
// L'identité ne vient jamais du corps de la requête.
export const requireAuth = (req, res, next) => {
    const { token } = req.headers;
    if (!token || typeof token !== "string") {
        return res.status(401).json({ success: false, message: "Not Authorized Login Again" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        req.user = { id: String(decoded.id), role: decoded.role || "user" };
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Not Authorized Login Again" })
    }
}

// À placer après requireAuth : réserve la route aux comptes admin.
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden" })
    }
    next();
}

export default requireAuth;
