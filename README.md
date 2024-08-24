# Veritas
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/WasabiThumb/veritas/test.yml?label=tests&link=https%3A%2F%2Fgithub.com%2FWasabiThumb%2Fveritas%2Factions%2Fworkflows%2Ftest.yml)
![GitHub License](https://img.shields.io/github/license/WasabiThumb/veritas)
![npm bundle size](https://img.shields.io/bundlephobia/min/veritas-ts)

Inline object schema validator with builder syntax for JS.

- 💪 Strong typing support; no need for ``@ts-ignore`` or ``as unknown``
- 😏 Obvious, minimal syntax
- ✅ Comprehensive test suite
- 📚 1-line [flattening](#arraynumber-number-thisnumber) of rich arrays
- 🏃 Quick start with CJS-style default function
- 💡 Organized error types with [detailed messages](#errors)
- 🤖 Automatic inference of value [labels](#labelstring-this), e.g. ``YourClass.children[3]``

## Install
```shell
npm install --save veritas-ts
```

## Quick Start
```js
const veritas = require("veritas-ts");

const vector = {
    x: 50,
    y: 40,
    z: 30
};

veritas(vector)
    .propertyType("x", "number")
    .propertyType("y", "number")
    .optional
    .propertyType("z", "number", "undefined")
    .unwrap();
```

## Example
```ts
import veritas from "veritas-ts";

type Article = {
    id: number | string;
    title: string;
    author: string | {
        name: string;
        avatar: string;
    },
    created: Date,
    updated?: Date,
    content?: string | string[];
}

const articles: Article[] = getArticles();

veritas(articles)
    .label("articles") // Not required
    .array() // Following methods will test each array member
    .type("object")
    .propertyType("id", "number", "string")
    .property("title", (v) => v.type("string"))
    .property("author", (v) => {
        v.match("string");
        v.match("object", (v) => {
            v.propertyType("name", "string");
            v.propertyType("avatar", "string")
        });
    })
    .property("created", (v) => v.instance(Date))
    .optional
    .property("updated", (v) => v.instance(Date))
    .property("content", (v) => {
        v.match("string");
        v.match("object", (v) => v.array().type("string"));
    })
    // Use .errors for more control
    .unwrap();
```

## Methods
#### ``label(string): this``
- Changes the label of the instance

#### ``type(string[]): this``
- Asserts that the value matches one of the given types.
A "type" is defined as a [potential output of the 
typeof operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description).

#### ``instance(class): this``
- Asserts that the value is an instance of the given class, e.g. ``.instance(Uint8Array)``

#### ``notNull(): this``
- Asserts that the value is not null. Does not check if the value is an object.

#### ``required: this``
- Switches the validator into required mode (default).

#### ``optional: this``
- Switches the validator into optional mode.

#### ``property(string, function?): this``
- Consumes a property with the given name if it exists.
- In required mode (default): a non-existent property will generate an error, subsequent checks do nothing.
- In optional mode: a non-existent property will cause nothing to happen.

#### ``propertyType(string, string[]): this``
- Checks that the property with the given name **(1)** is one of the given types **(2)**
- Shorthand for ``.property(name, (v) => v.type(type))``
- **IMPORTANT NOTE FOR OPTIONAL MODE**: The type check is skipped only if the property is not *specified*. This is a
  different state from ``undefined``. If you want to allow an optional property to be ``undefined``, pass
  ``"undefined"`` to [propertyType](#propertytypestring-string-this).

#### ``noExtra(): this``
- Asserts that no additional properties exist on the value that have not been handled
  by a call to [property](#propertystring-function-this)/[propertyType](#propertytypestring-string-this).

#### ``array(number?, number?): this[number]``
- Asserts that the value is an array with the specified bounds. After this call, the instance will perform checks
  on each array member.
- If no arguments are given, no bounds check is performed. Otherwise, the bounds check follows the same rules as [range](#rangeany-any-this)

#### ``each(function): this``
- Asserts that the value is *iterable* (e.g. an array) and calls the specified validation function
  for each value it contains. If the value is a non-nested array, and each member is expected to follow the same
  schema, it may be better to use [array](#arraynumber-number-thisnumber)

#### ``match(string, function?): this``
- Runs the specified validation function if the [type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description)
  of the value matches the given type. When the state of the validator is tested, for example with
  [unwrap](#unwrap-void--never), an error is generated if no matches have passed. Hence, this functions like
  a ``switch (typeof value)``.

#### ``matchArray(function?, function?): this``
- Similar to [match](#matchstring-function-this), but only satisfied if the value is both an ``object`` and satisfies
  ``Array.isArray``. The given function will validate array values, using the same flattening as [array](#arraynumber-number-thisnumber).
  If when the value is an object it is also expected to be an array, ``.match("object", (v) => v.array()...)`` is better.
- A second function can be supplied, which will run when the value is an ``object`` but not an array.

#### ``in(Iterable): this``
- Asserts that some value contained by the given iterable (e.g. an array) is strictly equal to the value being validated.

#### ``equals(any): this``
- Asserts that the value is strictly equal to the given value. Identical to ``.in([value])``.

#### ``range(any, any): this``
- Asserts that the value is within the specified range after numerical [coercion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion).
- If 1 argument is given: the value must exactly equal ``a``
- If 2 arguments are given: the value must fall in that range (inclusive). You can also pass ``"+"`` or ``"-"``
  as the 2nd argument, meaning ``value >= a`` and ``value <= a`` respectively.

#### ``toError(): Error | null``
- Creates a native JS [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) if the
  validator found an error, otherwise returns ``null``. Multiple errors are nested through [cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).

#### ``unwrap(): void | never``
- Throws if the validator found an error. The thrown error is as described in [toError](#toerror-error--null).

#### ``errors: { code: number, target: string, ... }[]``
- Gives the internal [error objects](#errors) stored on the validator. Accessing this property counts as examining
  the validator's state.

## Errors
Error codes designed to allow categorization through bitwise operations.
For example if ``code & 4``, the error is a TypeError.

- TypeError
  - **TypeGenericError**
    - Code: 4
    - Message: ``{target} does not match type: {type}``
    - Raised by: [type](#typestring-this), [propertyType](#propertytypestring-string-this)
  - **TypeNotArrayError**
    - Code: 5
    - Message: ``{target} is not an array``
    - Raised by: [array](#arraynumber-number-thisnumber), [each](#eachfunction-this)
  - **TypeNotInstanceError**
    - Code: 6
    - Message: ``{target} is not an instance of {class}``
    - Raised by: [instance](#instanceclass-this)
- PropertyError
  - **MissingPropertyError**
    - Code: 9
    - Message: ``{target} is missing property: {property}``
    - Raised by: [property](#propertystring-function-this), [propertyType](#propertytypestring-string-this)
  - **ExtraPropertyError**
    - Code: 10
    - Message: ``{target} has extra propert(y/ies): {property}``
    - Raised by: [noExtra](#noextra-this)
- **NullError**
  - Code: 16
  - Message: ``{target} is null``
  - Raised by: [notNull](#notnull-this)
- **ArrayBoundError**
  - Code: 32
  - Message: ``{target} length does not fall in bounds {bound}``
  - Raised by: [array](#arraynumber-number-thisnumber)
- ValueError
  - **ValueGenericError**
    - Code: 64
    - Message: ``{target} has illegal value: expected {expected}, got {got}``
    - Raised by: in, equals
  - **ValueBoundError**
    - Code: 65
    - Message: ``{target} value ({got}) does not fall in bounds {bound}``
    - Raised by: range

## Library Methods
A few methods are assigned directly on the ``veritas`` object.

#### ``dataTypes: string[]``
- Returns an array of every possible data [type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description).

#### ``formatError(VeritasError): string``
- Formats an [error](#errors) (otherwise language-agnostic) into an English error message.

## License
```text
Copyright 2024 Wasabi Codes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```