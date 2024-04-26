
import { Layout, Menu, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { requestFn } from '../../utils'
import { Link } from 'react-router-dom'
import { useCallback, useMemo, useRef } from 'react'
import { useData } from '../../context'
import { headerItems } from '../../constant/header'
import AddProjectForm from '../add-project-form'
import { IDialogInfo, IFormRefProps } from '../../types/dialog'
import { url } from '../../hooks'
import { FolderAPI } from '../../api'
const { Header: LayoutHeader } = Layout
const Header: React.FC<{
  items: any[]
}> = (props) => {
 
  const { items } = props
  const { openDialog, updateDialogInfo, closeDialog, setRefresh } = useData()
  const pathnames = url.usePathname();
  const defaultKey = useMemo(() => {

  if(!pathnames.length|| !headerItems.find(item => pathnames[0] === item.key))
      return 'home'
  
  return pathnames[0]
  }, [pathnames])
  const formRef = useRef<IFormRefProps>()
  const handleOpenDialog = useCallback(() => {
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: 'Add Project',
      content: <AddProjectForm ref={formRef} />,
      ref: formRef, 
      handleConfirm: () => {
        info.ref?.current?.onValidate().then(async(formValue: {
          projectName: string,
          projectUrl: string
        }) => {
          await FolderAPI.createFolder({
            name: formValue.projectName,
            url: formValue.projectUrl ?? ''
          })
          setRefresh()
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
  }, [closeDialog, openDialog, setRefresh, updateDialogInfo])

  return <>
    <LayoutHeader style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[defaultKey]}
          items={items.map(item => ({
            key: item.key,
            label: <Link to={item.key === 'home' ? '/' : item.key}>{item.label}</Link>
          }))}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Button type="primary" onClick={handleOpenDialog} icon={<PlusOutlined />}>
            Add Project
        </Button>
      </LayoutHeader>
  </>
}

export default Header
