# Proxy All the Things!!

[![Build Status](https://travis-ci.org/PlayMa256/proxy-all-the-things.svg?branch=master)](https://travis-ci.org/PlayMa256/proxy-all-the-things) [![Greenkeeper badge](https://badges.greenkeeper.io/PlayMa256/proxy-all-the-things.svg)](https://greenkeeper.io/)
[![Deps up to date](https://david-dm.org/PlayMa256/mmp.svg)](https://david-dm.org/PlayMa256/mmp.svg)

## Motivations
Well, i faced a few situations where i need to create a reverse proxy on my interface to access another system which had no apis to query to. This is basically a well crafted wrapper which eases the creation of a reverse proxy, just asking for 2 options in order to achieve it.

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

## Debug mode
In order to show all the debug statements and be able to analyse what is going on, use what `debug` has to offer you.

To Enable that, just execute: `DEBUG=proxy-all-the-things::proxy npm start` and the debug statements will pop on your screen.

## Options

| Property | Description |
|----------|-------------|
| `internalPath` | Path that the proxy is going to start in your server |
| `baseUrl` | Url of the website you are going to reverse proxy to |
