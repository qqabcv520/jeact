const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin') // 删除插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

if (!process.env.PACKAGE_NAME) {
    throw new Error('TARGET package must be specified via --environment flag.')
}

const packageDir = path.resolve(__dirname, 'packages', process.env.PACKAGE_NAME)
const name = path.basename(packageDir)
const target = process.env.TARGET
const sourceMap = process.env.SOURCE_MAP
const type = process.env.TYPE
const babelLoader = {
    loader: 'babel-loader',
    options: {
        cacheDirectory: true,
    }
};

const cssLoader = [
    MiniCssExtractPlugin.loader,
    {loader: 'css-loader', options: {sourceMap: true}},
    {
        loader: 'postcss-loader',
        options: {
            sourceMap: true,
            plugins: [
                require('autoprefixer')(),
                require('cssnano')(),
            ],
        }
    }
];

module.exports = {
    //入口文件配置
    entry: {
        [name]: path.resolve(packageDir, "src/index.ts")
    },
    //文件导出的配置
    output: {
        path: path.resolve(packageDir, "dist"),
        filename: `[name].${target}.js`,
        libraryTarget: target,
    },
    ...(sourceMap ? {devtool: 'source-map'} : {}),
    //模块配置
    module: {
        rules: [
            {
                test: /\.css$/,
                use: cssLoader
            },
            {
                test: /\.less$/,
                use: [
                    ...cssLoader,
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                strictMath: true,
                            },
                        },
                    }
                ]
            },
            //
            // {
            //     test: /\.(ts|tsx|js)$/,
            //     exclude: /node_modules/,
            //     use: "ts-loader"
            // }
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    babelLoader,
                    {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                ...(!!type ?
                                    {
                                        declaration: true,
                                    } : {}
                                )

                            }
                        }
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    babelLoader
                ]
            }
        ]
    },
    resolve: {
        //默认后缀
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    // // 不打包的文件
    externals: {
        jquery: '$',
    },
    //插件配置
    plugins: [
        // new CleanWebpackPlugin({
        //     verbose: true,
        //     dry: false
        // }),
        new MiniCssExtractPlugin({
            filename: `[name].${target}.css`,
        }),
    ],
}

