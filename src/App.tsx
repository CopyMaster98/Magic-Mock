import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import Home from "./views/home";
import Dialog from "./components/dialog";
import { ProviderContext } from "./context/index";
import { DialogType } from "./types/index";
import { Spin } from "antd";
import { websocket } from "./hooks";
import { ModalConfig } from "antd/es/config-provider/context";

function App() {
  const [openDialog, setOpenDialog] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [dialogConfig, setDialogInfo] = useState<DialogType.IDialogInfo>();
  const [modalConfig, setModalConfig] = useState<ModalConfig>();
  const [spinning, setSpinning] = useState(false);
  const handleDialog = useCallback((flag: boolean) => {
    setOpenDialog(flag);
  }, []);

  const updateSpinning = useCallback((spinning: boolean) => {
    return setSpinning(spinning);
  }, []);

  const handleUpdateProjectInfo = useCallback(() => {
    setTimeout(() => setRefresh((oldValue) => oldValue + 1));
  }, []);

  const handleRefresh = useCallback(() => {
    setTimeout(() => setRefresh((oldValue) => oldValue + 1));
  }, []);

  websocket.useCreateWebSocket(handleUpdateProjectInfo);

  return (
    <ProviderContext.Provider
      value={{
        theme: "light",
        refresh,
        setRefresh: handleRefresh,
        setSpinning: updateSpinning,
        openDialog: () => handleDialog(true),
        closeDialog: () => handleDialog(false),
        updateDialogInfo: (data?: DialogType.IDialogInfo) =>
          setDialogInfo(data ?? {}),
        updateModalConfig: (data?: ModalConfig) => setModalConfig(data ?? {}),
      }}
    >
      <div className="App">
        <Home />
        <Dialog
          open={openDialog}
          handleClose={() => handleDialog(false)}
          modalConfig={modalConfig}
          dialogConfig={dialogConfig}
        />
        <Spin spinning={spinning} fullscreen />
      </div>
    </ProviderContext.Provider>
  );
}

export default App;
