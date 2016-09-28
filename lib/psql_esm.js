var Errors, PSQLEventStoreManager, _, bb, drop_tables, fs, init_events_table, init_tables, moment;

bb = require('bluebird');

fs = require('fs');

_ = require('lodash');

Errors = require('./errors');

moment = require('moment');

init_events_table = function (knex, schema) {
    return knex.schema.createTable(schema + ".events", function (table) {
        table.increments();
        table.string('person').notNullable();
        table.string('action').notNullable();
        table.string('thing').notNullable();
        table.timestamp('created_at').notNullable();
        return table.timestamp('expires_at');
    }).then(function () {
        var i1, i2;
        i1 = knex.raw("create index idx_person_created_at_" + schema + "_events on \"" + schema + "\".events (person, action, created_at DESC)");
        i2 = knex.raw("create index idx_thing_created_at_" + schema + "_events on \"" + schema + "\".events (thing, action, created_at DESC)");
        return bb.all([i1, i2]);
    });
};

drop_tables = function (knex, schema) {
    if (schema == null) {
        schema = 'public';
    }
    return knex.schema.dropTableIfExists(schema + ".events").then(function () {
        return knex.schema.raw("DROP SCHEMA IF EXISTS \"" + schema + "\"");
    });
};

init_tables = function (knex, schema) {
    if (schema == null) {
        schema = 'public';
    }
    return knex.schema.raw("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"").then((function (_this) {
        return function () {
            return init_events_table(knex, schema);
        };
    })(this));
};

