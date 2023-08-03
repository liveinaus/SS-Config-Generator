const DEFAULT_QR_SIZE = 400;
const DEFAULT_QR_BORDER = 4;
const DEFAULT_GROUP = "default";
const DEFAULT_LOCAL_PORT = 1080;
const DEFAULT_TIMEOUT = 600;
const DEFAULT_METHOD = METHODS[0];
const DEFAULT_PROTOCOL = PROTOCOLS[0];
const DEFAULT_OBFS = OBFSES[0];

// nodes
const ssrOnly = jQuery(".ssr-only");

// add options to select
// both the values and the texts will the options
function addOptions(node, options) {
	options.forEach((option) => node.append(jQuery("<option></option>").attr("value", option).text(option)));
}

jQuery(function () {
	// add method options
	addOptions(jQuery("#method"), METHODS);
	addOptions(jQuery("#protocol"), PROTOCOLS);
	addOptions(jQuery("#obfs"), OBFSES);

	// set ss type button actions
	jQuery("input[name='ssType']").change(function () {
		let ssrChecked = jQuery("#ssr:checked").val();
		ssrChecked = ssrChecked === "on";
		ssrChecked ? ssrOnly.show() : ssrOnly.hide();

		// preserve status
		LSHelper.set("ssrChecked", ssrChecked);
	});

	// for testing purpose remove later
	jQuery("#testBtn").click(function () {
		jQuery("#server").val("127.0.0.1");
		jQuery("#serverPort").val(1234);
		jQuery("#password").val("test123");
		jQuery("#method").val("aes-256-cfb");
		jQuery("#localPort").val(DEFAULT_LOCAL_PORT);
		jQuery("#stimeout").val(DEFAULT_TIMEOUT);
		jQuery("#protocol").val("origin");
		jQuery("#protoparam").val(null);
		jQuery("#obfs").val("plain");
		jQuery("#obfsparam").val(null);
		jQuery("#group").val("default");
		jQuery("#remarks").val("test-ac");
	});

	// restore all fields to default
	jQuery("#clearBtn").on("click", clearConfig);

	jQuery("#generateBtn").on("click", generateConfig);

	jQuery("#copyUrlBtn").on("click", copyUrl);

	jQuery("#copyQrCodeBtn").on("click", copyQrCode);

	// restore previous settings and status

	// restore ss type status
	// check localStorage first, if no item is found, check current status
	let ssrChecked = LSHelper.get("ssrChecked");
	if (ssrChecked == null) {
		ssrChecked = jQuery("#ssr:checked").val();
	} else {
		jQuery("#ssr").prop("checked", ssrChecked);
	}

	// render
	ssrChecked ? ssrOnly.show() : ssrOnly.hide();

	// restore qrcode size & border
	const size = LSHelper.get("size");
	const border = LSHelper.get("border");
	if (size != null) {
		jQuery("#size").val(size);
	}

	if (border != null) {
		jQuery("#border").val(border);
	}

	// restore config
	const config = LSHelper.get("config");
	if (config != null) {
		jQuery("#server").val(config.server);
		jQuery("#serverPort").val(config.serverPort);
		jQuery("#password").val(config.password);
		jQuery("#method").val(config.method);
		jQuery("#localPort").val(config.localPort);
		jQuery("#stimeout").val(config.stimeout);
		jQuery("#protocol").val(config.protocol);
		jQuery("#protoparam").val(config.protoparam);
		jQuery("#obfs").val(config.obfs);
		jQuery("#obfsparam").val(config.obfsparam);
		jQuery("#group").val(config.group);
		jQuery("#remarks").val(config.remarks);
	}
});

function clearConfig() {
	jQuery("#server").val("");
	jQuery("#serverPort").val("");
	jQuery("#password").val("");
	jQuery("#method").val(DEFAULT_METHOD);
	jQuery("#localPort").val(DEFAULT_LOCAL_PORT);
	jQuery("#stimeout").val(DEFAULT_TIMEOUT);
	jQuery("#protocol").val(DEFAULT_PROTOCOL);
	jQuery("#protoparam").val("");
	jQuery("#obfs").val(DEFAULT_OBFS);
	jQuery("#obfsparam").val("");
	jQuery("#group").val(DEFAULT_GROUP);
	jQuery("#remarks").val("");
	jQuery("#url").val("");
	jQuery("#size").val(DEFAULT_QR_SIZE);
	jQuery("#border").val(DEFAULT_QR_BORDER);
	jQuery("#qrcode").html("");

	jQuery(".result-wrapper").toggle(false);
}

function generateConfig() {
	// retrieve values
	let server = jQuery("#server").val();
	let serverPort = jQuery("#serverPort").val();
	let password = jQuery("#password").val();
	let method = jQuery("#method").val();
	let localPort = jQuery("#localPort").val();
	let stimeout = jQuery("#stimeout").val();
	let protocol = jQuery("#protocol").val();
	let protoparam = jQuery("#protoparam").val();
	let obfs = jQuery("#obfs").val();
	let obfsparam = jQuery("#obfsparam").val();
	let group = jQuery("#group").val();
	let remarks = jQuery("#remarks").val();
	let size = jQuery("#size").val();
	let border = jQuery("#border").val();

	// validate size & border, default size as the fallback value
	if (isNullOrEmpty(size) || isNaN(size)) {
		// not a number
		size = DEFAULT_QR_SIZE;
	}

	if (isNullOrEmpty(border) || isNaN(border)) {
		// not a number
		border = DEFAULT_QR_BORDER;
	}

	// construct new config
	const config = new Config(server, serverPort, password, method, obfs, protocol, group, remarks, obfsparam, protoparam, localPort, stimeout);
	let result = "";
	if (jQuery("#ss:checked").val()) {
		result = genSSConfig(config);
	}

	if (jQuery("#ssr:checked").val()) {
		result = genSSRConfig(config);
	}

	// display encoded URL
	jQuery("#url").val(result);

	// clear previous code
	jQuery("#qrcode").html("");

	// build qrcode and display as an image
	const qrcode = new QRCode("qrcode", {
		text: result,
		width: size,
		height: size,
		border: border,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H,
	});

	LSHelper.set("config", config);
	LSHelper.set("size", size);
	LSHelper.set("border", border);

	jQuery(".result-wrapper").toggle(true);

	const parsedConfig = parseConfig(jQuery("#url").val());

	console.log("ori vs parsed config:", config, parsedConfig);
}

function copyUrl() {
	navigator.clipboard.writeText(jQuery("#url").val()).then(
		function () {
			alert("It worked! Do a CTRL - V to paste");
		},
		function () {
			alert("Failure to copy. Check permissions for clipboard");
		}
	);
}

async function copyQrCode() {
	const imageUrl = jQuery("#qrcode").find("img").attr("src");
	try {
		// Fetch the image as a blob
		const response = await fetch(imageUrl);
		const blob = await response.blob();

		// Copy the blob to the clipboard
		await navigator.clipboard.write([
			new ClipboardItem({
				[blob.type]: blob,
			}),
		]);

		alert("Image copied to clipboard!");
	} catch (error) {
		console.error("Error copying image to clipboard:", error);
	}
}
