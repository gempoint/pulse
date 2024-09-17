import { ResizeFilterType, Transformer } from '@napi-rs/image';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
const { log, error: e } = console

const generateIcons = async () => {
  log('getting base images')
  let icon = Bun.file('./assets/icon.png')
  let splash = Bun.file('./assets/splash_transparent.png')
  let adaptive = Bun.file('./assets/adaptive.png')
  log('minifying icon to 1024x1024 & writing')
  let x = await new Transformer(Buffer.from(await icon.arrayBuffer())).resize(1024, 1024, ResizeFilterType.Triangle)
  Bun.write('./dist/icon.png', (await x.png()).buffer)
  log('minifying splash to 1284x2778 & writing')
  let y = await new Transformer(Buffer.from(await splash.arrayBuffer())).resize(1284, 2778, ResizeFilterType.Triangle)
  Bun.write('./dist/splash.png', (await y.png()).buffer)
  log('minifying adaptive to 1024x1024 & writing')
  let z = await new Transformer(Buffer.from(await adaptive.arrayBuffer())).resize(1024, 1024, ResizeFilterType.Triangle)
  Bun.write('./dist/adaptive.png', (await z.png()).buffer)
  log('changing in app/')
  Bun.write('../app/assets/images/icon.png', Bun.file('./dist/icon.png'))
  Bun.write('../app/assets/images/splash.png', Bun.file('./dist/splash.png'))
  Bun.write('../app/assets/images/adaptive-icon.png', Bun.file('./dist/adaptive.png'))
}

try {
  await generateIcons()
} catch (err) {
  e(err)
}