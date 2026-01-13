const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/main.tsx",
    code: "./public/code.js",
  },
  devtool: "source-map",
  experiments: {
    outputModule: true,
    topLevelAwait: true,
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    module: true,
    clean: true,
    environment: {
        module: true,
    }
  },
  externalsType: "module",
  externalsPresets: { web: true },
  externals: {
    "add-on-sdk-document-sandbox": "add-on-sdk-document-sandbox",
    "express-document-sdk": "express-document-sdk",
    "add-on-ui-sdk": "https://new.express.adobe.com/static/add-on-sdk/sdk.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
      scriptLoading: "module",
      excludeChunks: ["code"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/manifest.json", to: "manifest.json" }
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      // --- FIX STARTS HERE ---
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("tailwindcss"), // Force Tailwind
                  require("autoprefixer"), // Force Autoprefixer
                ],
              },
            },
          },
        ],
      },
      // --- FIX ENDS HERE ---
      {
        test: /\.svg$/,
        type: 'asset/resource'
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".css"],
  },
};