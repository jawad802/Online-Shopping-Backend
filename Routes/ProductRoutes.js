const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const router = express.Router();

//@route POST /api/products
//Create a new product
//Access Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      countInStock,
      brand,
      discountPrice,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      countInStock,
      brand,
      discountPrice,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server Error" });
  }
});

//routes PUT /api/products/:id
//Update a product
//Access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      countInStock,
      brand,
      discountPrice,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;
    //find product by id
    const product = await Product.findById(req.params.id);
    if (product) {
      //update product fields
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.countInStock = countInStock || product.countInStock;
      product.brand = brand || product.brand;
      product.discountPrice = discountPrice || product.discountPrice;
      product.sizes = sizes || product.sizes;
      product.colors = colors || product.colors;
      product.collections = collections || product.collections;
      product.material = material || product.material;
      product.gender = gender || product.gender;
      product.images = images || product.images;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished =
        isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags || product.tags;
      product.dimensions = dimensions || product.dimensions;
      product.weight = weight || product.weight;
      product.sku = sku || product.sku;
      //save updated product
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
//@route DELETE /api/products/:id
//Delete a product
//Access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
//Get/api/products
//Get all products
//access Public
router.get("/", async (req, res) => {
  try {
    const {
      collection,
      category,
      brand,
      priceMin,
      priceMax,
      sortBy,
      gender,
      search,
      material,
      limit,
      size,
      color,
    } = req.query;
    let query = {};

    //Filter Logic
    if (collection && collection.toLocaleLowerCase() !== "all") {
      query.collections = collection;
    }
    if (category && category.toLocaleLowerCase() !== "all") {
      query.category = category;
    }
    if (material) {
      query.material = { $in: material.split(",") };
    }
    if (brand) {
      query.brand = { $in: brand.split(",") };
    }
    if (size) {
      query.sizes = { $in: size.split(",") };
    }
    if (color) {
      query.colors = { $in: [color] };
    }
    if (gender) {
      query.gender = gender;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    //sort logic
    sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
          default:
            break;
      }
    }
    //fetch product apply sorting and limiting
    let products =await  Product.find(query).sort(sort).limit(Number(limit)||0);
    res.json(products);


  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
//Get/api/products/Best-seller
//Retrieve the products with the highest sales
//access Public
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({rating:-1});
    if(bestSeller){
      res.json(bestSeller);
    }else{
      res.status(404).json({message:"No products found"});
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
    
  }
})
//Get/api/products/new-arrivals
//Retrieve the most recently added products
//access Public
router.get("/new-arrivals", async (req, res) => {
  try {
    const newArrivals = await Product.find().sort({createdAt:-1}).limit(8);
     const formatted = newArrivals.map(p => ({
      ...p._doc,
      images: p.images.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return 0;
      })
    }));

    res.json(formatted);
    
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
    
  }
})




//@route GET /api/products/:id
//Get product by ID
//assess Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
    
  }
})

//Get/api/products/similar/:id
//Get similar products
//access Public
router.get("/similar/:id", async (req, res) => {
  const {id} = req.params;
  try {
    const product = await Product.findById(id);
    if(!product){
      return res.status(404).json({message:"Product not found"});
    }
    const similarProducts = await Product.find({
      _id: { $ne:product._id },
      category: product.category,
      gender:product.gender,
    }).limit(4);
    res.json(similarProducts);
    

    
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
    
  }
})

module.exports = router;
