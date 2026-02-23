import { RE_VIDEO, RE_IMAGE, RE_YOUTUBE, RE_VIMEO, escapeRegExp, convertGlobToRegex } from '../regex.mjs'

test('RE_VIDEO', () => {
  expect(RE_VIDEO.test('/video.mp4')).toBe(true)
  expect(RE_VIDEO.test('/video.ogg')).toBe(true)
  expect(RE_VIDEO.test('test/video.ogv')).toBe(true)
  expect(RE_VIDEO.test('/test/video.ogm')).toBe(true)
  expect(RE_VIDEO.test('/video.webm')).toBe(true)
  expect(RE_VIDEO.test('/video.avi')).toBe(true)
  expect(RE_VIDEO.test('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')).toBe(true)
  expect('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'.match(RE_VIDEO)[1]).toBe("BigBuckBunny.mp4")
  expect(RE_VIDEO.test('/video.mp3')).toBe(false)
  expect(RE_VIDEO.test('/video.jpg')).toBe(false)
  expect(RE_VIDEO.test('/video.jpeg')).toBe(false)
  expect(RE_VIDEO.test('/video.png')).toBe(false)
  expect(RE_VIDEO.test('/video.gif')).toBe(false)
  expect(RE_VIDEO.test('/video.svg')).toBe(false)
  expect(RE_VIDEO.test('/video.webp')).toBe(false)
})

test('RE_IMAGE', () => {
  expect(RE_IMAGE.test('/image.jpg')).toBe(true)
  expect(RE_IMAGE.test('/image.jpeg')).toBe(true)
  expect(RE_IMAGE.test('/image.png')).toBe(true)
  expect(RE_IMAGE.test('/image.gif')).toBe(true)
  expect(RE_IMAGE.test('/image.svg')).toBe(true)
  expect(RE_IMAGE.test('/image.webp')).toBe(true)
  expect(RE_IMAGE.test('/image.mp4')).toBe(false)
  expect(RE_IMAGE.test('/image.ogg')).toBe(false)
  expect(RE_IMAGE.test('/image.ogv')).toBe(false)
  expect(RE_IMAGE.test('/image.ogm')).toBe(false)
  expect(RE_IMAGE.test('/image.webm')).toBe(false)
  expect(RE_IMAGE.test('/image.avi')).toBe(false)
  expect(RE_IMAGE.test('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg')).toBe(true)
  expect('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'.match(RE_IMAGE)[1]).toBe("BigBuckBunny.jpg")
})

test('RE_YOUTUBE', () => {
  expect(RE_YOUTUBE.test('https://www.youtube.com/watch?v=27mt_xpeZTw')).toBe(true)
  expect(RE_YOUTUBE.test('https://www.youtube.com/embed/27mt_xpeZTw')).toBe(true)
  expect(RE_YOUTUBE.test('https://youtu.be/27mt_xpeZTw')).toBe(true)
  expect('https://youtu.be/27mt_xpeZTw'.match(RE_YOUTUBE)[1]).toBe("27mt_xpeZTw")
  expect('https://www.youtube.com/embed/27mt_xpeZTw'.match(RE_YOUTUBE)[1]).toBe("27mt_xpeZTw")
  expect('https://www.youtube.com/watch?v=27mt_xpeZTw'.match(RE_YOUTUBE)[1]).toBe("27mt_xpeZTw")
  expect(RE_YOUTUBE.test('https://www.youtube.com/watch?v=27mt_xpeZTw&feature=youtu.be')).toBe(true)
  expect(RE_YOUTUBE.test('https://www.youtube.com/watch?v=27mt_xpeZTw&feature=youtu.be&t=123')).toBe(true)
  expect(RE_YOUTUBE.test('https://www.youtube.com/watch?v=27mt_xpeZTw&feature=youtu.be&t=123s')).toBe(true)
})

test('RE_VIMEO', () => {
  expect(RE_VIMEO.test('https://vimeo.com/45196645')).toBe(true)
  expect(RE_VIMEO.test('https://vimeo.com/channels/staffpicks/45196645')).toBe(true)
  expect(RE_VIMEO.test('https://vimeo.com/groups/shortfilms/videos/45196645')).toBe(true)
  expect(RE_VIMEO.test('https://vimeo.com/album/2222222/video/45196645')).toBe(true)
  expect(RE_VIMEO.test('https://player.vimeo.com/video/45196645')).toBe(true)
  expect('https://vimeo.com/45196645'.match(RE_VIMEO)[1]).toBe("45196645")
  expect('https://vimeo.com/channels/staffpicks/45196645'.match(RE_VIMEO)[1]).toBe("45196645")
  expect('https://vimeo.com/groups/shortfilms/videos/45196645'.match(RE_VIMEO)[1]).toBe("45196645")
  expect('https://vimeo.com/album/2222222/video/45196645'.match(RE_VIMEO)[1]).toBe("45196645")
  expect('https://player.vimeo.com/video/45196645'.match(RE_VIMEO)[1]).toBe("45196645")
})

