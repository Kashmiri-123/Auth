const User = require("../models/user");
const { check, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');//for tokenization
var expressJwt = require('express-jwt');//cookies
const { OAuth2Client } = require('google-auth-library');
const sgMail = require('@sendgrid/mail');

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
    let checker = req.profile && req.auth && req.profile._id == req.auth._id;

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


// Google Login
const client = new OAuth2Client(process.env.GOOGLE_CLIENT);

exports.googleController = (req, res) => {
  // console.log("okay...")
  const { idToken } = req.body;
  
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT })
    .then(response => {
      // console.log('GOOGLE LOGIN RESPONSE',response)

      const { email_verified, name, email } = response.payload;

      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d'
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                // console.log('ERROR GOOGLE LOGIN ON USER SAVE', err);
                return res.status(400).json({
                  error: 'User signup failed with google'
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role }
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: 'Google login failed. Try again'
        });
      }
    }).catch(error => res.status(400).json({
        error: 'Google login failed. Try again'
      }))
};



exports.handleEmailService = (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const OTP = Math.floor(Math.random()*9999999);

  const email = {
      to: 'kmmonimahanta@gmail.com',
      from: 'kmonimahanta@gmail.com',
      subject: 'SUBJECT',
      text: 'Here is your OTP : ' + String(OTP),
      html: '<strong>From Katlic</strong> <br> <p>This a a mail</p>',
  };

  try {
      sgMail.send(email);
      res.status(200).json({
          "success" : "Email Sent Sucessfully"
      })
  } catch (error) {
      res.status(500).json({
          error : error
      })
  }
}



//customed middlewares
exports.forgotPasswordValidator = [
  check('email')
      .not()
      .isEmpty()
      .isEmail()
      .withMessage('Must be a valid email address')
];

exports.forgotPasswordController = (req, res) => {
  const { email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({
      errors: firstError
    });
  } else {
    User.findOne({ email},
      (err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: 'User with that email does not exist! Please signup.'
          });
        }
        
        const token = jwt.sign({ _id: user._id },
           process.env.SECRET,
          {
            expiresIn: '10m'
          }
        );

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const emailData = {
          from: "kmonimahanta@gmail.com",
          to: email,
          subject: `Password Reset link`,
          html: `
                    <h1>Please use the following link to reset your password</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    <hr />
                    <p>This email may contain sensetive information</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
        };

        return user.updateOne(
          {
            resetPasswordLink: token
          },
          (err, success) => {
            if (err) {
              
              return res.status(400).json({
                error:
                  'Database connection error on user password forgot request'
              });
            } 
            else 
            {
              sgMail.send(emailData)
                .then(sent => {
                  
                  return res.json({
                    message: `Email has been sent to ${email}. Follow the instruction to activate your account`
                  });
                })
                .catch(err => {
                  
                  return res.json({
                    message: err.message
                  });
                });
            }
          }
        );
      }
    );
  }
};