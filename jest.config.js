/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/server", "<rootDir>/client", "<rootDir>/shared"],
  transform: {
    "^.+\.tsx?$": ["ts-jest", { tsconfig: "server/tsconfig.json" }],
  },
};