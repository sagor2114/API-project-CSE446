

module.exports = function(app) {
  var Cart = app.models.Cart;

  var prod = {
    productId: '1234',
    quantity: 2
  };

  //app.dataSources.db.automigrate('Cart',function(err){
   // if (err) throw err;

    var cart = {
      userId:"1234",
      txId: "1234"
    }
    //syntax PersistedModel.create([data], callback)
    Cart.create(cart,function(err, Instance) {
      if (err) return console.error(err);

      console.log('created cart:', Instance);
    });
 // })

};
