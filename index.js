const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override')
const AppError = require('./AppError');
const bcrypt = require('bcrypt');
const session = require('express-session');
const {emailAlert} = require('./sendemail')
const {sendSMSNotification, sendWhatsAppNotification} = require('./twilio')
const User = require('./models/user');
const Product = require('./models/product');
require('dotenv').config();
const dbUrl = process.env.MONGO_URL

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Inventory MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(session({ secret: 'notagoodsecret', resave: true, saveUninitialized: true }))

const categories = ['screws', 'sensors', 'components'];

function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/')
    }
    next();
}


async function sendNotification(message) {
    await emailAlert('kishorekumarmuthu0906@gmail.com', 'Low Inventory Notification', message);
    console.log('Email sent');
}

app.get('/', wrapAsync(async (req, res, next) => {
    res.render('user/login')
}))

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        req.session.username = foundUser.username;
        res.redirect('/products');
    }
    else {
        res.redirect('/')
    }
})

app.post('/logout', (req, res) => {
    req.session.user_id = null;
    // req.session.destroy();
    res.redirect('/');
})

app.get('/register', wrapAsync(async (req, res, next) => {
    res.render('user/register')
}))

app.post('/register', async (req, res) => {
    const { password, username } = req.body;
    const user = new User({ username, password })
    await user.save();
    req.session.user_id = user._id;
    res.redirect('/')
})

app.get('/products', requireLogin, wrapAsync(async (req, res, next) => {
        const { category } = req.query;
        if (category) {
            const products = await Product.find({ category })
            res.render('products/index', { products, category, req})
        } else {
            const products = await Product.find({})
            res.render('products/index', { products, category: 'All', req})
        }
})) 

app.get('/products/new', requireLogin, (req, res) => {
    //req.session.user_id = user._id;
    res.render('products/new', { categories })
})

app.post('/products', requireLogin, wrapAsync(async (req, res, next) => {
        const newProduct = new Product(req.body);
        await newProduct.save();
        //req.session.user_id = user._id;
        res.redirect('/products')
}))

app.get('/products/:id', requireLogin, wrapAsync(async (req, res, next) => {
        const { id } = req.params;
        const product = await Product.findById(id)
        if (!product) {
        throw new AppError('Product Not Found', 404);
        }
        //req.session.user_id = user._id;
        res.render('products/show', { product })
}))

app.get('/products/:id/edit', requireLogin, wrapAsync(async (req, res, next) => {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            throw new AppError('Product Not Found', 404);
        }
        //req.session.user_id = user._id;
        res.render('products/edit', { product, categories })
}))

app.put('/products/:id', requireLogin, wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { useFindAndModify:false, runValidators: true, new: true });
    if (product.quantity <= '1'){
        sendNotification(`${product.name} stock is very low`)
        sendSMSNotification(`${product.name} stock is very low`)
        sendWhatsAppNotification(`${product.name} stock is very low`)
    }
    //req.session.user_id = user._id;
    res.redirect(`/products/${product._id}`);
}))

app.delete('/products/:id', requireLogin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id, {useFindAndModify:false});
    //req.session.user_id = user._id;
    res.redirect('/products');
}));

const handleValidationErr = err => {
    console.dir(err);
    return new AppError(`Validation Failed...${err.message}`, 400)
}

const handleCastErr = err => {
    console.dir(err);
    return new AppError(`Invalid Product ID...${err.message}`, 400)
}

app.use((err, req, res, next) => {
    console.log(err.name);
    //We can single out particular types of Mongoose Errors:
    if (err.name === 'ValidationError') err = handleValidationErr(err)
    if (err.name === 'CastError') err = handleCastErr(err)
    next(err);
})

app.use((err, req, res, next) => {
    const { status = 500, message = 'Something went wrong' } = err;
    res.status(status).send(message);
})

app.listen(process.env.PORT, () => {
    console.log("APP IS LISTENING ON PORT 3000!")
})


