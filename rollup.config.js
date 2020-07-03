import path from 'path'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import { terser } from "rollup-plugin-terser";
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import commonjs from '@rollup/plugin-commonjs'
// import { nodeResolve } from '@rollup/plugin-node-resolve'

if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const name = path.basename(packageDir)
const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve(`package.json`))

// 对多个formats，只执行一次检查
let hasTSChecked = false

const defaultFormats = ['es', 'umd']
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
const packageFormats = inlineFormats || defaultFormats

const enableProd = process.env.NODE_ENV === 'production'
const enableSourceMap = !!process.env.SOURCE_MAP
const enableType = !!process.env.TYPES


export default packageFormats.map(format => createConfig(format))

function createConfig(format) {

  const output = {
    file: resolve(`dist/${name}.${format}.js`),
    sourcemap: enableSourceMap,
    externalLiveBindings: false,
    format,
    name,
  }

  const isBrowser = ['umd', 'iife', 'amd', 'system'].includes(format)

  const shouldEmitDeclarations = enableType && !hasTSChecked

  hasTSChecked = true

  const external = [...Object.keys(pkg.peerDependencies || {})]
  if (!isBrowser) {
    external.push(...Object.keys(pkg.dependencies || {}))
  }

  const plugins = [
    json({
      namedExports: false
    }),
    typescript({
      check: enableProd && !hasTSChecked,
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: enableSourceMap,
          declaration: shouldEmitDeclarations,
        },
        include: [
          `./packages/${name}/src/**/*`
        ]
      },
      useTsconfigDeclarationDir: true,
    }),
    postcss({
      plugins: [autoprefixer],
      extract: true,
      sourceMap: enableSourceMap,
      minimize: enableProd
    }),
    commonjs({
      sourceMap: false
    }),
    // nodeResolve({
    //   preferBuiltins: true
    // }),
  ];
  if (enableProd) {
    plugins.push(
      terser({
        module: format === 'es',
        compress: {
          ecma: 2015,
          pure_getters: true
        }
      })
    );
  }

  return {
    input: resolve('index.ts'),
    external,
    plugins,
    output,
  }
}
