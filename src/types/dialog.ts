import { ReactNode } from "react";

export type IDialogInfo<T = any> = {
  title?: string;
  content?: ReactNode;
  footer?: ReactNode;
  count?: number;
  ref?: React.MutableRefObject<T>;
  handleUpdateForm?: (arg?: any) => any;
  handleConfirm?: (arg?: any) => any;
  handleClose?: (args?: any) => any;
};
export type IFormRefProps = {
  onValidate: (arg?: any) => any;
  onReset: (arg?: any) => any;
  [key: string]: any;
};
