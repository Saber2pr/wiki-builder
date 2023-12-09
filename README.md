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
      - uses: Saber2pr/wiki-builder@v9
```
