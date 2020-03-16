const User = require("../models/user");
const { check, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');//for tokenization
var expressJwt = require('express-jwt');//cookies

exports.signup = (req,res) => {

    const errors = validationResult(req);
    
    if (!errors.isEmpty()){
        return res.status(422).json({
            error : errors.array()[0].msg,
            param : errors.array()[0].param
        })
    }

    const user = new User( req.body) //object//request from frontend
    user.save((err,user) => {
        if(err)
        {
            return res.status(400).json({
                err : "Not able to save user in Db"
            })
        }

        else {
            res.json({
                id : user._id,
                name : user.name,
                email : user.email
            });
        }
    })

};


exports.signin = (req,res) =>{
    const errors = validationResult(req);
    const {email, password} =req.body;


    if (!errors.isEmpty()){
        return res.status(422).json({
            error : errors.array()[0].msg,
            param : errors.array()[0].param
        });
    }

    User.findOne({email}, (err,user) => {
        if(err || !user)
        {
            if (err){
            return res.status(400).json({
                error : "Error"
            });}

            {
                return res.status(401).json({
                    error : " User email doesnot exists."
                });  
            }
        }

        if (!user.authenticate(password))
        {
            return res.status(401).json({
                error : "Email and password donot match."
            })
        }

        const token = jwt.sign({ _id: user._id }, process.env.SECRET);//token created
        //putting tokens in cookie
        res.cookie("token", token, {expire : new Date() + 9999});

        //send request to front end

        const {_id,name , email, role } = user;
        return res.json({token, user: { _id, name, email, role}});
    });
}


exports.signout =  (req,res) => {

    res.clearCookie("token");

    res.json({
        message : "User Signed out successfully"
    });
};


//protected routes
exports.isSignedIn =  expressJwt({
    secret : process.env.SECRET,
    userProperty : "auth" //isSignedup puts this into request
})



//customed middlewares
exports.isAuthenticated = (req,res, next) => {
    let checker = req.profile && req.auth && req.profile._id === req.auth._id;

    if (!checker)
    {
         return res.status(403).json({
             error : "ACEESS DENIED"
         })
    }
    next();
}


exports.isAdmin = (req,res,next) => {
    if (req.profile.role === 0){
        return res.status(403).json({
            error: "You are not an ADMIN, ACCESS DENIED"
        })
    }

    next();
}