var Errors, Q, RethinkDBEventStoreManager, _, drop_tables, fs, init_events_table, moment, r;

Q = require('q');

fs = require('fs');

_ = require('lodash');

Errors = require('./errors');

moment = require('moment');

r = require('rethinkdb');

init_events_table = function(conn, namespace) {
  var tableName;
  tableName = namespace + "_events";
  return r.tableCreate(tableName).run(conn).then((function(_this) {
    return function(res) {
      var personIndexName, promises, table, thingIndexName;
      table = r.table(tableName);
      personIndexName = "idx_person_created_at_" + namespace + "_events";
      thingIndexName = "idx_thing_created_at_" + namespace + "_events";
      promises = [table.indexCreate(personIndexName, [r.row("person"), r.row("action"), r.row("created_at")]).run(conn), table.indexCreate(thingIndexName, [r.row("thing"), r.row("action"), r.row("created_at")]).run(conn), table.indexWait().run(conn)];
      return Q.all(promises).then(function() {});
    };
  })(this));
};

drop_tables = function(conn, namespace) {
  var personIndexName, table, tableName, thingIndexName;
  tableName = namespace + "_events";
  table = r.table(tableName);
  personIndexName = "idx_person_created_at_" + namespace + "_events";
  thingIndexName = "idx_thing_created_at_" + namespace + "_events";
  return Q.all([table.indexDrop(personIndexName).run(conn), table.indexDrop(thingIndexName).run(conn)]).then((function(_this) {
    return function() {
      return r.tableDrop(tableName).run(conn);
    };
  })(this))["catch"]((function(_this) {
    return function(err) {};
  })(this));
};

