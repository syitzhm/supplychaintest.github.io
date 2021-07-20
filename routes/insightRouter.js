var express = require('express');
var bodyParser = require('body-parser');
const convertObject = require('../utils/convertObject');

var Client = require('fabric-client');
var client = Client.loadFromConfig('configs/fabric-network-config/connection-profile.yaml');
// ======================================================

function encroll(org) {
    var caService;
    let username = `admin-${org}`;
    let password = `admin-${org}pw`;
    console.log(`Encroll with username ${username}`);
    client.loadFromConfig(`configs/fabric-network-config/${org}-profile.yaml`);

    // init the storages for client's state and cryptosuite state based on connection profile configuration 
    return client.initCredentialStores()
        .then(() => {
            // tls-enrollment
            caService = client.getCertificateAuthority();
            return caService.enroll({
                enrollmentID: username,
                enrollmentSecret: password,
                profile: 'tls',
                attr_reqs: [
                    { name: "hf.Registrar.Roles" },
                    { name: "hf.Registrar.Attributes" }
                ]
            }).then((enrollment) => {
                console.log('Successfully called the CertificateAuthority to get the TLS material');
                let key = enrollment.key.toBytes();
                let cert = enrollment.certificate;

                // set the material on the client to be used when building endpoints for the user
                client.setTlsClientCertAndKey(cert, key);
                return client.setUserContext({ username: username, password: password });
            })
        })
}
// ======================================================

