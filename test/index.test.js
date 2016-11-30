'use strict';

const mocha = require('mocha');
const should = require('should');
const path = require('path');
const Iconc = require('../');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const im = require('imagemagick');
const async = require('async');

const FILE = path.join(__dirname, './file/_icon_.png');

describe('iconc', () => {

    it('generate icons', (done) => {
        const dest = path.join(__dirname, 'file/gen');
        fs.removeSync(dest);
        fs.ensureDirSync(dest);

        const schema = {
            'icon-40': { w: 40 },
            'icon@2x': { p: 200 }
        };

        const iconc = new Iconc({
            file: FILE,
            schema: schema,
            dest: dest
        });

        iconc.run(err => {
            if (err) return done(err);
            async.series(Object.keys(schema).map(key => done => {
                const file = path.join(__dirname, `file/gen/${key}.png`);
                fs.existsSync(file).should.be.true();
                im.identify(file, (err, info) => {
                    if (err) return done(err);
                    // widthを検証
                    if (schema[key].w) {
                        schema[key].w.should.be.exactly(info.width);
                    }
                    done();
                });
            }), done)
        });
    });

    it('iconc command', (done) => {
        const sandbox = path.join(__dirname, './sandbox');

        fs.removeSync(sandbox);
        fs.ensureDirSync(sandbox);

        const child = spawn(path.join(__dirname, '../bin/iconc'), ['-f', '../file/_icon_.png', '-d', './gen', '-s', 'icon1:w100, icon2:w120, icon:p150'], {
            cwd: sandbox,
            stdio: 'inherit'
        });
        child.on('close', () => {
            Object.keys({
                icon1: { w: 100 },
                icon2: { w: 120 },
                icon: { p: 150 }
            }).forEach(name => {
                fs.existsSync(path.join(sandbox, `gen/${name}.png`)).should.be.true();
            });
            done();
        });
    });
/*
    it('iconc command', (done) => {
        const sandbox = path.join(__dirname, './sandbox');

        fs.removeSync(sandbox);
        fs.ensureDirSync(sandbox);
        fs.copySync(path.join(__dirname, 'IconcFile'), path.join(sandbox, 'IconcFile'));

        const child = spawn(path.join(__dirname, '../bin/iconc'), [], {
            cwd: sandbox,
            stdio: 'inherit'
        });
        child.on('close', () => {
            const iconcFile = require('./sandbox/IconcFile');
            Object.keys(iconcFile.schema).forEach(name => {
                fs.existsSync(path.join(path.resolve(sandbox, iconcFile.dest), `${name}.png`)).should.be.true();
            });
            done();
        });
    });
*/
});