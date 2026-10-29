import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name:{type:String,required:true,trim:true,maxlength:100},
    email:{type:String,required:true,unique:true,lowercase:true,trim:true},
    // Jamais renvoyé par défaut dans les requêtes
    password:{type:String,required:true,select:false},
    // Jamais modifiable via l'API : se définit avec scripts/createAdmin.js
    role:{type:String,enum:['user','admin'],default:'user'},
    cartData:{type:Object,default:{}}
},{minimize:false})

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
