// import htmlmin from "html-minifier";
// import * as terser from "terser"
const htmlmin = require('html-minifier')
const terser = require('terser')

module.exports = (config) => {
  const {temp, pathPrefix, output } = config.extra
  const assetsPath = temp + '/assets'
  config.addPassthroughCopy({
    [assetsPath]: '/',
  })

  // NOTE It's cached by template renderer, so we need to pass extra options through settings injection
  config.addShortcode('makeBootScript', (settings, collections) => {
    const { title, pathPrefix, date } = settings.extra
    const entries = collections
      .map((entity) => ({
        quadrant: entity.data.quadrant,
        ring: settings.rings.findIndex(
          (ring) => ring.id === entity.data.ring.toLowerCase(),
        ),
        moved: entity.data.moved || 0,
        label: entity.fileSlug,
        link: config.javascriptFunctions.url(entity.url, pathPrefix),
        active: false,
      }))
      .filter((entity) => entity.ring >= 0)

    const radarSettings = {
      ...settings,
      title: `${title} — ${date}`,
      entries,
    }

    return `radar_visualization(${JSON.stringify(radarSettings)})`
  })

  config.addNunjucksAsyncFilter('jsmin', async function (code, callback) {
    try {
      const minified = await terser.minify(code)
      callback(null, minified.code)
    } catch (err) {
      console.error('Terser error: ', err)
      // Fail gracefully.
      callback(null, code)
    }
  })

  config.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath && outputPath.endsWith('.html')) {
      const result = htmlmin.minify(content, {
        removeComments: true,
        collapseWhitespace: true,
      })

      return result
    }
    return content
  })

  return {
    dir: {
      input: temp,
      output: output,
      layouts: '_layouts',
    },
    pathPrefix,
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk'],
  }
}
