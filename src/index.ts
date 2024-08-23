import {DataType, Veritas, VeritasEntry, VeritasError, VeritasLib} from "./spec";
import {VeritasInstanceImpl} from "./instance";
import * as logging from "./logging";
import {DATA_TYPES} from "./data";

const entry: VeritasEntry = ((value) => {
    return new VeritasInstanceImpl([ value ], false);
});

const lib: VeritasLib = {
    get dataTypes(): DataType[] {
        return [...DATA_TYPES];
    },
    formatError(error: VeritasError): string {
        return logging.formatError(error);
    }
};

const veritas: Veritas = Object.assign(entry, lib);

export * from "./spec";
// @ts-ignore
export = veritas;
