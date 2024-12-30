async function proc({
  Manifold,
  viewer,
}: FunctionParsType) {
  console.log('test.ts')
  viewer.render(Manifold.sphere(1,1))
}

export default proc

export const meta = {
  name: 'test.ts',
} as const