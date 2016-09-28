var ger_tests;

ger_tests = function(ESM) {
  var ns;
  ns = global.default_namespace;
  describe('#list_namespaces', function() {
    return it('should work', function() {
      return init_ger(ESM).then(function(ger) {
        return ger.list_namespaces().then(function(list) {
          return _.isArray(list).should.be["true"];
        });
      });
    });
  });
  describe('#event', function() {
    return it('should add events', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([ger.event(ns, 'p1', 'buy', 'c')]).then(function() {
          return ger.count_events(ns);
        }).then(function(count) {
          return count.should.equal(1);
        });
      });
    });
  });
  describe('#events', function() {
    return it('should work same events', function() {
      var exp_date;
      exp_date = new Date().toISOString();
      return init_ger(ESM).then(function(ger) {
        return ger.events([
          {
            namespace: ns,
            person: 'p1',
            action: 'a',
            thing: 't1'
          }, {
            namespace: ns,
            person: 'p1',
            action: 'a',
            thing: 't2',
            created_at: new Date().toISOString()
          }, {
            namespace: ns,
            person: 'p1',
            action: 'a',
            thing: 't3',
            expires_at: exp_date
          }
        ]).then(function() {
          return ger.count_events(ns);
        }).then(function(count) {
          return count.should.equal(3);
        });
      });
    });
  });
  describe('#count_events', function() {
    return it('should return 2 for 2 events', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([ger.event(ns, 'p1', 'buy', 'c'), ger.event(ns, 'p1', 'view', 'c')]).then(function() {
          return ger.count_events(ns);
        }).then(function(count) {
          return count.should.equal(2);
        });
      });
    });
  });
  describe('recommendations_for_person', function() {
    it('should recommend basic things', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p2', {
            actions: {
              view: 1,
              buy: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights[0].thing.should.equal('a');
          return item_weights.length.should.equal(1);
        });
      });
    });
    it('should recommend things based on user history', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'd', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'buy', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            actions: {
              view: 1,
              buy: 1
            }
          });
        }).then(function(recommendations) {
          var i, item_weights, items;
          item_weights = recommendations.recommendations;
          items = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = item_weights.length; j < len; j++) {
              i = item_weights[j];
              results.push(i.thing);
            }
            return results;
          })();
          (items[0] === 'a' || items[0] === 'c').should.equal(true);
          return items[2].should.equal('d');
        });
      });
    });
    it('should take a person and reccommend some things', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'c', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'd', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            actions: {
              view: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights[0].thing.should.equal('a');
          item_weights[1].thing.should.equal('c');
          return item_weights[2].thing.should.equal('d');
        });
      });
    });
    it('should filter previously actioned things based on filter events option', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([ger.event(ns, 'p1', 'buy', 'a')]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            filter_previous_actions: ['buy'],
            actions: {
              buy: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          return item_weights.length.should.equal(0);
        });
      });
    });
    it('should filter actioned things from other people', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'buy', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            filter_previous_actions: ['buy'],
            actions: {
              buy: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights.length.should.equal(1);
          return item_weights[0].thing.should.equal('c');
        });
      });
    });
    it('should filter previously actioned by someone else', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'a', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            filter_previous_actions: ['buy'],
            actions: {
              buy: 1,
              view: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          return item_weights.length.should.equal(0);
        });
      });
    });
    it('should not filter non actioned things', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'buy', 'a', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            filter_previous_actions: ['buy'],
            actions: {
              buy: 1,
              view: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights.length.should.equal(1);
          return item_weights[0].thing.should.equal('a');
        });
      });
    });
    it('should not break with weird names (SQL INJECTION)', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, "'p\n,1};", "v'i\new", "'a\n;", {
            expires_at: tomorrow
          }), ger.event(ns, "'p\n2};", "v'i\new", "'a\n;", {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, "'p\n,1};", {
            actions: {
              "v'i\new": 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights[0].thing.should.equal("'a\n;");
          return item_weights.length.should.equal(1);
        });
      });
    });
    it('should return the last_actioned_at date it was actioned at', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'b', {
            created_at: soon,
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'b', {
            created_at: yesterday,
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, "p1", {
            actions: {
              view: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights.length.should.equal(2);
          item_weights[0].thing.should.equal("a");
          item_weights[1].thing.should.equal("b");
          return (item_weights[1].last_actioned_at.replace(".", "")).should.equal(soon.format());
        });
      });
    });
    it('should return the last_expires_at date it was expires at', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'b', {
            expires_at: next_week
          })
        ]).then(function() {
          return ger.recommendations_for_person(ns, "p1", {
            actions: {
              view: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights.length.should.equal(2);
          item_weights[0].thing.should.equal("a");
          (item_weights[0].last_expires_at.replace(".", "")).should.equal(tomorrow.format());
          item_weights[1].thing.should.equal("b");
          return (item_weights[1].last_expires_at.replace(".", "")).should.equal(next_week.format());
        });
      });
    });
    it('should people that contributed to recommendation', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p2', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a'), ger.event(ns, 'p1', 'view', 'a')
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            actions: {
              view: 1,
              buy: 1
            }
          });
        }).then(function(recommendations) {
          var item_weights;
          item_weights = recommendations.recommendations;
          item_weights[0].thing.should.equal('a');
          item_weights[0].people.should.include('p2');
          return item_weights[0].people.length.should.equal(1);
        });
      });
    });
    return it('should return neighbourhood', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'view', 'a'), ger.event(ns, 'p2', 'buy', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'view', 'a'), ger.event(ns, 'p3', 'buy', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'view', 'a'), ger.event(ns, 'p3', 'view', 'd')
        ]).then(function() {
          return ger.recommendations_for_person(ns, 'p1', {
            actions: {
              view: 1,
              buy: 1
            }
          });
        }).then(function(recommendations) {
          return recommendations.neighbourhood['p2'].should.exist;
        });
      });
    });
  });
  describe('thing_neighbourhood', function() {
    it('should list things of people who actioned a thing', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'v', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'v', 'b', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.thing_neighbourhood(ns, 'a', {
            'v': 1
          });
        }).then(function(neighbourhood) {
          neighbourhood.length.should.equal(1);
          return neighbourhood.map(function(x) {
            return x.thing;
          }).should.include('b');
        });
      });
    });
    it('should not list things twice', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'v', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'b', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'v', 'b', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.thing_neighbourhood(ns, 'a', {
            'v': 1,
            'b': 1
          });
        }).then(function(neighbourhood) {
          neighbourhood.length.should.equal(1);
          return neighbourhood.map(function(x) {
            return x.thing;
          }).should.include('b');
        });
      });
    });
    return it('should list things which cannot be recommended', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'v', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'v', 'b', {
            expires_at: yesterday
          }), ger.event(ns, 'p1', 'v', 'c', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.thing_neighbourhood(ns, 'a', {
            'v': 1
          });
        }).then(function(neighbourhood) {
          neighbourhood.length.should.equal(1);
          return neighbourhood.map(function(x) {
            return x.thing;
          }).should.include('c');
        });
      });
    });
  });
  return describe('person_neighbourhood', function() {
    it('should return a list of similar people', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'action1', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'action1', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p4', 'action1', 'd', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.person_neighbourhood(ns, 'p1', {
            'action1': 1
          });
        }).then(function(similar_people) {
          similar_people.should.include('p2');
          return similar_people.should.include('p3');
        });
      });
    });
    return it('should handle a non associated person', function() {
      return init_ger(ESM).then(function(ger) {
        return bb.all([
          ger.event(ns, 'p1', 'action1', 'not', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p2', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'action1', 'a', {
            expires_at: tomorrow
          }), ger.event(ns, 'p1', 'action1', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p3', 'action1', 'b', {
            expires_at: tomorrow
          }), ger.event(ns, 'p4', 'action1', 'd', {
            expires_at: tomorrow
          })
        ]).then(function() {
          return ger.person_neighbourhood(ns, 'p1', {
            'action1': 1
          });
        }).then(function(similar_people) {
          return similar_people.length.should.equal(2);
        });
      });
    });
  });
};

module.exports = ger_tests;