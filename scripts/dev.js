

const execa = require('execa')
const { fuzzyMatchTarget } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'jeact'
const sourceMap = args.sourcemap || args.s || true
const formats = args.format || args.f

execa(
  'rollup',
  [
    '-wc',
    '--environment',
    [
      `TARGET:${target}`,
      `FORMATS:${formats || 'iife'}`,
      sourceMap ? `SOURCE_MAP:true` : ``
    ]
    .filter(Boolean)
    .join(',')
  ],
  {
    stdio: 'inherit'
  }
)
