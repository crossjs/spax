import { run, TPlugin } from "@spax/core";
import { debug, fatal, warn } from "@spax/debug";
import isPlainObject from "lodash/isPlainObject";
import mergeWith from "lodash/mergeWith";
import * as ReactDOM from "react-dom";
import { IOptions } from "./types";

export * from "./types";

export default abstract class Framework {
  // 插件
  public static plugins: TPlugin[] = [];
  // 选项
  public static options: IOptions = {
    scope: "🚀",
    version: "1.0.0",
    // 插件选项
    plugins: {},
    // 业务模块
    blocks: [],
    container: "#root",
  };

  private plugins: TPlugin[] = [];
  private options: IOptions = {};

  constructor(options: IOptions = {}) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
      debug(`
   _____ ____  ___   _  __
  / ___// __ \\/   | | |/ /
  \\__ \\/ /_/ / /| | |   /
 ___/ / ____/ ___ |/   |
/____/_/   /_/  |_/_/|_|`);
    }

    /* istanbul ignore next */
    if (process.env.NODE_ENV === "development") {
      warn("Looks like we are in development mode!");
    }

    this.initialize(options);
  }

  public async render(): Promise<React.DOMElement<any, any>> {
    const { plugins, options } = this;

    // 解析
    const rendered = await run(plugins, options);

    // 转字符串，避免出错
    return Array.isArray(rendered) ? JSON.stringify(rendered) : rendered;
  }

  public async mount(callback?: () => void) {
    try {
      const { options } = this;

      // 挂载点
      const mountingElement: HTMLElement = typeof options.container === "string"
        ? document.querySelector(options.container) : options.container;

      if (!mountingElement) {
        throw Error(`${options.container} is not a valid HTMLElement`);
      }

      // 解析
      const rendered = await this.render();

      // 挂载
      ReactDOM.render(rendered, mountingElement, () => {
        /* istanbul ignore next */
        if (process.env.NODE_ENV === "development") {
          debug("Mounted to container: %O", options.container);
        }
        if (callback) {
          callback();
        }
      });
    } catch (e) {
      fatal(e);
    }
  }

  /**
   * 通过原型链实现递归合并
   */
  private initialize(ctorOptions: IOptions): void {
    let ctr: any = this.constructor;
    // 静态属性 plugins
    const plugins = [ctr.plugins];
    // 静态属性 options
    const options = [ctr.options];
    // 自动继承父类的 静态属性 plugins
    // 自动继承父类的 静态属性 options
    // tslint:disable-next-line
    while (ctr && (ctr = Object.getPrototypeOf(ctr))) {
      if (ctr.plugins) {
        // 父类的插件在前
        plugins.unshift(ctr.plugins);
      }
      if (ctr.options) {
        // 父类的选项在前
        options.unshift(ctr.options);
      }
    }
    // 拍平
    this.plugins = plugins.flat();
    // 合并
    this.options = merge(...options, ctorOptions);

    /* istanbul ignore next */
    if (process.env.NODE_ENV === "development") {
      debug("Initialize Framework with options: %O, plugins: %O", this.options, this.plugins);
    }
  }
}

/**
 * 对象：深拷贝
 * 数组：合并
 */
function merge(...args: any[]) {
  return mergeWith({}, ...args, (obj: any, src: any) => {
    // 合并数组
    if (Array.isArray(src)) {
      if (Array.isArray(obj)) {
        return obj.concat(src);
      }
    }
    // 合并对象
    if (isPlainObject(src)) {
      if (isPlainObject(obj)) {
        return merge(obj, src);
      }
    }
    // 其它，直接覆盖
    return src;
  });
}
