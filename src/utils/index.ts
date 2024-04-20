import * as requestFn  from "./fetch";

// export const createFolderSync = async (folderName: string) => {
//   const rootFolderName = 'Magic-Mock-Data'
//   try {
//     // 请求用户选择一个目录
//     const dirHandle = await (window as any).showDirectoryPicker();

//     // 使用 getDirectoryHandle 方法获取一个目录句柄
//     const currentDirHandle = await dirHandle.getDirectoryHandle(rootFolderName, { create: true });

//     // 在目录句柄上调用 getDirectoryHandle 方法创建新的文件夹
//     const newFolderHandle = await currentDirHandle.getDirectoryHandle(folderName, { create: true });

//     console.log(`Folder「 ${newFolderHandle.name} 」created successfully.`);
//   } catch (error) {
//     console.error('Error creating folder:', error);
//   }
// }

export { requestFn };
