import veritas, {VeritasInstance} from "../src";

// Test that .optional properly influences the validator state

describe("optional", () => {
    type Sample = {
        thing: number,
        thang: string,
        thong?: Date // O#__#O
    };

    const required: Required<Sample>[] = [
        { thing: 5, thang: "5", thong: new Date(5) },
        { thing: 10, thang: "10", thong: new Date(10) },
        { thing: 15, thang: "15", thong: new Date(15) },
        { thing: 20, thang: "20", thong: new Date(20) },
    ];

    const optional: Sample[] = [
        { thing: 5, thang: "5", thong: new Date(5) },
        { thing: 10, thang: "10" },
        { thing: 15, thang: "15", thong: new Date(15) },
        { thing: 20, thang: "20" },
    ];

    function performChecks(v: VeritasInstance<Sample>): void {
        v.propertyType("thing", "number")
            .propertyType("thang", "string")
            .property("thong", (v) => v.instance(Date))
            .unwrap();
    }

    test("passOptional", () => {
        performChecks(veritas(optional).array().optional);
    });

    test.failing("failOptional", () => {
        performChecks(veritas(optional).array());
    });

    test("passRequired", () => {
        performChecks(veritas(required).array().optional);
        performChecks(veritas(required).array());
    });

});
