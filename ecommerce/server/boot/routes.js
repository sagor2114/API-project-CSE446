'use strict';


module.exports = function (app) {

  var router = app.loopback.Router();
  var request = require('request');

  var products, userId,total_cost=0;
  var currentCart = [];

  // action for root directory
  router.get('/', function (req, res) {


    res.render('index', {

    });


  });

  // 1.signup
  router.get('/signup', function (req, res) {
    res.render('homepage');
  });
  router.post('/signup', function (req, res) {
    console.log('\r');

    var User = app.models.user;

    var email = req.body.email;
    var password = req.body.password;

    //1.signup a user through post/users api
    var url = 'http://localhost:3000/api/users';
    request.post(url, {
        json: {
          email: email,
          password: password
        }
      },
      function (error, response, postData) {
        if (!error && response.statusCode == 200) {

          console.log('Signup has been done using /post/users api...');

          //2.now login a user
          User.login({
            email: email,
            password: password
          }, 'user', function (err, token) {
            if (err)
              return res.render('index', {
                email: email,
                password: password,
                loginFailed: true
              });
            console.log('login is also success..');
            token = token.toJSON();
            userId= token.userId;
            // 3.first time take account Info
            //4.view supplied products of supplier

            var url = 'http://localhost:8000/api/products';
            request(url, function (err, response, body) {
              products = JSON.parse(body); 

              //render view to second page
              res.render('homepage', {
                accessToken: token.id,
                userId: token.userId,
                produtcs: products,
                isSignup: true
              });

            });

          });;
        }
      }
    );



  });





  // 2.only login
  router.get('/login', function (req, res) {
    res.render('homepage');
  });
  router.post('/login', function (req, res) {

    var email = req.body.email;
    var password = req.body.password;

    var User = app.models.user;
    User.login({
      email: email,
      password: password
    }, 'user', function (err, token) {
      if (err){
        console.log('login is not succcess! User does not exist!');
        return res.render('index', {
          email: email,
          password: password,
          loginFailed: true
        });
      };
      console.log('login is success!');
      token = token.toJSON();
      userId = token.userId;

      //4.view supplied products of supplier
      var url = 'http://localhost:8000/api/products';

      request(url, function (err, response, body) {
        //console.log('body of view Products'+body);
        products = JSON.parse(body);
        //console.log(prods);
        //render view to second page
        res.render('homepage', {
          accessToken: token.id,
          userId: token.userId,
          isSignup: false,
          products: products

        });

      });


    });
  });






  // 3.logout
  router.get('/logout', function (req, res) {
    var AccessToken = app.models.AccessToken;
    var token = new AccessToken({
      id: req.query['access_token']
    });
    console.log('token id:',token.id);
    token.destroy();

    res.redirect('/');
  });

///moveToCartPage
  router.get('/moveToCartPage',function(req,res){
    res.render('cart',{
      userId:userId,
      cartProducts: currentCart,
      products: products,
      cost: total_cost
    });
  })



  //4.add to cart
  router.get('/addToCart', function (req, res) {
    res.render('cart');
  });
  var cnt=0;
  router.post('/addToCart', function (req, res) {
    console.log('\r');
    var url = 'http://localhost:3000/api/users/addToCart';

     cnt++;
    var quan = Number(req.body.quantity);
    // console.log(quan);
    request.post(url, {
        json: {
          productId: req.body.productId,
          quantity: quan
        }
      },
      function (error, response, postData) {
        if (!error && response.statusCode == 200) {
           console.log('Adding product to cart using /addToCart api is succes!',cnt);

          //7.get All cart Products and

          var url = 'http://localhost:3000/api/users/showCartProducts';
          request(url, function (err, response, bodyProds) {

            if(!err && response.statusCode == 200){
            currentCart = JSON.parse(bodyProds);
              console.log('showing current cart products using /showCartProducts api is success!',cnt);
              //console.log(currentCart);
            //8.calculate cost
              var url2 = 'http://localhost:3000/api/users/checkout_Cost';
              request(url2, function (err, response,cost) {
              //console.log(body);
              total_cost = cost;
              if(!err && response.statusCode == 200){
                console.log('cost calculation using /checkout_Cost api is success!',cnt);
               // console.log('total cost:',body);
                res.render('cart', {
                  userId:userId,
                  cartProducts: currentCart,
                  products: products,
                  cost: total_cost
                });
             }

          }
            );
          }
        }
          )

        }
      }
    );
  });



  //5.remove from cart
  router.get('/removeFromCart', function (req, res) {
    res.render('cart');
  });
  var cnt2=0;
  router.post('/removeFromCart', function (req, res) {
    console.log('\r');
    cnt2++;
    var url = 'http://localhost:3000/api/users/removeFromCart';


    var quan = req.body.quantity;
    var quan = Number(req.body.quantity);
    request.post(url, {
        json: {
          productId: req.body.productId,
          quantity: quan
        }
      },
      function (error, response, postData) {
        if (!error && response.statusCode == 200) {

           console.log('Removing product from cart using /removeFromCart api is success!',cnt2);
          //7.get All recent cart Products and

          var url = 'http://localhost:3000/api/users/showCartProducts';
          request(url, function (err, response, bodyProds) {
            currentCart = JSON.parse(bodyProds);
            console.log('showing current cart products after removing product is success!',cnt2);
            //8.calculate cost
            var url2 = 'http://localhost:3000/api/users/checkout_Cost';
            request(url2, function (err, response, cost) {
              //console.log(body);
              console.log('cost calculation after removing product is success!',cnt2);
              total_cost=cost;
              res.render('cart', {
                userId:userId,
                cartProducts: currentCart,
                products: products,
                cost: total_cost
              });
            });
          });



        }

      }
    );
  });



  router.get('/addAccountInfo', function (req, res) {
    res.render('homepage');
  });
  //6.add accountOnfo
  router.post('/addAccountInfo', function (req, res) {
    console.log('\r');
    var url = 'http://localhost:3000/api/users/Account_info';

    var userId = req.body.userId;
    request.post(url, {
        json: {
          userId: userId,
          ac_holder: req.body.ac_holder,
          ac_no: req.body.ac_no,
          phn: req.body.phn,
          secret: req.body.secret
        }
      },
      function (error, response, postData) {
        if (!error && response.statusCode == 200) {
          console.log('Adding accountInfo using /Account_info is success!!');
          //console.log(postData);
          res.render('homepage',{
             userId :userId,
             products: products,
             isSignup:false
          });
        }
      }
    );
  });


  router.post('/placeOrder',function(req,res){
       console.log('\r');

       var userId  = req.body.userId;
       var total_cost = req.body.t_cost;

       console.log(userId,total_cost);
       var url='http://localhost:3000/api/users/placeOrder';
       request.post(url,{
         json:{
            userId:userId,
            total_cost:total_cost
         }
       },function(err,response,body){
          if(!err && response.statusCode == 200){
            console.log('order placing is scuccess!!');
            console.log(body);

            res.render('orderTracking',{
              track: body
           });
          }
       })

  });
  app.use(router);
}
