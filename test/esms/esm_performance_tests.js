var actions, esm_tests, j, k, people, random_created_at, results, results1, things;

actions = ["buy", "like", "view"];

people = (function() {
  results = [];
  for (j = 1; j <= 1000; j++){ results.push(j); }
  return results;
}).apply(this);

things = (function() {
  results1 = [];
  for (k = 1; k <= 1000; k++){ results1.push(k); }
  return results1;
}).apply(this);

random_created_at = function() {
  return moment().subtract(_.random(0, 120), 'minutes');
};

esm_tests = function(ESM) {
  return describe('performance tests', function() {
    var naction, nbevents, ncalcpeople, ncompact, nevents, nevents_diff, nfindpeople, nrecommendations, nrecpeople, ns;
    ns = 'default';
    naction = 50;
    nevents = 2000;
    nevents_diff = 25;
    nbevents = 10000;
    nfindpeople = 25;
    ncalcpeople = 25;
    ncompact = 3;
    nrecommendations = 40;
    nrecpeople = 25;
    return it("adding " + nevents + " events takes so much time", function() {
      var self;
      self = this;
      console.log("");
      console.log("");
      console.log("####################################################");
      console.log("################# Performance Tests ################");
      console.log("####################################################");
      console.log("");
      console.log("");
      this.timeout(360000);
      return init_ger(ESM, ns).then(function(ger) {
        var l, promises, ref, st, x;
        st = new Date().getTime();
        promises = [];
        for (x = l = 1, ref = nevents; 1 <= ref ? l <= ref : l >= ref; x = 1 <= ref ? ++l : --l) {
          promises.push(ger.event(ns, _.sample(people), _.sample(actions), _.sample(things), {
            created_at: random_created_at(),
            expires_at: tomorrow
          }));
        }
        return bb.all(promises).then(function() {
          var et, pe, time;
          et = new Date().getTime();
          time = et - st;
          pe = time / nevents;
          return console.log(pe + "ms per event");
        }).then(function() {
          var events, m, n, ref1, ref2, y;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = nevents / nevents_diff; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            events = [];
            for (y = n = 1, ref2 = nevents_diff; 1 <= ref2 ? n <= ref2 : n >= ref2; y = 1 <= ref2 ? ++n : --n) {
              events.push({
                namespace: ns,
                person: _.sample(people),
                action: _.sample(actions),
                thing: _.sample(things),
                created_at: random_created_at(),
                expires_at: tomorrow
              });
            }
            promises.push(ger.events(events));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / nevents;
            return console.log(pe + "ms adding events in " + nevents_diff + " per set");
          });
        }).then(function() {
          var m, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = ncompact; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            promises.push(ger.compact_database(ns, {
              actions: actions
            }));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / ncompact;
            return console.log(pe + "ms for compact");
          });
        }).then(function() {
          var m, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = nfindpeople; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            promises.push(ger.esm.person_neighbourhood(ns, _.sample(people), actions));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / nfindpeople;
            return console.log(pe + "ms per person_neighbourhood");
          });
        }).then(function() {
          var i, m, peeps, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = ncalcpeople; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            peeps = _.unique((function() {
              var n, results2;
              results2 = [];
              for (i = n = 0; n <= 25; i = ++n) {
                results2.push(_.sample(people));
              }
              return results2;
            })());
            promises.push(ger.esm.calculate_similarities_from_person(ns, _.sample(people), peeps, actions));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / ncalcpeople;
            return console.log(pe + "ms per calculate_similarities_from_person");
          });
        }).then(function() {
          var i, m, peeps, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = nrecpeople; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            peeps = _.unique((function() {
              var n, results2;
              results2 = [];
              for (i = n = 0; n <= 25; i = ++n) {
                results2.push(_.sample(people));
              }
              return results2;
            })());
            promises.push(ger.esm.recent_recommendations_by_people(ns, actions, peeps));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / ncalcpeople;
            return console.log(pe + "ms per recent_recommendations_by_people");
          });
        }).then(function() {
          var m, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = nrecommendations; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            promises.push(ger.recommendations_for_person(ns, _.sample(people), {
              actions: {
                buy: 5,
                like: 3,
                view: 1
              }
            }));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / nrecommendations;
            return console.log(pe + "ms per recommendations_for_person");
          });
        }).then(function() {
          var m, ref1;
          st = new Date().getTime();
          promises = [];
          for (x = m = 1, ref1 = nrecommendations; 1 <= ref1 ? m <= ref1 : m >= ref1; x = 1 <= ref1 ? ++m : --m) {
            promises.push(ger.recommendations_for_thing(ns, _.sample(things), {
              actions: {
                buy: 5,
                like: 3,
                view: 1
              },
              neighbourhood_size: 50,
              recommendations_per_neighbour: 3
            }));
          }
          return bb.all(promises).then(function() {
            var et, pe, time;
            et = new Date().getTime();
            time = et - st;
            pe = time / nrecommendations;
            return console.log(pe + "ms per recommendations_for_thing");
          });
        });
      }).then(function() {
        console.log("");
        console.log("");
        console.log("####################################################");
        console.log("################# END OF Performance Tests #########");
        console.log("####################################################");
        console.log("");
        return console.log("");
      });
    });
  });
};

module.exports = esm_tests;