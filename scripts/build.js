const execa = require('execa')
const fs = require('fs-extra');
const path = require('path')
const { fuzzyMatchTarget, packagesName: allTargets } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const packagesName = args._
const target = args.target || args.t
const buildAllMatching = args.all || args.a
const sourceMap = args.sourcemap || args.s
const type = args.type



if (!packagesName.length) {
  buildAll(allTargets)
} else {
  buildAll(fuzzyMatchTarget(packagesName, buildAllMatching))
}


async function buildAll(names) {
  for (const packageName of names) {
    await build(packageName)
  }
}


async function build(packageName) {
  execa(
    'cross-env',
    [
      `PACKAGE_NAME=${packageName}`,
      `TARGET=${target || 'umd'}`,
      ...(sourceMap ? [`SOURCE_MAP=true`] : []),
      ...(type ? [`TYPE=true`] : []),
      'webpack',
      '--mode=production'
    ],
    {
      stdio: 'inherit'
    }
  )

}
