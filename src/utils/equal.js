export default function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, key, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (a instanceof Map) {
      if (a.size !== b.size) return false;

      keys = getKeys(a);
      for (i = a.size; i-- !== 0;)
        if (!b.has(keys[i])) return false;

      for (i = a.size; i-- !== 0;) {
        key = keys[i];
        if (!equal(a.get(key), b.get(key))) return false;
      }

      return true;
    }

    if (a instanceof Set) {
      if (a.size !== b.size) return false;

      keys = getKeys(a);
      for (i = a.size; i-- !== 0;)
        if (!b.has(keys[i])) return false;

      return true;
    }

    if (a.constructor.BYTES_PER_ELEMENT && (
      a instanceof Int8Array ||
      a instanceof Uint8Array ||
      a instanceof Uint8ClampedArray ||
      a instanceof Int16Array ||
      a instanceof Uint16Array ||
      a instanceof Int32Array ||
      a instanceof Uint32Array ||
      a instanceof Float32Array ||
      a instanceof Float64Array ||
      a instanceof BigInt64Array ||
      a instanceof BigUint64Array
    )) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (a[i] !== b[i]) return false;
      return true;
    }

    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};

function getKeys(a) {
  var keys = [];
  for (var [key] of a.entries()) keys.push(key);
  return keys;
}