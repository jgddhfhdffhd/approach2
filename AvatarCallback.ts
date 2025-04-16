// AvatarCallback.ts

// 🧑 用于头像上传
let avatarCallback: ((uri: string) => void) | null = null;
export const setAvatarCallback = (cb: (uri: string) => void) => {
  avatarCallback = cb;
};
export const getAvatarCallback = () => avatarCallback;

// 💬 用于评论上传
let uploadedImageCallback: ((uri: string) => void) | null = null;
export const setUploadedImageCallback = (cb: (uri: string) => void) => {
  uploadedImageCallback = cb;
};
export const getUploadedImageCallback = () => uploadedImageCallback;
