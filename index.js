'use strict';

// node's Readable stream is broken since 10.5 (`end` event is not emited)
var readableStream = require('readable-stream');

var formidableStream = function (form, part) {
    var partStream = new readableStream.Readable();

    partStream.wrap({
        on: function (event, callback) {
            if (event === 'data' || event === 'end') {
                part.addListener.call(part, event, callback);
            } else {
                form.addListener.call(form, event, callback);
            }
        },
        pause: form.pause.bind(form),
        resume: form.resume.bind(form)
    });

    return partStream;
};

module.exports = formidableStream;
