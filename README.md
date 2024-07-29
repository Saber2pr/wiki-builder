# wiki-builder

powered by saber2pr.github.io

```yml
name: Wiki Builder

on:
  workflow_dispatch:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4.1.1
      - uses: Saber2pr/wiki-builder@v0.0.66
```

1. live demo: [Saber2pr's Blog](https://saber2pr.top/)
2. live demo source: [saber2pr.github.io](https://github.com/Saber2pr/saber2pr.github.io)

## How to use

In the git repo, just write markdown files, and support tree directory level generation of side menu bars.

When CI is built, it will be compiled into HTML static files, which is SEO friendly.

## More config

```yml
- uses: actions/checkout@v4.1.1
- uses: Saber2pr/wiki-builder@v0.0.66
  with:
    cname: saber2pr.top # optional, your website cname
    gaId: G-XXX # optional, your google analytics gid 
    gaAdId: ca-pub-XXX # optional, your google adsense id
    gaAdsTxt: google.com, pub-xxx, DIRECT, xxx # optional, your google adsense txt
    gaAdsSlotHtml: <ins class="adsbygoogle"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script> # optional, your google adsense html
    iconUrl: //saber2pr.top/MyWeb/resource/image/saber2pr-top.ico # optional, your website icon
    i18nConfig: '[{"name":"English","key":"/"},{"name":"Chinese","key":"/zh"}]' # optional, your website i18n support
    title: MyBlog
    keywords: blog,js,html,css
    description: this is my blog
```