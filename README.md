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
      - uses: Saber2pr/wiki-builder@v7
```
