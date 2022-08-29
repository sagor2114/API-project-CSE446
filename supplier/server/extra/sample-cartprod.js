

module.exports = function(app) {
  var CartProd = app.models.CartProd;

  var prod = {
    productId: '1234',
    quantity: 2
  };

  app.dataSources.db.automigrate('CartProd',function(err){
   // if (err) throw err;


    //syntax PersistedModel.create([data], callback)
    CartProd.create(prod,function(err, Instance) {
      if (err) return console.error(err);

      console.log('created cartProd:', Instance);
    });
  })

};
