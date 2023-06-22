function cutEndIf(str, fun) {
	let l = str.length;
	while (l-- && !fun(str[l]));
	str = str.substr(0, l + 1);

	return str;
}

export function parse(_input) {
	let tokens = [];
	let input = _input.trim();
	let ctx = {
		esc: false,		// is escape coding?
		qchar: null,	// quote character
		inquo: false,	// in a quote?
		inwhs: false,	// in a separator?
		eword: "",		// escape phrase
		word: "",		// current word
	};

	let slen = input.length;
	for (let i = 0; i < slen; i++) {
		let cc = input[i];

		if (ctx.esc) {
			let doBreak = 1;
			let setEw = 1;

			if (ctx.inquo) {
				switch (cc) {
					case "\"": case "\'": case "\\": case "\t":
					case "?":
						ctx.word += cc; break;
					case "t": ctx.word += "\t"; break;
					case "n": ctx.word += "\n"; break;
					case "r": ctx.word += "\r"; break;
					case "a": ctx.word += "\x07"; break;
					case "b": ctx.word += "\x08"; break;
					case "e": ctx.word += "\x1b"; break;
					case "f": ctx.word += "\x0c"; break;
						// a, b, e, f, n, r, t, v, n, x, u, U
					case "x": {
						ctx.eword += "x";

						// grab characters
						let n_c = input.substr(++i, 2);
						n_c = cutEndIf(n_c, c => /[0-9A-F]/i.test(c));
						if (!(/^[0-9A-F]{1,2}$/i.test(n_c))) n_c = "";
						i += n_c.length - 1;
						switch (n_c.length) {
							case 0:
								ctx.word += ctx.eword;
								break;
							case 1: case 2:
								ctx.word += String.fromCharCode(parseInt(n_c, 16));
								break;
						}
					}; break;
					default: ctx.eword += cc; ctx.word += ctx.eword; break;
				}
			} else {
				ctx.word += cc;
			}

			ctx.esc = false;
			if (setEw) ctx.eword = "";
			if (doBreak) continue;
		}

		if (cc == "\\") {
			if (ctx.inquo) {
				ctx.eword = "\\";
				ctx.esc = true;
			}
			continue;
		}

		if (!ctx.inquo && (cc == " " || cc == "\t" || cc == "\n")) {
			if (!ctx.inwhs) {
				tokens.push(ctx.word);
				ctx.inwhs = true;
				ctx.word = "";
			}
			continue;
		}

		ctx.inwhs = false;

		if (cc == "\"" || cc == "\'") {
			if (ctx.qchar == null) {
				ctx.inquo = true;
				ctx.qchar = cc;
			} else if (cc == ctx.qchar) {
				ctx.inquo = false;
				ctx.qchar = null;
			} else {
				ctx.word += cc;
			}
			continue;
		}

		ctx.word += cc;
	}

	if (ctx.inquo) ctx.word = ctx.qchar + ctx.word;
	if (ctx.eword.length > 0) ctx.word += ctx.eword;
	if (ctx.word.length > 0) tokens.push(ctx.word);

	return tokens;
}

export function optandargs(args, expect = {}, prefix = "-") {
	let result = { args: [], options: [] };
	// ( ["clang", "-o", "file.out", "-v", "in.c", "-I", "includes"], 
	//	 {"-o": 1, "-v": 0}
	// )
	/*
		{
			args: [
				"clang",	
				"in.c"
			]
			options: [
				["-o", "file.out"],
				["-v"],
				["-I", "includes"]
			]
		}
	*/

	let optc = 0;
	let copt = [];
	for (let i = 0; i < args.length; i++) {
		let arg = args[i];
		if (!optc) {
			if (copt.length) {
				result.options.push(copt);
				copt = [];
			}
			if (arg.startsWith(prefix)) {
				if (expect[arg] !== undefined) optc = expect[arg];
				else optc = 1;
				copt.push(arg);
			} else {
				result.args.push(arg);
			}
		} else {
			copt.push(arg);
			optc--;
		}
	}

	if (copt.length) {
		result.options.push(copt);
		copt = [];
	}

	return result;
}

