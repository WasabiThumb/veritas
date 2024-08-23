import veritas from "../src";

// Test that inline array flattening works properly

describe("array", () => {

    test("numbers", () => {
        const numbers = [1, 2, 3, 4, 5];

        expect(() => {
            veritas(numbers)
                .array()
                .type("number")
                .unwrap();
        }).not.toThrow();

        expect(() => {
            veritas(numbers)
                .array()
                .type("string")
                .unwrap();
        }).toThrow();
    });

    test("objects", () => {
        type Point = { x: number; y: number };
        type Points = Point[];

        const points: Points = [
            { x: 5, y: 10 },
            { x: 5, y: 20 },
            { x: 20, y: 10 },
        ];

        expect(() => {
            veritas(points)
                .array()
                .property("x", (v) => v.type("number"))
                .propertyType("y", "number")
                .noExtra()
                .unwrap();
        }).not.toThrow();

        expect(() => {
            veritas(points)
                .array()
                .property("x")
                .noExtra()
                .unwrap();
        }).toThrow();
    });

})
