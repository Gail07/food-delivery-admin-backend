import express from 'express'
import { loginUser,loginAdmin,registerUser } from '../controllers/userController.js'
import { authLimiter } from '../middleware/rateLimit.js'


const userRouter = express.Router()

userRouter.post('/register',authLimiter,registerUser)
userRouter.post('/login',authLimiter,loginUser)
userRouter.post('/admin/login',authLimiter,loginAdmin)

export default userRouter;
