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
  execSync(`curl "https://raw.githubusercontent.com/Saber2pr/wiki/master/release/index.html" > index.html`)
  execSync('touch .nojekyll')

  // inject static props
  // 1. add __wiki
  // 2. add content
  const template = await fs.readFile('./index.html', 'utf-8')
  const wiki = await fs.readFile('./wiki', 'utf-8')

  const aniStyle = 'background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.15) 37%, rgba(0, 0, 0, 0.06) 63%);background-size: 400% 100%;'
  
  const createHtml = (title, content) => {
    return template.replace('<head>', `<head>
    <style>
    html,
    body {
      padding: 0;
      margin: 0;
    }

    img {
      max-width: 100%;
    }

    @keyframes skeleton-loading {
      0% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0 50%;
      }
    }

    .skeleton-loading-list {
      margin: 3rem 1rem 10rem;
    }

    .skeleton-loading-item {
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.15) 37%, rgba(0, 0, 0, 0.06) 63%);
      background-size: 400% 100%;
      animation-name: skeleton-loading;
      animation-duration: 1.4s;
      animation-timing-function: ease;
      animation-iteration-count: infinite;
      height: 16px;
      margin-top: 16px;
    }
    </style>
    <script>
    window.__basename = '${basename}'
    window.__wiki = \`${wiki}\`
    window.__blog = \`${encodeURIComponent(content)}\`
    </script>`).replace('<div id="root"></div>', `<div id="root"><div style="width: 100%;height: 40px;background-color: #20232a;"></div><div style="margin: 0 4.5rem;display:flex;">
      <div style="width:70%;">
        <h1 style="word-break: break-all;font-size: 3rem;margin-top: 3rem;margin-left: 1rem;margin-right: 1rem;">${title}</h1>
        <div style="margin:1rem;padding:1rem;">${converter.makeHtml(content)}</div>
      </div>
      <div style="width: 30%;background-color: #f7f7f7;border-left: 1px solid #ececec;height: calc(100vh - 40px);position: fixed;right:-1rem;;top:40px;">
        <ul class="skeleton-loading-list" style="list-style: none;padding:0;">
          <li class="skeleton-loading-item" style="width:38%"></li>
          <li class="skeleton-loading-item"></li>
          <li class="skeleton-loading-item"></li>
          <li class="skeleton-loading-item" style="width:61%"></li>
        </ul>
      </div>
    </div></div>`).replace('<title>saber2prの窝</title>', `<title>${title}</title>`)
  }

  const files = await tp.walkFile('./blog', entry => /\.md$/.test(entry.path), {withContent: true})
  for(const file of files){
    const dir = path.dirname(file.path)
    const title = path.parse(file.path).name
    const targetDir = path.join(dir, title)
    await fs.mkdir(targetDir)
    await fs.writeFile(path.join(targetDir, `index.html`), createHtml(title, file.content))
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