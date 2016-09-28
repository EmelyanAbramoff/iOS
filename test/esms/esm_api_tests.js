var esm_tests;

esm_tests = function(ESM) {
  var ns;
  ns = "default";
  describe('construction', function() {
    return describe('namespace operations', function() {
      it('#list_namespaces should list all namespaces', function() {
        var esm, ns1, ns2;
        ns1 = "namespace1";
        ns2 = "namespace2";
        esm = new_esm(ESM);
        return bb.all([esm.destroy(ns1), esm.destroy(ns2)]).then(function() {
          return esm.list_namespaces();
        }).then(function(list) {
          list.should.not.include(ns1);
          return list.should.not.include(ns2);
        }).then(function() {
          return bb.all([esm.initialize(ns1), esm.initialize(ns2)]);
        }).then(function() {
          return esm.list_namespaces();
        }).then(function(list) {
          list.should.include(ns1);
          return list.should.include(ns2);
        });
      });
      it('should initialize namespace', function() {
        var esm, namespace;
        namespace = "namespace";
        esm = new_esm(ESM);
        return esm.destroy(namespace).then(function() {
          return esm.exists(namespace);
        }).then(function(exist) {
          return exist.should.equal(false);
        }).then(function() {
          return esm.initialize(namespace);
        }).then(function() {
          return esm.exists(namespace);
        }).then(function(exist) {
          return exist.should.equal(true);
        });
      });
      it('should sucessfully initialize namespace with default', function() {
        var esm, namespace;
        namespace = "new_namespace";
        esm = new_esm(ESM);
        return esm.destroy(namespace).then(function() {
          return esm.exists(namespace);
        }).then(function(exist) {
          return exist.should.equal(false);
        }).then(function() {
          return esm.initialize(namespace);
        }).then(function() {
          return esm.exists(namespace);
        }).then(function(exist) {
          return exist.should.equal(true);
        });
      });
      it('should start with no events', function() {
        var esm, namespace;
        namespace = "namespace";
        esm = new_esm(ESM);
        return esm.destroy(namespace).then(function() {
          return esm.initialize(namespace);
        }).then(function() {
          return esm.count_events(namespace);
        }).then(function(count) {
          return count.should.equal(0);
        });
      });
      it('should not error out or remove events if re-initialized', function() {
        var esm, namespace;
        namespace = "namespace";
        esm = new_esm(ESM);
        return esm.destroy().then(function() {
          return esm.initialize(namespace);
        }).then(function() {
          return esm.add_event(namespace, 'p', 'a', 't');
        }).then(function() {
          return esm.count_events(namespace);
        }).then(function(count) {
          return count.should.equal(1);
        }).then(function() {
          return esm.initialize(namespace);
        }).then(function() {
          return esm.count_events(namespace);
        }).then(function(count) {
          return count.should.equal(1);
        });
      });
      it('should create resources for ESM namespace', function() {
        var esm, ns1, ns2;
        ns1 = "namespace1";
        ns2 = "namespace2";
        esm = new_esm(ESM);
        return bb.all([esm.destroy(ns1), esm.destroy(ns2)]).then(function() {
          return bb.all([esm.initialize(ns1), esm.initialize(ns2)]);
        }).then(function() {
          return bb.all([esm.add_event(ns1, 'p', 'a', 't'), esm.add_event(ns1, 'p1', 'a', 't'), esm.add_event(ns2, 'p2', 'a', 't')]);
        }).then(function() {
          return bb.all([esm.count_events(ns1), esm.count_events(ns2)]);
        }).spread(function(c1, c2) {
          c1.should.equal(2);
          return c2.should.equal(1);
        });
      });
      return it('should destroy should not break if resource does not exist', function() {
        var esm, namespace;
        namespace = "namespace";
        esm = new_esm(ESM);
        return esm.destroy(namespace).then(function() {
          return esm.destroy(namespace);
        });
      });
    });
  });
  describe('recommendation methods', function() {
    describe('#thing_neighbourhood', function() {
      it('should limit its search to event number of neighbourhood_search_size', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              created_at: yesterday
            }), esm.add_event(ns, 'p1', 'view', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't3', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 't1', ['view'], {
              neighbourhood_search_size: 1
            });
          }).then(function(things) {
            things.length.should.equal(1);
            return things[0].thing.should.equal('t2');
          }).then(function() {
            return esm.thing_neighbourhood(ns, 't1', ['view'], {
              neighbourhood_search_size: 2
            });
          }).then(function(things) {
            return things.length.should.equal(2);
          });
        });
      });
      it('should return a list of objects with thing, max_created_at, max_expires_at', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'view', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 't1', ['view']);
          }).then(function(things) {
            things.length.should.equal(1);
            return things[0].thing.should.equal('t2');
          });
        });
      });
      it('should return a list of people who actioned thing', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'view', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't3', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 't1', ['view']);
          }).then(function(things) {
            things.length.should.equal(2);
            things[0].people.length.should.equal(2);
            things[0].people.should.include('p1');
            return things[0].people.should.include('p2');
          });
        });
      });
      it('should return a list of unique people', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'view', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't3', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 't1', ['view']);
          }).then(function(things) {
            things.length.should.equal(2);
            things[0].people.length.should.equal(2);
            things[0].people.should.include('p1');
            return things[0].people.should.include('p2');
          });
        });
      });
      it('should not list things twice', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'v', 'a', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'b', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'v', 'b', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 'a', ['v', 'b']);
          }).then(function(neighbourhood) {
            neighbourhood.length.should.equal(1);
            return neighbourhood[0].thing.should.equal('b');
          });
        });
      });
      it('should list recommendable things', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'v', 'a', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'v', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'v', 'c', {
              expires_at: yesterday
            }), esm.add_event(ns, 'p1', 'v', 'd')
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 'a', ['v']);
          }).then(function(neighbourhood) {
            neighbourhood.length.should.equal(1);
            return neighbourhood[0].thing.should.equal('b');
          });
        });
      });
      it('should order the things by how many people actioned it', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'v', 'a', {
              created_at: last_week,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'v', 'a', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'v', 'a', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'v', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'v', 'c', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'v', 'c', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 'a', ['v']);
          }).then(function(neighbourhood) {
            neighbourhood.length.should.equal(2);
            neighbourhood[0].thing.should.equal('c');
            neighbourhood[0].people.length.should.equal(2);
            neighbourhood[1].thing.should.equal('b');
            return neighbourhood[1].people.length.should.equal(1);
          });
        });
      });
      it('should return the last_expires_at and last_actioned_at', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'v', 'a'), esm.add_event(ns, 'p2', 'v', 'a'), esm.add_event(ns, 'p3', 'v', 'a'), esm.add_event(ns, 'p1', 'v', 'b', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'v', 'b', {
              created_at: today,
              expires_at: yesterday
            }), esm.add_event(ns, 'p3', 'v', 'b', {
              created_at: last_week
            })
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 'a', ['v']);
          }).then(function(neighbourhood) {
            neighbourhood.length.should.equal(1);
            neighbourhood[0].thing.should.equal('b');
            moment(neighbourhood[0].last_actioned_at).unix().should.equal(today.unix());
            return moment(neighbourhood[0].last_expires_at).unix().should.equal(tomorrow.unix());
          });
        });
      });
      return it('should return a unique list of the people that actioned the things (and ordered by number of people)', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'v', 'a'), esm.add_event(ns, 'p2', 'v', 'a'), esm.add_event(ns, 'p1', 'v', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'x', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'v', 'b', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'v', 'c', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'v', 'c')
          ]).then(function() {
            return esm.thing_neighbourhood(ns, 'a', ['v', 'x']);
          }).then(function(neighbourhood) {
            neighbourhood.length.should.equal(2);
            neighbourhood[0].thing.should.equal('b');
            neighbourhood[1].thing.should.equal('c');
            neighbourhood[0].people.length.should.equal(2);
            neighbourhood[0].people.should.include('p1');
            neighbourhood[0].people.should.include('p2');
            neighbourhood[1].people.length.should.equal(1);
            return neighbourhood[1].people.should.include('p1');
          });
        });
      });
    });
    describe('#calculate_similarities_from_thing', function() {
      return it('more similar histories should be greater', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'a', 't1'), esm.add_event(ns, 'p2', 'a', 't1'), esm.add_event(ns, 'p1', 'a', 't2'), esm.add_event(ns, 'p2', 'a', 't2'), esm.add_event(ns, 'p2', 'a', 't3')]).then(function() {
            return esm.calculate_similarities_from_thing(ns, 't1', ['t2', 't3'], {
              a: 1
            });
          }).then(function(similarities) {
            return similarities['t3'].should.be.lessThan(similarities['t2']);
          });
        });
      });
    });
    describe('#person_neighbourhood', function() {
      it('should return a list of similar people', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'buy', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'buy', 't1', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy']);
          }).then(function(people) {
            return people.length.should.equal(1);
          });
        });
      });
      it('should not return people who have no unexpired events (i.e. potential recommendations) or in actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'view', 't1', {
              expires_at: yesterday
            }), esm.add_event(ns, 'p4', 'view', 't1'), esm.add_event(ns, 'p5', 'view', 't1'), esm.add_event(ns, 'p5', 'likes', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy']);
          }).then(function(people) {
            return people.length.should.equal(1);
          });
        });
      });
      it('should not return more people than limited', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p4', 'view', 't1', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy'], {
              neighbourhood_size: 1
            });
          }).then(function(people) {
            people.length.should.equal(1);
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy'], {
              neighbourhood_size: 2
            });
          }).then(function(people) {
            return people.length.should.equal(2);
          });
        });
      });
      it('should not return the given person', function() {
        this.timeout(360000);
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view']);
          }).then(function(people) {
            return people.length.should.equal(0);
          });
        });
      });
      it('should only return people related via given actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'buy', 't1', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['buy']);
          }).then(function(people) {
            return people.length.should.equal(0);
          }).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view']);
          }).then(function(people) {
            return people.length.should.equal(0);
          });
        });
      });
      it('should return people with different actions on the same item', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'view', 't2', {
              created_at: today,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'buy', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy']);
          }).then(function(people) {
            people.length.should.equal(2);
            people.should.contain('p3');
            return people.should.contain('p2');
          });
        });
      });
      it('should return people ordered by the similar persons most recent date', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view', 'buy']);
          }).then(function(people) {
            people.length.should.equal(1);
            return people[0].should.equal('p2');
          });
        });
      });
      it('should find similar people across actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 'a'), esm.add_event(ns, 'p1', 'view', 'b'), esm.add_event(ns, 'p2', 'view', 'a'), esm.add_event(ns, 'p2', 'view', 'b'), esm.add_event(ns, 'p2', 'buy', 'x', {
              created_at: moment().subtract(2, 'days'),
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'view', 'a'), esm.add_event(ns, 'p3', 'buy', 'l', {
              created_at: moment().subtract(3, 'hours'),
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'buy', 'm', {
              created_at: moment().subtract(2, 'hours'),
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'buy', 'n', {
              created_at: moment().subtract(1, 'hours'),
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['buy', 'view']);
          }).then(function(people) {
            return people.length.should.equal(2);
          });
        });
      });
      return it('should be able to set current_datetime', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 'a', {
              created_at: moment().subtract(3, 'days')
            }), esm.add_event(ns, 'p1', 'view', 'b', {
              created_at: moment().subtract(1, 'days')
            }), esm.add_event(ns, 'p2', 'view', 'a', {
              created_at: moment().subtract(3, 'days'),
              expires_at: tomorrow
            }), esm.add_event(ns, 'p3', 'view', 'b', {
              created_at: moment().subtract(3, 'days'),
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.person_neighbourhood(ns, 'p1', ['view']);
          }).then(function(people) {
            people.length.should.equal(2);
            return esm.person_neighbourhood(ns, 'p1', ['view'], {
              current_datetime: moment().subtract(2, 'days')
            });
          }).then(function(people) {
            return people.length.should.equal(1);
          });
        });
      });
    });
    describe('#calculate_similarities_from_person', function() {
      it('handle weights of 0 and people with no hisotry, and people with no similar history', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'a', 't1'), esm.add_event(ns, 'p2', 'a', 't1'), esm.add_event(ns, 'p4', 'a', 't2')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3', 'p4'], {
              a: 0
            });
          }).then(function(similarities) {
            similarities['p2'].should.equal(0);
            similarities['p3'].should.equal(0);
            return similarities['p4'].should.equal(0);
          });
        });
      });
      it('more similar histories should be greater', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'a', 't1'), esm.add_event(ns, 'p1', 'a', 't2'), esm.add_event(ns, 'p2', 'a', 't1'), esm.add_event(ns, 'p2', 'a', 't2'), esm.add_event(ns, 'p3', 'a', 't1'), esm.add_event(ns, 'p3', 'a', 't3')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
              a: 1
            });
          }).then(function(similarities) {
            return similarities['p3'].should.be.lessThan(similarities['p2']);
          });
        });
      });
      it('should weight the actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'buy', 't2'), esm.add_event(ns, 'p2', 'view', 't1'), esm.add_event(ns, 'p3', 'buy', 't2')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
              view: 1,
              buy: 5
            });
          }).then(function(similarities) {
            return similarities['p3'].should.be.greaterThan(similarities['p2']);
          });
        });
      });
      it('should limit similarity measure on similarity_search_size (ordered by created_at)', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'a', 't3', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'a', 't1', {
              created_at: yesterday
            })
          ]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2'], {
              a: 1
            }, {
              similarity_search_size: 1
            });
          }).then(function(similarities) {
            return similarities['p2'].should.equal(0);
          }).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2'], {
              a: 1
            }, {
              similarity_search_size: 2
            });
          }).then(function(similarities) {
            return similarities['p2'].should.not.equal(0);
          });
        });
      });
      it('should not limit similarity measure similarity_search_size for non selected actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'b', 't3', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'a', 't1', {
              created_at: yesterday
            })
          ]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2'], {
              a: 1
            }, {
              similarity_search_size: 1
            });
          }).then(function(similarities) {
            return similarities['p2'].should.not.equal(0);
          });
        });
      });
      it('should handle multiple actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'A', 'r4', 'HP1'), esm.add_event(ns, 'A', 'r5', 'TW'), esm.add_event(ns, 'A', 'r1', 'SW1'), esm.add_event(ns, 'B', 'r5', 'HP1'), esm.add_event(ns, 'B', 'r5', 'HP2'), esm.add_event(ns, 'B', 'r4', 'HP3'), esm.add_event(ns, 'C', 'r2', 'TW'), esm.add_event(ns, 'C', 'r4', 'SW1'), esm.add_event(ns, 'C', 'r5', 'SW2')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'A', ['B', 'C'], {
              r1: -2,
              r2: -1,
              r3: 0,
              r4: 1,
              r5: 2
            });
          }).then(function(similarities) {
            return similarities['C'].should.be.lessThan(similarities['B']);
          });
        });
      });
      it('should calculate the similarity between a person and a set of people for a list of actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'a', 't1'), esm.add_event(ns, 'p2', 'a', 't1')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2'], {
              a: 1
            });
          }).then(function(similarities) {
            return similarities['p2'].should.exist;
          });
        });
      });
      it('should be ale to set current_datetime', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'view', 't2', {
              created_at: today
            }), esm.add_event(ns, 'p1', 'view', 't1', {
              created_at: three_days_ago
            }), esm.add_event(ns, 'p2', 'view', 't2', {
              created_at: today
            }), esm.add_event(ns, 'p2', 'view', 't1', {
              created_at: three_days_ago
            }), esm.add_event(ns, 'p3', 'view', 't1', {
              created_at: three_days_ago
            })
          ]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
              view: 1
            }, {
              current_datetime: two_days_ago
            });
          }).then(function(similarities) {
            similarities['p3'].should.equal(similarities['p2']);
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
              view: 1
            });
          }).then(function(similarities) {
            return similarities['p2'].should.be.greaterThan(similarities['p3']);
          });
        });
      });
      describe("recent events", function() {
        it('if p1 viewed a last week and b today, a person closer to b should be more similar', function() {
          return init_esm(ESM, ns).then(function(esm) {
            return bb.all([
              esm.add_event(ns, 'p1', 'view', 'a', {
                created_at: moment().subtract(7, 'days')
              }), esm.add_event(ns, 'p1', 'view', 'b', {
                created_at: today
              }), esm.add_event(ns, 'p2', 'view', 'b', {
                created_at: today
              }), esm.add_event(ns, 'p3', 'view', 'a', {
                created_at: today
              })
            ]).then(function() {
              return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
                view: 1
              }, {
                event_decay_rate: 1.05
              });
            }).then(function(similarities) {
              return similarities['p3'].should.be.lessThan(similarities['p2']);
            });
          });
        });
        return it('should calculate the recent event decay weight relative to current_datetime', function() {
          return init_esm(ESM, ns).then(function(esm) {
            return bb.all([
              esm.add_event(ns, 'p1', 'view', 'a', {
                created_at: today
              }), esm.add_event(ns, 'p1', 'view', 'b', {
                created_at: today
              }), esm.add_event(ns, 'p2', 'view', 'b', {
                created_at: yesterday
              }), esm.add_event(ns, 'p2', 'view', 'a', {
                created_at: today
              }), esm.add_event(ns, 'p1`', 'view', 'a', {
                created_at: yesterday
              }), esm.add_event(ns, 'p1`', 'view', 'b', {
                created_at: yesterday
              }), esm.add_event(ns, 'p2`', 'view', 'b', {
                created_at: two_days_ago
              }), esm.add_event(ns, 'p2`', 'view', 'a', {
                created_at: yesterday
              })
            ]).then(function() {
              var sim_today, sim_yesterday;
              sim_today = esm.calculate_similarities_from_person(ns, 'p1', ['p2'], {
                view: 1
              }, {
                event_decay_rate: 1.2,
                current_datetime: today
              });
              sim_yesterday = esm.calculate_similarities_from_person(ns, 'p1`', ['p2`'], {
                view: 1
              }, {
                event_decay_rate: 1.2,
                current_datetime: yesterday
              });
              return bb.all([sim_today, sim_yesterday]);
            }).spread(function(s1, s2) {
              return s1['p2'].should.equal(s2['p2`']);
            });
          });
        });
      });
      it('should not be effected by having same events (through add_event)', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'a', 't1'), esm.add_event(ns, 'p2', 'a', 't1'), esm.add_event(ns, 'p3', 'a', 't1'), esm.add_event(ns, 'p3', 'a', 't1')]).then(function() {
            return esm.calculate_similarities_from_person(ns, 'p1', ['p2', 'p3'], {
              a: 1
            });
          }).then(function(similarities) {
            return similarities['p2'].should.equal(similarities['p3']);
          });
        });
      });
      return it('should not be effected by having bad names', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, "'p\n,1};", "v'i\new", "'a\n;"), esm.add_event(ns, "'p\n2};", "v'i\new", "'a\n;")]).then(function() {
            return esm.calculate_similarities_from_person(ns, "'p\n,1};", ["'p\n2};"], {
              "v'i\new": 1
            });
          }).then(function(similarities) {
            return similarities["'p\n2};"].should.be.greaterThan(0);
          });
        });
      });
    });
    describe('#recent_recommendations_by_people', function() {
      it('should only return things created before current_datetime', function() {
        var a2daysago, a3daysago;
        a2daysago = moment().subtract(2, 'days');
        a3daysago = moment().subtract(3, 'days');
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: today,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't3', {
              created_at: a2daysago,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't4', {
              created_at: a3daysago,
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1']);
          }).then(function(people_recommendations) {
            people_recommendations.length.should.equal(4);
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1'], {
              current_datetime: yesterday
            });
          }).then(function(people_recommendations) {
            people_recommendations.length.should.equal(3);
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1'], {
              current_datetime: a2daysago
            });
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(2);
          });
        });
      });
      it('should return multiple things for multiple actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a1', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a2', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a1', 'a2'], ['p1']);
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(2);
          });
        });
      });
      it('should return things for multiple actions and multiple people', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a1', 't1', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'a2', 't2', {
              created_at: today,
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a1', 'a2'], ['p1', 'p2']);
          }).then(function(people_recommendations) {
            people_recommendations.length.should.equal(2);
            people_recommendations[0].person.should.equal('p2');
            people_recommendations[0].thing.should.equal('t2');
            people_recommendations[1].person.should.equal('p1');
            return people_recommendations[1].thing.should.equal('t1');
          });
        });
      });
      it('should return things for multiple people', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'a', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1', 'p2']);
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(2);
          });
        });
      });
      it('should not return things without expiry date', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't2')
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1']);
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(1);
          });
        });
      });
      it('should not return expired things', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              expires_at: yesterday
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1']);
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(1);
          });
        });
      });
      it('should return the same item for different people', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a1', 't', {
              created_at: yesterday,
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'a2', 't', {
              created_at: today,
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a1', 'a2'], ['p1', 'p2']);
          }).then(function(people_recommendations) {
            people_recommendations.length.should.equal(2);
            people_recommendations[0].person.should.equal('p2');
            people_recommendations[0].thing.should.equal('t');
            people_recommendations[1].person.should.equal('p1');
            return people_recommendations[1].thing.should.equal('t');
          });
        });
      });
      it('should be limited by related things limit', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              expires_at: tomorrow
            }), esm.add_event(ns, 'p2', 'a', 't2', {
              expires_at: tomorrow
            })
          ]).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1', 'p2'], {
              recommendations_per_neighbour: 1
            });
          }).then(function(people_recommendations) {
            return people_recommendations.length.should.equal(2);
          });
        });
      });
      it('should return the last_actioned_at last_expires_at', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p1', 'a', 't1', {
            created_at: yesterday,
            expires_at: tomorrow
          }).then(function() {
            return esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: today,
              expires_at: next_week
            });
          }).then(function() {
            return esm.recent_recommendations_by_people(ns, ['a'], ['p1', 'p2']);
          }).then(function(people_recommendations) {
            people_recommendations.length.should.equal(1);
            moment(people_recommendations[0].last_expires_at).unix().should.equal(next_week.unix());
            return moment(people_recommendations[0].last_actioned_at).unix().should.equal(today.unix());
          });
        });
      });
      return describe('time_until_expiry', function() {
        return it('should not return things that expire before the date passed', function() {
          var a1day, a2days, a3days;
          a1day = moment().add(1, 'days').format();
          a2days = moment().add(2, 'days').format();
          a3days = moment().add(3, 'days').format();
          return init_esm(ESM, ns).then(function(esm) {
            return bb.all([
              esm.add_event(ns, 'p1', 'a', 't1', {
                expires_at: a3days
              }), esm.add_event(ns, 'p2', 'a', 't2', {
                expires_at: a1day
              })
            ]).then(function() {
              return esm.recent_recommendations_by_people(ns, ['a'], ['p1', 'p2'], {
                time_until_expiry: 48 * 60 * 60
              });
            }).then(function(people_recommendations) {
              return people_recommendations.length.should.equal(1);
            });
          });
        });
      });
    });
    return describe('#filter_things_by_previous_actions', function() {
      it('should remove things that a person has previously actioned', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1')]).then(function() {
            return esm.filter_things_by_previous_actions(ns, 'p1', ['t1', 't2'], ['view']);
          }).then(function(things) {
            things.length.should.equal(1);
            return things[0].should.equal('t2');
          });
        });
      });
      it('should filter things only for given actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'buy', 't2')]).then(function() {
            return esm.filter_things_by_previous_actions(ns, 'p1', ['t1', 't2'], ['view']);
          }).then(function(things) {
            things.length.should.equal(1);
            return things[0].should.equal('t2');
          });
        });
      });
      return it('should filter things for multiple actions', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'buy', 't2')]).then(function() {
            return esm.filter_things_by_previous_actions(ns, 'p1', ['t1', 't2'], ['view', 'buy']);
          }).then(function(things) {
            return things.length.should.equal(0);
          });
        });
      });
    });
  });
  return describe('inserting data', function() {
    describe('#add_events', function() {
      it('should add an events to the ESM', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_events([
            {
              namespace: ns,
              person: 'p',
              action: 'a',
              thing: 't'
            }
          ]).then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            count.should.equal(1);
            return esm.find_events(ns, {
              person: 'p',
              action: 'a',
              thing: 't'
            });
          }).then(function(events) {
            var event;
            event = events[0];
            return event.should.not.equal(null);
          });
        });
      });
      return it('should add multiple events to the ESM', function() {
        var exp_date, now;
        now = new Date();
        exp_date = now.toISOString();
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_events([
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
            return esm.count_events(ns);
          }).then(function(count) {
            count.should.equal(3);
            return esm.find_events(ns, {
              person: 'p1',
              action: 'a',
              thing: 't3'
            });
          }).then(function(events) {
            var event;
            event = events[0];
            event.should.not.equal(null);
            return moment(event.expires_at).unix().should.equal(moment(now).unix());
          });
        });
      });
    });
    describe('#add_event', function() {
      return it('should add an event to the ESM', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p', 'a', 't').then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            count.should.equal(1);
            return esm.find_events(ns, {
              person: 'p',
              action: 'a',
              thing: 't'
            });
          }).then(function(events) {
            var event;
            event = events[0];
            return event.should.not.equal(null);
          });
        });
      });
    });
    describe('#count_events', function() {
      return it('should return the number of events in the event store', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p', 'a', 't').then(function() {
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(1);
          });
        });
      });
    });
    describe('#estimate_event_count', function() {
      return it('should be a fast estimate of events', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'view', 't3')]).then(function() {
            return esm.pre_compact(ns);
          }).then(function() {
            return esm.estimate_event_count(ns);
          }).then(function(count) {
            return count.should.equal(3);
          });
        });
      });
    });
    describe('#delete_events', function() {
      it("should return 0 if no events are deleted", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.delete_events(ns, {
            person: 'p1',
            action: 'view',
            thing: 't1'
          }).then(function(ret) {
            return ret.deleted.should.equal(0);
          });
        });
      });
      it("should delete events from esm", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1')]).then(function() {
            return esm.delete_events(ns, {
              person: 'p1',
              action: 'view',
              thing: 't1'
            });
          }).then(function(ret) {
            ret.deleted.should.equal(1);
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(2);
          });
        });
      });
      it("should delete events from esm for person", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1')]).then(function() {
            return esm.delete_events(ns, {
              person: 'p1'
            });
          }).then(function(ret) {
            ret.deleted.should.equal(3);
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(0);
          });
        });
      });
      it("should delete events from esm for action", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1')]).then(function() {
            return esm.delete_events(ns, {
              action: 'view'
            });
          }).then(function(ret) {
            ret.deleted.should.equal(2);
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(1);
          });
        });
      });
      return it("should delete all events if no value is given", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1')]).then(function() {
            return esm.delete_events(ns);
          }).then(function(ret) {
            ret.deleted.should.equal(3);
            return esm.count_events(ns);
          }).then(function(count) {
            return count.should.equal(0);
          });
        });
      });
    });
    return describe('#find_events', function() {
      it('should return the event', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p', 'a', 't').then(function() {
            return esm.find_events(ns, {
              person: 'p',
              action: 'a',
              thing: 't'
            });
          }).then(function(events) {
            var event;
            event = events[0];
            event.person.should.equal('p');
            event.action.should.equal('a');
            return event.thing.should.equal('t');
          });
        });
      });
      it("should return null if no event matches", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.find_events(ns, {
            person: 'p',
            action: 'a',
            thing: 't'
          }).then(function(events) {
            return events.length.should.equal(0);
          });
        });
      });
      it("should find event with only one argument", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p', 'a', 't').then(function() {
            return bb.all([
              esm.find_events(ns, {
                person: 'p'
              }), esm.find_events(ns, {
                action: 'a'
              }), esm.find_events(ns, {
                thing: 't'
              })
            ]);
          }).spread(function(events1, events2, events3) {
            var e1, e2, e3, event, i, len, ref, results;
            e1 = events1[0];
            e2 = events2[0];
            e3 = events3[0];
            ref = [e1, e2, e3];
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              event = ref[i];
              event.person.should.equal('p');
              event.action.should.equal('a');
              results.push(event.thing.should.equal('t'));
            }
            return results;
          });
        });
      });
      it("should return multiple events", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1')]).then(function() {
            return bb.all([
              esm.find_events(ns, {
                person: 'p1'
              }), esm.find_events(ns, {
                person: 'p1',
                action: 'view'
              }), esm.find_events(ns, {
                person: 'p1',
                action: 'view',
                thing: 't1'
              }), esm.find_events(ns, {
                action: 'view'
              }), esm.find_events(ns, {
                person: 'p1',
                thing: 't1'
              })
            ]);
          }).spread(function(events1, events2, events3, events4, events5) {
            events1.length.should.equal(3);
            events2.length.should.equal(2);
            events3.length.should.equal(1);
            events4.length.should.equal(2);
            return events5.length.should.equal(2);
          });
        });
      });
      it("should return events in created_at descending order (most recent first)", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_events([
            {
              namespace: ns,
              person: 'bob',
              action: 'hates',
              thing: 'hobbit',
              created_at: yesterday
            }, {
              namespace: ns,
              person: 'bob',
              action: 'likes',
              thing: 'hobbit',
              created_at: today
            }
          ]).then(function() {
            return esm.find_events(ns, {
              person: 'bob',
              size: 1,
              current_datetime: void 0
            });
          }).then(function(events) {
            events.length.should.equal(1);
            return events[0].action.should.equal('likes');
          });
        });
      });
      it("should return only the most recent unique events", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return esm.add_event(ns, 'p1', 'a', 't1', {
            created_at: yesterday
          }).then(function() {
            return esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: today
            });
          }).then(function() {
            return esm.find_events(ns, {
              person: 'p1'
            });
          }).then(function(events) {
            events.length.should.equal(1);
            moment(events[0].created_at).format().should.equal(today.format());
            return events[0].thing.should.equal('t1');
          });
        });
      });
      it("should limit the returned events to size", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: new Date()
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              created_at: moment().subtract(2, 'days')
            }), esm.add_event(ns, 'p1', 'a', 't3', {
              created_at: moment().subtract(10, 'days')
            })
          ]).then(function() {
            return esm.find_events(ns, {
              person: 'p1',
              size: 2
            });
          }).then(function(events) {
            events.length.should.equal(2);
            events[0].thing.should.equal('t1');
            return events[1].thing.should.equal('t2');
          });
        });
      });
      it("should return pagable events", function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: new Date()
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              created_at: moment().subtract(2, 'days')
            }), esm.add_event(ns, 'p1', 'a', 't3', {
              created_at: moment().subtract(10, 'days')
            })
          ]).then(function() {
            return esm.find_events(ns, {
              person: 'p1',
              size: 2,
              page: 1
            });
          }).then(function(events) {
            events.length.should.equal(1);
            return events[0].thing.should.equal('t3');
          });
        });
      });
      it('should be able to take arrays', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([esm.add_event(ns, 'p1', 'view', 't1'), esm.add_event(ns, 'p1', 'view', 't2'), esm.add_event(ns, 'p1', 'like', 't1'), esm.add_event(ns, 'p2', 'view', 't1')]).then(function() {
            return bb.all([
              esm.find_events(ns, {
                people: ['p1', 'p2']
              }), esm.find_events(ns, {
                person: 'p1',
                actions: ['view', 'like']
              }), esm.find_events(ns, {
                person: 'p1',
                action: 'view',
                things: ['t1', 't2']
              })
            ]);
          }).spread(function(events1, events2, events3) {
            events1.length.should.equal(4);
            events2.length.should.equal(3);
            return events3.length.should.equal(2);
          });
        });
      });
      it('should be able to select current_datetime', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              created_at: new Date()
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              created_at: moment().subtract(2, 'days')
            }), esm.add_event(ns, 'p1', 'a', 't3', {
              created_at: moment().subtract(6, 'days')
            })
          ]).then(function() {
            return esm.find_events(ns, {
              person: 'p1'
            });
          }).then(function(events) {
            events.length.should.equal(3);
            return esm.find_events(ns, {
              person: 'p1',
              current_datetime: moment().subtract(1, 'days')
            });
          }).then(function(events) {
            events.length.should.equal(2);
            return esm.find_events(ns, {
              person: 'p1',
              current_datetime: moment().subtract(3, 'days')
            });
          }).then(function(events) {
            return events.length.should.equal(1);
          });
        });
      });
      return it('should be able to select time_until_expiry', function() {
        return init_esm(ESM, ns).then(function(esm) {
          return bb.all([
            esm.add_event(ns, 'p1', 'a', 't1', {
              expires_at: today
            }), esm.add_event(ns, 'p1', 'a', 't2', {
              expires_at: moment(today).add(10, 'minutes')
            }), esm.add_event(ns, 'p1', 'a', 't3', {
              expires_at: moment(today).add(100, 'minutes')
            })
          ]).then(function() {
            return esm.find_events(ns, {
              person: 'p1'
            });
          }).then(function(events) {
            events.length.should.equal(3);
            return esm.find_events(ns, {
              person: 'p1',
              time_until_expiry: 60
            });
          }).then(function(events) {
            events.length.should.equal(2);
            return esm.find_events(ns, {
              person: 'p1',
              time_until_expiry: 630
            });
          }).then(function(events) {
            return events.length.should.equal(1);
          });
        });
      });
    });
  });
};

module.exports = esm_tests;