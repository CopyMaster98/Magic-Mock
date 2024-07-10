import React, { useContext } from "react";
import { DialogType } from "../types";
import { ModalProps } from "antd";

export const ProviderContext = React.createContext<{
  theme?: "dark" | "light";
  openDialog?: () => void;
  closeDialog?: (arg?: (arg?: any) => any) => void;
  updateDialogInfo?: (data?: DialogType.IDialogInfo) => void;
  updateModalConfig?: (data?: ModalProps) => void;
  [key: string]: any;
}>({});

export const useData = () => useContext(ProviderContext);
