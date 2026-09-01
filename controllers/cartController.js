const Cart = require("../models/Cart");


// ADD PRODUCT TO CART

const addToCart = async(req,res)=>{

try{

const {productId, quantity}=req.body;


let cart = await Cart.findOne({
    user:req.user.id
});


if(!cart){

cart = await Cart.create({
    user:req.user.id,
    items:[
        {
            product:productId,
            quantity:quantity || 1
        }
    ]
});


return res.status(201).json(cart);

}



// if cart exist

const itemIndex = cart.items.findIndex(
(item)=>item.product.toString() === productId
);



if(itemIndex > -1){

cart.items[itemIndex].quantity += quantity || 1;

}
else{

cart.items.push({
    product:productId,
    quantity:quantity || 1
});

}


await cart.save();


res.json(cart);



}catch(error){

res.status(500).json({
message:error.message
});

}

};



// GET MY CART

const getCart = async(req,res)=>{

try{


const cart = await Cart.findOne({
user:req.user.id
})
.populate("items.product");


res.json(cart);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// REMOVE PRODUCT FROM CART


const removeFromCart = async(req,res)=>{

try{


const cart = await Cart.findOne({
user:req.user.id
});


cart.items = cart.items.filter(
item=>item.product.toString() !== req.params.productId
);



await cart.save();


res.json({
message:"Product removed from cart"
});



}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
addToCart,
getCart,
removeFromCart
};