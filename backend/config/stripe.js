import Stripe from "stripe";
import "dotenv/config";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Les prix en base sont en dollars ; Stripe facture en roupies (INR) avec un taux fixe.
export const CURRENCY = "inr";
export const USD_TO_INR = 80;
export const DELIVERY_FEE = 2;

// Montant en plus petite unité (paise) pour Stripe
export const toStripeAmount = (usd) => Math.round(usd * 100 * USD_TO_INR);
