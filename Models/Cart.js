import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.Types.ObjectId, unique: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, },
    type: { type: String, enum: ['test', 'xray'], },
    title: String,
    quantity: { type: Number, default: 1, min: 1 },
    price: Number,
    offerPrice: Number,
    totalPayable: Number,  // price - offer
    totalPrice: Number     // totalPayable * quantity
  }]
},{ timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
