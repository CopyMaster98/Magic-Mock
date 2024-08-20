import * as DialogType from "./dialog";
import * as CacheType from "./cache";
import { methods } from "../constant";

export type IMethod = (typeof methods)[number];

export { DialogType, CacheType };
