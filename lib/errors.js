var Errors, NamespaceDoestNotExist,
    extend = function (child, parent) {
        for (var key in parent) {
            if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }

        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    },
    hasProp = {}.hasOwnProperty;

Errors = {};

NamespaceDoestNotExist = (function (superClass) {
    extend(NamespaceDoestNotExist, superClass);

    function NamespaceDoestNotExist() {
        this.name = "NamespaceDoestNotExist";
        this.message = "namespace does not exist";
        Error.captureStackTrace(this, NamespaceDoestNotExist);
    }

    return NamespaceDoestNotExist;

})(Error);

Errors.NamespaceDoestNotExist = NamespaceDoestNotExist;

module.exports = Errors;