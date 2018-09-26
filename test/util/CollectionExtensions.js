// TODO: We should really move to TypeScript sometime.

Map.prototype.getOrCreateMap = function (k) {
    if (this.get(k) === undefined) {
        this.set(k, new Map());
    }
    return this.get(k);
};

Map.prototype.getOrCreateSet = function (k) {
    if (this.get(k) === undefined) {
        this.set(k, new Set());
    }
    return this.get(k);
};

/**
 * Re-implemented map.forEach for async/await. YOU MUST AWAIT forEachAsync.
 *
 * TODO: swap (k, v) to (v, k) to match stdlib
 *
 * forEachAsync(callbackfn: (key: K, value: V) => void, thisArg?: any): void;
 */
Map.prototype.forEachAsync = function (callbackfn, thisArg) {
    const thiz = thisArg || this;
    return [...this] // spread to array of [[k1,v1],[k2,v2], ..., [k_n,v_n]
    // convert everything to promises and use reduce to execute them sequentially
        .reduce(
            //
            (p, [k, v]) => p.then(() => callbackfn.apply(thiz, [k, v]))
            , Promise.resolve() // begin reduction with an empty resolved promise
        );
};

/**
 * Re-implemented set.forEach for async/await. YOU MUST AWAIT forEachAsync.
 *
 * forEachAsync(callbackfn: (value: V) => void, thisArg?: any): void;
 */
Set.prototype.forEachAsync = function (callbackfn, thisArg) {
    const thiz = thisArg || this;
    return [...this] // spread to array of [v1, v2, ..., v_n]
    // convert everything to promises and use reduce to execute them sequentially
        .reduce(
            //
            (p, v) => p.then(() => callbackfn.apply(thiz, v))
            , Promise.resolve() // begin reduction with an empty resolved promise
        );
};

Object.defineProperty(Array.prototype, 'zip', {
    enumerable: false,
    value: function(otherArray) { return this.map((e,i) => [this[i], i < otherArray.length ? otherArray[i] : null]); }
});

Object.defineProperty(Array.prototype, 'difference', {
    enumerable: false,
    value: function(otherArray) { return this.filter((e, i) => !otherArray.includes(e)); }
});
