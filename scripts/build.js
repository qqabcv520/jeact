const execa = require('execa')
const fs = require('fs-extra');
const path = require('path')
const { fuzzyMatchTarget, packagesName: allTargets } = require('./utils')
const args = require('minimist')(process.argv.slice(2))

const targets = args._
const formats = args.formats || args.f
const buildAllMatching = args.all || args.a
const sourceMap = args.sourcemap || args.s
const type = args.type || args.t
const prod = args.prod || args.p



if (!targets.length) {
  buildAll(allTargets)
} else {
  buildAll(fuzzyMatchTarget(targets, buildAllMatching))
}


async function buildAll(names) {
  for (const packageName of names) {
    await build(packageName)
  }
}


async function build(target) {
  execa(
    'rollup',
    [
      '-c',
      '--environment',
      [
        `NODE_ENV:${prod ? 'production' : 'development'}`,
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        type ? `TYPES:true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``
      ]
      .filter(Boolean)
      .join(',')
    ],
    { stdio: 'inherit' }
  )
}
