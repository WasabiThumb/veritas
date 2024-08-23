import veritas from "../src";

// Very basic test to verify that Veritas is sane and identifies value types correctly

describe("singlet", () => {

    const samples: { [k: string]: any[] } = {
        "string": [ "text" ],
        "number": [ 5, NaN ],
        "boolean": [ true, false ],
        "undefined": [ undefined, ({} as any)["x"] ],
        "object": [ {}, new Date() ],
        // @ts-ignore
        "bigint": [ 73n ],
        "symbol": [ Symbol.toStringTag, Symbol() ],
        "function": [ (() => {}), function() {}, process.nextTick ]
    };

    for (let t of veritas.dataTypes) {
        test(t, () => {
            const values = samples[t];
            expect(values).toBeDefined();
            expect(values).not.toHaveLength(0);

            for (let value of values) {
                expect(() => {
                    veritas(value).type(t).unwrap();
                }).not.toThrow();
            }

            for (let foreign of veritas.dataTypes) {
                if (foreign === t) continue;

                const foreignValues = samples[foreign];
                expect(foreignValues).toBeDefined();
                expect(foreignValues).not.toHaveLength(0);

                for (let value of foreignValues) {
                    expect(() => {
                        veritas(value).type(t).unwrap();
                    }).toThrow();
                }
            }
        });
    }

});
