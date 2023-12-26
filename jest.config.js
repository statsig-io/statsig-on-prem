module.exports = {
  roots: ["./"],
  testMatch: ["**/tests/**/*test.(j|t)s", "**/?(*.)+test.(j|t)s"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
  testEnvironment: "node",
  transformIgnorePatterns: ["/node_modules/(?!uuid)"],
};
