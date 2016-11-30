'use strict';

const path = require('path');
const async = require('async');
const assert = require('assert');
const im = require('imagemagick')
const fs = require('fs-extra');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const Yaml = require('js-yaml');

const EVENT_DATA = 'data';
const EVENT_END = 'end';

function Iconc(params) {
    EventEmitter.call(this);

    params = params || {};
    this.file = params.file;
    this.dest = params.dest;
    this.schema = params.schema;

    assert(this.file, 'params.file is required');
    assert(this.dest, 'params.dest is required');
    assert(this.schema, 'params.schema is required');
    assert(['string', 'object'].indexOf(typeof(this.schema)) >= 0, 'schema should be a file path or object');

    this.dest = path.resolve(process.cwd(), this.dest);
    this.file = path.resolve(process.cwd(), this.file);
}

util.inherits(Iconc, EventEmitter);

Iconc.prototype.run = function(done) {
    const self = this;
    async.waterfall([
        (done) => fs.exists(self.file, exists => exists ? done() : done(new Error(`not found: ${self.file}`))),
        (done) => {
            if (typeof(self.schema) == 'string') {
                return fs.exists(self.schema, exists => {
                    if (!exists) {
                        return done(new Error(`schema: ${self.schema} not found`));
                    }
                    self.schema = path.resolve(process.cwd(), self.schema);
                    if (self.schema.endsWith('.yaml') || self.schema.endsWith('.yml')) {
                        self.schema = Yaml.safeLoad(fs.readFileSync(self.schema));
                    } else if (self.schema.endsWith('.json')) {
                        self.schema = JSON.parse(fs.readFileSync(self.schema));
                    } else {
                        self.schema = require(self.schema);
                    }
                    return done();
                })
            }
            done();
        },
        (done) => im.identify(self.file, done),
        (info, done) => {
            fs.ensureDirSync(self.dest);
            async.series(Object.keys(self.schema).map(name => {
                return (done) => {
                    const s = self.schema[name];
                    const dst = path.join(self.dest, `${name}${path.extname(self.file)}`);

                    const opt = {
                        srcPath: self.file,
                        dstPath: dst
                    };
                    if (s.w) {
                        opt.width = s.w;
                    }
                    if (s.p) {
                        opt.width = info.width * s.p/100;
                    }
                    if (!opt.width && !opt.height) {
                        return done(new Error('invalid schema'));
                    }
                    im.resize(opt, err => {
                        if (err) return done(err);
                        self.emit(EVENT_DATA, dst);
                        return done(null, dst);
                    });
                }
            }), done);
        }
    ], (err, files) => {
        if (err) return done(err);
        self.emit(EVENT_END);
        return done();
    });
};

module.exports = Iconc;
