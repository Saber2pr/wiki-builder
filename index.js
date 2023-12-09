const { execSync } = require("child_process")
const tp = require('@saber2pr/ts-compiler')
const fs = require('fs-extra')
const path = require('path')
const showdown  = require('showdown')

const converter = new showdown.Converter()

async function main() {
  // config
  // execSync('git config user.name github-actions')
  // execSync('git config user.email github-actions@github.com')

  // create blog, collect md files
  execSync('mkdir blog && ls -d */ | grep -v "blog" | xargs -I {} cp -r ./{} ./blog/{} ')
  execSync('cp ./README.md ./blog/')
  execSync('find ./blog -type f -not -name "*.md" | xargs -I {} rm -rf {}')
  execSync('find ./blog -type d -empty | xargs -n 1 rm -rf')

  // render menu
  execSync(`cd blog && find . | sed -e "s/[^-][^/]*\\//  /g" -e "s/\.md//" | awk '{print substr($0, 3)}'  > ../wiki`)

  // download wiki app
  execSync(`curl "https://raw.githubusercontent.com/Saber2pr/saber2pr.github.io/master/release/index.html" > index.html`)
  execSync('touch .nojekyll')

  // inject static props
  // 1. add __wiki
  // 2. add content
  const template = await fs.readFile('./index.html', 'utf-8')
  const wiki = await fs.readFile('./wiki', 'utf-8')
  const createHtml = (content) => {
    return template.replace('<head>', `<head><script>
    window.__wiki = \`${wiki}\`
    window.__blog = \`${content.replaceAll('`', '\\`')}\`
    </script>`).replace('<div id="root"></div>', `<div id="root"><p>${
      converter.makeHtml(content)
      }</p></div>`)
  }

  const files = await tp.walkFile('./blog', entry => /\.md$/.test(entry.path), {withContent: true})
  for(const file of files){
    const dir = path.dirname(file.path)
    await fs.writeFile(path.join(dir, `${path.parse(file.path).name}.html`), createHtml(file.content))
  }

  await fs.writeFile(path.join(process.cwd(), 'index.html'), createHtml(await fs.readFile('./README.md', 'utf-8')))
}

main().catch(console.log)