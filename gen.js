const SS_PREFIX = "ss://";
const SSR_PREFIX = "ssr://";

// scheme references
// ss: https://shadowsocks.org/doc/configs.html
// ssr: https://github.com/shadowsocksr-backup/shadowsocks-rss/wiki/SSR-QRcode-scheme

class Config {
	constructor(server, serverPort, password, method, obfs = "plain", protocol = "origin", group = "default", remarks = null, obfsparam = null, protoparam = null, localPort = 1080, stimeout = 600) {
		this.server = server;
		this.serverPort = serverPort;
		this.localPort = localPort;
		this.password = password;
		this.stimeout = stimeout;
		this.method = method;
		this.group = group;
		this.remarks = remarks;
		this.obfs = obfs;
		this.obfsparam = obfsparam;
		this.protoparam = protoparam;
		this.protocol = protocol;
	}
}

function genSSConfig(config) {
	const configText = `${config.method}:${config.password}@${config.server}:${config.serverPort}`;
	const cipher = base64(configText);
	return `${SS_PREFIX}${cipher}#${config.remarks}`;
}

function isNullOrEmpty(text) {
	return text === "" || text == null;
}

function genSSRConfig(config) {
	if (config.password == null) {
		// invalid config
		return null;
	}

	const base64pass = base64(config.password);

	let configText = `${config.server}:${config.serverPort}:${config.protocol}:${config.method}:${config.obfs}:${base64pass}/?`;
	let flag = false;

	// check obfs param
	if (!isNullOrEmpty(config.obfsparam)) {
		configText += `obfsparam=${base64(config.obfsparam)}`;
		flag = true;
	}

	// check protocol param
	if (!isNullOrEmpty(config.protoparam)) {
		if (flag) {
			configText += "&";
		}
		configText += `protoparam=${base64(config.protoparam)}`;
		flag = true;
	}

	// check group
	if (!isNullOrEmpty(config.group)) {
		if (flag) {
			configText += "&";
		}
		configText += `group=${base64(config.group)}`;
		flag = true;
	}

	// check remarks
	if (!isNullOrEmpty(config.remarks)) {
		if (flag) {
			configText += "&";
		}
		configText += `remarks=${base64(config.remarks)}`;
		// flag = true;
	}

	const cipher = base64(configText);
	return `${SSR_PREFIX}${cipher}`;
}

function base64(text) {
	return removePadding(Base64.encode(text));
}

function removePadding(text) {
	if (text.endsWith("==")) {
		return text.slice(0, -2);
	}
	if (text.endsWith("=")) {
		return text.slice(0, -1);
	}
	return text;
}

/**
 * localStorage helper class
 * */
class LSHelper {
	static set(key, value) {
		if (isNullOrEmpty(key)) {
			return;
		}

		localStorage.setItem(key, JSON.stringify(value));
	}

	static get(key) {
		let value = localStorage.getItem(key);
		if (value) {
			value = JSON.parse(value);
		}

		return value;
	}
}

function parseConfig(configString) {
	configString = configString.trim();
	if (configString.startsWith(SS_PREFIX)) {
		return parseSSConfig(configString);
	} else if (configString.startsWith(SSR_PREFIX)) {
		return parseSSRConfig(configString);
	} else {
		throw new Error(`Unknown config - the config string needs to starts with ${SS_PREFIX} or ${SSR_PREFIX}`);
	}
}

function parseSSRConfig(configString) {
	if (!configString.startsWith(SSR_PREFIX)) {
		throw new Error("Invalid config string format");
	}

	const encodedConfig = configString.substring(SSR_PREFIX.length);
	const decodedConfigText = atob(encodedConfig); // Assuming you have the base64 decoding function

	const [serverAndParams, base64pass] = decodedConfigText.split("/?");
	const [server, serverPort, protocol, method, obfs, encodedPassword] = serverAndParams.split(":");

	const queryParams = base64pass.split("&").reduce((params, param) => {
		const [key, value] = param.split("=");
		params[key] = atob(value);
		return params;
	}, {});

	const obfsparam = queryParams["obfsparam"];
	const protoparam = queryParams["protoparam"];
	const group = queryParams["group"];
	const remarks = queryParams["remarks"];
	const password = atob(encodedPassword);

	const localPort = undefined;
	const stimeout = undefined;

	return new Config(server, serverPort, password, method, obfs, protocol, group, remarks, obfsparam, protoparam, localPort, stimeout);
}

function parseSSConfig(configString) {
	if (!configString.startsWith(SS_PREFIX)) {
		throw new Error("Invalid config string format");
	}

	const encodedConfig = configString.substring(SS_PREFIX.length).split("#")[0];
	const decodedConfigText = atob(encodedConfig); // Assuming you have the base64 decoding function

	const [methodAndPassword, serverAndPort] = decodedConfigText.split("@");
	const [method, password] = methodAndPassword.split(":");
	const [server, serverPort] = serverAndPort.split(":");

	const remarks = configString.split("#")[1]; // Assuming the remarks are separated by '#' character

	const obfs = undefined;
	const protocol = undefined;
	const group = undefined;
	const obfsparam = undefined;
	const protoparam = undefined;
	const localPort = undefined;
	const stimeout = undefined;

	return new Config(server, serverPort, password, method, obfs, protocol, group, remarks, obfsparam, protoparam, localPort, stimeout);
}
