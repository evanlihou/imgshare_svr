'use strict';
const { expect } = require('code');
const { it, experiment } = (exports.lab = require('lab').script());
const Api = require('../api');
const Hapi = require('hapi');
require('dotenv').config();

experiment('.env file', () => {
    it('exists', () => {
        expect(process.env).to.exist();
    });

    it('has all necessary entries', () => {
        expect(process.env.MONGO_SVR).to.exist();
        expect(process.env.MONGO_USERNAME).to.exist();
        expect(process.env.MONGO_PASSWORD).to.exist();
        expect(process.env.MONGO_DB).to.exist();
        expect(process.env.SERVER_HOST).to.exist();
        expect(process.env.SERVER_PORT).to.exist();
    });
});

experiment('Api', () => {
    it('can register the mongodb plugin');
});
