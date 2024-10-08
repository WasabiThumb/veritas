import {
    VeritasArrayBoundError,
    VeritasError,
    VeritasErrorCode,
    VeritasNullError,
    VeritasPropertyError,
    VeritasTypeError,
    VeritasValueError
} from "./spec";

function formatTypeError(error: VeritasTypeError): string {
    if (error.code === VeritasErrorCode.TYPE_NOT_ARRAY)
        return `${error.target} is not an array`;
    if (error.code === VeritasErrorCode.TYPE_NOT_INSTANCE)
        return `${error.target} is not an instance of ${error.class.name}`;
    return `${error.target} does not match type: ${error.type.join(' | ')}`;
}

function formatPropertyError(error: VeritasPropertyError): string {
    if ((error.code & 1) === 1) {
        return `${error.target} is missing property: ${error.property}`;
    } else {
        const props = error.property as string[];
        if (props.length === 1) {
            return `${error.target} has extra property: ${props[0]}`;
        } else {
            return `${error.target} has extra properties: ${props.join(', ')}`;
        }
    }
}

function formatNullError(error: VeritasNullError): string {
    return `${error.target} is null`;
}

function formatArrayBoundError(error: VeritasArrayBoundError): string {
    return `${error.target} length does not fall in bounds ${error.bound}`;
}

function formatValueError(error: VeritasValueError): string {
    if (error.code === VeritasErrorCode.VALUE_BOUND)
        return `${error.target} value (${error.got}) does not fall in bounds ${error.bound}`;

    let expected: string = "";
    let count: number = 0;
    for (let allow of error.expected) {
        if ((count++) !== 0) {
            if (count >= 10) {
                expected += " ...";
                break;
            } else {
                expected += " | ";
            }
        }
        expected += `${allow}`;
    }
    if (count === 0) expected = "never";
    return `${error.target} has illegal value: expected ${expected}, got ${error.got}`;
}

export function formatError(error: VeritasError): string {
    const { code } = error;
    if ((code & VeritasErrorCode.TYPE) !== 0) return formatTypeError(error as VeritasTypeError);
    if ((code & VeritasErrorCode.PROPERTY) !== 0) return formatPropertyError(error as VeritasPropertyError);
    if ((code & VeritasErrorCode.VALUE) !== 0) return formatValueError(error as VeritasValueError);
    if (Math.clz32(code) - 26) {
        return formatNullError(error as VeritasNullError);
    } else {
        return formatArrayBoundError(error as VeritasArrayBoundError);
    }
}
