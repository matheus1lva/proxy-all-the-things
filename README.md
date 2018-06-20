# Proxy All the Things!!

## Installation
> `npm install --save @playma256/proxy-all-the-things` 

>` yarn add -S @playma256/proxy-all-the-things` 

## Usage
Instantiate a class passing all options to the constructor.

```js
const Proxy = require('@playma256/proxy-all-the-things');

// pass options
const ProxyInstance = new Proxy({
	baseUrl: "https://www.mytargetlocation.com",
	internalPath: "/myServerRoot"
});

// ...

// attach to your router
// This url has to be the same as the one inserted at the internalPath option
app.all('/myServerRoot*', ProxyInstance.proxyHandler);
```

## Options

| Property | Description |
|----------|-------------|
| `internalPath` | Path that the proxy is going to start in your server |
| `baseUrl` | Url of the website you are going to reverse proxy to |