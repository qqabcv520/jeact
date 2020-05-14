var path = require('path')
var {CleanWebpackPlugin} = require('clean-webpack-plugin') // 删除插件
var MiniCssExtractPlugin = require('mini-css-extract-plugin')


var babelLoader = {
    loader: 'babel-loader',
    options: {
        cacheDirectory: true,
    }
};

module.exports = {
    //入口文件配置
    entry: {
        app: './src/index.ts'
    },
    //文件导出的配置
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
        libraryTarget: 'var',
    },
    devtool: 'source-map',
    //模块配置
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
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
                ]
            },
            {
                test: /\.less$/,
                use: [
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
                    },
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
                        loader: 'ts-loader'
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
    // 不打包的文件
    externals: {
        jquery: '$',
    },
    //插件配置
    plugins: [
        new CleanWebpackPlugin({
            verbose: true,
            dry: false
        }),
        new MiniCssExtractPlugin({
            filename: 'bundle.css'
        }),
    ],
}

