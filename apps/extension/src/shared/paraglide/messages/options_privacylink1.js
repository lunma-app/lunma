/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Privacylink1Inputs */

const en_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy policy`)
};

const es_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidad`)
};

const pt_pt2_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidade`)
};

const fr_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const de_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutzrichtlinie`)
};

const ja_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`プライバシーポリシー`)
};

const ko_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 처리방침`)
};

const zh_cn2_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`隐私政策`)
};

const ru_options_privacylink1 = /** @type {(inputs: Options_Privacylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Политика конфиденциальности`)
};

/**
* | output |
* | --- |
* | "Privacy policy" |
*
* @param {Options_Privacylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_privacylink1 = /** @type {((inputs?: Options_Privacylink1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Privacylink1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_privacylink1(inputs)
	if (locale === "es") return es_options_privacylink1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_privacylink1(inputs)
	if (locale === "fr") return fr_options_privacylink1(inputs)
	if (locale === "de") return de_options_privacylink1(inputs)
	if (locale === "ja") return ja_options_privacylink1(inputs)
	if (locale === "ko") return ko_options_privacylink1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_privacylink1(inputs)
	return ru_options_privacylink1(inputs)
});
export { options_privacylink1 as "options_privacyLink" }