async function proc({
  Manifold,
  viewer,
  form,
  cv,
  helper,
  CrossSection,
}: FunctionParsType) {
  const text = 'AB'
  const textHeight = 500
  const extrude = 1
  const sizeOfPerPix = 0.01

  const canvasHeight = textHeight * 1.2
  const canvasWidth = textHeight * text.length

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return
  }

  ctx.font = `${textHeight}px Arial`;
  ctx.fillStyle = 'white';
  ctx.fillText(text, 10, textHeight);

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  
  const poly = helper.imageDataToCrossSection(imageData, 128, sizeOfPerPix)

  const mesh = poly.extrude(extrude)

  viewer.render(mesh)

  viewer.render(Manifold.sphere(1,10), 'sphere')


}

export default proc

export const meta = {
    name: 'example.ts',
}