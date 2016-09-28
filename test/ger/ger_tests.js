var async_method_tests, compact_esm_tests, ger_integration_tests, ger_recommendations_for_people_tests, ger_recommendations_for_things_tests, test_ger;

async_method_tests = require('./async_method_tests');

compact_esm_tests = require('./compact_esm_tests');

ger_integration_tests = require('./ger_integration_tests');

ger_recommendations_for_people_tests = require('./ger_recommendations_for_people_tests');

ger_recommendations_for_things_tests = require('./ger_recommendations_for_things_tests');

test_ger = function(esm) {
  return describe("GER TEST: " + esm.name, function() {
    async_method_tests(esm);
    compact_esm_tests(esm);
    ger_integration_tests(esm);
    ger_recommendations_for_people_tests(esm);
    return ger_recommendations_for_things_tests(esm);
  });
};

module.exports = test_ger;