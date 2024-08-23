import {JestConfigWithTsJest} from "ts-jest";

export default {
  testEnvironment: "node",
  verbose: true,
  testPathIgnorePatterns: ["/node_modules|src|dist|types/"],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
} satisfies JestConfigWithTsJest;
