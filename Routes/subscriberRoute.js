const express=require('express');
const Subscriber=require("../models/Subscriber");
const router=express.Router();
//route POST/api/subscribers
//desc add a new subscriber
//access public
router.post("/subscribe",async(req,res)=>{
    const{email}=req.body;
    if(!email){
        return res.status(400).json({message:"Email is required"});
    }
    try {
        //if email is already subscribed
        let subscriber=await Subscriber.findOne({

        });
        if(subscriber){
            return res.status(400).json({message:"Email is already subscribed"});
        }
        //create a new subscriber
        subscriber=new Subscriber({email});
        await subscriber.save();
        res.status(201).json({message:"Subscribed successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
        
    }
});
module.exports=router;