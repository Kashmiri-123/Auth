const mongoose = require("mongoose")


var categorySchema = new mongoose.Schema({
    name : {
        type : String,
        trime : true,
        required : true,
        maxlength : 32,
        unique : true

    }
 },

    {timestamps:true}

 )



module.exports = mongoose.model("Category", categorySchema)