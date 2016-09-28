var ger_tests;

ger_tests = function(ESM) {
  var ns;
  ns = global.default_namespace;
  return describe("compact ", function() {
    describe("compact_database_thing_action_limit", function() {
      return it('should truncate events on a thing to the set limit', function() {
        return init_ger(ESM).then(function(ger) {
          return bb.all([ger.event(ns, 'p1', 'view', 't1'), ger.event(ns, 'p2', 'view', 't1'), ger.event(ns, 'p3', 'view', 't1'), ger.event(ns, 'p1', 'view', 't2'), ger.event(ns, 'p2', 'view', 't2')]).then(function() {
            return ger.count_events(ns);
          }).then(function(count) {
            return count.should.equal(5);
          }).then(function() {
            return ger.compact_database(ns, {
              compact_database_thing_action_limit: 2,
              actions: ['view']
            });
          }).then(function() {
            return ger.compact_database(ns, {
              compact_database_thing_action_limit: 2,
              actions: ['view']
            });
          }).then(function() {
            return ger.count_events(ns);
          }).then(function(count) {
            return count.should.equal(4);
          });
        });
      });
    });
    describe("compact_database_person_action_limit", function() {
      return it('should truncate events by a person to the set limit', function() {
        return init_ger(ESM).then(function(ger) {
          return bb.all([ger.event(ns, 'p1', 'view', 't1'), ger.event(ns, 'p1', 'view', 't2'), ger.event(ns, 'p1', 'view', 't3'), ger.event(ns, 'p1', 'view', 't4'), ger.event(ns, 'p1', 'view', 't5'), ger.event(ns, 'p2', 'view', 't2'), ger.event(ns, 'p2', 'view', 't3')]).then(function() {
            return ger.count_events(ns);
          }).then(function(count) {
            return count.should.equal(7);
          }).then(function() {
            return ger.compact_database(ns, {
              compact_database_person_action_limit: 2,
              actions: ['view']
            });
          }).then(function() {
            return ger.compact_database(ns, {
              compact_database_person_action_limit: 2,
              actions: ['view']
            });
          }).then(function() {
            return ger.count_events(ns);
          }).then(function(count) {
            return count.should.equal(4);
          });
        });
      });
    });
    return it('should not deadlock', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 't1'), ger.event(ns, 'p1', 'view', 't2'), ger.event(ns, 'p1', 'view', 't3', {
            created_at: yesterday
          }), ger.event(ns, 'p2', 'view', 't3'), ger.event(ns, 'p3', 'view', 't3')
        ]).then(function() {
          return ger.count_events(ns);
        }).then(function(count) {
          return count.should.equal(5);
        }).then(function() {
          return ger.compact_database(ns, {
            compact_database_thing_action_limit: 2,
            compact_database_person_action_limit: 2,
            actions: ['view']
          });
        }).then(function() {
          return ger.count_events(ns);
        }).then(function(count) {
          return count.should.equal(4);
        });
      });
    });
  });
};

module.exports = ger_tests;