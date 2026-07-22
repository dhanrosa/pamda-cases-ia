import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';

export const validateOutpaintingInputFile = (file: File) => {
  if (!AI_OUTPAINTING_CONFIG.acceptedMimeTypes.includes(file.type as never)) {
    throw new Error('Formato nao aceito. Use PNG, JPEG ou WebP.');
  }
  if (file.size > AI_OUTPAINTING_CONFIG.maxFileBytes) {
    throw new Error('Arquivo muito grande. O limite e 10 MB.');
  }
};

export const validatePreparedPair = async (image: File, mask: File) => {
  validateOutpaintingInputFile(image);
  if (mask.type !== 'image/png') throw new Error('A mascara precisa ser PNG com canal alfa.');
  const decode = async (file: File) => createImageBitmap(file);
  const [imageBitmap, maskBitmap] = await Promise.all([decode(image), decode(mask)]);
  const sameDimensions = imageBitmap.width === maskBitmap.width && imageBitmap.height === maskBitmap.height;
  imageBitmap.close();
  maskBitmap.close();
  if (!sameDimensions) throw new Error('A imagem e a mascara possuem dimensoes diferentes.');
};
