const express = require('express');
const cors = require('cors');
const Products = require('./models/Products'); 
const User = require('./models/users');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");

const stripe = require("stripe")("sk_test_51PkqswRqTY1bRAbmAOPcjettpFGO7bYrOQPOgKfsmIbmz4kVPyRyEug8QX7LTISynPofxC6I5VSmOI6oqT3IIObQ00c0wnhs55");
const { v4: uuid } = require("uuid");

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'https://ecommerce-ar-backend.vercel.app/', // Replace with your frontend URL
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(cookieParser());


// Route to get all products
app.get('/getProducts', async (req, res) => {
    try {
      const products = await Products.find();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: error.message });
    }
});


// Update this endpoint to find by productCode
app.get('/getProduct/:productCode', async (req, res) => {
    try {
        const { productCode } = req.params;
        const product = await Products.findOne({ productCode });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: error.message });
    }
});


  // Similarly, update this endpoint
  app.get('/getProductsByCategory/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const products = await Products.find({ category });
  
      if (!products) {
        return res.status(404).json({ error: 'No products found' });
      }
  
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ error: error.message });
    }
  });  

//Route to /register
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!(name && email && password)) {
        return res.status(400).send('All fields are compulsory!');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(401).send('User already exists with this Email!');
    }

    // Encryption
    const encPass = await bcryptjs.hash(password, 10);

    // Create user in the database
    const user = await User.create({
        name,
        email,
        password: encPass
    });

    // Creating token for user
    const token = jwt.sign(
        { id: user._id },
        'shhhh', // Replace with a proper secret in a real app
        { expiresIn: "2h" }
    );
    user.token = token;
    user.password = undefined;

    res.status(201).json({ user, token });
});


//Route to /login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!(email && password)) {
      return res.status(400).send('All fields are compulsory!');
    }
  
    try {
      const user = await User.findOne({ email });
  
      if (user && (await bcryptjs.compare(password, user.password))) {
        const token = jwt.sign(
          { id: user._id },
          'shhhh',
          {
            expiresIn: "2h"
          }
        );
        user.token = token;
        user.password = undefined;
  
        // Cookie section
        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true
        };
        return res.status(200).cookie("token", token, options).json({
          success: true,
          token,
          user
        });
      } else {
        return res.status(400).send('Invalid credentials!');
      }
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).send('Internal Server Error');
    }
  });

//Route to /payment
app.post("/payment", async (req, res) => {
  const { product, token } = req.body;
  console.log("Product ", product);
  console.log("Price ", product.price);
  const idempotencyKey = uuid();

  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id
    });

    const charge = await stripe.charges.create({
      amount: product.price * 100,
      currency: 'pkr',
      customer: customer.id,
      receipt_email: token.email,
      description: `Purchase of ${product.name}`,
      shipping: {
        name: `${token.card.first_name} ${token.card.last_name}`,
        address: {
          country: token.card.country,
          line1: token.card.address
        }
      }
    }, { idempotencyKey });

    res.status(200).json(charge);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});
