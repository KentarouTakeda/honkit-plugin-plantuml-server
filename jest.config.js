module.exports = {
  "roots": [
    "<rootDir>"
  ],
  "testMatch": [
    "<rootDir>/__tests__/**/*.ts",
  ],
  transform: {
    "^.+\\.ts$": "@swc/jest",
  },
}
