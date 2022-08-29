'use strict';
module.exports = function(Account) {



    let disabledPrototypesRemoteMethods = ['patchAttributes']
    let enabledRemoteMethods = ["create", "find", "findOrCreate","validate_account","getbalance","replaceById"]
    Account.sharedClass.methods().forEach(function(method) {
        //console.log(method.name, method.isStatic);
  if (enabledRemoteMethods.indexOf(method.name) == -1) {
    Account.disableRemoteMethodByName(method.name);
  }

  if (disabledPrototypesRemoteMethods.indexOf(method.name) > -1) {
    Account.disableRemoteMethodByName("prototype." + method.name);
  }
});

   //1.get balance from an account
   Account.getbalance = function(account_no, secret, callback) {


       var balance;
       Account.findOne({where: {account_no: account_no, secret: secret} }, function(err, account) {
               // console.log(account);
                balance = account.balance;
              //  status= "your current balance is "+balance;
              //  console.log(status);
                callback(null, balance);
        });

    };
  Account.remoteMethod('getbalance',{
      "accepts": [
        { "arg": "account_no","type": "string","required": true },
        { "arg": "secret", "type": "string", "required": true }
       ],
      "returns":  {  "arg": "balance", "type": "number", "root": true},
      "http":  {"verb": "get"}

      });



 //2.transfer money from a particular account
   Account.transferMoney = function (tx_account,cb) {

      var status = false;//console.log(tx_account);
      var ac_no = tx_account.ac_no;
      var scret = tx_account.secret;
      var tx_cost = Number(tx_account.tx_cost);


      Account.findOne({where: {account_no: ac_no, secret: scret} }, function(err, account) {
        if(!err){
          console.log(account.ac_holder,' was ',account.balance,' before transfering '+tx_cost+' taka..');
          account.balance+=tx_cost;  //console.log(account);
          account.save(); // console.log(account);
          console.log(account.ac_holder,' is ',account.balance,' after transfering money..');
          status = true;
        }
          cb(null, status);
      });

   };
   Account.remoteMethod('transferMoney', {
   accepts: {arg:'tx_account',type:'object', required: true,http: {source: 'body'} },
   returns: { arg:'current_bal', type: 'number' , root: true},
   http: { verb: 'post'}
  });





};
