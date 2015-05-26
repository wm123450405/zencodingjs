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

	NodeTree.prototype.toHtml = function(obj, high) {
		var thus = this;
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
		});
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
		});
		if (high) {
			attrs = attrs.select(function(value) {
				highZencodingTo.forEach(function(html, i) {
					if (value == html) {
						value = highToHtml[i];
						return false;
					} else if (html.an(RegExp)) {
						var result = value.replace(html, highToHtml[i]);
						if (result != value) {
							value = result;
							//return false;
						}
					}
				});
				return value;
			});
			styles = styles.concat(attrs.where(function(value) {
				var ss = value.indexOf(':');
				var sp = value.indexOf('=');
				return ss != -1 && (sp == -1 || sp > ss);
			}));
			attrs = attrs.where(function(value) {
				var ss = value.indexOf(':');
				var sp = value.indexOf('=');
				return !(ss != -1 && (sp == -1 || sp > ss));
			}).select(function(value) {
				if (value.startsWith('-')) {
					var ss = value.indexOf(':');
					var sp = value.indexOf('=');
					if (ss != -1 && (sp == -1 || sp > ss)) {
						return value;
					}
				}
				return value.substring(1);
			});
		}
		if (this.type) {
			attrs.push(tagType[this.tag].name + '="' + ((high ? tagType[this.tag].values.findFirst(function(value) {
				return value.startsWith(thus.type);
			}) : '') || this.type) + '"');
		}
		attrs = attrs.join(' ');
		attrs = attrs ? ' ' + attrs : attrs;
		styles = styles.join(';');
		styles = styles ? ' style="' + styles + '"' : '';
		var html = '';
		if (!Object.an(this.multi, 'undefined') && isNaN(this.multi)) {
			var array = (new Function('with(arguments[0]){return (' + this.multi.replace(/^`(.+)`$/g, '$1') + ');}')).call(obj, obj);
			html = array.aggregate(function(o, s, i) {
				return s + (thus.tag ? ('<' + thus.tag + id + classes + styles + attrs + (thus.children.last() ? '>' + thus.children.last().toHtml(o) + '</' + thus.tag + '>' : simpleTags.exists(thus.tag) ? '/>' : ('></' + thus.tag + '>'))).replace(/([^\\])(?=\$(@\-)?)/g, function(word, prefix, suffix) {
					if (suffix == '@-') {
						return prefix + (array.length - i);
					} else {
						return prefix + (i + 1);
					}
				}).replace(/([^\\])\$(@\-)?/g, '$1') : thus.parent && thus.parent.tag == 'pre' ? eval(thus.content || '""') : thus.content || '').replace(/`([^`]+?)`/g, function(word, exp) {
					return (new Function('with(arguments[0]){return (' + exp + ');}')).call(o, o);
				})
			}, html);
		} else {
			this.multi = parseInt(thus.multi);
			this.multi.loop(function(i) {
				html += (thus.tag ? ('<' + thus.tag + id + classes + styles + attrs + (thus.children.last() ? '>' + thus.children.last().toHtml(obj) + '</' + thus.tag + '>' : simpleTags.exists(thus.tag) ? '/>' : ('></' + thus.tag + '>'))).replace(/([^\\])(?=\$(@\-)?)/g, function(word, prefix, suffix) {
					if (suffix == '@-') {
						return prefix + (thus.multi - i);
					} else {
						return prefix + (i + 1);
					}
				}).replace(/([^\\])\$(@\-)?/g, '$1') : thus.parent && thus.parent.tag == 'pre' ? eval(thus.content || '""') : thus.content || '').replace(/`([^`]+?)`/g, function(word, exp) {
					return (new Function('with(arguments[0]){return (' + exp + ');}')).call(obj, obj);
				});
			});
		}
		return (this.prev ? this.prev.toHtml(obj) : '') + html;
	};

	function zencode(zencoding, obj, high) {

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

		function setType(node, word) {
			node.type = word || node.type;
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
			inContent = 0;
		zencoding.forEach(function(c, i, p, n) {
			var pt = isNull(p) ? nul : isWord(p) ? wrd : isNumber(p) ? num : sym
			if (isWord(c)) {
				word += c;
			} else if (isNumber(c)) {
				word += c;
			} else if (!inEl && !inStr && !inStrDou && symbol.exists(c)) {
				if (inContent) {
					if (c != '}') {
						word += c;
						if (c == '{') {
							inContent++;
						}
						return;
					} else {
						inContent--;
						if (inContent) {
							word += c;
							return;
						}
					}
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
					inContent++;
				} else if (c == '}') {
					status = setTag;
				} else if (c == '^') {
					node = node.parent;
				} else if (c == '[') {
					status = setProperty;
				} else if (c == ']') {
					status = setTag;
				} else if (c == ' ') {
					status = setProperty;
				} else if (c == ':') {
					if (status == setProperty) {
						status = setStyle;
					} else {
						status = setType;
					}
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
				} else if ((inStr || inStrDou) && '`'.exists(c)) {
					c = '\\x' + c.code().toString(16).leftPad(2, '0');
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
		return node.toHtml(obj, high).replace(/\\\$/g, '$$');
	};

	define(Object.prototype, 'toHtml', function(zencoding, high) {
		return zencode(zencoding, this, high);
	});

	define(Array.prototype, 'toHtml', function(zencoding, high) {
		return this.aggregate(function(o, s) {
			return s + zencode(zencoding, o, high);
		}, '');
	});

	define(String.prototype, 'toHtml', function(zencoding, high) {
		if (arguments.length) {
			if (Object.an(zencoding, String, 'string')) {
				return zencode(zencoding, this, high);
			} else {
				return zencode(this, {}, zencoding);
			}
		} else {
			return zencode(this, {}, false);
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

	var tagType = {
		'input': {
			name: 'type',
			values: ['checkbox', 'text', 'password', 'radio', 'button', 'image', 'hidden', 'file', 'submit', 'reset', 'search', 'email', 'url', 'date', 'datetime', 'month', 'week', 'time', 'number', 'color']
		},
		'form': {
			name: 'method',
			values: ['get', 'post']
		}
	}

	var highHtmlTo = [
		/(^|\s)(width|height|margin|padding)\:auto(?=$|\s)/g,
		/(^|\s)(width|height|margin|padding)\:(\d+)(px|%|em)(?=$|\s)/g,
		/(^|\s)(float|text-align)\:(left|right|center)(?=$|\s)/g,
		/(^|\s)(margin|padding)-(right|left|bottom|top)\:(\d+)(px|%|em|rem)(?=$|\s)/g,
		/(^|\s)(display)\:(none|block|inline)(?=$|\s)/g
	];
	var highToZencoding = [
		function(w, sp, p, a) {
			return sp + p.substring(0, 1) + 'a';
		},
		function(w, sp, p, n, u) {
			return sp + p.substring(0, 1) + n + (u == 'rem' ? 'r' : u == 'em' ? 'e' : u == '%' ? 'p' : '');
		},
		function(w, sp, p, v) {
			return sp + p.substring(0, 1) + v.substring(0, 1);
		},
		function(w, sp, p1, p2, n, u) {
			return sp + p1.substring(0, 1) + p2.substring(0, 1) + n + (u == 'rem' ? 'r' : u == 'em' ? 'e' : u == '%' ? 'p' : '');
		},
		function(w, sp, p, v) {
			return sp + p.substring(0, 1) + v.substring(0, 1);
		}
	];
	var highZencodingTo = [
		/(^|\s)(w|h|m|p)a(?=$|\s)/g,
		/(^|\s)(w|h|m|p)(\d+)(e|p|r)?(?=$|\s)/g,
		/(^|\s)(f|t)(l|r|c)(?=$|\s)/g,
		/(^|\s)(m|p)(r|l|b|t)(\d+)(e|p|r)?(?=$|\s)/g,
		/(^|\s)(d)(n|b|i)(?=$|\s)/g
	];
	var highToHtml = [
		function(w, sp, p) {
			return sp + ['width', 'height', 'margin', 'padding'].findFirst(function(e) {
				return e.startsWith(p)
			}) + ':auto';
		},
		function(w, sp, p, n, u) {
			return sp + ['width', 'height', 'margin', 'padding'].findFirst(function(e) {
				return e.startsWith(p)
			}) + ':' + n + (u == 'r' ? 'rem' : u == 'e' ? 'em' : u == 'p' ? '%' : 'px');
		},
		function(w, sp, p, v) {
			return sp + ['float', 'text-align'].findFirst(function(e) {
				return e.startsWith(p)
			}) + ':' + ['right', 'left'].findFirst(function(e) {
				return e.startsWith(v)
			});
		},
		function(w, sp, p1, p2, n, u) {
			return sp + ['margin', 'padding'].findFirst(function(e) {
				return e.startsWith(p1)
			}) + '-' + ['right', 'left', 'bottom', 'top'].findFirst(function(e) {
				return e.startsWith(p2)
			}) + ':' + n + (u == 'r' ? 'rem' : u == 'e' ? 'em' : u == 'p' ? '%' : 'px');
		},
		function(w, sp, p, v) {
			return sp + ['display'].findFirst(function(e) {
				return e.startsWith(p)
			}) + ':' + ['none', 'block', 'inline'].findFirst(function(e) {
				return e.startsWith(v)
			});
		}
	];

	function scriptToLine(script) {
		script = script.replace(/^[\s\t]+|[\s\t]+$/mg, '').replace(/(.)[\r\n](.)/g, function(word, end, start) {
			return !'+-*/;?:<>%.&|={},'.exists(end) && !'+-*/;?:<>%.&|={},'.exists(start) ? end + ';' + start : (end + start);
		});
		script = script.replace(/[\r\n]+/g, ' ').replace(/\$/g, '\\$');
		script = script.replace(/\\x([0-9a-fA-F]{2})/g, function(word, num) {
			return parseInt(num, 16).char();
		});
		return script;
	}

	function toZencoding(xml, high) {
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
				return toZencoding(xml[0], high);
			} else {
				return xml.select(function(e) {
					return toZencoding(e, high);
				}).join('+');
			}
		}
		var tag = xml.tagName.toLowerCase();
		var coding = tag;
		var attrs = toArray(xml.attributes);
		if (high && tagType[tag]) {
			attrs.where("=>name=='" + tagType[tag].name + "'").forEach(function(attr) {
				coding += ':' + attr.value.trim();
			});
		}
		attrs.where("=>name=='id'").forEach(function(attr) {
			if (attr.value.trim()) {
				coding += '#' + attr.value.trim();
			}
		});
		attrs.where("=>name=='class'").forEach(function(attr) {
			coding = attr.value.trim().replace(/\s+/g, ' ').split(' ').trim().aggregate(function(c, s) {
				return s + '.' + c;
			}, coding);
		});
		attrs = attrs.where("=>name!='class'&&name!='id'" + (high && tagType[tag] ? "&&name!='" + tagType[tag].name + "'" : "")).select(function(attr) {
			if (high && attr.name == 'style') {
				return attr.value.trim().replace(/\s+/g, ' ').split(';').select(function(e) {
					if (e) {
						var index = e.indexOf(':');
						if (index == -1) {
							return '';
						} else {
							var name = e.substring(0, index).trim();
							var value = e.substring(index + 1).trim();
							if (value.intersect(' "\'().#').length) {
								return name + ':"' + value.replace(/"/g, '\\x22') + '"';
							} else {
								return name + ':' + value;
							}
						}
					} else {
						return '';
					}
				}).wipe('').join(' ');
			} else {
				attr.name = attr.name.trim();
				attr.value = attr.value.trim();
				if (attr.value.intersect(' "\'().#').length) {
					return attr.name + '="' + attr.value.replace(/"/g, '\\x22') + '"';
				} else {
					if (attr.name == attr.value) {
						if (high && highZencodingTo.exists(function(html, i) {
								attr.name.log();
								if (attr.name == html) {
									return true;
								} else if (html.an(RegExp)) {
									if (attr.name.match(html)) {
										return true;
									}
								}
								return false;
							})) {
							return '-' + attr.name;
						} else {
							return attr.name;
						}
					} else {
						return attr.name + '=' + attr.value;
					}
				}
			}
		})
		attrs = attrs.select(function(value) {
			highHtmlTo.forEach(function(html, i) {
				if (value == html) {
					value = highToZencoding[i];
					return false;
				} else if (html.an(RegExp)) {
					var result = value.replace(html, highToZencoding[i]);
					if (result != value) {
						value = result;
						//return false;
					}
				}
			});
			return value;
		});
		attrs = attrs.join(' ');
		if (attrs) {
			coding += '[' + attrs + ']';
		}
		var children = toArray(xml.childNodes);
		var hasChildren = false;
		if (children.length) {
			coding = children.where(function(c) {
				return c.nodeName != '#comment';
			}).aggregate(function(c, s, i, p) {
				if (c.nodeName == '#text' || c.nodeName == '#cdata-section') {
					if (s.exists('>')) {
						return '(' + s + '){' + (xml.tagName == 'pre' ? c.data.quote() : xml.tagName == 'script' ? scriptToLine(c.data) : c.data.replace(/[\s\t\r\n]+/g, ' ')) + '}';
					} else {
						return s + '{' + (xml.tagName == 'pre' ? c.data.quote() : xml.tagName == 'script' ? scriptToLine(c.data) : c.data.replace(/[\s\t\r\n]+/g, ' ')) + '}';
					}
				} else {
					hasChildren = true;
					if (i == 0 || p.nodeName == '#text') {
						return s + '>' + toZencoding(c, high);
					} else {
						return s + '+' + toZencoding(c, high);
					}
				}
			}, coding);
		}
		return hasChildren ? '(' + coding + ')' : coding;
	}

	function toXmlStr(str) {
		str = str.replace(/(^|<\/script>)((?:.|[\r\n\t])*?)(<script[^>]*?>|$)/g, function(word, start, body, end) {
			return start + body.replace(/[\r\n]\s+(?=[\r\n])|[\r\n]+/g, ' ').replace(/>\s+</g, '><').trim() + end;
		});
		str = str.replace(/(<script[^>]*?>)((?:.|[\r\n\t])*?)(<\/script>)/g, function(word, start, body, end) {
			return start + '<![CDATA[' + body.replace(/^\s*<\!\[CDATA\[((?:.|[\r\n\t])*)\]\]>\s*$/, '$1') + ']]>' + end;
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

	define(String.prototype, 'toZencoding', function(high) {
		//toXmlStr(this).log();
		return toArray(toXml('<root>' + toXmlStr(this) + '</root>').childNodes[0].childNodes).toZencoding(high);
	});

	define(Array.prototype, 'toZencoding', function(high) {
		return toZencoding(this, high);
	});
})();