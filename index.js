const toBePrimordialized = new Set(Object.getOwnPropertyNames(globalThis));
const unbind = Function.prototype.bind.bind(Function.prototype.call);

function copyDescriptor(dest, name, newKey, { get, set, enumerable }) {
    if (get) {
        Reflect.defineProperty(dest, `${name}Get${newKey}`, {
            __proto__: null,
            value: unbind(get),
            enumerable,
        });
    }
    if (set) {
        Reflect.defineProperty(dest, `${name}Set${newKey}`, {
            __proto__: null,
            value: unbind(set),
            enumerable,
        });
    }
}

function formatSymbol(description) {
    // Remove 'Symbol.' prefix and capitalize
    return `Symbol${description
        .slice(description.startsWith('Symbol.') ? 7 : 0)
        .split('.')
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join('')}`;
}

function getNewKey(key) {
    return typeof key === 'symbol' 
        ? formatSymbol(key.description) 
        : `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

/**
 * Creates a new object that contains properties and methods from a source 
 * object or function, including its prototype properties, with a specified 
 * prefix for the property names.
 *
 * @param {Object|Function} src - The source object or function from which to 
 *        copy properties. If it's not an object or function, its value will be 
 *        directly assigned to the destination object.
 * @param {string} [name=src.name] - The prefix used for the property names in 
 *        the destination object. Defaults to the name property of the source 
 *        if not provided.
 * @param {Object} [dest={}] - The destination object where properties will be 
 *        copied. If not provided, a new object will be created.
 * @throws {Error} If the source object does not have a name.
 * 
 * @returns {Object} The destination object containing the copied properties 
 *                  from the source.
 */
function getPrimordial(src, name = src.name, dest = {}) {
    if (!name) throw new Error('src does not have a name');

    // Handle non-function, non-object sources
    if (typeof src !== 'function' && (typeof src !== 'object' || !src.constructor)) {
        dest[name] = src;
        return dest;
    }

    const copyProperties = (source, prefix, isPrototype = true) => {
        if (isPrototype) prefix += 'Prototype';
        
        for (const key of Reflect.ownKeys(source)) {
            const newKey = getNewKey(key);
            const desc = Reflect.getOwnPropertyDescriptor(source, key);

            if ('get' in desc || 'set' in desc) {
                copyDescriptor(dest, prefix, newKey, desc);
            } else {
                const newName = `${prefix}${newKey}`;
                if (isPrototype && typeof desc.value === 'function') {
                    desc.value = unbind(desc.value);
                }
                Reflect.defineProperty(dest, newName, {
                    __proto__: null,
                    ...desc,
                });
            }
        }
    };

    copyProperties(src, name);

    // Copy prototype properties
    if (src.prototype) copyProperties(src.prototype, name, true);

    return dest;
}

const primordials = { GetPrimordial: getPrimordial };

// Collect primordials from specified global properties
for (const name of toBePrimordialized) {
    if (name[0].toUpperCase() === name[0]) { // Check for capitalized names
        getPrimordial(globalThis[name], name, primordials);
    }
}

Object.freeze(primordials);
module.exports = primordials;