RethinkDBEventStoreManager = (function() {
  function RethinkDBEventStoreManager(options) {
    if (options == null) {
      options = {};
    }
    this._conn = options.conn;
  }

  RethinkDBEventStoreManager.prototype.destroy = function(namespace) {
    return drop_tables(this._conn, namespace);
  };

  RethinkDBEventStoreManager.prototype.initialize = function(namespace) {
    return this.exists(namespace).then((function(_this) {
      return function(exists) {
        if (!exists) {
          return init_events_table(_this._conn, namespace);
        }
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.exists = function(namespace) {
    return this.list_namespaces().then((function(_this) {
      return function(namespaces) {
        return _.contains(namespaces, namespace);
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.list_namespaces = function() {
    return r.tableList().run(this._conn).then((function(_this) {
      return function(tables) {
        var namespaces;
        namespaces = tables.filter(function(table) {
          return table.length > 7 && table.substr(table.length - 7, 7) === '_events';
        }).map(function(table) {
          return table.substr(0, table.length - 7);
        });
        return namespaces;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.add_events = function(events) {
    var created_at, e, es, i, len, namespace, namespaces, now, promises;
    namespaces = {};
    now = r.now();
    for (i = 0, len = events.length; i < len; i++) {
      e = events[i];
      created_at = e.created_at ? moment(e.created_at).unix() : moment().unix();
      e.created_at = r.epochTime(created_at);
      e.expires_at = e.expires_at ? r.epochTime(moment(e.expires_at).unix()) : null;
      if (!namespaces[e.namespace]) {
        namespaces[e.namespace] = [];
      }
      namespaces[e.namespace].push(e);
      delete e.namespace;
    }
    promises = [];
    for (namespace in namespaces) {
      es = namespaces[namespace];
      promises.push(this.add_events_to_namespace(namespace, es));
    }
    return Q.all(promises);
  };

  RethinkDBEventStoreManager.prototype.add_event = function(namespace, person, action, thing, dates) {
    if (dates == null) {
      dates = {};
    }
    return this.add_events([
      {
        namespace: namespace,
        person: person,
        action: action,
        thing: thing,
        created_at: dates.created_at,
        expires_at: dates.expires_at
      }
    ]);
  };

  RethinkDBEventStoreManager.prototype.add_events_to_namespace = function(namespace, events) {
    return r.table(namespace + "_events").insert(events).run(this._conn)["catch"](function(error) {
      throw error;
    }).then(function(res) {});
  };

  RethinkDBEventStoreManager.prototype.find_events = function(namespace, options) {
    var actionFilters, filters, peopleFilters, thingFilters;
    if (options == null) {
      options = {};
    }
    options = _.defaults(options, {
      size: 50,
      page: 0,
      current_datetime: new Date()
    });
    if (options.time_until_expiry) {
      options.expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds').format();
    }
    filters = [];
    filters.push(r.row('created_at').toEpochTime().le(moment(options.current_datetime).unix()));
    if (options.expires_after) {
      filters.push(r.row('expires_at').toEpochTime().gt(moment(options.expires_after).unix()));
    }
    if (options.people) {
      peopleFilters = options.people.map((function(_this) {
        return function(person) {
          return r.row('person').eq(person);
        };
      })(this));
      if (options.person) {
        peopleFilters.push(r.row('person').eq(options.person));
      }
      filters.push(r.or.apply(r, peopleFilters));
    } else {
      if (options.person) {
        filters.push(r.row('person').eq(options.person));
      }
    }
    if (options.actions) {
      actionFilters = options.actions.map((function(_this) {
        return function(action) {
          return r.row('action').eq(action);
        };
      })(this));
      if (options.action) {
        actionFilters.push(r.row('action').eq(options.action));
      }
      filters.push(r.or.apply(r, actionFilters));
    } else {
      if (options.action) {
        filters.push(r.row('action').eq(options.action));
      }
    }
    if (options.things) {
      thingFilters = options.things.map((function(_this) {
        return function(thing) {
          return r.row('thing').eq(thing);
        };
      })(this));
      if (options.thing) {
        thingFilters.push(r.row('thing').eq(options.thing));
      }
      filters.push(r.or.apply(r, thingFilters));
    } else {
      if (options.thing) {
        filters.push(r.row('thing').eq(options.thing));
      }
    }
    return r.table(namespace + "_events").filter(r.and.apply(r, filters)).group("person", "action", "thing").max("created_at").ungroup().map((function(_this) {
      return function(groupResult) {
        return {
          id: groupResult('reduction')('id'),
          person: groupResult('reduction')('person'),
          action: groupResult('reduction')('action'),
          thing: groupResult('reduction')('thing'),
          created_at: groupResult('reduction')('created_at'),
          expires_at: groupResult('reduction')('expires_at')
        };
      };
    })(this)).orderBy(r.desc('created_at')).skip(options.size * options.page).limit(options.size).run(this._conn).then((function(_this) {
      return function(rows) {
        return rows;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.delete_events = function(namespace, options) {
    var actionFilters, filters, peopleFilters, thingFilters;
    if (options == null) {
      options = {};
    }
    filters = [];
    if (options.people) {
      peopleFilters = options.people.map((function(_this) {
        return function(person) {
          return r.row('person').eq(person);
        };
      })(this));
      if (options.person) {
        peopleFilters.push(r.row('person').eq(options.person));
      }
      filters.push(r.or.apply(r, peopleFilters));
    } else {
      if (options.person) {
        filters.push(r.row('person').eq(options.person));
      }
    }
    if (options.actions) {
      actionFilters = options.actions.map((function(_this) {
        return function(action) {
          return r.row('action').eq(action);
        };
      })(this));
      if (options.action) {
        actionFilters.push(r.row('action').eq(options.action));
      }
      filters.push(r.or.apply(r, actionFilters));
    } else {
      if (options.action) {
        filters.push(r.row('action').eq(options.action));
      }
    }
    if (options.things) {
      thingFilters = options.things.map((function(_this) {
        return function(thing) {
          return r.row('thing').eq(thing);
        };
      })(this));
      if (options.thing) {
        thingFilters.push(r.row('thing').eq(options.thing));
      }
      filters.push(r.or.apply(r, thingFilters));
    } else {
      if (options.thing) {
        filters.push(r.row('thing').eq(options.thing));
      }
    }
    return r.table(namespace + "_events").filter(r.and.apply(r, filters))["delete"]().run(this._conn).then((function(_this) {
      return function(res) {
        return {
          deleted: res.deleted
        };
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.thing_neighbourhood = function(namespace, thing, actions, options) {
    if (options == null) {
      options = {};
    }
    if (!actions || actions.length === 0) {
      return Q["try"](function() {
        return [];
      });
    }
    options = _.defaults(options, {
      neighbourhood_size: 100,
      neighbourhood_search_size: 500,
      time_until_expiry: 0,
      current_datetime: new Date()
    });
    options.expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds');
    return this._one_degree_away(namespace, 'thing', 'person', thing, actions, options).filter((function(_this) {
      return function(result) {
        return r.and(result('last_expires_at').ne(null), result('last_expires_at').toEpochTime().gt(options.expires_after.unix()));
      };
    })(this)).limit(options.neighbourhood_size).run(this._conn).then((function(_this) {
      return function(rows) {
        rows.map(function(row) {
          row.people = _.uniq(row.person);
          return delete row.person;
        });
        rows = _.sortBy(rows, function(row) {
          return -row.people.length;
        });
        return rows;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.person_neighbourhood = function(namespace, person, actions, options) {
    if (options == null) {
      options = {};
    }
    if (!actions || actions.length === 0) {
      return Q["try"](function() {
        return [];
      });
    }
    options = _.defaults(options, {
      neighbourhood_size: 100,
      neighbourhood_search_size: 500,
      time_until_expiry: 0,
      current_datetime: new Date()
    });
    options.expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds');
    return this._one_degree_away(namespace, 'person', 'thing', person, actions, options).limit(options.neighbourhood_size).run(this._conn).then((function(_this) {
      return function(rows) {
        var people, row;
        people = (function() {
          var i, len, results1;
          results1 = [];
          for (i = 0, len = rows.length; i < len; i++) {
            row = rows[i];
            results1.push(row.person);
          }
          return results1;
        })();
        return r.table(namespace + "_events").filter(function(event) {
          var peopleFilters;
          peopleFilters = people.map(function(person) {
            return event('person').eq(person);
          });
          return r.or.apply(r, peopleFilters);
        }).filter(function(event) {
          var actionFilters;
          actionFilters = actions.map(function(action) {
            return event('action').eq(action);
          });
          return r.or.apply(r, actionFilters);
        }).filter(function(event) {
          return r.and(event('expires_at').ne(null), event('expires_at').toEpochTime().gt(options.expires_after.unix()));
        }).group('person').max('created_at').run(_this._conn).then(function(rows) {
          people = (function() {
            var i, len, results1;
            results1 = [];
            for (i = 0, len = rows.length; i < len; i++) {
              row = rows[i];
              results1.push(row.group);
            }
            return results1;
          })();
          return people;
        });
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype._one_degree_away = function(namespace, column1, column2, value, actions, options) {
    var query_hash, tableName;
    query_hash = {};
    query_hash[column1] = value;
    tableName = namespace + "_events";
    return r.table(tableName).filter(r.row(column1).eq(value)).filter((function(_this) {
      return function(event) {
        var actionFilters;
        actionFilters = actions.map(function(action) {
          return event('action').eq(action);
        });
        return r.or.apply(r, actionFilters);
      };
    })(this)).orderBy(r.desc('created_at')).limit(options.neighbourhood_search_size).innerJoin(r.table(tableName), (function(_this) {
      return function(recent_event, event) {
        return r.and(event(column2).eq(recent_event(column2)), event(column1).ne(recent_event(column1)));
      };
    })(this)).filter((function(_this) {
      return function(joinResult) {
        var actionFilters;
        actionFilters = actions.map(function(action) {
          return joinResult('right')('action').eq(action);
        });
        return r.or.apply(r, actionFilters);
      };
    })(this)).filter((function(_this) {
      return function(joinResult) {
        return r.and(joinResult('left')('created_at').toEpochTime().le(moment(options.current_datetime).unix()), joinResult('right')('created_at').toEpochTime().le(moment(options.current_datetime).unix()));
      };
    })(this)).map((function(_this) {
      return function(joinResult) {
        var obj;
        return (
          obj = {},
            obj["" + column1] = joinResult('right')(column1),
            obj.created_at = joinResult('right')('created_at'),
            obj.expires_at = joinResult('right')('expires_at'),
            obj["" + column2] = joinResult('right')(column2),
            obj.created_at_day = joinResult('left')('created_at').date(),
            obj
        );
      };
    })(this)).group(column1).ungroup().map((function(_this) {
      return function(groupResult) {
        var obj;
        return (
          obj = {},
            obj["" + column1] = r.distinct(groupResult('reduction')(column1)).nth(0),
            obj["" + column2] = r.distinct(groupResult('reduction')(column2)),
            obj.action_count = groupResult('reduction')(column1).count(),
            obj.last_actioned_at = groupResult('reduction')('created_at').max(),
            obj.last_expires_at = groupResult('reduction')('expires_at').max(),
            obj.created_at_day = groupResult('reduction')('created_at_day').max(),
            obj
        );
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.filter_things_by_previous_actions = function(namespace, person, things, actions) {
    if (!actions || actions.length === 0 || things.length === 0) {
      return Q["try"](function() {
        return things;
      });
    }
    return r.table(namespace + "_events").filter(r.row('person').eq(person)).filter((function(_this) {
      return function(event) {
        var filters;
        filters = actions.map(function(action) {
          return event('action').eq(action);
        });
        return r.or.apply(r, filters);
      };
    })(this)).getField('thing').distinct().run(this._conn).then((function(_this) {
      return function(rows) {
        return things.filter(function(t) {
          return !_.contains(rows, t);
        });
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype._recent_events = function(namespace, column1, actions, values, options) {
    var expires_after, promises;
    if (options == null) {
      options = {};
    }
    if (values.length === 0 || actions.length === 0) {
      return Q["try"](function() {
        return [];
      });
    }
    options = _.defaults(options, {
      recommendations_per_neighbour: 10,
      time_until_expiry: 0,
      current_datetime: new Date()
    });
    expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds');
    promises = values.map((function(_this) {
      return function(v) {
        return r.table(namespace + "_events").filter(function(event) {
          var filters;
          filters = actions.map(function(action) {
            return event('action').eq(action);
          });
          return r.or.apply(r, filters);
        }).filter(r.row(column1).eq(v)).filter(r.row('created_at').toEpochTime().le(moment(options.current_datetime).unix())).filter(r.and(r.row('expires_at').ne(null), r.row('expires_at').toEpochTime().gt(expires_after.unix()))).group("person", "thing").ungroup().map(function(groupResult) {
          var reduction;
          reduction = groupResult('reduction');
          return {
            person: reduction('person').nth(0),
            thing: reduction('thing').nth(0),
            last_actioned_at: reduction('created_at').max(),
            last_expires_at: reduction('expires_at').max()
          };
        }).orderBy(r.desc('last_actioned_at')).limit(options.recommendations_per_neighbour);
      };
    })(this));
    return r.union.apply(r, promises).orderBy(r.desc('last_actioned_at')).run(this._conn).then((function(_this) {
      return function(recent_event) {
        return recent_event;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.recent_recommendations_by_people = function(namespace, actions, people, options) {
    return this._recent_events(namespace, 'person', actions, people, options);
  };

  RethinkDBEventStoreManager.prototype._cosine_distance = function(namespace, column1, column2, v1, v2, actions, now, limit, event_decay_rate) {
    var p1_values, p2_values, promises, search1, search2;
    search1 = {
      current_datetime: now
    };
    search2 = {
      current_datetime: now
    };
    search1[column1] = v1;
    search2[column1] = v2;
    search1.actions = Object.keys(actions);
    search2.actions = Object.keys(actions);
    p1_values = {};
    p2_values = {};
    promises = [
      this.find_events(namespace, search1).then((function(_this) {
        return function(events) {
          var days, e, i, len, n_weight, ref, weight;
          ref = events.slice(0, limit);
          for (i = 0, len = ref.length; i < len; i++) {
            e = ref[i];
            weight = actions[e.action];
            days = Math.round(moment.duration(moment(now).diff(e.created_at)).asDays());
            n_weight = weight * Math.pow(event_decay_rate, -days);
            p1_values[e[column2]] = n_weight;
          }
          return p1_values;
        };
      })(this)), this.find_events(namespace, search2).then((function(_this) {
        return function(events) {
          var days, e, i, len, n_weight, ref, weight;
          ref = events.slice(0, limit);
          for (i = 0, len = ref.length; i < len; i++) {
            e = ref[i];
            weight = actions[e.action];
            days = Math.round(moment.duration(moment(now).diff(e.created_at)).asDays());
            n_weight = weight * Math.pow(event_decay_rate, -days);
            p2_values[e[column2]] = n_weight;
          }
          return p2_values;
        };
      })(this))
    ];
    return Q.all(promises).then((function(_this) {
      return function(results) {
        var cosinse_similarity, denominator_1, denominator_2, numerator, value, weight;
        numerator = 0;
        for (value in p1_values) {
          weight = p1_values[value];
          if (p2_values[value]) {
            numerator += weight * p2_values[value];
          }
        }
        denominator_1 = 0;
        for (value in p1_values) {
          weight = p1_values[value];
          denominator_1 += Math.pow(weight, 2);
        }
        denominator_2 = 0;
        for (value in p2_values) {
          weight = p2_values[value];
          denominator_2 += Math.pow(weight, 2);
        }
        cosinse_similarity = numerator / (Math.sqrt(denominator_1) * Math.sqrt(denominator_2));
        return cosinse_similarity;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype._similarities = function(namespace, column1, column2, value, values, actions, options) {
    var promises, similarities;
    if (options == null) {
      options = {};
    }
    if (!actions || actions.length === 0 || values.length === 0) {
      return Q["try"](function() {
        return {};
      });
    }
    options = _.defaults(options, {
      similarity_search_size: 500,
      event_decay_rate: 1,
      current_datetime: new Date()
    });
    similarities = {};
    promises = values.map((function(_this) {
      return function(v) {
        return _this._cosine_distance(namespace, column1, column2, value, v, actions, options.current_datetime, options.similarity_search_size, options.event_decay_rate).then(function(similarity) {
          return similarities[v] = similarity || 0;
        });
      };
    })(this));
    return Q.all(promises).then((function(_this) {
      return function() {
        return similarities;
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.calculate_similarities_from_thing = function(namespace, thing, things, actions, options) {
    if (options == null) {
      options = {};
    }
    return this._similarities(namespace, 'thing', 'person', thing, things, actions, options);
  };

  RethinkDBEventStoreManager.prototype.calculate_similarities_from_person = function(namespace, person, people, actions, options) {
    if (options == null) {
      options = {};
    }
    return this._similarities(namespace, 'person', 'thing', person, people, actions, options);
  };

  RethinkDBEventStoreManager.prototype.count_events = function(namespace) {
    return r.table(namespace + "_events").count().run(this._conn).then(function(count) {
      return count;
    });
  };

  RethinkDBEventStoreManager.prototype.estimate_event_count = function(namespace) {
    return r.table(namespace + "_events").count().run(this._conn).then(function(count) {
      return count;
    });
  };

  RethinkDBEventStoreManager.prototype.pre_compact = function(namespace) {
    return this.analyze(namespace);
  };

  RethinkDBEventStoreManager.prototype.post_compact = function(namespace) {
    return this.analyze(namespace);
  };

  RethinkDBEventStoreManager.prototype.vacuum_analyze = function(namespace) {};

  RethinkDBEventStoreManager.prototype.analyze = function(namespace) {
    return Q["try"](function() {
      return true;
    });
  };

  RethinkDBEventStoreManager.prototype.get_active_things = function(namespace) {
    return r.table(namespace + "_events").group("thing").max("created_at").ungroup().map((function(_this) {
      return function(groupResult) {
        return {
          thing: groupResult("reduction")("thing"),
          created_at: groupResult("reduction")("created_at")
        };
      };
    })(this)).orderBy("created_at").run(this._conn).then((function(_this) {
      return function(rows) {
        return _.pluck(rows, 'thing');
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.get_active_people = function(namespace) {
    return r.table(namespace + "_events").group("person").max("created_at").ungroup().map((function(_this) {
      return function(groupResult) {
        return {
          person: groupResult("reduction")("person"),
          created_at: groupResult("reduction")("created_at")
        };
      };
    })(this)).orderBy("created_at").run(this._conn).then((function(_this) {
      return function(rows) {
        return _.pluck(rows, 'person');
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.compact_people = function(namespace, compact_database_person_action_limit, actions) {
    return this.get_active_people(namespace).then((function(_this) {
      return function(people) {
        return _this.truncate_people_per_action(namespace, people, compact_database_person_action_limit, actions);
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.compact_things = function(namespace, compact_database_thing_action_limit, actions) {
    return this.get_active_things(namespace).then((function(_this) {
      return function(things) {
        return _this.truncate_things_per_action(namespace, things, compact_database_thing_action_limit, actions);
      };
    })(this));
  };

  RethinkDBEventStoreManager.prototype.truncate_things_per_action = function(namespace, things, trunc_size, actions) {
    var action, fn, i, j, len, len1, promise, thing;
    if (things.length === 0) {
      return Q["try"](function() {
        return [];
      });
    }
    promise = Q["try"](function() {});
    for (i = 0, len = things.length; i < len; i++) {
      thing = things[i];
      fn = (function(_this) {
        return function(thing, action) {
          return promise = promise.then(function() {
            return _this.truncate_thing_actions(namespace, thing, trunc_size, action);
          });
        };
      })(this);
      for (j = 0, len1 = actions.length; j < len1; j++) {
        action = actions[j];
        fn(thing, action);
      }
    }
    return promise;
  };

  RethinkDBEventStoreManager.prototype.truncate_thing_actions = function(namespace, thing, trunc_size, action) {
    return r.table(namespace + "_events").filter(r.and(r.row('action').eq(action), r.row('thing').eq(thing))).orderBy(r.desc('created_at')).skip(trunc_size)["delete"]().run(this._conn).then((function(_this) {
      return function(res) {};
    })(this));
  };

  RethinkDBEventStoreManager.prototype.truncate_people_per_action = function(namespace, people, trunc_size, actions) {
    var action, fn, i, j, len, len1, person, promise;
    if (people.length === 0) {
      return Q["try"](function() {
        return [];
      });
    }
    promise = Q["try"](function() {});
    for (i = 0, len = people.length; i < len; i++) {
      person = people[i];
      fn = (function(_this) {
        return function(person, action) {
          return promise = promise.then(function() {
            return _this.truncate_person_actions(namespace, person, trunc_size, action);
          });
        };
      })(this);
      for (j = 0, len1 = actions.length; j < len1; j++) {
        action = actions[j];
        fn(person, action);
      }
    }
    return promise;
  };

  RethinkDBEventStoreManager.prototype.truncate_person_actions = function(namespace, person, trunc_size, action) {
    return r.table(namespace + "_events").filter(r.and(r.row('action').eq(action), r.row('person').eq(person))).orderBy(r.desc('created_at')).skip(trunc_size)["delete"]().run(this._conn).then((function(_this) {
      return function(res) {};
    })(this));
  };

  RethinkDBEventStoreManager.prototype.remove_events_till_size = function(namespace, number_of_events) {
    return r.table(namespace + "_events").orderBy(r.desc('created_at')).skip(number_of_events)["delete"]().run(this._conn).then((function(_this) {
      return function(res) {};
    })(this));
  };

  return RethinkDBEventStoreManager;

})();

module.exports = RethinkDBEventStoreManager;