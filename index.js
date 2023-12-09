const { execSync } = require("child_process")
const tp = require('@saber2pr/ts-compiler')
const fs = require('fs-extra')
const path = require('path')
const showdown  = require('showdown')
const core = require('@actions/core')

const converter = new showdown.Converter()

async function main() {
  const basename = core.getInput('basename') || ''
  const cname = core.getInput('cname')

  // config
  execSync('git config user.name github-actions')
  execSync('git config user.email github-actions@github.com')

  // get home md
  const rootFiles = await fs.readdir(process.cwd())
  const homeFile = rootFiles.find(item => /\.md$/.test(item))
  const appName = homeFile.split('.')[0]

  // create blog, collect md files
  execSync('mkdir blog && ls -d */ | grep -v "blog" | xargs -I {} cp -r ./{} ./blog/{} ')
  execSync(`cp ./${appName}.md ./blog/`)
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
  const createHtml = (title, content) => {
    return template.replace('<head>', `<head>
    <style>
    html,body {padding:0;margin:0;}
    img {max-width:100%;}
    </style>
    <script>
    window.__basename = '${basename}'
    window.__wiki = \`${wiki}\`
    window.__blog = \`${content.replaceAll('`', '\\`')}\`
    </script>`).replace('<div id="root"></div>', `<div id="root"><div style="width: 100%;height: 40px;background-color: #20232a;"></div><div style="margin: 0 4.5rem;display:flex;">
      <div style="width:70%;">${converter.makeHtml(content)}</div>
      <div style="width: 30%;"></div>
    </div></div>`).replace('<title>saber2prの窝</title>', `<title>${title}</title>`)
  }

  const files = await tp.walkFile('./blog', entry => /\.md$/.test(entry.path), {withContent: true})
  for(const file of files){
    const dir = path.dirname(file.path)
    const title = path.parse(file.path).name
    await fs.writeFile(path.join(dir, `${title}.html`), createHtml(title, file.content))
  }

  await fs.writeFile(path.join(process.cwd(), 'index.html'), createHtml(appName, await fs.readFile(`./${appName}.md`, 'utf-8')))

  if(cname) {
    await fs.writeFile(path.join(process.cwd(), 'CNAME'), cname)
  }

  // deploy
  execSync('git add .')
  execSync(`git commit . -m 'chore: deploy wiki'`)
  execSync(`git push origin -u -f master:gh-pages`)
}

main().catch(console.log)