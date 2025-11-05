import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config } from "./project.config.js";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/app.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
  },
  module: {
    rules: [
      /** TypeScript + Babel **/
      {
        test: /\.ts$/,
        use: ["babel-loader", "ts-loader"],
        exclude: /node_modules/,
      },
      /** CSS **/
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      /** EJS **/
      {
        test: /\.ejs$/,
        use: ["html-loader", "template-ejs-loader"],
      },
      /** Изображения **/
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      path: false,
      fs: require.resolve("browserify-fs"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      process: require.resolve("process/browser"),
    },
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "public"),
      },
      // {
      //   directory: path.join(__dirname),
      //   publicPath: "/",
      // },
    ],
    port: config.DEV_SERVER_PORT,
    historyApiFallback: true,
    hot: true,
    allowedHosts: "all",
  },
  mode: "development",
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new HtmlWebpackPlugin({
      template: "index.html",
      filename: "index.html",
    }),
    // new CopyWebpackPlugin({
    //   patterns: [{ from: "sw.js", to: "sw.js" }],
    // }),
  ],
};