test('escapeRegExp', () => {
  // plain string with no special characters
  expect(escapeRegExp('hello world')).toBe('hello world')

  // each special regex character individually
  expect(escapeRegExp('.')).toBe('\\.')
  expect(escapeRegExp('*')).toBe('\\*')
  expect(escapeRegExp('+')).toBe('\\+')
  expect(escapeRegExp('?')).toBe('\\?')
  expect(escapeRegExp('^')).toBe('\\^')
  expect(escapeRegExp('$')).toBe('\\$')
  expect(escapeRegExp('{')).toBe('\\{')
  expect(escapeRegExp('}')).toBe('\\}')
  expect(escapeRegExp('(')).toBe('\\(')
  expect(escapeRegExp(')')).toBe('\\)')
  expect(escapeRegExp('|')).toBe('\\|')
  expect(escapeRegExp('[')).toBe('\\[')
  expect(escapeRegExp(']')).toBe('\\]')
  expect(escapeRegExp('\\')).toBe('\\\\')

  // multiple special characters in a string
  expect(escapeRegExp('foo.bar')).toBe('foo\\.bar')
  expect(escapeRegExp('price: $10.00')).toBe('price: \\$10\\.00')
  expect(escapeRegExp('(a|b)')).toBe('\\(a\\|b\\)')
  expect(escapeRegExp('[test]')).toBe('\\[test\\]')
  expect(escapeRegExp('a{1,3}')).toBe('a\\{1,3\\}')
  expect(escapeRegExp('file.*')).toBe('file\\.\\*')
  expect(escapeRegExp('is this real?')).toBe('is this real\\?')
  expect(escapeRegExp('end$')).toBe('end\\$')
  expect(escapeRegExp('^start')).toBe('\\^start')
  expect(escapeRegExp('a+b')).toBe('a\\+b')
  expect(escapeRegExp('path\\to\\file')).toBe('path\\\\to\\\\file')

  // escaped string works as a literal regex match
  const special = 'hello.*+?^${}()|[]\\world'
  const escaped = escapeRegExp(special)
  const re = new RegExp(escaped)
  expect(re.test(special)).toBe(true)
  expect(re.test('helloXworld')).toBe(false)

  // empty string
  expect(escapeRegExp('')).toBe('')
})

