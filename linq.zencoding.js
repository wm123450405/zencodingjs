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
		this.grouping = grouping || this;
		this.children = [];
		this.classes = [];
		this.attrs = [];
		this.values = [];
		this.styles = [];
		this.multi = 1;
	};

	NodeTree.prototype.toHtml = function() {
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
					return name + '="' + value.replace(/^"(.*)"$/g,'$1').replace(/^'(.*)'$/g,'$1') + '"';
				}
			} else {
				return name;
			}
		}).where(function(e) {
			return !Object.an(e, 'undefined')
		}).join(' ');
		attrs = attrs ? ' ' + attrs : attrs;
		return (this.prev ? this.prev.toHtml() : '') + (this.tag ? ('<' + this.tag + id + classes + styles + attrs + '>' + (this.children.last() ? this.children.last().toHtml() : '') + '</' + this.tag + '>') : this.content || '').repeat(this.multi);
	};

	function zencode(zencoding) {

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

		function setContent(node, word) {
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
			node.multi = isNaN(word) ? node.multi : parseInt(word);
		}

		var nul = 0,
			wrd = 1,
			num = 2,
			sym = 3;
		var word = '';
		var node = new NodeTree(null, null);
		var grouping = node;
		var status = setTag;
		var symbol = '>+(){}^[],|:=.#*';
		var inEl = false,
			inStr = false,
			inStrDou = false;
		zencoding.forEach(function(c, i, p, n) {
			var pt = isNull(p) ? nul : isWord(p) ? wrd : isNumber(p) ? num : sym
			if (isWord(c)) {
				word += c;
			} else if (isNumber(c)) {
				word += c;
			} else if (!inEl && !inStr && !inStrDou && symbol.exists(c)) {
				status(node, word);
				if (c == '>') {
					node = new NodeTree(node, null, grouping);
					status = setTag;
				} else if (c == '+') {
					node = new NodeTree(node.parent, node, grouping);
					status = setTag;
				} else if (c == '(') {
					node.grouping = grouping;
					grouping = node;
				} else if (c == ')') {
					node = node.grouping;
				} else if (c == '{') {
					status = setContent;
				} else if (c == '}') {
					status = setTag;
				} else if (c == '^') {
					node = node.parent;
				} else if (c == '[') {
					status = setProperty;
				} else if (c == ']') {
					status = setTag;
				} else if (c == ',' || c == '|') {
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
		return node.toHtml();
	};

	define(Object.prototype, 'toHtml', function(zencoding) {
		var thus = this;
		return zencode(zencoding).replace(/`([^`]+?)`/g, function(word, exp) {
			return (new Function('with(arguments[0]){return (' + exp + ');}')).call(thus, thus);
		});
	});

	define(Array.prototype, 'toHtml', function(zencoding) {
		var html = zencode(zencoding);
		return this.aggregate(function(o, s) {
			return s + html.replace(/`([^`]+?)`/g, function(word, exp) {
				return (new Function('with(arguments[0]){return (' + exp + ');}')).call(o, o);
			});
		}, '');
	});

	define(String.prototype, 'toHtml', function(zencoding) {
		if (arguments.length) {
			var thus = this;
			return zencode(zencoding).replace(/`([^`]+?)`/g, function(word, exp) {
				return (new Function('with(arguments[0]){return (' + exp + ');}')).call(thus, thus);
			});
		} else {
			return zencode(this);
		}
	});
})();