import {NumberLike} from "./spec";

function normalizeNumber(like: NumberLike | any): number {
    if (typeof like === "number") return like;
    if (typeof like === "bigint") return Number(like);
    return +like;
}

export class NumberRange implements Iterable<number> {

    static of(a: NumberLike, b?: NumberLike | "+" | "-" | undefined): NumberRange {
        return new NumberRange(a, b);
    }

    private a: number;
    private b: number;
    private readonly flag: number;

    constructor(a: NumberLike, b?: NumberLike | "+" | "-" | undefined) {
        let flag: number;
        let va: number = normalizeNumber(a);
        let vb: number;

        if (typeof b === "undefined") {
            vb = va;
            flag = 7;
        } else if (typeof b === "string") {
            if (b === "+") {
                vb = Number.POSITIVE_INFINITY;
                flag = 1;
            } else if (b === "-") {
                vb = va;
                va = Number.NEGATIVE_INFINITY;
                flag = 2;
            } else {
                vb = parseFloat(b);
                if (isNaN(vb)) throw new Error(`Range bound \"${b}\" is not a number`);
                flag = 3;
            }
        } else {
            vb = normalizeNumber(b);
            flag = 3;
        }

        if (vb < va) throw new Error("Range " + va + " - " + vb + " is impossible to satisfy");
        this.a = va;
        this.b = vb;
        this.flag = flag;
    }

    get descriptor(): string {
        switch (this.flag & 3) {
            case 1:
                return `${this.a}+`;
            case 2:
                return `${this.b}-`;
            case 3:
                return `${this.a} - ${this.b}`;
            default:
                throw new Error();
        }
    }

    get isFinite(): boolean {
        return (this.flag & 3) === 3 && (Math.trunc(this.a) === this.a) && (Math.trunc(this.b) === this.b);
    }

    get size(): number {
        if (this.isFinite) return (this.b - this.a) + 1;
        return Number.POSITIVE_INFINITY;
    }

    truncate(): this {
        if (this.flag & 1) this.a = Math.trunc(this.a);
        if (this.flag & 2) this.b = Math.trunc(this.b);
        return this;
    }

    contains(n: any): boolean {
        const nn: number = normalizeNumber(n);
        if (this.flag & 4) return (nn === this.a);
        if ((this.flag & 1) && (nn < this.a)) return false;
        return !((this.flag & 2) && (nn > this.b));
    }

    [Symbol.iterator](): Iterator<number> {
        const { a, b } = this;
        if (!this.isFinite) {
            // Whoever is calling the iterator is making a mistake.
            return ([ a, b ])[Symbol.iterator]();
        }

        let head: number = a;
        return (function* () {
            while (head <= b) {
                yield head;
                head++;
            }
        })();
    }

}
