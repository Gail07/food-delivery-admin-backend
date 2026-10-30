// Chargé en tout premier par server.js : vérifie la configuration avant que
// les autres modules (Stripe, MongoDB...) ne s'initialisent.
import 'dotenv/config'

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];

const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters long");
    process.exit(1);
}
