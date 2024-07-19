import * as header from "./header";

const methods = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const;

const methodOptions = methods.map((item) => ({
  label: item,
  value: item,
}));

const color = ["magenta", "purple", "cyan", "gold", "geekblue"];

const methodColors = methodOptions.map((item, index) => ({
  name: item.label,
  color: color[index],
}));

export { header, methodOptions, methodColors, methods };
