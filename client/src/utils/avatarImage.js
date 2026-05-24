const MAX_BYTES = 2 * 1024 * 1024;
const MAX_EDGE = 512;

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export const readAvatarFromFile = file =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF).'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('Ảnh tối đa 2MB. Hãy chọn file nhỏ hơn.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Không đọc được ảnh.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Ảnh không hợp lệ.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });
