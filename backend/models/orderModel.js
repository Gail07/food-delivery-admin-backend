import mongoose from "mongoose"

export const ORDER_STATUSES = ["Food Processing", "Out for delivery", "Delivered"];

const orderItemSchema = new mongoose.Schema({
    foodId:{type:mongoose.Schema.Types.ObjectId,ref:"food",required:true},
    name:{type:String,required:true},
    price:{type:Number,required:true},
    quantity:{type:Number,required:true,min:1}
},{_id:false})

const addressSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    email:String,
    street:String,
    city:String,
    state:String,
    zipcode:String,
    country:String,
    phone:String
},{_id:false})

const orderSchema = new mongoose.Schema({
    userId:{type:String,required:true,index:true},
    items:{type:[orderItemSchema],required:true},
    amount:{type:Number,required:true},
    address:{type:addressSchema,required:true},
    status:{type:String,enum:ORDER_STATUSES,default:"Food Processing"},
    // Date.now sans parenthèses : évalué à chaque commande, pas au démarrage du serveur
    date:{type:Date,default:Date.now},
    payment:{type:Boolean,default:false},
    stripeSessionId:{type:String},
    paidAt:{type:Date}
})

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema);

export default orderModel;
