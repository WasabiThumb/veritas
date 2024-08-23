# Veritas
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/WasabiThumb/veritas/test.yml?label=tests&link=https%3A%2F%2Fgithub.com%2FWasabiThumb%2Fveritas%2Factions%2Fworkflows%2Ftest.yml)
![GitHub License](https://img.shields.io/github/license/WasabiThumb/veritas)
![npm bundle size](https://img.shields.io/bundlephobia/min/veritas-ts)

Inline object schema validator with builder syntax for JS.

- 💪 Strong typing support; no need for ``@ts-ignore`` or ``as unknown``
- 😏 Obvious, minimal syntax
- ✅ Comprehensive test suite
- 📚 1-line flattening of rich arrays
- 🏃 Quick start with CJS-style default function
- 💡 Organized error types with detailed messages
- 🤖 Automatic inference of value labels, e.g. ``YourClass.children[3]``

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
- If no arguments are given: no bounds check is performed
- If 1 argument is given: the array must be exactly that length
- If 2 arguments are given: the array length must fall in that range (inclusive). You can also pass ``"+"`` or ``"-"``
  as the 2nd argument, meaning ``length >= a`` and ``length <= a`` respectively.

#### ``each(function): this``
- Asserts that the value is *iterable* (e.g. an array) and calls the specified validation function
  for each value it contains. If the value is a non-nested array, and each member is expected to follow the same
  schema, it may be better to use [array](#arraynumber-number-thisnumber)

#### ``match(string, function?): this``
- Runs the specified validation function if the [type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description)
  of the value matches the given type. When the state of the validator is tested, for example with
  [unwrap](#unwrap-void--never), an error is generated if no matches have passed. Hence, this functions like
  a ``switch (typeof value)``.

#### ``toError(): Error | null``
- Creates an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) if the
  validator found an error, otherwise returns ``null``. Multiple errors are nested through [cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).

#### ``unwrap(): void | never``
- Throws if the validator found an error. The thrown error is as described in [toError](#toerror-error--null).

#### ``errors: { code: number, target: string, ... }[]``
- Gives the internal error objects stored on the validator. Accessing this property counts as examining
  the validator's state.

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