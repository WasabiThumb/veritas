import {
    DataType,
    MatchesDataType,
    VeritasArrayBoundError,
    VeritasError,
    VeritasErrorCode,
    VeritasExtraPropertyError,
    VeritasInstance,
    VeritasMissingPropertyError,
    VeritasNullError,
    VeritasTypeGenericError,
    VeritasTypeNotArrayError,
    VeritasTypeNotInstanceError
} from "./spec";
import {formatError} from "./logging";
import {DATA_TYPES} from "./data";

const DataTypes: Set<DataType> = new Set<DataType>(DATA_TYPES);

export class VeritasInstanceImpl<T> implements VeritasInstance<T> {

    private _value: T[];
    private _arrayMode: boolean;
    private _label: string;
    private _errors: VeritasError[] = [];
    private _required: boolean = true;
    private _fatal: boolean = false;
    private _passedStrictTypeCheck: boolean = false;
    private _passedStrictNullCheck: boolean = false;
    private _matchedTypes: Set<DataType> = new Set<DataType>();
    private _checkedProperties: Set<string | number | symbol> = new Set<string | number | symbol>();

    constructor(value: T[], arrayMode: boolean) {
        // When not in array mode, value should have a length of 1
        this._value = value;
        this._arrayMode = arrayMode;
        if (typeof value === "object" && value !== null && "constructor" in value) {
            let constructorName = value.constructor.name;
            if (constructorName === "Array" || constructorName === "Object") {
                constructorName = "value";
            } else {
                constructorName = constructorName || "value";
            }
            this._label = constructorName;
        } else {
            this._label = "value";
        }
    }

    get errors(): VeritasError[] {
        const matchedTypesCount: number = this._matchedTypes.size;
        if (!this._fatal && matchedTypesCount !== 0) {
            let firstType: DataType | null = null;
            let remainingTypes: DataType[] = new Array(matchedTypesCount - 1);
            let head: number = -1;
            for (let matchedType of this._matchedTypes) {
                if (head === -1) {
                    firstType = matchedType;
                } else {
                    remainingTypes[head] = matchedType;
                }
                head++;
            }
            this.type(firstType!, ...remainingTypes);
            this._matchedTypes.clear();
        }
        return [...this._errors];
    }

    get required(): VeritasInstance<T> {
        this._required = true;
        return this;
    }

    get optional(): VeritasInstance<T> {
        this._required = false;
        return this;
    }

    label(newLabel: string): VeritasInstance<T> {
        this._label = newLabel;
        return this;
    }

    private _iteratorLabel(index: number): string {
        if (this._arrayMode) return `${this._label}[${index}]`;
        return this._label;
    }

    type(expected: DataType, ...others: DataType[]): VeritasInstance<T> {
        if (this._fatal) return this;
        if (this._arrayMode && this._value.length === 0) return this;
        if (this._passedStrictTypeCheck) return this;

        let all: DataType[];
        let membership: ((t: DataType) => boolean);
        if ((!others) || (others.length === 0)) {
            all = [expected];
            membership = ((t) => t === expected);
        } else if (others.length === 1 && expected !== others[0]) {
            all = [expected, others[0]];
            membership = ((t) => t === expected || t === others[0]);
        } else {
            const set = new Set([ expected, ...others ]);
            membership = ((t) => set.has(t));
            all = [...set];
        }

        for (let t of all) {
            if (!DataTypes.has(t)) throw new Error("Invalid data type: " + t);
        }

        for (let i=0; i < this._value.length; i++) {
            if (!membership(typeof this._value[i])) {
                this._fatal = true;
                this._errors.push({
                    code: VeritasErrorCode.TYPE,
                    target: this._iteratorLabel(i),
                    type: all
                } satisfies VeritasTypeGenericError);
            }
        }

        if (!this._fatal) this._passedStrictTypeCheck = true;
        return this;
    }

