const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const User = require("./models/User");
const Cart = require("./models/Cart");
const products = require("./data/product");

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seedData = async ()=>{
    try {
        await Product.deleteMany();
        await User.deleteMany();
        await Cart.deleteMany();
        //create admin user
        const createdUsers=await User.create({
            name:"Admin User",
            email:"admin@gmail.com",
            password:"123456",
            role:"admin",
        });
        //assign default user id to products
        const UserID=createdUsers._id;
        const sampleProducts = products.map((product) => {
        return { ...product,user: UserID };
       });

       //insert product into database
       await Product.insertMany(sampleProducts);
       console.log("Data Seeded Successfully");
       process.exit();
      

        
    } catch (error) {
        console.log("Data Seed Failed",error);
        process.exit(1);
        
    }
};
seedData();