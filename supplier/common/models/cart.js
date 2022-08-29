'use strict';

module.exports = function (Cart) {

    var request = require('request');

    let disabledPrototypesRemoteMethods = ['patchAttributes']
    let enabledRemoteMethods = ["create", "find", "findOrCreate"]

    Cart.sharedClass.methods().forEach(function (method) {
      //console.log(method.name, method.isStatic);
      if (enabledRemoteMethods.indexOf(method.name) == -1) {
        Cart.disableRemoteMethodByName(method.name);
      }

      if (disabledPrototypesRemoteMethods.indexOf(method.name) > -1) {
        Cart.disableRemoteMethodByName("prototype." + method.name);
      }
    });
    Cart.disableRemoteMethodByName('prototype.__get__products');
    Cart.disableRemoteMethodByName('prototype.__create__products');
    Cart.disableRemoteMethodByName('prototype.__findById__products');
    Cart.disableRemoteMethodByName('prototype.__updateById__products');
    Cart.disableRemoteMethodByName('prototype.__destroyById__products');
    Cart.disableRemoteMethodByName('prototype.__count__products');


    var async = require('async');

    //1.request product with transaction record
    //reqProductsWithTx_record
    Cart.reqProductsWithTxRecordAndCartId = function (TxnCartInfo, callback) {

        var reqCartId = TxnCartInfo.cartId;
        var amount = TxnCartInfo.tx_amount;
        //(i)validate with the help of bank
        var url = 'http://localhost:8080/api/transactions/validateTxRecord';
        request.post(url, {
              json: {
                "from_ac": TxnCartInfo.from_ac,
                "to_ac": TxnCartInfo.to_ac,
                "tx_amount": amount,
                "tx_date": TxnCartInfo.tx_date
              }
            }, function (err, response, isValid) {
              console.log(typeof isValid);
              if (isValid == true) {

                //(ii)So transfer money with the help of bank
                //for user deduct money = -t_cost ,
                var url2 = 'http://localhost:8080/api/accounts/transferMoney';
                var cost = amount * 0.85;
                var d_cost = -1 * cost;
                console.log(d_cost);
                request.post(url2, {
                  json: {
                    "ac_no": "2345",
                    "secret": "2345",
                    "tx_cost": d_cost
                  }
                }, function (err, response, body) {
                  if (!err && response.statusCode == 200) {
                    console.log('deduction of 85% money from e-commerce account', body);
                  }
                });
                //for supplier add money ;
                request.post(url2, {
                  json: {
                    "ac_no": "3456",
                    "secret": "3456",
                    "tx_cost": cost
                  }
                }, function (err, response, body) {
                  if (!err && response.statusCode == 200) {
                    console.log('addition of 85% money to supplier account', body);
                  }
                });
                //post this transaction to the bank
                //4.post transaction record ...post/bank/transactions
                var today = new Date();
                var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                var dateTime = date + ' ' + time;


                request.post(
                  'http://localhost:8080/api/transactions', {
                    json: {
                      "from_holder_name": "e-commerce",
                      "from_ac__no": "2345",

                      "to_holder_name": "supplier.org",
                      "to_ac_no": "3456",

                      "tx_amount": cost,
                      "tx_date": dateTime
                    }
                  },
                  function (error, response, transaction) {
                    if (!error && response.statusCode == 200) {
                      console.log('transaction from e-commerce to supplier has been included into bank database');
                    }
                  });
                      var isDelivered = false;
                      //(iii)so Deliver requested cart product after getting the corresponding money
                      Cart.findById(reqCartId, function (err, cart) {
                        isDelivered = true;
                        cart.areSupplied = true;
                        cart.save();
                        console.log('These products has been supplied', cart);
                        callback(null, isDelivered);

                      });
                    }
                  })

              };


              Cart.remoteMethod('reqProductsWithTxRecordAndCartId', {
                accepts: {
                  arg: 'TxnCartInfo',
                  type: 'object',
                  required: true,
                  http: {
                    source: 'body'
                  }
                },
                returns: {
                  arg: 'isDelivered',
                  type: 'boolean',
                  root: true
                },
                http: {
                  verb: 'post'
                }

              });


              var PlacedCart = [];
              Cart.postPlacedCart = function (data, callback) {

                var dataInsert = {
                  userId: data.userId,
                  txId: data.txId
                }
                var cartProds = data.productList;
                Cart.create(dataInsert, function (err, cart) {
                  console.log('created cart instance:', cart);

                  //cartProds = JSON.parse(cartProds);
                  console.log(cartProds);
                  //add cart items to created cart instance
                  async.each(cartProds, function (product, done) {
                    console.log(product);
                    cart.products.create(product, done);
                  }, function (err) {
                    console.log('products included cart', cart);
                    cart.save();
                    PlacedCart = cart;
                    callback(null, PlacedCart);
                  })

                })
              }

              Cart.remoteMethod('postPlacedCart', {
                accepts: {
                  arg: 'data',
                  type: 'object',
                  required: true,
                  http: {
                    source: 'body'
                  }
                },
                returns: {
                  arg: 'placedCart',
                  type: 'object',
                  root: true
                },
                http: {
                  verb: 'post'
                }

              });


            };
