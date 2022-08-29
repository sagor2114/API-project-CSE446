
var request= require('request');

var url3 = 'http://localhost:8000/api/Carts/postPlacedCart';

request.post(url3, {
    json: {
      "userId" : "12345",
      "txId":"76e5",
      "productList":[
      {
        "productId": "string34",
        "quantity": 3
      },
      {
        "productId": "string24",
        "quantity": 1
      }
 ]
    }

  },
  function (err, response, addedCart) {
    if (!err && response.statusCode == 200) {
      console.log('cart has been added to Cart Model of supplier', addedCart);

    }
    else console.log(err);
  }
);
