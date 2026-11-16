import { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputType: string = "image/jpeg"
): Promise<{ blob: Blob; url: string; file: File }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d canvas context");
  }

  // Preserve the exact aspect ratio of the user's cropped selection!
  // Cap max dimension at 2400px for crisp high-res output without distortion
  const maxDim = 2400;
  const currentMax = Math.max(pixelCrop.width, pixelCrop.height);
  const scale = currentMax > maxDim ? maxDim / currentMax : 1;

  const targetWidth = Math.max(1, Math.round(pixelCrop.width * scale));
  const targetHeight = Math.max(1, Math.round(pixelCrop.height * scale));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill white background in case of transparent pngs converted to jpeg
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas blob generation failed"));
          return;
        }
        const file = new File([blob], `cropped_${Date.now()}.jpg`, {
          type: outputType,
        });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, file });
      },
      outputType,
      0.95
    );
  });
}
