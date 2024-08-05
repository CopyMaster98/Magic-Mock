#  Magic Mock

### Install Command 

**`npm install`**

If use **`npm install`** fails, use **`npm run install`**.

### Run Command
> **Frontend**: **`npm run frontend`**
**Backend**: **`npm run backend`**

### How to use it?

##### Init: Enter the project name and start address to create the project
   1. **Automatically cache requests with status codes `2xx` and `3xx` as `Cache`**

   2. **Create a single custom matching rule `Rule` (right-click the card to delete the button)** 
  **`Rule Name`** 、**`Rule Pattern`** 、**`Resource Type`** 、 **`Rule Method`** 、**`Request Payload`** 、**`Request Header`** 、 **`Response StatusCode`** 、**`Response Data`**。

  > Rule Pattern

  + **Exact match**: The requested URL must be exactly the same as the `Rule Pattern`.

  + **Fuzzy matching**: Use `*` to replace any character (eg: `*.abc` / `abc.*` / `*abc*`)
    The matching priority is determined by the length of the matched characters. The longer the matching length, the higher the priority.
    **tip: `Mock` rules take precedence over `Cache` rules**.

  > Request Payload

  + Need to exactly match the `Request Payload` key value of the request.

  > Request Header

    + **Key-value mode**: automatically add or recursively replace all keys and their values ​​with the same name.
    + **JSON mode**: Complete replacement for `Request Header`.

  > Response Data

    + **Key-value mode**: automatically add or recursively replace all keys and their values ​​with the same name.
    + **JSON mode**: Complete replacement for `Response Data`.

   3. **Creating multiple custom matching rules**

  Click `Multi-select` to enter the multi-select mode. In multi-select mode, right-clicking a card will display the Select All button. There is an additional `Multi-select Create and Save` button in the `Cache` ribbon. You can modify the `Rule Pattern Prefix` with one click, or double-click a single `Rule Pattern` to modify it separately.
