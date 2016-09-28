var esm_tests;

esm_tests = function(ESM) {
  var ns;
  ns = "default";
  return describe('no namespace error', function() {
    return it('should initialize namespace', function() {
      var esm;
      esm = new_esm(ESM);
      return esm.add_event('not_a_namespace', 'p', 'a', 't').then(function() {
        throw "SHOULD NOT GET HERE";
      })["catch"](GER.NamespaceDoestNotExist, function(e) {
        return e.message.should.equal("namespace does not exist");
      });
    });
  });
};

module.exports = esm_tests;
module.exports = esm_tests;