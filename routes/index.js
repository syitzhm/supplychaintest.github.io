var express = require('express');
const constants = require(__dirname + '/../utils/constants');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  let channelID = constants.ChannelName;
  let channelName = constants.ChannelDict[channelID];
  let chaincode = constants.ChainCodeId;
  res.render('templates/index', { channelID: channelID, channelName: channelName, chaincode: chaincode });
});

router.get('/block/:block_num', function (req, res, next) {
  let channelID = constants.ChannelName;
  let channelName = constants.ChannelDict[channelID];
  let block_num = req.params.block_num;
  res.render('templates/block-info', { channelID: channelID, channelName: channelName, num: block_num });
});

router.get('/txid/:txid', function (req, res, next) {
  let channelID = constants.ChannelName;
  let channelName = constants.ChannelDict[channelID];
  let txid = req.params.txid;
  res.render('templates/transaction-info', { channelID: channelID, channelName: channelName, txid: txid });
});

router.get('/doc/:docid', function (req, res, next) {
  let channelID = constants.ChannelName;
  let channelName = constants.ChannelDict[channelID];
  let docid = req.params.docid;
  let chaincode = constants.ChainCodeId;
  res.render('templates/document-info', { channelID: channelID, channelName: channelName, docid: docid, chaincode: chaincode });
});

router.get('/history/:docid', function (req, res, next) {
  let channelID = constants.ChannelName;
  let channelName = constants.ChannelDict[channelID];
  let docid = req.params.docid;
  let chaincode = constants.ChainCodeId;
  res.render('templates/document-history', { channelID: channelID, channelName: channelName, docid: docid, chaincode: chaincode });
});

router.get('/channel/:channelID', function (req, res, next) {
  let channelID = req.params.channelID;
  let channelName = constants.ChannelDict[channelID];
  let txid = req.query.txid;
  res.render('templates/channel-info', { channelID: channelID, channelName: channelName, txid: txid });
});

module.exports = router;
