const express=require("express");
const CheckOut=require("../models/CheckOut");
const Cart=require("../models/Cart");
const Product=require("../models/Product");
const Order=require("../models/Order");
const {protect}=require("../middleware/authMiddleware");
const router=express.Router();
//route post/api/checkout
//create a new checkout session 
//access private
router.post("/",protect,async(req,res)=>{
    const{checkoutItems,shippingAddress,paymentMethod,totalPrice}=req.body;
    if(!checkoutItems ||checkoutItems.length===0){
        return res.status(400).json({message:"No checkout items"});
    }
    try {
        // Normalize shipping address - handle both 'address' and 'street' fields
        const normalizedShippingAddress = {
            street: shippingAddress.street || shippingAddress.address || "",
            city: shippingAddress.city || "",
            postalCode: shippingAddress.postalCode || "",
            country: shippingAddress.country || "",
        };
        
        //create new checkout session
        const newCheckout=await CheckOut.create({
            user:req.user._id,
            checkoutItems:checkoutItems,
            shippingAddress: normalizedShippingAddress,
            paymentMethod,
            totalPrice,
            paymentStatus:"pending",
            isPaid:false,
         
        });
        console.log(`Checkout created for user:${req.user._id}`);
        res.status(201).json(newCheckout);
    } catch (error) {
        console.log("Error creating checkout session:",error);
        res.status(500).json({message:"Server error"});
    }
});
//route PUT/api/checkout/:id/pay
//update checkout to paid
//access private
router.put("/:id/pay",protect,async(req,res)=>{
    const {paymentStatus,paymentDetails,paymentMethod}=req.body;
    try {
        const checkoutSession=await CheckOut.findById(req.params.id);
        if(!checkoutSession){
         return res.status(404).json({message:"Checkout not found"});

        }
        if(paymentStatus==="paid"){
            checkoutSession.isPaid=true;
            checkoutSession.paymentStatus="paid";
            checkoutSession.paymentDetails=paymentDetails;
            // Update payment method if provided
            if(paymentMethod){
                checkoutSession.paymentMethod=paymentMethod;
            }
            checkoutSession.paidAt=Date.now();
            await checkoutSession.save();
            res.status(200).json(checkoutSession);
        }else{
            res.status(400).json({message:"Invalid payment status"});
        }
    } catch (error) {
        console.log("Error updating payment status:",error);
        res.status(500).json({message:"Server error"}); 
    }
});
//route POST/api/checkout/:id/finalize
//finalize order
//access private
router.post("/:id/finalize",protect,async(req,res)=>{
    try {
        const checkoutSession=await CheckOut.findById(req.params.id);
        if(!checkoutSession){
            return res.status(404).json({message:"Checkout not found"});
        }
        if(checkoutSession.isPaid&&!checkoutSession.isFinalized){
            //create new order
            const finalOrder=await Order.create({
                user:checkoutSession.user,
                orderItems:checkoutSession.checkoutItems,
                shippingAddress:checkoutSession.shippingAddress,
                paymentMethod:checkoutSession.paymentMethod,
                totalPrice:checkoutSession.totalPrice,
                isPaid:true,
                paidAt:checkoutSession.paidAt,
                isDelivered:false,
                paymentStatus:"paid",
                paymentDetails:checkoutSession.paymentDetails,
            });
            //mark checkout as finalized
            checkoutSession.isFinalized=true;
            checkoutSession.finalizedAt=Date.now();
            await checkoutSession.save();
            //delete user's cart
            await Cart.findOneAndDelete({user:checkoutSession.user});
            res.status(201).json(finalOrder);
        }else if(checkoutSession.isFinalized){
            res.status(400).json({message:"Order already finalized"});
        }else{
            res.status(400).json({message:"Payment not completed"});
        }
    } catch (error) {
        console.log("Error finalizing order:",error);
        res.status(500).json({message:"Server error"});
        
    }

});
module.exports=router;

