const path = require('path')
const glob = require('glob')
const util = require('util')
const _js = Symbol('JSFLAG')
const _dir = Symbol('DIRFLAG')
const _vmmap = Symbol('DIRMAP')
const _pathname = Symbol('PATHNAMEMAP')
const _jsmodule = Symbol('JSMODULE')

class Service {

}

defaultOptions = {
  cwd: path.join(process.cwd(), 'service/'),
  nodir: true
}

function files2dirMap(opt, files) {
  const map = {}
  files.forEach(file => {
    fileDir = file.replace(/\.js$/, '').split('/')
    let tmp = map
    fileDir.forEach((name, ind) => {
      if (ind === fileDir.length - 1) {
        const ne = { [_js]: true, [_pathname]: path.join(opt.cwd, file) }
        let _module = require(ne[_pathname])
        if (util.format(_module) === '[Function]') { // 兼容 egg service
          _module = _module({
            Service
          })
        }
        ne[_jsmodule] = _module
        tmp[name] = tmp[name] ? Object.assign(tmp[name], ne) : ne
      } else {
        tmp[name] = tmp[name]
          ? Object.assign(tmp[name], { [_dir]: true })
          : { [_dir]: true }
      }
      tmp = tmp[name]
    })
  })
  return map
}

function fastifyService(fastify, options) {
  options = options || {}
  options.serviceRoot && (options.cwd = options.serviceRoot)
  options = Object.assign({}, defaultOptions, options)
  const files = glob.sync('**/*.js', options)
  const fileMap = files2dirMap(options, files)

  fastify.addHook('preHandler', (request, reply, next) => {
    // some code
    const cacheMap = new WeakMap()
    const Handler = {
      get: function(target, key) {
        if (key === '__file' && target[_pathname]) {
          const service =  new target[_jsmodule]()
          service.app = fastify
          service.fastify = fastify
          service.ctx = request
          service.request = request
          return service
        }
        if (!target[key] || typeof target[key] !== 'object') {
          return undefined
        }
        if (cacheMap.has(target[key])) {
          // console.log('get from cacheMap')
          return cacheMap.get(target[key])
        }

        let re, prox
        if (target[key] && target[key][_dir]) {
          prox = new Proxy(target[key], Handler)
          re = {}
          Object.setPrototypeOf(re, prox)
        } else if (target[key] && target[key][_js]) {
          // re = new (require(target[key][_pathname]))(fastify, request, reply)
          re =  new target[key][_jsmodule]()
          re.app = fastify
          re.fastify = fastify
          re.ctx = request
          re.request = request
        }
        cacheMap.set(target[key], re)
        return re
      }
    }
    request.service = Object.setPrototypeOf({}, new Proxy(fileMap, Handler))
    next()
  })
}

const plugin = function(fastify, opts, next) {
  fastifyService(fastify, opts)
  next()
}
plugin[Symbol.for('skip-override')] = true
module.exports = plugin