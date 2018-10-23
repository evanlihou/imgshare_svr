'use strict';
const { expect } = require('code');
const { it, experiment } = (exports.lab = require('lab').script());
const Api = require('../api');
const Hapi = require('hapi');
require('dotenv').config();

const server = new Hapi.Server();

experiment('Server', () => {

    it('exists', () => {

        expect(server).to.exist();

    });

    it('can register the API', async () => {

        await server.register(Api).catch( (err) => {

            throw 'ERROR: ' + err;

        });

        expect(server.plugins.imgshare_svr.registered).to.be.true();

    });

    it('can start', async () => {

        await server.start();
        expect(server.info.started).to.be.greaterThan(0);

    });

});
