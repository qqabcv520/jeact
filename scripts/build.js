const execa = require('execa')
const fs = require('fs-extra');
const path = require('path')
const { fuzzyMatchTarget, packagesName: allTargets } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const packagesName = args._
const packageName = args._.length ? fuzzyMatchTarget(args._)[0] : 'jq-mvvm'
const target = args.target || args.t
const buildAllMatching = args.all || args.a
const sourceMap = args.sourcemap || args.s
const type = args.type
const {
  Extractor,
  ExtractorConfig,
  ExtractorResult
} = require('@microsoft/api-extractor');



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

  // TODO build types

  if (type) {
    const pkgDir = path.resolve(`packages/${packageName}`)
    const pkg = require(`${pkgDir}/package.json`)
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(path.resolve(pkgDir, `api-extractor.json`))
    const extractorResult = Extractor.invoke(extractorConfig, {
      localBuild: true,
      showVerboseMessages: true
    })

    if (extractorResult.succeeded) {
      // concat additional d.ts to rolled-up dts
      const typesDir = path.resolve(pkgDir, 'types')
      if (await fs.exists(typesDir)) {
        const dtsPath = path.resolve(pkgDir, pkg.types)
        const existing = await fs.readFile(dtsPath, 'utf-8')
        const typeFiles = await fs.readdir(typesDir)
        const toAdd = await Promise.all(
          typeFiles.map(file => {
            return fs.readFile(path.resolve(typesDir, file), 'utf-8')
          })
        )
        await fs.writeFile(dtsPath, existing + '\n' + toAdd.join('\n'))
      }
      console.log(`API Extractor completed successfully.`)
    } else {
      console.error(
        `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
      )
      process.exitCode = 1
    }

    await fs.remove(`${pkgDir}/dist/packages`)
  }
}
