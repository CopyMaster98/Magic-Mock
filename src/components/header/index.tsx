
import { Layout, Menu, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { createFolderSync } from '../../utils'
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, } from 'react'
import { ProviderContext } from '../../context'
import AddProjectForm from '../add-project-form'
import { IDialogInfo } from '../../types/dialog'
const { Header: LayoutHeader,  } = Layout
const Header: React.FC<{
  items: any[]
}> = (props) => {
  type IFormRefProps = {
    onValidate: (arg?: any) => any,
    onReset: (arg?: any) => any
  }
  const { items } = props
  const { openDialog, updateDialogInfo, closeDialog } = useContext(ProviderContext)
  const formRef = useRef<IFormRefProps>()
  const handleOpenDialog = useCallback(() => {
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: 'Add Project',
      content: <AddProjectForm ref={formRef} />,
      ref: formRef, 
      handleConfirm: () => {
        info.ref?.current?.onValidate().then((formValue: {
          projectName: string,
          projectUrl: string
        }) => {
          console.log(formValue)
          createFolderSync(formValue.projectName)
          info.ref?.current?.onReset()
          closeDialog?.()
      }).catch((err: any) => console.log(err))
      },
      handleClose: () => {
        info.ref?.current?.onReset()
      }
    }
    updateDialogInfo?.(info)
    openDialog?.()
  }, [closeDialog, openDialog, updateDialogInfo])

  return <>
    <LayoutHeader style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          items={items}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Button type="primary" onClick={handleOpenDialog} icon={<PlusOutlined />}>
            Add Project
        </Button>
      </LayoutHeader>
  </>
}

export default Header