describe('convertGlobToRegex', () => {
  it('converts * to match non-separator characters', () => {
    const re = convertGlobToRegex('*.js')
    expect(re.test('app.js')).toBe(true)
    expect(re.test('app.ts')).toBe(false)
  })

  it('converts ? to match single character', () => {
    const re = convertGlobToRegex('?.js')
    expect(re.test('a.js')).toBe(true)
    expect(re.test('.js')).toBe(false)
  })

  it('converts brace expansion to alternation', () => {
    const re = convertGlobToRegex('*.{js,ts}')
    expect(re.test('app.js')).toBe(true)
    expect(re.test('app.ts')).toBe(true)
    expect(re.test('app.css')).toBe(false)
  })

  it('escapes dots', () => {
    const re = convertGlobToRegex('file.txt')
    expect(re.test('fileTtxt')).toBe(false)
    expect(re.test('file.txt')).toBe(true)
  })

  it('handles negation inside brackets', () => {
    const re = convertGlobToRegex('[!abc].js')
    expect(re.test('d.js')).toBe(true)
    expect(re.test('a.js')).toBe(false)
  })

  it('escapes ! outside brackets', () => {
    const re = convertGlobToRegex('file!.txt')
    expect(re.test('file!.txt')).toBe(true)
  })

  it('returns null for invalid regex', () => {
    const re = convertGlobToRegex('[invalid')
    expect(re).toBeNull()
  })

  it('converts ** globstar to match across separators', () => {
    const re = convertGlobToRegex('src/**/*.js')
    expect(re.test('src/app.js')).toBe(true)
    expect(re.test('src/lib/utils/app.js')).toBe(true)
    expect(re.test('dist/app.js')).toBe(false)
  })

  it('handles ** at the start', () => {
    const re = convertGlobToRegex('**/test.js')
    expect(re.test('test.js')).toBe(true)
    expect(re.test('src/test.js')).toBe(true)
    expect(re.test('a/b/c/test.js')).toBe(true)
  })

  it('handles ** at the end', () => {
    const re = convertGlobToRegex('src/**')
    expect(re.test('src/file.js')).toBe(true)
    expect(re.test('src/a/b/c')).toBe(true)
  })

  it('handles ?() extglob — zero or one', () => {
    const re = convertGlobToRegex('file?(.min).js')
    expect(re.test('file.js')).toBe(true)
    expect(re.test('file.min.js')).toBe(true)
    expect(re.test('file.min.min.js')).toBe(false)
  })

  it('handles *() extglob — zero or more', () => {
    const re = convertGlobToRegex('file*(ab).js')
    expect(re.test('file.js')).toBe(true)
    expect(re.test('fileab.js')).toBe(true)
    expect(re.test('fileabab.js')).toBe(true)
  })

  it('handles +() extglob — one or more', () => {
    const re = convertGlobToRegex('file+(ab).js')
    expect(re.test('file.js')).toBe(false)
    expect(re.test('fileab.js')).toBe(true)
    expect(re.test('fileabab.js')).toBe(true)
  })

  it('handles @() extglob — exactly one', () => {
    const re = convertGlobToRegex('@(foo|bar).js')
    expect(re.test('foo.js')).toBe(true)
    expect(re.test('bar.js')).toBe(true)
    expect(re.test('baz.js')).toBe(false)
  })

  it('handles extglob with pipe alternation', () => {
    const re = convertGlobToRegex('+(foo|bar|baz).js')
    expect(re.test('foo.js')).toBe(true)
    expect(re.test('bar.js')).toBe(true)
    expect(re.test('foobar.js')).toBe(true)
    expect(re.test('qux.js')).toBe(false)
  })

  it('handles !() extglob — negation', () => {
    const re = convertGlobToRegex('!(test).js')
    expect(re.test('app.js')).toBe(true)
    expect(re.test('test.js')).toBe(false)
    expect(re.test('testing.js')).toBe(true)
  })

  it('handles !() with alternation', () => {
    const re = convertGlobToRegex('!(test|spec).js')
    expect(re.test('app.js')).toBe(true)
    expect(re.test('test.js')).toBe(false)
    expect(re.test('spec.js')).toBe(false)
  })

  it('handles !() in a path context', () => {
    const re = convertGlobToRegex('src/!(test)/*.js')
    expect(re.test('src/lib/app.js')).toBe(true)
    expect(re.test('src/test/app.js')).toBe(false)
    expect(re.test('src/testing/app.js')).toBe(true)
  })

  it('handles multiple !() patterns', () => {
    const re = convertGlobToRegex('!(a)/!(b)')
    expect(re.test('x/y')).toBe(true)
    expect(re.test('a/y')).toBe(false)
    expect(re.test('x/b')).toBe(false)
    expect(re.test('a/b')).toBe(false)
  })

  it('handles glob escape with backslash', () => {
    const re = convertGlobToRegex('file\\*.txt')
    expect(re.test('file*.txt')).toBe(true)
    expect(re.test('fileXYZ.txt')).toBe(false)
  })

  it('anchored rejects partial matches', () => {
    const re = convertGlobToRegex('*.js', true)
    expect(re.test('app.js')).toBe(true)
    expect(re.test('path/to/app.js')).toBe(false)
    expect(re.test('app.js.bak')).toBe(false)
  })

  it('unanchored allows partial matches', () => {
    const re = convertGlobToRegex('*.js')
    expect(re.test('app.js')).toBe(true)
    expect(re.test('path/to/app.js')).toBe(true)
  })

  it('anchored with globstar', () => {
    const re = convertGlobToRegex('src/**/*.js', true)
    expect(re.test('src/app.js')).toBe(true)
    expect(re.test('src/lib/app.js')).toBe(true)
    expect(re.test('dist/src/app.js')).toBe(false)
    expect(re.test('src/app.js/extra')).toBe(false)
  })

  it('anchored with brace expansion', () => {
    const re = convertGlobToRegex('*.{js,ts}', true)
    expect(re.test('app.js')).toBe(true)
    expect(re.test('app.ts')).toBe(true)
    expect(re.test('src/app.js')).toBe(false)
  })

  it('anchored with !() negation', () => {
    const re = convertGlobToRegex('!(test).js', true)
    expect(re.test('app.js')).toBe(true)
    expect(re.test('test.js')).toBe(false)
    expect(re.test('path/app.js')).toBe(false)
  })

  it('anchored with !() negation and path', () => {
    const re = convertGlobToRegex('src/!(test)/*.js', true)
    expect(re.test('src/lib/app.js')).toBe(true)
    expect(re.test('src/test/app.js')).toBe(false)
    expect(re.test('extra/src/lib/app.js')).toBe(false)
  })
})
