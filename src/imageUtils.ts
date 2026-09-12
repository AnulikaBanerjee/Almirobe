export function resizeImage(file: File | string, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const loadImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = src;
    };

    if (typeof file === 'string') {
      loadImage(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => loadImage(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
