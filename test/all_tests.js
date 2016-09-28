var all_tests, esm_tests, ger_tests;

esm_tests = require('./esms/esm_tests');

ger_tests = require('./ger/ger_tests');

all_tests = function (ESM) {
    esm_tests(ESM);
    return ger_tests(ESM);
};

module.exports = all_tests;