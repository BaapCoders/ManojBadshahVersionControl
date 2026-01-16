const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const fs = require("fs");

// Load environment variables from .env file
function loadEnvVariables() {
  const envPath = path.resolve(__dirname, ".env");
  const envVars = {
    API_URL: "http://localhost:1",
    PYTHON_SERVER_URL: "http://127.0.0.1:1",
    VERSION: "1.0.0",
    DEBUG: "true"
  };

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const cleanKey = key.replace("REACT_APP_", "");
          const value = valueParts.join("=").trim();
          envVars[cleanKey] = value;
        }
      }
    });
  }

  return envVars;
}

const envVars = loadEnvVariables();

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
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify({
        API_URL: envVars.API_URL,
        PYTHON_SERVER_URL: envVars.PYTHON_SERVER_URL,
        VERSION: envVars.VERSION,
        DEBUG: envVars.DEBUG === "true"
      })
    }),
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