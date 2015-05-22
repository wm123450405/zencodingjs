# Zencoding

Zencoding for linqjs
linqjs的zencoding 插件,通过zencoding代码生成html代码

## Usage

1.toHtml
```javascript
[{id:1,name:'a',flags:['e','f']},{id:2,name:'b',flags:['f','g']}]
    .toHtml('(tr#`id`>td{`name`})+(tr>td>span{`this`}*`flags`)');
```
Result:  
结果:  
```html
<tr id="1">
    <td>a</td>
</tr>
<tr>
    <td>
        <span>e</span>
        <span>f</span>
    </td>
</tr>
<tr id="2">
    <td>b</td>
</tr>
<tr>
    <td>
        <span>f</span>
        <span>g</span>
    </td>
</tr>
```

2.toZencoding
```html
<div class="c1" id="d1" style="display:none" data>content</div>
<ul><li>1</li><li>2</li><li>3</li></ul>
```
Result:  
结果:  
```javascript
('<div class="c1" id="d1" style="display:none" data>content</div>'+
'<ul><li>1</li><li>2</li><li>3</li></ul>')
    .toZencoding();
//div.c1#d1[style=display:none data]{content}+(ul>li{1}+li{2}+li{3})
```