

const execa = require('execa')
const { fuzzyMatchTarget } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const packageName = args._.length ? fuzzyMatchTarget(args._)[0] : 'jq-mvvm'
const target = args.target || args.t
const sourceMap = args.sourcemap || args.s


execa(
  'cross-env',
  [
    `PACKAGE_NAME=${packageName}`,
    `TARGET=${target || 'umd'}`,
    ...(sourceMap ? [`SOURCE_MAP=true`] : []),
    'webpack',
    '--watch',
    '--mode=development'
  ],
  {
    stdio: 'inherit'
  }
)
