const dynamicPageScript = `

whenPageReady(() => {
  watchLinks()
  window.addEventListener('popstate', onPopState)
})

function watchLinks () {
  const links = document.querySelectorAll('a')
  for (const link of links) {
    link.addEventListener('click', linkClicked)
  }
}

function linkClicked (event) {
  if (linkAllowed(event.target)) {
    event.preventDefault()
    getPage(event.target.getAttribute('href')).then(newPage => {
      changePage(newPage, event.target.href)
    })
  }
}

function linkAllowed (target) {
  const sameHost = location.host === target.host
  const notSamePage =
    location.host + location.pathname + location.search !==
    target.host + target.pathname + target.search
  return sameHost && notSamePage
}

function changePage (newPage, url, popstate = false) {
  const state = getPageState()
  document.open()
  document.write(newPage)
  document.close()
  updateHistory(url, popstate, state)
}

function updateHistory (url, popstate, state) {
  console.log('UH')
  if (!popstate) {
    console.log('PS')
    history.pushState(state, document.title, url)
  } 
}

function getPageState () {
  const { x, y } = getScrollPos()
  return {
    scroll: {
      x,
      y
    }
  }
}

function getScrollPos () {
  const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  const x = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0
  console.log('ASDASFG', y)
  return { x: x, y: y }
}

function setScrollPos (x, y) {
  whenPageReady(() => {
    console.log('Scroll fix', x, y)
    window.scrollTo(x, y)
  })
}

function onPopState (event) {
  // location.reload()
  console.log('Current href', location.href, 'popping', event)
  
  const lastUrl = location.href
  getPage(lastUrl).then(newPage => {
    changePage(newPage, lastUrl, true)
    setScrollPos(event.state.scroll.x, event.state.scroll.y)
  })
}

async function getPage (url) {
  try {
    return fetch(url)
      .then(response => response.text())
      .catch(() => console.log)
  } catch (err) { 
    console.log(err)
    window.location(url)
  }
}

function whenPageReady (func) {
  if (document.readyState === 'interactive' ||
    document.readyState === 'complete') {
    func()
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      func()
    })
  }
}
`

module.exports = '<script>' + dynamicPageScript + '</script>'
