/**
author:wm
email:491029934@qq.com

convert zencoding code to html code

plugin of linqjs (http://github.com/wm123450405/linqjs)

http://github.com/wm123450405/zencoding
*/
(function Zencoding() {
	function isWord(ch) {
		return ch.isBetween('a', 'z') || ch.isBetween('A', 'Z');
	}

	function isNumber(ch) {
		return ch.isBetween('0', '9');
	}

	function isNull(ch) {
		return typeof(ch) === 'undefined' || (!ch && ch !== 0 && ch !== false && ch !== '');
	}

	function define(obj, name, value) {
		(Object.defineProperty || function(obj, name, descriptor) {
			obj[name] = descriptor.value;
		})(obj, name, {
			value: value,
			enumable: false,
			writable: true,
			configurable: true
		});
	}

	var NodeTree = function(parent, prev, grouping) {
		this.parent = parent;
		if (this.parent) {
			this.parent.children.push(this);
		}
		this.prev = prev;
		if (this.prev) {
			this.prev.next = this;
		}
		this.grouping = [grouping || this];
		this.children = [];
		this.classes = [];
		this.attrs = [];
		this.values = [];
		this.styles = [];
		this.multi = 1;
	};

	NodeTree.prototype.toHtml = function(obj) {
		var classes = this.classes.length ? ' class="' + this.classes.join(' ') + '"' : '';
		var id = this.id ? ' id="' + this.id + '"' : '';
		var styles = this.attrs.zip(this.styles, function(name, value) {
			if (!Object.an(value, 'undefined')) {
				return name + ':' + value
			} else {
				return value;
			}
		}).where(function(e) {
			return !Object.an(e, 'undefined')
		}).join(';');
		styles = styles ? ' style="' + styles + '"' : '';
		var attrs = this.attrs.zip(this.styles, function(name, value) {
			if (Object.an(value, 'undefined')) {
				return name;
			} else {
				return undefined;
			}
		}).zip(this.values, function(name, value) {
			if (!Object.an(name, 'undefined')) {
				if (Object.an(value, 'undefined')) {
					return name;
				} else {
					return name + '="' + value.replace(/^"(.*)"$/g, '$1').replace(/^'(.*)'$/g, '$1') + '"';
				}
			} else {
				return name;
			}
		}).where(function(e) {
			return !Object.an(e, 'undefined')
		}).join(' ');
		attrs = attrs ? ' ' + attrs : attrs;
		var html = '';
		var thus = this;
		if (!Object.an(this.multi, 'undefined') && isNaN(this.multi)) {
			var array = (new Function('with(arguments[0]){return (' + this.multi.replace(/^`(.+)`$/g, '$1') + ');}')).call(obj, obj);
			html = array.aggregate(function(o, s) {
				return s + (thus.tag ? ('<' + thus.tag + id + classes + styles + attrs + (thus.children.last() ? '>' + thus.children.last().toHtml(o) + '</' + thus.tag + '>' : simpleTags.exists(thus.tag) ? '/>' : ('></' + thus.tag + '>'))) : thus.parent && thus.parent.tag == 'pre' ? eval(thus.content || '""') : thus.content || '').replace(/`([^`]+?)`/g, function(word, exp) {
					return (new Function('with(arguments[0]){return (' + exp + ');}')).call(o, o);
				});
			}, html);
		} else {
			html = (this.tag ? ('<' + this.tag + id + classes + styles + attrs + (this.children.last() ? '>' + this.children.last().toHtml(obj) + '</' + this.tag + '>' : simpleTags.exists(thus.tag) ? '/>' : ('></' + thus.tag + '>'))) : thus.parent && thus.parent.tag == 'pre' ? eval(thus.content || '""') : thus.content || '').replace(/`([^`]+?)`/g, function(word, exp) {
				return (new Function('with(arguments[0]){return (' + exp + ');}')).call(obj, obj);
			}).repeat(this.multi);
		}
		return (this.prev ? this.prev.toHtml(obj) : '') + html;
	};

	function zencode(zencoding, obj) {

		function setTag(node, word) {
			node.tag = word || node.tag;
		}

		function addClass(node, word) {
			if (word) {
				node.classes.push(word);
			}
		}

		function setId(node, word) {
			node.id = word || node.id;
		}

		function addContent(node, word) {
			//node.content = word || node.content;
			var text = new NodeTree(node, node.children.last(), node.grouping);
			text.content = word;
			node.children.push(text);
		}

		function setProperty(node, word) {
			if (word) {
				node.attrs.push(word);
				node.values.push(undefined);
				node.styles.push(undefined);
			}
		}

		function setValue(node, word) {
			node.values[node.values.length - 1] = word || node.values[node.values.length - 1] || word;
		}

		function setStyle(node, word) {
			node.styles[node.styles.length - 1] = word || node.styles[node.styles.length - 1] || word;
		}

		function setMulti(node, word) {
			node.multi = isNaN(word) || word === '' ? word || node.multi || word : parseInt(word);
		}

		var nul = 0,
			wrd = 1,
			num = 2,
			sym = 3;
		var word = '';
		var node = new NodeTree(null, null);
		var grouping = node;
		var status = setTag;
		var symbol = '>+(){}^[]:=.#* ';
		var inEl = false,
			inStr = false,
			inStrDou = false,
			inContent = false;
		zencoding.forEach(function(c, i, p, n) {
			var pt = isNull(p) ? nul : isWord(p) ? wrd : isNumber(p) ? num : sym
			if (isWord(c)) {
				word += c;
			} else if (isNumber(c)) {
				word += c;
			} else if (!inEl && !inStr && !inStrDou && symbol.exists(c)) {
				if (inContent && c != '}') {
					word += c;
					return;
				}
				status(node, word);
				if (c == '>') {
					node = new NodeTree(node, node.children.last(), grouping);
					status = setTag;
				} else if (c == '+') {
					node = new NodeTree(node.parent, node, grouping);
					status = setTag;
				} else if (c == '(') {
					//console.log('in', node, grouping);
					node.grouping.push(grouping);
					grouping = node;
				} else if (c == ')') {
					node = grouping;
					while (node.next) {
						node = node.next;
					}
					grouping = node.grouping.pop();
					//console.log('out', node.tag, grouping.tag);
				} else if (c == '{') {
					status = addContent;
					inContent = true;
				} else if (c == '}') {
					status = setTag;
					inContent = false;
				} else if (c == '^') {
					node = node.parent;
				} else if (c == '[') {
					status = setProperty;
				} else if (c == ']') {
					status = setTag;
				} else if (c == ' ') {
					status = setProperty;
				} else if (c == ':') {
					status = setStyle;
				} else if (c == '=') {
					status = setValue;
				} else if (c == '.') {
					status = addClass;
				} else if (c == '#') {
					status = setId;
				} else if (c == '*') {
					status = setMulti;
				}
				word = '';
			} else {
				if (!inStrDou && !inStr && c == '`') {
					inEl = !inEl;
				} else if (!inStrDou && c == '\'') {
					inStr = !inStr;
				} else if (!inStr && c == '\"') {
					inStrDou = !inStrDou;
				}
				word += c;
			}
		});
		status(node, word);
		while (node.parent) {
			node = node.parent;
		}
		while (node.next) {
			node = node.next;
		}
		return node.toHtml(obj);
	};

	define(Object.prototype, 'toHtml', function(zencoding) {
		return zencode(zencoding, this);
	});

	define(Array.prototype, 'toHtml', function(zencoding) {
		return this.aggregate(function(o, s) {
			return s + zencode(zencoding, o);
		}, '');
	});

	define(String.prototype, 'toHtml', function(zencoding) {
		if (arguments.length) {
			return zencode(zencoding, this);
		} else {
			return zencode(this, {});
		}
	});

	function toArray(list) {
		var result = new Array(list.length);
		for (var i = 0; i < list.length; i++) {
			result[i] = list[i];
		}
		return result;
	}

	function toXml(str) {
		if (window.ActiveXObject) {
			var xmlobject = new ActiveXObject("Microsoft.XMLDOM");
			xmlobject.async = false;
			xmlobject.loadXML(str);
			return xmlobject;
		} else {
			return new DOMParser().parseFromString(str, 'text/xml');
		}
	}

	function castXml(obj) {
		if (Object.an(obj, String, 'string')) {
			return toArray(toXml('<root>' + toXmlStr(obj) + '</root>').childNodes[0].childNodes)
		} else {
			return obj;
		}
	}

	var simpleTags = ['input', 'img', 'br'];

	function toZencoding(xml) {
		if (xml.an(Array)) {
			xml = xml.cast(castXml);
			xml = xml.where(function(c) {
				return !c.an(Array);
			}).concat(xml.where(function(c) {
				return c.an(Array);
			}).selectMany());
			xml.where(function(c) {
				return c.nodeName != '#comment';
			});
			if (xml.length == 1) {
				return toZencoding(xml[0]);
			} else {
				return xml.select(function(e) {
					return toZencoding(e);
				}).join('+');
			}
		}
		var coding = xml.tagName.toLowerCase();
		var attrs = toArray(xml.attributes);
		attrs.where("=>name=='class'").forEach(function(attr) {
			coding = attr.value.trim().replace(/\s+/g, ' ').split(' ').trim().aggregate(function(c, s) {
				return s + '.' + c;
			}, coding);
		});
		attrs.where("=>name=='id'").forEach(function(attr) {
			if (attr.value.trim()) {
				coding += '#' + attr.value.trim();
			}
		})
		attrs = attrs.where("=>name!='class'&&name!='id'").select(function(attr) {
			/*
			if (attr.name == 'style') {
				return attr.value.trim().replace(/\s+/g, ' ').split(';').select(function(e) {
					if (e) {
						var index = e.indexOf(':');
						if (index == -1) {
							return '';
						} else {
							var name = e.substring(0, index);
							var value = e.substring(index + 1);
							if (value.intersect(' "\'().#').length) {
								return name + ':' + value.replace(/"/g, '\\x22') + '"';
							} else {
								return name + ':' + value;
							}
						}
					} else {
						return '';
					}
				}).wipe('').join(' ');
			} else {
				*/
			if (attr.value.intersect(' "\'().#').length) {
				return attr.name + '="' + attr.value.replace(/"/g, '\\x22') + '"';
			} else {
				if (attr.name == attr.value) {
					return attr.name;
				} else {
					return attr.name + '=' + attr.value;
				}
			}
			//}
		}).join(' ');
		if (attrs) {
			coding += '[' + attrs + ']';
		}
		var children = toArray(xml.childNodes);
		var hasChildren = false;
		if (children.length) {
			//coding = toZencoding(children, coding);
			coding = children.where(function(c) {
				return c.nodeName != '#comment';
			}).aggregate(function(c, s, i, p) {
				if (c.nodeName == '#text') {
					if (s.exists('>')) {
						return '(' + s + '){' + (xml.tagName == 'pre' ? c.data.quote() : xml.tagName == 'script' ? 'eval(' + c.data.quote() + ')' : c.data.replace(/[\s\t\r\n]+/g, ' ')) + '}';
					} else {
						return s + '{' + (xml.tagName == 'pre' ? c.data.quote() : xml.tagName == 'script' ? 'eval(' + c.data.quote() + ')' : c.data.replace(/[\s\t\r\n]+/g, ' ')) + '}';
					}
				} else {
					hasChildren = true;
					if (i == 0 || p.nodeName == '#text') {
						return s + '>' + toZencoding(c);
					} else {
						return s + '+' + toZencoding(c);
					}
				}
			}, coding);
		}
		return hasChildren ? '(' + coding + ')' : coding;
	}

	function toXmlStr(str) {
		str = str.replace(/(^|<\/script>)((?:.|[\r\n\t])*?)(<script[^>]*?>|$)/g, function(word, start, body, end) {
			return start + body.replace(/[\r\n]+/g, ' ').replace(/>\s+</g, '><').trim() + end;
		});
		str = str.replace(/<\w[^>]*?>/g, function(word) {
			return word.replace(/\s(\w[_\w\d\-]*)(\s*(?=\=|\s\w|[\/>]))(\=\s*\"[^\"]*?\")?([\/>])?/g, function(word, name, space, value, end) {
				if (!value) {
					return ' ' + name + '="' + name + '"' + (end || ' ');
				} else {
					return ' ' + name + value + (end || ' ');
				}
			});
		});
		simpleTags.forEach(function(tag) {
			str = str.replace(RegExp('<' + tag + '[^>]*?>', 'ig'), function(word) {
				if (word.endsWith('/>')) {
					return word;
				} else {
					return word.replace(/>$/g, '/>');
				}
			});
		});
		return str;
	}

	define(String.prototype, 'toZencoding', function() {
		//toXmlStr(this).log();
		return toArray(toXml('<root>' + toXmlStr(this) + '</root>').childNodes[0].childNodes).toZencoding();
	});

	define(Array.prototype, 'toZencoding', function() {
		return toZencoding(this);
	});
})();