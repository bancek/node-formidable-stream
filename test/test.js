var assert = require('assert'),
    should = require('chai').should(),
    http = require('http'),
    express = require('express'),
    formidable = require('formidable'),
    request = require('request'),
    fakeStream = require('fake-stream'),
    formidableStream = require('..');

describe('FormidableStream', function () {
    var app, server;

    beforeEach(function () {
        app = express();
        server = http.createServer(app).listen(3005);
    });

    afterEach(function () {
        server.close();
    });

    it('should convert formidable form part to stream', function (done) {
        app.post('/upload', function (req, res) {
            var form = new formidable.IncomingForm();

            form.onPart = function (part) {
                var partStream = formidableStream(form, part);
                var len = 0;

                partStream.on('data', function (data) {
                    len += data.length;
                });

                partStream.on('end', function () {
                    len.should.equal(5);
                    res.send(200);
                });
            };

            form.parse(req);
        });

        var r = request.post('http://localhost:3005/upload', function () {
            done();
        });

        r.form().append('file', fakeStream('12345', 'file.txt'));
    });

    it('should emit error if request is aborted', function (done) {
        app.post('/upload', function (req, res) {
            var form = new formidable.IncomingForm();

            // we need to handle error on request (server)
            req.on('error', function () {});

            form.onPart = function (part) {
                var partStream = formidableStream(form, part);
                var len = 0;

                partStream.on('data', function (data) {
                    len += data.length;
                });

                partStream.on('error', function () {
                    // length must be less than 2 MB
                    (len < (2 << 21)).should.be.true;

                    done();
                });
            };

            form.parse(req);
        });

        var r = request.post('http://localhost:3005/upload');

        // total size 8 MB, abort after 1 MB
        var st = fakeStream(2 << 23, 'file.txt', 2 << 20, function () {
            r.destroy();
        });

        r.form().append('file', st);

        // we need to handle error on request (client)
        r.on('error', function () {});
    });
});
