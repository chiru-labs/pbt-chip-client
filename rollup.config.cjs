const commonjs = require("@rollup/plugin-commonjs");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const typescriptPlugin = require("rollup-plugin-typescript2");

const pkg = require("./package.json");

const roots = ["kong/index.ts"];
const formats = ["cjs", "esm", "es"];
const plugins = [typescriptPlugin(), nodeResolve(), commonjs()];

// e.g. lastPartOfPath("foo/bar/baz") -> "baz"
function lastPartOfPath(path) {
  const index = path.lastIndexOf("/");
  return path.slice(index + 1);
}

// e.g. firstPartOfPath("foo/bar/baz") -> "foo"
function firstPartOfPath(path) {
  const index = path.indexOf("/");
  return path.slice(0, index);
}

// Returns true for any dependency listed in package.json and for any member of
// roots other than index.js, where roots is the array defined above.
const isExternalModule = (() => {
  const deps = new Set(Object.keys(pkg.dependencies ?? {}));
  const subrootEndings = new Set(roots.map(lastPartOfPath));
  return (id) =>
    deps.has(id) ||
    (id.startsWith(".") && subrootEndings.has(lastPartOfPath(id)));
})();

function makeConfig(root) {
  return {
    input: `src/${root}`,
    output: formats.map((format) => ({
      dir: `dist/${format}/${firstPartOfPath(root)}`,
      format,
      sourcemap: true,
    })),
    external: isExternalModule,
    plugins,
  };
}

module.exports = roots.map(makeConfig);