    instance<I>(constructor: { new(): I }): VeritasInstance<T & I> {
        this.type("object").notNull();
        if (this._fatal) return this as unknown as VeritasInstance<T & I>;

        let v: T;
        for (let i=0; i < this._value.length; i++) {
            v = this._value[i];
            if (Object.getPrototypeOf(v) !== constructor.prototype) {
                this._fatal = true;
                this._errors.push({
                    code: VeritasErrorCode.TYPE_NOT_INSTANCE,
                    target: this._iteratorLabel(i),
                    class: constructor
                } as VeritasTypeNotInstanceError);
                break;
            }
        }

        return this as unknown as VeritasInstance<T & I>;
    }

    notNull(): VeritasInstance<T> {
        if (this._fatal) return this;
        if (this._passedStrictNullCheck) return this;

        let v: T;
        for (let i=0; i < this._value.length; i++) {
            v = this._value[i];
            if (v === null) {
                this._fatal = true;
                this._errors.push({
                    code: VeritasErrorCode.NULL,
                    target: this._iteratorLabel(i)
                } satisfies VeritasNullError);
                break;
            }
        }

        if (!this._fatal) this._passedStrictNullCheck = true;
        return this;
    }

    property<K extends keyof T>(name: K, receiver?: (veritas: VeritasInstance<T[K]>) => void): VeritasInstance<T> {
        if (this._fatal) return this;
        this._checkedProperties.add(name);

        let v: T;
        let hasProperty: boolean;
        for (let i=0; i < this._value.length; i++) {
            const label = this._iteratorLabel(i);

            v = this._value[i];
            hasProperty = (typeof v === "object") ? (v === null ? false : name in v) : false;
            if (hasProperty) {
                const child = new VeritasInstanceImpl([v[name]], false);
                child.label(name.toString());
                if (typeof receiver === "function") receiver(child);
                if (this._importErrors(label, child)) break;
            } else if (this._required) {
                this._fatal = true;
                this._errors.push({
                    code: VeritasErrorCode.PROPERTY_MISSING,
                    target: label,
                    property: name
                } as VeritasMissingPropertyError);
                break;
            }
        }

        return this;
    }

    propertyType(name: keyof T, expected: DataType, ...others: DataType[]): VeritasInstance<T> {
        return this.property(name, (v) => v.type(expected, ...others));
    }

    noExtra(): VeritasInstance<T> {
        this.type("object").notNull();
        if (this._fatal) return this;

        let v: T;
        for (let i=0; i < this._value.length; i++) {
            v = this._value[i];
            const names: string[] = Object.getOwnPropertyNames(v);
            const extra: string[] = new Array(names.length);
            let extraCount: number = 0;
            for (let name of names) {
                if (this._checkedProperties.has(name)) continue;
                extra[extraCount++] = name;
            }
            if (extraCount === 0) continue;
            extra.length = extraCount;

            this._fatal = true;
            this._errors.push({
                code: VeritasErrorCode.PROPERTY_EXTRA,
                target: this._iteratorLabel(i),
                property: extra
            } satisfies VeritasExtraPropertyError);
            break;
        }

        return this;
    }

    array(boundA?: number, boundB?: number | "+" | "-"): T extends ArrayLike<any> ? VeritasInstance<T[number]> : VeritasInstance<any> {
        if (this._arrayMode) throw new Error("Cannot perform validation on nested arrays");
        this.type("object");
        if (this._fatal) {
            // @ts-ignore
            return this;
        }

        const v: T = this._value[0];
        if (!Array.isArray(v)) {
            this._fatal = true;
            this._errors.push({
                code: VeritasErrorCode.TYPE_NOT_ARRAY,
                target: this._label,
                type: ["object"]
            } as VeritasTypeNotArrayError);
            // @ts-ignore
            return this;
        }

        const vl: number = v.length;
        if (typeof boundA === "number") {
            boundA = Math.trunc(boundA);

            let descriptor: string | null = null;
            let b: number;
            if (typeof boundB === "string") {
                if (boundB === "+") {
                    b = Number.MAX_SAFE_INTEGER;
                    descriptor = `${boundA}+`;
                } else if (boundB === "-") {
                    b = boundA;
                    descriptor = `${boundA}-`;
                    boundA = Number.MIN_SAFE_INTEGER;
                } else {
                    b = parseInt(boundB);
                }
            } else if (typeof boundB === "number") {
                b = boundB;
                b = Math.trunc(b);
            } else {
                b = boundA;
            }

            if (isNaN(boundA) || isNaN(b) || (b < boundA)) {
                throw new Error("Invalid array bounds: " + boundA + " to " + b);
            }

            if (vl < boundA || vl > b) {
                this._fatal = true;

                this._errors.push({
                    code: VeritasErrorCode.ARRAY_BOUND,
                    target: this._label,
                    bound: (descriptor === null) ? `${boundA} - ${b}` : descriptor
                } satisfies VeritasArrayBoundError);

                // @ts-ignore
                return this;
            }
        }

        // @ts-ignore
        this._value = v;
        this._arrayMode = true;
        this._passedStrictTypeCheck = false;
        this._passedStrictNullCheck = false;
        this._matchedTypes.clear();
        this._checkedProperties.clear();
        // @ts-ignore
        return this;
    }

