const express=require('express');
const Product=require('../models/Product');
const {protect,admin}=require('../middleware/authMiddleware');
const router=express.Router();
//route GET/api/admin/products
//desc get all products
//access private/admin
router.get('/',protect,admin,async(req,res)=>{
    try {
        const products=await Product.find({});
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
        
    }
});

//route POST/api/admin/products
//desc create a new product
//access private/admin
router.post('/',protect,admin,async(req,res)=>{
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:error.message || "Server Error",error:error});
    }
});

//route PUT/api/admin/products/:id
//desc update a product
//access private/admin
router.put('/:id',protect,admin,async(req,res)=>{
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true,runValidators:true}
        );
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({message:"Validation Error", errors: messages});
        }
        res.status(500).json({message:error.message || "Server Error", error: process.env.NODE_ENV === 'development' ? error : {}});
    }
});

//route DELETE/api/admin/products/:id
//desc delete a product
//access private/admin
router.delete('/:id',protect,admin,async(req,res)=>{
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        res.json({message:"Product deleted successfully",product});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:error.message || "Server Error",error:error});
    }
});

module.exports=router;