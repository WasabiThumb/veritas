
export type JSClass<T> = { prototype: any, name: string, new(...args: any[]): T };

export type DataType = "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function";

export type MatchesDataType<T extends string> = T extends "undefined" ? undefined :
    (T extends "object" ? object :
        (T extends "boolean" ? boolean :
            (T extends "number" ? number :
                (T extends "bigint" ? bigint :
                    (T extends "string" ? string :
                        (T extends "symbol" ? symbol :
                            (T extends "function" ? Function : never)
                            )
                        )
                    )
                )
            )
        );

export enum VeritasErrorCode {
    /** Also serves as a bitflag for all TYPE errors */
    TYPE = 0b100,
    TYPE_NOT_ARRAY = 0b101,
    TYPE_NOT_INSTANCE = 0b110,
    /** Aso serves as a bitflag for all PROPERTY errors */
    PROPERTY = 0b1000,
    PROPERTY_MISSING = 0b1001,
    PROPERTY_EXTRA = 0b1010,

    NULL = 0b10000,
    ARRAY_BOUND = 0b100000
}

export type VeritasTypeNotArrayError = {
    readonly target: string;
    readonly code: VeritasErrorCode.TYPE_NOT_ARRAY;
    readonly type: ["object"];
}

export type VeritasTypeNotInstanceError = {
    readonly target: string;
    readonly code: VeritasErrorCode.TYPE_NOT_INSTANCE;
    readonly type: ["object"];
    readonly class: JSClass<any>;
}

export type VeritasTypeGenericError = {
    readonly target: string;
    readonly code: VeritasErrorCode.TYPE;
    readonly type: DataType[];
}

export type VeritasTypeError = VeritasTypeNotArrayError | VeritasTypeNotInstanceError | VeritasTypeGenericError;

export type VeritasMissingPropertyError = {
    readonly target: string;
    readonly code: VeritasErrorCode.PROPERTY_MISSING;
    readonly property: string;
};

export type VeritasExtraPropertyError = {
    readonly target: string;
    readonly code: VeritasErrorCode.PROPERTY_EXTRA;
    readonly property: string[];
}

export type VeritasPropertyError = VeritasMissingPropertyError | VeritasExtraPropertyError;

export type VeritasNullError = {
    readonly target: string;
    readonly code: VeritasErrorCode.NULL;
};

export type VeritasArrayBoundError = {
    readonly target: string;
    readonly code: VeritasErrorCode.ARRAY_BOUND;
    readonly bound: string;
}

export type VeritasError = VeritasTypeError | VeritasPropertyError | VeritasNullError | VeritasArrayBoundError;

export type VeritasInstance<T> = {

    /**
     * The errors stored in this instance.
     */
    readonly errors: VeritasError[];

    /**
     * Switches the validator into required mode (default).
     * In required mode, calls to {@link property} and {@link propertyType} will spawn errors if the property is not
     * set on the object.
     */
    readonly required: VeritasInstance<T>;

    /**
     * Switches the validator into optional mode.
     * In optional mode, calls to {@link property} and {@link propertyType} will have their checks skipped if the
     * property is not set on the object.
     */
    readonly optional: VeritasInstance<T>;

    /**
     * Sets the label for the value that is being validated. Used in log messages.
     * The label is set automatically during construction (to "value") and through child traversal methods
     * like {@link property} and {@link array}.
     */
    label(newLabel: string): VeritasInstance<T>;

    /**
     * Checks that the instance conforms to one of the supplied types. If not, further checks are skipped.
     */
    type(expected: DataType, ...others: DataType[]): VeritasInstance<T>;

    /**
     * Checks that the instance is an instance of a class. Also, implicitly checks if the type is "object".
     */
    instance<I>(constructor: JSClass<I>): VeritasInstance<T & I>;

    /**
     * Asserts that the instance is not null. Does not check if the instance is an object, for that use
     * {@link type} or {@link match}.
     */
    notNull(): VeritasInstance<T>;

    /**
     * <p>
     *     Consumes a property with the given name if it exists and passes a Veritas instance wrapping the property
     *     value to the given callback.
     * </p>
     * <p>
     *     If the property does not exist:
     * </p>
     * <ul>
     *     <li>In required mode: all further checks are skipped</li>
     *     <li>In optional mode: nothing</li>
     * </ul>
     */
    property<K extends keyof T>(name: K, receiver?: (veritas: VeritasInstance<T[K]>) => void): VeritasInstance<T>;

    /**
     * Shorthand for ``.property(name, (v) => v.type(types))``.<br>
     * <strong>IMPORTANT NOTE FOR OPTIONAL MODE</strong>:
     * The type check is skipped only if the property is not *specified*. This is a different state from ``undefined``.
     * If you want to allow an optional property to be ``undefined``, pass ``"undefined"`` to ``propertyType``.
     */
    propertyType(name: keyof T, expected: DataType, ...others: DataType[]): VeritasInstance<T>;

    /**
     * Generates an error if the value contains own properties that have not been processed by
     * {@link property}/{@link propertyType}
     */
    noExtra(): VeritasInstance<T>;

    /**
     * Asserts that the value is an array with the specified bounds. After this call, the instance will perform checks
     * on each array member.
     */
    array(boundA?: number, boundB?: number | "+" | "-"): T extends ArrayLike<any> ? VeritasInstance<T[number]> : VeritasInstance<any>;

    /**
     * Asserts that the value is iterable and calls the specified callback for each of the array's elements. If the value
     * is a non-nested array and each array element is expected to follow the same schema, {@link array} may allow for
     * flatter logic.
     */
    each<I>(consumer: (veritas: T extends Iterable<I> ? VeritasInstance<I> : VeritasInstance<any>) => void): VeritasInstance<T>;

    /**
     * Executes the given callback if the value matches the given type. Similar to {@link type}, but each call is not a
     * strong assertion. An error is only generated if the state is checked before a successful match has passed.
     */
    match<E extends DataType>(caseType: E, withCase?: (veritas: VeritasInstance<T & MatchesDataType<E> extends never ? any : T & MatchesDataType<E>>) => void): VeritasInstance<T>;

    /**
     * Converts the stored errors in the instance to a JS Error, or null if no errors.
     */
    toError(): Error | null;

    /**
     * Throws the stored errors, if any.
     */
    unwrap(): void | never;

};

export type VeritasEntry = {
    <T>(value: T): VeritasInstance<T>;
};

export type VeritasLib = {
    readonly dataTypes: DataType[];
    formatError(error: VeritasError): string;
};

export type Veritas = VeritasEntry & VeritasLib;
