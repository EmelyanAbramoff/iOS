var chai, g, should;

chai = require('chai');

should = chai.should();

global.assert = chai.assert;

global._ = require('lodash');

global.bb = require('bluebird');

bb.Promise.longStackTraces();

g = require('../ger');

global.GER = g.GER;

global.target_db = process.env.TARGET_DB || "pg";

global.PsqlESM = g.PsqlESM;

global.MemESM = g.MemESM;

global.RethinkDBESM = g.RethinkDbESM;

global.fs = require('fs');

global.path = require('path');

global.Readable = require('stream').Readable;

global.moment = require("moment");

global._knex = g.knex({
  client: 'pg',
  pool: {
    min: 5,
    max: 20
  },
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres',
    database: 'ger_test'
  }
});

global.default_namespace = 'default';

global.last_week = moment().subtract(7, 'days');

global.three_days_ago = moment().subtract(2, 'days');

global.two_days_ago = moment().subtract(2, 'days');

global.yesterday = moment().subtract(1, 'days');

global.soon = moment().add(50, 'mins');

global.today = moment();

global.now = today;

global.tomorrow = moment().add(1, 'days');

global.next_week = moment().add(7, 'days');

global.new_esm = function(ESM) {
  var esm;
  return esm = new ESM({
    knex: _knex,
    conn: _conn
  });
};

global.init_esm = function(ESM, namespace) {
  var esm;
  if (namespace == null) {
    namespace = global.default_namespace;
  }
  esm = new_esm(ESM);
  return bb["try"](function() {
    return esm.destroy(namespace);
  }).then(function() {
    return esm.initialize(namespace);
  }).then(function() {
    return esm;
  });
};

global.init_ger = function(ESM, namespace) {
  if (namespace == null) {
    namespace = global.default_namespace;
  }
  return init_esm(ESM, namespace).then(function(esm) {
    return new GER(esm);
  });
};

global.compare_floats = function(f1, f2) {
  return Math.abs(f1 - f2) < 0.00001;
};

global.all_tests = require('./all_tests');