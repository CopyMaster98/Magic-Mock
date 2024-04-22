import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import Home from './views/home';
import Dialog from './components/dialog';
import { ProviderContext } from './context/index'
import { DialogType } from './types/index'
import { Spin } from 'antd';

function App() {
  const [openDialog, setOpenDialog] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [dialogConfig, setDialogInfo] = useState<DialogType.IDialogInfo>()
  const [spinning, setSpinning] = useState(false)
  const handleDialog = useCallback((flag: boolean) => {
    setOpenDialog(flag)
  }, [])

  const updateSpinning = useCallback((spinning: boolean) => {
    return setSpinning(spinning)
  }, []) 
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9090');

    ws.onopen = function() {
      console.log('Connected to server');
      ws.send('pageOpened');
    };

    ws.onmessage = function(event) {
      console.log('Received message from server:', event.data);
    };

    return () => {
      ws.close();
    };
  }, []);
  return (
    <ProviderContext.Provider value={{
      theme: 'light',
      refresh,
      setRefresh: () => setRefresh(oldValue => oldValue + 1),
      setSpinning: updateSpinning,
      openDialog: () => handleDialog(true),
      closeDialog: () => handleDialog(false),
      updateDialogInfo: (data: DialogType.IDialogInfo) => setDialogInfo(data)
    }}>
        <div className="App">
          <Home />
          <Dialog open={openDialog} handleClose={() => handleDialog(false)} dialogConfig={dialogConfig}/>
          <Spin spinning={spinning} fullscreen />
        </div>
    </ProviderContext.Provider>
  );
}

export default App;
