'use strict';

var Promise = require('bluebird');

var promisify = function(status, fn) {
    if (!fn && typeof status === 'function') {
        fn = status;
        status = null;
    }
    return function(req, res, next) {
        var result;
        try {
            result = fn(req, res, next)
        } catch (e) {
            result = Promise.reject(e)
        }


        if (result === null || result === undefined) {
            return;
        }

        Promise.resolve(result)
            .then(function (reqResult) {
                if (status) {
                    res.status(status);
                    if (status >= 300 && status < 400 && typeof reqResult === 'string') {
                        res.redirect(reqResult);
                        return;
                    }
                }
                res.send(reqResult);
            })
            .then(null, next); // this ensures to catch any errors on the function above
    }
}

promisify.errorHandler = function (err) {
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
