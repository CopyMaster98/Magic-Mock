#  Magic Mock

### 安装命令 

**`npm install`**

如果运行 **`npm install`** 失败 请运行 **`npm run install`**

### 运行命令
> **Frontend**: **`npm run frontend`**
**Backend**: **`npm run backend`**

### 如何使用？

##### 初始化：输入项目名称与启动地址创建项目
   + **自动缓存状态码`2xx`与`3xx`的请求为`Cache`**
   + **创建单个自定义匹配规则 `Rule` （右键卡片有删除按钮）** 
   包含 **`Rule Name`** 、**`Rule Pattern`** 、**`Resource Type`** 、 **`Rule Method`** 、**`Request Payload`** 、**`Request Header`** 、 **`Response StatusCode`** 、**`Response Data`**。
   <br />

     > Rule Pattern
     
     完全匹配：需要请求url与`Rule Pattern`完全一致
     模糊匹配：使用`*`代替任意字符（例如：`*.abc` / `abc.*` / `*abc*`）
     匹配优先级根据匹配到的字符长度决定 匹配的长度越长优先级越高
     tip: `Mock` 的优先级永远大于 `Cache`
      <br />
     > Request Payload

     需要与请求的`Request Payload` 键值完全匹配
      <br />
      > Request Header

      键值模式：自动添加或者递归替换所有同名键值
      JSON模式：完全替换`Request Header`
      <br />
      > Response Data

      键值模式：自动添加或者递归替换所有同名键值
      JSON模式：完全替换`Request Header`
      <br />

+ **创建多个自定义匹配规则**
  点击 `Multiple Select` 进入多选模式 多选模式下右键卡片有全选按钮。 `Cache` 功能区额外有个 `Multiple Create & Save` 按钮 可以一键修改 `Rule Pattern Prefix` 同时允许双击单个 `Rule Pattern` 单独进行修改。
  


