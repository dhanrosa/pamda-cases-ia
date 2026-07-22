export function AiOutpaintingPreview({ originalUrl, resultUrl, compare, deviceBaseUrl, deviceMaskUrl, slotArea, cameraArea, imageTransform }: {
  originalUrl: string | null;
  resultUrl: string | null;
  compare: boolean;
  deviceBaseUrl?: string;
  deviceMaskUrl?: string;
  slotArea?: { x: number; y: number; width: number; height: number };
  cameraArea?: { x: number; y: number; width: number; height: number };
  imageTransform?: { xPercent: number; yPercent: number; zoomPercent: number };
}) {
  const displayed = compare || !resultUrl ? originalUrl : resultUrl;
  const verticalInsetPercent = 3.5;
  const horizontalInsetPercent =
    (1 - (816 / 1744) * ((720 * (1 - (verticalInsetPercent / 100) * 2)) / 405)) * 50;
  return (
    <div
      className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[34px] bg-white"
      style={{ aspectRatio: 405 / 720 }}
    >
      {deviceBaseUrl && (
        <img src={deviceBaseUrl} alt="Base do aparelho" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
      )}
      <div
        className="absolute z-10 overflow-hidden bg-[rgba(109,123,107,0.10)]"
        style={{
          top: `${verticalInsetPercent}%`,
          bottom: `${verticalInsetPercent}%`,
          left: `${horizontalInsetPercent}%`,
          right: `${horizontalInsetPercent}%`,
        }}
      >
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${slotArea?.x ?? 0}%`,
            top: `${slotArea?.y ?? 0}%`,
            width: `${slotArea?.width ?? 100}%`,
            height: `${slotArea?.height ?? 100}%`,
          }}
        >
          {displayed && (
            <img
              src={displayed}
              alt={compare ? 'Imagem original' : 'Resultado da ampliacao'}
              className="absolute inset-0 h-full w-full object-contain"
              style={compare || !resultUrl ? {
                transform: `translate(${imageTransform?.xPercent ?? 0}%, ${imageTransform?.yPercent ?? 0}%) scale(${(imageTransform?.zoomPercent ?? 100) / 100})`,
                transformOrigin: 'center',
              } : undefined}
            />
          )}
        </div>
        {cameraArea && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border-2 border-dashed border-amber-400 bg-amber-300/15 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
            style={{
              left: `${cameraArea.x}%`,
              top: `${cameraArea.y}%`,
              width: `${cameraArea.width}%`,
              height: `${cameraArea.height}%`,
            }}
            aria-label="Area delimitada para a camera"
          />
        )}
      </div>
      {deviceMaskUrl && (
        <img src={deviceMaskUrl} alt="Mascara do aparelho" className="pointer-events-none absolute inset-0 z-30 h-full w-full object-fill" />
      )}
    </div>
  );
}
