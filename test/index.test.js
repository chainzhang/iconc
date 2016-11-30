'use strict';

const mocha = require('mocha');
const should = require('should');
const path = require('path');
const Iconc = require('../');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;

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
            Object.keys(schema).forEach(key => {
                fs.existsSync(path.join(__dirname, `file/gen/${key}.png`)).should.be.true();
            });
            return done();
        });
    });

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

});