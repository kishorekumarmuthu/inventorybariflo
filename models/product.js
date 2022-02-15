const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name cannot be blank']
    },
    price: {
        type: Number,
        required: true,
        min: 1
    },
    quantity:{
        type: String,
        required: true,
        min: 1
    },
    nosperquantity:{
        type: String,
        required: true,
        min: 1
    },
    vendor:{
        type: String,
        required: true,
    },
    category: {
        type: String,
        lowercase: true,
        enum: ['screws', 'sensors', 'components']
    }
})

const Product = mongoose.model('Product', productSchema);

module.exports = Product;