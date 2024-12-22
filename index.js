const { execSync } = require("child_process");
const tp = require("@saber2pr/ts-compiler");
const fs = require("fs-extra");
const path = require("path");
const showdown = require("showdown");
const core = require("@actions/core");
const { createSitemap } = require("./sitemap");
const {
  renderWikiMenu,
  getPathMd5Id,
  resolveMdLink,
  md5,
  createHtml404,
} = require("./renderWikiMenu");

const converter = new showdown.Converter();

const getMdName = (mdFileName) => (mdFileName ? mdFileName.split(".")[0] : "");

async function main() {
  const basename = core.getInput("basename") || "";
  const cname = core.getInput("cname");
  const gaId = core.getInput("gaId");
  const gaAdId = core.getInput("gaAdId");
  const gaAdsTxt = core.getInput("gaAdsTxt");
  const gaAdsSlotHtml = core.getInput("gaAdsSlotHtml");
  const iconUrl = core.getInput("iconUrl");
  const backgroundImage = core.getInput("backgroundImage");
  const i18nConfig = core.getInput("i18nConfig");
  const expandAllMenu = core.getInput("expandAllMenu");
  const ignoreCnameFile = core.getInput("ignoreCnameFile");

  // seo
  const params_title = core.getInput("title");
  const params_keywords = core.getInput("keywords");
  const params_description = core.getInput("description");

  // config
  execSync("git config user.name github-actions");
  execSync("git config user.email github-actions@github.com");

  // get home md
  const rootFiles = await fs.readdir(process.cwd());
  const homeFile = rootFiles.find((item) => /\.md$/.test(item));
  const appName = getMdName(homeFile);

  // create blog, collect md files
  execSync(
    'mkdir blog && ls -d */ | grep -v "blog" | xargs -I {} cp -r ./{} ./blog/{} '
  );
  await fs.copy(`./${appName}.md`, `./blog/${appName}.md`);
  execSync('find ./blog -type f -not -name "*.md" | xargs -I {} rm -rf {}');
  execSync("find ./blog -type d -empty | xargs -n 1 rm -rf");

  // render menu
  execSync(
    `cd blog && find . | sed -e "s/[^-][^/]*\\//  /g" -e "s/\.md//" | awk '{print substr($0, 3)}'  > ../wiki`
  );

  // download wiki app
  execSync(
    `curl "https://raw.githubusercontent.com/Saber2pr/wiki/master/build/wiki-release.tar.gz" > ./wiki-release.tar.gz`
  );
  execSync(`tar -xvf ./wiki-release.tar.gz`);
  execSync("touch .nojekyll");

  // inject static props
  // 1. add __wiki
  // 2. add content
  const template = await fs.readFile("./release/index.html", "utf-8");

  // replace all js basename
  const releaseFiles = await fs.readdir('./release')
  for (const releaseFile of releaseFiles) {
    if (/\.js$/.test(releaseFile)) {
      // replace basename
      const content = await fs.readFile(`./release/${releaseFile}`, 'utf8')
      if (content && content.includes('__$basename$__')) {
        await fs.writeFile(`./release/${releaseFile}`, content.replaceAll('/__$basename$__', basename), 'utf8')
      }
    }
  }

  const wiki = await fs.readFile("./wiki", "utf-8");

  // render md5
  /**
   * @param {*} wiki
   * @param {tp.EntryResult[]} files
   * @returns
   */
  const renderWikiMd5 = (wiki, files) => {
    if (wiki) {
      return wiki
        .split("\n")
        .map((line) => {
          const text = line.trim();
          if (text) {
            const file = files.find((item) => getMdName(item.name) === text);
            if (file) {
              return `${line}:${getPathMd5Id(file.path)}`;
            }
            return `${line}`;
          }
        })
        .join("\n");
    }
    return wiki;
  };

  const createHtml = (title, content, md5Id, fPath) => {
    const isIndex = fPath === "/";

    const indexTitle =
      params_title && isIndex ? `<title>${params_title}</title>` : "";
    const indexKeywords = params_keywords
      ? `<meta name="keywords" content="${params_keywords}">`
      : "";
    const indexDesc =
      params_description && isIndex
        ? `<meta name="description" content="${params_description}">`
        : "";

    content = resolveMdLink(content, basename);
    const wikiMd5 = renderWikiMd5(wiki, files);
    const { menu: wikiMenu, expandDirs } = renderWikiMenu(
      basename,
      wikiMd5,
      md5Id,
      fPath
    );
    let outHtml = template
      .replaceAll(`/__$basename$__`, basename)
      .replace(
        "<head>",
        `<head>
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

    <style>
      .ssr-a {
        color: #6d6d6d;
        text-decoration: none;
        cursor: pointer;
      }

      .ssr-a:hover {
        color: black;
      }

      .ssr-a-active {
        color: black;
        font-weight: 700;
        border-left: 0.25rem solid #61dafb;
        padding-left: 10px;
      }

      .ssr-li {
        line-height: 2rem;
      }

      .ssr-ul {
        list-style: none;
        padding-left: 16px;
        margin: 4px;
      }

      .ssr-dir {
        color: #6d6d6d;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .ssr-dir-active {
        color: #1a1a1a;
      }

      .ssr-div-name:hover {
        outline: -webkit-focus-ring-color auto 1px;
        color: #1a1a1a;
      }

      .ssr-topheader {
        width: 100%;
        height: 40px;
        background-color: #20232a;
        position: fixed;
        left:0;
        top:0;
      }
      .ssr-topheader-a {
        text-align: center;
        text-decoration: none;
        user-select: none;
        display: inline-block;
        padding-left: 0.7rem;
        padding-right: 0.7rem;
        color: #d5d5d7;
        border-bottom: none;
        line-height: 40px;
      }

      .ssr-content-title {
        word-break: break-all;
        font-size: 3rem;
        margin-top: calc(3rem + 40px);
        margin-left: 1rem;
        margin-right: 1rem;
      }

      .ssr-wiki {
        margin: 0 4.5rem;
        display: flex;
      }

      .ssr-wiki-content {
        width:70%;
      }

      .ssr-wiki-menu {
        width: 30%;
        background-color: #f7f7f7;
        border-left: 1px solid #ececec;
        height: calc(100vh - 40px);
        position: fixed;
        right:-1rem;
        top:40px;
        overflow-y:auto;
      }

      .ssr-content-main {
        margin: 1rem;
        padding: 1rem;
      }

      #root-pre {
        width: 100vw;
        height: 100vh;
        overflow: auto;
        position: fixed;
        left:0;
        top:0;
        z-index:999;
      }
      #root {
        position: relative;
        z-index:0;
      }

      @media screen and (max-width: 740px) {
        .ssr-topheader {
          height: 2rem;
        }
        .ssr-topheader-a {
          line-height: 2rem;
        }
        .ssr-wiki {
          flex-direction: column;
          margin: 0;
          padding: 0;
        }

        .ssr-wiki-content {
          width: 100%;
        }

        .ssr-wiki-menu {
          position: relative;
          width: 100%;
          right: 0;
        }

        .ssr-content-title {
          font-size: 2rem;
          margin-top: 4rem;
          margin-left: 0.5rem;
          margin-right: 0.5rem;
        }

        .ssr-content-main {
          margin: 0.5rem;
          padding: 0.5rem;
          line-height: 1.5rem;
          font-size: 14px;
        }
      }
    </style>
    <script>
    window.__title = "${title}"
    window.__backgroundImage = ""
    window.__basename = '${basename}'
    window.__expandAllMenu = '${expandAllMenu || ""}'
    window.__adsSlotHtml = '${encodeURIComponent(gaAdsSlotHtml)}'
    window.__i18nConfig = ${i18nConfig || "null"}
    window.__expandDirs = ${JSON.stringify(expandDirs)}
    window.__wiki = \`${wikiMd5}\`
    window.__blog = \`${encodeURIComponent(content)}\`
    </script>`
      )
      .replace(
        '<div id="root"></div>',
        `<div id="root-pre"><div class="ssr-topheader">
    <a class="ssr-topheader-a" href="${basename}/">${appName}</a>
    </div><div class="ssr-wiki">
      <div class="ssr-wiki-content">
        <h1 class="ssr-content-title">${title}</h1>
        <div class="ssr-content-main">${converter.makeHtml(
          content
        )}</div>
      </div>
      <div class="ssr-wiki-menu">
        <div style="margin: 3rem 0 10rem">${wikiMenu}</div>
      </div>
    </div></div><div id="root"></div>`
      );

    if (indexTitle) {
      outHtml = outHtml.replace("<title>saber2prの窝</title>", indexTitle);
    } else {
      const displayTitle = params_title || appName;
      outHtml = outHtml.replace(
        "<title>saber2prの窝</title>",
        `<title>${title === appName ? displayTitle : `${title} - ${displayTitle}`
        }</title>`
      );
    }

    if (indexKeywords) {
      outHtml = outHtml.replace(
        '<meta name="keywords" content="react,antd,typescript,javascript,css,html,前端学习,前端进阶,个人博客">',
        indexKeywords
      );
    }

    if (indexDesc) {
      outHtml = outHtml.replace(
        '<meta name="description" content="长期更新前端技术文章,分享前端技术经验">',
        indexDesc
      );
    } else {
      outHtml = outHtml.replace(
        '<meta name="description" content="长期更新前端技术文章,分享前端技术经验">',
        `<meta name="description" content="${content
          .replace(/"/g, " ")
          .slice(0, 113)}…">`
      );
    }

    if (gaId) {
      outHtml = outHtml.replace(
        "<head>",
        `<head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      
        gtag('config', '${gaId}');
      </script>`
      );
    }
    if (gaAdId) {
      outHtml = outHtml.replace(
        "<head>",
        `<head>
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${gaAdId}" crossorigin="anonymous"></script>`
      );
    }

    if (iconUrl) {
      outHtml = outHtml.replace(
        "<head>",
        `<head>
      <link rel="icon" href="${iconUrl}" type="image/x-icon" />`
      );
    }

    return outHtml;
  };

  const urls = [];
  const files = await tp.walkFile(
    "./blog",
    (entry) => /\.md$/.test(entry.path),
    { withContent: true }
  );

  const postRootDir = path.join(process.cwd(), "posts");
  try {
    await fs.mkdir(postRootDir, { recursive: true });
  } catch (error) { }

  for (const file of files) {
    const dir = path.dirname(file.path);
    const title = path.parse(file.path).name;
    const targetDir = path.join(dir, title);
    await fs.mkdir(targetDir, { recursive: true });

    const idx = file.path.indexOf("/blog");
    const fPath = file.path.slice(idx);

    const md5Id = getPathMd5Id(file.path);
    const postDir = path.join(postRootDir, `${md5Id}`);
    await fs.mkdir(postDir, { recursive: true });

    await fs.writeFile(
      path.join(postDir, "index.html"),
      createHtml(title, file.content, md5Id, fPath)
    );

    const pidx = postDir.indexOf("posts");
    urls.push("/" + postDir.slice(pidx) + "/");
  }

  if (cname) {
    await fs.writeFile(
      path.join(process.cwd(), "robots.txt"),
      `Sitemap: https://${cname}/sitemap.xml`
    );
    await fs.writeFile(
      path.join(process.cwd(), "sitemap.xml"),
      createSitemap(cname, basename, urls)
    );
  }

  await fs.writeFile(
    path.join(process.cwd(), "404.html"),
    createHtml(`404`, createHtml404(basename), md5("404"), "/404")
  );
  await fs.writeFile(
    path.join(process.cwd(), "index.html"),
    createHtml(
      appName,
      await fs.readFile(`./${appName}.md`, "utf-8"),
      md5(appName),
      "/"
    )
  );

  if (ignoreCnameFile) {
    // noop
  } else {
    if (cname) {
      await fs.writeFile(path.join(process.cwd(), "CNAME"), cname);
    }
  }

  if (gaAdsTxt) {
    await fs.writeFile(path.join(process.cwd(), "ads.txt"), gaAdsTxt);
  }

  // deploy
  execSync("git add .");
  execSync(`git commit . -m 'chore: deploy wiki'`);
  execSync(`git push origin -u -f master:gh-pages`);
}

main().catch(console.log);
