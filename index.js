'use strict';

var Promise = require('bluebird');
var Stream = require('stream');

var promisify = function(status, callback) {
    if (!callback && typeof status === 'function') {
        callback = status;
        status = null;
    }
    return function(req, res, next) {
        var result;
        try {
            result = callback(req, res, next)
        } catch (e) {
            result = Promise.reject(e)
        }

        // if it's null or undefined, do nothing
        if (result === null || result === undefined) {
            return;
        }

        // accepts promises or values
        Promise.resolve(result)
            .then(function (reqResult) {
                if (typeof status === 'number') {
                    res.status(status);
                }
                if (reqResult instanceof Stream) {
                    // if it's an instance of a stream, pipe it to the response
                    reqResult.pipe(res);
                } else if (typeof status === 'number' && status >= 300 && status < 400 && typeof reqResult === 'string') {
                    // if it's a redirect code, send a redirect
                    res.redirect(reqResult);
                } else {
                    // otherwise, send the result
                    res.send(reqResult);
                }
            })
            .then(null, next); // this ensures to catch any errors on the function above
    }
}

promisify.errorHandler = function (err, req, res, next) {
    if (err.stack) {
        console.error(err.stack);
    }
    if (typeof err === 'number') {
        res.sendStatus(err);
    } else if (err && err.status) {
        res.status(err.status).send(err);
    } else {
        res.status(500).send(err);
    }
};

module.exports = promisify;
