var express = require('express')
var router = express.Router()
const { check, validationResult } = require('express-validator');

const {signout, googleController} = require("../controllers/auth")
const {signup,signin,isSignedIn, handleEmailService} = require("../controllers/auth")

router.post("/signup", 
    [//middleware
        check("name", "Name should be atleast 3 characters").isLength({min : 3 }),
        check("email", "email is required").isEmail(),
        check("password","Password should be atleast 3 characters").isLength({min : 3 })
    ]
,signup);

router.post("/signin",
    [
        check("email", "email is required").isEmail(),
        check("password","password field is required").isLength({min : 3})
    ],signin
)

router.get("/signout",signout);

router.get("/testroute", isSignedIn,(req,res) => {
    res.json(req.auth); //userProperty : "auth"
})

//google login
router.post("/googlelogin", googleController)

router.get("/email", handleEmailService)


module.exports = router;