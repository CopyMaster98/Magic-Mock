import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import Home from "./views/home";
import Dialog from "./components/dialog";
import { ProviderContext } from "./context/index";
import { DialogType } from "./types/index";
import { Spin } from "antd";
import { websocket } from "./hooks";

function App() {
  const [openDialog, setOpenDialog] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [dialogConfig, setDialogInfo] = useState<DialogType.IDialogInfo>();
  const [spinning, setSpinning] = useState(false);
  const handleDialog = useCallback((flag: boolean) => {
    setOpenDialog(flag);
  }, []);

  const updateSpinning = useCallback((spinning: boolean) => {
    return setSpinning(spinning);
  }, []);

  const handleUpdateProjectInfo = useCallback(() => {
    return setRefresh((oldValue) => oldValue + 1);
  }, []);

  websocket.useCreateWebSocket(handleUpdateProjectInfo);

  return (
    <ProviderContext.Provider
      value={{
        theme: "light",
        refresh,
        setRefresh: () => setRefresh((oldValue) => oldValue + 1),
        setSpinning: updateSpinning,
        openDialog: () => handleDialog(true),
        closeDialog: () => handleDialog(false),
        updateDialogInfo: (data: DialogType.IDialogInfo) => setDialogInfo(data),
      }}
    >
      <div className="App">
        <Home />
        <Dialog
          open={openDialog}
          handleClose={() => handleDialog(false)}
          dialogConfig={dialogConfig}
        />
        <Spin spinning={spinning} fullscreen />
      </div>
    </ProviderContext.Provider>
  );
}

export default App;
