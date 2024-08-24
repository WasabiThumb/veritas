import veritas from "../src";

// Test a very complex type, because why not. Also, a showcase of the "match" method

type Complex0 = {
    date: Date,
    signature?: string
};

type Complex = {
    child: {
        count: number;
        text: string;
        meta?: symbol;
        pattern?: RegExp;
    },
    children: (Complex0 | number)[],
};

const data: Complex = {
    child: {
        count: 5,
        text: "some text",
        pattern: /[A-F\d]+/i
    },
    children: [
        {
            date: new Date(),
            signature: "some signature",
        },
        57,
        {
            date: new Date()
        },
        42
    ]
};

test("complex", () => {

    expect(() => {

        veritas(data)
            .property("child", (v) => {
                v.propertyType("count", "number")
                    .propertyType("text", "string")
                    .optional
                    .propertyType("meta", "symbol")
                    .property("pattern", (v) => v.instance(RegExp))
            })
            .property("children", (v) => {
                v.array(3, "+")
                    .match("object", (v) => {
                        v.property("date", (v) => v.instance(Date))
                            .optional.propertyType("signature", "string")
                    })
                    .match("number")
            })
            .unwrap()

    }).not.toThrow();

});
