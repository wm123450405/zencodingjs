# Zencoding

Zencoding for linqjs
linqjs的zencoding 插件,通过zencoding代码生成html代码

## Usage

```javascript
[{id:1,name:'a',flags:['e','f']},{id:2,name:'b',flags:['f','g']}].toHtml('(tr#`id`>td{`name`})+(tr>td>span{`this`}*`flags`)');
```
Result:  
结果:  
```html
<tr id="1"><td>a</td></tr><tr><td><span>e</span><span>f</span></td></tr><tr id="2"><td>b</td></tr><tr><td><span>f</span><span>g</span></td></tr>
```