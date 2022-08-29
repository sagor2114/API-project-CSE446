'use strict';

module.exports = function (User) {

  var request = require('request');
  // User.validatesLengthOf('phone_no', {is: 11,message: {is: 'please insert a valid phone number'}});
  // 1.disable all unnecessary  api
  let disabledPrototypesRemoteMethods = ['patchAttributes', 'verify', 'findById']
  let enabledRemoteMethods = ["create", "find", "findOrCreate", "login", "logout", "resetPassword"]

  User.sharedClass.methods().forEach(function (method) {
  
    if (enabledRemoteMethods.indexOf(method.name) == -1) {
      User.disableRemoteMethodByName(method.name);
    }

    if (disabledPrototypesRemoteMethods.indexOf(method.name) > -1) {
      User.disableRemoteMethodByName("prototype." + method.name);
    }
  });

  
  //delete all access token related api
  User.disableRemoteMethodByName('prototype.__get__accessTokens');
  User.disableRemoteMethodByName('prototype.__create__accessTokens');
  User.disableRemoteMethodByName('prototype.__delete__accessTokens');
  User.disableRemoteMethodByName('prototype.__findById__accessTokens');
  User.disableRemoteMethodByName('prototype.__updateById__accessTokens');
  User.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  User.disableRemoteMethodByName('prototype.__count__accessTokens');



  // 1.take account information from user
  User.Account_info = function (accountInfo, cb) {

    //console.log(accountInfo);
    var userId = accountInfo.userId;
    User.findById(userId, function (err, user) {
      if (err) return cb(err);

      //console.log('before adding',user);

      user.ac_holder = accountInfo.ac_holder;
      user.ac_no = accountInfo.ac_no;
      user.phn = accountInfo.phn;
      user.secret = accountInfo.secret;
      user.save();

      // console.log('after adding account info',user);
      cb(null, true);
    });
  };
  User.remoteMethod('Account_info', {
    accepts: {
      arg: 'accountInfo',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    },
    returns: {
      arg: 'success',
      type: 'boolean',
      root: true
    },
    http: {
      verb: 'post'
    }
  });


  //2.add products to cart
  var count = 0;
  var cart = [];
  User.addToCart = function (productInfo, cb) {
    count++;

    var id = productInfo.productId;
    var quan = productInfo.quantity;

    var matched = false;
    var CntItem = Object.keys(cart).length;
    for (let i = 0; i < CntItem; i++) {

      if (cart[i].productId == id) {
        matched = true;
        cart[i].quantity += quan;
      }

    }
    if (!matched) {
      cart.push(productInfo);

    }

    //console.log('isOk..current cart after adding: ',count,': ',cart);
    cb(null, cart);
  };
  User.remoteMethod('addToCart', {

    accepts: {
      arg: 'productInfo',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    },

    returns: {
      arg: 'cart',
      type: 'object',
      root: true
    },
    http: {
      verb: 'post'
    }
  });

  //3.remove product From Cart
  var cnt = 0;
  User.removeFromCart = function (productInfo, cb) {

    var id = productInfo.productId;
    var quan = productInfo.quantity;
    //console.log('removeFromCart Api productInfo',productInfo);
    var cartSize = Object.keys(cart).length;


    for (let i = 0; i < cartSize; i++) {

      if (cart[i].productId == id) {
        if (cart[i].quantity == quan) {
          //  console.log('cart before pop',cart);
          cart.splice(i, 1);

          //  console.log('after pop',cart);
          return cb(null, cart);
        } else {
          cart[i].quantity -= quan;
          return cb(null, cart);
        }

      }
    }

  };
  User.remoteMethod('removeFromCart', {
    accepts: {
      arg: 'productInfo',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    },

    returns: {
      arg: 'cart',
      type: 'object',
      root: true
    },
    http: {
      verb: 'post'
    }
  });




  //remove All product From Cart
  User.clearCart = function (cb) {
    cart = [];
    cb(null, cart);
  };
  User.remoteMethod('clearCart', {
    returns: {
      arg: 'cart',
      type: 'array',
      root: true
    },
    http: {
      verb: 'post'
    }
  });





  //4.show all cart products
  User.showCartProducts = function (cb) {
    cb(null, cart);
  };
  User.remoteMethod('showCartProducts', {
    returns: {
      arg: 'cart',
      type: 'array',
      root: true
    },
    http: {
      verb: 'get'
    }
  });





  //5.checkout buying cost of selected products
  User.checkout_Cost = function (cb) {
    var cost = 0;
    var CntItem = Object.keys(cart).length;
    if (CntItem == 0) return cb(null, 0);
    //console.log(CntItem);
    for (let i = 0; i < CntItem; i++) {

      var productId = cart[i].productId;
      var url = 'http://localhost:8000/api/products/' + productId;

      request(url, function (error, response, body) {

        if (!error && response.statusCode == 200) {
          var prod = JSON.parse(body);
          var quan = cart[i].quantity;

          //console.log('item ', i, ': ', quan, prod.price);

          cost += (quan * prod.price);


          //console.log('cost after each request:', cost);
          //console.log(i == (CntItem - 1));
          if (i == (CntItem - 1)) cb(null, cost);
        }
      });
    }
  }

  User.remoteMethod('checkout_Cost', {
    returns: {
      arg: 'cost',
      type: 'number',
      root: true
    },
    http: {
      verb: 'get'
    }
  });



  //6.place order
  User.placeOrder = function (info, cb) {

    var userId = info.userId;
    var t_cost = info.t_cost;

    //order tracking..
    let trackOrder = [];
    trackOrder.push('A req to placing order has been sent to e-commerce.');

    var isTxPossible = true;
    var status = '';
    //1.find account info using userId
    User.findById(userId, function (err, user) {
      console.log('finding logged information about '+user.ac_holder+'  is success!!');
      console.log(user);

      //2.get balance from bank using ac_no,secret
      var url = 'http://localhost:8080/api/accounts/getbalance?account_no=' + user.ac_no + '&secret=' + user.secret;
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {

          var balance = Number(body);
          t_cost = Number(t_cost);

          console.log('finding balance of '+user.ac_holder+' using bank/getbalance api is success!!');
          console.log('current balance of '+user.ac_holder+' in account: ', balance);
          // console.log(typeof balance,typeof t_cost);

         // var lessBal = false;
          var lessBal = balance < t_cost;
          console.log('is balance less than transaction amount? ',lessBal);
          if (lessBal) {
            isTxPossible = false;
             status = 'sorry..You did not have sufficient balance in your account.';
             console.log(status);
             trackOrder.push(status);
          }
          else{

         }
        } else if(err) {
          isTxPossible = false;
          status = 'Sorry..There exist no account according to your information.';
          console.log(status);
          trackOrder.push(status);
        }

      });
      //console.log(isTxPossible);
      if (isTxPossible) {
        // 3.bank/transferMoney (account_id1,account_id2) by calling same api two times
        //user.bal-=cost; ecommerce.bal+=cost;

        //for user deduct money = -t_cost ,
        //console.log(-t_cost);
        var d_cost = -1 * t_cost;
        var url2 = 'http://localhost:8080/api/accounts/transferMoney';
        request.post(url2, {
          json: {
            "ac_no": user.ac_no,
            "secret": user.secret,
            "tx_cost": d_cost
          }
        }, function (err, response, body) {
          status = 'Deduction of '+t_cost+' taka from '+user.ac_holder+' account is '+body+'.';
          console.log(status);
            trackOrder.push(status);
        });
        //for e-commerce add money ;
        request.post(url2, {
          json: {
            "ac_no": "2345",
            "secret": "2345",
            "tx_cost": t_cost
          }
        }, function (err, response, body) {
            console.log('Addition of '+t_cost+' taka to e-commerce is', body+'..');
        });

        //4.post transaction record ...post/bank/transactions
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;

        var ecommerce_ac_no = "2345";
        request.post(
          'http://localhost:8080/api/transactions', {
            json: {
              "from_holder_name": user.ac_holder,
              "from_ac__no": user.ac_no,
              "to_holder_name": "e-commerce",
              "to_ac_no": ecommerce_ac_no,
              "tx_amount": t_cost,
              "tx_date": dateTime
            }
          },
          function (error, response, transaction) {
            status = 'Transaction record has been included into bank database..';
            if (!error && response.statusCode == 200) {

               status+='success..';
               console.log('Tansaction record:',transaction);

              //add cart to cartModel after transaction to supplier
              //5.post/supplier/Cart
              //do this same things using your build in api
              // so (i) build an api called /postCart
             // console.log('current cart', cart);
              var url3 = 'http://localhost:8000/api/Carts/postPlacedCart';
              request.post(url3, {
                  json: {
                    "userId": userId,
                    "txId": transaction.id,
                    "productList": cart
                  }

                },
                function (err, response, addedCart) {
                  if (!err && response.statusCode == 200) {
                    console.log('cart has been added to Cart Model of supplier:', addedCart);


                    var cart_id = addedCart.id;

                    // 6.post/supplier/reqProductsWithTxRecordAndCartId
                    //From_ac,To_ac,date,money,cart_id
                    var url4 = 'http://localhost:8000/api/Carts/reqProductsWithTxRecordAndCartId';
                    request.post(url4, {
                      json: {
                        "cartId": cart_id,
                        "from_ac": user.ac_no,
                        "to_ac": ecommerce_ac_no,
                        "tx_date": dateTime,
                        "tx_amount": t_cost
                      }
                    }, function (err, response, body) {
                      status = 'A Request to supply cart product with tx_record is :'+body+'.';
                      console.log(status);
                      trackOrder.push(status);


                    })

                  }
                });

            }
            else{
             status+='failed';
             console.log(status);
            }
            trackOrder.push(status);
            cb(null, trackOrder);
          }
        );



      };

    });

  };
  User.remoteMethod('placeOrder', {
    accepts: {
      arg: 'info',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    },
    returns: {
      arg: 'trackOrder',
      type: 'array',
      root: true
    },
    http: {
      verb: 'post'
    }
  });




};