PSQLEventStoreManager = (function () {
    function PSQLEventStoreManager(options) {
        if (options == null) {
            options = {};
        }
        this._knex = options.knex;
    }

    PSQLEventStoreManager.prototype.destroy = function (namespace) {
        return drop_tables(this._knex, namespace);
    };

    PSQLEventStoreManager.prototype.initialize = function (namespace) {
        return this.exists(namespace).then((function (_this) {
            return function (exists) {
                if (!exists) {
                    return init_tables(_this._knex, namespace);
                }
            };
        })(this));
    };

    PSQLEventStoreManager.prototype.exists = function (namespace) {
        return this.list_namespaces().then((function (_this) {
            return function (namespaces) {
                return _.contains(namespaces, namespace);
            };
        })(this));
    };

    PSQLEventStoreManager.prototype.list_namespaces = function () {
        return this._knex.raw("SELECT table_schema FROM information_schema.tables WHERE table_name = 'events'").then(function (res) {
            var ret;
            ret = _.uniq(res.rows.map(function (row) {
                return row.table_schema;
            }));
            ret = ret.filter(function (x) {
                return x !== 'default';
            });
            return ret;
        });
    };

    PSQLEventStoreManager.prototype.add_events = function (events) {
        var e, es, j, len, namespace, namespaces, now, promises;
        namespaces = {};
        now = new Date().toISOString();
        for (j = 0, len = events.length; j < len; j++) {
            e = events[j];
            e.created_at = e.created_at || now;
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
        return bb.all(promises);
    };

    PSQLEventStoreManager.prototype.add_event = function (namespace, person, action, thing, dates) {
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

    PSQLEventStoreManager.prototype.add_events_to_namespace = function (namespace, events) {
        return this._knex(namespace + ".events").insert(events)["catch"](function (error) {
            if (error.message.indexOf("relation") > -1 && error.message.indexOf(namespace) > -1 && error.message.indexOf("does not exist") > -1) {
                throw new Errors.NamespaceDoestNotExist();
            }
        });
    };

    PSQLEventStoreManager.prototype.find_events = function (namespace, options) {
        var q;
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
        q = this._knex(namespace + ".events").select("person", "action", "thing").max('created_at as created_at').max('expires_at as expires_at').where('created_at', '<=', options.current_datetime).orderBy('created_at', 'desc').groupBy(['person', "action", "thing"]).limit(options.size).offset(options.size * options.page);
        if (options.expires_after) {
            q.where('expires_at', '>', options.expires_after);
        }
        if (options.person) {
            q = q.where({
                person: options.person
            });
        }
        if (options.people) {
            q = q.whereIn('person', options.people);
        }
        if (options.action) {
            q = q.where({
                action: options.action
            });
        }
        if (options.actions) {
            q = q.whereIn('action', options.actions);
        }
        if (options.thing) {
            q = q.where({
                thing: options.thing
            });
        }
        if (options.things) {
            q = q.whereIn('thing', options.things);
        }
        return q.then(function (rows) {
            return rows;
        });
    };

    PSQLEventStoreManager.prototype.delete_events = function (namespace, options) {
        var q;
        if (options == null) {
            options = {};
        }
        q = this._knex(namespace + ".events");
        if (options.person) {
            q = q.where({
                person: options.person
            });
        }
        if (options.people) {
            q = q.whereIn('person', options.people);
        }
        if (options.action) {
            q = q.where({
                action: options.action
            });
        }
        if (options.actions) {
            q = q.whereIn('action', options.actions);
        }
        if (options.thing) {
            q = q.where({
                thing: options.thing
            });
        }
        if (options.things) {
            q = q.whereIn('thing', options.things);
        }
        return q.del().then(function (delete_count) {
            return {
                deleted: delete_count
            };
        });
    };

    PSQLEventStoreManager.prototype.thing_neighbourhood = function (namespace, thing, actions, options) {
        var one_degree_away;
        if (options == null) {
            options = {};
        }
        if (!actions || actions.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        options = _.defaults(options, {
            neighbourhood_size: 100,
            neighbourhood_search_size: 500,
            time_until_expiry: 0,
            current_datetime: new Date()
        });
        options.expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds').format();
        one_degree_away = this._one_degree_away(namespace, 'thing', 'person', thing, actions, options).orderByRaw("action_count DESC");
        return this._knex(one_degree_away.as('x')).where('x.last_expires_at', '>', options.expires_after).where('x.last_actioned_at', '<=', options.current_datetime).orderByRaw("x.action_count DESC").limit(options.neighbourhood_size).then(function (rows) {
            var j, len, row;
            for (j = 0, len = rows.length; j < len; j++) {
                row = rows[j];
                row.people = _.uniq(row.person);
            }
            return rows;
        });
    };

    PSQLEventStoreManager.prototype.person_neighbourhood = function (namespace, person, actions, options) {
        var one_degree_away, unexpired_events;
        if (options == null) {
            options = {};
        }
        if (!actions || actions.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        options = _.defaults(options, {
            neighbourhood_size: 100,
            neighbourhood_search_size: 500,
            time_until_expiry: 0,
            current_datetime: new Date()
        });
        options.expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds').format();
        one_degree_away = this._one_degree_away(namespace, 'person', 'thing', person, actions, options).orderByRaw("created_at_day DESC, action_count DESC");
        unexpired_events = this._unexpired_events(namespace, actions, options);
        return this._knex(one_degree_away.as('x')).whereExists(unexpired_events).orderByRaw("x.created_at_day DESC, x.action_count DESC").limit(options.neighbourhood_size).then(function (rows) {
            var j, len, results, row;
            results = [];
            for (j = 0, len = rows.length; j < len; j++) {
                row = rows[j];
                results.push(row.person);
            }
            return results;
        });
    };

    PSQLEventStoreManager.prototype._unexpired_events = function (namespace, actions, options) {
        return this._knex(namespace + ".events").select('person').whereRaw('expires_at IS NOT NULL').where('expires_at', '>', options.expires_after).where('created_at', '<=', options.current_datetime).whereIn('action', actions).whereRaw("person = x.person");
    };

    PSQLEventStoreManager.prototype._one_degree_away = function (namespace, column1, column2, value, actions, options) {
        var query_hash, recent_events;
        query_hash = {};
        query_hash[column1] = value;
        recent_events = this._knex(namespace + ".events").where(query_hash).whereIn('action', actions).orderByRaw('created_at DESC').limit(options.neighbourhood_search_size);
        return this._knex(recent_events.as('e')).innerJoin(namespace + ".events as f", function () {
            return this.on("e." + column2, "f." + column2).on("f." + column1, '!=', "e." + column1);
        }).where("e." + column1, value).whereIn('f.action', actions).where('f.created_at', '<=', options.current_datetime).where('e.created_at', '<=', options.current_datetime).select(this._knex.raw("f." + column1 + ", MAX(f.created_at) as last_actioned_at, MAX(f.expires_at) as last_expires_at, array_agg(f." + column2 + ") as " + column2 + ", date_trunc('day', max(e.created_at)) as created_at_day, count(f." + column1 + ") as action_count")).groupBy("f." + column1);
    };

    PSQLEventStoreManager.prototype.filter_things_by_previous_actions = function (namespace, person, things, actions) {
        var a, action_values, ai, akey, bindings, filter_things_sql, j, k, len, len1, query, t, thing_values, things_rows, ti, tkey;
        if (!actions || actions.length === 0 || things.length === 0) {
            return bb["try"](function () {
                return things;
            });
        }
        bindings = {
            person: person
        };
        action_values = [];
        for (ai = j = 0, len = actions.length; j < len; ai = ++j) {
            a = actions[ai];
            akey = "action_" + ai;
            bindings[akey] = a;
            action_values.push(" :" + akey + " ");
        }
        action_values = action_values.join(',');
        thing_values = [];
        for (ti = k = 0, len1 = things.length; k < len1; ti = ++k) {
            t = things[ti];
            tkey = "thing_" + ti;
            bindings[tkey] = t;
            thing_values.push("( :" + tkey + " )");
        }
        thing_values = thing_values.join(", ");
        things_rows = "(VALUES " + thing_values + " ) AS t (tthing)";
        filter_things_sql = this._knex(namespace + ".events").select("thing").whereRaw("person = :person").whereRaw("action in (" + action_values + ")").whereRaw("thing = t.tthing").toSQL();
        query = "select tthing from " + things_rows + " where not exists (" + filter_things_sql.sql + ")";
        return this._knex.raw(query, bindings).then(function (rows) {
            var l, len2, r, ref, results;
            ref = rows.rows;
            results = [];
            for (l = 0, len2 = ref.length; l < len2; l++) {
                r = ref[l];
                results.push(r.tthing);
            }
            return results;
        });
    };

    PSQLEventStoreManager.prototype._recent_events = function (namespace, column1, actions, values, options) {
        var a, action_values, ai, akey, bindings, expires_after, i, j, k, key, len, len1, ql, query, v;
        if (options == null) {
            options = {};
        }
        if (values.length === 0 || actions.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        options = _.defaults(options, {
            recommendations_per_neighbour: 10,
            time_until_expiry: 0,
            current_datetime: new Date()
        });
        expires_after = moment(options.current_datetime).add(options.time_until_expiry, 'seconds').format();
        bindings = {
            expires_after: expires_after,
            now: options.current_datetime
        };
        action_values = [];
        for (ai = j = 0, len = actions.length; j < len; ai = ++j) {
            a = actions[ai];
            akey = "action_" + ai;
            bindings[akey] = a;
            action_values.push(" :" + akey + " ");
        }
        action_values = action_values.join(',');
        ql = [];
        for (i = k = 0, len1 = values.length; k < len1; i = ++k) {
            v = values[i];
            key = "value_" + i;
            bindings[key] = v;
            ql.push("(select person, thing, MAX(created_at) as last_actioned_at, MAX(expires_at) as last_expires_at from \"" + namespace + "\".events where created_at <= :now and action in (" + action_values + ") and " + column1 + " = :" + key + " and (expires_at > :expires_after ) group by person, thing order by last_actioned_at DESC limit " + options.recommendations_per_neighbour + ")");
        }
        query = ql.join(" UNION ");
        if (ql.length > 1) {
            query += " order by last_actioned_at DESC";
        }
        return this._knex.raw(query, bindings).then(function (ret) {
            return ret.rows;
        });
    };

    PSQLEventStoreManager.prototype.recent_recommendations_by_people = function (namespace, actions, people, options) {
        return this._recent_events(namespace, 'person', actions, people, options);
    };

    PSQLEventStoreManager.prototype._history = function (namespace, column1, column2, value, al_values, limit) {
        return this._knex(namespace + ".events").select(column2, "action").max('created_at as created_at').groupBy(column2, "action").whereRaw("action in ( " + al_values + " )").orderByRaw("max(created_at) DESC").whereRaw('created_at <= :now').whereRaw(column1 + " = " + value).limit(limit);
    };

    PSQLEventStoreManager.prototype.cosine_query = function (namespace, s1, s2) {
        var denominator_1, denominator_2, numerator_1, numerator_2;
        numerator_1 = "(select (tbl1.weight * tbl2.weight) as weight from (" + s1 + ") tbl1 join (" + s2 + ") tbl2 on tbl1.value = tbl2.value)";
        numerator_2 = "(select SUM(n1.weight) from (" + numerator_1 + ") as n1)";
        denominator_1 = "(select SUM(power(s1.weight, 2.0)) from (" + s1 + ") as s1)";
        denominator_2 = "(select SUM(power(s2.weight, 2.0)) from (" + s2 + ") as s2)";
        return "COALESCE( (" + numerator_2 + " / ((|/ " + denominator_1 + ") * (|/ " + denominator_2 + ")) ), 0)";
    };

    PSQLEventStoreManager.prototype.cosine_distance = function (namespace, column1, column2, limit, a_values, al_values) {
        var s1, s1_weighted, s1q, s2, s2_weighted, s2q, weighted_actions;
        s1q = this._history(namespace, column1, column2, ':value', al_values, limit).toString();
        s2q = this._history(namespace, column1, column2, 't.cvalue', al_values, limit).toString();
        weighted_actions = "select a.weight::float * power( :event_decay_rate, - date_part('day', age( :now , x.created_at ))) from (VALUES " + a_values + ") AS a (action,weight) where x.action = a.action";
        s1_weighted = "select x." + column2 + ", (" + weighted_actions + ") as weight from (" + s1q + ") as x";
        s2_weighted = "select x." + column2 + ", (" + weighted_actions + ") as weight from (" + s2q + ") as x";
        s1 = "select ws." + column2 + " as value, max(ws.weight) as weight from (" + s1_weighted + ") as ws where ws.weight != 0 group by ws." + column2;
        s2 = "select ws." + column2 + " as value, max(ws.weight) as weight from (" + s2_weighted + ") as ws where ws.weight != 0 group by ws." + column2;
        return (this.cosine_query(namespace, s1, s2)) + " as cosine_distance";
    };

    PSQLEventStoreManager.prototype.get_cosine_distances = function (namespace, column1, column2, value, values, actions, limit, event_decay_rate, now) {
        var a, a_values, action, action_list, ai, akey, al_values, bindings, cosine_distance, j, k, len, len1, query, v, v_values, vi, vkey, weight, wkey;
        if (values.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        bindings = {
            value: value,
            now: now,
            event_decay_rate: event_decay_rate
        };
        action_list = [];
        for (action in actions) {
            weight = actions[action];
            action_list.push({
                action: action,
                weight: weight,
                weight: weight
            });
        }
        a_values = [];
        al_values = [];
        for (ai = j = 0, len = action_list.length; j < len; ai = ++j) {
            a = action_list[ai];
            akey = "action_" + ai;
            wkey = "weight_" + ai;
            bindings[akey] = a.action;
            bindings[wkey] = a.weight;
            a_values.push("( :" + akey + ", :" + wkey + " )");
            al_values.push(":" + akey);
        }
        a_values = a_values.join(', ');
        al_values = al_values.join(' , ');
        v_values = [];
        for (vi = k = 0, len1 = values.length; k < len1; vi = ++k) {
            v = values[vi];
            vkey = "value_" + vi;
            bindings[vkey] = v;
            v_values.push("( :" + vkey + " )");
        }
        v_values = v_values.join(', ');
        cosine_distance = this.cosine_distance(namespace, column1, column2, limit, a_values, al_values, event_decay_rate);
        query = "select cvalue, " + cosine_distance + " from (VALUES " + v_values + " ) AS t (cvalue)";
        return this._knex.raw(query, bindings).then(function (rows) {
            var l, len2, ref, row, similarities;
            similarities = {};
            ref = rows.rows;
            for (l = 0, len2 = ref.length; l < len2; l++) {
                row = ref[l];
                similarities[row.cvalue] = row.cosine_distance;
            }
            return similarities;
        });
    };

    PSQLEventStoreManager.prototype._similarities = function (namespace, column1, column2, value, values, actions, options) {
        if (options == null) {
            options = {};
        }
        if (!actions || actions.length === 0 || values.length === 0) {
            return bb["try"](function () {
                return {};
            });
        }
        options = _.defaults(options, {
            similarity_search_size: 500,
            event_decay_rate: 1,
            current_datetime: new Date()
        });
        return this.get_cosine_distances(namespace, column1, column2, value, values, actions, options.similarity_search_size, options.event_decay_rate, options.current_datetime);
    };

    PSQLEventStoreManager.prototype.calculate_similarities_from_thing = function (namespace, thing, things, actions, options) {
        if (options == null) {
            options = {};
        }
        return this._similarities(namespace, 'thing', 'person', thing, things, actions, options);
    };

    PSQLEventStoreManager.prototype.calculate_similarities_from_person = function (namespace, person, people, actions, options) {
        if (options == null) {
            options = {};
        }
        return this._similarities(namespace, 'person', 'thing', person, people, actions, options);
    };

    PSQLEventStoreManager.prototype.count_events = function (namespace) {
        return this._knex(namespace + ".events").count().then(function (count) {
            return parseInt(count[0].count);
        });
    };

    PSQLEventStoreManager.prototype.estimate_event_count = function (namespace) {
        return this._knex.raw("SELECT reltuples::bigint AS estimate FROM pg_class WHERE  oid = :ns ::regclass;", {
            ns: namespace + ".events"
        }).then(function (rows) {
            if (rows.rows.length === 0) {
                return 0;
            }
            return parseInt(rows.rows[0].estimate);
        });
    };

    PSQLEventStoreManager.prototype.pre_compact = function (namespace) {
        return this.analyze(namespace);
    };

    PSQLEventStoreManager.prototype.post_compact = function (namespace) {
        return this.analyze(namespace);
    };

    PSQLEventStoreManager.prototype.vacuum_analyze = function (namespace) {
        return this._knex.raw("VACUUM ANALYZE \"" + namespace + "\".events");
    };

    PSQLEventStoreManager.prototype.analyze = function (namespace) {
        return this._knex.raw("ANALYZE \"" + namespace + "\".events");
    };

    PSQLEventStoreManager.prototype.get_active_things = function (namespace) {
        return this._knex('pg_stats').select('most_common_vals').where({
            attname: 'thing',
            tablename: 'events',
            schemaname: namespace
        }).then(function (rows) {
            var common_str, things;
            if (!rows[0]) {
                return [];
            }
            common_str = rows[0].most_common_vals;
            if (!common_str) {
                return [];
            }
            common_str = common_str.slice(1, +(common_str.length - 2) + 1 || 9e9);
            things = common_str.split(',');
            return things;
        });
    };

    PSQLEventStoreManager.prototype.get_active_people = function (namespace) {
        return this._knex('pg_stats').select('most_common_vals').where({
            attname: 'person',
            tablename: 'events',
            schemaname: namespace
        }).then(function (rows) {
            var common_str, people;
            if (!rows[0]) {
                return [];
            }
            common_str = rows[0].most_common_vals;
            if (!common_str) {
                return [];
            }
            common_str = common_str.slice(1, +(common_str.length - 2) + 1 || 9e9);
            people = common_str.split(',');
            return people;
        });
    };

    PSQLEventStoreManager.prototype.compact_people = function (namespace, compact_database_person_action_limit, actions) {
        return this.get_active_people(namespace).then((function (_this) {
            return function (people) {
                return _this.truncate_people_per_action(namespace, people, compact_database_person_action_limit, actions);
            };
        })(this));
    };

    PSQLEventStoreManager.prototype.compact_things = function (namespace, compact_database_thing_action_limit, actions) {
        return this.get_active_things(namespace).then((function (_this) {
            return function (things) {
                return _this.truncate_things_per_action(namespace, things, compact_database_thing_action_limit, actions);
            };
        })(this));
    };

    PSQLEventStoreManager.prototype.truncate_things_per_action = function (namespace, things, trunc_size, actions) {
        var action, fn, j, k, len, len1, promise, thing;
        if (things.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        promise = bb["try"](function () {
        });
        for (j = 0, len = things.length; j < len; j++) {
            thing = things[j];
            fn = (function (_this) {
                return function (thing, action) {
                    return promise = promise.then(function () {
                        return _this.truncate_thing_actions(namespace, thing, trunc_size, action);
                    });
                };
            })(this);
            for (k = 0, len1 = actions.length; k < len1; k++) {
                action = actions[k];
                fn(thing, action);
            }
        }
        return promise;
    };

    PSQLEventStoreManager.prototype.truncate_thing_actions = function (namespace, thing, trunc_size, action) {
        var bindings, q;
        bindings = {
            thing: thing,
            action: action
        };
        q = "delete from \"" + namespace + "\".events as e where e.id in (select id from \"" + namespace + "\".events where action = :action and thing = :thing order by created_at DESC offset " + trunc_size + ");";
        return this._knex.raw(q, bindings);
    };

    PSQLEventStoreManager.prototype.truncate_people_per_action = function (namespace, people, trunc_size, actions) {
        var action, fn, j, k, len, len1, person, promise;
        if (people.length === 0) {
            return bb["try"](function () {
                return [];
            });
        }
        promise = bb["try"](function () {
        });
        for (j = 0, len = people.length; j < len; j++) {
            person = people[j];
            fn = (function (_this) {
                return function (person, action) {
                    return promise = promise.then(function () {
                        return _this.truncate_person_actions(namespace, person, trunc_size, action);
                    });
                };
            })(this);
            for (k = 0, len1 = actions.length; k < len1; k++) {
                action = actions[k];
                fn(person, action);
            }
        }
        return promise;
    };

    PSQLEventStoreManager.prototype.truncate_person_actions = function (namespace, person, trunc_size, action) {
        var bindings, q;
        bindings = {
            person: person,
            action: action
        };
        q = "delete from \"" + namespace + "\".events as e where e.id in (select id from \"" + namespace + "\".events where action = :action and person = :person order by created_at DESC offset " + trunc_size + ");";
        return this._knex.raw(q, bindings);
    };

    PSQLEventStoreManager.prototype.remove_events_till_size = function (namespace, number_of_events) {
        var query;
        query = "delete from " + namespace + ".events where id not in (select id from " + namespace + ".events order by created_at desc limit " + number_of_events + ")";
        return this._knex.raw(query);
    };

    return PSQLEventStoreManager;

})();

module.exports = PSQLEventStoreManager;