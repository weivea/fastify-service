# fastiy-servise

fastiy-servise 为control提供service，  
用法类似 egg 的service, **兼容egg service 写法**
就不用再把臃肿的代码写在 control里边了

service下的方法 可以通过`this.ctx.servics.xxx` 或 `this.request.servics.xxx` 相互调用，  
`this.request`即为每次请求的 request

支持`async/await`方法


## install

```
npm install fastiy-servise --save
```

## usage


index.js
```javascript
const service = require('fastify-service')
const fastify = require('fastify')()
fastify.register(service, {
    serviceRoot: path.join(process.cwd(), 'service/')
  })
app.get('/api', async (req, res) => {
    req.service.testb.bFun()
    req.service.aa.funA()
    await req.service.testb.b2Fun()
    return {
      hello: 'ServerData'
    }
  })

```

service目录
```
.
./aa.js
./testa
./testa/testd.js
./testa.js
./testb.js
./testc
./testc/testc.js
```

./testb.js
```javascript
class Servic {
  bFun() {
    // service之间相互调用
    this.ctx.service.testc.testc.bFun()
    console.log(__filename);
    return __filename;
  }
  async b2Fun() {
    return await (() =>
      new Promise((resolve, reject) => {
        // 自运行返回Promise
        setTimeout(() => {
          console.log('async', __filename)
          resolve(__filename);
        }, 500);
      }))();
  }
}

module.exports = Servic;
```

