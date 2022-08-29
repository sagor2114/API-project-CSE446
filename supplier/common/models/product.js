'use strict';

module.exports = function(Product) {


  let disabledPrototypesRemoteMethods = ['patchAttributes']
  let enabledRemoteMethods = ["create", "find", "findOrCreate","findById", "delete", "deleteById"]

  Product.sharedClass.methods().forEach(function(method) {
      //console.log(method.name, method.isStatic);
      if (enabledRemoteMethods.indexOf(method.name) == -1) {
        Product.disableRemoteMethodByName(method.name);
      }

      if (disabledPrototypesRemoteMethods.indexOf(method.name) > -1) {
        Product.disableRemoteMethodByName("prototype." + method.name);
      }
  });



}
