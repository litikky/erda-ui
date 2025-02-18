// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

const overwriteMap = {
  avatar: true,
  table: true,
  select: true,
  tag: true,
  'range-picker': true,
  button: true,
  popconfirm: true,
  input: true,
  // tabs: true
};

const overwriteCssMap = {
  avatar: 'antd/es/avatar/style',
  table: 'antd/es/table/style',
  select: 'antd/es/select/style',
  tag: false,
  'range-picker': false,
  button: 'antd/es/button/style',
  popconfirm: 'antd/es/popconfirm/style',
  input: 'antd/es/input/style',
  // tabs: 'antd/es/tabs/style',
};

// TODO: remove this
const specialNameComponents = {
  'c-r-u-d-table': 'common/components/crud-table',
  'i-f': 'common/components/if',
  'time-selector': 'common/components/monitor',
};

module.exports = (api) => {
  let isTest = false;
  if (api) {
    isTest = api.env('test');
  }
  // You can use isTest to determine what presets and plugins to use.
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        [
          'import',
          {
            libraryName: 'common',
            customName(name, file) {
              return specialNameComponents[name] || `common/components/${name}`;
            },
            style: false,
          },
          'common',
        ],
        '@babel/transform-runtime',
        [
          'babel-plugin-tsconfig-paths',
          {
            rootDir: __dirname,
            tsconfig: './tsconfig-jest.json',
          },
        ],
      ],
    };
  } else {
    return {
      sourceType: 'unambiguous', // https://github.com/babel/babel/issues/12731
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'usage', // enable polyfill on demand
            corejs: 3,
          },
        ],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        //  -------------------------- vite used  --------------------------
        'jsx-control-statements',
        [
          'import',
          {
            libraryName: 'common',
            customName(name, file) {
              return specialNameComponents[name] || `common/components/${name}`;
            },
            style: false,
          },
          'common',
        ], //  -------------------------- vite used --------------------------
        [
          'import',
          {
            libraryName: 'lodash',
            libraryDirectory: '',
            camel2DashComponentName: false, // default: true
          },
          'lodash',
        ],
        [
          'import',
          {
            libraryName: 'antd',
            customName(name, file) {
              if (overwriteMap[name]) {
                return `app/antd-overwrite/${name}`;
              }
              return `antd/es/${name}`;
            },
            style(name, file) {
              // name is antd/es/xx
              const match = overwriteCssMap[name.split('/')[2]];
              if (match !== undefined) {
                return match;
              }
              return `${name}/style`;
            },
          },
          'antd',
        ],
        '@babel/transform-runtime', // inject runtime helpers on demand
        [
          'babel-plugin-tsconfig-paths',
          {
            rootDir: __dirname,
            tsconfig: './tsconfig-webpack.json',
          },
        ],
      ],
    };
  }
};
