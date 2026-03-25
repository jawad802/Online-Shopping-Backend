const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require("express");
const cors = require ("cors");
const dotenv = require("dotenv");
const connectDB= require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const productRoutes = require("./Routes/ProductRoutes");
const cartRoutes = require("./Routes/cartRoutes");
const checkoutRoutes = require("./Routes/CheckOutRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const uploadRoutes = require("./Routes/uploadRoutes");
const subscriberRoute = require("./Routes/subscriberRoute");
const adminRoutes = require("./Routes/adminRoutes");
const productAdminRoutes = require("./Routes/productAdminRoutes");
const adminOrderRoutes = require("./Routes/adminOrderRoutes");
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();


const PORT=process.env.PORT || 3000;
//Connect to mongodb database
connectDB();
app.get("/",(req,res)=>{
    res.send("welcome");
});

// API Routes
app.use("/api/users",userRoutes);
app.use("/api/products",productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/checkout",checkoutRoutes);
app.use("/api/orders",orderRoutes);
app.use("/api/upload",uploadRoutes);
app.use("/api",subscriberRoute);

//Admin Routes
app.use("/api/admin/users",adminRoutes);
app.use("/api/admin/products",productAdminRoutes);
app.use("/api/admin/orders",adminOrderRoutes);

app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    
})