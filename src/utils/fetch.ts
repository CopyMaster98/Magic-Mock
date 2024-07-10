import qs from "qs";
import { message } from "antd";
import { useData } from "../context";
const { stringify, parse } = qs;

const checkStatus = async (res: Response, callback?: any) => {
  // callback && callback(false)
  const cloneRes = await res.clone().json();
  const isAllowNotification = res.headers.has("notification");
  if (200 >= res.status && res.status < 300) {
    if (isAllowNotification) {
      if (cloneRes?.statusCode === 0) message.success(cloneRes?.message);
      else message.error(cloneRes?.message);
    }

    return res;
  }

  const tip = cloneRes.message ?? "网络请求失败";
  message.error(`${tip} ${res.status}`);

  const error: any = new Error(res.statusText);
  error["response"] = error;

  throw error;
};

/**
 *  捕获成功登录过期状态码等
 * @param res
 * @returns {*}
 */
const judgeOkState = async (res: Response) => {
  const cloneRes = await res.clone().json();

  //TODO:可以在这里管控全局请求
  if (!!cloneRes.code && cloneRes.code !== 200) {
    message.error(`11${cloneRes.msg}${cloneRes.code}`);
  }
  return res;
};

/**
 * 捕获失败
 * @param error
 */
const handleError = (error: any) => {
  if (error instanceof TypeError) {
    message.error(`网络请求失败啦！${error}`);
  }
  return {
    //防止页面崩溃，因为每个接口都有判断res.code以及data
    code: -1,
    data: false,
  };
};

class http {
  /**
   *静态的fetch请求通用方法
   * @param url
   * @param options
   * @returns {Promise<unknown>}
   */
  static async staticFetch(
    url = "",
    options: RequestInit = {},
    callback?: any
  ) {
    const prefix = "http://localhost:9000";
    // let defaultOptions: RequestInit = {
    //   /*允许携带cookies*/
    //   credentials: 'include',
    //   /*允许跨域**/
    //   mode: 'cors',
    //   headers: {
    //     token: '',
    //     Authorization: '',
    //     // 当请求方法是POST，如果不指定content-type是其他类型的话，默认为如下，要求参数传递样式为 key1=value1&key2=value2，但实际场景以json为多
    //     // 'content-type': 'application/x-www-form-urlencoded',
    //   },
    // };
    let defaultOptions: any = {
      headers: {},
    };
    if (options.method === "POST" || "PUT") {
      defaultOptions.headers["Content-Type"] =
        "application/json; charset=utf-8";
    }
    const newOptions: RequestInit = { ...defaultOptions, ...options };

    callback && callback(true);

    return fetch(prefix + url, newOptions)
      .then(checkStatus)
      .then(judgeOkState)
      .then((res) => res.json())
      .catch(handleError)
      .finally(() => callback && callback(false));
  }

  /**
   *post请求方式
   * @param url
   * @returns {Promise<unknown>}
   */
  post(url: string, params = {}, option: any = {}) {
    const options = Object.assign({ method: "POST" }, option);
    //一般我们常用场景用的是json，所以需要在headers加Content-Type类型
    options.body = JSON.stringify(params);

    //可以是上传键值对形式，也可以是文件，使用append创造键值对数据
    if (options.type === "FormData" && options.body !== "undefined") {
      let params = new FormData();
      for (let key of Object.keys(options.body)) {
        params.append(key, options.body[key]);
      }
      options.body = params;
    }

    return http.staticFetch(url, options); //类的静态方法只能通过类本身调用
  }

  /**
   * put方法
   * @param url
   * @returns {Promise<unknown>}
   */
  put(url: string, params = {}, option: any = {}) {
    const options = Object.assign({ method: "PUT" }, option);
    options.body = JSON.stringify(params);
    return http.staticFetch(url, options); //类的静态方法只能通过类本身调用
  }

  /**
   * delete方法
   * @param url
   * @returns {Promise<unknown>}
   */
  _delete(url: string, option: any = {}) {
    const options = Object.assign({ method: "DELETE" }, option);
    return http.staticFetch(url, options);
  }

  /**
   * get请求方式
   * @param url
   * @param option
   */
  get(url: string, option = {}, callback?: any) {
    const options = Object.assign({ method: "GET" }, option);
    return http.staticFetch(url, options, callback);
  }
}

const requestFn = new http();
export const { post, get, put, _delete } = requestFn;
export { requestFn };
