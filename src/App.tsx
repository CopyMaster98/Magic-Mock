import React, { ReactNode, useCallback, useState } from 'react';
import './App.css';
import Home from './views/home';
import Detail from './views/detail';
import Dialog from './components/dialog';
import { ProviderContext } from './context/index'
import { DialogType } from './types/index'

function App() {
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogConfig, setDialogInfo] = useState<DialogType.IDialogInfo>()
  const handleDialog = useCallback((flag: boolean) => {
    setOpenDialog(flag)
  }, [])
  
  return (
    <ProviderContext.Provider value={{
      theme: 'light',
      openDialog: () => handleDialog(true),
      closeDialog: () => handleDialog(false),
      updateDialogInfo: (data: DialogType.IDialogInfo) => setDialogInfo(data)
    }}>
        <div className="App">
          <Home />
          <Dialog open={openDialog} handleClose={() => handleDialog(false)} dialogConfig={dialogConfig}/>
        </div>
    </ProviderContext.Provider>
  );
}

export default App;
