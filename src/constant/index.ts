import * as header from "./header";

const methods = [
  "ALL",
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const;

const status = ["Start", "Stop"];

const resourceType = [
  "All",
  "Document",
  "Stylesheet",
  "Image",
  "Media",
  "Font",
  "Script",
  "XHR",
  "Fetch",
  "Ping",
  "CSPViolationReport",
  "Other",
] as const;

const methodOptions = methods.map((item) => ({
  label: item,
  value: item,
}));

const resourceTypeOptions = resourceType.map((item) => ({
  label: item,
  value: item,
}));

const statusOptions = status.map((item) => ({
  label: item,
  value: item,
}));

const color = [
  "magenta",
  "purple",
  "burlywood",
  "bisque",
  "hotpink",
  "cadetblue",
  "pink",
  "saddlebrown",
  "darkslategray",
  "darkseagreen",
  "darkred",
  "firebrick",
  "dodgerblue",
  "darkturquoise",
  "darkslategray",
  "darkseagreen",
  "darkred",
  "lightseagreen",
  "lightsalmon",
];

const methodColors = methodOptions.map((item, index) => ({
  name: item.label,
  color: color[index],
}));

const resourceTypeColors = resourceTypeOptions.map((item, index) => ({
  name: item.label,
  color: color[index],
}));

export {
  header,
  methodOptions,
  methodColors,
  methods,
  resourceTypeOptions,
  statusOptions,
  resourceTypeColors,
};
