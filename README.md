# frozen-fruit

## Overview

`frozen-fruit` is a utility script that extracts and "freezes" global objects, properties, and methods into a secure, immutable namespace called `primordials`. This ensures that you can access and use key built-in properties without the risk of them being modified or tampered with by the surrounding environment.

The module achieves this by copying and unbinding all relevant global properties, including their prototypes, into a new object. It handles accessor properties (getters and setters) as well as regular properties. The final object is frozen to prevent further modifications, securing the environment from unintended changes to the primordials.

## Features

- **Primordial Extraction**: Copies properties and methods from global objects, along with their prototypes.
- **Unbinding Functions**: Ensures that function methods are unbound from their original context, preventing unwanted changes to the `this` context.
- **Accessor Handling**: Copies getter and setter methods from global objects and their prototypes.
- **Symbol Key Formatting**: Handles global objects with symbol keys and reformats their names for better usability.
- **Immutable**: The resulting `primordials` object is frozen, making it immutable.

## Usage

After importing the module, you can access built-in global properties through the frozen `primordials` object. This makes it ideal for environments where you want to prevent accidental or malicious modifications to the global object.

### Example

```javascript
const primordials = require('frozen-fruit');

// Access a frozen global object
console.log(primordials.MathSin); // Unbound sine function from Math.prototype

// Attempting to modify the primordials will throw an error
primordials.Math = {}; // Error: Cannot assign to read only property 'Math'
```

### Primordials Structure

The module provides an object where each primordial is organized as follows:

- Methods and properties of global objects are prefixed by the object name.
  - e.g., `MathSin`, `MathCos`, etc.
- Prototype methods and properties are prefixed by the object name and `Prototype`.
  - e.g., `ArrayPrototypeMap`, `StringPrototypeSplit`, etc.
- Getter and setter methods are prefixed with `Get` and `Set` respectively.
  - e.g., `ElementGetId`, `WindowSetTitle`.

### Custom Usage

You can also use the `GetPrimordial()` function directly to copy properties from a specific source:

```javascript
const { GetPrimordial } = require('./frozen-fruit');

// Extract properties from a custom object
const myPrimordials = GetPrimordial(SomeGlobalObject);
```

## Installation

Simply add the `frozen-fruit` file to your project and require it wherever you need access to immutable global properties.

## How it Works

1. **Collecting Global Properties**: It uses `Object.getOwnPropertyNames(globalThis)` to gather a set of all global properties.
2. **Property Copying**: For each global property, it uses `Reflect.ownKeys()` to iterate over the properties and `Reflect.getOwnPropertyDescriptor()` to extract detailed property descriptors (including getters, setters, etc.).
3. **Unbinding Functions**: All function values are unbound using `Function.prototype.call.bind()`, preventing their internal `this` from being altered.
4. **Freezing**: After collecting and copying all desired properties, the resulting `primordials` object is frozen using `Object.freeze()`.