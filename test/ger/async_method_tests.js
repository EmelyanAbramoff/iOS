var ger_tests;

ger_tests = function(ESM) {
  var actions, add_events, compact, log, ns, people, random_created_at, recommend, things;
  actions = ["view"];
  people = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  things = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  ns = global.default_namespace;
  log = false;
  random_created_at = function() {
    return moment().subtract(_.random(0, 120), 'minutes');
  };
  compact = function(ger) {
    return ger.compact_database(ns, {
      compact_database_person_action_limit: 10,
      compact_database_thing_action_limit: 10,
      actions: actions
    }).then(function() {
      if (log) {
        return console.log('finish compact');
      }
    });
  };
  add_events = function(ger, n) {
    var events, j, ref, y;
    if (n == null) {
      n = 100;
    }
    events = [];
    for (y = j = 1, ref = n; 1 <= ref ? j <= ref : j >= ref; y = 1 <= ref ? ++j : --j) {
      events.push({
        namespace: ns,
        person: _.sample(people),
        action: _.sample(actions),
        thing: _.sample(things),
        created_at: random_created_at(),
        expires_at: tomorrow
      });
    }
    return ger.events(events).then(function() {
      if (log) {
        return console.log('finish events');
      }
    });
  };
  recommend = function(ger) {
    return ger.recommendations_for_person(ns, _.sample(people), {
      actions: {
        buy: 5,
        like: 3,
        view: 1
      }
    }).then(function() {
      if (log) {
        return console.log('finish recs');
      }
    });
  };
  return describe('Async Method Tests', function() {
    return it("should not break when all functions are running at the same time", function() {
      var n, self, time;
      self = this;
      console.log("");
      console.log("");
      console.log("####################################################");
      console.log("############## Async          Tests ################");
      console.log("####################################################");
      console.log("");
      console.log("");
      time = 500;
      this.timeout(time + (20 * 1000));
      n = 5;
      return init_ger(ESM).then(function(ger) {
        var i, j, promises, ref;
        promises = [];
        for (i = j = 1, ref = n; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
          promises.push(compact(ger).then(function() {
            return add_events(ger);
          }).then(function() {
            return recommend(ger);
          }));
          promises.push(compact(ger).then(function() {
            return recommend(ger);
          }).then(function() {
            return add_events(ger);
          }));
          promises.push(add_events(ger).then(function() {
            return recommend(ger);
          }).then(function() {
            return compact(ger);
          }));
          promises.push(add_events(ger).then(function() {
            return compact(ger);
          }).then(function() {
            return recommend(ger);
          }));
          promises.push(recommend(ger).then(function() {
            return compact(ger);
          }).then(function() {
            return add_events(ger);
          }));
          promises.push(recommend(ger).then(function() {
            return add_events(ger);
          }).then(function() {
            return compact(ger);
          }));
        }
        return bb.all(promises);
      }).then(function() {
        console.log("");
        console.log("");
        console.log("####################################################");
        console.log("################ END OF Async        Tests #########");
        console.log("####################################################");
        console.log("");
        return console.log("");
      });
    });
  });
};

module.exports = ger_tests;