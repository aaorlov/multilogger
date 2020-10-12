enum COLORS {
	black,
	red,
	green,
	yellow,
	blue,
	magenta,
	cyan,
	white
}
enum ANSI {
	b = 1, // bold (increased intensity)
	f, // faint (decreased intensity)
	i, // italic
	u, // underline
	l, // blink slow
	h, // blink rapid
	n, // negative
	c, // conceal
	s, // strikethrough
}

const esc = (s: string): string => '\x1b[' + s + '\x1b[0m';

const stylize = (styleString: string, val: string): string => {
	const styles: string[] = styleString.split(',');
	
  for (const style of styles) {
    if (style.length === 1) {
			const code = ANSI[style];
			if(code) {
				val = esc(code + 'm' + val);
			}
    } else {
      const colors = style.split('/');
      const textColor = COLORS[colors[0]];
      const bgColor = COLORS[colors[1]];
      if (typeof textColor !== 'undefined') {
        val = esc('3' + textColor + 'm' + val);
      }
      if (typeof bgColor !== 'undefined') {
        val = esc('4' + bgColor + 'm' + val);
      }
    }
  }
  return val;
};

const tag = styles => (strings, ...values) => {
  if (typeof strings === 'string') {
    return stylize(styles, strings);
	}
	
  const result = [strings[0]];
  let i = 1;
  for (const val of values) {
    const str = strings[i++];
    result.push(val, str);
  }
  return stylize(styles, result.join(''));
};

const theme = tags => {
  const styles = (strings, ...values) => {
    const result = [strings[0]];
    let i = 1;
    for (const val of values) {
			const str = strings[i++];
			const styled = Object.entries(val).map(([k, v]) => styles[k](v));
      result.push(...styled, str);
    }
    return result.join('');
  };

  for (const name in tags) {
    styles[name] = tag(tags[name]);
  }
  return styles;
};

const stylizer = (strings, ...values) => {
  if (typeof strings === 'string') {
    return tag(strings);
  }

	if (!Array.isArray(strings)) {
		return theme(strings);
	}

  const result = [strings[0]];
  let i = 1;
  for (const val of values) {
    const str = strings[i++];
    if (str.startsWith('(')) {
      const pos = str.indexOf(')');
      const styles = str.substring(1, pos);
      const value = stylize(styles, val);
      const rest = str.substring(pos + 1);
      result.push(value, rest);
    }
  }

  return result.join('');
};

stylizer.b = stylizer('b');
stylizer.i = stylizer('i');
stylizer.u = stylizer('u');

stylizer.error = stylizer('b,red');
stylizer.info = stylizer('b,green');
stylizer.warn = stylizer('b,yellow');
stylizer.debug = stylizer('b,blue');

stylizer.red = stylizer('red');
stylizer.green = stylizer('green');
stylizer.yellow = stylizer('yellow');
stylizer.blue = stylizer('blue');
stylizer.magenta = stylizer('magenta');
stylizer.cyan = stylizer('cyan');
stylizer.white = stylizer('white');

export default stylizer;