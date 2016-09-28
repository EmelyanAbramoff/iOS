var ger_tests;

ger_tests = function(ESM) {
  var ns;
  ns = global.default_namespace;
  return describe('recommending for a thing', function() {
    it('works never returns null weight', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 1
            }
          });
        }).then(function(recs) {
          var i, len, r, results;
          recs = recs.recommendations;
          results = [];
          for (i = 0, len = recs.length; i < len; i++) {
            r = recs[i];
            if (r.weight !== 0) {
              results.push((!!r.weight).should.equal(true));
            } else {
              results.push(void 0);
            }
          }
          return results;
        });
      });
    });
    it('should not recommend the same thing', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'b', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 2
            }
          });
        }).then(function(recs) {
          recs = recs.recommendations;
          recs.length.should.equal(1);
          return recs[0].thing.should.equal('b');
        });
      });
    });
    it('doesnt return expired things', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'c', {
            expires_at: yesterday
          })
        ]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 1
            }
          });
        }).then(function(recs) {
          recs = recs.recommendations;
          recs.length.should.equal(1);
          return recs[0].thing.should.equal('b');
        });
      });
    });
    it('should not more highly rate bad recommendations', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a'), ger.event(ns, 'p2', 'view', 'a'), ger.event(ns, 'p3', 'view', 'a'), ger.event(ns, 'p1', 'view', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'b', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 1
            }
          });
        }).then(function(recs) {
          recs = recs.recommendations;
          recs.length.should.equal(2);
          recs[0].thing.should.equal('b');
          recs[1].thing.should.equal('c');
          return recs[0].weight.should.be.greaterThan(recs[1].weight);
        });
      });
    });
    it('should not just recommend the popular things', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p4', 'view', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p5', 'view', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p6', 'view', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 1
            }
          });
        }).then(function(recs) {
          recs = recs.recommendations;
          recs.length.should.equal(2);
          recs[0].thing.should.equal('b');
          recs[1].thing.should.equal('c');
          return recs[0].weight.should.be.greaterThan(recs[1].weight);
        });
      });
    });
    describe('thing exploits', function() {
      return it('should not be altered by a single person doing the same thing a lot', function() {
        return init_ger(ESM).then(function(ger) {
          var events, i, x;
          events = [];
          for (x = i = 1; i <= 100; x = ++i) {
            events.push(ger.event(ns, "bad_person", 'view', 't2', {
              expires_at: tomorrow
            }));
            events.push(ger.event(ns, "bad_person", 'buy', 't2', {
              expires_at: tomorrow
            }));
          }
          return bb.all(events).then(function() {
            return bb.all([
              ger.event(ns, 'bad_person', 'view', 't1'), ger.event(ns, 'real_person', 'view', 't1'), ger.event(ns, 'real_person', 'view', 't3', {
                expires_at: tomorrow
              }), ger.event(ns, 'real_person', 'buy', 't3', {
                expires_at: tomorrow
              })
            ]);
          }).then(function() {
            return ger.recommendations_for_thing(ns, 't1', {
              actions: {
                buy: 1,
                view: 1
              }
            });
          }).then(function(recs) {
            var item_weights, j, len, temp, tw;
            item_weights = recs.recommendations;
            temp = {};
            for (j = 0, len = item_weights.length; j < len; j++) {
              tw = item_weights[j];
              temp[tw.thing] = tw.weight;
            }
            return temp['t2'].should.equal(temp['t3']);
          });
        });
      });
    });
    it('should not return any recommendations if none are there', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([ger.event(ns, 'p1', 'view', 'a')]).then(function() {
          return ger.recommendations_for_thing(ns, 'a', {
            actions: {
              view: 1
            }
          });
        }).then(function(recs) {
          recs.recommendations.length.should.equal(0);
          if (!_.isFinite(recs.confidence)) {
            throw "BAD Confidence " + recommendations_object.confidence;
          }
        });
      });
    });
    describe('time_until_expiry', function() {
      return it('should not return recommendations that will expire within time_until_expiry seconds', function() {
        var a1day, a2days, a3days, one_day, one_hour;
        one_hour = 60 * 60;
        one_day = 24 * one_hour;
        a1day = moment().add(1, 'days').format();
        a2days = moment().add(2, 'days').format();
        a3days = moment().add(3, 'days').format();
        return init_ger(ESM).then(function(ger) {
          return bb.all([
            ger.event(ns, 'p1', 'view', 'a'), ger.event(ns, 'p1', 'buy', 'x', {
              expires_at: a1day
            }), ger.event(ns, 'p1', 'buy', 'y', {
              expires_at: a2days
            }), ger.event(ns, 'p1', 'buy', 'z', {
              expires_at: a3days
            })
          ]).then(function() {
            return ger.recommendations_for_thing(ns, 'a', {
              time_until_expiry: one_day + one_hour,
              actions: {
                view: 1,
                buy: 1
              }
            });
          }).then(function(recs) {
            var sorted_recs;
            recs = recs.recommendations;
            recs.length.should.equal(2);
            sorted_recs = [recs[0].thing, recs[1].thing].sort();
            sorted_recs[0].should.equal('y');
            return sorted_recs[1].should.equal('z');
          });
        });
      });
    });
    describe("confidence", function() {
      return it('should return a confidence ', function() {
        return init_ger(ESM).then(function(ger) {
          return bb.all([
            ger.event(ns, 'p1', 'a', 't1'), ger.event(ns, 'p2', 'a', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return ger.recommendations_for_thing(ns, 't1', {
              actions: {
                a: 1
              }
            });
          }).then(function(recs) {
            recs.confidence.should.exist;
            return _.isFinite(recs.confidence).should.equal(true);
          });
        });
      });
    });
    return describe("weights", function() {
      return it("weights should determine the order of the recommendations", function() {
        return init_ger(ESM).then(function(ger) {
          return bb.all([
            ger.event(ns, 'p1', 'view', 'a'), ger.event(ns, 'p2', 'buy', 'a'), ger.event(ns, 'p1', 'view', 'b', {
              expires_at: tomorrow
            }), ger.event(ns, 'p2', 'view', 'c', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return ger.recommendations_for_thing(ns, 'a', {
              actions: {
                view: 1,
                buy: 1
              }
            });
          }).then(function(recs) {
            var item_weights;
            item_weights = recs.recommendations;
            item_weights.length.should.equal(2);
            item_weights[0].weight.should.equal(item_weights[1].weight);
            return ger.recommendations_for_thing(ns, 'a', {
              actions: {
                view: 1,
                buy: 2
              }
            });
          }).then(function(recs) {
            var item_weights;
            item_weights = recs.recommendations;
            item_weights[0].weight.should.be.greaterThan(item_weights[1].weight);
            item_weights[0].thing.should.equal('c');
            return item_weights[1].thing.should.equal('b');
          });
        });
      });
    });
  });
};

module.exports = ger_tests;