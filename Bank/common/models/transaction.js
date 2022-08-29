'use strict';

module.exports = function(Transaction) {
    let disabledPrototypesRemoteMethods = ['patchAttributes']
    let enabledRemoteMethods = ["create", "find", "findOrCreate","transaction_record","validate_transaction"]

    Transaction.sharedClass.methods().forEach(function(method) {
        //console.log(method.name, method.isStatic);
        if (enabledRemoteMethods.indexOf(method.name) == -1) {
          Transaction.disableRemoteMethodByName(method.name);
        }

        if (disabledPrototypesRemoteMethods.indexOf(method.name) > -1) {
          Transaction.disableRemoteMethodByName("prototype." + method.name);
        }
    });





      //1.check whether the given details are correct
   Transaction.validateTxRecord = function(Tx_record,callback) {

      console.log(Tx_record);

       var from_ac = Tx_record.from_ac;
       var to_ac = Tx_record.to_ac;
       var amount = Tx_record.tx_amount;
       var date = Tx_record.tx_date;


       var exist = false;
       Transaction.findOne({where: {from_ac_no: from_ac,to_ac_no: to_ac,tx_amount:amount,tx_date:date} }, function(err, transaction) {
                if(!err){
                   exist = true;
                   console.log('given transaction exists');
                   //console.log(transaction);

                }
                 callback(null, exist);
        });

    };
  Transaction.remoteMethod('validateTxRecord',{
         accepts: { arg: 'Tx_record', type: 'object',required: true, http: {source: 'body'} },
        returns: { arg: 'exist', type: 'boolean',root:true },
        http: { verb: 'post' }

      });

};
