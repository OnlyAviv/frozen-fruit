const toBePrimordialized = new Set(Object.getOwnPropertyNames(globalThis));
const unbind = Function.prototype.bind.bind(Function.prototype.call);

function copyDescriptor(dest, prefix, newKey, { get, set }, { object, key }) {
    if (get) dest[`${prefix}Get${newKey}`] = `UnbindGetter<${object}, "${key}">`;
    if (set) dest[`${prefix}Set${newKey}`] = `UnbindSetter<${object}, "${key}">`;
}

function formatSymbol(description) {
    const base = description.startsWith('Symbol.') ? description.slice(7) : description;
    return `Symbol${base.split('.').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('')}`;
}

function getNewKey(key) {
    return typeof key === 'symbol' 
        ? formatSymbol(key.description) 
        : `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function copyProperties(source, prefix, dest, isPrototype = true) {
    let originalPrefix = prefix;
    if (isPrototype) prefix += 'Prototype';
    if (isPrototype) originalPrefix += '.prototype';

    for (const key of Reflect.ownKeys(source)) {
        if (typeof key === 'symbol') continue;
        if (!/[a-zA-Z]/.exec(key[0])) continue;

        const newKey = getNewKey(key);
        const desc = Reflect.getOwnPropertyDescriptor(source, key);

        if (desc.get || desc.set) {
            copyDescriptor(dest, prefix, newKey, desc, { object: originalPrefix, key });
        } else {
            dest[`${prefix}${newKey}`] = isPrototype && typeof desc.value === 'function'
                ? `UnbindFunction<typeof ${originalPrefix}.${key}>`
                : `typeof ${originalPrefix}.${key}`;
        }
    }
}

function getPrimordial(src, name = src.name, dest = {}) {
    if (!name) throw new Error('src does not have a name');

    if (typeof src !== 'function' && (typeof src !== 'object' || !src.constructor)) {
        dest[name] = src;
        return dest;
    }

    copyProperties(src, name, dest);
    if (src.prototype) copyProperties(src.prototype, name, dest);

    return dest;
}

const primordials = {};
for (const name of toBePrimordialized) {
    if (name[0] === name[0].toUpperCase()) getPrimordial(globalThis[name], name, primordials);
}

console.log(`
type UnbindFunction<Func extends (this: unknown, ...args: unknown[]) => unknown> = (
  thisArg: ThisParameterType<Func>, 
  ...params: Parameters<Func>
) => ReturnType<Func>;

type UnbindGetter<ObjectType, Key extends keyof ObjectType, SelfType = ObjectType> = 
  ObjectType[Key] extends infer ValueType 
    ? (thisArg: SelfType) => ValueType 
    : never;

type UnbindSetter<ObjectType, Key extends keyof ObjectType, SelfType = ObjectType> = 
  ObjectType[Key] extends infer ValueType 
    ? (thisArg: SelfType, newValue: ValueType) => void 
    : never;

declare module "frozen-fruit" {
  export const GetPrimordial: function,
`.trim() + '\n\n')

console.log(Object.entries(primordials).map(([name, value]) => {
    return `  ${name}: ${value},`
}).join('\n') + '\n}');