    each<I>(consumer: (veritas: T extends Iterable<I> ? VeritasInstance<I> : VeritasInstance<any>) => void): VeritasInstance<T> {
        this.type("object").notNull();
        if (this._fatal) return this;

        let v: T & object;
        outer:
        for (let i=0; i < this._value.length; i++) {
            v = this._value[i] as unknown as T & object;
            const label = this._iteratorLabel(i);

            if (Symbol.iterator in v) {
                const iter = (v as unknown as Iterable<I>)[Symbol.iterator]();
                let counter: number = 0;
                let next;
                while (!(next = iter.next()).done) {
                    const child = new VeritasInstanceImpl([next.value], false);
                    child.label(label + "[" + (counter++) + "]");
                    // @ts-ignore
                    consumer(child);
                    if (this._importErrors("", child)) break outer;
                }
            } else {
                this._fatal = true;
                this._errors.push({
                    target: label,
                    code: VeritasErrorCode.TYPE_NOT_ARRAY,
                    type: ["object"]
                } satisfies VeritasTypeNotArrayError);
                return this;
            }
        }

        return this;
    }

    match<E extends DataType>(caseType: E, withCase?: (veritas: VeritasInstance<T & MatchesDataType<E> extends never ? any : T & MatchesDataType<E>>) => void): VeritasInstance<T> {
        if (this._fatal) return this;
        if (!DataTypes.has(caseType)) {
            throw new Error("Invalid data type: " + caseType);
        }
        if (this._matchedTypes.has(caseType)) {
            throw new Error("Data type \"" + caseType + "\" matched multiple times");
        }
        this._matchedTypes.add(caseType);

        let v: T;
        for (let i=0; i < this._value.length; i++) {
            const label = this._iteratorLabel(i);
            v = this._value[i];

            if ((typeof v) === caseType) {
                const child = new VeritasInstanceImpl([v], false) as unknown as VeritasInstanceImpl<MatchesDataType<E>>;
                child.label(label);
                if (typeof withCase === "function") {
                    // @ts-ignore
                    withCase(child);
                }
                if (this._importErrors("", child)) break;
            }
        }

        return this;
    }

    toError(): Error | null {
        if (!this._fatal) return null;
        if (this._errors.length === 0) return new Error("Invalid parser state");
        let ret: Error = new Error(formatError(this._errors[0]));
        for (let i=1; i < this._errors.length; i++) {
            let sub: Error = new Error(formatError(this._errors[i]));
            Object.assign(sub, { cause: ret });
            ret = sub;
        }
        return ret;
    }

    unwrap(): void | never {
        const err = this.toError();
        if (err !== null) throw err;
    }

    private _importErrors(myLabel: string, child: VeritasInstanceImpl<any>): boolean {
        for (let error of child.errors) {
            const { target } = error;
            this._errors.push(Object.assign(error, {
                target: (myLabel.length !== 0 ? myLabel + "." + target : target),
            }));
        }
        if (child._fatal) {
            return this._fatal = true;
        }
        return false;
    }

}
