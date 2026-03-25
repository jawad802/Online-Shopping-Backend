const jwt = require("jsonwebtoken");
const User = require("../models/User");
//middleware to protect routes
const protect = async (req,res,next)=>{
    let token;
     const auth = req.headers.authorization;
  if (auth && typeof auth === "string" && auth.startsWith("Bearer")){
        try {
            token=req.headers.authorization.split(" ")[1];
            const decoded=jwt.verify(token,process.env.JWT_SECRET);
            req.user = await User.findById(decoded.user.id).select("-password");//Exclude password
            next();
        } catch (error) {
            console.log("Token verification failed:",error);
            res.status(401).json({message:"Not Authorize, token failed"});    
        }
    }else{
        res.status(401).json({message:"Not Authorize , no token Provided"})
    }
};
//middleware is to check is admin
const admin = (req,res,next)=>{
    if (req.user && req.user.role ==="admin"){
        next();
    }else{
        res.status(403).json({message:"Not Authorize as an admin"});
    }   
};


module.exports={protect,admin};