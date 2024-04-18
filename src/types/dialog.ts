import { ReactNode } from "react"

export type IDialogInfo<T = any> = {
  title?: string,
  content?: ReactNode,
  ref?: React.MutableRefObject<T>
  handleConfirm?: (arg?: any) => any
  handleClose?: (args?: any) => any
}