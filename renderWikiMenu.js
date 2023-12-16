const { parse, getAbsPath } = require('@saber2pr/tree-lang')

const parseTree = (menu, base = "blog") => {
  const tree = parse(menu, n => {
    n.title = n.name
    n.path = `/${base}/` + getAbsPath(n)
    return n
  })
  tree.title = base
  tree.path = `/${base}`
  return tree 
}


const getArray = arr => Array.isArray(arr) ? arr : []

const renderMenu = (basename, root, md5Id) => {
  let isLeaf = !root.children

  const [nodeName, nodeMd5Id] = root.name.split(':')

  if(isLeaf) {
    return `<a href="${basename}/posts/${nodeMd5Id}/" class="ssr-a ${md5Id === nodeMd5Id ? 'ssr-a-active' : ''}">${nodeName}</a>`
  }

  const inner = getArray(root.children).map(item => `<li class="ssr-li">${renderMenu(basename, item, md5Id)}</li>`).join('\n')

  if(root.name === 'root') {
    return `<ul class="ssr-ul">${inner}</ul>`
  }

  return `<div class="ssr-dir ${md5Id.startsWith(nodeMd5Id) ? 'ssr-dir-active' : ''}">
  <svg class="TreeBtn" viewBox="0 0 926.23699 573.74994" version="1.1" x="0px" y="0px" width="10" height="10" style="transform: rotateX(0deg); transition: transform 0.2s ease 0s;"><g transform="translate(904.92214,-879.1482)"><path d=" m -673.67664,1221.6502 -231.2455,-231.24803 55.6165, -55.627 c 30.5891,-30.59485 56.1806,-55.627 56.8701,-55.627 0.6894, 0 79.8637,78.60862 175.9427,174.68583 l 174.6892,174.6858 174.6892, -174.6858 c 96.079,-96.07721 175.253196,-174.68583 175.942696, -174.68583 0.6895,0 26.281,25.03215 56.8701, 55.627 l 55.6165,55.627 -231.245496,231.24803 c -127.185,127.1864 -231.5279,231.248 -231.873,231.248 -0.3451,0 -104.688, -104.0616 -231.873,-231.248 z
" fill="currentColor"></path></g></svg>
  <span class="ssr-div-name">${root.name}</span></div><ul class="ssr-ul">${inner}</ul>`
}

const renderWikiMenu = (basename, wiki, md5Id) => {
  const tree = parseTree(wiki)
  return renderMenu(basename, tree, md5Id)
}

module.exports = {
  renderWikiMenu
}
