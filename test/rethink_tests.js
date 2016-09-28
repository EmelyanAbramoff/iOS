require('rethinkdb').connect({
  host: 'localhost',
  post: 28015,
  db: 'ger_test_db'
}).then((function(_this) {
  return function(conn) {
    global._conn = conn;
    return all_tests(RethinkDBESM);
  };
})(this))["catch"]((function(_this) {
  return function(err) {
    return console.log("Connection error", err);
  };
})(this));