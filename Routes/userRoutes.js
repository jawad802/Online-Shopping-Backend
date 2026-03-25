const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const generateToken = require("../utiles/generateToken");

const router = express.Router();
//@route POST /api/users/register
//Register a new user
//access public

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    //Registration logic

    let user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "User Already Exists" });
    user = new User({ name, email, password });
    await user.save();
    //create a json web token payload
    const payload = { user: { id: user._id, role: user.role } };
    //sign and return the token along with us
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
      (err, token) => {
        if (err) throw err;

        //send user and token in response
        res.status(201).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            
          },
          token,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
});







//@route POST /api/users/login
//Authenticate user
//@Access Public

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    //Find the user by email
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });
    //create a json web token payload
    const payload = { user: { id: user._id, role: user.role } };
    //sign and return the token along with us
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
      (err, token) => {
        if (err) throw err;

        //send user and token in response
        res.json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
           
          },
          token,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});






//@route GET /api/user/profile
//desc Get logged in user profile(protected route)
//@access private
router.get("/profile",protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
