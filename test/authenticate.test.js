'use strict';
const { expect } = require('code');
const { it, experiment } = (exports.lab = require('lab').script());
require('dotenv').config();

// Do database setup here
// i.e. create user with known credentials directly through db calls

experiment('Authenticate endpoint', () => {
    it('requires a username in the request');
    it('requires a password in the request');
    it('throws for non-existent user');
    it('throws for wrong password');
    it('succeeds for correct credentials');
    it("doesn't return password hashes");
    it('returns the username');
    it('returns an API key');
    it("returns the user's permissions");
});

// Do database cleanup here
// i.e. delete the user we created
