



var async = require('async');

module.exports = function(app, cb) {
  var Cart = app.models.Cart;
  var products = [
    {
      productId: '1234',
      quantity: 2
    },
    {
      productId: '2345',
      quantity: 1
    }
  ];
  // Cart.create({userId: 'user453'}, function(err, cart) {
  //   console.log('Cart:', cart);

  //   // async.each(products, function(product, done) {
  //   //   Cart.products.create(product, done);
  //   // }, function(err) {
  //   //   console.log('Cart with products:', cart);
  //   //   var id1 = cart.productList[0].id;
  //   //   var id2 = cart.productList[1].id;

  //   //   async.series([
  //   //     // Find an email by id
  //   //     function(done) {
  //   //       cart.products.get(id1, function(err, product) {
  //   //         console.log('product:', product);
  //   //         done();
  //   //       });
  //   //     },
  //   //     function(done) {
  //   //       cart.products.set(id2, {productId: '2345', quantity: 3},
  //   //         function(err, product) {
  //   //           done();
  //   //         });
  //   //     },
  //   //     // Remove an email by id
  //   //     function(done) {
  //   //       cart.products.unset(id1, function(err) {
  //   //         done();
  //   //       });
  //   //     }
  //   //   ], function(err) {
  //   //     console.log('Cart with products:', cart);
  //   //     cb(err);
  //   //   });
  //   // });
  // });
};
