const express=require('express');
const Order=require("../models/Order");
const {protect}=require("../middleware/authMiddleware");
const router=express.Router();
//route GET/api/orders/my-orders
//desc get login user orders
//access private
router.get('/my-orders',protect,async(req,res)=>{
    try {
        //find orders for authorize user
        const orders=await Order.find({user:req.user._id}).sort({
            createdAt:-1
        });
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
});
//routes GET /api/orders/:id
//desc get order by id
//access private
router.get('/:id',protect,async(req,res)=>{
    try {
        const orders=await Order.findById(req.params.id).populate(
            "user",
            "name email"
        );
        if(!orders){
            return res.status(404).json({message:"Order not found"});

        }
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Server Error"});
        
        
    }
});
module.exports=router;
