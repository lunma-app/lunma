/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Authmethodbrowsersession3Inputs */

const en_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browser session`)
};

const es_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesión del navegador`)
};

const pt_pt2_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessão do browser`)
};

const fr_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session navigateur`)
};

const de_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browser-Sitzung`)
};

const ja_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ブラウザセッション`)
};

const ko_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`브라우저 세션`)
};

const zh_cn2_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`浏览器会话`)
};

const ru_options_authmethodbrowsersession3 = /** @type {(inputs: Options_Authmethodbrowsersession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сессия браузера`)
};

/**
* | output |
* | --- |
* | "Browser session" |
*
* @param {Options_Authmethodbrowsersession3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodbrowsersession3 = /** @type {((inputs?: Options_Authmethodbrowsersession3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodbrowsersession3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_authmethodbrowsersession3(inputs)
	if (locale === "es") return es_options_authmethodbrowsersession3(inputs)
	if (locale === "pt-PT") return pt_pt2_options_authmethodbrowsersession3(inputs)
	if (locale === "fr") return fr_options_authmethodbrowsersession3(inputs)
	if (locale === "de") return de_options_authmethodbrowsersession3(inputs)
	if (locale === "ja") return ja_options_authmethodbrowsersession3(inputs)
	if (locale === "ko") return ko_options_authmethodbrowsersession3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_authmethodbrowsersession3(inputs)
	return ru_options_authmethodbrowsersession3(inputs)
});
export { options_authmethodbrowsersession3 as "options_authMethodBrowserSession" }