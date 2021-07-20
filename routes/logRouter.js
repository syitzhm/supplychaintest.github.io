var uuidv1 = require('uuid/v1');
var express = require('express');
var bodyParser = require('body-parser');
var Log = require('../models/log.js');
var constants = require('../utils/constants.js');

var router = express.Router();
router.use(bodyParser.json());

router.route('/')
.get(function (req, res, next) {      
    Log.getAll().then(logs => {       
        logs.sort(Log.sortByTimestampDesc);
        res.json(logs);
    }).catch(err => {
        if(err) return next(err);
    }); 
})

.post(function (req, res, next) {

    let log = undefined;
    if ( (req.body instanceof Array) && req.body.length >0 ) {
        log = req.body[0]
    }else
    {
        log = req.body;
    }

    if(log.content)
        log.content = JSON.stringify(log.content);
     
    var newLog = new Log({
        id:         log.id ||uuidv1(),
        objectType: constants.ObjectTypes.Log,
        time:       log.time,
        ref:        log.ref,
        cte:        log.cte,
        content:    log.content,
        supplychain_id : req.body.supplychain_id,
        asset:      log.asset,
        product:    log.product,
        location:   log.location
    })
    newLog.create().then(status => {        
        if(status == "SUCCESS")
        {
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Added the Log : ' + newLog.id);        
        }
    }).catch(err => {
        if(err) return next(err);        
    });    
})

.delete(function (req, res, next) {
    return next(new Error('Out of scope, this action is not implemented yet.'));
});

// ======================================================

router.route('/:logId')
.get(function (req, res, next) {    
    Log.find(req.params.logId).then(Log => {       
        res.json(Log);
    }).catch(err => {
        if(err) return next(err);
    });    
})

.put(function (req, res, next) {
    var newLog = new Log({
        id:         req.params.logId,        
        time:       req.body.time,
        ref:        req.body.ref,
        cte:        req.body.cte,
        content:    req.body.content,
        supplychain_id: req.body.supplychain_id,
        asset:      req.body.asset,
        product:    req.body.product,
        location:   req.body.location
    })

    if(newLog.content)
    newLog.content = JSON.stringify(newLog.content);

    newLog.update().then(status => {        
        if(status == "SUCCESS")
        {
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Updated the Log : ' + newLog.id);
        }
    }).catch(err => {
        if(err) return next(err);
    });
})

.delete(function (req, res, next) {    
    return next(new Error('Out of scope, this action is not implemented yet.'));
});

// ======================================================

module.exports = router;