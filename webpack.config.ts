import { config as initDotEnv } from 'dotenv';

import {
  Configuration as WebpackConfig,
  HotModuleReplacementPlugin,
  Plugin as WebpackPlugin,
  RuleSetUseItem,

} from 'webpack';

import path from 'path';

/**
 * Webpack Plugins
 */
import autoprefixerPlugin, { Options as AutoprefixerOptions } from 'autoprefixer';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import glob from 'glob-promise';
import { PageConfig } from './src/common/page-config';


initDotEnv();

const isProduction = ('production' === process.env.NODE_ENV);
const isDebug = !!process.env.DEBUG_BUILD;
const isDevServer = process.env.WEBPACK_DEV_SERVER;

const DEV_SERVER_PORT = (process.env.PORT ?
  parseInt(process.env.PORT, 10) :
  undefined
);

const USE_HMR = (process.env.USE_HMR ?
  JSON.parse(process.env.USE_HMR) :
  true
);

const projectPath = __dirname;
const srcPath = `${projectPath}/src`;
const nodeModulesPath = `${projectPath}/node_modules`;
const tsConfigPath = `${projectPath}/tsconfig.app.json`;
const destinationPath = `${projectPath}/dist`;

// Feel free to update this to your needs
const browserslistTargets = [
  'defaults',
];


export default async function getConfig() {

  //=============//
  // MAIN CONFIG //
  //=============//

  const webpackConfig: WebpackConfig = {

    mode: (isProduction ? 'production' : 'development'),

    // This must be left as an array, so we can modify it later on
    entry: {
      index: `${projectPath}/src/index.ts`,
    },

    output: {
      path: destinationPath,
      filename: '[name].[hash].js',
    },
    devtool: (isProduction ? 'source-map' : 'inline-source-map'),
    module: {
      rules: [],
    },
    resolve: {
      extensions: [
        '.js',
        '.json',
        '.ts',
        '.tsx',
      ],
      alias: {},
    },
    plugins: <WebpackPlugin[]> filterTruthy([

      new CleanWebpackPlugin(),

      new CopyWebpackPlugin(['**'], {
        context: `${projectPath}/static`,
      }),

      // Type checking
      new ForkTsCheckerWebpackPlugin({
        tsconfig: tsConfigPath,
      }),

    ]),

    devServer: {
      host: 'localhost',
      port: DEV_SERVER_PORT,
      allowedHosts: [
        'localhost',
      ],
      contentBase: srcPath,
      watchContentBase: true,
      stats: 'minimal',
      inline: true,

      // @ts-ignore: this is missing from declarations
      progress: true,

    },

  };


  //================//
  // BABEL SETTINGS //
  //================//

  const babelLoaderConfig: RuleSetUseItem = {
    loader: 'babel-loader',
    options: {
      presets: [
        ['@babel/preset-env', {
          targets: browserslistTargets,
          useBuiltIns: 'entry',
          corejs: 3,
        }],
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        ['@babel/plugin-transform-runtime', {
          helpers: true,
          regenerator: false,
          corejs: false,
        }],
      ],
    },
  };


  //=============//
  // HMR SUPPORT //
  //=============//

  if (isDevServer && USE_HMR) {

    console.log(`\n☕ Using HMR\n`);

    // Configuring HMR manually for best flexibility,
    // no need to pass flags through CLI.

    webpackConfig!.devServer!.hot = true;

    webpackConfig!.plugins!.push(
      new HotModuleReplacementPlugin()
    );

  }


  //================//
  // TWIG TEMPLATES //
  //================//

  webpackConfig.module!.rules.push({
    test: /\.twig$/,
    include: [
      `${projectPath}/src`,
    ],
    use: [
      {
        loader: 'twig-loader',
        options: {},
      },
    ],
  });


  //==================//
  // TYPESCRIPT FILES //
  //==================//

  webpackConfig.module!.rules.push({
    test: /\.tsx?$/,
    include: [
      `${projectPath}/src`,
    ],
    use: [
      babelLoaderConfig,
    ],
  });


  //============//
  // SASS FILES //
  //============//

  webpackConfig.module!.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: 'style-loader',
        options: {},
      },
      {
        loader: 'css-loader',
        options: {},
      },
      {
        loader: 'postcss-loader',
        options: {
          plugins: [
            autoprefixerPlugin(<AutoprefixerOptions> {
              overrideBrowserslist: browserslistTargets,
            }),
          ],
        },
      },
      {
        loader: 'sass-loader',
        options: {},
      },
    ],
  });


  //===========//
  // CSS FILES //
  //===========//

  webpackConfig.module!.rules.push(...[
    {
      test: /\.css$/,
      include: [
        nodeModulesPath,
      ],
      use: [
        {
          loader: 'style-loader',
          options: {},
        },
        {
          loader: 'css-loader',
          options: {},
        },
      ],
    },
  ]);

  await loadPages();

  return webpackConfig;


  /**
   * Adds an alias to the Webpack configuration
   */
  function addPackageAlias(origName: string, replaceName: string) {

    if (!webpackConfig.resolve) {
      webpackConfig.resolve = {};
    }

    if (!webpackConfig.resolve.alias) {
      webpackConfig.resolve.alias = {};
    }

    webpackConfig.resolve.alias[origName] = require.resolve(replaceName);

  }

  async function loadPages() {

    const paths = await glob('**/*.page.ts');

    for (const pageConfigPath of paths) {

      const importedModule = await import(
        `${__dirname}/${pageConfigPath}`
      );

      const pageConfig: PageConfig = importedModule.default;

      webpackConfig.plugins!.push(
        new HtmlWebpackPlugin({
          template: pageConfig.templatePath,
          filename: pageConfig.filename,
          minify: (isProduction ? {} : false),
          templateParameters: {
            title: pageConfig.title,
          },
          chunks: pageConfig.chunks,
        }),
      );

    }

  }

}


function filterTruthy<Type>(list: Type[]): Type[] {
  return list.filter(Boolean);
}
