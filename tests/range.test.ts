import {NumberRange} from "../src/range";
import veritas = require("../src");

describe("VeritasInstance", () => {

    test("range", () => {

        const fives = {
            positive: 5,
            negative: -5
        };

        expect(() => {

            veritas(fives)
                .property("positive", (v) => v.range(0, 10))
                .property("negative", (v) => v.range(-10, 0))
                .unwrap();

        }).not.toThrow();

        expect(() => {

            veritas(fives)
                .property("positive", (v) => v.range(0, "-"))
                .unwrap();

        }).toThrow();

        expect(() => {

            veritas(fives)
                .property("negative", (v) => v.range(0, "+"))
                .unwrap();

        }).toThrow();

    });

});

describe("NumberRange", () => {

    test("simple", () => {
        const nr = new NumberRange(-5, 5);
        expect(nr.contains(-100)).toEqual(false);
        expect(nr.contains(-6  )).toEqual(false);
        expect(nr.contains(-5  )).toEqual(true);
        expect(nr.contains(-3  )).toEqual(true);
        expect(nr.contains( 0  )).toEqual(true);
        expect(nr.contains( 3  )).toEqual(true);
        expect(nr.contains( 5  )).toEqual(true);
        expect(nr.contains( 6  )).toEqual(false);
        expect(nr.contains( 100)).toEqual(false);
    });

    test("iterator", () => {
        let nr: NumberRange;

        nr = new NumberRange(-3, 3);
        expect([ ...nr ]).toEqual([ -3, -2, -1, 0, 1, 2, 3 ]);

        nr = new NumberRange(10.2, 15.8).truncate();
        expect([ ...nr ]).toEqual([ 10, 11, 12, 13, 14, 15 ]);
    });

    test("size", () => {
        let nr: NumberRange;

        nr = new NumberRange(-3, 3);
        expect(nr.size).toEqual(7);

        nr = new NumberRange(10.2, 15.8).truncate();
        expect(nr.size).toEqual(6);

        nr = new NumberRange(69, "+");
        expect(nr.size).toEqual(Number.POSITIVE_INFINITY);

        nr = new NumberRange(-Math.PI, "-");
        expect(nr.size).toEqual(Number.POSITIVE_INFINITY);
    });

    test("positiveInfinity", () => {
        const nr = new NumberRange(-5, "+");
        expect(nr.contains(-6                       )).toEqual(false);
        expect(nr.contains(-5                       )).toEqual(true);
        expect(nr.contains( 0                       )).toEqual(true);
        expect(nr.contains( 100                     )).toEqual(true);
        expect(nr.contains( Number.POSITIVE_INFINITY)).toEqual(true);
    });

    test("negativeInfinity", () => {
        const nr = new NumberRange(5, "-");
        expect(nr.contains( 6                       )).toEqual(false);
        expect(nr.contains( 5                       )).toEqual(true);
        expect(nr.contains( 0                       )).toEqual(true);
        expect(nr.contains(-100                     )).toEqual(true);
        expect(nr.contains( Number.NEGATIVE_INFINITY)).toEqual(true);
    });

});