function submitTransaction(requestData, channel) {

    return channel.initialize()
        .then(() => {
            return channel.sendTransactionProposal(requestData)
        })
        .then(function (results) {

            var proposalResponses = results[0];
            var proposal = results[1];
            var all_proposal_good = true;
            var err_found = null;

            // check if the number of Proposal Responses is 5
            all_proposal_good = proposalResponses.length === 5;

            // check if all Proposal Responses status are OK and valided digital signature
            for (var i in proposalResponses) {
                let one_good = false;
                let proposal_response = proposalResponses[i];
                if (proposal_response.code) {
                    console.log(proposal_response.message);
                    err_found = new Error(proposal_response.message);
                } else if (proposal_response.response && proposal_response.response.status === 200) {
                    console.log('transaction proposal has response status of good');
                    one_good = channel.verifyProposalResponse(proposal_response);
                    if (one_good) {
                        console.log('transaction proposal signature and endorser are valid');
                    }
                    else {
                        console.log('transaction proposal was bad');
                        err_found = new Error('verify proposal response signature failed');
                    }
                }

                all_proposal_good = all_proposal_good & one_good;
            }

            if (all_proposal_good) {
                console.log(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message);

                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                return channel.sendTransaction(request)

            } else { // all_proposal_good == false 
                console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                if (!err_found)
                    err_found = new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');

                let result = {
                    status: "FAILED",
                    err: err_found
                };
                return result;
            }

        }, (err) => { // error method of channel.sendTransactionProposal's Promise

            t.fail('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
            //throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);

        }).then((response) => { //the response from main promise.

            if (response.status === 'SUCCESS') {

                console.log('******************************************************************');
                console.log('Successfully sent transaction[' + requestData.txId.getTransactionID() + '] to the orderer and committed to ledgers');
                console.log('******************************************************************');

                // close the connections (close peers and orderer connection from this channel) to release resources
                // channel.close();
                console.log('Successfully closed all connections');

                // define result to return back to MODEL classes.                
                return response.status;

            } else {
                console.log('Failed to order the transaction. Error code: ' + response.status);
                return Promise.reject(response.err);
                //throw new Error('Failed to order the transaction. Error code: ' + response.status);
            }
        }, (err) => {

            console.log('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
            //throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);

        });
}
// ======================================================

function query(channel, requestData) {
    return channel.queryByChaincode(requestData)
        .then((response_payloads) => {
            if (response_payloads && response_payloads.length > 0) {
                if (!response_payloads[0].code) {
                    try {
                        let resultData = JSON.parse(response_payloads[0].toString('utf8'));
                        return Promise.resolve(resultData);
                    }
                    catch (e) {
                        console.log('JSON.parse() failed with execption: ' + e);
                        return Promise.reject(new Error('JSON.parse() failed with execption: ' + e));
                    }
                }
                else {
                    return Promise.reject(new Error(response_payloads[0]));
                }
            }
            else {
                console.log('response_payloads is null');
                return Promise.reject(new Error('response_payloads is null'))
            }
        },
            (err) => {
                console.log('Failed to send query due to error: ' + err.stack ? err.stack : err);
                return Promise.reject(new Error(('Failed to send query due to error: ' + err.stack ? err.stack : err)));
            });;
}
// ======================================================

var router = express.Router();
router.use(bodyParser.json());

// ======================================================

router.route('/org/:org')
    .get(function (req, res, next) {
        let org = req.params.org;
        return encroll(org)
            .then(() => {
                let peers = client.getPeersForOrg();
                return client.queryChannels(peers[0])
                    .then(channelQueryResponses => {
                        return res.json(channelQueryResponses);
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
    });
// ======================================================

router.route('/org/:org/channel/:channel_id')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return channel.queryInfo()
                    .then(queryResponses => {
                        return res.json(convertObject.convertChannelInfo2JSON(queryResponses));
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/block/:block')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        let block = parseInt(req.params.block);
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return channel.queryBlock(block)
                    .then(queryResponses => {
                        return res.json(convertObject.convertBlock2JSON(queryResponses));
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/tx/:transaction_id')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        let transaction_id = req.params.transaction_id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return channel.queryTransaction(transaction_id)
                    .then(queryResponses => {
                        return res.json(convertObject.convertTransaction2JSON(queryResponses));
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/orderers')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return res.json(channel.getOrderers());
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/peers')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return res.json(channel.getPeers());
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================
router.route('/org/:org/channel/:channel_id/chaincodes')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return channel.queryInstantiatedChaincodes(channel.getPeers()[0], true)
                    .then(queryResponses => {
                        return res.json(convertObject.convertChaincodeArray2JSON(queryResponses));
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/chaincode/:chaincode/id/:id')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        let chaincode = req.params.chaincode;
        let id = req.params.id;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                let requestData = {
                    chaincodeId: chaincode,
                    fcn: 'getObject',
                    args: [id, 'log']
                };
                return query(channel, requestData)
            }).then(data => {
                if (!data) {
                    res.writeHead(404, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Could not found object with ID: ' + id);
                }
                else {
                    res.json(data);
                }
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel_id/chaincode/:chaincode/query')
    .post(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        let chaincode = req.params.chaincode;
        let data = req.body;
        let fcn = data.fcn;
        var obj = '';
        if (typeof data.obj === 'string' || data.obj instanceof String) {
            obj = data.obj;
        } else {
            obj = JSON.stringify(data.obj);
        }

        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                let requestData = {
                    chaincodeId: chaincode,
                    fcn: fcn,
                    args: [obj]
                };
                return query(channel, requestData)
            })
            .then(data => {
                if (!data) {
                    res.writeHead(404, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Query failed');
                }
                else {
                    res.json(data);
                }
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================


router.route('/org/:org/channel/:channel_id/chaincode/:chaincode/history/:object_id')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel_id = req.params.channel_id;
        let chaincode = req.params.chaincode;
        let object_id = req.params.object_id;

        return encroll(org)
            .then(() => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                let requestData = {
                    chaincodeId: chaincode,
                    fcn: 'getHistoryOfObject',
                    args: [object_id]
                };
                return query(channel, requestData)
            })
            .then(data => {
                if (!data) {
                    res.writeHead(404, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Query failed');
                }
                else {
                    res.json(data);
                }
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

// router.route('/org/:org/channel/:channel_id/chaincode/:chaincode')
//     .post(function (req, res, next) {
//         let org = req.params.org;
//         let channel_id = req.params.channel_id;
//         let chaincode = req.params.chaincode;
//         let data = req.body;
//         let fcn = data.fcn;
//         let obj = data.obj;

//         if (obj.content) {
//             obj.content = JSON.stringify(obj.content);
//         }

//         return encroll(org)
//             .then(() => {
//                 let dataAsBytes = new Buffer(JSON.stringify(obj));
//                 let tx_id = client.newTransactionID();
//                 let requestData = {
//                     chaincodeId: chaincode,
//                     fcn: fcn,
//                     args: [dataAsBytes],
//                     txId: tx_id
//                 };
//                 return requestData;
//             })
//             .then((requestData) => {
//                 // client.loadFromConfig('configs/fabric-network-config/connection-profile.yaml');
//                 let channel = client.getChannel(channel_id);
//                 return submitTransaction(requestData, channel)
//             })
//             .then(status => {
//                 if (status == "SUCCESS") {
//                     res.writeHead(200, {
//                         'Content-Type': 'text/plain'
//                     });
//                     res.end('Added the object : ' + obj.id);
//                 }
//             }).catch(err => {
//                 if (err) return next(err);
//             });
//     });
// ======================================================

module.exports = router;