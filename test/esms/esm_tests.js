var api_tests, compact_tests, esm_errors, esm_performance_tests, test_esm;

api_tests = require('./esm_api_tests');

compact_tests = require('./esm_compact_tests');

esm_errors = require('./esm_errors');

esm_performance_tests = require('./esm_performance_tests');

test_esm = function (esm) {
    return describe("ESM TEST: " + esm.name, function () {
        api_tests(esm);
        compact_tests(esm);
        esm_errors(esm);
        return esm_performance_tests(esm);
    });
};

module.exports = test_esm;