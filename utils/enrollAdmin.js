'use strict';

var fsx = require('fs-extra');
var fabricClient = require('../libs/fabric-lib/fabric-client');
var connection = fabricClient;
var caService;
var adminUser;

// init the storages for connection's state and cryptosuite state based on connection profile configuration 
connection.initCredentialStores().then(() => 
{
  // clean-up store_path & crypto_path
  let client_config = connection.getClientConfig();
  let store_path = client_config.credentialStore.path;
  let crypto_path = client_config.credentialStore.cryptoStore.path;
  fsx.removeSync(store_path + "/*");
  fsx.removeSync(crypto_path + "/*");  

  // tls-enrollment
  caService = connection.getCertificateAuthority();
  return connection.getUserContext('admin-org1', true);

}).then((user) => {

  if (user) 
  {
    throw new Error("admin-org1 user already exists");
  } 
  else 
  {
    return caService.enroll(
    {
      enrollmentID: 'admin-org1',
      enrollmentSecret: 'admin-org1pw',
      attr_reqs: [
          { name: "hf.Registrar.Roles" },
          { name: "hf.Registrar.Attributes" }
      ]
    }).then((enrollment) => {

      console.log('Successfully enrolled admin user "admin"');
      return connection.createUser(
      {
          username: 'admin-org1',
          mspid: 'org1MSP',
          cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
      });

    }).then((user) => {

      adminUser = user;
      return connection.setUserContext(adminUser);

    }).catch((err) => {
      
      console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
      throw new Error('Failed to enroll admin');

    });
  }
}).then(() => {

    console.log('Assigned the admin user to the fabric client ::' + adminUser.toString());

}).catch((err) => {

    console.error('Failed to enroll admin: ' + err);

});