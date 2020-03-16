const mongoose = require("mongoose")
const crypto = require("crypto");
const uuidv1 = require("uuid/v1");

var userSchema = new mongoose.Schema({

name : {
    type : String,
    required : true,
    maxlength : 32,
    trim : true
},

lastName : {
    type : String,
    maxlength : 32,
    trim : true
},

email : {
    type : String,
    trim : true,
    required : true,
    unique : true
},

encrypt_password: {
    type : String,
    required : true
},

salt : String,

role :{
    type : Number,
    default : 0
},

purchases : {
    type : Array,
    default: []
}, 

userInfo : {
    type : String,
    trim : true
},


});

userSchema.virtual("password")
    .set(function(password)
    {
        this._password = password //privately secured
        this.salt = uuidv1();
        this.encrypt_password =  this.securePassword(password);
    })
    .get(function()
    {
        return this._password
    })


userSchema.methods = {


    authenticate : function(planepassword){
        return this.securePassword(planepassword) === this.encrypt_password ? true : false;
    },


    securePassword : function(planepassword)
    {
        if (!planepassword) return "";

        try{

            return crypto.createHmac('sha256', this.salt)
            .update(planepassword)
            .digest("hex");

        } catch(err)
        {
            return "";
        }
    }
}


module.exports = mongoose.model("User", userSchema)