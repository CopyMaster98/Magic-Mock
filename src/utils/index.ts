export const createFolderSync = async (folderPath: string) => {
  try {
    // 请求用户选择一个目录
    const dirHandle = await (StorageManager as any).getDirectory();

    console.log(dirHandle)

    // 使用 getDirectoryHandle 方法获取一个目录句柄
    const currentDirHandle = await dirHandle.getDirectoryHandle(folderPath, { create: true });

    // 在目录句柄上调用 getDirectoryHandle 方法创建新的文件夹
    const newFolderHandle = await currentDirHandle.getDirectoryHandle(folderPath, { create: true });

    console.log(`Folder '${newFolderHandle}' created successfully.`);
  } catch (error) {
    console.error('Error creating folder:', error);
  }
}