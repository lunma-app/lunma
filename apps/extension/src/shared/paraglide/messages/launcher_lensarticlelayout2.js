/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensarticlelayout2Inputs */

const en_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Article layout`)
};

const es_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista de artículos`)
};

const pt_pt2_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disposição de artigos`)
};

const fr_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disposition des articles`)
};

const de_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Artikelansicht`)
};

const ja_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`記事レイアウト`)
};

const ko_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기사 레이아웃`)
};

const zh_cn2_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`文章布局`)
};

const ru_launcher_lensarticlelayout2 = /** @type {(inputs: Launcher_Lensarticlelayout2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вид статей`)
};

/**
* | output |
* | --- |
* | "Article layout" |
*
* @param {Launcher_Lensarticlelayout2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensarticlelayout2 = /** @type {((inputs?: Launcher_Lensarticlelayout2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensarticlelayout2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensarticlelayout2(inputs)
	if (locale === "es") return es_launcher_lensarticlelayout2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensarticlelayout2(inputs)
	if (locale === "fr") return fr_launcher_lensarticlelayout2(inputs)
	if (locale === "de") return de_launcher_lensarticlelayout2(inputs)
	if (locale === "ja") return ja_launcher_lensarticlelayout2(inputs)
	if (locale === "ko") return ko_launcher_lensarticlelayout2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensarticlelayout2(inputs)
	return ru_launcher_lensarticlelayout2(inputs)
});
export { launcher_lensarticlelayout2 as "launcher_lensArticleLayout" }