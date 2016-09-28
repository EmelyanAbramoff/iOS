var esm_tests;

esm_tests = function(ESM) {
  var ns;
  ns = "default";
  return describe('ESM compacting database', function() {
    describe('#compact_people', function() {
      it('should truncate the events of peoples history', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'view', 't3')]).then(function() {
            return esm.pre_compact(ns);
          }).then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            count.should.equal(3);
            return esm.compact_people(ns, 2, ['view']);
          }).then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(2);
          });
        });
      });
      return it('should truncate people by action', function() {
        return init_esm(ESM).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't2', {
              created_at: new Date(4000)
            }), esm.add_event(ns, 'p1', 'view', 't3', {
              created_at: new Date(3000)
            }), esm.add_event(ns, 'p1', 'buy', 't3', {
              created_at: new Date(1000)
            }), esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: new Date(5000)
            }), esm.add_event(ns, 'p1', 'buy', 't1', {
              created_at: new Date(6000)
            })
          ]).then(function() {
            return esm.pre_compact(ns);
          }).then(function() {
            return esm.compact_people(ns, 1, ['view', 'buy']);
          }).then(function() {
            return esm.post_compact(ns);
          }).then(function() {
            return bb.all([
              esm.count_events(ns), esm.find_events(ns, {
                person: 'p1',
                action: 'view',
                thing: 't1'
              }), esm.find_events(ns, {
                person: 'p1',
                action: 'buy',
                thing: 't1'
              })
            ]);
          }).spread(function(count, es1, es2) {
            count.should.equal(2);
            es1.length.should.equal(1);
            return es2.length.should.equal(1);
          });
        });
      });
    });
    describe('#compact_things', function() {
      it('should truncate the events of things history', function() {
        return init_esm(ESM).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p2', 'view', 't1'), esm.add_event(ns, 'p3', 'view', 't1')]).then(function() {
            return esm.pre_compact(ns);
          }).then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            count.should.equal(3);
            return esm.compact_things(ns, 2, ['view']);
          }).then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(2);
          });
        });
      });
      return it('should truncate things by action', function() {
        return init_esm(ESM).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: new Date(4000)
            }), esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: new Date(3000)
            }), esm.add_event(ns, 'p1', 'buy', 't1', {
              created_at: new Date(1000)
            }), esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: new Date(5000)
            }), esm.add_event(ns, 'p1', 'buy', 't1', {
              created_at: new Date(6000)
            })
          ]).then(function() {
            return esm.pre_compact(ns);
          }).then(function() {
            return esm.compact_things(ns, 1, ['view', 'buy']);
          }).then(function() {
            return esm.post_compact(ns);
          }).then(function() {
            return bb.all([
              esm.count_events(ns), esm.find_events(ns, {
                action: 'view',
                thing: 't1'
              }), esm.find_events(ns, {
                action: 'buy',
                thing: 't1'
              })
            ]);
          }).spread(function(count, es1, es2) {
            count.should.equal(2);
            es1.length.should.equal(1);
            return es2.length.should.equal(1);
          });
        });
      });
    });
    describe('#pre_compact', function() {
      return it('should prepare the ESM for compaction');
    });
    return describe('#post_compact', function() {
      return it('should perform tasks after compaction');
    });
  });
};

module.exports = esm_tests;