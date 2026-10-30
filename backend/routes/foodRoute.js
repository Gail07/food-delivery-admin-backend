import express from 'express';
import crypto from 'node:crypto';
import { addFood,listFood,removeFood } from '../controllers/foodController.js';
import multer from 'multer';
import { uploadDirectory } from '../config/uploadDirectory.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const foodRouter = express.Router();

// Types d'images acceptés et extension imposée par le serveur
const ALLOWED_IMAGES = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp'
};

const storage = multer.diskStorage({
    destination: uploadDirectory,
    // Nom aléatoire : le nom d'origine envoyé par le client n'est jamais utilisé
    filename:(req,file,cb)=> cb(null, `${crypto.randomUUID()}${ALLOWED_IMAGES[file.mimetype]}`)
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10 },
    fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED_IMAGES[file.mimetype]))
})

foodRouter.post("/add",requireAuth,requireAdmin,upload.single("image"),addFood)
foodRouter.get("/list",listFood)
foodRouter.post("/remove",requireAuth,requireAdmin,removeFood);


export default foodRouter;
