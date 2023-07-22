const express = require('express')
const Moment = require('moment')
const axios = require('axios').default;

// const filterAllowedMethod = (requestMethod) => {

// }

const logResponse = (proxiedServiceResponse) => {
    console.log('Response Header : ', proxiedServiceResponse.headers)
    console.log('Response Status : ', proxiedServiceResponse.status)
    console.log('Response Body : ', proxiedServiceResponse.data)
}

const getServicePath = (basePath, requestUrl) => {
    let servicePath = requestUrl
    if(requestUrl != basePath || requestUrl != `${basePath}/`) {
        servicePath = requestUrl.split(basePath).filter((value) => value != '').join('')
    }
    // console.log(servicePath)

    return servicePath
}

const proxyReqFunc = (serviceConfig) => {
    return (req, res) => {
        let requestMethod = req.method.toUpperCase()
        if(serviceConfig.methodAllowed.indexOf(requestMethod) < 0) {
            res.status(404).send({
                message: "Not Found"
            })
        } else {
            // console.log(`req = > ${serviceConfig.serviceURL} === ${req.originalUrl}`)
            let servicePath = getServicePath(serviceConfig.basePath, req.originalUrl)
            axios({
                method: requestMethod.toLowerCase(),
                url: `${serviceConfig.serviceURL}${servicePath}`
            })
            .then((resp) => {
                logResponse(resp)
                res.send(resp.data)
            })
            .catch((err) => {
                logResponse(err.response)
                // console.log({header: err.response.header, status: err.response.status, data: err.response.data})
                if(err.response.status == 404) {
                    res.status(404).send({
                        message: "Not Found"
                    })
                } else {
                    res.status(err.response.status).send(err.response.data)
                }
            })
        }
    }
}

serviceConfig1 = {
    methodAllowed: ['GET', 'POST', 'PUT', 'DELETE'],
    serviceURL: "http://localhost:9000",
    needAuth: false,
    basePath: '/api/service1'
}

serviceConfig2 = {
    methodAllowed: ['GET', 'POST', 'PUT', 'DELETE'],
    serviceURL: "http://localhost:9001",
    needAuth: false,
    basePath: '/api/service2'
}

serviceList = {
    service1: serviceConfig1,
    service2: serviceConfig2
}

const app = express()
const PORT = process.env.APP_PORT || 5000

app.disable('x-powered-by');
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true
    })
)
app.use((req, res, next) => {
    console.log('Time : ', Moment().format("DD-MM-yyyy hh:mm:ss"))
    console.log('Request type : ', req.method)
    console.log('Request URL : ', req.originalUrl)
    console.log('Request Body : ', req.body)
    console.log('Request Query : ', req.query)
    next()
})
app.all(`${serviceList.service1.basePath}(*)`, proxyReqFunc(serviceList.service1))
app.all(`${serviceList.service2.basePath}(*)`, proxyReqFunc(serviceList.service2))
app.get('/semua', (req, res) => {
    res.send({
        hello: "world"
    })
})

app.listen(PORT, '0.0.0.0', () => {
    console.log(`app listening at http://0.0.0.0:${PORT}`)
})