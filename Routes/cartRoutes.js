const express = require("express");
const Cart = require("../models/Cart");
const { protect } = require("../middleware/authMiddleware");
const Product = require("../models/Product");

const router = express.Router();

// Function to get a cart by userId or guestId
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId: guestId });
  }
  return null;
};

// @route POST /api/cart
// Add product to cart for login user and guest
// Access public
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Ensure quantity is a valid number
    const validQuantity = quantity && !isNaN(quantity) ? Number(quantity) : 1;

    // Ensure product.price is a valid number
    const validPrice = product.price && !isNaN(product.price) ? Number(product.price) : 0;

    // Determine if the user is logged in or not
    const cart = await getCart(userId, guestId);

    // Get the product image (with a fallback if images is undefined or empty)
    const productImage = product.images && product.images.length > 0 ? product.images[0].url : "default-image-url";

    // If the cart exists, update it
    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color
      );

      if (productIndex > -1) {
        // Product exists in cart, update quantity
        cart.products[productIndex].quantity += validQuantity;
      } else {
        // Add new product to cart
        cart.products.push({
          productId,
          name: product.name,
          image: productImage,
          price: validPrice,
          size,
          color,
          quantity: validQuantity,
        });
      }

      // Recalculate total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      // Create new cart
      const newCart = await Cart.create({
        user: userId ? userId : undefined,
        guestId: guestId ? guestId : "guest_" + new Date().getTime(),
        products: [
          {
            productId,
            name: product.name,
            image: productImage,
            price: validPrice,
            size,
            color,
            quantity: validQuantity,
          },
        ],
        totalPrice: validPrice * validQuantity,
      });
      return res.status(201).json(newCart);
    }
  } catch (error) {
    console.log("Add to cart failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//put/api/cart
//update the quantity of cart for login user and guest
//access public
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart)  return res.status(404).json({ message: "Cart not found" });
    const productIndex = cart.products.findIndex((p)=>p.productId.toString()===productId && p.size===size && p.color===color);
    if(productIndex>-1){
      //update quantity
      if(quantity>0){
        cart.products[productIndex].quantity=quantity;
      }else{
        cart.products.splice(productIndex,1);
      }
      cart.totalPrice=cart.products.reduce((acc,item)=>acc+item.price*item.quantity,0);
      await cart.save();
      return res.status(200).json(cart);

    }
   else{
    res.status(404).json({message:"Product not found in cart"});
  }
}
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
    
  }
});

// @route Delete /api/cart
//delete product from cart
//access public

router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const productIndex = cart.products.findIndex((p)=>p.productId.toString()===productId && p.size===size && p.color===color);
    if(productIndex>-1){
      cart.products.splice(productIndex,1);
      cart.totalPrice=cart.products.reduce((acc,item)=>acc+item.price*item.quantity,0);
      await cart.save();
      return res.status(200).json(cart);
    }else{
      return res.status(404).json({message:"Product not found in cart"});
    }

}catch (error) {
    console.log(error);
   return res.status(500).json({ message: "Server Error" });
}
});

// @route GET /api/cart
//get cart for login user and guest
//access public
router.get("/", async (req, res) => {
  const { guestId, userId } = req.query;
  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
    
  }
});

//route Post /api/cart/merge
//merge guest cart to user cart upon login
//access private
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;
  try {
    //find guest cart and user cart
    const guestCart = await Cart.findOne({ guestId: guestId });
    const userCart = await Cart.findOne({ user: req.user._id });
    if(guestCart){
      if(guestCart.products.length===0){
       return res.status(200).json({message:"Guest cart is empty"});

      }
      if(userCart){
        //merge guest cart to user cart
        guestCart.products.forEach((guestItem)=>{
          const productIndex = userCart.products.findIndex((Item)=>Item.productId.toString()===guestItem.productId.toString() && Item.size===guestItem.size && Item.color===guestItem.color);

          if(productIndex>-1){
            //product exists in user cart, update quantity
            userCart.products[productIndex].quantity+=guestItem.quantity;
          }
          else{
            //add new product to user cart
            userCart.products.push(guestItem);
          }

      });
      userCart.totalPrice = userCart.products.reduce(
        (acc,item)=>acc+item.price*item.quantity,
        0
      );
      await userCart.save();
      //remove guest cart after merging
      try {
        await Cart.findOneAndDelete({guestId});
        
      } catch (error) {
        console.log("Error deleting guest cart:",error)
        
      }
      res.status(200).json(userCart);
    }
    else{
      //if user has no existing cart assign guest cart to user
      guestCart.user=req.user._id;
      guestCart.guestId=undefined;
      await guestCart.save();
      res.status(200).json(guestCart);
    }
  }
  else{
    if(userCart){
      //guest card is already merge return user cart
      return res.status(200).json(userCart);

    }
    res.status(404).json({message:"guest cart not found"});
  }
    
  } catch (error) {
    
    console.log(error);
    res.status(500).json({message:"server error"});
  }
});

module.exports = router;